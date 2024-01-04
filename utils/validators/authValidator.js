const { check } = require("express-validator");
const slugify = require("slugify");
const validationMiddleware = require("../../middleware/validationLayerMiddleware");
const User = require("../../models/userModel");

const signUpUserValidator = [
  check("fullName")
    .notEmpty()
    .withMessage("username is required")
    .isLength({ min: 4 })
    .withMessage("Too short username ")
    .isLength({ max: 20 })
    .withMessage("Too long  username")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("user email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .custom(async (val) => {
      const email = await User.findOne({ email: val });
      if (email) {
        return Promise.reject(new Error("email is already exist"));
      }
    }),

  check("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .isLength({ max: 24 })
    .withMessage("Password must be at most 24 characters")
    .custom((val, { req }) => {
      if (val !== req.body.passwordConfirm) {
        throw new Error("password confirmation incorrect");
      }
      return true;
    }),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("please enter your password confirmation"),

  check("phoneNumber")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("you phone number should be belong ro Egypt or Suiad arabia  ")
    .custom(async (val) => {
      const phone = await User.findOne({ phoneNumber: val });
      if (phone) {
        return Promise.reject(new Error("this phone is already exist"));
      }
    }),
  validationMiddleware,
];

const logInUserValidator = [
  check("email")
    .notEmpty()
    .withMessage("User email or phone number is required"),

  check("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6, max: 24 })
    .withMessage("Password must be between 6 and 24 characters"),

  validationMiddleware,
];

const signUpTourGuideValidator = [
  check("idNumber")
    .notEmpty()
    .withMessage("ID number is required")
    .custom(async (val) => {
      // check is used before or not
      const idNumber = await User.findOne({ idNumber: val });
      if (idNumber) {
        return Promise.reject(
          new Error("Incorrect, please enter a valid id number")
        );
      }

      return true;
    }),

  check("city").notEmpty().withMessage("City is required"),

  check("language").notEmpty().withMessage("Language is required"),

  check("description")
    .notEmpty()
    .withMessage(
      "Description is required, please describe you and your travels"
    )
    .isLength({ min: 6, max: 24 })
    .withMessage("description must be between 6 and 24 characters"),

  check("idPhoto").notEmpty().withMessage("ID photo is required"),
  validationMiddleware,
];

const forgotPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("please enter your email to reset your password")
    .isEmail()
    .withMessage("Invalid email format"),
  validationMiddleware,
];

const resetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("please enter your email to reset your password")
    .isEmail()
    .withMessage("Invalid email format"),

  check("newPassword")
    .notEmpty()
    .withMessage("Please enter your new password")
    .isLength({ min: 6 })
    .withMessage("your password should at least a combinations of 6 characters")
    .custom((val, { req }) => {
      if (val !== req.body.newPasswordConfirm) {
        throw new Error("password confirmation incorrect");
      }
      return true;
    }),

  check("newPasswordConfirm")
    .notEmpty()
    .withMessage("Please enter your new password confirmation"),
  validationMiddleware,
];

module.exports = {
  signUpUserValidator,
  signUpTourGuideValidator,
  logInUserValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
