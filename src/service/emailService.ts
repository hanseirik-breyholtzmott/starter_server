import { Resend } from "resend";

//Service
import errorService from "./errorService";

// Ensure the environment variables are set correctly
if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set.");
}

if (!process.env.RESEND_TEST_EMAIL) {
  throw new Error("RESEND_TEST_EMAIL environment variable is not set.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailResponse {
  success: boolean;
  data?: any;
  error?: any;
}

const sendEmail = async (
  from: string,
  to: string[],
  subject: string,
  htmlContent: string
): Promise<SendEmailResponse> => {
  try {
    // Check if the current environment is staging
    const isStaging = process.env.NODE_ENV === "stage";

    console.log("Is Staging:", isStaging);

    // Use the test email address if in staging
    const recipientEmails = isStaging
      ? [process.env.RESEND_TEST_EMAIL as string]
      : to;

    console.log("Sending email to:", recipientEmails);

    // Send email
    const { data, error } = await resend.emails.send({
      from: from,
      to: recipientEmails,
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
    console.error("An unexpected error occurred:", error);
    return { success: false, error: (error as Error).message };
  }
};

export default {
  sendEmail,
};
