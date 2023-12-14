const express = require("express");


const reviewController = require("../services/reviewService");

const {
  createReviewValidator,
  getReviewValidator,
  updateReviewValidator,
  deleteReviewValidator
} = require("../utils/validators/reviewValidator")

const authService = require('../services/authService');

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(
    reviewController.createFilterObj, reviewController.getAllReviews)
  .post(
    authService.protect,
    authService.allowedTo("user"),
    reviewController.setTourAndUserIdToBody,
    createReviewValidator,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(getReviewValidator, reviewController.getSpecificReview)
  .put(
    authService.protect,
    authService.allowedTo("user"),
    updateReviewValidator,
    reviewController.updateReview
  )
  .delete(
    authService.protect,
    authService.allowedTo("user", "manager", "admin"),
    deleteReviewValidator,
    reviewController.deleteReview
  );

module.exports = router;
