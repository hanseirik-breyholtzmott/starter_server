import express from "express";

//Controllers
import companyAdminController from "../controllers/folkerkaft/company.admin.controller";
//Middleware

const router = express.Router();

router.get("/:companyId/", companyAdminController.getShareholderCount);

export default router;
