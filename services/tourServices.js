// const sharp = require("sharp");
// const { v4: uuidv4 } = require("uuid");
// const asyncHandler = require("express-async-handler");

// const Tour = require("../models/tourModel");
// const cloudinary = require("../cloudinary");
// const User = require("../models/userModel");
// const AppError = require("../utils/appError");
// const factory = require("./handlersFactory");
// const sendEmail = require("../utils/sendEmail");
// const { uploadMixofImages } = require("../middleware/uploadImageMiddleware");

// // middleware to add id in request in body when create tour based on specific tourGuide
// const setTourGuideIdToBody = (req, res, next) => {
//   if (!req.body.tourGuide) {
//     req.body.tourGuide = req.user._id;
//   }
//   next();
// };

// // filter based on route [get allTours of specific tourGuide] & filtration
// const createFilterObj = (req, res, next) => {
//   // Check if userId is provided in params
//   if (req.params.userId) {
//     let filterObject = {};
//     filterObject = { tourGuide: req.params.userId };
//     req.filterObj = filterObject;
//   }
//   next();
// };

// const uploadTourImages = uploadMixofImages([
//   { name: "imageCover", maxCount: 1 },
//   { name: "gallary", maxCount: 5 },
// ]);

// const resizeTourImages = asyncHandler(async (req, res, next) => {
//   // 1- image processing for image cover
//   if (req.files.imageCover) {
//     const imageCoverFileName = `tour-${uuidv4()}-${Date.now()}-cover.jpeg`;

//     await sharp(req.files.imageCover[0].buffer)
//       .resize(2000, 1333)
//       .toFormat("jpeg")
//       .jpeg({ quality: 90 })
//       .toFile(`uploads/tours/${imageCoverFileName}`);

//     // save image to database
//     req.body.imageCover = imageCoverFileName;
//   }

//   // 2- image processing for gallery
//   if (req.files.gallary) {
//     req.body.gallary = [];

//     await Promise.all(
//       req.files.gallary.map(async (img, index) => {
//         const galleryName = `tour-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

//         await sharp(img.buffer)
//           .resize(2000, 1333)
//           .toFormat("jpeg")
//           .jpeg({ quality: 90 })
//           .toFile(`uploads/tours/${galleryName}`);

//         // save image to database
//         req.body.gallary.push(galleryName);
//       })
//     );
//   }
//   console.log(req.body.imageCover);
//   console.log(req.body.gallery);
//   next();
// });

// // @desc    get all tours
// // @route   get /api/v1/tours
// // @access  public
// const getAllTours = factory.getAll(Tour, "Tour");

// // @desc    get specific tour
// // @route   get /api/v1/tours/:id
// // @access  public
// const getSpecificTour = factory.getOne(Tour, "reviews");

// // @desc    update specific tour
// // @route   put /api/v1/tours:id
// // @access  Private
// const updateTour = factory.updateOne(Tour);

// // @desc    delete specific tour
// // @route   delete /api/v1/tours:id
// // @access  Private
// const deleteTour = factory.deleteOne(Tour);

// // @desc    tour guide request to create a  new tour
// // @route   post /api/v1/tours
// // @access  Private / tour guide
// const createTourRequest = factory.createOne(Tour);

// // @desc    get all create tour requests
// // @route   GET /api/v1/tours/requests
// // @access  Private / admin
// const getAllToursRequest = asyncHandler(async (req, res, next) => {
//   // get all tour requests based on pending status
//   const tourRequest = await Tour.find({
//     status: "pending",
//   });

//   if (!tourRequest) {
//     return next(new AppError("No tour request found", 400));
//   }

//   res
//     .status(200)
//     .json({ status: "success", result: tourRequest.length, data: tourRequest });
// });

// // @desc    Approve a tour guide sign-up request
// // @route   PUT /api/v1/admin/users/requests/approve/:tourid
// // @access  Private/Admin
// const approveTourRequestes = asyncHandler(async (req, res, next) => {
//   const { tourId } = req.params;

//   // get tour request on tour id
//   const tourRequest = await Tour.findByIdAndUpdate(
//     tourId,
//     {
//       status: "approved",
//     },
//     { new: true }
//   );

//   if (!tourRequest) {
//     return next(new AppError("tour not found", 400));
//   }

//   // get tour guide
//   const tourGuide = await User.findOne({
//     fullName: tourRequest.tourGuide.fullName,
//   });

//   // send email to user to notify that request has been approved
//   try {
//     await sendEmail({
//       email: tourGuide.email,
//       subject: `Kenana Response to Your Creating Tour Request`,
//       html: `<body>
//               <h2>Your Tour Creation Request Has Been Approved!</h2>
//               <p>Dear ${tourGuide.fullName},</p>
//               <p>Congratulations! Your tour creation request has been approved by the admin.</p>
//               <p>Your tour is now live on Kenana. We're excited to have your tour available for travelers!</p>
//               <p>Thank you for contributing to Kenana's tours,</p>
//               <p>Kenana Team</p>
//             </body>`,
//     });
//   } catch (err) {
//     tourRequest.status = "pending";

//     await tourRequest.save();
//     return next(new AppError("There is an error in sending email", 500));
//   }

//   // Send response after approval and email sending
//   res.status(200).json({
//     message: "Tour Creation Request Has Been Approved!",
//     data: tourRequest,
//   });
// });

// // @desc    Approve a tour guide sign-up request
// // @route   PUT /api/v1/admin/users/requests/approve/:tourid
// // @access  Private/Admin
// const rejectTourRequestes = asyncHandler(async (req, res, next) => {
//   const { tourId } = req.params;

//   // get tour request on tour id
//   const tourRequest = await Tour.findByIdAndUpdate(
//     tourId,
//     {
//       status: "rejected",
//     },
//     { new: true }
//   );

//   if (!tourRequest) {
//     return next(new AppError("tour not found", 400));
//   }

//   // get tour guide
//   const tourGuide = await User.findOne({
//     fullName: tourRequest.tourGuide.fullName,
//   });

//   // send email to user to notify that request has been approved
//   try {
//     await sendEmail({
//       email: tourGuide.email,
//       subject: `Kenana Response to Your Creating Tour Request`,
//       html: `<body>
//                 <h2>Your Tour Creation Request Has Been Rejected</h2>
//                 <p>Dear ${tourGuide.fullName},</p>
//                 <p>We regret to inform you that your tour creation request has been rejected by the admin.</p>
//                 <p>If you have any further questions or need clarification, feel free to reach out to our support team.</p>
//                 <p>Thank you for your interest in Kenana,</p>
//                 <p>Kenana Team</p>
//               </body>`,
//     });
//   } catch (err) {
//     tourRequest.status = "pending";

//     await tourRequest.save();
//     return next(new AppError("There is an error in sending email", 500));
//   }

//   // Send response after approval and email sending
//   res.status(200).json({
//     message: "Tour Creation Request Has Been Rejected!",
//     data: tourRequest,
//   });
// });

// // @desc    Upload imageCover and gallery to cloudinary
// // @route   POST /api/v1/tours/upload-image
// // @access  Public
// const uploadImage = async (req, res) => {
//   const { tourId } = req.body;
//   const files = req.files
  
//   console.log(files)

//   if (!tourId)
//     return res
//       .status(401)
//       .json({ success: false, message: 'tour ID required!' });

//   if (!files || Object.keys(files).length === 0) {
//     return res.status(401).json({ success: false, message: 'No files were uploaded' });
//   }

//   try {
//     const uploadedUrls = await Promise.all(
//       Object.values(files).map(async (file) => {
//         if (!file || file.size === 0) {
//           // Skip empty files
//           return null;
//         }

//         console.log("error heeeer")
//         const result = await cloudinary.uploader.upload(file.buffer, {
//           resource_type: "auto",
//         });

//         console.log("result", result)
//         return result.url;
//       })
//     );

//     if (uploadedUrls.length === 0) {
//       return res.status(400).json({ success: false, message: 'All files were empty' });
//     }

//     // Update the tour with the uploaded URLs
//     const update = await Tour.findByIdAndUpdate(
//       tourId,
//       { imageCover: uploadedUrls[0], gallary: uploadedUrls.slice(1) },
//       { new: true }
//     );
//     res
//       .status(201)
//       .json({ success: true, message: 'Your profile has updated!' });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: 'server error, try after some time' });
//     console.log('Error while uploading profile image', error.message);
//   }
// };

// module.exports = {
//   createTourRequest,
//   getAllTours,
//   getSpecificTour,
//   updateTour,
//   deleteTour,
//   setTourGuideIdToBody,
//   createFilterObj,
//   uploadTourImages,
//   resizeTourImages,
//   getAllToursRequest,
//   approveTourRequestes,
//   rejectTourRequestes,
//   uploadImage,
// };


// ////////////////////////////////////////////////////////////////////////////


const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const cloudinary = require("../cloudinary");

const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const factory = require("./handlersFactory");
const sendEmail = require("../utils/sendEmail");
const { uploadMixofImages } = require("../middleware/uploadImageMiddleware");

// middleware to add id in request in body when create tour based on specific tourGuide
const setTourGuideIdToBody = (req, res, next) => {
  if (!req.body.tourGuide) {
    req.body.tourGuide = req.user._id;
  }
  next();
};

// filter based on route [get allTours of specific tourGuide] & filtration
const createFilterObj = (req, res, next) => {
  // Check if userId is provided in params
  if (req.params.userId) {
    let filterObject = {};
    filterObject = { tourGuide: req.params.userId };
    req.filterObj = filterObject;
  }
  next();
};

const uploadTourImages = uploadMixofImages([
  { name: "imageCover", maxCount: 1 },
  { name: "gallary", maxCount: 5 },
]);

const resizeTourImages = asyncHandler(async (req, res, next) => {
  // 1- image processing for image cover
  if (req.files.imageCover) {
    const imageCoverFileName = `tour-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/tours/${imageCoverFileName}`);

    // save image to database
    req.body.imageCover = imageCoverFileName;
  }

  // 2- image processing for gallery
  if (req.files.gallary) {
    req.body.gallary = [];

    await Promise.all(
      req.files.gallary.map(async (img, index) => {
        const galleryName = `tour-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`uploads/tours/${galleryName}`);

        // save image to database
        req.body.gallary.push(galleryName);
      })
    );
  }
  console.log(req.body.imageCover);
  console.log(req.body.gallery);
  next();
});

// @desc    get all tours
// @route   get /api/v1/tours
// @access  public
const getAllTours = factory.getAll(Tour, "Tour");

// @desc    get specific tour
// @route   get /api/v1/tours/:id
// @access  public
const getSpecificTour = factory.getOne(Tour, "reviews");

// @desc    update specific tour
// @route   put /api/v1/tours:id
// @access  Private
const updateTour = factory.updateOne(Tour);

// @desc    delete specific tour
// @route   delete /api/v1/tours:id
// @access  Private
const deleteTour = factory.deleteOne(Tour);

// @desc    tour guide request to create a  new tour
// @route   post /api/v1/tours
// @access  Private / tour guide
const createTourRequest = factory.createOne(Tour);

// @desc    get all create tour requests
// @route   GET /api/v1/tours/requests
// @access  Private / admin
const getAllToursRequest = asyncHandler(async (req, res, next) => {
  // get all tour requests based on pending status
  const tourRequest = await Tour.find({
    status: "pending",
  });

  if (!tourRequest) {
    return next(new AppError("No tour request found", 400));
  }

  res
    .status(200)
    .json({ status: "success", result: tourRequest.length, data: tourRequest });
});

// @desc    Approve a tour guide sign-up request
// @route   PUT /api/v1/admin/users/requests/approve/:tourid
// @access  Private/Admin
const approveTourRequestes = asyncHandler(async (req, res, next) => {
  const { tourId } = req.params;

  // get tour request on tour id
  const tourRequest = await Tour.findByIdAndUpdate(
    tourId,
    {
      status: "approved",
    },
    { new: true }
  );

  if (!tourRequest) {
    return next(new AppError("tour not found", 400));
  }

  // get tour guide
  const tourGuide = await User.findOne({
    fullName: tourRequest.tourGuide.fullName,
  });

  // send email to user to notify that request has been approved
  try {
    await sendEmail({
      email: tourGuide.email,
      subject: `Kenana Response to Your Creating Tour Request`,
      html: `<body>
              <h2>Your Tour Creation Request Has Been Approved!</h2>
              <p>Dear ${tourGuide.fullName},</p>
              <p>Congratulations! Your tour creation request has been approved by the admin.</p>
              <p>Your tour is now live on Kenana. We're excited to have your tour available for travelers!</p>
              <p>Thank you for contributing to Kenana's tours,</p>
              <p>Kenana Team</p>
            </body>`,
    });
  } catch (err) {
    tourRequest.status = "pending";

    await tourRequest.save();
    return next(new AppError("There is an error in sending email", 500));
  }

  // Send response after approval and email sending
  res.status(200).json({
    message: "Tour Creation Request Has Been Approved!",
    data: tourRequest,
  });
});

// @desc    Approve a tour guide sign-up request
// @route   PUT /api/v1/admin/users/requests/approve/:tourid
// @access  Private/Admin
const rejectTourRequestes = asyncHandler(async (req, res, next) => {
  const { tourId } = req.params;

  // get tour request on tour id
  const tourRequest = await Tour.findByIdAndUpdate(
    tourId,
    {
      status: "rejected",
    },
    { new: true }
  );

  if (!tourRequest) {
    return next(new AppError("tour not found", 400));
  }

  // get tour guide
  const tourGuide = await User.findOne({
    fullName: tourRequest.tourGuide.fullName,
  });

  // send email to user to notify that request has been approved
  try {
    await sendEmail({
      email: tourGuide.email,
      subject: `Kenana Response to Your Creating Tour Request`,
      html: `<body>
                <h2>Your Tour Creation Request Has Been Rejected</h2>
                <p>Dear ${tourGuide.fullName},</p>
                <p>We regret to inform you that your tour creation request has been rejected by the admin.</p>
                <p>If you have any further questions or need clarification, feel free to reach out to our support team.</p>
                <p>Thank you for your interest in Kenana,</p>
                <p>Kenana Team</p>
              </body>`,
    });
  } catch (err) {
    tourRequest.status = "pending";

    await tourRequest.save();
    return next(new AppError("There is an error in sending email", 500));
  }

  // Send response after approval and email sending
  res.status(200).json({
    message: "Tour Creation Request Has Been Rejected!",
    data: tourRequest,
  });
});

// @desc    Upload imageCover and gallery to cloudinary
// @route   POST /api/v1/tours/upload-image
// @access  Public
const uploadImage = async (req, res) => {
  const { tourId } = req.body;
  const files = req.files;

  if (!tourId) {
    return res
      .status(401)
      .json({ success: false, message: "Tour ID required!" });
  }

  if (!files || files.length === 0) {
    return res
      .status(401)
      .json({ success: false, message: "No files were uploaded" });
  }

  try {
    const uploadedUrls = await Promise.all(
      files.map(async (file, index) => {
        if (!file || file.size === 0) {
          // Skip empty files
          return null;
        }

        console.log(`Uploading file ${index + 1} with size ${file.size} bytes`);

        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader
            .upload_stream({ resource_type: "auto" }, (error, result) => {
              if (error) {
                console.error(`Error uploading file ${index + 1}:`, error);
                reject(error);
              } else {
                console.log(`File ${index + 1} uploaded successfully`);
                resolve(result.url);
              }
            })
            .end(file.buffer);

          uploadStream.on("finish", () => {
            // Nothing specific needs to be done here, as the result is handled in the callback
          });

          uploadStream.on("error", (error) => {
            console.error(`Error uploading file ${index + 1}:`, error);
            reject(error);
          });
        });
      })
    );

    if (uploadedUrls.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "All files were empty" });
    }

    // Update the tour with the uploaded URLs
    const update = await Tour.findByIdAndUpdate(
      tourId,
      { imageCover: uploadedUrls[0], gallary: uploadedUrls.slice(1) },
      { new: true }
    );

    res
      .status(201)
      .json({ success: true, message: "Your profile has been updated!" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error, try again later" });
    console.log("Error while uploading profile image", error.message);
  }
};

module.exports = {
  createTourRequest,
  getAllTours,
  getSpecificTour,
  updateTour,
  deleteTour,
  setTourGuideIdToBody,
  createFilterObj,
  uploadTourImages,
  resizeTourImages,
  getAllToursRequest,
  approveTourRequestes,
  rejectTourRequestes,
  uploadImage,
};
