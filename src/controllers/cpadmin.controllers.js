import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Designation } from "../models/designation.model.js";
import { Cityarea } from "../models/cityarea.model.js";

const createDesignation = asyncHandler(async (req, res) => {

    const { designation } = req.body;

    if (!designation || !designation.trim()) {
        throw new ApiError(400, "Designation is Required");
    }
    
    const checkDesignation = await Designation.findOne({ designation });

    if (checkDesignation) {
        throw new ApiError(400, "Designation Already Exist");
    }

    const createDesignation = await Designation.create({ designation });

    if (!createDesignation) {
        throw new ApiError(500, "Failed to Create Designation");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, designation, "Designation Created Successfully"));

});

const getDesignation = asyncHandler(async (req, res) => {
    const designation = await Designation.find();

    if (!designation) {
        throw new ApiError(404, "Designation Not Found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, designation, "Designation Fetched Successfully"));
});

const createCityArea = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim() ) {
        throw new ApiError(400, "City and Area Name is Required");
    }

    const checkName = await Cityarea.findOne({ name });

    if (checkName) {
        throw new ApiError(400, "City or Area Name Already Exist");
    }

    const createName = await Cityarea.create({ name });

    if (!createName) {
        throw new ApiError(500, "Failed to Create City or Area");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, createName, "City or Area Created Successfully"));
});

const getCityArea = asyncHandler(async (req, res) => {
    const name = await Cityarea.find();

    if (!name) {
        throw new ApiError(404, "City or Area Not Found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, name, "City or Area Fetched Successfully"));
});

export { createDesignation,getDesignation ,createCityArea ,getCityArea};