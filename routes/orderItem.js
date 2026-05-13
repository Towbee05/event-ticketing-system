const express = require("express");
const routes = express.Router();
const {
  createOrderItem,
  getOrderItems,
  getOrderItem,
  updateOrderItem,
  deleteOrderItem,
} = require("../controllers/orderItem");

routes.post("/", createOrderItem);
routes.get("/", getOrderItems);
routes.get("/:id", getOrderItem);
routes.put("/:id", updateOrderItem);
routes.delete("/:id", deleteOrderItem);

module.exports = routes;
