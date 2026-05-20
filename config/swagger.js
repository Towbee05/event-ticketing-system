const swagger = require("swagger-autogen")();
const dotenv = require("dotenv");
dotenv.config();

const docs = {
  info: {
    version: "v1.0",
    title: "Event Management and Ticketing System",
    description:
      "This API docs is for an event management and ticketing system, which handles event booking, browsing of events, purchase of tickets, and so on.",
  },
  host: `localhost:${process.env.PORT}`,
  basePath: "/",
  schemes: ["http", "https"],
  tags: [
    {
      name: "Authentication",
      description: "Endpoints for user authentication and token management",
    },
  ],
  securityDefinitions: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
};

const outFile = "../swagger-out.json";
const endpointsFile = ["../app.js"];

swagger(outFile, endpointsFile, docs);
