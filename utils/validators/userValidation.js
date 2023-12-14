const bcrypt = require("bcryptjs");

const { check } = require("express-validator");
const slugify = require("slugify");
const validationMiddleware = require("../../middleware/validationLayerMiddleware");
const User = require("../../models/userModel");

const getUserValidator = [
  check("id").isMongoId().withMessage("Invalid tour id format"),
  validationMiddleware,
];

const createUserValidator = [
  check("fullName")
    .notEmpty()
    .withMessage("user full name is required")
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
    .withMessage("you phone number should be belong ro Egypt or Saida arabia  ")
    .custom(async (val) => {
      const phone = await User.findOne({ phoneNumber: val });
      if (phone) {
        return Promise.reject(new Error("this phone is already exist"));
      }
    }),

  check("role")
    .notEmpty()
    .withMessage("user role is required")
    .isIn(["user", "tour guide", "admin"])
    .withMessage("user role should be user or tour guide or admin"),

  check("profileImg").notEmpty().withMessage("your profile image is required"),
  validationMiddleware,
];

const updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid tour id format"),

  check("username")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("user email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  check("role")
    .optional()
    .isIn(["user", "tour guide", "admin"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),

  check("phoneNumber")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("you phone number should be belong ro Egypt or Saida arabia  ")
    .custom(async (val) => {
      const phone = await User.findOne({ phoneNumber: val });
      if (phone) {
        return Promise.reject(new Error("this phone is already exist"));
      }
    }),
  validationMiddleware,
];

const deleteUserValidator = [
  check("id").isMongoId().withMessage("Invalid tour id format"),
  validationMiddleware,
];

const updateUserPasswordValidator = [
  check("id").isMongoId().withMessage("Invalid tour id format"),

  check("currentPassword")
    .notEmpty()
    .withMessage("please enter your current password "),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("please enter your password confirmation"),

  check("newPassword")
    .notEmpty()
    .withMessage("please enter your new password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least  characters")
    .isLength({ max: 24 })
    .withMessage("Password must be at most 24 characters")
    .custom(async (val, { req }) => {
      // verify current password
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new Error("there is no user for this id");
      }

      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password");
      }

      // 2- verify password confirm
      if (val !== req.body.passwordConfirm) {
        throw new Error("password confirmation incorrect");
      }
      return true;
    }),

  validationMiddleware,
];

const updateLoggedUserPasswordValidator = [
  check("currentPassword")
    .notEmpty()
    .withMessage("please enter your current password "),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("please enter your password confirmation"),

  check("newPassword")
    .notEmpty()
    .withMessage("please enter your new password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least  characters")
    .custom(async (val, { req }) => {
      // verify current password
      const user = await User.findById(req.user._id);
      if (!user) {
        throw new Error("there is no user for this id");
      }

      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password");
      }

      // 2- verify password confirm
      if (val !== req.body.passwordConfirm) {
        throw new Error("password confirmation incorrect");
      }
      return true;
    }),

  validationMiddleware,
];

const updateLoggedUserDataValidator = [
  check("fullName")
    .optional()
    .isLength({ min: 4 })
    .withMessage("full name should be at lest 20 characters ")
    .isLength({ max: 20 })
    .withMessage("full name should be at maximum 20 characters")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .custom(async (val) => {
      const email = await User.findOne({ email: val });
      if (email) {
        return Promise.reject(new Error("email is already exist"));
      }
    }),

  check("phoneNumber")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("you phone number should be belong ro Egypt or Saida arabia  ")
    .custom(async (val) => {
      const userPhone = await User.findOne({ phoneNumber: val });
      if (userPhone) {
        return Promise.reject(new Error("this phone is already exist"));
      }
    }),

  validationMiddleware,
];

module.exports = {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  updateUserPasswordValidator,
  updateLoggedUserPasswordValidator,
  updateLoggedUserDataValidator,
};
