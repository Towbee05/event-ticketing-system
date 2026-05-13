const OrderItems = require("../models/OrderItem");
const tickets = require("../models/Tickets");

exports.createOrderItem = async (req, res) => {
  try {
    const { orderId, ticketId, quantity, price, subTotal } = req.body;

    const ticket = await tickets.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    }

    const ifavailable = ticket.quantity - ticket.sold;
    if (quantity > ifavailable) {
      return res.status(400).json({
        success: false,
        error: "Not enough tickets available",
      });

      const existingOrderItem = await OrderItems.findOne({ orderId, ticketId });
        if (existingOrderItem) {
            
        }
    } else {
      const subTotal = quantity * price;
      const orderItem = await OrderItems.create({
        orderId,
        ticketId,
        quantity,
        unitPrice: price,
        subTotal,
      });
      return res.status(201).json({
        success: true,
        data: orderItem,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
