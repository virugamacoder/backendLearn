import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

// verifyToken to verify the token and send a user details to the next middleware or route handler
export const verifyToken = asyncHandler(async (req, _, next) => {
  // get a cookies from the request
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Check if token is not then throw an error
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // if token are available then verify the token and get the user details
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //   find user by id and remove password and refresh token from the user object
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    //   if user not found then throw an error
    if (!user) {
      throw new ApiError(404, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
