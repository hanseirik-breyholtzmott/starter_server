import { Request, Response } from "express";

import pdfService from "../service/pdf.service";

/*const createShareCertificate = async (req: Request, res: Response) => {
  try {
    console.log("PDF Controller - Request body:", req.body);

    if (
      !req.body.name ||
      !req.body.shares ||
      !req.body.amount ||
      !req.body.date
    ) {
      console.error("PDF Controller - Missing required fields");
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { name, shares, amount, date } = req.body;

    // Generate PDF
    const pdfBuffer = await pdfService.generateShareCertificatePDF({
      name,
      shares: Number(shares),
      amount: Number(amount),
      date,
    });

    // Set headers explicitly
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.contentType("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Folkekraft-Investering-${name}.pdf`
    );

    // Send the PDF
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Controller - Error:", error);
    return res.status(500).json({
      message: "Error creating share certificate",
      error: error.message,
    });
  }
};*/

const createShareCertificate = async (req: Request, res: Response) => {
  try {
    console.log("PDF Controller - Request body:", req.body);

    const { name, shares, amount, date } = req.body;
    if (!name || !shares || !amount || !date) {
      console.error("PDF Controller - Missing required fields");
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const pdfBuffer = await pdfService.generateShareCertificatePDF({
      name,
      shares: Number(shares),
      amount: Number(amount),
      date,
    });

    // Set CORS headers first
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Then set PDF headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Folkekraft-Investering-${name}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Controller - Error:", error);
    res.status(500).json({
      message: "Error creating share certificate",
      error: error.message,
    });
  }
};

export default {
  createShareCertificate,
};
