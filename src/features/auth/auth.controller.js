const registerAttendee = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }
    const result = await authService.registerAttendee(req.body);
    return res.status(201).json({
      success: true,
      message: "Attendee registration successful",
      data: result,
    });
  } catch (error) {
    if (error.message === "Email is already registered") {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const registerOrganizer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }
    const result = await authService.registerOrganizer(req.body);
    return res.status(201).json({
      success: true,
      message: "Organizer registration successful",
      data: result,
    });
  } catch (error) {
    if (error.message === "Email is already registered") {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const registerAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }
    const result = await authService.registerAdmin(req.body);
    return res.status(201).json({
      success: true,
      message: "Admin registration successful",
      data: result,
    });
  } catch (error) {
    if (error.message === "Email is already registered") {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }
    const result = await authService.forgotPassword(req.body.email);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerAttendee,
  registerOrganizer,
  registerAdmin,
  forgotPassword,
};