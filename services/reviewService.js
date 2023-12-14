const Review = require("../models/reviewModel");
const factory = require("./handlersFactory");

const createFilterObj = (req, res, next) => {
  // Check if userId is provided in params
  let filterObject = {};
  if (req.params.toursId) {
    filterObject = { tour: req.params.toursId };
    req.filterObj = filterObject;
  }
  next();
};

// @desc    get all review
// @route   get /api/v1/reviews
// @access  public
const getAllReviews = factory.getAll(Review);

// @desc    get specific reviews
// @route   get /api/v1/review/:id
// @access  public
const getSpecificReview = factory.getOne(Review, "avatar");

const setTourAndUserIdToBody = (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.toursId;
  }
  if (!req.body.user) {
    req.body.user = req.user._id;
  }
  next();
};

// @desc    create user review
// @route   post /api/v1/review
// @access  Private/protect/user
const createReview = factory.createOne(Review);

// @desc    update specific review
// @route   put /api/v1/review/:id
// @access  Private/protect/user
const updateReview = factory.updateOne(Review);

// @desc    delete specific review
// @route   delete /api/v1/review/:id
// @access  Private/protect/user-admin-manager
const deleteReview = factory.deleteOne(Review);

module.exports = {
  createReview,
  getAllReviews,
  getSpecificReview,
  updateReview,
  deleteReview,
  createFilterObj,
  setTourAndUserIdToBody,
};
