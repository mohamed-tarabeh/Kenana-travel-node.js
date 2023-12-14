const express = require("express");

const router = express.Router();
const userController = require("../services/userServices");
const authController = require("../services/authService");
const userValidationLayer = require("../utils/validators/userValidation");
const toursRoute = require("./tourRoute");

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

router.post(
  "/logout",
  userController.deleteLoggedUserData
);

router.use("/:userId/tours", toursRoute);

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

router
  .route("/")
  .get(userController.getAllUsers)
  .post(
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
