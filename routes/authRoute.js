const express = require("express");

const router = express.Router();
const authController = require("../services/authService");
const authValidationLayer = require("../utils/validators/authValidator");

router.post(
  "/login",
  authValidationLayer.logInUserValidator,
  authController.login
);

router.post(
  "/signup",
  authValidationLayer.signUpUserValidator,
  authController.signUp
);

router.post("/signup-verify-code", authController.signUpVerifyCode);

router.post(
  "/tour-guide-signup",
  authController.protect,
  authController.uploadTourGuideIdPhoto,
  authController.resizeTourGuideIdPhoto,
  authValidationLayer.signUpTourGuideValidator,
  authController.signUpTourGuide
);

router.post(
  "/forgot-password",
  authValidationLayer.forgotPasswordValidator,
  authController.forgotPassword
);

router.post("/verify-reset-code", authController.verifyPassResetCode);

router.put(
  "/reset-password",
  authValidationLayer.resetPasswordValidator,
  authController.resetPassword
);

module.exports = router;