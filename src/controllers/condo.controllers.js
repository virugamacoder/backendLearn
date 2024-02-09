import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { CondoContractor } from "../models/condocontractor.model.js";

const registerContractor = asyncHandler(async (req, res) => {
  // Get User Details From Frontend
  const {
    firstName,
    lastName,
    uidOrEmail,
    password,
    recoveryEmail,
    phoneNo,
    companyName,
    companyPhoneNo,
    companyAddress,
    companyFaxNo,
    insurance,
    service,
    workingHoursFrom,
    workingHoursTo,
    designation,
    rememberMe,
    termAndPolicy,
    companyBusinessCard,
  } = req.body;

  console.log("Email or Username ", uidOrEmail);

  // Validate Not empty
  if (
    [
      firstName,
      lastName,
      uidOrEmail,
      password,
      recoveryEmail,
      phoneNo,
      companyName,
      companyPhoneNo,
      companyAddress,
      // companyFaxNo,
      // insurance,
      service,
      workingHoursFrom,
      workingHoursTo,
      designation,
      rememberMe,
      termAndPolicy,
    ].some(
      (field) =>
        typeof field !== "boolean" &&
        typeof field === "string" &&
        field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All Fields Are Required");
  }

  const exitsedUser = await CondoContractor.findOne({
    uidOrEmail,
  });

  if (exitsedUser) {
    throw new ApiError(409, "Contractor With Email or UserId Already Exist");
  }

  // service to Array of String and Trim the value
  const serviceArray = await service.split(",").map((value) => value.trim());

  // Create User in Database
  const contractor = await CondoContractor.create({
    firstName,
    lastName,
    uidOrEmail,
    password,
    recoveryEmail,
    phoneNo,
    companyName,
    companyPhoneNo,
    companyAddress,
    companyFaxNo,
    insurance,
    service: serviceArray,
    workingHoursFrom,
    workingHoursTo,
    designation,
    rememberMe,
    termAndPolicy,
    companyBusinessCard,
  });

  const createContractor = await CondoContractor.findById(
    contractor._id
  ).select("-password");

  console.log("Create Contractor ", createContractor);

  // CreateUser Send Response
  if (!createContractor) {
    throw new ApiError(500, "Somthing Wrong ! Failed to Create Contractor");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createContractor, "Contractor Created Successfully")
    );
});

const uploadCompanyBusinessCard = asyncHandler(async (req, res) => {
  const companyBusinessCardLocalPath = req.file.path;

  if (!companyBusinessCardLocalPath) {
    throw new ApiError(400, "companyBusinessCard Images is Required");
  }

  const companyBusinessCard = await uploadOnCloudinary(
    companyBusinessCardLocalPath
  );

  if (!companyBusinessCard) {
    throw new ApiError(500, "Failed to upload companyBusinessCard Image");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        companyBusinessCard.url,
        "Company Business Card Uploaded"
      )
    );
});

export { registerContractor, uploadCompanyBusinessCard };
