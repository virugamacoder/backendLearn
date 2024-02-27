import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { CondoContractor } from "../models/condocontractor.model.js";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Proposal } from "../models/proposal.model.js";
import { format } from "date-fns";
import { Contract } from "../models/contract.model.js";

const generateAccessAndRefreshToken = async (user) => {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while Failed to Generate Access and Refresh Token"
    );
  }
};

const singupContractor = asyncHandler(async (req, res) => {
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
    area
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
      service,
      workingHoursFrom,
      workingHoursTo,
      rememberMe,
      termAndPolicy,
      // companyFaxNo,
      // insurance,
      // designation,
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
    throw new ApiError(409, "Email or UserId Already Exist ! Please Try Another");
  }

  let serviceArray = [];
  if (service) {
    serviceArray = service.split(",").map((value) => value.trim());
    // Use serviceArray further...
  } else {
    // Handle the case where service is undefined or null
  }
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
    area
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
      new ApiResponse(200, null, "Contractor Created Successfully")
    );
});

const Login = asyncHandler(async (req, res) => {
  // Get User Details From Frontend
  const { uidOrEmail, password } = req.body;

  console.log(uidOrEmail, password);

  // Check For all filed are required
  if ([uidOrEmail, password].some((filed) => filed.trim() === "")) {
    throw new ApiError(400, "All Fields Are Required");
  }

  // Check if User Exist
  const user = await CondoContractor.findOne({ uidOrEmail });

  if (!user) {
    throw new ApiError(404, "User Not Exist");
  }

  // Check if Password is Correct
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  // Generate Access and Refresh Token
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user);

  // Use the user object directly without making an additional server call
  const {
    password: excludedPassword,
    refreshToken: excludedRefreshToken,
    ...loggendInUser
  } = user.toObject();

  console.log("Login User: ", loggendInUser);

  // options for cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Send Response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggendInUser,
          refreshToken,
          accessToken,
        },
        "User Logged In Successfully"
      )
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

const jobsContractor = asyncHandler(async (req, res) => {
  // Get User Details From Frontend
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const jsonData = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../db/JobData.json"))
  );

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 5;
  console.log("Page ", page, "PageSize ", pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const totalPages = Math.ceil(jsonData.length / pageSize);

  const paginatedJobsData = jsonData.slice(startIndex, endIndex);
  // const paginatedJobsData = jsonData.slice(0, 1);

  const today = new Date();

  const updatedPaginatedJobsData = paginatedJobsData.map((job) => {
    const endDate = new Date(job.endDate); // Convert end date string to Date object

    // Calculate the difference in milliseconds
    const differenceInMs = endDate - today;

    // Convert milliseconds to days
    const daysLeft = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));

    // Add daysLeft property to the job object
    return { ...job, daysLeft };
  });

  console.log("Paginated Jobs Data ", updatedPaginatedJobsData);
  const jobData = {
    paginatedJobsData: updatedPaginatedJobsData,
    totalPages,
    currentPage: page,
    pageSize,
  };

  return res
    .status(201)
    .json(new ApiResponse(200, jobData, "json Data Fetched Successfully"));
});

// tested
const CreateProposal = asyncHandler(async (req, res) => {
  const {
    companyName,
    yourName,
    designation,
    estimateTime,
    otherDetails,
    attachProposal,
    contractId,
  } = req.body;

  if (
    [
      companyName,
      yourName,
      designation,
      estimateTime,
      attachProposal,
      contractId,
    ].some((field) => typeof field === "string" && field.trim() === "")
  ) {
    throw new ApiError(400, "All Fields Are Required");
  }

  const createProposal = await Proposal.create({
    companyName,
    yourName,
    designation,
    estimateTime,
    attachProposal,
    otherDetails,
    contractId,
  });

  if (!createProposal) {
    throw new ApiError(500, "Failed to Create Proposal");
  }
  console.log("Create Proposal ", createProposal);
  return res
    .status(201)
    .json(new ApiResponse(200, createProposal, "Proposal Send Successfully"));
});

const GetContractDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !id.trim()) {
    throw new ApiError(400, "Contract Id is Required");
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const jsonData = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../db/JobData.json"))
  );

  const contractId = parseInt(id);

  const contract = jsonData.find((contract) => contract.id === contractId);

  if (!contract) {
    throw new ApiError(404, "Contract Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, contract, "Contract Found Successfully"));
});

const CreateContract = asyncHandler(async (req, res) => {
  const { title, image, description, location, endDate } = req.body;

  if (
    [title, image, description, location, endDate].some(
      (field) => typeof field === "string" && field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All Fields Are Required");
  }

  const createContract = await Contract.create({
    title, image, description, location, endDate
  })

  if (!createContract) {
    throw new ApiError(500, "Failed to Create Contract");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createContract, "Contract Created Successfully"))
});

export {
  singupContractor,
  uploadCompanyBusinessCard,
  jobsContractor,
  CreateProposal,
  GetContractDetails,
  CreateContract,
  Login
};
