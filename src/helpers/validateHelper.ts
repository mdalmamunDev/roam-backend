import { StatusCodes } from "http-status-codes";
import ApiError from "../errors/ApiError";
import { Types } from "mongoose";
import { Request } from "express";


// Utility function for validating required fields
export const validateFieldsRequired = (fields: any[]) => {
    const missingFields = fields.filter(field => !field);
    if (missingFields.length) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Missing required fields: ${missingFields.join(', ')}`);
    }
};

// Utility function to validate array of ObjectIds
export const validateObjectIds = (array: any[], required = false) => {
    if (required && !array) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Array is required');
    }
    if (array && (!Array.isArray(array) || !array.every(item => Types.ObjectId.isValid(item)))) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Array must contain valid ObjectIds');
    }
};

// Utility function to validate array of objects with ObjectIds
export const validateObjectArrayWithObjectId = (array: any[], id_key: string, required = false) => {
    if (required && !array) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Array is required');
    }
    if (array && (!Array.isArray(array) || !array.every(item => Types.ObjectId.isValid(item[id_key])))) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Array must contain valid ObjectIds in the '${id_key}' field`);
    }
};

// Utility function for validating arrays of strings
export const validateStringsArray = (array: any[], required = false) => {
    if (required && !array) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Array is required');
    }
    if (array && (!Array.isArray(array) || !array.every(item => typeof item === 'string'))) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Array must contain strings');
    }
};

// Utility function for validating file object
export const validateFileAndGetName = (req: Request, required = false) => {
    if (required && (!req?.file || !req?.file.filename)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'File is required and must be valid');
    }

    if (req.file && !req.file.filename) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'File is not valid');
    }

    return req?.file?.filename || null;
};