const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");

const User = require("../models/userModel");
const factory = require("./handlersFactory");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/sendEmail");
const createToken = require("../utils/createToken");
const { uploadSingleImage } = require("../middleware/uploadImageMiddleware");

const uploadTourImageCover = uploadSingleImage("profileImg");

const resizeImg = asyncHandler(async (req, res, next) => {
  const fileName = `user-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(200, 200)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/users/${fileName}`);

    // save image to database
    req.body.profileImg = fileName;
  }

  next();
});

// @desc    get all users
// @route   get /api/v1/users
// @access  private / admin
const getAllUsers = factory.getAll(User, "User");

// @desc    get specific user
// @route   get /api/v1/user/:id
// @access  private / admin
const getSpecificUser = factory.getOne(User);

// @desc    create user tour
// @route   post /api/v1/users
// @access  private / admin
const createUser = factory.createOne(User);

// @desc    update specific user
// @route   put /api/v1/users/:id
// @access  private / admin
const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const updatedDoc = await User.findByIdAndUpdate(
    { _id: id },
    {
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      role: req.body.role,
      profileImg: req.body.profileImg,
    },
    {
      new: true,
    }
  );

  if (!updatedDoc) {
    return next(new AppError(`no Document for this id ${id}`, 404));
  }
  res.status(200).json({ success: true, data: updatedDoc });
});

// @desc    user change password
// @route   delete /api/v1/users/update-password/:id
// @access  private / admin
const updateUserPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const updatedDoc = await User.findByIdAndUpdate(
    { _id: id },
    {
      password: await bcrypt.hash(req.body.newPassword, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  if (!updatedDoc) {
    return next(new AppError(`no Document for this id ${id}`, 404));
  }
  res.status(200).json({ success: true, data: updatedDoc });
});

// @desc    delete specific user
// @route   delete /api/v1/users/:id
// @access  Private
const deleteUser = factory.deleteOne(User);

// @desc    get logged user data
// @route   Get /api/v1/users/getMe
// @access  Private / protect
const getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// @desc    update logged user password
// @route   PUT /api/v1/users/updata-my-password
// @access  Private / protect
const updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  // 1- Update user password based user payload (req.user._id)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.newPassword, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  if (!user) {
    return next(new AppError("please login first before update your password"));
  }

  // 2- generate token
  const token = createToken(user._id);

  res.status(200).json({ data: user, token });
});

// @desc    update logged user data [without password or role]
// @route   PUT /api/v1/users/updateMe
// @access  Private / protect
const updateLoggedUserData = asyncHandler(async (req, res, next) => {
  // find user based on paylod and detect filds that user will update
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      profileImg: req.body.profileImg,
    },
    { new: true }
  );

  res.status(200).json({ data: updatedUser });
});

// @desc    Logout
// @route   DELETE /api/v1/users/logout
// @access  Private/Protect
const deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  // 1- Set token expiration to a past date to invalidate the token
  const expiredToken = jwt.sign(
    { userId: req.user._id },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "1s",
    }
  );

  res.cookie("token", expiredToken, { expires: new Date(0) });

  // 2- Deactivate the active field
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(200).json({ message: "Logout successful" });
});

// @desc    admin get all tour guide joining requests
// @route   GET /api/v1/admin/users/tour-guide-requests
// @access  Private/Admin
const getAllGuidesJoinRequestes = asyncHandler(async (req, res, next) => {
  // get all pending tour guide join requests
  const pendingRequests = await User.find({
    role: "tour guide",
    requestStatus: "pending",
    isApproved: false,
  });

  if (!pendingRequests) {
    return next(new AppError("there is no tour guide join requests found "));
  }

  res.status(200).json({
    status: "success",
    result: pendingRequests.length,
    data: pendingRequests,
  });
});

// @desc    Approve a tour guide sign-up request
// @route   PUT /api/v1/admin/users/tour-guide-requests/approve/:id
// @access  Private/Admin
const approveGuidesJoinRequestes = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // get user based on user id
  const tourGuide = await User.findByIdAndUpdate(userId, {
    role:"tour guide",
    requestStatus: "approved",
    isApproved: true,
  },{new: true});

  if (!tourGuide) {
    return next(new AppError("tour guide not found", 400));
  }

  // send email to user to notify that request has been approved
  try {
    await sendEmail({
      email: tourGuide.email,
      subject: `Kenana Response to your tour guide joining request`,
      html: `<body>
              <h2>Tour Guide Joining Request Approved</h2>
              <p>Dear ${tourGuide.fullName},</p>
              <p>Congratulations! Your request to join Kenana as a tour guide has been <strong> approved</strong> .</p>
              <p>You are now a verified tour guide on Kenana. We are thrilled to have you on board!</p>
              <p>Thank you for choosing Kenana,</p>
              <p>Kenana Team</p>
          </body>`,
    });
  } catch (err) {
    tourGuide.requestStatus = "pending";
    tourGuide.isApproved = false;

    await tourGuide.save();
    return next(new AppError("There is an error in sending email", 500));
  }

  // Send response after approval and email sending
  res.status(200).json({
    message: "Tour guide joining request has been approved",
    data: tourGuide,
  });
});

// @desc    reject a tour guide sign-up request
// @route   PUT /api/v1/admin/users/tour-guide-requests/reject/:id
// @access  Private/Admin
const rejectGuidesJoinRequestes = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // get user based on user id
  const tourGuide = await User.findById(userId);

  if (!tourGuide) {
    return next(new AppError("tour guide not found", 400));
  }

  // update tour guide sign up information 
  tourGuide.idNumber = undefined;
  tourGuide.city = undefined;
  tourGuide.language = undefined;
  tourGuide.description = undefined;
  tourGuide.idPhoto = undefined;
  tourGuide.requestStatus = undefined;
  tourGuide.isApproved = undefined;
  tourGuide.role = "user";


  await tourGuide.save();

  // send email to user to notify that request has been approved
  try {
    await sendEmail({
      email: tourGuide.email,
      subject: `Kenana Response to your tour guide joining request`,
      html: `<body>
              <h2>Tour Guide Joining Request Rejected </h2>
              <p>Dear ${tourGuide.fullName},</p>
              <p>We are sorry to inform you that your request to join Kenana as a tour guide has been <strong> rejected </strong>.</p>
              <p>If you have any queries or need further information, please feel free to contact us.</p>
              <p>Thank you for considering Kenana,</p>
              <p>Kenana Team</p>
          </body>`,
    });
  } catch (err) {

    await tourGuide.save();
    return next(new AppError("There is an error in sending email", 500));
  }

  // Send response after approval and email sending
  res.status(200).json({
    message: "Tour guide joining request has been rejected",
    data: tourGuide,
  });
});

module.exports = {
  createUser,
  getAllUsers,
  getSpecificUser,
  updateUser,
  deleteUser,
  uploadTourImageCover,
  resizeImg,
  updateUserPassword,
  getLoggedUserData,
  updateLoggedUserPassword,
  updateLoggedUserData,
  deleteLoggedUserData,
  getAllGuidesJoinRequestes,
  approveGuidesJoinRequestes,
  rejectGuidesJoinRequestes,
}; 
