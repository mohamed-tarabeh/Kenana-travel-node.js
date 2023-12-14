const { check } = require("express-validator");
const validationMiddleware = require("../../middleware/validationLayerMiddleware");
const Review = require("../../models/reviewModel")

const createReviewValidator = [
  check("title").optional(),
  check("ratings")
    .notEmpty()
    .withMessage("please provide ratings")
    .isFloat({ min: 1, max: 5 })
    .withMessage("ratings must be between 1 and 5"),
  check("user")
    .isMongoId()
    .withMessage("invalid user id format"),
  check("tour")
    .isMongoId()
    .withMessage("invalid tour id format")
    // check if logged user has only one review for each product
    .custom((val, { req }) => {
      return Review.findOne({ user: req.user._id, tour: req.body.tour }).then((review) => {

        if (review) {
          return Promise.reject(new Error("you already created a review for this product"))
        }
      })
    })
  ,
  validationMiddleware
]

const getReviewValidator = [
  check("id").isMongoId().withMessage("invalid review id format"),
  validationMiddleware
]

const updateReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("invalid review id format")
    .custom((val, { req }) => {
      //check review ownership before update
      return Review.findById(val).then((review) => {
        if (!review) {
          return Promise.reject(new Error(`there is no review for this id:${val}`))
        }
        if (review.user._id.toString() !== req.user._id.toString()) {
          return Promise.reject(new Error("you dont have the ownership of this review"))
        }
      })
    }),
  validationMiddleware
]

const deleteReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("invalid review id format")
    .custom((val, { req }) => {
      if (req.user.role === "user") {
        return Review.findById(val).then((review) => {
          if (!review) {
            return Promise.reject(new Error(`there is no review for this id:${val}`))
          }
          if (review.user._id.toString() !== req.user._id.toString()) {
            return Promise.reject(new Error("you dont have the ownership of this review"))
          }
        })
      }
      return true
    }),
  validationMiddleware
]

module.exports = {
  createReviewValidator,
  getReviewValidator,
  updateReviewValidator,
  deleteReviewValidator
}