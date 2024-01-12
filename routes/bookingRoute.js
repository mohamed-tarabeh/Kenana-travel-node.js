const express = require("express");

const router = express.Router({ mergeParams: true });

const bookingController = require("../services/bookingService");
const authController = require("../services/authService");
const bookingValidationLayer = require("../utils/validators/bookingValidator");

router.use(authController.protect);

router.post(
  "/booking-details",
  authController.allowedTo("user"),
  bookingValidationLayer.addBookingDetailsValidator,
  bookingController.addBookingDetails
);

router.post(
  "/checkout",
  authController.allowedTo("user"),
  bookingValidationLayer.addBookingCheckOutValidator,
  bookingController.addBookingCheckOut
);

router.get(
  "/checkout-session",
  authController.allowedTo("user"),
  bookingController.checkoutSession
);

router.get(
  "/past",
  authController.allowedTo("user"),
  bookingController.getUserPastBookings
);

router.get(
  "/upcoming",
  authController.allowedTo("user"),
  bookingController.getUserUpcomingBookings
);

router.delete(
  "/:id/cancel",
  authController.allowedTo("user"),
  bookingController.cancelBooking
);

router
  .route("/")
  .get(authController.allowedTo("admin"), bookingController.getAllBookings);

router
  .route("/:id")
  .get(
    authController.allowedTo("user", "admin"),
    bookingValidationLayer.getSpecificBookingValidator,
    bookingController.getSpecificBooking
  )
  .put(
    authController.allowedTo("user", "admin"),
    bookingValidationLayer.updateSpecificBookingValidator,
    bookingController.updateBooking
  )
  .delete(
    authController.allowedTo("admin"),
    bookingValidationLayer.deleteSpecificBookingValidator,
    bookingController.deleteBooking
  );

module.exports = router;
