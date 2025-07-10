import { z } from "zod";

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format.');

// Reusable validation for phone numbers
export const phoneValidation = z.string();

// Common date validation
export const dateValidation = z.string().
    refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format.',
    });


export const coordinatesValidation = z
    .array(z.number())
    .length(2, 'Location must be an array of exactly 2 numbers: [latitude, longitude].')
    .refine(
        ([lng, lat]) =>
            typeof lat === 'number' &&
            typeof lng === 'number' &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180,
        {
            message: 'Latitude must be between -90 and 90, and longitude between -180 and 180.',
        }
    );
