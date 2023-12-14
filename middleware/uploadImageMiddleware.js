const multer = require("multer");
const AppError = require("../utils/appError");

const multerOptions = () => {
  // // 1- use diskStorage to upload imageCover
  // const multerStorage = multer.diskStorage({
  //   destination: function (req, file, cb) {
  //     cb(null, "uploads/tours");
  //   },
  //   filename: function (req, file, cb) {
  //     const fileExt = file.mimetype.split("/")[1];
  //     const fileName = `tour-${uuidv4()}-${Date.now()}.${fileExt}`;
  //     cb(null, fileName);
  //   },
  // });

  // 2- use memory storage to upload imageCover
  const multerStorage = multer.memoryStorage();

  // 3- multer filter to allow only images
  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new AppError("only image allowed", 400), false);
    }
  };

  const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
  return upload;
};

// function to upload one image using upload.single
const uploadSingleImage = (fieldName) => {
  return multerOptions().single(fieldName);
};

// function to upload more than image using fields([..,..])
const uploadMixofImages = (arrayOfFields) => {
  return multerOptions().fields(arrayOfFields);
};

module.exports = {
  uploadSingleImage,
  uploadMixofImages,
};
