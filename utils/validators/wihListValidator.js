const { check } = require("express-validator");
const validationMiddleware = require("../../middleware/validationLayerMiddleware");

exports.addTourValidator = [
  check("tourId")
    .isMongoId()
    .withMessage("invalid id format"),
  validationMiddleware
]

exports.removeTourValidator = [
  check("tourId")
    .isMongoId()
    .withMessage("invalid id format"),
  validationMiddleware
]
