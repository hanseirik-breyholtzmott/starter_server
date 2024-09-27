import express from "express";

//Validation
import authValidation from "../middleware/validation/authValidation";

//Middleware
import cleanDataMiddleware from "../middleware/cleanData";

//Controller

const router = express.Router();

/*
router.post("/register", cleanDataMiddleware, authValidation.register, userController.register);
router.post("/register", userController.register);

router.post("/login", userController.login);

router.post("/refresh-token", userController.refreshToken);

router.get("/logout", userController.logout);

router.get("/email/verify/:code", userController.verifyEmail);

router.get("/password/forgot", userController.resendVerificationEmail);

router.post("/password/reset/", userController.resetPassword);
*/

export default router;
