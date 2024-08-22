import mongoose from "mongoose";
import { config } from "../config";
import { dbLogger } from "../logs";

const connectToMongooseDB = async () => {
  try {
    const mongooseConnection = await mongoose.connect(config.mongo.url, {
      retryWrites: true,
      w: "majority",
    });
    dbLogger.info("Connected to MongoDB via Mongoose");
    return mongooseConnection;
  } catch (err) {
    dbLogger.error("Error connecting to MongoDB via Mongoose", { error: err });
    process.exit(1);
  }
};

export default connectToMongooseDB;
