import express from "express";

//Validation
import authValidation from "../middleware/validation/authValidation";

//Middleware
import cleanDataMiddleware from "../middleware/cleanData";

//Controller
import authController from "../controllers/auth.controller";

const router = express.Router();

router.post(
  "/register",
  cleanDataMiddleware,
  authValidation.register,
  authController.register
);

router.post("/login", authValidation.login, authController.login);

router.post("/refresh", authController.refreshToken);

router.get("/logout", authController.logout);

router.post(
  "/email/verify/:code",
  cleanDataMiddleware,
  authValidation.email,
  authController.verifyEmail
);

router.post(
  "/password/forgot",
  cleanDataMiddleware,
  authValidation.email,
  authController.forgotPassword
);

router.post("/password/reset/", authController.resetPassword);

//Vipps
router.get("/vipps/login", authController.vippsLogin);

router.get("/vipps/callback", authController.vippsCallback);

export default router;
