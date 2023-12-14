const express = require("express");

const router = express.Router({ mergeParams: true });

const tourController = require("../services/tourServices");
const authController = require("../services/authService");
const tourValidationLayer = require("../utils/validators/tourValidator");
const reviewRoute = require("./reviewRoute");
const bookingRoute = require("./bookingRoute");

router.use("/:toursId/reviews", reviewRoute);
router.use("/:tourId/booking", bookingRoute);

router
  .route("/")
  .get(tourController.createFilterObj, tourController.getAllTours)
  .post(
    authController.protect,
    authController.allowedTo("tour guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.setTourGuideIdToBody,
    tourValidationLayer.createTourValidationLayer,
    tourController.createTourRequest
  );

router
  .route("/:id")
  .get(
    tourValidationLayer.getTourValidationLayer,
    tourController.getSpecificTour
  )
  .put(
    authController.protect,
    authController.allowedTo("tour guide","admin"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourValidationLayer.updateTourValidationLayer,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.allowedTo("admin"),
    tourValidationLayer.deleteTourValidationLayer,
    tourController.deleteTour
  );

router
  .route("/admin/requests")
  .get(
    authController.protect,
    authController.allowedTo("admin"),
    tourController.getAllToursRequest
);
  
router
  .route("/admin/requests/approve/:tourId")
  .put(
    authController.protect,
    authController.allowedTo("admin"),
    tourController.approveTourRequestes
  );

  router
    .route("/admin/requests/reject/:tourId")
    .put(
      authController.protect,
      authController.allowedTo("admin"),
      tourController.rejectTourRequestes
    );

module.exports = router;
 