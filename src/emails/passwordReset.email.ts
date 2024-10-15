export const getPasswordResetEmail = (token: string) => {
  const resetUrl = `${process.env.CLIENT_BASE_URL}/reset-password?token=${token}`;
  return {
    subject: "Password Reset Request",
    text: `Click the following link to reset your password: ${resetUrl}`,
    html: `
      <h1>Password Reset</h1>
      <p>You have requested to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}" style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">
        Reset Password
      </a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };
};
