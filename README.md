# Rentify API

[![Live View](https://img.shields.io/badge/Live-View%20API-21b573?logo=vercel&logoColor=white)](https://rentify-server-v1.vercel.app/) [![Node.js](https://img.shields.io/badge/Node.js-Typescript-43853d?logo=node.js&logoColor=white)](#) [![Express](https://img.shields.io/badge/Express.js-Server-000000?logo=express&logoColor=white)](#)

Rentify is a production-ready REST API for a vehicle rental platform. It delivers secure authentication, granular authorization, fleet management, and a robust booking lifecycle optimized for real-world rental workflows.

## Features
- JWT-based authentication with admin/customer roles and authorization guards
- Vehicle inventory CRUD with availability enforcement and delete protections
- Booking lifecycle: creation, retrieval by role, cancellation, and return handling
- Automatic price calculation, time-window validation, and vehicle availability sync
- Integrity safeguards (e.g., block deleting booked vehicles or users with active bookings)
- Centralized error handling with rich HTTP status codes for consistent clients
- Ready-to-deploy infrastructure (Vercel + PostgreSQL) with TypeScript build pipeline

## 🛠️ Technology Stack
- Node.js + TypeScript
- Express.js (web framework)
- PostgreSQL (database)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)

## Getting Started
### 1. Clone & Install
```bash
git clone <repo-url>
cd Rentify
npm install
```

### 2. Configure Environment
Create a `.env` (or update `src/config/config.ts`) with:
```
PORT=4000
DB_CONNECTION_STR=postgres://user:password@host:5432/rentify
JWT_SECRET=replace_me
```

### 3. Database Prep
Ensure PostgreSQL is running. The app auto-creates the `users`, `vehicles`, and `bookings` tables through `src/DB/db.ts` on startup.

### 4. Development
```bash
npm run dev
```
Runs the API with live reload (ts-node / tsx). Default route responds at `http://localhost:4000/`.

### 5. Production Build
```bash
npm run build
npm start
```
Compiles TypeScript into `dist/` and boots the Express server with the compiled output.

## Usage Highlights
- **Auth**: `POST /api/v1/auth/signup` and `POST /api/v1/auth/login` issue JWTs for subsequent requests.
- **Users**: Admins can manage all users; customers can update their own profile. Deletion protects users with active bookings.
- **Vehicles**: Full CRUD plus status enforcement—booked vehicles cannot be deleted until released.
- **Bookings**: Customers create/cancel their own bookings before start dates; admins can view every booking and mark returns, automatically freeing vehicles.

Refer to `src/modules/*` for route/controller/service implementations. Use the [Live View](https://rentify-server-v1.vercel.app/) button above for instant smoke testing or integrate the API into your client applications.

---

## 🌐 API Reference

| # | Endpoint | Method | Access | Description |
|---|----------|--------|--------|-------------|
| 1 | `/api/v1/auth/signup` | POST | Public | Register a new user account |
| 2 | `/api/v1/auth/signin` | POST | Public | Login and receive JWT |
| 3 | `/api/v1/vehicles` | POST | Admin | Create a vehicle |
| 4 | `/api/v1/vehicles` | GET | Public | List all vehicles |
| 5 | `/api/v1/vehicles/:vehicleId` | GET | Public | Get vehicle by id |
| 6 | `/api/v1/vehicles/:vehicleId` | PUT | Admin | Update vehicle |
| 7 | `/api/v1/vehicles/:vehicleId` | DELETE | Admin | Delete vehicle (no active bookings) |
| 8 | `/api/v1/users` | GET | Admin | List all users |
| 9 | `/api/v1/users/:userId` | PUT | Admin / Self | Update user |
| 10 | `/api/v1/users/:userId` | DELETE | Admin | Delete user (no active bookings) |
| 11 | `/api/v1/bookings` | POST | Customer/Admin | Create booking |
| 12 | `/api/v1/bookings` | GET | Role-based | Admin sees all, customer sees own |
| 13 | `/api/v1/bookings/:bookingId` | PUT | Role-based | Customers cancel, admins mark returned |

### Detailed Specs
- **Authentication**  
  - Signup `POST /api/v1/auth/signup` accepts `{ name, email, password, phone, role }` and returns created profile (201).  
  - Signin `POST /api/v1/auth/signin` accepts `{ email, password }` and returns `{ token, user }` (200).

- **Vehicles**  
  - Create `POST /api/v1/vehicles` (admin + JWT header) with `{ vehicle_name, type, registration_number, daily_rent_price, availability_status }`.  
  - Read `GET /api/v1/vehicles` or `GET /api/v1/vehicles/:vehicleId`. Empty catalog returns 200 with empty array.  
  - Update `PUT /api/v1/vehicles/:vehicleId` (admin). Partial payload accepted.  
  - Delete `DELETE /api/v1/vehicles/:vehicleId` (admin). Guard rejects booked vehicles.

- **Users**  
  - List `GET /api/v1/users` (admin).  
  - Update `PUT /api/v1/users/:userId` (admin or owner). Optional `{ name, email, phone, role }`.  
  - Delete `DELETE /api/v1/users/:userId` (admin). Requires no active bookings for that user.

- **Bookings**  
  - Create `POST /api/v1/bookings` with `{ customer_id, vehicle_id, rent_start_date, rent_end_date }`. Automatically calculates price, sets status `active`, and marks vehicle `booked`.  
  - List `GET /api/v1/bookings` returns role-specific payloads (admins see customer + vehicle metadata).  
  - Update `PUT /api/v1/bookings/:bookingId`: customers send `{ status: "cancelled" }` before start date; admins send `{ status: "returned" }` to release vehicles. Response includes updated booking and vehicle availability when relevant.

### Standard Responses
- **Success**
  ```json
  {
    "success": true,
    "message": "Operation description",
    "data": { /* resource payload */ }
  }
  ```
- **Error**
  ```json
  {
    "success": false,
    "message": "Error description"
  }
  ```

### Status Codes
| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors / bad input |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Unhandled server issues |

### Auth Header
```
Authorization: Bearer <jwt_token>
```

### Business Logic Notes
- **Price**: `total_price = daily_rent_price × days` (days = `rent_end_date - rent_start_date`).  
- **Availability**: Vehicles flip to `booked` on creation, revert to `available` on cancellation/return.  
- **Auto-Return**: Past-due active bookings are auto-marked `returned` and vehicles freed.  
- **Deletion Guards**: Booked vehicles and users with active bookings cannot be deleted.
