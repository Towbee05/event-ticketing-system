// Wraps async route/controller handlers so thrown errors flow to the error middleware
// instead of needing a try/catch in every controller.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
