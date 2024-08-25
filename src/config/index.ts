import dotenv from "dotenv";

dotenv.config();

const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGO_URL = process.env.MONGODB_URL;

const SERVER_PORT = process.env.SERVER_PORT
  ? Number(process.env.SERVER_PORT)
  : 5000;

export const config = {
  mongo: {
    url: MONGO_URL,
  },
  server: {
    port: SERVER_PORT,
  },
  url: {
    protocol: "http",
    hostname: "localhost",
    port: 5000,
    uri: "http://localhost:5000",
  },
};
