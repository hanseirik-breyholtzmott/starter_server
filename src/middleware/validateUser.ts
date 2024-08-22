import { Request, Response, NextFunction } from 'express';
import Joi, { ValidationError, ValidationErrorItem, ObjectSchema } from 'joi';
import { middlewareLogger } from 'logs'; 

export const userValidationSchema: ObjectSchema = Joi.object({
    user_id: Joi.string().uuid().optional(),
    firstName: Joi.string().allow(null).optional(),
    lastName: Joi.string().allow(null).optional(),
    fullName: Joi.string().allow(null).optional(),
    username: Joi.string().allow(null).optional(),
    hasImage: Joi.boolean().optional(),
    imageUrl: Joi.string().uri().required(),
    passkeys: Joi.array().items(Joi.any()).optional(),
    email: Joi.string().email(),
    primaryEmailAddress: Joi.string().email(),
    emailAddresses: Joi.array().items(Joi.any()).optional(),
    primaryPhoneNumber: Joi.any().optional(),
    phoneNumbers: Joi.array().items(Joi.any()).optional(),
    hasVerifiedPhoneNumber: Joi.boolean().optional(),
    externalAccounts: Joi.array().items(Joi.any()).optional(),
    organizationMemberships: Joi.array().items(Joi.any()).optional(),
    passwordEnabled: Joi.boolean().optional(),
    totpEnabled: Joi.boolean().optional(),
    twoFactorEnabled: Joi.boolean().optional(),
    deleteSelfEnabled: Joi.boolean().optional(),
    publicMetadata: Joi.object().optional(),
    privateMetadata: Joi.object().optional(),
    unsafeMetadata: Joi.object().optional(),
    stripeCustomerId: Joi.string().allow(null).optional(),
    subscriptions: Joi.array().items(Joi.string()).optional(),
    transactions: Joi.array().items(Joi.string()).optional(),
});

const getValidationErrorDetails = (error: ValidationError): string[] => {
    return error.details.map((detail: ValidationErrorItem) => detail.message);
};

const validateUser = (req: Request, res: Response, next: NextFunction): void => {
    console.log(req.body)
    const { error } = userValidationSchema.validate(req.body, { abortEarly: false }); // `abortEarly: false` to get all errors

    if (error) {
        const validationErrorDetails = getValidationErrorDetails(error);
        middlewareLogger.error(`User validation error: ${validationErrorDetails.join(', ')}`);
        res.status(400).json({ error: 'Validation error', details: validationErrorDetails });
    } else {
        next();
    }
};

export default validateUser;