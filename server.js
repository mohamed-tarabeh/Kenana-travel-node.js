const path = require("path");

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
require("dotenv").config({ path: "config.env" });

const dbConnection = require("./config/database");
const errMiddleware = require("./middleware/globalErrorMiddleware");
const { webhookCheckout } = require("./services/bookingService");
const AppError = require("./utils/appError");
const tourRoute = require("./routes/tourRoute");
const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");
const reviewRoute = require("./routes/reviewRoute");
const wishListRoute = require("./routes/wishListRoute");
const bookingRoute = require("./routes/bookingRoute");
const contactRoute = require("./routes/contactMessageRoute");

// express app
const app = express();
app.use(cors());
app.options("*", cors()); //  enable pre-flight across-the-board like so:
// compress all responses
app.use(compression());

// database connection
dbConnection();

// checkout webhook
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout
);

// use body_parser middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(process.env.NODE_ENV);
}

// mount route --> API Endpoints:
// Authentication Endpoints ---
app.use("/api/v1/auth", authRoute);

// Tour Guide Endpoints:
// app.use("/api/v1/tour-guides", );
// app.use("/api/v1/tour-guides/tours", tourRoute);
// app.use("/api/v1/tour-guides/wallet", );

// Tourist Endpoints:
app.use("/api/v1/users", userRoute);
app.use("/api/v1/tours", tourRoute);
// app.use("/api/v1/tourists/reviews", );

// Admin Endpoints:
app.use("/api/v1/admin/users", userRoute);
app.use("/api/v1/booking", bookingRoute);
// app.use("/api/v1/admin/", userRoute);
// app.use("/api/v1/admin/tours ", );
// app.use("/api/v1/admin/content ", );
app.use("/api/v1/contact", contactRoute);
// app.use("/api/v1/admin/payout", );

// Review Endpoints
app.use("/api/v1/reviews", reviewRoute);

//WishList EndPoint
app.use("/api/v1/wishlist", wishListRoute);

app.all("*", (req, res, next) => {
  const err = new AppError(`cant find this route: ${req.originalUrl}`, 400);
  next(err);
});

// global handler middleware
app.use(errMiddleware);

const server = app.listen(process.env.PORT, () => {
  console.log(`server started on port ${process.env.PORT} ......`);
});

// handel rejection(promise) outside express
process.on("unhandledRejection", (err) => {
  console.error(`unhandled rejection errors: ${err.name}`);
  server.close(() => {
    console.error("shutting down....");
    process.exit(1);
  });
});
