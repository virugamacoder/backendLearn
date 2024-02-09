import { Router } from "express";
import {
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
  getWatchHistory,
} from "../controllers/user.controllers.js";
import { upload } from "./../middlewares/multer.middlewares.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyToken, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyToken, changeCurrentPassword);

router.route("/current-user").get(verifyToken, getCurrentUser);

router.route("/update-account").patch(verifyToken, updateUserDetails);

router
  .route("/update-avatar")
  .patch(verifyToken, upload.single("avatar"), updateUserAvatar);

router
  .route("/update-coverimage")
  .patch(verifyToken, upload.single("coverImage"), updateUserCoverImage);

router.route("/channel/:username").get(verifyToken, getUserChannelProfile);

router.route("/watchhistory").get(verifyToken, getWatchHistory);

export default router;
