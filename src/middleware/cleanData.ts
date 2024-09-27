import { Request, Response, NextFunction } from "express";

//Function to remove script tags and evernt handlers from strings
const sanitizeString = (str: string): string => {
  //Remove script tags
  let cleanedString = str.replace(/<script.*?<\/script>/g, "");
  //Remove inline event handlers
  cleanedString = cleanedString.replace(/ on\w+=".*?"/gi, "");
  return cleanedString.trim();
};

//Recursive function to clean object properties
const cleanData = (data: any): any => {
  if (typeof data === "string") {
    return sanitizeString(data);
  } else if (Array.isArray(data)) {
    return data.map((item) => cleanData(item));
  } else if (typeof data === "object" && data !== null) {
    const cleanedObject: any = {};
    for (const key in data) {
      cleanedObject[key] = cleanData(data[key]);
    }
    return cleanedObject;
  }
  return data;
};

//Middleware to clean data
const cleanDataMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.body = cleanData(req.body);
  next();
};

export default cleanDataMiddleware;
