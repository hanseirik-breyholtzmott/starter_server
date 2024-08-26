import { Resend } from "resend";

//Service
import errorService from "./errorService";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (
  from: string,
  to: string[],
  subject: string,
  htmlContent: string
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: from,
      to: to,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data: data };
  } catch (error) {
    console.error("An unexpected error occured:", error);
    return { success: false, error: error };
  }
};

export default {
  sendEmail,
};
