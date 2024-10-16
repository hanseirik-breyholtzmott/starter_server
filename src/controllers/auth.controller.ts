import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import axios from "axios";

//Services
import userService from "../service/user.service";
import authService from "../service/auth.service";
import sessionService from "../service/session.service";
import emailService from "../service/email.service";

//Models
import UsersModel, { IUser } from "../models/users.model";

//Logger
import { userLogger } from "../logger";

//Utils
import {
  OK,
  CREATED,
  BAD_REQUEST,
  UNAUTHORIZED,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} from "../utils/contants";
import { ONE_HOUR_MS, ONE_MONTH_MS } from "../utils/date";
import { signToken, verifyToken, refreshTokenOptions } from "../utils/jwt";
import { generateVerificationToken } from "../utils/helperFunctions";

const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;

  console.log("register", firstName, lastName, email, password);

  try {
    const user: IUser = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      primaryEmailAddress: email,
      emailAddresses: [email],
      ssn: "",
      roles: [
        {
          name: "user",
          permissions: [
            "limited_access",
            "view_personal_data",
            "use_core_features",
          ],
        },
      ],
      password,
    };

    const response = await authService.createUser(user);

    if (response) {
      const { user: createdUser, accessToken, refreshToken } = response;

      const sanitizedUser = {
        userId: createdUser.user_id,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        email: createdUser.primaryEmailAddress,
      };

      userLogger.info("User registered successfully", {
        userId: createdUser.user_id,
      });

      return res.status(CREATED).json({
        status: CREATED,
        success: true,
        message: "User registered successfully",
        user: sanitizedUser,
        accessToken,
        refreshToken,
      });
    } else {
      return res.status(BAD_REQUEST).json({
        status: BAD_REQUEST,
        success: false,
        message: "User not created",
        user: null,
        accessToken: null,
        refreshToken: null,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  console.log("login", email, password);

  try {
    const result = await authService.loginUser(email, password);
    return res.status(OK).json(result);
  } catch (error) {
    console.error("Login error:", error);
    userLogger.error("Error during login", { error: error.message, email });
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: INTERNAL_SERVER_ERROR,
      success: false,
      message: "An error occurred during login",
      error: error.message,
    });
  }
};

const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.session as string | undefined;

    console.log("session cookie", refreshToken);

    if (!refreshToken) {
      return res.status(OK).json({
        status: UNAUTHORIZED,
        success: false,
        message: "Refresh token not found",
        refreshToken: null,
      });
    }

    //console.log("refreshToken", refreshToken);

    const result = await authService.refreshUserAccessToken(refreshToken);

    //console.log("result", result);

    if (result.success) {
      const user = await userService.getUserById(result.userId);

      const sanitizedUser = {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.primaryEmailAddress,
      };

      return res.status(OK).json({
        status: OK,
        success: true,
        message: "Token refreshed successfully",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: sanitizedUser,
      });
    } else {
      return res.status(OK).json({
        status: result.status,
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logout = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const accessToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

  console.log("accessToken", accessToken);
  const { payload } = verifyToken(accessToken || "");

  console.log("logout", payload);

  try {
    if (payload && payload.sessionId) {
      // Delete the session from database
      await sessionService.deleteSessionById(payload.sessionId as string);

      userLogger.info("User logged out successfully", {
        userId: payload.userId,
      });

      return res.status(OK).json({
        status: OK,
        success: true,
        message: "Logout successful",
      });
    } else {
      userLogger.warn("Logout attempt with invalid token", { accessToken });
      return res.status(UNAUTHORIZED).json({
        status: UNAUTHORIZED,
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    userLogger.error("Error during logout", { error: error.message, payload });
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: INTERNAL_SERVER_ERROR,
      success: false,
      message: "An error occurred during logout",
    });
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  const { code } = req.params;
  const { email } = req.body;

  try {
    if (code) {
      // Call the auth service to verify email
      const response = await authService.verifyEmail(code, email);
      return res.status(response.status).json(response);
    } else {
      // Send a new verification email
      const user = await userService.getUserByEmail(email);

      if (!user) {
        return res.status(NOT_FOUND).json({
          status: NOT_FOUND,
          success: false,
          message: "User not found",
        });
      }

      const newCode = generateVerificationToken(6);
      user.verificationToken = newCode;
      user.verificationTokenExpiresAt = new Date(Date.now() + ONE_HOUR_MS);
      await user.save();

      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${newCode}`;

      const emailResult = await emailService.sendEmail(
        email,
        "Verify Your Email | Folkekraft",
        `Please verify your email by clicking the link: ${verificationUrl}`,
        `
        <h1>Email Verification</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you didn't request this, please ignore this email.</p>
        `
      );

      if (emailResult?.success) {
        userLogger.info("Verification email sent successfully", { email });
        return res.status(OK).json({
          status: OK,
          success: true,
          message: "Verification email sent successfully",
        });
      } else {
        userLogger.error("Failed to send verification email", {
          email,
          error: emailResult?.error || "Unknown error",
        });
        return res.status(INTERNAL_SERVER_ERROR).json({
          status: INTERNAL_SERVER_ERROR,
          success: false,
          message: "Failed to send verification email",
        });
      }
    }
  } catch (error) {
    userLogger.error("Error in verifyEmail", { error: error.message });
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: INTERNAL_SERVER_ERROR,
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};

const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const result = await authService.sendPasswordResetEmail(email);

    if (result.success) {
      userLogger.info("Password reset email sent successfully", { email });
      return res.status(OK).json({
        status: OK,
        success: true,
        message: "Password reset email sent successfully",
      });
    } else {
      return res.status(OK).json({
        status: result.status,
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    userLogger.error("Error in forgotPassword", {
      error: error.message,
      email,
    });
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: INTERNAL_SERVER_ERROR,
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};

const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  try {
    const result = await authService.resetPassword(token, newPassword);

    if (result.success) {
      return res.status(OK).json({
        status: OK,
        success: true,
        message: "Password reset successfully",
      });
    } else {
      return res.status(result.status).json({
        status: result.status,
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    userLogger.error("Error in resetPassword", {
      error: error.message,
      token,
    });
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: INTERNAL_SERVER_ERROR,
      success: false,
      message: "An error occurred while resetting the password",
    });
  }
};

const vippsLogin = async (req: Request, res: Response) => {
  try {
    const config = {
      isProduction: true, //process.env.NODE_ENV === "production",
      clientId: process.env.VIPPS_CLIENT_ID!,
      redirectUri: process.env.VIPPS_REDIRECT_URI!,
    };

    const redirectUrl = await authService.generateVippsLoginUrl(config);

    userLogger.info("Vipps login URL generated successfully: ", redirectUrl);

    return res.status(OK).json({
      status: OK,
      success: true,
      message: "Vipps login URL generated successfully",
      redirectUrl: redirectUrl,
    });
  } catch (error) {
    userLogger.error("Error generating Vipps login URL", {
      error: error.message,
    });
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: INTERNAL_SERVER_ERROR,
      success: false,
      message: "Failed to generate Vipps login URL",
    });
  }
};

const vippsCallback = async (req: Request, res: Response) => {
  console.log("vippsCallback");
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    userLogger.warn("Invalid or missing code in Vipps callback");
    return res.status(BAD_REQUEST).json({
      status: BAD_REQUEST,
      success: false,
      message: "Invalid or missing code",
    });
  }

  try {
    const result = await authService.vippsCallback(code);

    if (result.success && result.data) {
      const userInfo = result.data;

      console.log("userInfo", userInfo);

      /*
       {
        address: {
          address_type: 'home',
          country: 'NO',
          formatted: 'VARDESVINGEN 76 B\n5141\nFYLLINGSDALEN\nNO',
          postal_code: '5141',
          region: 'FYLLINGSDALEN',
          street_address: 'VARDESVINGEN 76 B'
        },
        email: 'hbreyholtz@gmail.com',
        email_verified: true,
        other_addresses: [],
        phone_number: '4740223394',
        sid: '7ca810476d2cc3e8',
        sub: '453f354a-beca-4286-87d9-b09fc7623180'
        }
       */

      let user = await userService.getUserByEmail(userInfo.email);

      if (!user) {
        // create a new user
        const newUser: IUser = {
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          fullName: userInfo.name,
          primaryEmailAddress: userInfo.email,
          hasVerifiedPrimaryEmailAddress: true,
          emailAddresses: [userInfo.email],
          ssn: "",
          roles: [
            {
              name: "user",
              permissions: [
                "limited_access",
                "view_personal_data",
                "use_core_features",
              ],
            },
          ],
          password: "", // Consider setting a random password or handling this differently
          address: {
            street: userInfo.address.street_address || null,
            city: userInfo.address.region || null,
            postalCode: userInfo.address.postal_code || null,
            country: userInfo.address.country || null,
          },
          primaryPhoneNumber: userInfo.phone_number || null,
        };

        const createdUser = await authService.createUser(newUser);
        if (createdUser) {
          user = createdUser.user;
        } else {
          throw new Error("Failed to create new user");
        }
      }

      console.log("user", user._id.toString());

      // Create a session for the user
      const session = await sessionService.createSession(user._id.toString());

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

      userLogger.info("Vipps authentication successful", {
        userId: userInfo.sub,
      });

      res.cookie("session", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: ONE_MONTH_MS,
        path: "/",
      });

      return res.redirect(
        `${process.env.CLIENT_BASE_URL}/api/auth/callback/vipps`
      );

      return res.status(OK).json({
        status: OK,
        success: true,
        message: "Vipps authentication successful",
        accessToken,
        refreshToken,
        user: user,
      });
    } else {
      userLogger.warn("Vipps authentication failed", { error: result.message });
      return res.status(UNAUTHORIZED).json({
        status: UNAUTHORIZED,
        success: false,
        message: result.message || "Vipps authentication failed",
      });
    }
  } catch (error) {
    userLogger.error("Error in Vipps callback", { error: error.message });
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: INTERNAL_SERVER_ERROR,
      success: false,
      message: "An error occurred during Vipps authentication",
    });
  }
};

export default {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  vippsLogin,
  vippsCallback,
};
