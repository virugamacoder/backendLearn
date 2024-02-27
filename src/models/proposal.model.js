import mongoose, { Schema } from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
    },
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "CondoContractor",
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    yourName: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    estimateTime: {
      type: Number,
      required: true,
    },
    attachProposal: {
      type: String,
      required: true,
      trim: true,
    },
    otherDetails: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Proposal = mongoose.model("Proposal", proposalSchema);
