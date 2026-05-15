const Joi = require("joi");

// initialize the validation schema for payment
const initializePaymentSchema = Joi.object({
  orderId: Joi.string().required(),
});

// verify payment validation schema
const verifyPaymentSchema = Joi.object({
  reference: Joi.string().required(),
});

module.exports = {
  initializePaymentSchema,
  verifyPaymentSchema,
};
