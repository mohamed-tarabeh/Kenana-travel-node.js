const mongoose = require("mongoose");

// Create schema
const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      unique: [true, "Tour must be unique"],
      trim: true,
      minlength: [6, "Tour name is too short"],
      maxlength: [1000, "Tour name is too long"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [100, "Tour description is too short"],
      maxlength: [2000, "Tour description is too long"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },
    limit: {
      type: Number,
      required: [true, "Limit is required"],
      min: [1, "Limit must be at least 1"],
    },
    availabilityTimes: {
      type: [String],
      required: [true, "Availability times are required"],
      validate: {
        validator: function (times) {
          return times.length > 0;
        },
        message: "At least one availability time must be provided",
      },
    },
    startLocation: {
      type: String,
      required: [true, "Start location is required"],
      trim: true,
    },
    program: {
      type: String,
      required: [true, "Program is required"],
      trim: true,
    },
    bringItems: {
      type: String,
      required: [true, "Bring items are required"],
      trim: true,
    },
    notBringItems: {
      type: String,
      required: [true, "Not bring items are required"],
      trim: true,
    },
    suitableFor: {
      type: String,
      required: [true, "Suitable for is required"],
      trim: true,
    },
    imageCover: {
      type: String,
      // required: [true, 'Image cover is required'],
    },
    gallary: {
      type: [String],
    },
    tourGuide: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      // required: [true, 'Tour must belong to a tour guide'],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating must be above or equal 1.0"],
      max: [5, "Rating must be below or equal 5.0"],
      set: (val) => Math.round(val * 10) / 10, // 3.3333 * 10 => 33.333 => 33 => 3.3
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    durations: {
      type: String,
      required: [true, " tour duration is required"],
    },
    maxGuests: {
      type: Number,
      required: [true, "tour maximum guest count is required"],
    },
    minimumAge: {
      type: Number,
      required: [true, "tour minimum age of guests is required"],
    },
  },
  {
    timestamps: true,

    // to enable virtual populate
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// Mongoose query middleware (pre) to populate tourGuide
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "tourGuide",
    select: "fullName -_id",
  });
  next();
});

// Mongoose query middleware (pre) to populate tourGuide on create
tourSchema.pre("save", function (next) {
  this.populate({
    path: "tourGuide",
    select: "fullName -_id",
  });
  next();
});

const setImageUrl = (doc) => {
  if (doc.imageCover) {
    const imgUrl = `${process.env.BASE_URL}/tours/${doc.imageCover}`;
    doc.imageCover = imgUrl;
  }

  if (doc.gallary) {
    const imagesUrl = [];
    doc.gallary.forEach((image) => {
      const imgUrl = `${process.env.BASE_URL}/tours/${image}`;
      imagesUrl.push(imgUrl);
    });
    doc.gallary = imagesUrl;
  }
};

// mongoose query middleware *post* to return url image
// findOne / getOne / getAll
tourSchema.post("init", (doc) => {
  setImageUrl(doc);
});

// in create
tourSchema.post("save", (doc) => {
  setImageUrl(doc);
});

// 2- create model
module.exports = mongoose.model("Tour", tourSchema);
