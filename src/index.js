import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("APP ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("Error OF App Connection : ", err));

/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.error("APP ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is Listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR: ", error);
    throw error;
  }
})();
*/
