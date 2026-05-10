# Event booking and ticketing system

The Event Management & Ticketing System is a backend application designed to help organizers create, manage, and monitor events while allowing users to browse events, purchase tickets, and receive confirmations securely. The system will support event creation, ticket management, user authentication, booking processes, payment integration, and ticket validation.

## Features 

1. **Clean Architecture**: Clear seperation of concerns among components of the app (auth, event, admin, etc).
2. **RESTful API**: Standard REST convention for API responses.
3. **MONGO Database**: Document-rich database to hold application's data.
4. **STATELESS AUTHENTICATION**: Stateless-based authentication with json web tokens.
5. **Structured Logging**: Logging properly handled with the node js `winston` package.
6. **ERROR MIDDLEWARE**: Middleware to take care of errors.
7. **DATABASE MIGRATIONS**: Database migrations are properly handled with the `mongoose` package.
8. **DOCUMENTATION**: Properly documented application with `swagger`.


## Tech Stack

1. **LANGUAGE**: JavaScript
2. **DATABASE**: Mongo DB
3. **FRAMEWORK**: Express JS
4. **LOGGING**: Winston
5. **MIGRATIONS**: Moongoose

## Getting started

### Prerequisite:

1. Node js is installed.
2. A code editor is installed.

### To run

1. Clone this repo

```bash
git clone git@github.com:Towbee05/event-ticketing-system.git
cd event-ticketing-system
cp .env.example .env
npm run dev
```

## Project Structure

```
.
│
├── app.js
├── server.js
│
├── config/
│ ├── db.js
│ ├── env.js
│ └── cloudinary.js
│
├── middleware/
│ ├── auth.middleware.js
│ ├── error.middleware.js
│ └── role.middleware.js
│
├── pkg/
│ ├── utils/
│ ├── constants/
│ ├── helpers/
│ └── services/
│
├── internal/
│ │
│ ├── auth/
│ │ ├── auth.controller.js
│ │ ├── auth.service.js
│ │ ├── auth.route.js
│ │ ├── auth.validation.js
│ │ └── auth.utils.js
│ │
│ ├── users/
│ │ ├── user.model.js
│ │ ├── user.controller.js
│ │ ├── user.service.js
│ │ ├── user.route.js
│ │ └── user.validation.js
│ │
│ ├── events/
│ │ ├── event.model.js
│ │ ├── event.controller.js
│ │ ├── event.service.js
│ │ ├── event.route.js
│ │ └── event.validation.js
│ │
│ ├── tickets/
│ │ ├── ticket.model.js
│ │ ├── ticket.controller.js
│ │ ├── ticket.service.js
│ │ ├── ticket.route.js
│ │ └── ticket.validation.js
│ │
│ ├── orders/
│ │ ├── order.model.js
│ │ ├── order.controller.js
│ │ ├── order.service.js
│ │ ├── order.route.js
│ │ └── order.validation.js
│ │
│ ├── payments/
│ │ ├── payment.controller.js
│ │ ├── payment.service.js
│ │ ├── payment.route.js
│ │ └── payment.validation.js
│ │
│ └── notifications/
│ ├── notification.service.js
│ ├── notification.utils.js
│ └── email.templates.js
│
├── docs/
│ └── swagger.js
│
└── tests/
├── auth.test.js
├── events.test.js
└── orders.test.js
```

## Security

- Passwords hashed with bcrypt
- All secrets stored in environment variables
- Session-based authentication with 7-day expiration
- HTTPS enforced in production
- Request payload size limits
- Rate limiting middleware support
- CORS explicitly configured

### Success Response

```json
{
  "status": "success",
  "message": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "data": {},
  "meta": {}
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "errors": []
}
```

### HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | OK                    |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthenticated       |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Unprocessable Entity  |
| 500  | Internal Server Error |

## Contact

For issues or questions, please reach out to the administrators.
