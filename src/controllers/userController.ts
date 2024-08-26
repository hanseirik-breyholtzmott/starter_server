import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//Services
import userService from "../service/userService";
import tokenService from "../service/tokenService";
import sessionService from "../service/sessionService";
import notificationService from "../service/notificationService";
import emailService from "../service/emailService";
import errorService from "../service/errorService";

//Models
import UsersModel, { IUser } from "../models/users.model";
import SessionModel from "../models/session.model";

//Types
import { JwtPayload } from "../types/authTypes";

//Logger
import { userLogger } from "../logs";

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
      ssm: ssn,
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
    const sendEmail = await emailService.sendEmail(
      "Acme <onboarding@resend.dev>",
      [newUser.primaryEmailAddress],
      "Welcome",
      `<strong> ${magicLink} <br />${verificationToken}</strong>`
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

const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return errorService.handleClientError(res, 400, "No session was found.");
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_KEY
    ) as JwtPayload;

    const user = await UsersModel.findOne({ user_id: decoded.id });

    if (!user) {
      return errorService.handleClientError(res, 400, "User was not found.");
    }

    //Generate new tokens
    const newAccessToken = jwt.sign(
      { sub: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    const newRefreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "14d" }
    );

    //Save new refresh token in DB and remove the old one
    await SessionModel.findOneAndReplace(
      { token: refreshToken },
      { userId: user.user_id, token: newRefreshToken }
    );

    return res.status(200).json({
      message: "Success",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
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
      "Acme <lasseisgay@resend.dev>",
      [email],
      "Your Magic Link",
      `<strong>${resetUrl}<a href="#">test</a></strong>`
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
      "Acme <lasseisgay@resend.dev>",
      [user.primaryEmailAddress],
      "Your Magic Link",
      `<strong>Your password has been updated</strong>`
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

export default {
  createUser,
  getUser,
  verifyEmail,
  login,
  register,
  refreshToken,
  forgotPassword,
  resetPassword,
  getNotifications,
};
