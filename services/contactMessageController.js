const asyncHandler = require("express-async-handler");

const Contact = require("../models/contactMessageModel");
const factory = require("./handlersFactory");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/sendEmail");

// @desc    send a message to admin
// @route   POST /api/v1/contact
// @access  protected / user or tour guide
const sendContactMessage = asyncHandler(async (req, res, next) => {
  const message = await Contact.create({
    fullName: req.body.fullName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    message: req.body.message,
  });

  res.status(201).json({ message: "Message sent successfully", data: message });
});

// @desc    admin get all contacts
// @route   GET /api/v1/contact/admin
// @access  protected / admin
const getAllContacts = factory.getAll(Contact);

// @desc    admin send a message replay
// @route   POST /api/v1/contact/admin/:messageId/replay
// @access  protected /admin
const replayToContactMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const { adminReply } = req.body;

  // update the contact message
  const updatedMessage = await Contact.findByIdAndUpdate(
    messageId,
    {
      adminReply,
      adminReplied: true,
    },
    { new: true }
  );

  // send the admin reply message to email user
  try {
    await sendEmail({
      email: updatedMessage.email,
      subject: `Kenana Response to your Your inquiry `,
      html: `<body>
              <h2>Kenana reply to Your inquiry</h2>
              <p>Dear ${updatedMessage.fullName},</p>
              <p>${updatedMessage.adminReply}</p>
              <p>if you have any another question, please send it you are welcome</p>
              <p>Kenana Team</p>
          </body>`,
    });
  } catch (err) {
    updatedMessage.adminReplied = false;

    await updatedMessage.save();
    return next(new AppError("There is an error in sending email", 500));
  }

  res.status(201).json({
    message: "Message Reply sent to user successfully",
    data: updatedMessage,
  });
});

module.exports = {
  sendContactMessage,
  getAllContacts,
  replayToContactMessage,
};
