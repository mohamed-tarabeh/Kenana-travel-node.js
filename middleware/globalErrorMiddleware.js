const AppError = require("../utils/appError");

// function return err shape for development mode
const sendErrorForDev = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });

// function return err shape for production mode
const sendErrorForPro = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });

// handel error if token changed in production environment
const handelJwtInvalidSignature = () =>
  new AppError("invalid token , please login again", 401);

// handel error if token expired in production environment
const handelJwtTokenExpire = () =>
  new AppError("token expired , please login again", 401);

const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else {
    if (err.name === "JsonWebTokenError") err = handelJwtInvalidSignature();
    if (err.name === "TokenExpiredError") err = handelJwtTokenExpire();
    sendErrorForPro(err, res);
  }
};

module.exports = globalError;
