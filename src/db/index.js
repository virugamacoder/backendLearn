import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URI}${DB_NAME}`
    );

    console.log(`\n DATABASE CONNECTED , HOST = ${connectionInstance.connection.host} \n DATABASE NAME = ${connectionInstance.connection.name} \n `);
  
} catch (error) {
    console.error("DATABASE CONNECTION ERROR: ", error);
    process.exit(1);
  }
};

export default connectDB;   
