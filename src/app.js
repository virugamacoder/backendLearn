import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";
import { ApiResponse } from "./utils/ApiResponse.js";

const app = express();

// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true,
//   })
// );
app.use(cors());

app.use(express.json({ limit: "16kb" })); // for parsing application/json

app.use(express.urlencoded({ extended: true, limit: "16kb" })); // for parsing application/x-www-form-urlencoded

app.use(express.static("public")); // for serving static files  (public folder)

app.use(cookieParser()); // for parsing cookies

// router imports
import userRouter from "./routes/user.routes.js";
import condoRouter from "./routes/condo.routes.js";

// router diclarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/condo", condoRouter);

// Define your error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    // If the error is an instance of ApiError, send the error message as the response
    res
      .status(err.statusCode)
      .json(new ApiResponse(err.statusCode, null, err.message));
  } else {
    // For other types of errors, send a generic error message
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
});

// http://localhost:8000/api/v1/users/register

export { app };
