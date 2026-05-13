const Ticket = require("../models/Tickets");

exports.createTicket = async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);
    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    } else {
      res.status(200).json({
        success: true,
        data: ticket,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    } else {
      res.status(200).json({
        success: true,
        data: ticket,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    } else {
      res.status(200).json({
        success: true,
        data: {},
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
