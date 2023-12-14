const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // General booking details
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "user booking is required"],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "tour booking is required"],
    },
    tourType: {
      type: String,
      enum: ["private", "family", "collective"],
      required: [true, "select your tour type"],
    },
    date: {
      type: Date,
      required: [true, "booking date is required"],
    },
    time: {
      type: String,
      required: [true, "booking time is required"],
    },
    participants: {
      adults: { type: Number, default: 0 },
      youth: { type: Number, default: 0 },
      children: { type: Number, default: 0 },
    },

    // app setting monay
    totalBookingPrice: Number,
    taxes: Number,
    serviceFee: Number,

    // Payment-related details
    paymentMethod: {
      type: String,
      enum: ["visa or mastercard", "carrier_billing"],
      required: [true, "payment method is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "refunded", "failed"],
      default: "pending",
    },

    // Booking status
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "fullName email role",
  }).populate({
    path: "tour",
    select: "title city price tourGuide",
  });

  next();
});


module.exports = mongoose.model("Booking", bookingSchema);
