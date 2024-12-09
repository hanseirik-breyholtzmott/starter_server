import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
//import csurf from "csurf";
import dotenv from "dotenv";
import ngrok from "ngrok";
import {
  responseTimeMiddleware,
  morganMiddleware,
} from "./middleware/requestLogger";
import { config } from "./config";
import { vippsLogger } from "./logger";

dotenv.config();

const SERVER_PORT = process.env.SERVER_PORT
  ? Number(process.env.SERVER_PORT)
  : 5000;
const SERVER_HOST = process.env.SERVER_HOST;

//Routes
import router from "./router";

const app = express();

//Routes
app.use("/", router());

// Connect to MongoDB using Mongoose
mongoose
  .connect(config.mongo.url, { retryWrites: true, w: "majority" })
  .then(() => {
    console.log("connected");
  })
  .catch((error) => {
    console.log(error);
  });

const server = http.createServer(app);
server.listen(SERVER_PORT, async () => {
  console.log(`Server running on port: ${SERVER_HOST}:${SERVER_PORT}`);

  // Start ngrok for development mode
  if (process.env.NODE_ENV === "stage") {
    try {
      const url = await ngrok.connect({
        addr: 5000, // Change this to match the port of your Express server
        web_addr: "127.0.0.1:4040", // Specify a different port for ngrok's web interface
      });
      console.log(`ngrok tunnel available at: ${url}`);
    } catch (error) {
      console.error("Error starting ngrok:", error);
    }
  }
});

// Verify Vipps configuration
const requiredEnvVars = [
  "VIPPS_CLIENT_ID",
  "VIPPS_CLIENT_SECRET",
  "VIPPS_SUBSCRIPTION_KEY",
  "VIPPS_MSN",
  "VIPPS_REDIRECT_URI",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);
if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

vippsLogger.info("Vipps configuration loaded", {
  clientId: process.env.VIPPS_CLIENT_ID,
  msn: process.env.VIPPS_MSN,
  redirectUri: process.env.VIPPS_REDIRECT_URI,
  hasSecret: !!process.env.VIPPS_CLIENT_SECRET,
  hasSubKey: !!process.env.VIPPS_SUBSCRIPTION_KEY,
  environment: process.env.NODE_ENV,
});
