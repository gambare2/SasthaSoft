# StockFlow — Enterprise Inventory & Supply Chain Management ERP

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-58%2F58%20Passing%20(100%25)-success)](https://nodejs.org/)
[![ESLint](https://img.shields.io/badge/ESLint-0%20Warnings-brightgreen?logo=eslint)](https://eslint.org/)
[![RBAC](https://img.shields.io/badge/RBAC-Admin%20%7C%20Manager%20%7C%20Employee-indigo)](#role-based-access-control-rbac--demo-switcher)

> **StockFlow** is an enterprise-grade multi-warehouse Inventory Management and Business Transaction ERP built with Next.js 14 App Router, TypeScript, React 18, and Tailwind CSS. It features pure Domain-Driven Design (DDD) business engines, an immutable stock movement audit ledger, full Role-Based Access Control (RBAC) with an interactive live role switcher, double-docked desktop navigation, mobile drawer support, and zero-setup local persistence.

---

## Table of Contents

1. [Executive Summary & Client Brief Alignment](#executive-summary--client-brief-alignment)
2. [Delivered Scope vs. Requirements](#delivered-scope-vs-requirements)
3. [Architecture & Engineering Design](#architecture--engineering-design)
4. [Role-Based Access Control (RBAC) & Demo Switcher](#role-based-access-control-rbac--demo-switcher)
5. [The Connected Business Workflow Engine](#the-connected-business-workflow-engine)
6. [Complete Module Guide](#complete-module-guide)
7. [Design System & Nexus-Inspired UI/UX](#design-system--nexus-inspired-uiux)
8. [Automated Testing & Code Quality](#automated-testing--code-quality)
9. [Getting Started & Evaluation Guide](#getting-started--evaluation-guide)

---

## Executive Summary & Client Brief Alignment

This project was developed for the **SasthaSoft Freelance Full Stack Developer** technical evaluation. The brief required building a modern, connected Inventory Management web application with a premium look matching products built by major tech companies.

### Core Evaluation Directives:
* **UI/UX & Aesthetics:** Move beyond standard admin templates to create an enterprise SaaS interface inspired by Nexus, featuring soft turquoise/mint card surfaces, deep navy analytical panels, and responsive layouts.
* **Connected Real-Time Workflow:** Ensure real business linkages where received purchases increase stock, confirmed sales decrement stock, and low stock warnings immediately propagate to dashboard KPIs and alerts.
* **Master Data & Godown Capabilities:** Expand beyond basic tables to incorporate multi-warehouse facilities, B2B customers, procurement suppliers, and workforce personnel.
* **Zero-Setup Usability:** Ensure an evaluator can clone the repository, run `npm run dev`, and immediately interact with realistic B2B Indian enterprise seed data without configuring databases or cloud infrastructure.

---

## Delivered Scope vs. Requirements

| Requirement | SasthaSoft Baseline | StockFlow Implementation |
|---|---|---|
| **Dashboard** | Totals, low stock alerts, recent activity | **3 Distinct Role Dashboards** (Executive Admin, Manager Operations, Employee Workbench) with live valuation, COGS, gross margin %, Recharts throughput graphs, and empty-state fallbacks |
| **Sales Module** | Orders/invoices, customer, amount, status | **Complete Sales Engine** with GST 18% calculation, discount handling, inventory availability checks, one-click fulfillment, payment status, and safe order cancellation |
| **Purchase Module** | Purchase orders, supplier, received/pending | **Two-Step Procurement Engine** with PO drafting, expected delivery dates, receiving inspection log, and automatic stock incrementing |
| **Stock Module** | Items, quantity, min level, status, history | **Multi-Facility Inventory Engine** with SKU cataloging, barcode scanning lookup, min/max thresholds, reorder points, warehouse distribution, and immutable movement logs |
| **Reports Module** | Stock, sales, and purchase reports | **Centralized Analytics Engine** featuring valuation at cost & retail, COGS gross profit calculations, date filtering (Today, 7D, 30D, Custom), and export simulations |
| **Additional Modules** | Optional godowns, customers, suppliers | **Full Suite Delivered:** Warehouses hub capacity management, B2B Contacts (Customers & Suppliers with credit limits and GSTIN), Workforce Directory, and immutable Activity Log |
| **Permissions / Roles** | Not strictly required | **Full RBAC System** with 3 distinct roles, 33 granular permission flags, dynamic role-aware sidebar/navbar, and an interactive top-bar role switcher |
| **Testing** | Standard evaluation | **58 Automated Unit Tests** in 8 test suites passing at 100%, 0 ESLint warnings, 0 TypeScript errors, 17/17 routes compiled |

---

## Architecture & Engineering Design

StockFlow separates UI components from pure business transaction logic following **Domain-Driven Design (DDD)** principles.

```
                              ┌──────────────────────────────────────────────┐
                              │           Next.js 14 App Shell               │
                              │  (Sidebar, Double-Dock Navbar, Mobile Drawer) │
                              └──────────────────────┬───────────────────────┘
                                                     │
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │             React Context State              │
                              │        (AppProvider.tsx + AppReducer)        │
                              └──────────────────────┬───────────────────────┘
                                                     │
                       ┌─────────────────────────────┼─────────────────────────────┐
                       ▼                             ▼                             ▼
        ┌─────────────────────────────┐┌───────────────────────────┐┌─────────────────────────────┐
        │   inventory-engine.ts       ││     sales-engine.ts       ││    purchase-engine.ts       │
        │ • Stock Movements (In/Out)  ││ • SO Creation & Invoicing ││ • PO Creation & Drafting    │
        │ • Valuation (Cost & Retail) ││ • Inventory Reservation   ││ • Inbound Receiving Intake  │
        │ • Physical Adjustments      ││ • Stock Deduction         ││ • Stock Incrementation      │
        │ • Threshold Alerts          ││ • Reversal Movements      ││ • Reversal Movements        │
        └─────────────────────────────┘└───────────────────────────┘└─────────────────────────────┘
                       │                             │                             │
                       └─────────────────────────────┼─────────────────────────────┘
                                                     │
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │            analytics-engine.ts               │
                              │ • Real-time Gross Profit Margin Calculation  │
                              │ • Sales vs Purchases Pace & Throughput Trend │
                              │ • Positive Category Inventory Valuation      │
                              │ • Multi-Warehouse Utilization Analytics      │
                              └──────────────────────────────────────────────┘
```

### Key Architectural Tenets:

1. **Domain Transaction Engines (`src/domain/`)**:
   - `inventory-engine.ts`: Manages product creation, stock adjustments, minimum threshold evaluations, and immutable movement generation.
   - `sales-engine.ts`: Validates product stock availability before confirming sales orders, applies 18% GST and line-item discounts, and emits `SALE` or `SALE_REVERSAL` movements.
   - `purchase-engine.ts`: Manages supplier procurement orders. Creating a purchase order reserves intent without altering stock; receiving the order executes physical stock additions and logs `PURCHASE` movements.
   - `analytics-engine.ts`: Pure mathematical calculations for inventory valuation, cost of goods sold (COGS), gross margins, sales/purchase pace, stock throughput volume, and positive category distribution.
   - `master-data-engine.ts`: Validates uniqueness of employee emails, customer GSTINs, supplier codes, and enforces relational constraints (e.g., preventing deactivation of warehouses that contain active stock).

2. **Immutable Stock Movement Ledger**:
   Stock balances are never modified without a corresponding `StockMovement` entry:
   - `OPENING`: Initial stock ingestion when a product is cataloged.
   - `PURCHASE`: Intake from received supplier purchase orders.
   - `SALE`: Outbound stock reduction upon sales order confirmation.
   - `ADJUSTMENT`: Audit write-offs, physical inventory count reconciliation, or damage write-downs.
   - `SALE_REVERSAL`: Cancellation of confirmed sales orders, restoring inventory to available stock.
   - `PURCHASE_REVERSAL`: Cancellation of received purchase orders, reversing received inventory.

3. **State Management & Safe Persistence (`src/context/AppProvider.tsx`)**:
   - Utilizes React's native `useReducer` and React Context for deterministic, single-directional data flow.
   - State mutations are executed via pure reducer actions (`CREATE_PRODUCT`, `CONFIRM_SALES_ORDER`, `RECEIVE_PURCHASE_ORDER`, etc.).
   - Employs resilient `localStorage` caching with hydration guards to prevent SSR layout shifts and flashes of unstyled content.
   - Features a **Reset Demo Data** action that resets the browser storage back to the original Indian enterprise seed dataset.

---

## Role-Based Access Control (RBAC) & Demo Switcher

StockFlow includes a production-grade Role-Based Access Control architecture defined in `src/permissions/`.

```
                              ┌──────────────────────────────────┐
                              │      Interactive Navbar Demo     │
                              │    [Admin] [Manager] [Employee]  │
                              └─────────────────┬────────────────┘
                                                │
                                                ▼
                              ┌──────────────────────────────────┐
                              │       Role Context Provider      │
                              │       (useRole & setDemoRole)    │
                              └─────────────────┬────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
  ┌─────────────────────────────┐┌─────────────────────────────┐┌─────────────────────────────┐
  │         ADMIN ROLE          ││        MANAGER ROLE         ││        EMPLOYEE ROLE        │
  │ • Rajesh Sharma (emp-001)   ││ • Priya Sundaram (emp-002)  ││ • Amit Patel (emp-003)      │
  │ • Executive Operations KPI  ││ • Departmental Fulfillment  ││ • Personal Order Desk       │
  │ • Full Financial Margins    ││ • Receive Inbound Shipments ││ • Catalog Lookup & Search   │
  │ • Master Data Commissioning ││ • Stock Adjustments         ││ • Fast Sales Drafting       │
  │ • Transaction Reversals     ││ • Operational Margins       ││ • PO Requisitions           │
  │ • System-wide Audit Log     ││ • Team Activity Log         ││ • Personal Activity Log     │
  └─────────────────────────────┘└─────────────────────────────┘└─────────────────────────────┘
```

### The 3 Personas:

#### 1. Administrator (`Rajesh Sharma` — Head of Enterprise Operations)
- **Scope:** Full enterprise visibility across all 3 regional hubs.
- **Dashboard:** Asset valuation at cost and retail, confirmed sales revenue, purchase spend, gross profit margins, throughput analytics, and category distribution.
- **Exclusive Authorities:** Commission and deactivate warehouses, create and edit employee roles, authorize order cancellations and transaction reversals, view system-wide audit logs.

#### 2. Manager (`Priya Sundaram` — Operations & Inventory Manager)
- **Scope:** Departmental logistics and warehouse fulfillment control.
- **Dashboard:** Catalog items managed, pending inbound POs, operational margin tracking, inventory fluctuation pace, and pending shipments.
- **Authorities:** Receive incoming supplier deliveries, confirm customer dispatches, perform manual stock adjustments, manage B2B customer and supplier contacts. Restricted from user role assignment and facility decommissioning.

#### 3. Employee (`Amit Patel` / `Ananya Iyer` — Warehouse & Fulfillment Associate)
- **Scope:** Personal operational workbench.
- **Dashboard:** Personal confirmed sales total, active purchase requisitions created, personal activity timeline, and instant stock search.
- **Authorities:** Search catalog SKUs, draft new sales orders, create purchase requisitions, log new product entries. Restricted from viewing executive profit margins, adjusting warehouse inventory, receiving purchase orders, or viewing team-wide logs.

### Interactive Navbar Demo Switcher:
- Located directly in the top Navbar alongside the search bar and notification center.
- Evaluators can toggle between **Admin**, **Manager**, and **Employee** with a single click.
- The application updates identity badges, permissions, navigation menus, and dashboard views instantly without reloading the page.
- In-app permission guards automatically hide or disable unauthorized buttons (e.g., Stock Adjustments, Receive Shipment, Commission Warehouse) with accessible visual feedback.

---

## The Connected Business Workflow Engine

Every operational action in StockFlow creates connected side-effects across the entire system.

```
       1. INBOUND PROCUREMENT                         2. OUTBOUND FULFILLMENT
┌─────────────────────────────────────┐        ┌─────────────────────────────────────┐
│ Supplier Purchase Order (Draft)     │        │ Customer Sales Order (Draft)        │
└──────────────────┬──────────────────┘        └──────────────────┬──────────────────┘
                   │                                              │
                   ▼ (Receive Shipment)                           ▼ (Confirm Order)
┌─────────────────────────────────────┐        ┌─────────────────────────────────────┐
│ • PO Status -> RECEIVED             │        │ • Check Stock Availability          │
│ • Quantity added to Warehouse Stock │        │ • SO Status -> CONFIRMED            │
│ • StockMovement: PURCHASE logged    │        │ • Quantity deducted from Stock      │
└──────────────────┬──────────────────┘        │ • StockMovement: SALE logged        │
                   │                           └──────────────────┬──────────────────┘
                   │                                              │
                   └──────────────────────┬───────────────────────┘
                                          │
                                          ▼
                   ┌──────────────────────────────────────────────┐
                   │           Real-Time Synchronization          │
                   │ • Dashboard Asset Valuation updates          │
                   │ • Gross Margin & COGS recalculate            │
                   │ • Low Stock Threshold evaluated              │
                   │ • Notifications & Activity Log recorded      │
                   └──────────────────────────────────────────────┘
```

### 1. Inbound Procurement Workflow:
1. Navigate to **Purchases** &rarr; **+ New Purchase Order**.
2. Select a supplier (e.g., *Bharat Electronics Components*), target warehouse facility, and line items.
3. Submitting creates a `PENDING` purchase order. At this stage, catalog inventory is unaffected.
4. Clicking **Receive Order** initiates the receiving workflow:
   - Status updates to `RECEIVED`.
   - Line-item quantities are credited to the selected warehouse.
   - An immutable `PURCHASE` movement is logged in the ledger.
   - Dashboard asset valuations and purchase spend metrics update in real-time.

### 2. Outbound Sales Workflow:
1. Navigate to **Sales** &rarr; **+ New Sales Order**.
2. Select a customer (e.g., *Tata Advanced Systems*), dispatch warehouse, and products.
3. System automatically calculates line totals, discounts, and 18% GST.
4. Submitting creates a `PENDING` order.
5. Clicking **Confirm Order**:
   - The engine checks inventory sufficiency across all items.
   - If stock is sufficient, quantities are decremented from catalog stock.
   - An immutable `SALE` movement is recorded.
   - Confirmed sales revenue and gross profit metrics immediately reflect on dashboards and reports.

### 3. Dynamic Low-Stock & Out-of-Stock Detection:
- When product stock falls to or below `minStockLevel`, the product is tagged as `LOW_STOCK`.
- When stock reaches `0`, status transitions to `OUT_OF_STOCK`.
- Low-stock warnings surface across the Sidebar badge, Navbar alert drawer, and dedicated dashboard alert panels.

### 4. Transaction Reversals & Stock Restorations:
- If a confirmed sale is cancelled, the sales engine generates a `SALE_REVERSAL` movement, restoring inventory without deleting transaction history.
- If a received purchase order is cancelled, the purchase engine generates a `PURCHASE_REVERSAL` movement, deducting the items from stock.

---

## Complete Module Guide

The application consists of 9 fully functional modules:

### 1. Dashboard (`/dashboard`)
- **Executive Admin View:** Total asset valuation (cost & retail), confirmed revenue, purchase spend, gross profit margin %, Recharts financial bar chart, stock throughput area chart, and category distribution donut chart.
- **Operations Manager View:** Managed catalog items, pending inbound POs, departmental profit margins, and movement fluctuation graphs.
- **Employee Workbench View:** Fast sales revenue totals, personal requisitions, low-stock alerts, and fast SKU catalog search.

### 2. Products & Inventory (`/inventory`, `/inventory/new`, `/inventory/[id]`)
- Product catalog featuring SKU, barcode, unit cost, retail price, current stock, reorder point, unit of measure, and facility location.
- Barcode/SKU instant search and category filtering.
- One-click stock adjustments (audit, damage write-off, receipt) with mandatory reason capture.
- Complete historical stock movement ledger per product.

### 3. Sales Orders & Billing (`/sales`, `/sales/new`, `/sales/[id]`)
- Order management with customer details, warehouse origin, line-item totals, tax, and total billing.
- Order lifecycle transitions: `DRAFT` &rarr; `CONFIRMED` &rarr; `SHIPPED` &rarr; `DELIVERED` &rarr; `CANCELLED`.
- Integrated invoice view with downloadable GST invoice format.

### 4. Procurement & Purchases (`/purchases`, `/purchases/new`, `/purchases/[id]`)
- Purchase order management with supplier details, payment terms, and delivery schedules.
- Two-step intake receiving workflow with receiving employee attribution.
- Status badges: `DRAFT`, `PENDING`, `RECEIVED`, `CANCELLED`.

### 5. Reports & Analytics (`/reports`)
- **Inventory Valuation Report:** Breakdown by category, total cost, retail value, and profit potential.
- **Sales Performance Report:** Revenue by customer, top-selling SKUs, average order values, and tax collected.
- **Purchases Spend Report:** Procurement expenditure by vendor, delivery fulfillment rates, and pending payables.
- Time period selectors (Today, Last 7 Days, Last 30 Days, Last 90 Days, Custom Range).
- One-click CSV and print/PDF export simulations.

### 6. Warehouse Management (`/warehouses`)
- Multi-facility management: *Bengaluru Central Fulfilment Hub*, *Mumbai Industrial Distribution Center*, and *Chennai Port Logistics Depot*.
- Live capacity meters and utilization percentages based on active stored stock.
- Deactivation protection: system prevents deactivating facilities that currently hold active inventory.

### 7. Master Data Contacts (`/contacts`)
- Segmented registry of B2B **Customers** and procurement **Suppliers**.
- Captures legal business name, GSTIN, credit limits, payment terms (Net 15, Net 30, Net 45), contact person, phone, and billing address.
- Seamlessly linked into Sales Order and Purchase Order dropdown selectors.

### 8. Workforce Directory (`/employees`, `/employees/[id]`)
- Comprehensive employee directory with department, designation, assigned warehouse hub, and RBAC role.
- Administrator role can onboard team members, edit designations, and reassign system permissions.

### 9. System Activity Log (`/activity`)
- Real-time audit log of all system activities (Product creation, order confirmations, stock write-offs, receiving logs).
- Filters by module (`INVENTORY`, `SALES`, `PURCHASES`, `WAREHOUSE`, `EMPLOYEES`, `SYSTEM`) and actor.

---

## Design System & Nexus-Inspired UI/UX

StockFlow adheres to a custom enterprise design system inspired by the **Nexus** SaaS platform:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Primary Color Palette                                                           │
├──────────────────┬──────────────────┬──────────────────┬────────────────────────┤
│ Deep Navy        │ Mint Surface     │ Turquoise Accent │ Teal Primary           │
│ #111C2E          │ #EBF8F5          │ #55C5D2          │ #11877E                │
│ Analytical Panes │ Soft KPI Cards   │ Metric Accents   │ Interactive Buttons    │
└──────────────────┴──────────────────┴──────────────────┴────────────────────────┘
```

### Visual Highlights:
- **Double-Docked Desktop Navigation:** Primary navigation on top, secondary contextual tools docked below with clean active indicator lines.
- **Mobile Responsive Drawer:** Collapses into a clean mobile header with search, profile, and full drawer navigation on smaller viewports.
- **Accessible Typography:** Uses clear font hierarchies, high-contrast text ratios, and tabular figures for financial numbers.
- **Recharts Hydration Safety:** All charts feature client-side hydration guards, zero-width fallback skeletons, and customized tooltips styled in `#202F3F` enterprise dark panels.
- **Empty-State Design:** When filters return zero results, charts and lists display informative illustrated empty states with guidance rather than blank containers.

---

## Automated Testing & Code Quality

StockFlow includes automated test coverage running on the Node.js native test runner and TypeScript execution engine (`tsx`).

```bash
npm test
```

### Verified Test Suites (58 / 58 Passing):

```
✔ StockFlow Phase 2 - Business Engine Test Suite (13 tests)
  • Product creation with opening stock
  • Purchase order creation vs receiving stock deltas
  • Sales order creation vs confirmation inventory deduction
  • Insufficient stock rejection
  • Sales cancellation and stock restoration
  • Purchase cancellation and stock reduction
  • Manual inventory adjustment calculations
  • System activity logging verification
  • Safe transaction reversal movements

✔ StockFlow Phase 3 - Analytics Engine Test Suite (20 tests)
  • Total inventory valuation (sum of product stock * cost)
  • Sales revenue calculations (excluding cancelled/draft)
  • Purchase spend calculations (received orders only)
  • Real-time Gross Profit and margin %
  • Low-stock and out-of-stock product detection
  • Date range filtering (Today, 7D, 30D, Custom)
  • Employee performance attribution
  • Warehouse capacity utilization tallies
  • Historical stock movement throughput trends
  • Category inventory valuation aggregation
  • Multiple products in single category grouping
  • Empty category handling without NaN
  • Sales and purchase pace chronological sorting
  • Reversal deltas in stock throughput calculation
  • Empty chart state verification

✔ StockFlow Phase 5.1 - Master Data Management Test Suite (25 tests)
  • Employee onboarding, role assignment, and validation
  • Customer creation with credit limit and GSTIN verification
  • Supplier onboarding with payment terms
  • Warehouse commissioning and capacity validation
  • Warehouse deactivation constraint enforcement
  • AppReducer state mutations and demo data reset
```

### Code Quality Verification:
- **Linting:** `npm run lint` &rarr; ✔ **No ESLint warnings or errors**
- **TypeScript:** `npx tsc --noEmit` &rarr; **0 compilation errors**
- **Production Build:** `npm run build` &rarr; **17 / 17 static and dynamic routes compiled successfully**

---

## Recommended Evaluator Walkthrough

To experience the full depth of StockFlow, follow this recommended 5-minute evaluation path:

1. **Explore the Executive View (Admin Role):**
   - Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
   - Review the financial metrics, gross margin %, Recharts throughput volume chart, and category distribution donut.
   - Switch the date filter between **All Time**, **Today**, **Last 7 Days**, and **Custom**.

2. **Test the Connected Procurement Flow:**
   - Go to **Purchases** (`/purchases`).
   - Notice `PO-2026-2003` is currently `PENDING`.
   - Click into the order and press **Receive Order**.
   - Check **Inventory** (`/inventory`): note how stock for `5-Ply Corrugated Packing Cartons` increased by 150 units.
   - Check **Activity Log** (`/activity`): note the automated audit log entry.

3. **Test the Connected Sales Flow:**
   - Go to **Sales** (`/sales`).
   - Click **+ New Sale** and create an order for a customer.
   - Confirm the order and observe catalog stock reduction and GST 18% calculation.

4. **Test the Role-Based Persona Switcher:**
   - In the top Navbar, click on the **Admin** role pill.
   - Switch to **Manager (`Priya Sundaram`)**: observe how the dashboard transitions to departmental operations and warehouse control.
   - Switch to **Employee (`Amit Patel`)**: observe how executive margins are hidden and the view becomes a fast task workbench. Notice that administrative actions (e.g., Commissioning Warehouses) are hidden.

5. **Reset Demo Data:**
   - At any time, click **Reset Demo Data** in the Navbar or profile dropdown to restore the original seed state.

---

*StockFlow was engineered with precision for the SasthaSoft technical assessment.*
#   S a s t h a S o f t  
 