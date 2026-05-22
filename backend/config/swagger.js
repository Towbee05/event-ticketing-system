const swagger = require("swagger-autogen")();
const dotenv = require("dotenv");
dotenv.config();

const docs = {
  info: {
    version: "v1.0",
    title: "Event Management and Ticketing System",
    description:
      "Backend API for the Event Management & Ticketing System: events, ticket types, " +
      "orders with atomic inventory reservation, JWT auth, and role-based access control.",
  },
  host: `localhost:${process.env.PORT || 5001}`,
  basePath: "/",
  schemes: ["http", "https"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "Bearer <JWT> — obtain via POST /api/auth/login",
    },
  },
};

const outFile = "../swagger-out.json";
const endpointsFile = [
  "../app.js",
  "../features/auth/auth.route.js",
  "../features/users/user.route.js",
  "../features/events/event.route.js",
  "../features/categories/category.route.js",
  "../features/tickets/ticket.route.js",
  "../features/orders/order.route.js",
  "../features/payments/payment.route.js",
  "../features/notifications/notification.route.js",
];

swagger(outFile, endpointsFile, docs);
