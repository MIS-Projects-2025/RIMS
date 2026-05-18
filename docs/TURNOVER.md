# RIMS — Turnover & Onboarding Documentation

**Project**: Request and Inventory Management System (RIMS)
**Framework**: Laravel 12 + Inertia.js (React)
**Last Updated**: May 2026

> This document is for incoming developers taking ownership of RIMS. It covers environment setup, system access, how the system works day-to-day, and gotchas discovered during development.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started (Local Setup)](#2-getting-started-local-setup)
3. [System Access & Credentials](#3-system-access--credentials)
4. [Codebase Orientation](#4-codebase-orientation)
5. [User Roles & Who Does What](#5-user-roles--who-does-what)
6. [Key Business Flows (How Things Work)](#6-key-business-flows-how-things-work)
7. [External Dependencies](#7-external-dependencies)
8. [Common Development Tasks](#8-common-development-tasks)
9. [Known Gotchas & Quirks](#9-known-gotchas--quirks)
10. [Deployment](#10-deployment)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Project Overview

RIMS is an internal web application used by company employees to:

- **Submit requests** for hardware, software, or IT support items
- **Approve or disapprove** those requests (Department Heads and Operation Directors)
- **Issue** approved items to recipients (MIS Support team)
- **Track inventory** of hardware, software, and parts via an integrated external API
- **Manage issuances** — assigning physical items to employees

The system integrates with multiple internal databases and an external Inventory API, all behind a company SSO system (Authify).

---

## 2. Getting Started (Local Setup)

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+ / npm
- SQLite (bundled with PHP)
- Access to internal MySQL databases (see [System Access](#3-system-access--credentials))

### Installation Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd rims

# 2. Install PHP dependencies
composer install

# 3. Install JS dependencies
npm install

# 4. Copy environment file
cp .env.example .env

# 5. Generate app key
php artisan key:generate

# 6. Create SQLite database
touch database/database.sqlite

# 7. Run migrations (creates requests, request_items, etc.)
php artisan migrate

# 8. Start development server (runs Laravel + Vite concurrently)
composer run dev
```

### Environment File

Fill in all database credentials in `.env`. See [ARCHITECTURE.md — Environment Configuration](./ARCHITECTURE.md#15-environment-configuration) for the full list of required variables.

The four critical MySQL connections are:

- `MDB_*` — Masterlist (employee directory)
- `ADB_*` — Authify (SSO sessions)
- `QA_*` — QA (location reference data)
- `INV_*` — Inventory DB (if applicable — most inventory data goes through the API)

---

## 3. System Access & Credentials

| System              | What it is                                    | Who to contact       |
| ------------------- | --------------------------------------------- | -------------------- |
| **SSO / Authify**   | Authentication server at `192.168.2.221:8200` | MIS Team             |
| **Masterlist DB**   | MySQL DB with employee directory              | DBA / MIS Team       |
| **Authify DB**      | MySQL DB for active sessions                  | MIS Team             |
| **QA DB**           | MySQL DB with location list                   | DBA / MIS Team       |
| **Inventory API**   | External REST API for hardware/software       | MIS / Inventory Team |
| **RIMS App Server** | Where RIMS is deployed                        | MIS Team             |

> All database credentials and API tokens should be in the `.env` file on the server. Never commit these to version control.

---

## 4. Codebase Orientation

### Where Things Live

```
First place to look for business rules:
  app/Services/          ← All business logic

Where data is fetched:
  app/Repositories/      ← All DB queries

How HTTP requests come in:
  routes/                ← URL → controller mapping
  app/Http/Controllers/  ← Request/response handling

Who can access what:
  app/Http/Middleware/   ← Auth, admin, requestor gates

Frontend pages:
  resources/js/Pages/    ← One file per screen

Frontend reusable logic:
  resources/js/Hooks/    ← API calls, state management
```

### Architecture Pattern

```
Route → Middleware → Controller → Service → Repository → DB
                                     ↕
                              External API (Inventory)
```

Controllers should stay thin. If you find yourself adding business logic to a controller, put it in the relevant Service instead.

### Key Files to Know

| File                                     | Why it matters                                |
| ---------------------------------------- | --------------------------------------------- |
| `app/Services/RequestService.php`        | The heart of the request workflow (747 lines) |
| `app/Http/Middleware/AuthMiddleware.php` | How SSO auth works                            |
| `app/Constants/Status.php`               | All request status codes                      |
| `app/Constants/ItemStatus.php`           | All item status codes                         |
| `app/Traits/Loggable.php`                | Auto-audit trail on models                    |
| `routes/request.php`                     | All request-related routes                    |
| `resources/js/Pages/Form.jsx`            | Request creation form (cart system)           |
| `resources/js/Hooks/useRequestCart.js`   | Cart state logic                              |

---

## 5. User Roles & Who Does What

There are five roles in RIMS. A person can hold multiple roles at once.

### Requestor

**Who**: Any employee with `EMPPOSITION >= 2` and `can_request = true`
**Can do**:

- Submit new requests (via `/app/request`)
- View their own submitted requests
- Acknowledge received issuances

### Department Head

**Who**: Employees listed as `APPROVER2` or `APPROVER3` in the masterlist
**Can do**: Everything a Requestor can, plus:

- View requests from their direct staff
- Approve or Disapprove requests from their department

### Operation Director

**Who**: Employees with `EMPPOSITION = 5` or job title matching `'Operation%Director%'`
**Can do**: Everything a Department Head can, plus:

- View ALL requests in the system (not limited to their department)

### MIS Support

**Who**: Employees with job title matching `'MIS Support%'`, `'Network Technician%'`, or `'Network%'`
**Can do**: Everything a Requestor can, plus:

- View ALL requests in the system
- Issue approved request items
- Create issuances in the inventory system

### Admin

**Who**: Employees added to the `admin` table via `/app/admin`
**Can do**:

- Manage the list of Admins (add/remove/change role)
- Manage the Request Type catalog (add/edit/delete)

> Note: Admin is a separate concept from MIS Support. A person can be both. Admin controls system configuration; MIS Support controls the issuance workflow.

---

## 6. Key Business Flows (How Things Work)

### 6.1 Submitting a Request

1. Requestor navigates to **New Request** (`/app/request`)
2. Selects items from the **Request Type catalog** (grouped by category)
3. For each item, chooses:
    - **Mode**: Per-Item (individual recipients) or Bulk (single quantity)
    - **Issued To**: Employee name(s)
    - **Location**: Physical location
    - **Purpose**: Reason for request
4. Items are added to the **cart** (`useRequestCart.js`)
5. On submit → `POST /app/store` → `RequestService::submitRequest()`
6. A `Request` record is created with `status = NEW (1)`
7. Each cart item becomes one or more `RequestItem` records with `item_status = PENDING (1)`
8. Request number is generated: `REQ-YYYY-NNNN`

### 6.2 Approving / Disapproving a Request

1. Department Head or Operation Director views the **Request Table**
2. Filters show only relevant requests (their dept / all — based on role)
3. Opens a request detail → sees **Approve** or **Disapprove** buttons
4. On action → `POST /app/request/action` → `RequestService::requestAction()`
5. Status changes:
    - NEW → TRIAGED (first approval step)
    - TRIAGED → APPROVED (final approval)
    - → DISAPPROVED (at any point)

### 6.3 Issuing Items

1. MIS Support views **Request Table**, filters by `APPROVED` status
2. Opens request detail → sees **Issue Items** button
3. For each item, initiates issuance via the inventory system
4. `POST /app/issuance/create` or `/app/issuance/items/create`
5. `IssuanceService` sends request to external **Inventory API**
6. `RequestService::updateRequestItemStatus(item, ISSUED)` is called
7. Once all items are ISSUED → Request auto-updates to `ISSUED (4)`

### 6.4 Acknowledging a Issuance

1. Requestor or recipient receives physical item
2. Opens issuance in `/app/issuance` table
3. Clicks **Acknowledge** → `PUT /app/issuance/acknowledge/{id}`
4. Request moves to `ACKNOWLEDGED (5)` — terminal state

### 6.5 Managing Request Types (Admin)

1. Admin navigates to `/app/requestType`
2. Can create/edit/delete entries in the catalog
3. Each type has: `category`, `name`, `description`, `is_active` flag
4. Active types appear in the request form dropdown
5. The `Support Services` category is excluded from the request form

---

## 7. External Dependencies

### SSO — Authify (`192.168.2.221:8200`)

- All authentication is delegated to this server
- RIMS does **not** have its own login form
- Users are redirected to the SSO server if unauthenticated
- After SSO login, a token is passed back to RIMS via query param or cookie
- `AuthMiddleware` validates this token against the `authify_sessions` table
- SSO cookie is valid for **7 days**

### External Inventory API

- Hardware, software, parts, and issuance data live here
- RIMS calls this API via `InventoryService` and `IssuanceService`
- Uses **Bearer token** authentication (configured in `.env` as `INVENTORY_API_TOKEN`)
- If the API is down, inventory and issuance features will fail — requests still work

### Masterlist Database

- Source of truth for all employee data
- RIMS reads from it but **never writes to it**
- Used to: resolve employee names, determine roles (via `APPROVER` columns and `EMPPOSITION`), build staff lists, validate requestors

---

## 8. Common Development Tasks

### Adding a New Request Type Category

1. Go to `/app/requestType` as an Admin
2. Create new entries with the desired `request_category` value
3. They will automatically appear in the grouped request form

### Adding a New Page

1. Create `resources/js/Pages/YourPage.jsx`
2. Add a route in the appropriate `routes/*.php` file
3. Add a controller method that returns `Inertia::render('YourPage', [...])`

### Adding a New API Endpoint

1. Add route to the relevant `routes/*.php` file
2. Add controller method (thin — delegates to service)
3. Add service method (business logic)
4. Add repository method if DB queries are involved

### Changing Request Status Logic

- Status constants are in `app/Constants/Status.php`
- Transition logic is in `RequestService::requestAction()` and `updateRequestStatusBasedOnItems()`
- Do **not** hardcode status numbers in controllers or views — always use `Status::APPROVED` etc.

### Adding Role-Based Visibility

- Role determination: `UserRoleService::getRole($userId)` or `UserRepository`
- Filter logic: `RequestService::applyRoleFilters($query, $empData)`
- Frontend role: available via `emp_data.emp_user_roles` in Inertia shared data

### Running Tests

```bash
composer test
# or
./vendor/bin/pest
```

### Building for Production

```bash
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 9. Known Gotchas & Quirks

### Filter Encoding

All table API endpoints accept filters as base64-encoded JSON in a query parameter `f`.

```
GET /app/request/table?f=<base64(JSON.stringify({ status: 3, search: "laptop" }))>
```

This is handled by `useApiTableConfig.js` and `useRequestTable.js` on the frontend. If you're testing endpoints directly (e.g., with Postman), you need to base64-encode your filter object manually.

### No Standard Laravel Auth

RIMS does **not** use Laravel's built-in `Auth::user()` in the traditional sense. Authentication is entirely SSO-based via `AuthMiddleware`. The user session data lives in `session('emp_data')`. Middleware sets this up; controllers read from it.

### Multi-Database Gotcha

When writing queries that span models from different connections (e.g., joining a `requests` query with masterlist data), you **cannot** use a single Eloquent join. You must:

1. Query each database separately
2. Merge results in PHP
   This is why some fields like `requestor_name` and `requestor_department` are denormalized onto the `requests` table.

### Request Number Generation

`RequestRepository::generateRequestNumber()` uses a database transaction with row-level locking to prevent duplicate request numbers under concurrent load. Do not bypass this with a simple `MAX() + 1` query.

### RequestType — Manual Timestamps

`RequestType` model does **not** use Laravel's automatic `timestamps`. The `created_at` and `updated_at` fields are managed manually. If you forget to pass these when inserting, they will be null.

### `Support Services` Category Hidden

The `getAllGrouped()` method in `RequestTypeRepository` explicitly excludes the `Support Services` category from the request form. This is intentional — it's an internal category.

### Loggable Trait Requires Session

The `Loggable` trait reads `session('emp_data.emp_id')` to set `action_by`. If records are modified outside of a request context (e.g., artisan commands, seeders), the `action_by` field will be null. Handle this case if you add batch operations.

### Role Overlap

A user can be both a Department Head and a MIS Support employee. `getRoleForUser()` returns the **first matching** role in priority order. If behavior differs per role combination, review this method carefully.

---

## 10. Deployment

### Server Requirements

- PHP 8.2+ with extensions: `pdo_sqlite`, `pdo_mysql`, `mbstring`, `openssl`, `curl`
- Nginx or Apache
- Node.js (only needed for build — not runtime)
- Composer

### Deployment Steps

```bash
# Pull latest code
git pull origin main

# Install/update PHP dependencies
composer install --no-dev --optimize-autoloader

# Build frontend assets
npm install
npm run build

# Clear and rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run any new migrations
php artisan migrate --force

# Ensure storage is writable
chmod -R 775 storage bootstrap/cache
```

### File Permissions

```bash
chown -R www-data:www-data storage bootstrap/cache
```

### Environment on Server

The `.env` file on the server must have all database credentials and the `INVENTORY_API_TOKEN`. Do not overwrite it during deployment — it is not tracked in git.

---

## 11. Troubleshooting

### "Redirected to SSO login unexpectedly"

- Check that `ADB_*` environment variables point to the correct Authify database
- Check that the SSO server at `192.168.2.221:8200` is reachable
- Check the `authify_sessions` table for valid tokens

### "403 Unauthorized on admin routes"

- The user's `emp_id` must exist in the `admin` table
- Use `/app/admin` (as an existing admin) to add new admins
- Check `AdminMiddleware.php` for the exact query

### "Can't submit a request — no request form visible"

- The user must have `can_request = true` in their session
- This comes from `UserRepository::getCanRequest()` checking `EMPPOSITION >= 2`
- Verify the employee's `EMPPOSITION` in the masterlist database

### "Request types not showing in form"

- Request types must have `is_active = true`
- `Support Services` category is excluded — use a different category
- Check `RequestTypeRepository::getAllGrouped()`

### "Inventory API returning errors"

- Verify `INVENTORY_API_URL` and `INVENTORY_API_TOKEN` in `.env`
- Check network connectivity to the inventory server
- `InventoryService` and `IssuanceService` will throw exceptions if the API is unreachable — wrap calls in try/catch if graceful degradation is needed

### "Migrations failing"

- SQLite file must exist before migrating: `touch database/database.sqlite`
- Check `DB_DATABASE` path is absolute and writable

### "Request number not generating"

- Check the SQLite database connection is working
- `RequestRepository::generateRequestNumber()` uses a transaction — if it times out, check for long-running locks

---

_Last Updated: May 2026_
