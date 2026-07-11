# RentNest — Backend API

A backend API for a rental property marketplace. Landlords list properties, tenants browse and request rentals, payments are processed via **Stripe**, and admins moderate the whole platform.

Built with **Node.js, Express, TypeScript, PostgreSQL (Prisma ORM), JWT auth, and Stripe**.

---

## 1. Tech Stack
Runtime & Framework: Node.js with Express

Language: TypeScript

Database & ORM: PostgreSQL managed through Prisma

Authentication: JWT and bcryptjs for hashing

Validation: Zod schemas

Payments: Stripe Checkout Sessions and Webhooks

Security & Logging: Helmet, CORS, and Morgan

---

## 2. Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database NEON DB
- A free sTRIPE

### Setup

```bash
git clone <your-repo-url>
cd rentnest-backend
npm install

cp .env.example .env

npx prisma generate
npx prisma migrate dev --name init

npm run seed        
npm run dev     
```

---

## 3. Admin Credentials

Created automatically by `npm run seed` (values come from `.env`):

```
Email:    admin@gmail.com
Password: admin123
```

The seed script also creates a sample landlord (`landlord@rentnest.com` / `landlord123`), a sample tenant (`tenant@rentnest.com` / `tenant123`), and 3 sample properties — handy for demoing the full flow immediately.

---

## 4. Response Format (applies to every endpoint)

**Success:**
```json
{
  "success": true,
  "message": "Property fetched successfully",
  "data": { "...": "..." }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errorDetails": [
    { "field": "price", "message": "Price must be greater than 0" }
  ]
}
```

All errors — validation failures, auth errors, not-found, Prisma errors, and unexpected exceptions — are normalized to this shape by `src/middleware/error.middleware.ts`.

---

## 5. Roles & Auth

Three fixed roles, chosen at registration: `TENANT`, `LANDLORD`, `ADMIN` (admin is not self-registrable — it's seeded).

Send the JWT on protected routes as:
```
Authorization: Bearer <token>
```

---

## 6. API Overview

Full request/response examples are in the Postman collection at `postman/RentNest.postman_collection.json` — import it, set the `baseUrl` variable, run **Login**, then paste the returned token into `tenantToken` / `landlordToken` / `adminToken` collection variables.

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### Properties (Public)
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/properties?city=&type=&minPrice=&maxPrice=&amenities=&page=&limit=` | Public |
| GET | `/api/properties/:id` | Public |
| GET | `/api/categories` | Public |

### Landlord
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/landlord/properties` | Landlord |
| GET | `/api/landlord/properties` | Landlord |
| PUT | `/api/landlord/properties/:id` | Landlord (owner only) |
| DELETE | `/api/landlord/properties/:id` | Landlord (owner only) |
| GET | `/api/landlord/requests` | Landlord |
| PATCH | `/api/landlord/requests/:id` `{ status: "APPROVED" \| "REJECTED" }` | Landlord |

### Rental Requests (Tenant)
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/rentals` | Tenant |
| GET | `/api/rentals` | Tenant |
| GET | `/api/rentals/:id` | Tenant (owner only) |

### Payments (Stripe)
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/payments/create` `{ rentalRequestId }` → returns Stripe Checkout URL | Tenant |
| POST | `/api/payments/confirm` `{ sessionId }` | Tenant |
| POST | `/api/payments/webhook` | Stripe (server-to-server) |
| GET | `/api/payments` | Tenant |
| GET | `/api/payments/:id` | Tenant (owner only) |

### Reviews
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/reviews` `{ rentalRequestId, rating, comment }` | Tenant (after payment completes) |

### Admin
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id` `{ status: "ACTIVE" \| "BANNED" }` | Admin |
| GET | `/api/admin/properties` | Admin |
| GET | `/api/admin/rentals` | Admin |
| POST | `/api/admin/categories` `{ name }` | Admin |

---

## 7. The Full Rental → Payment Flow

1. Tenant browses `/api/properties` and submits `POST /api/rentals`. Request status: `PENDING`.
2. Landlord views it via `GET /api/landlord/requests` and approves/rejects with `PATCH /api/landlord/requests/:id`.
   - Approve → status becomes `PAYMENT_DUE`.
   - Reject → status becomes `REJECTED`.
3. Tenant calls `POST /api/payments/create` with the `rentalRequestId`. This creates a Stripe Checkout Session and a `Payment` row (`PENDING`), returning a `checkoutUrl` to pay on Stripe's hosted page.
4. On success, either:
   - Stripe calls `POST /api/payments/webhook` (production path), or
   - the client calls `POST /api/payments/confirm` with the `sessionId` (manual/testing path).
   Both mark the payment `COMPLETED`, the rental request `ACTIVE`, and the property `RENTED`.
5. Tenant leaves a review via `POST /api/reviews` once the rental is `ACTIVE`/`COMPLETED`.

### Testing payments locally with Stripe CLI
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET in .env
stripe trigger checkout.session.completed
```
Use Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC.

---

