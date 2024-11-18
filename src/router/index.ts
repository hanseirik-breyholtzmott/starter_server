import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";

//Routes
import authRoutes from "./auth.routes";
import portfolioRoutes from "./portfolio.routes";
import transactionRoutes from "./transaction.routes";
import campaignRoutes from "./campaign.routes";

//Controllers
import updateController from "../controllers/update.controller";

//Middleware
import authenticate from "../middleware/authenticate";

const router = express.Router();

const allowedOrigins = [
  "http://localhost:3000", // Development
  "https://invest.folkekraft.no", // Production
];

export default (): express.Router => {
  //Middleware
  router.use(compression());
  router.use(cookieParser());
  router.use(bodyParser.json());
  router.use(express.urlencoded({ extended: true }));
  router.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
          var msg =
            "The CORS policy for this site does not allow access from the specified Origin.";
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
      allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
      credentials: true, // Allow cookies or authentication headers
      exposedHeaders: ["Access-Control-Allow-Origin"], // Expose the CORS header
    })
  );
  router.use(
    session({
      secret: process.env.JWT_SECRET_KEY,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
      },
    })
  );

  router.use("/auth", authRoutes);
  router.use("/api/user", portfolioRoutes);
  router.use("/api/user", transactionRoutes);
  router.use("/api/campaign", campaignRoutes);

  //Healthcheck Route
  router.get("/healthcheck", async (req, res) => {
    console.log("healthcheck");
    return res.send("you are healthy");
  });

  router.get("/update", async (req, res) => {
    console.log("healthcheck");
    return res.send("you are healthy");
  });
  /*
  router.get("/createCompany", updateController.createCompany); //Works
  router.get("/createCampaign", updateController.createCampaign); //Works
  router.get("/update", updateController.updateSystems);

  router.get(
    "/updateShareTransactions",
    updateController.updateShareTransactions
  ); //Works

  router.get("/checkShareUser", updateController.checkShareUser); //Works
 */
  router.get("/test", async (req, res) => {
    return res.status(200).json({ message: "test" });
  });
  return router;
};
