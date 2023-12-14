const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "please enter your full name"],
    },
    phoneNumber: {
      type: String,
      required: [true, "please enter your number phone"],
    },
    email: {
      type: String,
      required: [true, "please enter your email"],
    },
    message: {
      type: String,
      required: [true, "please enter your question message"],
    },
    adminReplied: {
      type: Boolean,
      default: false,
    },
    adminReply: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactMessageSchema);
