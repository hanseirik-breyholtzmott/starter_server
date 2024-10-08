import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import axios from "axios";

//Services
import userService from "../service/userService";
import tokenService from "../service/tokenService";
import sessionService from "../service/sessionService";
import notificationService from "../service/notificationService";
import emailService from "../service/emailService";
import errorService from "../service/errorService";
import transactionService from "../service/transactionService";
import sharesService from "../service/shareService";
import affiliateService from "../service/affiliateService";

//Models
import UsersModel, { IUser } from "../models/users.model";
import SessionModel from "../models/session.model";
import TransactionModel, { ITransaction } from "../models/transaction.model";
import SharesModel from "../models/shares.model";

//Types

//Logger
import { userLogger } from "../logger";

/** Controller */

const createUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, ssn, address } = req.body;

  try {
    const [isEmailTaken, isSsnTaken] = await Promise.all([
      userService.emailExists(email),
      userService.ssnExists(ssn),
    ]);

    if (isEmailTaken) {
      userLogger.warn("Email is already in use.", {
        email: email,
        user: req.body,
      });
      return errorService.handleClientError(
        res,
        400,
        "Email is already in use.",
        "The email address provided is already associated with another account."
      );
    }

    if (isSsnTaken) {
      userLogger.warn("There is an account already with your SSN.", {
        email: email,
        user: req.body,
      });
      return errorService.handleClientError(
        res,
        400,
        "There is an account already with your SSN.",
        "The ssn provided is already associated with another account."
      );
    }

    //Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    //Create a new user instance
    var newUser = new UsersModel({
      firstName: firstName || null,
      lastName: lastName || null,
      ssn: ssn,
      username: null,
      password: hashedPassword,
      primaryEmailAddress: email,
      emailAddresses: [email],
      passwordEnabled: true,
      hasVerifiedPrimaryEmailAddress: true,
      address: {
        street: address?.street,
        city: address?.city,
        state: address?.state,
        postalCode: address?.postalCode,
        country: address?.country,
      },
    });

    await newUser.save();

    //Log that a user has been created
    userLogger.info("User created successfully", {
      userId: newUser.user_id,
      email: newUser.primaryEmailAddress,
    });

    return res.status(200).json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Error fetching user");
  }
};

// Get User by ID
const getUser = async (req: Request, res: Response) => {
  try {
    const user = await UsersModel.findOne({ user_id: req.params.id });

    if (!user) {
      userLogger.warn("The user was not found", { userId: req.params.id });
      return errorService.handleClientError(res, 400, "The user was not found");
    }

    return res.status(200).json(user);
  } catch (error) {
    errorService.handleServerError(res, error, "Error fetching user");
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  const { verificationToken } = req.body;

  try {
    //Find the user with the user with the verification token
    const user = await userService.findUserByVerificationToken(
      verificationToken
    );

    //Verification does not exist
    if (!user) {
      userLogger.warn("Verification code is invalid.");
      return errorService.handleClientError(
        res,
        400,
        "Verification code is invalid."
      );
    }

    const currentDate = new Date();

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < currentDate
    ) {
      // Verification code has expired
      return errorService.handleClientError(
        res,
        400,
        "Verification code expired, please request a new one."
      );
    }

    // Email is verified
    const updatedUser = await userService.updateUserVerificationStatus(
      user.user_id
    );

    // Create a new refreshToken
    const refreshToken = tokenService.createRefreshToken(updatedUser);

    // Create an accessToken
    const accessToken = tokenService.createAccessToken(
      updatedUser.primaryEmailAddress
    );

    // Create a new session with the new token
    const session = await sessionService.createSession(
      updatedUser.user_id,
      refreshToken
    );

    // Generate magic link
    const magicToken = jwt.sign(
      { token: verificationToken },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );
    const magicLink =
      process.env.CLIENT_BASE_URL + "/verification?token=" + magicToken;

    const sendEmail = await emailService.sendEmail(
      "Folkekraft AS <noreply@folkekraft.no>",
      [user.primaryEmailAddress],
      "Verify your email | Folkekraft",
      `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html dir="ltr" lang="en">
          <head>
            <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
            <meta name="x-apple-disable-message-reformatting" />
            <!--$-->
          </head>
          <div
            style="
              display: none;
              overflow: hidden;
              line-height: 1px;
              opacity: 0;
              max-height: 0;
              max-width: 0;
            "
          >
            Log in with this magic link
          </div>
  
          <body style="background-color: #ffffff">
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="
                max-width: 37.5em;
                padding-left: 12px;
                padding-right: 12px;
                margin: 0 auto;
              "
            >
              <tbody>
                <tr style="width: 100%">
                  <td>
                    <h1
                      style="color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:24px;font-weight:bold;margin:40px 0;padding:0"
                    >
                      Login
                    </h1>
                    <a
                      href="${magicLink}"
                      style="color:#2754C5;text-decoration:underline;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:14px;display:block;margin-bottom:16px"
                      target="_blank"
                      >Click here to log in with this magic link</a
                    >
                    <p
                      style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
                    >
                      Or, copy and paste this temporary login code:
                    </p>
                    <code
                      style="
                        display: inline-block;
                        padding: 16px 4.5%;
                        width: 90.5%;
                        background-color: #f4f4f4;
                        border-radius: 5px;
                        border: 1px solid #eee;
                        color: #333;
                      "
                      >${verificationToken}</code
                    >
                  </td>
                </tr>
              </tbody>
            </table>
            <!--/$-->
          </body>
        </html>`
    );

    return res.status(200).json({
      success: true,
      message: "Congratulations! Your email has been successfully verified.",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error verifying email");
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const doesEmailExist = await userService.emailExists(email);

    if (!doesEmailExist) {
      return errorService.handleClientError(
        res,
        400,
        "Invalid email or password."
      );
    }

    //If email exists, retrieve the user
    const user = await userService.getUserByEmail(email);

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await userService.validatePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return errorService.handleClientError(
        res,
        400,
        "The password you entered is incorrect. Please try again."
      );
    }

    //Find session, if it exists
    var refreshToken = await sessionService.findSession(user.user_id);

    if (refreshToken) {
      // Check if the refresh token is expired
      if (refreshToken.expiresAt < new Date()) {
        // Session expired, delete it
        await SessionModel.deleteOne({ _id: refreshToken._id });

        // Generate a new refresh token
        const newRefreshToken = tokenService.createRefreshToken(user);

        // Create a new session
        const session = await sessionService.createSession(
          user.user_id,
          newRefreshToken
        );

        //Create an accessToken
        const accessToken = tokenService.createAccessToken(
          user.primaryEmailAddress
        );

        // Send the new token
        return res.status(200).json({
          success: true,
          message: "Success",
          accessToken: accessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.user_id,
            email: user.primaryEmailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        });
      } else {
        // Refresh token is still valid, return it

        //Create an accessToken
        const accessToken = tokenService.createAccessToken(
          user.primaryEmailAddress
        );

        return res.status(200).json({
          success: true,
          message: "Success",
          accessToken: accessToken,
          refreshToken: refreshToken.token,
          user: {
            id: user.user_id,
            email: user.primaryEmailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        });
      }
    } else {
      // No existing session, create a new session
      const newRefreshToken = tokenService.createRefreshToken(user);

      //New session
      const session = await sessionService.createSession(
        user.user_id,
        newRefreshToken
      );

      //Create an accessToken
      const accessToken = tokenService.createAccessToken(
        user.primaryEmailAddress
      );

      // Send the new token
      return res.status(200).json({
        success: true,
        message: "Success",
        accessToken: accessToken,
        refreshToken: session.token,
        user: {
          id: user.user_id,
          email: user.primaryEmailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    }
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    //check if email exists
    const isEmailTaken = await userService.emailExists(email);

    if (isEmailTaken) {
      return errorService.handleClientError(
        res,
        400,
        "Email already exists try to login into it."
      );
    }

    //Hash the password before saving
    const hashedPassword = await userService.hashPassword(password);

    //Verifiy email token
    const verificationToken = tokenService.verificationToken();

    //Magic linke
    const magicToken = jwt.sign(
      { token: verificationToken },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );
    const magicLink =
      process.env.CLIENT_BASE_URL + "/verification?token=" + magicToken;

    //Create the new User
    var newUser = new UsersModel({
      firstName: firstName || null,
      lastName: lastName || null,
      username: null,
      password: hashedPassword,
      primaryEmailAddress: email,
      emailAddresses: [email],
      passwordEnabled: true,
      verificationToken: verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, //24 hours
    });

    newUser = await newUser.save();

    //Send a welcome email

    const templatePath = path.join();

    const sendEmail = await emailService.sendEmail(
      "Folkekraft AS <noreply@folkekraft.no",
      [newUser.primaryEmailAddress],
      "Verify your email | Folkekraft",
      `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" lang="en">
        <head>
          <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
          <meta name="x-apple-disable-message-reformatting" />
          <!--$-->
        </head>
        <div
          style="
            display: none;
            overflow: hidden;
            line-height: 1px;
            opacity: 0;
            max-height: 0;
            max-width: 0;
          "
        >
          Log in with this magic link
        </div>

        <body style="background-color: #ffffff">
          <table
            align="center"
            width="100%"
            border="0"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              max-width: 37.5em;
              padding-left: 12px;
              padding-right: 12px;
              margin: 0 auto;
            "
          >
            <tbody>
              <tr style="width: 100%">
                <td>
                  <h1
                    style="color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:24px;font-weight:bold;margin:40px 0;padding:0"
                  >
                    Login
                  </h1>
                  <a
                    href="${magicLink}"
                    style="color:#2754C5;text-decoration:underline;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:14px;display:block;margin-bottom:16px"
                    target="_blank"
                    >Click here to log in with this magic link</a
                  >
                  <p
                    style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
                  >
                    Or, copy and paste this temporary login code:
                  </p>
                  <code
                    style="
                      display: inline-block;
                      padding: 16px 4.5%;
                      width: 90.5%;
                      background-color: #f4f4f4;
                      border-radius: 5px;
                      border: 1px solid #eee;
                      color: #333;
                    "
                    >${verificationToken}</code
                  >
                </td>
              </tr>
            </tbody>
          </table>
          <!--/$-->
        </body>
      </html>`
    );

    return res.status(200).json({
      success: true,
      message: "Success",
      user: {
        id: newUser.user_id,
        email: newUser.primaryEmailAddress,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const resendVerificationEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const isEmailTaken = await userService.emailExists(email);

    if (!isEmailTaken) {
      userLogger.warn("User not found for email verification resend", {
        email,
      });
      return errorService.handleClientError(res, 404, "User not found");
    }

    const user = await userService.getUserByEmail(email);

    if (user.hasVerifiedPrimaryEmailAddress) {
      userLogger.info("User already verified", { userId: user.user_id, email });
      return errorService.handleClientError(res, 400, "Email already verified");
    }

    // Generate a new verification token
    const verificationToken = tokenService.verificationToken();

    // Update user with new verification token and expiration
    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ); // 24 hours from now
    await user.save();

    // Generate magic link
    const magicToken = jwt.sign(
      { token: verificationToken },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );
    const magicLink =
      process.env.CLIENT_BASE_URL + "/verification?token=" + magicToken;

    const sendEmail = await emailService.sendEmail(
      "Folkekraft AS <noreply@folkekraft.no>",
      [user.primaryEmailAddress],
      "Verify your email | Folkekraft",
      `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html dir="ltr" lang="en">
          <head>
            <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
            <meta name="x-apple-disable-message-reformatting" />
            <!--$-->
          </head>
          <div
            style="
              display: none;
              overflow: hidden;
              line-height: 1px;
              opacity: 0;
              max-height: 0;
              max-width: 0;
            "
          >
            Log in with this magic link
          </div>
  
          <body style="background-color: #ffffff">
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="
                max-width: 37.5em;
                padding-left: 12px;
                padding-right: 12px;
                margin: 0 auto;
              "
            >
              <tbody>
                <tr style="width: 100%">
                  <td>
                    <h1
                      style="color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:24px;font-weight:bold;margin:40px 0;padding:0"
                    >
                      Login
                    </h1>
                    <a
                      href="${magicLink}"
                      style="color:#2754C5;text-decoration:underline;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:14px;display:block;margin-bottom:16px"
                      target="_blank"
                      >Click here to log in with this magic link</a
                    >
                    <p
                      style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
                    >
                      Or, copy and paste this temporary login code:
                    </p>
                    <code
                      style="
                        display: inline-block;
                        padding: 16px 4.5%;
                        width: 90.5%;
                        background-color: #f4f4f4;
                        border-radius: 5px;
                        border: 1px solid #eee;
                        color: #333;
                      "
                      >${verificationToken}</code
                    >
                  </td>
                </tr>
              </tbody>
            </table>
            <!--/$-->
          </body>
        </html>`
    );

    userLogger.info("Verification email resent", {
      userId: user.user_id,
      email,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email has been resent.",
    });
  } catch (error) {
    userLogger.error("Error resending verification email", { error });
    return errorService.handleServerError(
      res,
      error,
      "Error resending verification email"
    );
  }
};

const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken || req.cookies["session"];
  console.log(refreshToken);

  if (!refreshToken) {
    return errorService.handleClientError(res, 400, "No session was found.");
  }

  try {
    const session = await sessionService.findSessionByToken(refreshToken);

    if (!session) {
      return errorService.handleClientError(
        res,
        400,
        "Invalid session or token."
      );
    }

    // Check if the session is expired
    const currentTime = Date.now();
    if (session.expiresAt && currentTime > session.expiresAt.getTime()) {
      return res.status(200).json({
        success: false,
        message: "Session has expired.",
      });
    }

    const user = await userService.getUserByUserId(session.userId);

    if (!user) {
      return errorService.handleClientError(
        res,
        400,
        "User was not found.",
        `UserId is ${session.userId}`
      );
    }

    // Generate new access and refresh tokens
    const newAccessToken = jwt.sign(
      { sub: user.user_id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      message: "Success",
      accessToken: newAccessToken,
      user: {
        id: user.user_id,
        email: user.primaryEmailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const bulkCreateUsers = async (req: Request, res: Response) => {
  try {
    const usersData = req.body.users;
    const createdUsers = [];

    for (var userData of usersData) {
      const password = userService.generateRandomToken();
      const hasedPassword = await bcrypt.hash(password, 10);

      const newUser = new UsersModel({
        firstName: userData.firstName,
        lastName: userData.lastName,
        primaryEmailAddress: userData.email,
        primaryPhoneNumber: userData.phone,
        address: {
          postalCode: userData.postalCode,
          street: userData.street,
          city: userData.city,
          country: "Norge",
        },
      });

      await newUser.save();

      //Send Email

      createdUsers.push(newUser);
    }
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    //Find the user by email

    const user = await UsersModel.findOne({ primaryEmailAddress: email });
    if (!user) {
      return errorService.handleClientError(
        res,
        400,
        "Email is already in the use.",
        "The email address provided is already associated with another account."
      );
    }

    //Generate a reset token
    const token = userService.generateRandomToken();

    //Set reset token and expiration on the user object
    user.resetPasswordToken = token;
    user.resetPasswordExpiresAt = new Date(Date.now() + 3600000); //1 hour from now

    await user.save();

    //Send reset email
    const resetUrl = `http://${req.headers.host}/reset/${token}`;
    //email
    const sendEmail = await emailService.sendEmail(
      "Folkekraft AS <noreply@folkekraft.no>",
      [email],
      "Reset Password",
      `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" lang="en">
        <head>
          <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
          <meta name="x-apple-disable-message-reformatting" />
          <!--$-->
        </head>
        <div
          style="
            display: none;
            overflow: hidden;
            line-height: 1px;
            opacity: 0;
            max-height: 0;
            max-width: 0;
          "
        >
          Log in with this magic link
        </div>

        <body style="background-color: #ffffff">
          <table
            align="center"
            width="100%"
            border="0"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              max-width: 37.5em;
              padding-left: 12px;
              padding-right: 12px;
              margin: 0 auto;
            "
          >
            <tbody>
              <tr style="width: 100%">
                <td>
                  <h1
                    style="color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:24px;font-weight:bold;margin:40px 0;padding:0"
                  >
                    Reset Password
                  </h1>
                  <a
                    href="${resetUrl}"
                    style="color:#2754C5;text-decoration:underline;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:14px;display:block;margin-bottom:16px"
                    target="_blank"
                    >Click here to reset your password with this magic link</a
                  >
                </td>
              </tr>
            </tbody>
          </table>
          <!--/$-->
        </body>
      </html>`
    );

    return res
      .status(200)
      .json({ success: true, message: "Password reset email sent." });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    //Find user by reset token and check if token has expired
    const user = await UsersModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return errorService.handleClientError(
        res,
        400,
        "Password reset token is invalid or has expired."
      );
    }

    //Hash the new password
    const hasedPassword = await bcrypt.hash(password, 10);

    //Update the user's password
    user.password = hasedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    //email
    const sendEmail = await emailService.sendEmail(
      "Folkekraft AS <noreply@folkekraft.no>",
      [user.primaryEmailAddress],
      "Your password has been updated",
      `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" lang="en">
        <head>
          <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
          <meta name="x-apple-disable-message-reformatting" />
          <!--$-->
        </head>
        <div
          style="
            display: none;
            overflow: hidden;
            line-height: 1px;
            opacity: 0;
            max-height: 0;
            max-width: 0;
          "
        >
          Log in with this magic link
        </div>

        <body style="background-color: #ffffff">
          <table
            align="center"
            width="100%"
            border="0"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              max-width: 37.5em;
              padding-left: 12px;
              padding-right: 12px;
              margin: 0 auto;
            "
          >
            <tbody>
              <tr style="width: 100%">
                <td>
                  <h1
                    style="color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:24px;font-weight:bold;margin:40px 0;padding:0"
                  >
                    Your password has been updated.
                  </h1>
                </td>
              </tr>
            </tbody>
          </table>
          <!--/$-->
        </body>
      </html>`
    );

    return res
      .status(200)
      .json({ success: true, message: "Password has been reset." });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

//Notifications
const getNotifications = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const user = await userService.userExists(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    const notifications = await notificationService.getNotificationsByUserId(
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: {
        notifications: notifications,
      },
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

const createUserWithSharesAndTransaction = async (
  req: Request,
  res: Response
) => {
  const {
    firstName,
    lastName,
    primaryEmailAddress,
    primaryPhoneNumber,
    password,
    ssn,
    role,
    earlyInvestmentShares,
    transactionDate,
    recommendedPurchase,
    purchaseRight,
  } = req.body;

  try {
    //Create a user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UsersModel({
      firstName,
      lastName,
      primaryEmailAddress,
      primaryPhoneNumber,
      password: hashedPassword,
      ssn,
      role,
      roles: [{ name: role, permissions: [] }], // Assuming 'role' maps to the role name
      recommendedShares: recommendedPurchase,
      purchaseRight,
    });

    const savedUser = await newUser.save();

    // Create Transaction
    const transactionData: ITransaction = {
      userId: savedUser.user_id,
      stripePaymentId: `Folkeinvest_${ssn.slice(-5)}`,
      paymentMethod: "bank_transfer",
      transactionType: "shares",
      amount: earlyInvestmentShares * 12,
      currency: "NOK",
      status: "paid", // Assuming early investment is already completed
      taxAmount: 0,
      taxRate: 0,
      discount: 0,
      metadata: new Map([
        ["sharesPurchased", earlyInvestmentShares.toString()],
      ]),
      transactionDate: new Date(transactionDate),
    };

    const newTransaction = await transactionService.createTransaction(
      transactionData
    );

    // Create Shares
    const newShares = new SharesModel({
      userId: savedUser.user_id,
      transactionId: newTransaction._id,
      numberOfShares: earlyInvestmentShares,
      purchasePrice: 8, // Assuming 8 kr per share
      purchaseDate: new Date(transactionDate),
      ssn,
    });

    const savedShares = await newShares.save();

    await emailService.sendEmail(
      "Folkekraft AS <noreply@folkekraft.no>",
      [primaryEmailAddress],
      "Innlogging til Folkekraft AS Kampanje",
      `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <!--$-->
  </head>
  <div
    style="
      display: none;
      overflow: hidden;
      line-height: 1px;
      opacity: 0;
      max-height: 0;
      max-width: 0;
    "
  >
    Log in with this magic link
  </div>

  <body style="background-color: #ffffff">
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        max-width: 37.5em;
        padding-left: 12px;
        padding-right: 12px;
        margin: 0 auto;
      "
    >
      <tbody>
        <tr style="width: 100%">
          <td>
            <h1
              style="color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:24px;font-weight:bold;margin:40px 0;padding:0"
            >
              Velkommen til Folkekraft sin emisjon!
            </h1>

            <p
              style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
            >
              Her er din innloggingsinformasjon:
            </p>
            <br />
            <p
              style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
            >
              <strong>Brukernavn:</strong><br />${primaryEmailAddress}
            </p>
            <p
              style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
            >
              <strong>Passord:</strong><br />${password}
            </p>
            <p
              style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
            >
              <strong>Lenke for innlogging:</strong><br />
            </p>

            <code
              style="
                display: inline-block;
                padding: 16px 4.5%;
                width: 90.5%;
                background-color: #f4f4f4;
                border-radius: 5px;
                border: 1px solid #eee;
                color: #333;
              "
              ><a href="https://invest.folkekraft.no/sign-in"
                >https://invest.folkekraft.no/sign-in</a
              ></code
            >
            <p
              style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
            >
              For best mulig opplevelse anbefaler vi at du logger inn via en PC,
              ikke mobil.
            </p>
            <p
              style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
            >
              Hvis du har spørsmål eller trenger hjelp med innloggingen, er du
              velkommen til å kontakte investorkontakt, Lasse Gjellestad, på
              <a href="mailto:lg@folkekraft.no">lg@folkekraft.no</a> eller 907
              09 413.
            </p>
            <p
              style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px"
            >
              Vennlig hilsen,<br />
              Folkekraft Teamet
            </p>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
`
    );

    return res.status(200).json({
      success: true,
      message: "User, shares, and transaction created successfully",
      user: savedUser,
      transaction: newTransaction,
      shares: savedShares,
    });
  } catch (error) {
    errorService.handleServerError(
      res,
      error,
      "Error creating user, shares, and transaction"
    );
  }
};

const vippsLogin = async (req: Request, res: Response) => {
  const state = Math.random().toString(36).substring(7); // Generate random state
  const scopes = ["openid", "address", "email", "phoneNumber"];

  const baseURL =
    process.env.NODE_ENV === "production"
      ? "https://api.vipps.no/access-management-1.0/access/oauth2/auth"
      : "https://apitest.vipps.no/access-management-1.0/access/oauth2/auth";

  const redirectURL =
    `https://api.vipps.no/access-management-1.0/access/oauth2/auth?client_id=${encodeURIComponent(
      process.env.CLIENT_ID!
    )}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(" "))}` +
    `&state=${state}` +
    `&redirect_uri=${process.env.REDIRECT_URI!}`;

  console.log(redirectURL);

  res.redirect(redirectURL);
};

const vippsCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  const auth = Buffer.from(
    `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
  ).toString("base64");

  const baseURL =
    process.env.NODE_ENV === "production"
      ? "https://api.vipps.no/access-management-1.0/access/oauth2/token"
      : "https://apitest.vipps.no/access-management-1.0/access/oauth2/token";

  // Log environment variables for debugging
  console.log("Authorization code:", code);
  console.log("Subscription Key:", process.env.SUBSCRIPTION_KEY);
  console.log("Client ID:", process.env.CLIENT_ID);
  console.log("Merchant Serial Number:", process.env.MSN);
  console.log("Redirect URI:", process.env.REDIRECT_URI);
  console.log("Basic Buffer:", auth);

  try {
    const response = await axios.post(
      "https://api.vipps.no/access-management-1.0/access/oauth2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Merchant-Serial-Number": process.env.MSN,
          "Vipps-System-Name": "acme",
          "Vipps-System-Version": "3.1.2",
          "Vipps-System-Plugin-Name": "acme-webshop",
          "Vipps-System-Plugin-Version": "4.5.6",
        },
        auth: {
          username: process.env.CLIENT_ID,
          password: process.env.CLIENT_SECRET,
        },
      }
    );
    // Handle the response accordingly

    if (response.data.access_token) {
      const { access_token } = response.data;

      const userInfoResponse = await axios.get(
        "https://api.vipps.no/vipps-userinfo-api/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`, // Use Bearer instead of Basic
            "Ocp-Apim-Subscription-Key": process.env.SUBSCRIPTION_KEY!,
            "Merchant-Serial-Number": process.env.MSN!,
            "Vipps-System-Name": "acme",
            "Vipps-System-Version": "3.1.2",
            "Vipps-System-Plugin-Name": "acme-webshop",
            "Vipps-System-Plugin-Version": "4.5.6",
          },
        }
      );

      res.json(userInfoResponse.data);
    } else {
      console.error("Access token not found in response");
      return res
        .status(500)
        .json({ success: false, message: "Error exchanging code for token" });
    }
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error exchanging code for token" });
  }
};

const vippsUserInfo = async (req: Request, res: Response) => {
  const { access_token } = req.body;

  const baseURL =
    process.env.NODE_ENV === "production"
      ? "https://api.vipps.no/vipps-userinfo-api/userinfo"
      : "https://apitest.vipps.no/vipps-userinfo-api/userinfo";

  const response = await axios.get(baseURL, {
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": process.env.SUBSCRIPTION_KEY,
      "Merchant-Serial-Number": process.env.MSN,
      "Vipps-System-Name": "acme",
      "Vipps-System-Version": "3.1.2",
      "Vipps-System-Plugin-Name": "acme-webshop",
      "Vipps-System-Plugin-Version": "4.5.6",
    },
    auth: {
      username: process.env.CLIENT_ID,
      password: process.env.CLIENT_SECRET,
    },
  });

  res.status(200).json({
    success: true,
    message: "User info retrieved",
    data: response.data,
  });
};

const getPortfolio = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  console.log("This is the userId", userId);

  try {
    const user = await userService.userExists(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    //Check if user has an affiliate

    //if not create one

    let affiliate = await affiliateService.getAffiliateByUserId(userId);
    if (!affiliate) {
      affiliate = await affiliateService.createAffiliate(userId);
    }

    const referralLink = `${process.env.CLIENT_BASE_URL}/bestill?ref=${affiliate.affiliateCode}`;

    //count the share that are locked
    const lockedShares = await sharesService.sumLockedSharesByUserId(userId);

    //count the shares that are referral bonus
    const referralBonusShares =
      await sharesService.sumReferralBonusSharesByUserId(userId);

    //count the shares that are not referral bonus and not locked
    const activeNonReferralShares =
      await sharesService.sumActiveNonReferralSharesByUserId(userId);

    const transactions = await transactionService.getTransactionsByUserId(
      userId
    );

    return res.status(200).json({
      success: true,
      data: {
        totalInvested: activeNonReferralShares * 8, // Total amount invested by the user
        totalShares: activeNonReferralShares, // Total number of shares owned by the user
        currentValue: {
          totalAmount:
            activeNonReferralShares * 8 +
            referralBonusShares * 12 +
            lockedShares * 12, // Total current value of all shares
          percentageChange: 0, // Percentage change in value from initial investment
        },
        investments: {
          totalShares: activeNonReferralShares, // Total number of shares acquired from investments
          totalValue: activeNonReferralShares * 8, // Total current value of those shares
          customerShares: {
            total: lockedShares / 84, // Total number of shares owned directly by the customer
            shares: lockedShares,
            value: lockedShares * 12, // Current value of the customer shares
          },
          referralShares: {
            total: referralBonusShares / 25, // Total shares acquired from referrals
            shares: referralBonusShares,
            value: referralBonusShares * 12, // Current value of referral-acquired shares
          },
        },
        portfolioSummary: {
          investorSharesValue: activeNonReferralShares * 8, // Total value of investor-acquired shares
          customerSharesValue: lockedShares * 12, // Total value of customer-owned shares
          referralSharesValue: referralBonusShares * 12, // Total value of shares acquired from referrals
          accountDetails: [], // Array of account data for further details
        },
        referralLink: referralLink,
        transactions: transactions, // Array to hold user transaction details
      },
    });
  } catch (error) {
    errorService.handleServerError(res, error, "Server error");
  }
};

export default {
  createUser,
  getUser,
  verifyEmail,
  login,
  register,
  resendVerificationEmail,
  refreshToken,
  forgotPassword,
  resetPassword,
  getNotifications,
  createUserWithSharesAndTransaction,
  vippsLogin,
  vippsCallback,
  vippsUserInfo,
  getPortfolio,
};
