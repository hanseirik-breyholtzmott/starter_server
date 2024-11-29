import express from "express";
import pdfController from "../controllers/pdf.controller";

const router = express.Router();

router.post("/share-certificate", pdfController.createShareCertificate);

export default router;
