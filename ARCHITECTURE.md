# RIMS Architecture Documentation

## Overview

**Project**: Request and Inventory Management System (RIMS)  
**Framework**: Laravel 12 + Inertia.js (React)  
**Purpose**: Manage employee requests, inventory tracking, and issuance workflows

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 12 (PHP 8.2+) |
| Frontend | Inertia.js + React + Tailwind CSS |
| Database | SQLite (default), MySQL (multiple connections) |
| Authentication | Laravel Sanctum |
| Testing | Pest PHP |

---

## Database Architecture

### Multi-Database Setup

The application uses **multiple database connections**:

| Connection | Purpose | Environment Variables |
|------------|---------|------------------------|
| `sqlite` | Default Laravel DB | `DB_CONNECTION`, `DB_DATABASE` |
| `qa` | QA environment | `QA_HOST`, `QA_PORT`, `QA_DATABASE` |
| `inventory` | Hardware/Software inventory | `INV_HOST`, `INV_PORT`, `INV_DATABASE` |
| `masterlist` | Employee masterlist | `MDB_HOST`, `MDB_PORT`, `MDB_DATABASE` |
| `authify` | Authentication | `ADB_HOST`, `ADB_PORT`, `ADB_DATABASE` |

### Core Models

| Model | Table | Connection | Description |
|-------|-------|------------|-------------|
| `User` | `employee_masterlist` | `masterlist` | Authenticated employees |
| `Masterlist` | `employee_masterlist` | `masterlist` | Employee records |
| `Request` | `requests` | default | User requests |
| `RequestItem` | `request_items` | default | Items in requests |
| `RequestType` | `request_types` | default | Request categories |
| `RequestLogs` | `request_logs` | default | Audit trail |
| `Location` | `locations` | default | Physical locations |

---

## Application Structure

```
app/
├── Constants/          # Status constants, enums
│   ├── Status.php
│   └── ItemStatus.php
├── Http/
│   ├── Controllers/   # Request handlers
│   │   ├── AuthenticationController.php
│   │   ├── DashboardController.php
│   │   ├── RequestController.php
│   │   ├── RequestTypeController.php
│   │   ├── InventoryController.php
│   │   ├── IssuanceController.php
│   │   ├── General/ (ProfileController, AdminController)
│   │   └── DemoController.php
│   ├── Middleware/    # Route guards
│   │   ├── AdminMiddleware.php
│   │   ├── AuthMiddleware.php
│   │   ├── RequestorMiddleware.php
│   │   └── HandleInertiaRequests.php
│   └── Requests/       # Form requests
├── Models/             # Eloquent models
├── Providers/         # Service providers
├── Repositories/       # Data access layer
│   ├── UserRepository.php
│   ├── RequestRepository.php
│   └── RequestTypeRepository.php
├── Services/           # Business logic
│   ├── UserRoleService.php
│   ├── InventoryService.php
│   ├── IssuanceService.php
│   ├── RequestTypeService.php
│   ├── RequestService.php
│   └── DataTableService.php
└── Traits/
    └── Loggable.php
```

---

## Routing Structure

Routes are modular and organized by domain:

| File | Prefix | Purpose |
|------|--------|---------|
| `auth.php` | `/auth` | Login, registration, password reset |
| `general.php` | `/general` | Profile, dashboard |
| `admin.php` | `{app}` | Admin management |
| `request.php` | `{app}` | Request CRUD |
| `inventory.php` | `{app}` | Hardware/software inventory |
| `issuance.php` | `{app}` | Issuance workflow |

---

## Middleware Flow

```
Request → AuthMiddleware → RequestorMiddleware → Controller
                ↓                    ↓
           Check auth           Check request
           session             permission
```

| Middleware | Purpose |
|------------|---------|
| `AdminMiddleware` | Restrict to admin users |
| `AuthMiddleware` | Validate authentication |
| `RequestorMiddleware` | Verify request creation permission |
| `HandleInertiaRequests` | Share data with Inertia |

---

## Service Layer

Services contain business logic and are injected into controllers:

| Service | Responsibilities |
|---------|-----------------|
| `RequestService` | Create, update, process requests |
| `RequestTypeService` | Manage request type definitions |
| `InventoryService` | Hardware/software inventory operations |
| `IssuanceService` | Issuance workflow management |
| `UserRoleService` | Role-based permissions |
| `DataTableService` | Server-side datatable processing |

---

## Key Features

1. **Request Management**
   - Create/request items via form
   - Track request status (pending, approved, rejected)
   - Request item logging with `Loggable` trait

2. **Inventory Management**
   - Hardware tracking (hostnames, serials)
   - Software license management
   - Parts cascading dropdowns

3. **Issuance Workflow**
   - Approve/reject requests
   - Update item statuses
   - Audit trail via `RequestLogs`

4. **Multi-Role Access**
   - Employees (requestors)
   - Approvers
   - Administrators

---

## Environment Configuration

Required `.env` variables:

```env
# App
APP_NAME=rims

# Default DB (SQLite)
DB_CONNECTION=sqlite
DB_DATABASE=/path/to/database.sqlite

# QA Database
QA_HOST=127.0.0.1
QA_PORT=3306
QA_DATABASE=qa_db

# Inventory Database
INV_HOST=127.0.0.1
INV_PORT=3306
INV_DATABASE=inventory_db

# Masterlist Database
MDB_HOST=127.0.0.1
MDB_PORT=3306
MDB_DATABASE=masterlist_db

# Auth Database
ADB_HOST=127.0.0.1
ADB_PORT=3306
ADB_DATABASE=auth_db
```

---

## System Tables

### Admin Table (System_Tables.sql)

```sql
CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL UNIQUE,
    emp_name VARCHAR(255) NOT NULL,
    emp_role VARCHAR(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_updated_by VARCHAR(255),
    deleted_at TIMESTAMP NULL
);
```

---

## API Endpoints Summary

| Domain | Endpoints |
|--------|------------|
| Auth | `/auth/login`, `/auth/register`, `/auth/logout` |
| Request | `/request`, `/store`, `/request/table`, `/requests/show/{id}` |
| Request Types | `/requestType`, `/requestTypes` (CRUD) |
| Inventory | `/hostnames`, `/hardware/details`, `/{id}/parts`, `/{id}/software` |
| Issuance | `/issuance/*` (see issuance.php routes) |

---

## Frontend Structure

```
resources/js/
├── Hooks/              # Custom React hooks
│   ├── useRequestTypeDrawer.js
│   ├── useRequestTable.js
│   ├── useRequestCart.js
│   ├── useDrawer.js
│   └── ...
public/build/assets/    # Compiled Vite assets
```

---

## Testing

```bash
# Run tests
composer test

# Or via npm
npm run test
```

---

## Development

```bash
# Install dependencies
composer install
npm install

# Generate app key
php artisan key:generate

# Start development server
composer run dev
```

---

*Last Updated: April 2026*