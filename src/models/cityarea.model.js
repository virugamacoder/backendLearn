import mongoose from "mongoose";

const cityareaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        }
    }
    , {
        timestamps: true,
    })

export const Cityarea = mongoose.model("Cityarea", cityareaSchema)