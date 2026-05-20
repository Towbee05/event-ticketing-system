const express = require("express");
const router = express.Router();
const {
  signupAttendee,
  signupOrganizer,
  signupAdmin,
  loginAttendee,
  loginOrganizer,
  loginAdmin,
  refreshTokenHandler,
} = require("./auth.controller");

// #swagger.tags = ['Authentication']

router.post("/signup/attendee",
  /* #swagger.tags = ['Authentication'] */
  /* #swagger.summary = 'Signup as attendee' */
  /* #swagger.description = 'Create a new attendee account' */
  /* #swagger.parameters['body'] = { in: 'body', description: 'User registration details', schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } }, required: ['name', 'email', 'password'] } } */
  /* #swagger.responses[201] = { description: 'Account created successfully' } */
  /* #swagger.responses[400] = { description: 'Missing required fields' } */
  /* #swagger.responses[409] = { description: 'Duplicate email' } */
  signupAttendee
);

router.post("/signup/organizer",
  /* #swagger.tags = ['Authentication'] */
  /* #swagger.summary = 'Signup as organizer' */
  /* #swagger.description = 'Create a new organizer account' */
  /* #swagger.parameters['body'] = { in: 'body', description: 'User registration details', schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } }, required: ['name', 'email', 'password'] } } */
  /* #swagger.responses[201] = { description: 'Account created successfully' } */
  /* #swagger.responses[400] = { description: 'Missing required fields' } */
  /* #swagger.responses[409] = { description: 'Duplicate email' } */
  signupOrganizer
);

router.post("/signup/admin",
  /* #swagger.tags = ['Authentication'] */
  /* #swagger.summary = 'Signup as admin' */
  /* #swagger.description = 'Create a new admin account' */
  /* #swagger.parameters['body'] = { in: 'body', description: 'User registration details', schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } }, required: ['name', 'email', 'password'] } } */
  /* #swagger.responses[201] = { description: 'Account created successfully' } */
  /* #swagger.responses[400] = { description: 'Missing required fields' } */
  /* #swagger.responses[409] = { description: 'Duplicate email' } */
  signupAdmin
);

router.post("/login/attendee",
  /* #swagger.tags = ['Authentication'] */
  /* #swagger.summary = 'Login as attendee' */
  /* #swagger.description = 'Authenticate an attendee and receive an access token and a refresh token' */
  /* #swagger.parameters['body'] = { in: 'body', description: 'User login credentials', schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } */
  /* #swagger.responses[200] = { description: 'Login successful, returns access token, refresh token and user data' } */
  /* #swagger.responses[400] = { description: 'Missing required fields' } */
  /* #swagger.responses[401] = { description: 'Invalid email or password' } */
  /* #swagger.responses[403] = { description: 'Account is not registered as attendee' } */
  loginAttendee
);

router.post("/login/organizer",
  /* #swagger.tags = ['Authentication'] */
  /* #swagger.summary = 'Login as organizer' */
  /* #swagger.description = 'Authenticate an organizer and receive an access token and a refresh token' */
  /* #swagger.parameters['body'] = { in: 'body', description: 'User login credentials', schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } */
  /* #swagger.responses[200] = { description: 'Login successful, returns access token, refresh token and user data' } */
  /* #swagger.responses[400] = { description: 'Missing required fields' } */
  /* #swagger.responses[401] = { description: 'Invalid email or password' } */
  /* #swagger.responses[403] = { description: 'Account is not registered as organizer' } */
  loginOrganizer
);

router.post("/login/admin",
  /* #swagger.tags = ['Authentication'] */
  /* #swagger.summary = 'Login as admin' */
  /* #swagger.description = 'Authenticate an admin and receive an access token and a refresh token' */
  /* #swagger.parameters['body'] = { in: 'body', description: 'User login credentials', schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } */
  /* #swagger.responses[200] = { description: 'Login successful, returns access token, refresh token and user data' } */
  /* #swagger.responses[400] = { description: 'Missing required fields' } */
  /* #swagger.responses[401] = { description: 'Invalid email or password' } */
  /* #swagger.responses[403] = { description: 'Account is not registered as admin' } */
  loginAdmin
);

router.post("/refresh-token",
  /* #swagger.tags = ['Authentication'] */
  /* #swagger.summary = 'Refresh access token' */
  /* #swagger.description = 'Exchange a valid refresh token for a new access token and a new refresh token (token rotation)' */
  /* #swagger.parameters['body'] = { in: 'body', description: 'Refresh token', schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } } */
  /* #swagger.responses[200] = { description: 'Token refreshed successfully, returns new access token and new refresh token' } */
  /* #swagger.responses[400] = { description: 'Refresh token is required' } */
  /* #swagger.responses[401] = { description: 'Invalid or expired refresh token' } */
  refreshTokenHandler
);

module.exports = router;
