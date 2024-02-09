import mongoose, { Schema } from "mongoose";

const subscirptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.objectId,
      ref: "User",
    }, 
    channel: {
      type: Schema.Types.objectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model("Subscription", subscirptionSchema);
