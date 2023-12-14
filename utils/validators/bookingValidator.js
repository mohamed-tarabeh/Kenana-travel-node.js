const { check } = require("express-validator");
const Booking = require("../../models/bookingModel");
const validationMiddleware = require("../../middleware/validationLayerMiddleware");

const getSpecificBookingValidator = [
  check("id").isMongoId().withMessage("Invalid booking id format"),
  validationMiddleware,
];

const deleteSpecificBookingValidator = [
  check("id").isMongoId().withMessage("Invalid booking id format"),
  validationMiddleware,
];

const updateSpecificBookingValidator = [
  check("id").isMongoId().withMessage("Invalid booking id format"),
  validationMiddleware,
];

const addBookingDetailsValidator = [
  check("tourType")
    .notEmpty()
    .withMessage("tour type is required")
    .isIn(["private", "family", "collective"])
    .withMessage("Invalid tour type"),

  check("date").notEmpty().withMessage("Booking date is required"),
  check("time").notEmpty().withMessage("Booking Time is required"),

  check("participants.adults")
    .optional()
    .isInt()
    .withMessage("Number of adults should be an integer"),

  check("participants.youth")
    .optional()
    .isInt()
    .withMessage("Number of youth should be an integer"),

  check("participants.children")
    .optional()
    .isInt()
    .withMessage("Number of children should be an integer"),

  validationMiddleware,
];

const addBookingCheckOutValidator = [
  check("tourId")
    .isMongoId()
    .withMessage("Invalid Tour Id for Format for booking"),
  check("paymentMethod")
    .notEmpty()
    .withMessage("choose payment method for booking")
    .isIn(["visa or mastercard", "carrier_billing"])
    .withMessage("Invalid payment method"),
  validationMiddleware,
];

module.exports = {
  getSpecificBookingValidator,
  deleteSpecificBookingValidator,
  updateSpecificBookingValidator,
  addBookingDetailsValidator,
  addBookingCheckOutValidator,
};
