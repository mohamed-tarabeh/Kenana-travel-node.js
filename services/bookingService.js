const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const Booking = require("../models/bookingModel");
const factory = require("./handlersFactory");
const AppError = require("../utils/appError");
const Tour = require("../models/tourModel");
const User = require("../models/userModel");

// @desc    get all bookings
// @route   get /api/v1/bookings
// @access  protected/admin
const getAllBookings = factory.getAll(Booking);

// @desc    get specific booking
// @route   get /api/v1/booking/:id
// @access  protected/user
const getSpecificBooking = factory.getOne(Booking);

// @desc    update specific booking
// @route   put /api/v1/booking/:id
// @access  protect/admin
const updateBooking = factory.updateOne(Booking);

// @desc    delete specific booking
// @route   delete /api/v1/booking/:id
// @access  protect/user-admin
const deleteBooking = factory.deleteOne(Booking);

// Temporary variable to store booking details
let temporaryBooking = {};

// @desc    user add booking details
// @route   post /api/v1/tour/tourId/booking/booking-details
// @access  protect/user
const addBookingDetails = asyncHandler(async (req, res, next) => {
  const {
    tourType,
    date,
    time,
    participants: { adults, youth, children },
  } = req.body;

  temporaryBooking = {
    tourType,
    date,
    time,
    participants: { adults, youth, children },
  };

  res.status(200).json({ status: "success" });
});

// @desc    user add booking check Out
// @route   post /api/v1/tour/tourId/booking/checkout
// @access  protect/user
const addBookingCheckOut = asyncHandler(async (req, res, next) => {
  const { paymentMethod } = req.body;

  temporaryBooking = { ...temporaryBooking, paymentMethod };

  res.status(200).json({ status: "success" });
});

// @desc    user add booking payment
// @route   post /api/v1/tour/tourId/booking/checkout-session
// @access  protect/user
const checkoutSession = asyncHandler(async (req, res, next) => {
  const { tourId } = req.params;

  temporaryBooking = {
    ...temporaryBooking,
  };

  // get tour depond on tourId
  const tour = await Tour.findOne({ _id: tourId });
  if (!tour) {
    return next(AppError(`there is no tour with id: ${tourId}`));
  }

  // app setting (calculate total price booking)
  const tourPrice = tour.price;
  let participantsTotalPrice;

  if (temporaryBooking.tourType === "private") {
    participantsTotalPrice = tourPrice;
  } else {
    
    const adults = temporaryBooking.participants.adults || 0;
    const youth = temporaryBooking.participants.youth || 0;
    const children = temporaryBooking.participants.children || 0;

    participantsTotalPrice = tourPrice * (adults + youth + children);
  }

  const taxes = participantsTotalPrice * (20 / 100);
  const serviceFee = participantsTotalPrice * (5 / 100);
  const totalBookingPrice = participantsTotalPrice + taxes + serviceFee;

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: tour.title,
            description: tour.description,
          },
          unit_amount: totalBookingPrice * 100, // Amount should be in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `http://localhost:8080/`,
    cancel_url: `${req.protocol}://${req.get("host")}/user`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
  });

  // send session to response
  res.status(200).json({ status: "success", session });
});

const createBookingOrder = async (session) => {
  try {
    const totalBookingPrice = session.amount_total / 100;
    const tour = await Tour.findById(session.client_reference_id);
    const user = await User.findOne({ email: session.customer_email });

    temporaryBooking = {
      ...temporaryBooking,
      user: user._id,
      tour: tour._id,
      totalBookingPrice,
    };

    const booking = await Booking.create(temporaryBooking);

    booking.paymentStatus = "completed";
    booking.bookingStatus = "confirmed";
    await booking.save();

    // Return the created booking
    return booking;
  } catch (error) {
    if (error.name === "ValidationError") {
      console.error("Validation Error:", error.message);
    } else {
      console.error("Unhandled Error:", error);
    }
  }
};

// @desc    webhok event that will be fired when stripe payment is completed
// @route   post /webhook-checkout
// @access  protect/user
const webhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    // create booking
    createBookingOrder(event.data.object);
  }

  res.status(201).json({
    stsus: "success",
    message: "you pay for tour successfully, have a nice trip",
  });
});

// @desc    Get user's past bookings
// @route   GET /api/v1/bookings/past
// @access  Protected/User
const getUserPastBookings = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const pastBookings = await Booking.find({
    user: userId,
    date: { $lt: new Date() },
  }).sort({ date: "desc" });

  res
    .status(200)
    .json({ success: true, result: pastBookings.length, data: pastBookings });
});

// @desc    Get user's upcoming bookings
// @route   GET /api/v1/bookings/upcoming
// @access  Protected/User
const getUserUpcomingBookings = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const upcomingBookings = await Booking.find({
    user: userId,
    date: { $gte: new Date() },
  }).sort({ date: "asc" });

  res.status(200).json({
    success: true,
    result: upcomingBookings.length,
    data: upcomingBookings,
  });
});

// @desc    Cancel a booking
// @route   DELETE /api/v1/booking/:id/cancel
// @access  Protected/User
const cancelBooking = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const bookingId = req.params.id;

  const booking = await Booking.findOne({ _id: bookingId, user: userId });

  if (!booking) {
    next(new AppError("you not book this tour to cancel it yet"));
  }

  // Change booking status to 'cancelled'
  booking.bookingStatus = "cancelled";
  await booking.save();

  res
    .status(200)
    .json({ success: true, message: "Booking cancelled successfully" });
});

module.exports = {
  getAllBookings,
  getSpecificBooking,
  updateBooking,
  deleteBooking,
  addBookingDetails,
  addBookingCheckOut,
  checkoutSession,
  getUserPastBookings,
  getUserUpcomingBookings,
  cancelBooking,
  webhookCheckout,
};
