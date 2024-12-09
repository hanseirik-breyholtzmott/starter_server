import axios from "axios";

//Models
import UsersModel, { IUser, IUserModel } from "../models/users.model";

//Services
import userService from "./user.service";
import emailService from "./email.service";
import sessionService from "./session.service";

//Utils
import { hashValue, compareValue } from "../utils/bcrypt";
import { oneHourFromNow, oneMonthFromNow, ONE_DAY_MS } from "../utils/date";
import {
  RefreshTokenPayload,
  PasswordResetPayload,
  refreshTokenOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";
import {
  generateVerificationToken,
  generatePassword,
} from "../utils/helperFunctions";

//Logger
import { userLogger, sessionLogger, vippsLogger } from "../logger";

//Contants
import {
  UNAUTHORIZED,
  OK,
  NOT_FOUND,
  UNPROCESSABLE_CONTENT,
  INTERNAL_SERVER_ERROR,
} from "../utils/contants";

interface CreateUserResponse {
  user: IUserModel;
  accessToken: string;
  refreshToken: string;
}

//Email templates
import { getPasswordResetEmail } from "../emails/passwordReset.email";

//Create user
const createUser = async (user: IUser): Promise<CreateUserResponse | null> => {
  //Check if email exists
  const isEmailTaken = await userService.isEmailTaken(user.primaryEmailAddress);

  if (isEmailTaken) {
    userLogger.warn("Attempt to create user with existing email", {
      email: user.primaryEmailAddress,
    });
    return null;
  }

  if (user.ssn !== "") {
    const isSsnTaken = await userService.isSsnTaken(user.ssn);

    if (isSsnTaken) {
      userLogger.warn("Attempt to create user with existing SSN", {
        ssn: user.ssn,
      });
      return null;
    }
  }

  try {
    let password = user.password;
    if (!password) {
      password = generatePassword();
      userLogger.info("Generated password for new user", {
        email: user.primaryEmailAddress,
      });
    }

    const hashedPassword = await hashValue(password);

    const newUser = new UsersModel({
      ...user,
      verificationToken: generateVerificationToken(6),
      verificationTokenExpiresAt: oneMonthFromNow(),
      password: hashedPassword,
    });

    await newUser.save();
    userLogger.info("User created successfully", {
      email: user.primaryEmailAddress,
      id: newUser._id,
    });

    //Send verification email
    const { success, error } = await emailService.sendEmail(
      user.primaryEmailAddress,
      "Verify your email | Folkekraft",
      "Please verify your email by clicking the link below.",
      "Click here to verify your email."
    );

    if (!success) {
      userLogger.error("Failed to send verification email", { error: error });
    }

    //Create session
    const session = await sessionService.createSession(newUser.user_id);

    //Create refresh token
    const refreshToken = signToken(
      {
        sessionId: session._id.toString(),
      },
      refreshTokenOptions
    );

    //Create access token
    const accessToken = signToken({
      userId: newUser.user_id.toString(),
      sessionId: session._id.toString(),
    });

    return {
      user: newUser,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  } catch (error) {
    userLogger.error("Error trying to create a user:", { error: error });
    throw new Error("Failed to create a user.");
  }
};

interface LoginResponse {
  status: number;
  message: string;
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user: IUser | null;
}

//Login user
const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const user = await userService.getUserByEmail(email);

    if (!user) {
      userLogger.warn("User not found", { email: email });
      return {
        status: UNAUTHORIZED,
        message: "Email does not exist.",
        success: false,
        user: null,
      };
    }

    const isPasswordCorrect = await compareValue(password, user.password);

    if (!isPasswordCorrect) {
      userLogger.warn("Incorrect password", { email: email });
      return {
        status: UNAUTHORIZED,
        message: "Incorrect password.",
        success: false,
        user: null,
      };
    }

    // Update user's last login time
    user.lastSignInAt = new Date();
    await user.save();

    // Create a new session
    const session = await sessionService.createSession(user._id as string);

    // Create access token
    const accessToken = signToken({
      userId: user._id.toString(),
      sessionId: session._id.toString(),
    });

    // Create refresh token
    const refreshToken = signToken(
      {
        sessionId: session._id.toString(),
      },
      refreshTokenOptions
    );

    userLogger.info("User logged in successfully", {
      userId: user._id,
      email: user.primaryEmailAddress,
    });

    return {
      status: OK,
      message: "User logged in successfully",
      success: true,
      accessToken,
      refreshToken,
      user: {
        ...user.toObject(),
        _id: user._id.toString(),
      },
    };
  } catch (error) {
    console.error("Error in loginUser:", error);
    userLogger.error("Unexpected error in loginUser", {
      error: error.message,
      email,
    });
    throw error; // Re-throw the error to be caught in the controller
  }
};

//Verify email
const verifyEmail = async (userId: string, code: string) => {
  try {
    const user = await userService.getUserByUserId(userId);

    if (!user) {
      userLogger.warn("User not found", { userId: userId });
      return {
        status: NOT_FOUND,
        message: "User not found.",
        success: false,
        user: null as IUser | null,
      };
    }

    // Check if the verification code matches and the token is not expired
    const isCodeValid = user.verificationToken === code;
    const isTokenValid =
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt > new Date();

    if (isCodeValid && isTokenValid) {
      user.hasVerifiedPrimaryEmailAddress = true;
      user.verificationToken = null;
      user.verificationTokenExpiresAt = null;

      await user.save();

      // Log success
      userLogger.info("Email verified successfully", {
        userId: user.user_id,
        email: user.primaryEmailAddress,
      });

      //Send Email that user has verified their email
      const { success, error } = await emailService.sendEmail(
        user.primaryEmailAddress,
        "Email verified successfully",
        "Your email has been verified successfully.",
        "Click here to verify your email."
      );

      if (!success) {
        userLogger.error("Failed to send verification email", { error: error });
      }

      return {
        status: OK,
        message: "Email verified successfully",
        success: true,
      };
    } else {
      // Log failure due to invalid code or expired token
      userLogger.warn("Email verification failed", {
        userId: user.user_id,
        reason: isCodeValid ? "Expired token" : "Invalid code",
      });

      return {
        status: UNPROCESSABLE_CONTENT,
        message: "Invalid or expired verification code.",
        success: false,
      };
    }
  } catch (error) {
    userLogger.error("Error trying to verify email", { error: error });
    return {
      status: INTERNAL_SERVER_ERROR,
      message: "An error occurred while verifying the email.",
      success: false,
    };
  }
};

const refreshUserAccessToken = async (refreshToken: string) => {
  //console.log("refreshToken", refreshToken);
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken);

  //console.log("payload", payload);

  if (!payload) {
    return {
      status: UNAUTHORIZED,
      message: "Unauthorized",
      success: false,
    };
  }

  // Get the session based on the session ID in the token payload
  const session = await sessionService.getSessionById(payload.sessionId);

  console.log("session", session);

  if (!session || session.expiresAt < new Date()) {
    return {
      status: UNAUTHORIZED,
      message: "Unauthorized",
      success: false,
    };
  }

  const now = new Date();

  //refresh the session if it expires in the next 24hrs
  const sessionNeedsRefresh =
    session.expiresAt.getTime() - now.getTime() <= ONE_DAY_MS;

  if (sessionNeedsRefresh) {
    session.expiresAt = oneMonthFromNow();
    await session.save();
  }

  // Create a new access token
  const accessToken = signToken({
    userId: session.userId.toString(),
    sessionId: session._id.toString(),
  });

  // Optionally, refresh the refresh token if the session was extended
  const newRefreshToken = sessionNeedsRefresh
    ? signToken(
        {
          sessionId: session._id.toString(),
        },
        refreshTokenOptions
      )
    : undefined;

  return {
    status: OK,
    accessToken,
    refreshToken: newRefreshToken,
    userId: session.userId.toString(),
    success: true,
  };
};

//Send Password reset email
export const sendPasswordResetEmail = async (email: string) => {
  //Catch any erros taht were thrown and log them
  try {
    const user = await userService.getUserByEmail(email);

    if (!user) {
      userLogger.warn("User not found", { email: email });
      return {
        status: NOT_FOUND,
        message: "User not found.",
        success: false,
      };
    }

    //TODO: check for max password attempts ( 2 emails in 5 minutes)

    //Generate password reset token
    const expiresAt = oneHourFromNow();
    const verificationCode = generateVerificationToken(6);

    //Save verification code to user
    user.verificationToken = verificationCode;
    user.verificationTokenExpiresAt = expiresAt;
    await user.save();

    //Jwt token for password reset
    const passwordResetToken = signToken(
      {
        userId: user.user_id.toString(),
        email: user.primaryEmailAddress,
      },
      { expiresIn: "15m" }
    );

    // Get password reset email content
    const emailData = getPasswordResetEmail(passwordResetToken);

    const { success, error, data } = await emailService.sendEmail(
      email,
      emailData.subject,
      emailData.text,
      emailData.html
    );

    if (!success) {
      userLogger.error("Failed to send password reset email", { error: error });
      return {
        status: INTERNAL_SERVER_ERROR,
        message: "Failed to send password reset email",
        success: false,
      };
    }

    return {
      status: OK,
      message: "Password reset email sent successfully",
      success: true,
      emailId: data.id,
    };
  } catch (error) {
    userLogger.error("Error trying to send password reset email", {
      error: error,
    });
    return {
      status: INTERNAL_SERVER_ERROR,
      message: "Failed to send password reset email",
      success: false,
    };
  }
};

//reset password
export const resetPassword = async (token: string, password: string) => {
  //get the verification code from the user
  const { payload } = verifyToken<PasswordResetPayload>(token);

  if (!payload) {
    return {
      status: UNAUTHORIZED,
      message: "Unauthorized",
      success: false,
    };
  }
  const user = await userService.getUserByUserId(payload.userId as string);

  if (!user) {
    userLogger.warn("User not found", { userId: payload.userId });
    return {
      status: NOT_FOUND,
      message: "User not found.",
      success: false,
    };
  }

  user.password = await hashValue(password);

  await user.save();

  //delete all sessions for the user
  await sessionService.deleteSessionsByUserId(user.user_id);

  //log the success
  userLogger.info("Password reset successfully", {
    userId: user.user_id,
  });

  return {
    status: OK,
    message: "Password reset successfully",
    success: true,
  };
};

interface VippsLoginConfig {
  isProduction: boolean;
  clientId: string;
  redirectUri: string;
}

//Vipps login
export const generateVippsLoginUrl = async (config: VippsLoginConfig) => {
  const state = Math.random().toString(36).substring(7); // Generate random state
  const scopes = ["openid", "address", "email", "name", "phoneNumber"];

  const baseURL = config.isProduction
    ? "https://api.vipps.no/access-management-1.0/access/oauth2/auth"
    : "https://apitest.vipps.no/access-management-1.0/access/oauth2/auth";

  const loginUrl =
    `${baseURL}?` +
    `client_id=${encodeURIComponent(config.clientId)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(" "))}` +
    `&state=${state}` +
    `&redirect_uri=${config.redirectUri}`;

  vippsLogger.info("Generated Vipps login URL", { loginUrl });

  return loginUrl;
};

const vippsLogin = async () => {
  try {
    const config = {
      isProduction: process.env.NODE_ENV === "production",
      clientId: process.env.VIPPS_CLIENT_ID!,
      redirectUri: process.env.VIPPS_REDIRECT_URI!,
    };

    const loginUrl = generateVippsLoginUrl(config);

    return {
      status: OK,
      message: "Vipps login URL generated successfully",
      success: true,
      loginUrl: loginUrl,
    };
  } catch (error) {
    vippsLogger.error("Error generating Vipps login URL", { error: error });
    throw new Error("Failed to generate Vipps login URL.");
  }
};

interface VippsTokenResponse {
  success: boolean;
  message: string;
  access_token?: string;
  error?: string;
}

interface VippsCallbackResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  details?: string;
}

interface VippsUserInfoResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  details?: string;
}

// Define a type for the OpenID configuration
interface OpenIDConfig {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
}

// Function to fetch OpenID configuration
const fetchOpenIDConfig = async (): Promise<OpenIDConfig> => {
  const isProduction = process.env.NODE_ENV === "production";
  const configUrl = isProduction
    ? "https://api.vipps.no/access-management-1.0/access/.well-known/openid-configuration"
    : "https://apitest.vipps.no/access-management-1.0/access/.well-known/openid-configuration";

  const response = await axios.get(configUrl);
  return response.data;
};

// Function to get Vipps token
const getVippsToken = async (code: string): Promise<VippsTokenResponse> => {
  try {
    const { token_endpoint } = await fetchOpenIDConfig();

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Merchant-Serial-Number": process.env.VIPPS_MSN!,
      "Vipps-System-Name": "folkekraft",
      "Vipps-System-Version": "1.0.0",
      "Vipps-System-Plugin-Name": "folkekraft-api",
      "Vipps-System-Plugin-Version": "1.0.0",
      "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
    };

    const response = await axios.post(
      token_endpoint,
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.VIPPS_REDIRECT_URI!,
      }).toString(),
      {
        headers,
        auth: {
          username: process.env.VIPPS_CLIENT_ID!,
          password: process.env.VIPPS_CLIENT_SECRET!,
        },
      }
    );

    if (response.data.access_token) {
      return {
        success: true,
        message: "Successfully retrieved access token",
        access_token: response.data.access_token,
      };
    } else {
      return {
        success: false,
        message: "No access token in response",
        error: "Missing access token",
      };
    }
  } catch (error) {
    return handleAxiosError(error, "Failed to get token");
  }
};

// Function to get Vipps user info
export const vippsUserInfo = async (
  accessToken: string
): Promise<VippsUserInfoResponse> => {
  try {
    const { userinfo_endpoint } = await fetchOpenIDConfig();

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
      "Merchant-Serial-Number": process.env.VIPPS_MSN!,
      "Vipps-System-Name": "folkekraft",
      "Vipps-System-Version": "1.0.0",
      "Vipps-System-Plugin-Name": "folkekraft-api",
      "Vipps-System-Plugin-Version": "1.0.0",
    };

    const response = await axios.get(userinfo_endpoint, { headers });

    return {
      success: true,
      message: "User info retrieved",
      data: response.data,
    };
  } catch (error) {
    return handleAxiosError(error, "Error retrieving user info");
  }
};

// Helper function to handle Axios errors
const handleAxiosError = (error: any, defaultMessage: string) => {
  if (axios.isAxiosError(error)) {
    return {
      success: false,
      message: `${defaultMessage}: ${
        error.response?.data?.error_description || error.message
      }`,
      error: error.response?.data?.error || error.message,
    };
  } else {
    return {
      success: false,
      message: defaultMessage,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Define the handleVippsError function
const handleVippsError = ({
  error,
  error_description,
  state,
}: {
  error: string;
  error_description?: string;
  state?: string;
}): VippsCallbackResponse => {
  vippsLogger.error("Vipps error", { error, error_description, state });
  return {
    success: false,
    message: "Vipps error occurred",
    error,
    details: error_description,
  };
};

//Vipps callback
export const vippsCallback = async (
  code: string,
  error?: string,
  error_description?: string,
  state?: string
): Promise<VippsCallbackResponse> => {
  // Handle Vipps-specific errors first
  if (error) {
    return handleVippsError({ error, error_description, state });
  }

  try {
    vippsLogger.debug("Starting Vipps callback process", { code });

    const tokenResponse = await getVippsToken(code);
    if (!tokenResponse.success) {
      vippsLogger.error("Failed to get Vipps token", {
        error: tokenResponse.error,
      });
      return {
        success: false,
        message: "Failed to exchange code for token",
        error: tokenResponse.error,
      };
    }

    console.log("tokenResponse", tokenResponse);

    const userInfoResponse = await vippsUserInfo(tokenResponse.access_token);
    if (!userInfoResponse.success) {
      vippsLogger.error("Failed to get user info", {
        error: userInfoResponse.error,
      });
      return {
        success: false,
        message: "Failed to get user information",
        error: userInfoResponse.error,
      };
    }

    return {
      success: true,
      message: "Successfully retrieved user info",
      data: userInfoResponse.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      vippsLogger.error("Vipps API error", {
        status,
        data: errorData,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });

      // Handle specific HTTP status codes
      switch (status) {
        case 401:
          return {
            success: false,
            message: "Authentication failed with Vipps",
            error: "unauthorized",
            details: errorData?.message,
          };
        case 400:
          return {
            success: false,
            message: "Invalid request to Vipps",
            error: "bad_request",
            details: errorData?.message,
          };
        default:
          return {
            success: false,
            message: "Error communicating with Vipps",
            error: "api_error",
            details: errorData?.message,
          };
      }
    }

    vippsLogger.error("Unexpected error in vippsCallback", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      message: "Internal server error during Vipps authentication",
      error: "internal_error",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default {
  createUser,
  loginUser,
  verifyEmail,
  refreshUserAccessToken,
  sendPasswordResetEmail,
  resetPassword,
  generateVippsLoginUrl,
  vippsCallback,
};
