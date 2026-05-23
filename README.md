# Event Management & Ticketing System

A full-stack event management and ticketing platform. Organizers create events and ticket types, attendees discover events and book tickets with atomic inventory reservation, payments flow through Paystack (with a dev-mode mock), unique QR-encoded tickets are issued on payment success, and organizers validate them at the door.

```
┌────────────┐    Bearer JWT    ┌─────────────┐    Mongoose    ┌──────────┐
│  Frontend  │ ───────────────► │   Backend   │ ─────────────► │ MongoDB  │
│ React+Vite │                  │  Express    │                │          │
│  shadcn/ui │ ◄─── REST JSON ─ │  REST API   │                └──────────┘
└────────────┘                  └─────────────┘                       
                                       │
                                       ├──► Paystack (live key) or dev-mock
                                       └──► SMTP (nodemailer) or console log
```

## Repo layout

```
event-ticketing-system/
├── backend/                          # Node + Express + MongoDB API
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js                    # Express bootstrap + route mounts
│       ├── server.js
│       ├── config/                   # db.js, swagger.js, cloudinary.js
│       ├── controllers/              # thin: receive request → call service → respond
│       ├── routes/                   # express routers; wires controllers + middleware
│       ├── services/                 # business logic (auth, payments, issuance, email…)
│       ├── models/                   # Mongoose schemas
│       ├── middlewares/              # auth, role, error handling
│       ├── validations/              # per-feature request shape validators
│       └── utils/                    # AppError, catchAsync, jwt, paystack, response
├── frontend/                         # React + Vite + TypeScript + Tailwind + shadcn/ui
│   └── src/
│       ├── App.tsx, main.tsx
│       ├── components/               # Layout, ProtectedRoute, NotificationBell, ui/*
│       ├── context/                  # AuthContext, ToastContext
│       ├── lib/                      # api client, auth/JWT helpers, types, utils
│       └── pages/                    # public, attendee, organizer/, admin/
└── README.md                         # this file
```

The backend follows the by-type folder structure from the capstone brief. Controllers stay thin (receive request → call service → format response). Business logic lives in services. Each `<entity>` has a controller, route, service, and validation file matching by basename (e.g. `auth.controller.js` ↔ `auth.route.js` ↔ `auth.service.js` ↔ `auth.validation.js`).

## Tech stack

**Backend** — Node.js, Express 5, MongoDB + Mongoose, JSON Web Tokens, bcryptjs, nodemailer, Paystack (HTTP), Swagger via `swagger-autogen`.

**Frontend** — React 18, Vite 6, TypeScript, Tailwind CSS 3, shadcn/ui (Radix primitives), React Router 6, lucide-react icons, qrcode.react.

**Dev** — `nodemon`, `mongodb-memory-server` (optional in-process MongoDB for zero-setup dev).

## Quick start

You need Node.js 18+. MongoDB is **not** required for dev — the backend can spin up an in-process MongoDB.

### 1. Backend

```bash
cd backend
cp .env.example .env
# Open .env and at minimum set JWT_SECRET (generate one below).
# Leave PAYSTACK_SECRET_KEY blank to use the dev-mode payment mock.
# Set USE_MEMORY_DB=true if you don't have a local mongod.
npm install
npm run dev
```

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The API starts on `http://localhost:5000` (or `PORT` in `.env`), and Swagger UI is at `http://localhost:5000/api-docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` (Vite will pick the next free port if it's taken).

If your backend runs on a non-default port, drop a `frontend/.env.local`:

```
VITE_API_URL=http://localhost:5001
```

## Environment variables (backend)

| Key | Required | Default | Notes |
|---|---|---|---|
| `PORT` | no | `5000` | HTTP port |
| `MONGO_URI` | yes (unless using memory db) | — | `mongodb://localhost:27017/event-ticketing` |
| `USE_MEMORY_DB` | no | `false` | `true` to spin up an in-process MongoDB (dev only — data wipes on restart) |
| `JWT_SECRET` | **yes** | — | At least 16 chars; generate one with the command above |
| `JWT_EXPIRES_IN` | no | `7d` | JWT lifetime |
| `CORS_ORIGIN` | no | `http://localhost:5173` | Comma-separated list of allowed origins |
| `FRONTEND_URL` | no | `http://localhost:5174` | Used for payment callback URL + password-reset links |
| `PAYSTACK_SECRET_KEY` | no | — | Set to enable real Paystack; otherwise dev-mock auto-confirms |
| `SMTP_HOST` etc. | no | — | Set to enable real SMTP via nodemailer; otherwise emails log to stdout |
| `EMAIL_FROM` | no | `Eventu <no-reply@localhost>` | From-address for outgoing email |
| `NODE_ENV` | no | `development` | Set to `production` for stricter behaviour (validates SMTP, hides dev reset tokens, suppresses request-error log) |

## API reference

All endpoints return:

```jsonc
// Success
{ "success": true, "message": "…optional…", "data": …, "meta": {…optional…} }

// Failure (HTTP 4xx/5xx)
{ "success": false, "message": "…", "code": "MACHINE_READABLE", "errors": [{"field": "…", "message": "…"}] }
```

Authenticated endpoints expect `Authorization: Bearer <jwt>` (returned from login/register).

### Auth — `/api/auth`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | — | `{ name, email, password, role? }`. Role `attendee` or `organizer` (admins are created by admins). |
| POST | `/login` | — | `{ email, password }` → `{ token, user }` |
| GET | `/me` | yes | Current user from JWT |
| POST | `/forgot-password` | — | `{ email }`. In non-production, response includes the raw `devToken`. |
| POST | `/reset-password` | — | `{ token, password }` → new session token |
| POST | `/change-password` | yes | `{ currentPassword, newPassword }` → fresh session token (old tokens become stale) |

### Users — `/api/users`

| Method | Path | Auth | Notes |
|---|---|---|---|
| PATCH | `/me` | any user | Update own `name`/`email`/`profileImage` |
| GET | `/` | admin | List/search users (`?role=…`, `?q=…`) |
| PATCH | `/:id/role` | admin | Promote/demote a user |
| DELETE | `/:id` | admin | Remove a user |

### Events — `/api/events`

Reads are public; signed-in organizers also see their own drafts on the list endpoint. `?mine=true` filters to events the caller organizes.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | optional | Anon → published only. Organizer → published + own. Admin → all. |
| GET | `/:id` | — | One event |
| POST | `/` | organizer/admin | `organizer` is set from the JWT; never trust the body |
| PUT | `/:id` | organizer/admin | Owner-or-admin only |
| DELETE | `/:id` | organizer/admin | Owner-or-admin only |
| PUT | `/publish/:id` | organizer/admin | Shortcut: set status=published |
| PUT | `/cancel/:id` | organizer/admin | Shortcut: set status=cancelled |

### Categories — `/api/categories`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | — | List |
| GET | `/:id` | — | One |
| POST | `/` | admin | Create |
| PUT | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Delete |

### Ticket types & issued tickets — `/api/tickets`

A "ticket" here splits into two concepts: a **ticket type** (e.g. "VIP @ ₦5000, qty 50") and an **issued ticket** (one actual seat with a QR-encoded code, created on payment success).

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | — | List ticket types (optional `?event=…`) |
| GET | `/event/:eventId` | — | Ticket types for an event |
| GET | `/:id` | — | One ticket type |
| GET | `/:id/availability` | — | `{ available, sold, quantity, onSale }` |
| POST | `/` | organizer/admin | Create a ticket type (must own the event) |
| PATCH | `/:id` | organizer/admin | Update (cannot directly mutate `sold`) |
| DELETE | `/:id` | organizer/admin | Refuses if `sold > 0` |
| GET | `/mine` | any user | **Issued tickets for the current user** (with codes) |
| GET | `/issued/:code` | organizer/admin | Lookup by code |
| POST | `/validate` | organizer/admin | `{ code }` → marks the code used; 409 if already used |

### Orders — `/api/orders`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/` | any user | `{ event, items: [{ ticket, quantity }] }`. Atomic reservation: if any seat fails, all prior increments roll back. |
| GET | `/my-orders` | any user | List own orders |
| GET | `/:id` | owner/admin | Order with populated items |
| PATCH | `/:id/cancel` | owner/admin | Releases reserved seats; fires notification |
| PATCH | `/:id/complete` | admin | Force-complete (normally driven by payment) |
| GET | `/` | admin | All orders (filters: `?user=`, `?event=`, `?status=`) |
| DELETE | `/:id` | admin | Delete + release seats if active |

### Payments — `/api/payments`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/initialize` | any user | `{ orderId }` → `{ authorizationUrl, reference, provider }`. With no Paystack key, the URL points back at the frontend's `/payment/callback` for instant dev confirmation. |
| POST | `/verify` | optional | `{ reference }` → marks `Payment` successful + `Order` paid+completed (idempotent). Fires receipt notification. |
| GET | `/verify` | optional | Same as POST verify, for query-string callbacks |
| GET | `/order/:orderId` | owner/admin | Payment history for an order |

### Notifications — `/api/notifications`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | any user | List + `meta.unread`. `?unread=true` to filter. |
| PATCH | `/:id/read` | owner | Mark one read |
| PATCH | `/mark-all-read` | any user | Mark all read |

Notifications are dispatched server-side (not over HTTP) by orders / payments / auth and persist as both an in-app row and an email (logged to stdout in dev, real SMTP if configured).

## Domain flow

```
USER ── creates ──► EVENT ── has ──► TICKET TYPE
                                            │
                       places order with    │
USER ── creates ──► ORDER ── has many ──► ORDER ITEM
                       │
                       └── pays ──► PAYMENT (Paystack or dev-mock)
                                       │
                                       └── on success ──► ISSUED TICKET (per seat, QR code)
                                                                │
                                                                └── scanned ──► status: used
USER ── receives many ──► NOTIFICATIONs at every step
```

### Atomic seat reservation

When `POST /api/orders` runs, the service loops the requested items and for each does a **conditional `findOneAndUpdate`**:

```js
{ _id: ticketId, event: eventId, salesStartDate: { $lte: now }, salesEndDate: { $gte: now },
  $expr: { $lte: [{ $add: ["$sold", qty] }, "$quantity"] } }
```

…with `{ $inc: { sold: qty } }`. The update only succeeds if seats remain *and* the sale window is open. If a later line fails, every seat already reserved in the same call is decremented in a rollback step. Two concurrent buyers cannot oversell.

### Auth & token lifecycle

- Passwords are hashed with bcrypt (cost 12) by a `pre("save")` hook on the User model.
- JWTs carry `{ id, role, iat, exp }` (default 7-day TTL).
- The auth middleware re-loads the user from MongoDB on every request, so a deleted user cannot use an old token.
- Changing the password sets `passwordChangedAt`; tokens issued before that time are rejected with `STALE_TOKEN`.

### Payment flow

1. Client `POST /api/orders` → seats reserved, order created with `paymentStatus=pending`.
2. Client `POST /api/payments/initialize` → `Payment` row + Paystack init (or dev URL).
3. Client `window.location.assign(authorizationUrl)` → Paystack-hosted page (or dev callback).
4. After payment, Paystack redirects back to `${FRONTEND_URL}/payment/callback?reference=…`.
5. The callback page `POST /api/payments/verify` → backend re-verifies with Paystack (or accepts `DEV_` refs), flips Payment to `successful`, Order to `paid`+`completed`, **issues N IssuedTickets per OrderItem**, and dispatches a receipt notification.

`verify` is idempotent — replaying the callback is safe.

### Ticket validation

Each `IssuedTicket` has a unique 12-char hex `code`. The attendee sees QR codes in **My Tickets**. The organizer pastes (or types from a hardware scanner) a code into **Scan**; the backend:

- Requires the scanner to be the event organizer (or admin).
- Refuses already-`used` codes with HTTP 409 `TICKET_ALREADY_USED`.
- Atomically flips `status` to `used` and records `usedAt`/`usedBy`.

## Roles

| Role | Can |
|---|---|
| **attendee** | Browse events, buy tickets, see own orders/tickets/notifications |
| **organizer** | Everything an attendee can + create/edit/delete own events, manage ticket types, validate tickets at the door |
| **admin** | Everything + cross-organizer event/order management, user role assignment |

## Frontend walk-through

1. Open the app → land on `/events` (public browse + search + category filter).
2. Sign in (or register as `attendee` or `organizer`). Admins are created by promoting an existing user.
3. Open an event → pick ticket types → **Place order** → redirected to payment → callback page shows confirmation.
4. The bell in the header polls every 30s and shows order/payment notifications.
5. **My Tickets** shows your QR codes; the code is also printed underneath for manual fallback.
6. As an organizer, **Scan** in the nav takes you to a validation page (paste a code → see attendee details + admit).

## Scripts

### Backend (`backend/package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Run with nodemon (auto-restart) |
| `npm run swagger` | Regenerate `swagger-out.json` from feature route files |

### Frontend (`frontend/package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production bundle to `dist/` |
| `npm run preview` | Serve the built bundle |

## Project conventions

- **By-type folders under `src/`** — `controllers/`, `routes/`, `services/`, `models/`, `middlewares/`, `validations/`, `utils/`, `config/`. Same basename connects the pieces (e.g. `auth.controller.js` + `auth.route.js` + `auth.service.js` + `auth.validation.js`).
- **Thin controllers** — controllers call the service, format the response, and that's it.
- **`AppError`** + `catchAsync` — services throw `AppError(message, status, code)`; the error middleware turns it into the standard error response shape. Validators can attach an `errors[]` array of `{ field, message }`.
- **Validation in dedicated files** — request-shape checks live in `*.validation.js` middleware, not in the controller.
- **Response shape** is always `{ success, message?, data?, code?, errors? }` via the `pkg/utils/response.js` helper.
- **Identity from token, not body** — `organizer`, `user`, etc. are always read from `req.user`, never from request bodies.

## Production checklist

- [ ] Replace `USE_MEMORY_DB=true` with a real `MONGO_URI` (Atlas or self-hosted)
- [ ] Generate a fresh `JWT_SECRET` (48+ random bytes)
- [ ] Set `PAYSTACK_SECRET_KEY` to your live Paystack key (and add `https://api.paystack.co` to your firewall)
- [ ] Set `SMTP_HOST` etc. (or swap `pkg/services/email.js` for Resend/SendGrid HTTP)
- [ ] Set `FRONTEND_URL` to the deployed origin so payment callbacks and reset links work
- [ ] Set `CORS_ORIGIN` to the deployed frontend origin
- [ ] `NODE_ENV=production` (loud failure on missing SMTP, hidden dev reset tokens)
- [ ] Deploy `frontend/dist` to a static host (Vercel/Netlify/etc.) with `VITE_API_URL` pointing at the deployed backend

## Caveats / known limitations

- **Swagger** lists the right endpoints but is missing the `/api/<feature>` prefix because mounting happens dynamically. "Try it out" buttons need the prefix added manually. The actual API URLs are correct in this README's tables above.
- **No camera-based scanner yet** — `Scan` is paste-only. Hardware HID scanners that type the code + Enter work fine.
- **Cloudinary upload** is stubbed (`config/cloudinary.js` exists but no upload route is wired). Profile / event images are URL inputs for now.

## License

ISC (same as the original repository).
