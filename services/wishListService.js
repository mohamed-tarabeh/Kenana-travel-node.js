const asyncHandler = require("express-async-handler");
const User = require("../models/userModel")
// const AppError = require("../utils/appError");a



// @desc    Add Tour to wishList
// @route   POST /api/v1/wishlist
// @access  protected / user
exports.addTourToWishList = asyncHandler(async (req, res) => {
  // $addToSet if the tourId exist already ut will not add it again
  const user = await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: req.body.tourId } }, { new: true })
  res.status(200).json({
    status: "success",
    message: "product added successfully to your wishlist",
    data: user.wishlist
  })
})

// @desc    Remove Tour from wishList
// @route   POST /api/v1/wishlist/:id
// @access  protected / user
exports.removeTourFromWishList = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.tourId } }, { new: true })
  res.status(200).json({
    status: "success",
    message: "product removed successfully from your wishlist",
    data: user.wishList
  })
})

// @desc    get logged user wishlist
// @route   GET /api/v1/wishlist
// @access  protected / user
exports.getLoggedUserWishList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist")
  res.status(200).json({
    status: 'success',
    results: user.wishlist.length,
    data: user.wishlist,
  });
})



