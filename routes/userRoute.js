const express = require("express");
const multer = require("multer");

const router = express.Router();
const userController = require("../services/userServices");
const authController = require("../services/authService");
const userValidationLayer = require("../utils/validators/userValidation");
const toursRoute = require("./tourRoute");

//////////////////////////////
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("invalid image file!", false);
  }
};
const uploads = multer({ storage, fileFilter });
//////////////////////////////

// un protected route
router.route("/").get(userController.getAllUsers);

// make all routes accessible by logged in users
router.use(authController.protect);

/////////////////////// User /////////////////////////

router.get(
  "/getMe",
  userController.getLoggedUserData,
  userController.getSpecificUser
);

router.put(
  "/change-my-password",
  userValidationLayer.updateLoggedUserPasswordValidator,
  userController.updateLoggedUserPassword
);

router.put(
  "/updateMe",
  userValidationLayer.updateLoggedUserDataValidator,
  userController.updateLoggedUserData
);

router.post("/logout", userController.deleteLoggedUserData);

router.use("/:userId/tours", toursRoute);

router.post(
  "/upload-image",
  uploads.single("image"),
  userController.uploadProfileImg
);

/////////////////////// Admin /////////////////////////
router.use(authController.allowedTo("admin"));

router.get("/tour-guide-requests", userController.getAllGuidesJoinRequestes);
router.put(
  "/tour-guide-requests/approve/:userId",
  userController.approveGuidesJoinRequestes
);

router.put(
  "/tour-guide-requests/reject/:userId",
  userController.rejectGuidesJoinRequestes
);

router.put(
  "/update-password/:id",
  userValidationLayer.updateUserPasswordValidator,
  userController.updateUserPassword
);

router.post(
  "/",
  userController.uploadTourImageCover,
  userController.resizeImg,
  userValidationLayer.createUserValidator,
  userController.createUser
);

router
  .route("/:id")
  .get(userValidationLayer.getUserValidator, userController.getSpecificUser)
  .put(
    userController.uploadTourImageCover,
    userController.resizeImg,
    userValidationLayer.updateUserValidator,
    userController.updateUser
  )
  .delete(userValidationLayer.deleteUserValidator, userController.deleteUser);

module.exports = router;
