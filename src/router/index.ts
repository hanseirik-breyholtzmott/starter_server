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
import pdfRoutes from "./pdf.routes";

//Controllers
import updateController from "../controllers/update.controller";

//Middleware
import authenticate from "../middleware/authenticate";

const router = express.Router();

const allowedOrigins = [
  "http://localhost:3000",
  "https://invest.folkekraft.no",
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
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Content-Disposition"],
      credentials: true,
      exposedHeaders: ["Content-Disposition", "Content-Type"],
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
  router.use("/api/pdf", pdfRoutes);

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
