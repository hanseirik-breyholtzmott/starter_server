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
  const email =
    process.env.NODE_ENV === "production" ? to : process.env.RESEND_TEST_EMAIL;
  return email;
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
    // Send email
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: getToEmail(to),
      subject,
      text,
      html,
    });

    if (error) {
      emailLogger.error("Failed to send email", { error, to, subject });
      return { success: false, error: error };
    }

    emailLogger.info("Email sent successfully", { to, subject });
    return { success: true, data: data };
  } catch (error) {
    emailLogger.error("An unexpected error occurred while sending email", {
      error: (error as Error).message,
      to,
      subject,
    });
    return { success: false, error: (error as Error).message };
  }
};

export default {
  sendEmail,
};
