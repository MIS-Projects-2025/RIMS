# RIMS — Architecture Documentation

**Project**: Request and Inventory Management System (RIMS)
**Framework**: Laravel 12 + Inertia.js (React)
**Purpose**: Manage employee requests, inventory tracking, and issuance workflows

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Multi-Database Architecture](#2-multi-database-architecture)
3. [Application Structure](#3-application-structure)
4. [Routing Structure](#4-routing-structure)
5. [Middleware & Authentication Flow](#5-middleware--authentication-flow)
6. [Role-Based Access Control (RBAC)](#6-role-based-access-control-rbac)
7. [Service Layer](#7-service-layer)
8. [Request Lifecycle](#8-request-lifecycle)
9. [Issuance Workflow](#9-issuance-workflow)
10. [Inventory Integration](#10-inventory-integration)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Shared State (Inertia)](#12-shared-state-inertia)
13. [Logging & Audit Trail](#13-logging--audit-trail)
14. [Database Schema](#14-database-schema)
15. [Environment Configuration](#15-environment-configuration)
16. [API Endpoints Reference](#16-api-endpoints-reference)

---

## 1. Technology Stack

| Layer          | Technology                                     |
| -------------- | ---------------------------------------------- |
| Backend        | Laravel 12 (PHP 8.2+)                          |
| Frontend       | Inertia.js + React + Tailwind CSS + shadcn/ui  |
| Database       | SQLite (default), MySQL (multiple connections) |
| Authentication | SSO via external Authify service               |
| Testing        | Pest PHP                                       |
| Build Tool     | Vite                                           |

---

## 2. Multi-Database Architecture

RIMS connects to **five distinct databases**, each serving a specific domain:

```
┌─────────────────────────────────────────────────────────────────┐
│                          RIMS Application                       │
│                                                                 │
│  ┌───────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐  │
│  │  SQLite   │  │ Masterlist │  │    QA    │  │  Authify   │  │
│  │ (default) │  │    (DB)    │  │   (DB)   │  │    (DB)    │  │
│  │           │  │            │  │          │  │            │  │
│  │ requests  │  │ employee_  │  │ location │  │  authify_  │  │
│  │ req_items │  │ masterlist │  │  _list   │  │  sessions  │  │
│  │ req_types │  │            │  │          │  │            │  │
│  │ req_logs  │  │            │  │          │  │            │  │
│  └───────────┘  └────────────┘  └──────────┘  └────────────┘  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Inventory API (External HTTP)             │    │
│  │          Hardware / Software / Parts / Issuances       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

| Connection    | Config Key    | Purpose                     | Key Tables                                                   |
| ------------- | ------------- | --------------------------- | ------------------------------------------------------------ |
| `sqlite`      | `DB_*`        | Core RIMS data              | `requests`, `request_items`, `request_types`, `request_logs` |
| `masterlist`  | `MDB_*`       | Employee directory          | `employee_masterlist`                                        |
| `qa`          | `QA_*`        | Location reference          | `location_list`                                              |
| `authify`     | `ADB_*`       | SSO session store           | `authify_sessions`                                           |
| Inventory API | `INVENTORY_*` | Hardware/software/issuances | External REST API                                            |

### Core Models & Their Connections

| Model         | Table                 | Connection   | Description                             |
| ------------- | --------------------- | ------------ | --------------------------------------- |
| `User`        | `employee_masterlist` | `masterlist` | Authenticated employee (PK: `EMPLOYID`) |
| `Masterlist`  | `employee_masterlist` | `masterlist` | Employee records (PK: `EMPID`)          |
| `Request`     | `requests`            | `sqlite`     | User submitted requests                 |
| `RequestItem` | `request_items`       | `sqlite`     | Individual items within a request       |
| `RequestType` | `request_types`       | `sqlite`     | Catalog of requestable items            |
| `RequestLogs` | `request_logs`        | `sqlite`     | Full audit trail                        |
| `Location`    | `location_list`       | `qa`         | Physical location reference             |

---

## 3. Application Structure

```
app/
├── Constants/
│   ├── Status.php          # Request status constants (NEW, TRIAGED, APPROVED, ISSUED, ACKNOWLEDGED, CANCELED, DISAPPROVED)
│   └── ItemStatus.php      # Item status constants (PENDING, ISSUED, CANCELED)
│
├── Http/
│   ├── Controllers/
│   │   ├── AuthenticationController.php
│   │   ├── DashboardController.php
│   │   ├── RequestController.php
│   │   ├── RequestTypeController.php
│   │   ├── InventoryController.php
│   │   ├── IssuanceController.php
│   │   ├── General/
│   │   │   ├── AdminController.php
│   │   │   └── ProfileController.php
│   │   └── DemoController.php
│   │
│   ├── Middleware/
│   │   ├── AuthMiddleware.php          # SSO token validation
│   │   ├── AdminMiddleware.php         # Admin-only gate
│   │   ├── RequestorMiddleware.php     # can_request permission gate
│   │   └── HandleInertiaRequests.php   # Inertia shared props
│   │
│   └── Requests/                       # Form request validators
│
├── Models/
│   ├── User.php
│   ├── Masterlist.php
│   ├── Request.php
│   ├── RequestItem.php
│   ├── RequestType.php
│   ├── RequestLogs.php
│   └── Location.php
│
├── Repositories/
│   ├── UserRepository.php
│   ├── RequestRepository.php
│   └── RequestTypeRepository.php
│
├── Services/
│   ├── RequestService.php
│   ├── RequestTypeService.php
│   ├── InventoryService.php
│   ├── IssuanceService.php
│   ├── UserRoleService.php
│   └── DataTableService.php
│
└── Traits/
    └── Loggable.php        # Auto-audit trail on CRUD

routes/
├── web.php                 # Root router, includes all sub-routes
├── auth.php                # /app/logout, /app/unauthorized
├── general.php             # /app/dashboard, /app/profile, /app/admin
├── request.php             # /app/request, /app/store, /app/requests/*
├── admin.php               # /app/requestType (CRUD)
├── inventory.php           # /app/hostnames, /app/hardware/*, /app/{id}/parts
└── issuance.php            # /app/issuance, /app/issuance/items

resources/js/
├── Pages/                  # Inertia page components (React)
├── Hooks/                  # Custom React hooks
└── Components/             # Shared UI components
```

---

## 4. Routing Structure

All authenticated routes are prefixed with `/app`.

### Auth Routes (`routes/auth.php`)

| Method | URI                 | Middleware       | Action                            |
| ------ | ------------------- | ---------------- | --------------------------------- |
| GET    | `/app/logout`       | `AuthMiddleware` | `AuthenticationController@logout` |
| GET    | `/app/unauthorized` | —                | Inertia render                    |

### General Routes (`routes/general.php`)

| Method | URI                      | Middleware        | Action                             |
| ------ | ------------------------ | ----------------- | ---------------------------------- |
| GET    | `/app/`                  | `AuthMiddleware`  | Redirect to dashboard              |
| GET    | `/app/dashboard`         | `AuthMiddleware`  | `DashboardController@index`        |
| GET    | `/app/profile`           | `AuthMiddleware`  | `ProfileController@index`          |
| POST   | `/app/change-password`   | `AuthMiddleware`  | `ProfileController@changePassword` |
| GET    | `/app/admin`             | `AdminMiddleware` | `AdminController@index`            |
| GET    | `/app/new-admin`         | `AdminMiddleware` | `AdminController@index_addAdmin`   |
| POST   | `/app/add-admin`         | `AdminMiddleware` | `AdminController@addAdmin`         |
| POST   | `/app/remove-admin`      | `AdminMiddleware` | `AdminController@removeAdmin`      |
| PATCH  | `/app/change-admin-role` | `AdminMiddleware` | `AdminController@changeAdminRole`  |

### Request Routes (`routes/request.php`)

| Method | URI                          | Middleware            | Action                               |
| ------ | ---------------------------- | --------------------- | ------------------------------------ |
| GET    | `/app/request`               | `RequestorMiddleware` | `RequestController@index`            |
| POST   | `/app/store`                 | `RequestorMiddleware` | `RequestController@store`            |
| GET    | `/app/requestTypes`          | `AuthMiddleware`      | `RequestController@getRequestTypes`  |
| GET    | `/app/staff/{empId}`         | `AuthMiddleware`      | `RequestController@getStaffList`     |
| GET    | `/app/locations`             | `AuthMiddleware`      | `RequestController@getLocations`     |
| GET    | `/app/request/table`         | `AuthMiddleware`      | `RequestController@getRequestsTable` |
| GET    | `/app/requests/show/{id}`    | `AuthMiddleware`      | `RequestController@show`             |
| POST   | `/app/request/action`        | `AuthMiddleware`      | `RequestController@RequestAction`    |
| POST   | `/app/request/update-status` | `AuthMiddleware`      | `RequestController@updateItemStatus` |

### Admin / Request Type Routes (`routes/admin.php`)

| Method | URI                      | Middleware        | Action                          |
| ------ | ------------------------ | ----------------- | ------------------------------- |
| GET    | `/app/requestType`       | `AdminMiddleware` | `RequestTypeController@index`   |
| POST   | `/app/requestTypes`      | `AdminMiddleware` | `RequestTypeController@store`   |
| PUT    | `/app/requestTypes/{id}` | `AdminMiddleware` | `RequestTypeController@update`  |
| DELETE | `/app/requestTypes/{id}` | `AdminMiddleware` | `RequestTypeController@destroy` |

### Inventory Routes (`routes/inventory.php`)

| Method | URI                               | Middleware       | Action                                         |
| ------ | --------------------------------- | ---------------- | ---------------------------------------------- |
| GET    | `/app/hostnames`                  | `AuthMiddleware` | `InventoryController@getHostNames`             |
| GET    | `/app/hostnames-or-serials`       | `AuthMiddleware` | `InventoryController@getHostNamesOrSerials`    |
| GET    | `/app/hardware/details`           | `AuthMiddleware` | `InventoryController@getHardwareDetails`       |
| GET    | `/app/parts-options`              | `AuthMiddleware` | `InventoryController@partsOptions`             |
| GET    | `/app/parts-inventory`            | `AuthMiddleware` | `InventoryController@partsInventory`           |
| GET    | `/app/software-options`           | `AuthMiddleware` | `InventoryController@softwareOptions`          |
| GET    | `/app/software-licenses`          | `AuthMiddleware` | `InventoryController@softwareLicenses`         |
| GET    | `/app/software-inventory-options` | `AuthMiddleware` | `InventoryController@softwareInventoryOptions` |
| GET    | `/app/{hardwareId}/full-details`  | `AuthMiddleware` | `InventoryController@getFullHardwareDetails`   |
| GET    | `/app/{hardwareId}/parts`         | `AuthMiddleware` | `InventoryController@parts`                    |
| GET    | `/app/{hardwareId}/software`      | `AuthMiddleware` | `InventoryController@software`                 |
| PUT    | `/app/{hardwareId}/update`        | `AuthMiddleware` | `InventoryController@updateHardware`           |

### Issuance Routes (`routes/issuance.php`)

| Method | URI                              | Middleware       | Action                                     |
| ------ | -------------------------------- | ---------------- | ------------------------------------------ |
| GET    | `/app/issuance`                  | `AuthMiddleware` | `IssuanceController@getIssuanceTable`      |
| GET    | `/app/issuance/items`            | `AuthMiddleware` | `IssuanceController@getIssuanceItemsTable` |
| POST   | `/app/issuance/create`           | `AuthMiddleware` | `IssuanceController@createIssuance`        |
| POST   | `/app/issuance/items/create`     | `AuthMiddleware` | `IssuanceController@createItemIssuance`    |
| GET    | `/app/issuance/list`             | `AuthMiddleware` | `IssuanceController@getIssuances`          |
| GET    | `/app/issuance/items/list`       | `AuthMiddleware` | `IssuanceController@getIssuanceItems`      |
| PUT    | `/app/issuance/acknowledge/{id}` | `AuthMiddleware` | `IssuanceController@acknowledgeIssuance`   |

---

## 5. Middleware & Authentication Flow

### SSO Authentication Flow

```
Browser                 RIMS (AuthMiddleware)              Authify (SSO)
  │                            │                                 │
  │ GET /app/* ?token=xxx       │                                 │
  │ ─────────────────────────► │                                 │
  │                            │                                 │
  │                            │ 1. Check token source           │
  │                            │    (query > cookie > session)   │
  │                            │                                 │
  │                            │ 2. Query authify_sessions DB    │
  │                            │ ◄────────────────────────────── │
  │                            │                                 │
  │                            │ 3. Build emp_data from result   │
  │                            │    - token, emp_id, emp_name    │
  │                            │    - emp_jobtitle, emp_dept     │
  │                            │    - emp_prodline, emp_station  │
  │                            │    - emp_position               │
  │                            │    - emp_user_roles             │
  │                            │    - can_request                │
  │                            │                                 │
  │                            │ 4. Store in session             │
  │                            │    Set SSO cookie (7 days)      │
  │                            │                                 │
  │ ◄─────────────────────────  │                                 │
  │    Proceed to controller    │                                 │
  │                            │                                 │
  │ (Invalid/missing token)    │                                 │
  │                            │ Redirect → SSO login page       │
  │ ◄─────────────────────────  │ http://192.168.2.221:8200       │
```

### Middleware Chain

```
HTTP Request
     │
     ▼
 web.php routes
     │
     ▼
┌─────────────────────┐
│   AuthMiddleware    │  ← Validates SSO token, populates session
│  (most routes)      │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐    ┌─────────────────────┐
│  AdminMiddleware    │ OR │RequestorMiddleware  │
│  (admin routes)     │    │  (create request)   │
└─────────────────────┘    └─────────────────────┘
     │                              │
     ▼                              ▼
  Controller                    Controller
```

| Middleware              | Applied To              | Logic                                     |
| ----------------------- | ----------------------- | ----------------------------------------- |
| `AuthMiddleware`        | All `/app/*` routes     | Validate SSO token → session              |
| `AdminMiddleware`       | Admin management routes | Check `admin` table for emp_id            |
| `RequestorMiddleware`   | Create request routes   | Check `can_request` in session            |
| `HandleInertiaRequests` | All requests            | Share `emp_data`, flash, auth to frontend |

---

## 6. Role-Based Access Control (RBAC)

### Role Definitions

Roles are determined dynamically from the `employee_masterlist` table via `UserRoleService` / `UserRepository`.

| Role                   | Identifier           | Determination                                                              |
| ---------------------- | -------------------- | -------------------------------------------------------------------------- |
| **Operation Director** | `OPERATION_DIRECTOR` | `EMPPOSITION = 5` OR `JOB_TITLE LIKE 'Operation%Director%'`                |
| **Department Head**    | `DEPARTMENT_HEAD`    | Listed as `APPROVER2` or `APPROVER3` in masterlist                         |
| **MIS Support**        | `MIS_SUPPORT`        | `JOB_TITLE LIKE 'MIS Support%'` OR `'Network Technician%'` OR `'Network%'` |
| **Requestor**          | _(default)_          | `EMPPOSITION >= 2` AND `can_request = true`                                |
| **Admin**              | _(system)_           | Exists in `admin` table                                                    |

> A single employee can hold multiple roles simultaneously (e.g., Department Head + Admin).

### Role Permissions Matrix

| Feature              | Requestor | Dept Head | Op Director | MIS Support | Admin |
| -------------------- | :-------: | :-------: | :---------: | :---------: | :---: |
| Create Request       |    Yes    |    Yes    |     Yes     |     Yes     |   —   |
| View Own Requests    |    Yes    |    Yes    |     Yes     |     Yes     |   —   |
| View Dept Requests   |     —     |    Yes    |      —      |      —      |   —   |
| View All Requests    |     —     |     —     |     Yes     |     Yes     |   —   |
| Approve/Disapprove   |     —     |    Yes    |     Yes     |      —      |   —   |
| Issue Request Items  |     —     |     —     |      —      |     Yes     |   —   |
| Manage Admins        |     —     |     —     |      —      |      —      |  Yes  |
| Manage Request Types |     —     |     —     |      —      |      —      |  Yes  |
| View Inventory       |    Yes    |    Yes    |     Yes     |     Yes     |  Yes  |
| Update Inventory     |     —     |     —     |      —      |     Yes     |  Yes  |
| View Issuances       |    Yes    |    Yes    |     Yes     |     Yes     |   —   |
| Create Issuance      |     —     |     —     |      —      |     Yes     |   —   |
| Acknowledge Issuance |    Yes    |    Yes    |     Yes     |     Yes     |   —   |

### Request Table Filter by Role

When loading the request table (`GET /app/request/table`), `RequestService::applyRoleFilters()` filters records based on role:

```
OPERATION_DIRECTOR
  └── Sees ALL requests from requestors with EMPPOSITION >= 2
       (not just their department)

DEPARTMENT_HEAD
  └── Sees requests from their direct staff
       (where APPROVER1, APPROVER2, or APPROVER3 = their emp_id)

MIS_SUPPORT
  └── Sees ALL requests (full visibility for issuance processing)

REQUESTOR (no elevated role)
  └── Sees ONLY their own submitted requests
```

### Available Actions per Request & Role

`RequestService::getActionsForSpecificRequest()` returns the allowed action buttons per request based on role and current status:

| Role               | When Status = NEW/TRIAGED | When Status = APPROVED |
| ------------------ | ------------------------- | ---------------------- |
| Department Head    | Approve / Disapprove      | —                      |
| Operation Director | Approve / Disapprove      | —                      |
| MIS Support        | —                         | Issue Items            |

---

## 7. Service Layer

Controllers are thin — all business logic lives in Services, which delegate data access to Repositories.

```
Controller → Service → Repository → Database
```

### RequestService

`app/Services/RequestService.php`

| Method                                                       | Description                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `submitRequest($requestorData, $cart)`                       | Wraps DB transaction: creates `Request` + N `RequestItem`s           |
| `generateRequestNumber()`                                    | Creates unique `REQ-YYYY-NNNN` format with row-level locking         |
| `prepareItems($requestId, $cartItem)`                        | Converts frontend cart item to `RequestItem` rows (bulk or per-item) |
| `getRequestsTable($filters, $empData)`                       | Role-filtered, paginated request list                                |
| `applyRoleFilters($query, $empData)`                         | Appends WHERE clauses based on determined role                       |
| `getRequestById($id, $empData)`                              | Returns single request with formatted items and available actions    |
| `getRoleForUser($empData)`                                   | Returns active role string for the session user                      |
| `getActionsForSpecificRequest(...)`                          | Returns `[APPROVE, DISAPPROVE, ISSUE]` buttons per role+status       |
| `requestAction($requestId, $empData, $actionType, $remarks)` | Processes APPROVE / DISAPPROVE actions                               |
| `updateRequestStatusBasedOnItems($requestId)`                | Recalculates `requests.status` from item statuses                    |
| `updateRequestItemStatus($itemId, $status)`                  | Updates single `RequestItem.item_status`                             |
| `bulkUpdateRequestItemsStatus($itemIds, $status)`            | Bulk item status update                                              |
| `canRequestBeIssued($requestId)`                             | Returns bool — all items PENDING?                                    |

### RequestTypeService

`app/Services/RequestTypeService.php`

| Method                                      | Description                                         |
| ------------------------------------------- | --------------------------------------------------- |
| `getAllGrouped()`                           | Returns request types grouped by `request_category` |
| `getRequestCatalog()`                       | Formats types for frontend form display             |
| `getLocationList()`                         | Fetches distinct location names from QA DB          |
| `getAllForTable($perPage, $page, $filters)` | Paginated + searchable request type list            |
| `create($data)`                             | Creates request type                                |
| `update($id, $data)`                        | Updates request type                                |
| `delete($id)`                               | Soft-deletes or hard-deletes request type           |

### InventoryService

`app/Services/InventoryService.php`

Wraps all calls to the external **Inventory REST API** (bearer token auth).

| Method                         | Description                     |
| ------------------------------ | ------------------------------- |
| `get($endpoint, $params)`      | Generic GET                     |
| `put($endpoint, $payload)`     | Generic PUT                     |
| `post($endpoint, $payload)`    | Generic POST                    |
| `getHostnamesList()`           | GET `/hostnames`                |
| `getHostNamesOrSerials($type)` | GET by type (hardware/parts)    |
| `partsOptions($filters)`       | Cascading dropdown for parts    |
| `softwareOptions($filters)`    | Cascading dropdown for software |
| `getFullHardwareDetails($id)`  | GET hardware + parts + software |
| `updateHardware($id, $data)`   | PUT hardware record             |

### IssuanceService

`app/Services/IssuanceService.php`

Also wraps the Inventory API for issuance operations.

| Method                                | Description                        |
| ------------------------------------- | ---------------------------------- |
| `createIssuance($data)`               | POST — whole unit issuance         |
| `createItemIssuance($data)`           | POST — individual item issuance    |
| `getIssuances($filters, $employeeId)` | GET issuances list (role-filtered) |
| `getIssuanceItems($filters)`          | GET issuance items                 |
| `acknowledgeIssuance($id, $data)`     | PUT — acknowledge receipt          |

### UserRoleService

`app/Services/UserRoleService.php`

| Method                         | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `isDepartmentHead($userId)`    | Checks `APPROVER2/3` columns in masterlist     |
| `isOperationDirector($userId)` | Checks `EMPPOSITION=5` or job title            |
| `isMisEmp($userId)`            | Checks MIS/Network job titles                  |
| `getCanRequest($userId)`       | Checks `EMPPOSITION >= 2`                      |
| `getRole($userId)`             | Returns array of all roles for user            |
| `getEmployees()`               | All active employees                           |
| `getStaffList($empId)`         | Staff where `APPROVER1` or `APPROVER2 = empId` |

### DataTableService

`app/Services/DataTableService.php`

Generic server-side datatable processor.

| Feature     | Description                               |
| ----------- | ----------------------------------------- |
| Search      | Full-text search across specified columns |
| Sort        | Column + direction sorting                |
| Paginate    | Page + per-page with total count          |
| Date filter | Start date / end date range filters       |
| CSV export  | Export current filtered result to CSV     |
| Joins       | Conditional table joins                   |

---

## 8. Request Lifecycle

### Status Flow

```
                     ┌──────────────┐
                     │  REQUESTOR   │
                     │  submits     │
                     └──────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  NEW  (1)     │
                    └───────┬───────┘
                            │ Dept Head / Op Director reviews
                            ▼
                    ┌───────────────┐    ┌──────────────────┐
                    │  TRIAGED (2)  │───►│ DISAPPROVED (7)  │
                    └───────┬───────┘    └──────────────────┘
                            │ Approved
                            ▼
                    ┌───────────────┐    ┌──────────────────┐
                    │  APPROVED (3) │───►│ DISAPPROVED (7)  │
                    └───────┬───────┘    └──────────────────┘
                            │ MIS Support issues items
                            ▼
                    ┌───────────────┐
                    │  ISSUED (4)   │
                    └───────┬───────┘
                            │ Requestor acknowledges
                            ▼
                    ┌───────────────┐
                    │ACKNOWLEDGED(5)│
                    └───────────────┘

         At any point:  → CANCELED (6)
```

### Request Item Status Flow

```
  PENDING (1)  →  ISSUED (2)
      │
      └────────→  CANCELED (3)
```

The parent `Request.status` is automatically recalculated by `updateRequestStatusBasedOnItems()` whenever an item status changes:

- All items `ISSUED` → Request becomes `ISSUED`
- All items `CANCELED` → Request becomes `CANCELED`
- Mixed states → Request stays `APPROVED`

### Request Submission Flow

```
Frontend (Form.jsx)
  │
  │ POST /app/store  { requestor_data, cart: [...] }
  │
  ▼
RequestController@store
  │
  ▼
RequestService@submitRequest
  │
  ├── DB::transaction()
  │     ├── RequestRepository@generateRequestNumber()  → REQ-2026-0001
  │     ├── RequestRepository@createRequest(...)
  │     └── foreach cart item:
  │           RequestService@prepareItems()
  │             ├── bulk mode   → 1 RequestItem (qty field)
  │             └── per-item mode → N RequestItems (one per issuedTo)
  │
  └── Return request_number
```

### Cart Modes

| Mode         | Description                                                | Result                                |
| ------------ | ---------------------------------------------------------- | ------------------------------------- |
| **Bulk**     | One line, shared `issued_to` + `location`, uses `quantity` | 1 `RequestItem` row                   |
| **Per-Item** | Individual recipients listed separately                    | N `RequestItem` rows (one per person) |

---

## 9. Issuance Workflow

```
MIS Support / Admin
  │
  │  Views APPROVED requests in RequestTable
  │
  ├── POST /app/issuance/create        → Whole unit issuance
  │     (entire device/item issued to one person)
  │
  └── POST /app/issuance/items/create  → Individual item issuance
        (specific part/software attached to device)

After issuance:
  │
  ├── IssuanceService@createIssuance / createItemIssuance
  │     (POST to external Inventory API)
  │
  └── RequestService@updateRequestItemStatus(item, ISSUED)
        → updateRequestStatusBasedOnItems()
        → Request becomes ISSUED when all items done

Acknowledgement:
  │
  └── PUT /app/issuance/acknowledge/{id}
        → IssuanceService@acknowledgeIssuance
        → Request becomes ACKNOWLEDGED
```

---

## 10. Inventory Integration

RIMS does **not** own inventory data directly. All hardware/software/parts/issuance data lives in an external **Inventory API**.

```
RIMS ──── HTTP (Bearer Token) ────► Inventory API
           GET / POST / PUT
```

Both `InventoryService` and `IssuanceService` wrap this API. The inventory API supports:

- **Cascading Dropdowns**: `partsOptions`, `softwareOptions` return filtered options based on previously-selected values
- **Full Hardware Details**: Returns hardware record with nested parts and software lists
- **Filter Encoding**: Table queries use base64-encoded JSON filter params (`?f=<base64>`)

---

## 11. Frontend Architecture

### Page Components (`resources/js/Pages/`)

| Page                     | Route                     | Description                     |
| ------------------------ | ------------------------- | ------------------------------- |
| `Login.jsx`              | External SSO              | SSO login redirect page         |
| `Dashboard.jsx`          | `/app/dashboard`          | Main dashboard overview         |
| `Form.jsx`               | `/app/request`            | Request creation form with cart |
| `RequestTable.jsx`       | `/app/dashboard` (tab)    | Request list with filters       |
| `RequestDetailView.jsx`  | `/app/requests/show/{id}` | Request detail + action buttons |
| `IssuanceTable.jsx`      | `/app/issuance`           | Issuance workflow table         |
| `IssuanceItemsTable.jsx` | `/app/issuance/items`     | Item-level issuance table       |
| `Admin.jsx`              | `/app/admin`              | Admin management                |
| `NewAdmin.jsx`           | `/app/new-admin`          | Add new admin                   |
| `RequestType.jsx`        | `/app/requestType`        | Request type catalog CRUD       |
| `Profile.jsx`            | `/app/profile`            | User profile + password change  |
| `404.jsx`                | Fallback                  | Not found page                  |
| `Unauthorized.jsx`       | `/app/unauthorized`       | 403 page                        |

### Custom Hooks (`resources/js/Hooks/`)

| Hook                      | Purpose                                                                         |
| ------------------------- | ------------------------------------------------------------------------------- |
| `useRequestCart.js`       | Cart state management (add, remove, update, submit)                             |
| `useRequestTable.js`      | Request table state (search, status filter, pagination)                         |
| `useApiTableConfig.js`    | Generic API-backed table state (search, sort, paginate, base64 filter encoding) |
| `useDrawer.js`            | Generic drawer open/close with animation delay                                  |
| `useRequestTypeDrawer.js` | Request type drawer (create vs. edit mode)                                      |
| `useHardwareParts.js`     | Hardware parts cascading dropdown state                                         |
| `useHardwareSoftware.js`  | Hardware software cascading dropdown + license state                            |
| `useRemovalModal.js`      | Removal confirmation modal state                                                |

### Data Flow Pattern

```
Inertia Page Load
  │ Laravel renders page with initial props
  ▼
Page Component mounts
  │ useEffect → fetch additional data via Axios (e.g., request table)
  ▼
Custom Hook handles API call
  │ Encodes filters as base64 JSON → GET /app/request/table?f=<base64>
  ▼
Controller → Service → Repository
  │ Returns paginated JSON
  ▼
Hook updates state → Component re-renders
```

---

## 12. Shared State (Inertia)

`HandleInertiaRequests.php` shares the following with **every** frontend page automatically:

```javascript
{
  emp_data: {
    token: "...",
    emp_id: 1234,
    emp_name: "LASTNAME, FIRSTNAME M.",
    emp_firstname: "Firstname",
    emp_jobtitle: "Job Title",
    emp_dept: "Department Name",
    emp_prodline: "Production Line",
    emp_station: "Station",
    emp_position: 3,              // EMPPOSITION value
    emp_user_roles: ["MIS_SUPPORT"],  // dynamic role array
    can_request: true,
    generated_at: "2026-01-01T00:00:00"
  },
  flash: {
    success: null,   // or "Action completed"
    error: null      // or "Something went wrong"
  },
  auth: {
    user: { ...User model attributes }
  },
  appName: "rims",
  display_name: "rims"
}
```

---

## 13. Logging & Audit Trail

The `Loggable` trait (`app/Traits/Loggable.php`) is applied to `Request` and `RequestItem` models.

On every **create**, **update**, or **delete**, a `RequestLogs` record is automatically written:

```
request_logs
├── loggable_type   → "App\Models\Request" or "App\Models\RequestItem"
├── loggable_id     → ID of the changed record
├── action_type     → "CREATED" | "UPDATED" | "DELETED"
├── action_by       → emp_id from session
├── action_at       → timestamp
├── remarks         → optional notes
├── metadata        → JSON (arbitrary extra context)
├── old_values      → JSON (before-state of changed fields)
├── new_values      → JSON (after-state of changed fields)
├── related_type    → optional parent model type
└── related_id      → optional parent model id
```

---

## 14. Database Schema

### `requests`

| Column                 | Type      | Notes                           |
| ---------------------- | --------- | ------------------------------- |
| `id`                   | INT PK    | Auto-increment                  |
| `request_number`       | VARCHAR   | Unique, format: `REQ-YYYY-NNNN` |
| `requestor_id`         | INT       | emp_id from masterlist          |
| `requestor_name`       | VARCHAR   | Denormalized name               |
| `requestor_department` | VARCHAR   | Denormalized dept               |
| `requestor_prodline`   | VARCHAR   | Production line                 |
| `requestor_station`    | VARCHAR   | Station                         |
| `status`               | INT       | See `Status` constants          |
| `remarks`              | TEXT      | Nullable                        |
| `created_by`           | INT       | emp_id                          |
| `updated_by`           | INT       | emp_id                          |
| `created_at`           | TIMESTAMP |                                 |
| `updated_at`           | TIMESTAMP |                                 |

### `request_items`

| Column               | Type      | Notes                      |
| -------------------- | --------- | -------------------------- |
| `id`                 | INT PK    |                            |
| `request_id`         | INT FK    | → `requests.id`            |
| `category`           | VARCHAR   | Hardware / Software / etc. |
| `type_of_request`    | VARCHAR   | Specific request type name |
| `request_mode`       | VARCHAR   | `bulk` / `per_item`        |
| `issued_to`          | INT       | emp_id or null             |
| `location`           | VARCHAR   |                            |
| `quantity`           | INT       | Used in bulk mode          |
| `purpose_of_request` | TEXT      |                            |
| `item_status`        | INT       | See `ItemStatus` constants |
| `created_at`         | TIMESTAMP |                            |
| `updated_at`         | TIMESTAMP |                            |

### `request_types`

| Column                | Type      | Notes                          |
| --------------------- | --------- | ------------------------------ |
| `id`                  | INT PK    |                                |
| `request_category`    | VARCHAR   | Category grouping              |
| `request_name`        | VARCHAR   | Display name                   |
| `request_description` | TEXT      |                                |
| `is_active`           | BOOLEAN   |                                |
| `created_by`          | INT       |                                |
| `created_at`          | TIMESTAMP | Manual (no Laravel timestamps) |
| `updated_by`          | INT       |                                |
| `updated_at`          | TIMESTAMP | Manual                         |

### `request_logs`

| Column          | Type      | Notes                       |
| --------------- | --------- | --------------------------- |
| `id`            | INT PK    |                             |
| `loggable_type` | VARCHAR   | Model class string          |
| `loggable_id`   | INT       | Model ID                    |
| `action_type`   | VARCHAR   | CREATED / UPDATED / DELETED |
| `action_by`     | INT       | emp_id                      |
| `action_at`     | TIMESTAMP |                             |
| `remarks`       | TEXT      |                             |
| `metadata`      | JSON      |                             |
| `old_values`    | JSON      |                             |
| `new_values`    | JSON      |                             |
| `related_type`  | VARCHAR   | Nullable                    |
| `related_id`    | INT       | Nullable                    |

### `admin`

| Column            | Type       | Notes          |
| ----------------- | ---------- | -------------- |
| `admin_id`        | INT PK     | Auto-increment |
| `emp_id`          | INT UNIQUE |                |
| `emp_name`        | VARCHAR    |                |
| `emp_role`        | VARCHAR    |                |
| `created_date`    | TIMESTAMP  |                |
| `last_updated`    | TIMESTAMP  | ON UPDATE      |
| `last_updated_by` | VARCHAR    |                |
| `deleted_at`      | TIMESTAMP  | Soft delete    |

---

## 15. Environment Configuration

```env
# Application
APP_NAME=rims
APP_ENV=production
APP_KEY=

# Default DB (SQLite)
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite

# QA Database (Location list)
QA_HOST=127.0.0.1
QA_PORT=3306
QA_DATABASE=qa_db
QA_USERNAME=
QA_PASSWORD=

# Inventory Database
INV_HOST=127.0.0.1
INV_PORT=3306
INV_DATABASE=inventory_db
INV_USERNAME=
INV_PASSWORD=

# Masterlist Database
MDB_HOST=127.0.0.1
MDB_PORT=3306
MDB_DATABASE=masterlist_db
MDB_USERNAME=
MDB_PASSWORD=

# Auth (Authify SSO) Database
ADB_HOST=127.0.0.1
ADB_PORT=3306
ADB_DATABASE=auth_db
ADB_USERNAME=
ADB_PASSWORD=

# External Inventory API
INVENTORY_API_URL=
INVENTORY_API_TOKEN=

# SSO Server
SSO_URL=http://192.168.2.221:8200
```

---

## 16. API Endpoints Reference

### Auth

| Endpoint      | Method | Description                           |
| ------------- | ------ | ------------------------------------- |
| `/app/logout` | GET    | Clear session, redirect to SSO logout |

### Dashboard & Profile

| Endpoint               | Method | Description     |
| ---------------------- | ------ | --------------- |
| `/app/dashboard`       | GET    | Dashboard page  |
| `/app/profile`         | GET    | User profile    |
| `/app/change-password` | POST   | Update password |

### Requests

| Endpoint                     | Method | Description                                    |
| ---------------------------- | ------ | ---------------------------------------------- |
| `/app/request`               | GET    | Request form page                              |
| `/app/store`                 | POST   | Submit new request                             |
| `/app/requestTypes`          | GET    | Get request type catalog (JSON)                |
| `/app/staff/{empId}`         | GET    | Get staff under employee (JSON)                |
| `/app/locations`             | GET    | Get location list (JSON)                       |
| `/app/request/table`         | GET    | Paginated request list (`?f=<base64 filters>`) |
| `/app/requests/show/{id}`    | GET    | Request detail (JSON)                          |
| `/app/request/action`        | POST   | APPROVE / DISAPPROVE request                   |
| `/app/request/update-status` | POST   | Update item status                             |

### Request Types (Admin)

| Endpoint                 | Method | Description                   |
| ------------------------ | ------ | ----------------------------- |
| `/app/requestType`       | GET    | Request types management page |
| `/app/requestTypes`      | POST   | Create request type           |
| `/app/requestTypes/{id}` | PUT    | Update request type           |
| `/app/requestTypes/{id}` | DELETE | Delete request type           |

### Inventory

| Endpoint                         | Method | Description                 |
| -------------------------------- | ------ | --------------------------- |
| `/app/hostnames`                 | GET    | Hostname list               |
| `/app/hostnames-or-serials`      | GET    | By type filter              |
| `/app/hardware/details`          | GET    | Hardware detail lookup      |
| `/app/parts-options`             | GET    | Cascading parts options     |
| `/app/parts-inventory`           | GET    | Parts inventory             |
| `/app/software-options`          | GET    | Cascading software options  |
| `/app/software-licenses`         | GET    | Software license list       |
| `/app/{hardwareId}/full-details` | GET    | Hardware + parts + software |
| `/app/{hardwareId}/parts`        | GET    | Parts for hardware          |
| `/app/{hardwareId}/software`     | GET    | Software for hardware       |
| `/app/{hardwareId}/update`       | PUT    | Update hardware             |

### Issuance

| Endpoint                         | Method | Description                    |
| -------------------------------- | ------ | ------------------------------ |
| `/app/issuance`                  | GET    | Issuance table page            |
| `/app/issuance/items`            | GET    | Issuance items table page      |
| `/app/issuance/create`           | POST   | Create whole unit issuance     |
| `/app/issuance/items/create`     | POST   | Create item issuance           |
| `/app/issuance/list`             | GET    | Issuances list (`?f=<base64>`) |
| `/app/issuance/items/list`       | GET    | Issuance items list            |
| `/app/issuance/acknowledge/{id}` | PUT    | Acknowledge issuance           |

### Admin

| Endpoint                 | Method | Description       |
| ------------------------ | ------ | ----------------- |
| `/app/admin`             | GET    | Admin list        |
| `/app/new-admin`         | GET    | Add admin form    |
| `/app/add-admin`         | POST   | Create admin      |
| `/app/remove-admin`      | POST   | Remove admin      |
| `/app/change-admin-role` | PATCH  | Update admin role |

---

_Last Updated: May 2026_
