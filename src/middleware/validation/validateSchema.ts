import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { BAD_REQUEST } from "../../utils/contants";

//Middleware for validating request data using zod schema
export const validateSchema = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("req.body", req.body);
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        //If validation fails, respond with a 400 status and the error details
        return res.status(BAD_REQUEST).json({
          success: false,
          message: "Invalid request data",
          error: error.errors,
        });
      }
    }
  };
};
