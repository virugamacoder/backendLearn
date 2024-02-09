import mongoose from "mongoose";
import bcrypt from "bcrypt";

const condocontractorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    uidOrEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      requried: [true, "Password is required"],
    },
    recoveryEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phoneNo: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    companyPhoneNo: {
      type: String,
      required: true,
    },
    companyAddress: {
      type: String,
      required: true,
    },
    companyFaxNo: {
      type: String,
      required: true,
    },
    insurance: {
      type: String,
      required: true,
    },
    service: {
      type: [String],
      required: true,
    },
    companyBusinessCard: {
      type: String,
    },
    workingHoursFrom: {
      type: Number,
      required: true,
    },
    workingHoursTo: {
      type: Number,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    rememberMe: {
      type: Boolean,
      required: true,
    },
    termAndPolicy: {
      type: Boolean,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

condocontractorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

condocontractorSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

condocontractorSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
    }
  );
};

condocontractorSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    }
  );
};

export const CondoContractor = mongoose.model(
  "CondoContractor",
  condocontractorSchema
);
