const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("../cloudinary");

const User = require("../models/userModel");
const Tour = require("../models/tourModel");
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

// @desc    get specific user
// @route   get /api/v1/user/:guideId
// @access  private / admin
const getSpecificGuide = asyncHandler(async (req, res, next) => {
  const { guideId } = req.params;

  const guide = await User.findById(guideId);

  if (!guide) {
    return next(new AppError(`no tour guide for this id ${guideId}`, 404));
  }
  res.status(200).json({ success: true, data: guide });
});

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
const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const deletedUser = await User.findOneAndDelete({ _id: id });

  // delete realated tours when admin delete guide 
  if (deletedUser)
  {
    if (deletedUser.role === "tour guide") {
      const relatedToursToGuide = await Tour.deleteMany({ tourGuide:id });
      if (!relatedToursToGuide) {
        console.log("not found ************")
      }
      console.log(relatedToursToGuide)
    }
    res.status(200).json({ message: ` successfully deleted` });
  } else {
    return next(new AppError(`No Document for this id ${id}`, 404));
  }
});

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
    req.body,
    { new: true }
  );

  res.status(200).json({ status: "success", data: updatedUser });
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

// @desc    user upload profile image
// @route   PUT /api/v1/users/upload-image
// @access  Private/user

// const uploadProfileImg = async (req, res) => {
//   const { tourId } = req.body;
//   const files = req.files;

//   if (!tourId) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Tour ID required!" });
//   }

//   if (!files || files.length === 0) {
//     return res
//       .status(401)
//       .json({ success: false, message: "No files were uploaded" });
//   }

//   try {
//     const uploadedUrls = await Promise.all(
//       files.map(async (file, index) => {
//         if (!file || file.size === 0) {
//           // Skip empty files
//           return null;
//         }

//         console.log(`Uploading file ${index + 1} with size ${file.size} bytes`);

//         return new Promise((resolve, reject) => {
//           const uploadStream = cloudinary.uploader
//             .upload_stream({ resource_type: "auto" }, (error, result) => {
//               if (error) {
//                 console.error(`Error uploading file ${index + 1}:`, error);
//                 reject(error);
//               } else {
//                 console.log(`File ${index + 1} uploaded successfully`);
//                 resolve(result.url);
//               }
//             })
//             .end(file.buffer);

//           uploadStream.on("finish", () => {
//             // Nothing specific needs to be done here, as the result is handled in the callback
//           });

//           uploadStream.on("error", (error) => {
//             console.error(`Error uploading file ${index + 1}:`, error);
//             reject(error);
//           });
//         });
//       })
//     );

//     if (uploadedUrls.length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "All files were empty" });
//     }

//     // Update the tour with the uploaded URLs
//     const update = await Tour.findByIdAndUpdate(
//       tourId,
//       { imageCover: uploadedUrls[0], gallary: uploadedUrls.slice(1) },
//       { new: true }
//     );

//     res
//       .status(201)
//       .json({ success: true, message: "Your profile has been updated!" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Server error, try again later" });
//     console.log("Error while uploading profile image", error.message);
//   }
// };

const uploadProfileImg = async (req, res) => {
  const userId = req.user._id; // Assuming userId and name are provided
  const file = req.file; // Assuming only one file is uploaded for the profile image

  if (!userId ) {
    return res
      .status(401)
      .json({ success: false, message: "You are not logged in, please login and continue" });
  }

  if (!file || file.size === 0) {
    return res
      .status(401)
      .json({ success: false, message: "No file was uploaded" });
  }

  try {
    console.log(`Uploading file with size ${file.size} bytes`);

    const uploadedUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader
        .upload_stream({ resource_type: "auto" }, (error, result) => {
          if (error) {
            console.error("Error uploading file:", error);
            reject(error);
          } else {
            console.log("File uploaded successfully");
            resolve(result.url);
          }
        })
        .end(file.buffer);

      uploadStream.on("finish", () => {
        // Nothing specific needs to be done here, as the result is handled in the callback
      });

      uploadStream.on("error", (error) => {
        console.error("Error uploading file:", error);
        reject(error);
      });
    });

    // Update the user profile with the uploaded URL and name
    const updatedUserProfile = await User.findByIdAndUpdate(
      userId,
      { profileImg: uploadedUrl },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Your profile has been updated!",
      data: updatedUserProfile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error, try again later" });
    console.log("Error while uploading profile image", error.message);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getSpecificUser,
  getSpecificGuide,
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
  uploadProfileImg,
}; 
