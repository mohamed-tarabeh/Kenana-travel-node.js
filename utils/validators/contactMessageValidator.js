const { check } = require("express-validator");
const validationMiddleware = require("../../middleware/validationLayerMiddleware");

const sendContactMessageValidation = [
  check("fullName").notEmpty().withMessage("Please enter your full name"),

  check("phoneNumber")
    .notEmpty()
    .withMessage("Please enter your phone number")
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(
      "you phone number should be belong ro Egypt or Saida arabia  "
    ),

  check("email")
    .notEmpty()
    .withMessage("user email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  check("message").notEmpty().withMessage("please enter your inquiry "),

  validationMiddleware,
];

const replayToContactMessageValidation = [
  check("messageId").isMongoId().withMessage("invalid message id format "),
  check("adminReply")
    .notEmpty()
    .withMessage("please write a message reply to the user "),
  validationMiddleware,
];

module.exports = {
  sendContactMessageValidation,
  replayToContactMessageValidation,
};
