import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

import jwt from "jsonwebtoken";
import { extractPublicId } from "cloudinary-build-url";
import mongoose from "mongoose";


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

// Tested
const registerUser = asyncHandler(async (req, res) => {
  // Get User Details From Frontend
  const { fullName, email, username, password } = req.body;
  console.log("Email & Username ", email, username);

  // Validate Not empty
  if (
    [fullName, email, username, password].some((filed) => filed.trim() === "")
  ) {
    throw new ApiError(400, "All Fields Are Required");
  }

  // Check if User Already Exist
  const exitsedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (exitsedUser) {
    throw new ApiError(409, "User With Email or Username Already Exist");
  }

  // Check if Avatar and Cover Image is uploaded
  const avatarLocalPath = req.files?.avatar[0].path;

  // check if coverImage is uploaded then get the path
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Images is Required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // if coverImage is uploaded then upload it on cloudinary (save a cloudinary request)
  let coverImage;

  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  if (!avatar) {
    throw new ApiError(500, "Failed to upload Avatar Image");
  }

  if (coverImageLocalPath && !coverImage) {
    throw new ApiError(500, "Failed to upload Cover Image");
  }

  // Create User in Database
  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  console.log("user : ", user);
  // remove Password and Refresh Token from response
  const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log("Create User ", createUser);
  // CreateUser Send Response
  if (!createUser) {
    throw new ApiError(500, "Failed to Create User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createUser, "User Created Successfully"));
});

// Tested
const loginUser = asyncHandler(async (req, res) => {
  // Get User Details From Frontend

  const { email, password, username } = req.body;

  console.log(email, password, username);

  // Check For all filed are required
  if ([email || username, password].some((filed) => filed.trim() === "")) {
    throw new ApiError(400, "All Fields Are Required");
  }

  // Check if User Exist
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

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

// Tested
const logoutUser = asyncHandler(async (req, res) => {
  // fing user by id and update the refresh token to false
  await User.findByIdAndUpdate(
    req.user._id,
    { refreshToken: false },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // clear the cookies and send the response
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

// Tested
const refreshAccessToken = asyncHandler(async (req, res) => {
  // get the refresh token from the cookies or from the request body
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "unauthorized Request");
  }

  console.log("incoming Refresh Token : ", incomingRefreshToken);
  try {
    // verify the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // find the user by id
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    // check if the refresh token is valid
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is Expired or used");
    }

    // generate new access and refresh token
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

// Tested
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get old password, new password and confirm password from the request body
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // check if all fields are not empty
  if (
    [oldPassword, newPassword, confirmPassword].some(
      (filed) => filed.trim() === ""
    )
  ) {
    throw new ApiError(400, "All Fields Are Required");
  }

  // check if new password and confirm password are same
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Password and Confirm Password Must be Same");
  }

  const user = await User.findById(req.user?._id);

  // check if old password is correct
  const isPasswordCorect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

// Tested
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req?.user, "User Details Fetched Successfully"));
});

// Tested
const updateUserDetails = asyncHandler(async (req, res) => {
  // get full name and email from the request body
  const { fullName, email } = req.body;

  // check if all fields are not empty
  if ([fullName, email].some((filed) => filed.trim() === "")) {
    throw new ApiError(401, "All Fields Are Required");
  }

  // find and update the user details
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Details Updated Successfully"));
});

// Tested
const updateUserAvatar = asyncHandler(async (req, res) => {
  // get the avatar local path from the request file
  const avatarLocalPath = req.file?.path;

  // check if avatar is uploaded
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is Required");
  }

  // get the public id of the old avatar image
  const avatarDeleteID = extractPublicId(req.user?.avatar);

  // upload the new avatar image on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload Avatar Image");
  }

  // find and update the user avatar
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  // delete the old avatar image from cloudinary
  if (avatarDeleteID) {
    const deleteAvatar = await deleteFromCloudinary(avatarDeleteID);

    if (!deleteAvatar) {
      throw new ApiError(500, "Upload Time Failed to delete Old Avatar Image ");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Image Updated Successfully"));
});

// Tested
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // get the cover image local path from the request file
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is Required");
  }

  // get the public id of the old cover image
  const coverImageDeleteID = extractPublicId(req.user?.coverImage);

  // upload the new cover image on cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(500, "Failed to upload Cover Image");
  }

  // find and update the user cover image
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password");

  // delete the old cover image from cloudinary
  if (coverImageDeleteID) {
    const deleteCoverImage = await deleteFromCloudinary(coverImageDeleteID);

    if (!deleteCoverImage) {
      throw new ApiError(500, "Upload Time Failed to delete Old Cover Image ");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // get the username from the request params
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is Missing");
  }

  // find the channel by username
  const channel = await User.aggregate([
    {
      // match the username
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      // lookup for the total subscribers of the channel
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      // lookup for the total channels subscribed by the user
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      // add the subscribers count and channels subscribed to count to the channel object and check if the logged in user is subscribed to the channel or not
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            $in: [req.user?._id, "$subscribers.subscriber"],
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  // if channel not found then throw an error
  if (!channel?.length) {
    throw new ApiError(404, "Channel Not Found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel Profile Fetched Successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // find the user by id and populate the watch history
  const user = await User.aggregate([
    {
      // match the user by id
      $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      // lookup for the watch history of the user
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // pipline for the watch history to get the owner of the video
        pipeline: [
          {
            // lookup for the owner of the video
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              // pipline for the owner to get the required fields
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            // add the owner to the video object
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  // if user not found then throw an error
  if (!user?.length) {
    throw new ApiError(404, "User Not Found in Watch History");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        "Watch History Fetched Successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};

// for user channel profile
// {
//   $addFields: {
//     subscribersCount: { $size: "$subscribers" },
//     channelsSubscribedToCount: { $size: "$subscribedTo" },
//   },
// },
// {
//   $set: {
//     isSubscribed: {
//       $cond: {
//         if: {
//           $gt: [{ $indexOfArray: ["$subscribers.subscriber", req.user?._id] }, -1],
//         },
//         then: true,
//         else: false,
//       },
//     },
//   },
// },
