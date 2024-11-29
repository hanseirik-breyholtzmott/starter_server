import PDFDocument from "pdfkit";

const generateShareCertificatePDF = async (data: {
  name: string;
  shares: number;
  amount: number;
  date: string;
}) => {
  console.log("PDF Service - Received data:", data);
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  // Collect the PDF data in a buffer
  return new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // Add Title
    doc
      .fontSize(20)
      .text("Bekreftelse på tegning av aksjer", { align: "center" })
      .moveDown(1);

    // Add content
    doc
      .fontSize(12)
      .text(
        `Dette dokumentet bekrefter at ${data.name} har tegnet aksjer i FOLKEKRAFT AS:`
      )
      .moveDown(1)
      .text(`Navn: ${data.name}`)
      .moveDown(0.5)
      .text(`Tegnet antall aksjer: ${data.shares}`)
      .moveDown(0.5)
      .text(`Sum betalt: NOK ${data.amount}`)
      .moveDown(0.5)
      .text(`Tidspunkt: ${data.date}`)
      .moveDown(2)
      .text(`Daglig leder: ${data.name}`, { align: "left" })
      .moveDown(2)
      .fontSize(10)
      .text(
        `FOLKEKRAFT AS\nKanalveien 107, 5058 BERGEN\nOrgnr: 830068112\nEmisjon stengt: 06.09.2023`,
        { align: "center" }
      );

    doc.end();
  });
};

/*const generateShareCertificatePDF = async (data: {
  name: string;
  shares: number;
  amount: number;
  date: string;
}) => {
  let browser = null;
  try {
    console.log("PDF Service - Received data:", data);
    const { name, shares, amount, date } = data;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bekreftelse på tegning av aksjer</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px; 
                  line-height: 1.6; 
                  max-width: 800px; 
                  margin: 0 auto; 
              }
              h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
              .content { max-width: 600px; margin: auto; }
              .details p { margin: 5px 0; }
              .footer { text-align: center; font-size: 14px; margin-top: 30px; }
          </style>
      </head>
      <body>
          <div class="content">
              <h1>Bekreftelse på tegning av aksjer</h1>
              <p>Dette dokumentet bekrefter at <strong>${name}</strong> har tegnet aksjer i <strong>FOLKEKRAFT AS</strong>:</p>
              <div class="details">
                  <p><strong>Navn:</strong> ${name}</p>
                  <p><strong>Tegnet antall aksjer:</strong> ${shares}</p>
                  <p><strong>Sum betalt:</strong> NOK ${amount}</p>
                  <p><strong>Tidspunkt:</strong> ${date}</p>
              </div>
              <p><strong>Daglig leder:</strong> ${name}</p>
              <div class="footer">
                  <p>FOLKEKRAFT AS<br>Kanalveien 107, 5058 BERGEN<br>Orgnr: 830068112</p>
                  <p>Emisjon stengt: 06.09.2023</p>
              </div>
          </div>
      </body>
      </html>
    `;

    console.log("PDF Service - Launching browser");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    console.log("PDF Service - Generated PDF buffer length:", pdfBuffer.length);
    return pdfBuffer;
  } catch (error) {
    console.error("PDF Service - Error:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};*/

export default {
  generateShareCertificatePDF,
};
