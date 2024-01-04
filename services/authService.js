const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const cloudinary = require("../cloudinary");

const AppError = require("../utils/appError");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const createToken = require("../utils/createToken");
const { uploadMixofImages } = require("../middleware/uploadImageMiddleware");

//@desc function to allow tour guide to upload his id photo
const uploadTourGuideIdPhoto = uploadMixofImages([
  { name: "idPhoto", maxCount: 2 },
]);

const resizeTourGuideIdPhoto = asyncHandler(async (req, res, next) => {
  // 2- image processing for id photo
  if (req.files.idPhoto) {
    req.body.idPhoto = [];

    await Promise.all(
      req.files.idPhoto.map(async (img, index) => {
        const idPhotoName = `idPhoto-${uuidv4()}-${Date.now()}-${
          index + 1
        }.jpeg`;

        await sharp(img.buffer)
          // .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`uploads/idPhoto/${idPhotoName}`);

        // save image to database
        req.body.idPhoto.push(idPhotoName);
      })
    );
  }
  next();
});

// @desc    user Signup
// @route   POST /api/v1/auth/signup
// @access  Public
const signUp = asyncHandler(async (req, res, next) => {
  // 1- create a new user
  const user = await User.create({
    fullName: req.body.fullName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    password: req.body.password,
  });

  // 2- generate 4-digit reset code
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedSignUpResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  user.signUpResetCode = hashedSignUpResetCode;
  user.signUpCodeResetExpires = Date.now() + 3 * 60 * 1000;
  user.signUpCodeResetVerified = false;

  await user.save();

  // 3-  send reset code to the user's email
  try {
    await sendEmail({
      email: user.email,
      subject: `Sign Up Verification Code For Kenana`,
      html: `<body>
              <h2>Sign Up Verification</h2>
              <p>Dear User: ${user.fullName},</p>
              <p>We have received a request to sign up to kenana. Please use the following code to complete your sign up:</p>
              <h3>${resetCode}</h3>
              <p>Note: Its Valid For <strong>3 minutes</strong> </p>
              <p>If you did not request a password reset, you can safely ignore this email.</p>
              <p>Thank you,</p>
              <p>Kenana Team</p>
          </body>`,
    });
  } catch (err) {
    user.signUpResetCode = undefined;
    user.signUpCodeResetExpires = undefined;
    user.signUpCodeResetVerified = undefined;

    await user.save();
    return next(new AppError("There is an error in sending email", 500));
  }

  res.status(201).json({
    message: `Verification code sent to : ${user.email}  `,
    data: user,
  });
});

// @desc    Submit sign up verification Code
// @route   POST /api/v1/auth/signup-verify-code
// @access  Public
const signUpVerifyCode = asyncHandler(async (req, res, next) => {
  // 1- get user based on reset code in body
  const hashedSignUpResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    signUpResetCode: hashedSignUpResetCode,
    signUpCodeResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("sign up Reset code invalid or expired", 400));
  }

  // 2- reset code valid => change verification
  user.signUpCodeResetVerified = true;

  await user.save();

  // 3- generate token
  const token = createToken(user._id);

  res.status(200).json({
    status: "Successfully sign up to Kenana",
    token: token,
  });
});

// // @desc    Tour Guide Additional Information (Step 2)
// // @route   POST /api/v1/auth/tour-guide-signup
// // @access  Private (only accessible for authenticated users, i.e., tour guides)
// const signUpTourGuide = asyncHandler(async (req, res, next) => {
//   // Retrieve user ID from the authenticated user's token

//   // Find the user by ID and update additional information
//   const user = await User.findByIdAndUpdate(
//     req.user._id,
//     {
//       $set: {
//         isTourGuide: true,
//         // Add other fields like ID number, city, language, description, ID photo, etc.
//         idNumber: req.body.idNumber,
//         city: req.body.city,
//         language: req.body.language,
//         description: req.body.description,
//         idPhoto: req.body.idPhoto,
//         role: "tour guide",
//       },
//     },
//     { new: true }
//   );

//   if (!user) {
//     return next(new AppError("User not found", 404));
//   }

//   // generate token
//   const token = createToken(user._id);

//   // Send a response indicating successful completion of tour guide signup
//   res.status(200).json({
//     data: user,
//     message: "successfully sign up as Tour guide,your information added ",
//     token,
//   });
// });

//// @desc    Tour Guide Additional Information (Step 2)
//// @route   POST /api/v1/auth/tour-guide-signup
//// @access  Private (only accessible for authenticated users, i.e., tour guides)
const signUpTourGuide = asyncHandler(async (req, res, next) => {
  // Find the user by ID and update additional information
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        role:"tour guide",
        isTourGuide: true,
        idNumber: req.body.idNumber,
        city: req.body.city,
        language: req.body.language,
        description: req.body.description,
        idPhoto: req.body.idPhoto,
        requestStatus: "pending",
        isApproved: false,
      },
    },
    { new: true }
  );

  if (!user) {
    return next(
      new AppError("please login as user first then goin as tour guide ", 404)
    );
  }

  // Send a response indicating successful completion of tour guide signup
  res.status(200).json({
    message:
      "your information has been sent successfully, you will be notified via the E-mail when your admission is approved",
    data: user,
  });
});

// @desc    user login
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  // Check if login and password are in the request body
  if (!req.body.email || !req.body.password) {
    return next(
      new AppError("email or phone number and password are required", 400)
    );
  }

  // Check if the login field is an email or phone number
  const loginIdentifier = req.body.email;

  // Use a regex or other logic to determine if it's an email or phone number
  const isEmail = /^\S+@\S+\.\S+$/.test(loginIdentifier);
  const isPhone = /^(?:\+20|0)?1[0-2]\d{8}$/.test(loginIdentifier);

  if (!isEmail && !isPhone) {
    return next(new AppError("Invalid email or phone number format", 400));
  }

  // 1- check if password and email or phoneNumber in body
  const user = await User.findOneAndUpdate(
    {
      $or: [{ email: loginIdentifier }, { phoneNumber: loginIdentifier }],
    },
    { active: true },
    { new: true }
  );

  // 2- check if user exist & check if password is correct
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    if (isEmail) {
      return next(new AppError("incorrect email or password", 401));
    } else {
      return next(new AppError("incorrect phone number or password", 401));
    }
  }

  // 3- generate token
  const token = createToken(user._id);

  // 4- send response
  res.status(200).json({ data: user, token });
});

// @desc   make sure the user is logged in to can access the specific route
const protect = asyncHandler(async (req, res, next) => {
  // 1- check if token exists, if exists hold it
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError(
        "You are not login, Please login to get access this route",
        401
      )
    );
  }

  // 2- verify token (no change at payload && token expiration time)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3- check if user exists based on id in payload ** currentUser is user recently logged in
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new AppError(
        "The user that belong to this token does no longer exist",
        401
      )
    );
  }

  // 4- check if user change his password after token created
  if (currentUser.passwordChangedAt) {
    const passChangedTimeStamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    if (passChangedTimeStamp > decoded.iat) {
      return next(
        new AppError(
          "User recently changed his password. please login again..",
          401
        )
      );
    }
  }

  req.user = currentUser;
  next();
});

// @desc    Authorization (User Permissions)
const allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log(`roles: ${roles}`);
      console.log(req.user.role);
      return next(
        new AppError("you are not allowed to access this route", 403)
      );
    }
    next();
  });

// @desc    user forget password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  // 1- get user by email or phone number
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(`there is no user with this email ${req.body.email}`)
    );
  }

  // 2- if user exists => generate reset random code 4 digits and save in db
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // saved to database
  user.passwordResetCode = hashedResetCode;
  user.passCodeResetExpires = Date.now() + 3 * 60 * 1000;
  user.passCodeResetVerified = false;

  await user.save();

  // 3- send reset code via email or phone number
  try {
    await sendEmail({
      email: user.email,
      subject: `Password Reset For Kenana`,
      html: `<body>
              <h2>Password Reset</h2>
              <p>Dear User: ${user.fullName},</p>
              <p>We have received a request to reset your password. Please use the following code to reset your password:</p>
              <h3>${resetCode}</h3>
              <p>Note: Its Valid For <strong>3 minutes</strong> </p>
              <p>If you did not request a password reset, you can safely ignore this email.</p>
              <p>Thank you,</p>
              <p>Kenana Team</p>
          </body>`,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passCodeResetExpires = undefined;
    user.passCodeResetVerified = undefined;

    await user.save();
    return next(new AppError("There is an error in sending email", 500));
  }

  res
    .status(200)
    .json({ status: "success", message: "reset code sent to email" });
});

// @desc    user verify password
// @route   POST /api/v1/auth/verify-reset-code
// @access  Public
const verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1- get user based on reset code in body
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passCodeResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("Reset code invalid or expired"));
  }

  // 2- reset code valid => change verification
  user.passCodeResetVerified = true;
  await user.save();

  res.status(200).json({
    status: "Success",
  });
});

// @desc    user reset password
// @route   POST /api/v1/auth/change-password
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  // 1- get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  console.log(user);
  // 2- check if reset coed verified
  if (!user.passCodeResetVerified) {
    return next(new AppError("Reset code not verified", 400));
  }
  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passCodeResetExpires = undefined;
  user.passCodeResetVerified = undefined;

  await user.save();

  // 3- every thing is ok, generate token
  const token = createToken(user._id);
  res.status(200).json({ token });
});

const uploadIdPhoto = async (req, res) => {
  const { user } = req;
  if (!user)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access!" });

  const files = req.files;

  if (!files || files.length === 0) {
    return res
      .status(401)
      .json({ success: false, message: "No files were uploaded" });
  }

  try {
    const uploadedUrls = await Promise.all(
      files.map(async (file, index) => {
        if (!file || file.size === 0) {
          return null;
        }

        const result = await cloudinary.uploader.upload(file.path, {
          public_id: `${user._id}_profile_${index + 1}`, // Unique public ID for each image
          width: 500,
          height: 500,
          crop: "fill",
        });

        return result.url;
      })
    );

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { idPhoto: uploadedUrls }, // Assuming `idPhoto` is an array field in the User model
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Your profile has been updated!",
      data: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error, try again later" });
    console.log("Error while uploading profile images", error.message);
  }
};


module.exports = {
  signUp,
  signUpVerifyCode,
  login,
  protect,
  allowedTo,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
  signUpTourGuide,
  uploadTourGuideIdPhoto,
  resizeTourGuideIdPhoto,
  uploadIdPhoto,
};
