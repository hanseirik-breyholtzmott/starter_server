import { Resend } from "resend";

//Logger
import { emailLogger } from "../logger";

// Ensure the environment variables are set correctly
if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set.");
}

if (!process.env.RESEND_TEST_EMAIL) {
  throw new Error("RESEND_TEST_EMAIL environment variable is not set.");
}

const getFromEmail = () => {
  const email =
    process.env.NODE_ENV === "production"
      ? process.env.FROM_EMAIL
      : process.env.RESEND_TEST_EMAIL;
  return `${process.env.COMPANY_NAME} <${email}>`;
};

const getToEmail = (to: string | string[]) => {
  // Only use test email in development environment
  /*if (process.env.NODE_ENV === "development") {
    return process.env.RESEND_TEST_EMAIL;
  }*/

  // For stage and production, use the actual recipient email
  return to;
};

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailResponse {
  success: boolean;
  data?: any;
  error?: any;
}

const sendEmail = async (
  to: string | string[],
  subject: string,
  text: string,
  html: string
): Promise<SendEmailResponse> => {
  try {
    const fromEmail =
      process.env.EMAIL_FROM || "Folkekraft <no-reply@folkekraft.no>";

    console.log("Sending email to:", to);
    console.log("From:", fromEmail);

    // Send email
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: getToEmail(to),
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      emailLogger.error("Failed to send email", { error, to, subject });
      return { success: false, error: error };
    }

    console.log("Email sent successfully. Response data:", data);
    emailLogger.info("Email sent successfully", { to, subject });
    return { success: true, data: data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Email sending error:", errorMessage);
    emailLogger.error("An unexpected error occurred while sending email", {
      error: errorMessage,
      to,
      subject,
    });
    return { success: false, error: errorMessage };
  }
};

export default {
  sendEmail,
};
