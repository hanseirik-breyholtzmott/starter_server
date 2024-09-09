import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import csurf from "csurf";
//import connectToMongooseDB from "./db/mongodb";
import dotenv from "dotenv";
import {
  responseTimeMiddleware,
  morganMiddleware,
} from "./middleware/requestLogger";
import { config } from "./config";

dotenv.config();

//Router
import authRoutes from "./router/authRoutes";
import transactionRoutes from "./router/transactionRouter";

//delete after use
import shareRoutes from "./router/shareRoutes";

import router from "./router";
import userService from "./service/userService";

const app = express();
const SERVER_PORT = process.env.SERVER_PORT
  ? Number(process.env.SERVER_PORT)
  : 5000;
const SERVER_HOST = process.env.SERVER_HOST;

const allowedOrigins = [
  "http://localhost:3000", // Development
  "https://invest.folkekraft.no", // Production
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Check if the origin is in the allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true); // Origin allowed
      } else {
        callback(new Error("Not allowed by CORS")); // Origin not allowed
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow cookies or authentication headers
    exposedHeaders: ["Access-Control-Allow-Origin"], // Expose the CORS header
  })
);

//Middleware
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
//app.use(csurf({ cookie: true })); // CSRF protection for all routes
//Add the csurf to allow other websites to access the backend
app.use("/", router());
// Session middleware
app.use(
  session({
    secret: process.env.JWT_SECRET_KEY, // Replace with your actual secret key
    resave: false,
    saveUninitialized: true,
  })
);
//app.use(responseTimeMiddleware); // Custom response time tracking middleware
//app.use(morganMiddleware);       // Morgan request logging middleware

//Routes
app.use("/", authRoutes);
app.use("/", transactionRoutes);

//delete after use
app.use("/", shareRoutes);

// Healthcheck Route
app.get("/healthcheck", (req, res) => {
  return res.send("you are healthy");
});

// Connect to MongoDB using Mongoose
/** Connect to Mongo */
mongoose
  .connect(config.mongo.url, { retryWrites: true, w: "majority" })
  .then(() => {
    console.log("connected");
  })
  .catch((error) => {
    console.log(error);
  });

const server = http.createServer(app);
server.listen(SERVER_PORT, () => {
  console.log(`Server running on port: ${SERVER_HOST}:${SERVER_PORT}`);
});
