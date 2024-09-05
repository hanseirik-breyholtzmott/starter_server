import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import csurf from "csurf";
import connectToMongooseDB from "./db/mongodb";
import dotenv from "dotenv";
import {
  responseTimeMiddleware,
  morganMiddleware,
} from "./middleware/requestLogger";
import { config } from "./config";

dotenv.config();

//Router
import authRoutes from "./router/authRoutes";

//delete after use
import shareRoutes from "./router/shareRoutes";

import router from "./router";
import userService from "./service/userService";

const app = express();
const SERVER_PORT = process.env.SERVER_PORT
  ? Number(process.env.SERVER_PORT)
  : 5000;
const SERVER_HOST = process.env.SERVER_HOST;

app.use(
  cors({
    origin: process.env.CLIENT_BASE_URL, // Or '*' to allow all origins, though not recommended for security reasons
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers if necessary
    credentials: true, // If you're dealing with cookies or HTTP authentication
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
