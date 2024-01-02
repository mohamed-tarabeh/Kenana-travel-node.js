const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      required: [true, "user name is required"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "user email is required"],
      unique: [true, "this email is already exist"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    passwordChangedAt: Date,

    passwordResetCode: String,
    passCodeResetExpires: Date,
    passCodeResetVerified: Boolean,

    signUpResetCode: String,
    signUpCodeResetExpires: Date,
    signUpCodeResetVerified: Boolean,

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "tour guide", "admin"],
      default: "user",
      required: true,
    },
    profileImg: String,

    // additional fields for tour guides
    idNumber: {
      type: String,
    },
    city: {
      type: String,
    },
    language: {
      type: String,
    },
    description: {
      type: String,
    },
    idPhoto: {
      type: [String],
    },
    requestStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    isApproved: {
      type: Boolean,
      default: false,
    },

    //child reference
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Tour",
      },
    ],
  },

  { timestamps: true }
);

// mongoose query to hash password when created
userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  // hash password using bcrypt
  user.password = await bcrypt.hash(user.password, 12);
  next();
});

const setImageUrl = (doc) => {
  if (doc.profileImg) {
    const imgUrl = `${doc.profileImg}`;
    doc.profileImg = imgUrl;
  }
};

// mongoose query middleware *post* to return url image
// findOne / getOne / getAll
userSchema.post("init", (doc) => {
  setImageUrl(doc);
});

// in create
userSchema.post("save", (doc) => {
  setImageUrl(doc);
});

module.exports = mongoose.model("User", userSchema);
