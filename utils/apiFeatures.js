class ApiFeature {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  // features methods

  filtering() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["limit", "page", "fields", "keyword", "sort"];
    excludedFields.forEach((field) => {
      delete queryObj[field];
    });

    let filterObject = {};

    // Apply filter using [gte, lte, gt, lt]
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    filterObject = JSON.parse(queryString);

    this.mongooseQuery = this.mongooseQuery.find(filterObject);

    return this;
  }

  sorting() {
    if (this.queryString.sort) {
      const sortFields = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortFields);
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(`${fields}`);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  searching(modelName) {
    if (this.queryString.keyword) {
      let searchObj = {};

      if (modelName === "Tour") {
        searchObj.$or = [
          { title: { $regex: this.queryString.keyword, $options: "i" } },
          { description: { $regex: this.queryString.keyword, $options: "i" } },
          { city: { $regex: this.queryString.keyword, $options: "i" } },
        ];
      } else {
        searchObj = {
          username: { $regex: this.queryString.keyword, $options: "i" },
        };
      }

      this.mongooseQuery = this.mongooseQuery.find(searchObj);
    }
    return this;
  }

  paginate(countDocuments) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skip = (page - 1) * limit;

    // pagination result to return in response
    const allDoc = page * limit; // ==> 5 X 10 = 50 documents
    const pagination = {};

    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(countDocuments / limit);

    // next and previous pages
    if (allDoc < countDocuments) {
      pagination.next = page + 1;
    }
    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.paginationResult = pagination;
    this.mongooseQuery = this.mongooseQuery.limit(limit).skip(skip);

    return this;
  }
}

module.exports = ApiFeature;
