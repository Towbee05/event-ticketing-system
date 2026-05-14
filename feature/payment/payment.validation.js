import Joi from "joi";

// initialize the validation schema for payment
export const initializePaymentSchema = Joi.object({
  orderId: Joi.string().required(),
});

// verify payment validation schema
export const verifyPaymentSchema = Joi.object({
  reference: Joi.string().required(),
});
