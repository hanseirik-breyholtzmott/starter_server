import express from "express";

//Validation
import authValidation from "../middleware/validation/authValidation";

//Middleware
import cleanDataMiddleware from "../middleware/cleanData";

//Controller
import authController from "../controllers/auth.controller";
import portfolioController from "../controllers/portfolio.controller";

const router = express.Router();

router.get("/portfolio", portfolioController.getPortfolio);

router.get("/:userId/portfolio", portfolioController.getPortfolio);

export default router;
