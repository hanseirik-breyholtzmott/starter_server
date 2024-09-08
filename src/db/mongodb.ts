import mongoose from "mongoose";
import { config } from "../config";
import { dbLogger } from "../logger";

/*
interface MongoConfig {
  username: string;
  password: string;
  cluster: string;
  database: string;
}

const {
  mongo: {
    username: "username",
    password: "username",
    cluster: "username",
    database: "username",
  },
}: { mongo: MongoConfig } = config;

const MONGODB_URL = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_CLUSTER}/${MONGODB_DATABASE}`;

const connectToMongooseDB = async () => {
  try {
    const mongooseConnection = await mongoose.connect(MONGODB_URL, {
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
*/
