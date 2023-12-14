const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");

const deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const deletedDoc = await Model.findOneAndDelete({ _id: id })

    // To update avgRating and ratingQuantity in tour model
    if (deletedDoc) {
      if (Model.modelName === "Review") {
        const tourId = deletedDoc.tour;
        console.log(tourId)

        // Recalculate average ratings and quantity for the product
        await Model.calcAverageRatingsAndQuantity(tourId);
      }

      res.status(200).json({ message: ` successfully deleted` });
    } else {
      return next(new AppError(`No Document for this id ${id}`, 404));
    }
  });


const updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const updatedDoc = await Model.findByIdAndUpdate({ _id: id }, req.body, {
      new: true,
    });

    // To update avgRating and ratingQuantity in tour model
    if (updatedDoc) {
      if (Model.modelName === "Review") {
        const tourId = updatedDoc.tour;

        // Recalculate average ratings and quantity for the product
        await Model.calcAverageRatingsAndQuantity(tourId);
      }

      res.status(200).json({ success: true, data: updatedDoc });
    } else {
      return next(new AppError(`No Document for this id ${id}`, 404));
    }
  });


const createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const document = await Model.create(req.body);
    // To update avgRating and ratingQuantity in tour model
    if (document) {
      if (Model.modelName === "Review") {
        const tourId = document.tour
        await Model.calcAverageRatingsAndQuantity(tourId)
      }
      res.status(201).json({ status: "success", data: document })
    }

  });


const getOne = (Model, populateOpt) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    //Build quey
    let query = Model.findById(id);
    if (populateOpt) {
      query = query.populate(populateOpt)
    }

    //Execute query
    const document = await query
    if (!document) {
      return next(new AppError(`no Document for this id ${id}`, 404));
    }
    res.status(200).json({ success: true, data: document });
  });

const getAll = (Model, modelName) =>
  asyncHandler(async (req, res) => {
    // for nested route (get allTours of specific tourGuide)
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }

    const documentCounts = await Model.countDocuments();

    // build query
    const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
      .paginate(documentCounts)
      .sorting()
      .limitFields()
      .searching(modelName)
      .filtering();

    // execute query
    const { paginationResult } = apiFeatures;
    const documents = await apiFeatures.mongooseQuery;

    res.status(200).json({
      result: documents.length,
      status: "success",
      paginationResult,
      data: documents,
    });
  });

module.exports = {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
};
