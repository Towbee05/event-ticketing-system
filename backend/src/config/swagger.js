const swagger = require("swagger-autogen")();
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const docs = {
  info: {
    version: "v1.0",
    title: "Event Management and Ticketing System",
    description:
      "Backend API for the Event Management & Ticketing System: events, ticket types, " +
      "orders with atomic inventory reservation, JWT auth, and role-based access control.",
  },
  host: `localhost:${process.env.PORT || 5000}`,
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
  "../routes/auth.route.js",
  "../routes/user.route.js",
  "../routes/event.route.js",
  "../routes/category.route.js",
  "../routes/ticket.route.js",
  "../routes/order.route.js",
  "../routes/payment.route.js",
  "../routes/notification.route.js",
];

swagger(outFile, endpointsFile, docs);
