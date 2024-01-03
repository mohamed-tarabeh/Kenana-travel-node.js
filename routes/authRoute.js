const express = require("express");

const router = express.Router();
const multer = require("multer");
const authController = require("../services/authService");
const authValidationLayer = require("../utils/validators/authValidator");

////////////////////////////
const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb('invalid image file!', false);
  }
};
const uploads = multer({ storage, fileFilter });
/////////////////////////////

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

router.post(
  "/upload-IdPhoto",
  authController.protect,
  uploads.array("idPhoto", 2),
  authController.uploadIdPhoto
);

module.exports = router;