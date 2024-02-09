import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file on cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Check if file exists
    if (!localFilePath) return null;

    // Upload file on cloudinary and return responce
    const responce = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    
    // Delete file from local storage after uploading on cloudinary
    fs.unlinkSync(localFilePath);
    console.log("cloudinary responce : ", responce);
    return responce;
  } catch (error) {
    // Delete file from local storage if upload fails --> after returing null
    fs.unlinkSync(localFilePath);
    console.log("Cloudinary upload error", error);
    return null;
  }
};

const deleteFromCloudinary = async (cloudinaryPath) => {
  try {
    // Check if file exists
    if (!cloudinaryPath) return null;

    // Delete file from cloudinary
    const responce = await cloudinary.uploader.destroy(cloudinaryPath);
    console.log("cloudinary Delete File responce : ", responce);
    return responce;
  } catch (error) {
    throw new Error(error.message || "Failed to delete file ");
  }
};

export { uploadOnCloudinary,deleteFromCloudinary };
