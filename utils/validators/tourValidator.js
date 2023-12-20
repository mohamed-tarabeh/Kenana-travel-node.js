const { check } = require("express-validator");
const slugify = require("slugify");
const validationMiddleware = require("../../middleware/validationLayerMiddleware");
const User = require("../../models/userModel");
const Tour = require("../../models/tourModel");

const getTourValidationLayer = [
  check("id").isMongoId().withMessage("Invalid tour id format"),
  validationMiddleware,
];

const createTourValidationLayer = [
  check("title")
    .notEmpty()
    .withMessage("tour title is require")
    .isLength({ max: 1000 })
    .withMessage("too long tour title")
    .isLength({ min: 32 })
    .withMessage("too short tour title")
    .custom(async (val, { req }) => {
      await Tour.findOne({ title: req.body.title }).then((duplicatedTitle) => {
        if (duplicatedTitle) {
          return Promise.reject(
            new Error(
              "tour is already exists with same title name, enter another one"
            )
          );
        }
      });
    })
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check("city").notEmpty().withMessage("please enter tour city.."),
  check("description")
    .notEmpty()
    .withMessage("please enter tour description..")
    .isLength({ min: 10 })
    .withMessage("tour description is too short")
    .isLength({ max: 4000 })
    .withMessage("tour description is too long"),
  check("price")
    .notEmpty()
    .withMessage("please enter tour price..")
    .isNumeric()
    .withMessage("tour price must be number"),
  check("limit")
    .notEmpty()
    .withMessage("please enter tour limit..")
    .isNumeric()
    .withMessage("tour limit must be number"),
  check("availabilityTimes")
    .notEmpty()
    .withMessage("Availability times are required"),
  check("startLocation").notEmpty().withMessage("Start location is required"),
  check("program")
    .notEmpty()
    .withMessage("tour program is required")
    .isLength({ min: 32 })
    .withMessage("tour program is too short")
    .isLength({ max: 2000 })
    .withMessage("tour program is too long"),
  check("bringItems").optional(),
  check("notBringItems").optional(),
  check("suitableFor").optional(),
  check("imageCover").notEmpty().withMessage("tour image cover is required"),
  check("gallary").notEmpty().withMessage("at least one image is needed"),
  check("tourGuide")
    .isMongoId()
    .withMessage("invalid tour guide id")
    .notEmpty()
    .withMessage("Tour guide ID is required")
    .custom((tourGuideId) =>
      User.findById(tourGuideId).then((tourGuide) => {
        if (!tourGuide) {
          return Promise.reject(
            new Error(`no tour guide for this id : ${tourGuideId}`)
          );
        }
      })
    ),
  check("durations").notEmpty().withMessage("tour duration is required"),
  check("maxGuests")
    .notEmpty()
    .withMessage("tour maximum guest count is required")
    .isNumeric(),
  check("minimumAge")
    .notEmpty()
    .withMessage("tour minimum age of guests is required")
    .isNumeric(),

  validationMiddleware,
];

const updateTourValidationLayer = [
  check("title")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check("id").isMongoId().withMessage("Invalid tour id format"),
  validationMiddleware,
];

const deleteTourValidationLayer = [
  check("id").isMongoId().withMessage("Invalid tour id format"),
  validationMiddleware,
];

module.exports = {
  getTourValidationLayer,
  createTourValidationLayer,
  updateTourValidationLayer,
  deleteTourValidationLayer,
};
