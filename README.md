# 🧁 Pastry & Cake Inventory Management System

A full-stack modular monolith inventory management system designed for bakeries to manage cakes, pastries, bakery products, raw ingredients, recipes, suppliers, purchase orders, batch production, sales POS, and inventory analytics.

---

## 🌟 Features

- **Authentication & Authorization**: Role-based access control (RBAC) supporting `ADMIN`, `MANAGER`, and `STAFF` roles with JWT security.
- **Product & Category Management**: Categorized bakery product tracking with selling prices, cost prices, quantities, and minimum stock alerts.
- **Raw Ingredient & Unit Tracking**: Track flour, sugar, butter, eggs, etc., supporting `KG`, `GRAM`, `LITER`, `ML`, and `PIECE` units.
- **Recipe Engine**: Map exact raw material proportions needed per finished bakery item.
- **Supplier & Purchase Order System**: Manage vendors and process purchase orders. Marking a purchase as `RECEIVED` automatically credits ingredient stock levels and logs audit transactions.
- **POS & Sales Management**: Record customer sales with multi-product line items, automatic total calculation, and stock validation. Returns `INSUFFICIENT_STOCK` error if requested quantity exceeds available stock.
- **Batch Production Processing**: Production process calculates required ingredients based on recipes, verifies ingredient stock, deducts raw materials, credits finished product stock, and generates inventory audit logs atomically.
- **Inventory Audit Trail & Alerts**: Real-time tracking of stock levels, low-stock alerts, out-of-stock items, expiring items, and transaction logs (`PURCHASE`, `SALE`, `PRODUCTION`, `WASTAGE`, `ADJUSTMENT`, `RETURN`).
- **Bakery Analytics Dashboard**: Visual summary of total products, raw ingredients, sales metrics, purchase metrics, top-selling items, and inventory valuation.

---

## 🏗️ Technology Stack

- **Backend**: Python 3.12+, FastAPI, SQLAlchemy 2.x, SQLite, Pydantic v2, PyJWT / Passlib (Bcrypt), Uvicorn.
- **Frontend**: React.js, Vite, React Router DOM v6, Axios, Vanilla CSS.
- **Database**: SQLite (file-based persistent database at `backend/bakery.db`).

---

## 📁 Project Structure

```text
pastry-cake-inventory/
│
├── backend/
│   ├── bakery.db              ← Persistent SQLite Database File
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   │
│   └── app/
│       ├── main.py            ← FastAPI App & CORS configuration
│       ├── seed.py            ← Initial DB Seeding script
│       ├── core/              ← Security & Configuration settings
│       ├── database/          ← SQLite SQLAlchemy 2.x engine
│       ├── models/            ← SQLAlchemy ORM models
│       ├── schemas/           ← Pydantic request/response schemas
│       ├── services/          ← Business logic & DB transactions
│       ├── routers/           ← REST API Endpoints
│       └── dependencies/      ← Auth & RBAC Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/        ← Reusable React UI components
│   │   ├── pages/             ← Page views (Dashboard, POS, Production, etc.)
│   │   ├── services/          ← Axios instance with JWT interceptor
│   │   ├── context/           ← AuthContext & state provider
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🗄️ Database & SQLite Configuration

The application uses **local persistent file-based SQLite**.

The database connection URL is strictly configured as:

```python
DATABASE_URL = "sqlite:///./bakery.db"
```

The database is stored physically at:

```text
backend/bakery.db
```

Data persists when the FastAPI server stops or when the machine reboots.

---

## 🔑 Default Development Credentials

Initial seed data is populated on application startup if the database is empty:

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin123` | Full system access (Users, Catalog, Stock, POS, Production, Purchases) |
| **MANAGER** | `manager` | `manager123` | Catalog, Ingredients, Recipes, Suppliers, Purchases, Sales, Production, Inventory |
| **STAFF** | `staff` | `staff123` | Products, Sales POS, Inventory View |

---

## 🚀 Running the Application

### 1. Start Backend Server

From the `backend` directory:

```bash
cd backend
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc API Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 2. Start Frontend Application

From the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)

---

## 📜 REST API Endpoint Overview

- **Authentication**: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- **Products**: `GET`, `POST`, `PUT`, `DELETE /api/products`
- **Ingredients**: `GET`, `POST`, `PUT`, `DELETE /api/ingredients`
- **Recipes**: `GET`, `POST`, `PUT`, `DELETE /api/recipes`
- **Suppliers**: `GET`, `POST`, `PUT`, `DELETE /api/suppliers`
- **Purchases**: `GET`, `POST /api/purchases`, `POST /api/purchases/{id}/receive`
- **Sales**: `GET`, `POST /api/sales`
- **Production**: `POST /api/production`
- **Inventory**: `GET /api/inventory`, `/low-stock`, `/out-of-stock`, `/expiring-soon`, `/transactions`
- **Dashboard**: `GET /api/dashboard`
