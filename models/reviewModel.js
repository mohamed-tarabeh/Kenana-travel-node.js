const mongoose = require("mongoose");

const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    ratings: {
      type: Number,
      min: [1, "min rating value is 1"],
      max: [5, "max rating value is 5"],
      required: [true, "please provide ratings"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "please provide user ID"],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "please provide tour ID"],
    },
  },
  {
    timestamps: true,
    // to enable virtual populate
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//to make virtual field for avatar from user model
reviewSchema.virtual("avatar", {
  ref: "User",
  foreignField: "avatar",
  localField: "_id",
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "fullName" });
  next();
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "tour", select: "title" });
  next();
});

reviewSchema.statics.calcAverageRatingsAndQuantity = async function (tourId) {
  const result = await this.aggregate([
    // Stage 1 : get all reviews in specific product
    {
      $match: { tour: tourId },
    },
    // Stage 2: Grouping reviews based on productID and calc avgRatings, ratingsQuantity
    {
      $group: {
        _id: "tour",
        avgRatings: { $avg: "$ratings" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  // console.log(result);
  if (result.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: result[0].avgRatings,
      ratingsQuantity: result[0].ratingsQuantity,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

module.exports = mongoose.model("Review", reviewSchema);
