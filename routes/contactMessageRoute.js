const express = require("express");

const router = express.Router();

const contactController = require("../services/contactMessageController");
const authController = require("../services/authService");
const bookingValidationLayer = require("../utils/validators/contactMessageValidator");

router.post(
  "/",
  bookingValidationLayer.sendContactMessageValidation,
  contactController.sendContactMessage
);

router.use(authController.protect, authController.allowedTo("admin"));

router.get("/admin", contactController.getAllContacts);

router
  .route("/admin/:id")
  .get(contactController.getSpecificContact)
  .delete(contactController.deleteSpecificContact);

router.post(
  "/admin/:messageId/reply",
  bookingValidationLayer.replayToContactMessageValidation,
  contactController.replayToContactMessage
);

module.exports = router;
