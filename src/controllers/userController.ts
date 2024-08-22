import { Request, Response, NextFunction, response } from "express";
import UsersModel, { IUser } from "../models/users.model";
import SessionModel from "../models/session.model";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { Resend } from "resend";

import bcrypt from "bcrypt";
import usersModel from "../models/users.model";

//Types
import { JwtPayload } from "../types/authTypes";

//Services
import userService from "../service/userService";
import tokenService from "../service/tokenService";
import sessionService from "../service/sessionService";
import notificationService from "../service/notificationService";

/*
 *
 * Informatiional responses (100 - 199)
 *    - 100 Continue:                               The server has received the initial part of request, and the client should continue with rest of the request.
 *    - 101 Switching Protocols:                    The server understands the request to switch protocols and is willing to comply
 *    - 102 Processing (WebDAV):                    The server is processiong the request but hasn't completed it yet.
 * Successful responses     (200 - 299)
 *    - 200 OK:                                     The request has succeeded. The meaning of the success depends on the HTTP method (GET, POST, etc)
 *    - 201 Created:                                The requested has been fulfilled, leading to the creation of a new resource.
 *    - 202 Accepted:                               The request has been accepted for processing, but the processing is not yet complete.
 *    - 204 No Content:                             The server successfully processed the request, but there's no content to return.
 * Redirection messages     (300 - 399)
 *    - 301 Moved Premanently:                      The requested resource has been permanently moved to a new URL.
 *    - 302 Found (Previously "Moved Temporarily"): The requested resource resides temporarily under a different URL.
 *    - 304 Not Modified:                           The resource has not been modified since the last request, so the client can use the cached version.
 *    - 307 Temporary Redirect:                     The request should be repeated with another URL, but future requests should still use the orginial URL.
 * Client error responses   (400 - 499)
 *    - 400 Bad Request:                            The server cannot process the request due to a client error (e.g. malformed request syntax).
 *    - 401 Unautherized:                           Authentication is required, and the client must authenticate itself to get the requested response.
 *    - 403 Forbidden:                              The server understands teh request but refuses to authorize it.
 *    - 404 Not Found:                              The requested resource could not be found on the server.
 *    - 405 Method Not Allowed:                     The method specified in the request is not allowed for the resource identified by the URL.
 * Server error responses   (500 - 599)
 *    - 500 Internal Server Error:                  The server encounted an unexpected condition that prevented it from fulfilling the request.
 *    - 501 Not Implemented:                        The server does not support the functionality required to fulfill the request.
 *    - 502 Bad Gateway:                            The server, while acting as a gateway or proxy, receicved an invaldi response form an upstream server.
 *    - 503 Service Unavailable:                    The server is not ready to handle the request, usually due to being overloaded or down for maintenance.
 *    - 504 Gateway Timeout:                        The server, acting as a gateway or proxy, did not receive a timely response form the upstream server.
 *
 */

const resend = new Resend(process.env.RESEND_API_KEY);

// Create User
const createUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, ssn, address } = req.body;

  try {
    //check if email is already taken
    const isEmailTaken = await userService.emailExists(email);

    if (isEmailTaken) {
      return res.status(400).json({
        success: false,
        message: "Email is already in the use.",
        error: {
          code: 400,
          details:
            "The email address provided is already associated with another account.",
        },
      });
    }

    //check if the SSN is already taken
    const isSsnTaken = await userService.ssnExists(ssn);

    if (isSsnTaken) {
      return res.status(400).json({
        success: false,
        message: "There is an account already with your SSN.",
        error: {
          code: 400,
          details:
            "The ssn provided is already associated with another account.",
        },
      });
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

    return res.status(200).json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(400).json({ message: "Error creating user", error });
  }
};

// Get User by ID
const getUser = async (req: Request, res: Response) => {
  try {
    const user = await UsersModel.findOne({ user_id: req.params.id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: "Error fetching user", error });
  }
};

const sendMagicLink = async (req: Request, res: Response) => {
  console.log(req.body);
  const { primaryEmailAddress } = req.body;

  try {
    // Check if the user already exists
    let user = await UsersModel.findOne({
      primaryEmailAddress: primaryEmailAddress,
    });

    if (user) {
      return res
        .status(200)
        .json({ exists: true, message: "Email already in use." });
    }

    // Create a new User
    const newUser = new UsersModel({
      primaryEmailAddress: primaryEmailAddress,
      emailAddresses: [{ primaryEmailAddress }], // Correctly use an array for emailAddresses
    });
    await newUser.save();

    // Generate a session token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Store session token in the database
    await SessionModel.create({
      userId: newUser.user_id,
      token: token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Set token expiration time
    });

    // Create magic link
    const magicLink = `http://localhost:5000/onboarding?token=${token}`;

    // Send email with magic link
    const { data, error } = await resend.emails.send({
      from: "Acme <lasseisgay@resend.dev>",
      to: [primaryEmailAddress],
      subject: "Your Magic Link",
      html: `<strong>Click the following link to complete your registration: <a href="${magicLink}">${magicLink}</a></strong>`,
    });

    if (error) {
      await UsersModel.findOneAndDelete({
        primaryEmailAddress: primaryEmailAddress,
      });
      await SessionModel.findOneAndDelete({ token: token });

      return res
        .status(200)
        .json({
          exists: true,
          message: "That email doesnt exist.",
          error: error.message,
        });
    }

    console.log({ data });

    return res
      .status(200)
      .json({
        exists: false,
        message: "Magic link sent. Please check your email.",
      });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
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
      return res.status(400).json({
        success: false,
        message: "Verification code is invalid.",
      });
    }

    const currentDate = new Date();

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < currentDate
    ) {
      // Verification code has expired
      return res.status(400).json({
        success: false,
        message: "Verification code expired, please request a new one.",
      });
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
    console.error("Error verifying token:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const doesEmailExist = await userService.emailExists(email);

    if (!doesEmailExist) {
      return res.status(400).json({
        emailTaken: false,
        message: "Invalid email or password.",
        user: null,
        token: null,
        error: true,
      });
    }

    //If email exists, retrieve the user
    const user = await userService.getUserByEmail(email);

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await userService.validatePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "The password you entered is incorrect. Please try again.",
        user: null,
        token: null,
        error: true,
      });
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
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    //check if email exists
    const isEmailTaken = await userService.emailExists(email);

    if (isEmailTaken) {
      return res.status(400).json({
        success: false,
        message: "Email already exists try to login into it.",
        emailTaken: true,
        user: null,
        token: null,
      });
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
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: [newUser.primaryEmailAddress],
      subject: "Welcome",
      html: `<strong>
      ${magicLink}
      <br />
      ${verificationToken}</strong>`,
    });

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
    console.log(error);
  }
};

const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(200).json({
      message: "No session",
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_KEY
    ) as JwtPayload;
    const user = await UsersModel.findOne({ user_id: decoded.id });

    if (!user) {
      return res.status(200).json({
        message: "No user",
        accessToken: null,
        refreshToken: null,
        user: null,
      });
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
  } catch (err) {
    res.sendStatus(403);
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
    console.log(error);
  }
};

const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    //Find the user by email

    const user = await UsersModel.findOne({ primaryEmailAddress: email });
    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: "No user found with that email address.",
        });
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
    const { data, error } = await resend.emails.send({
      from: "Acme <lasseisgay@resend.dev>",
      to: [email],
      subject: "Your Magic Link",
      html: `<strong>${resetUrl}<a href="#">test</a></strong>`,
    });
    if (error) {
      return res.status(400).json(error);
    }

    return res
      .status(200)
      .json({ success: true, message: "Password reset email sent." });
  } catch (error) {
    console.log("Error in forgotPassword:", error);
    return res
      .status(500)
      .json({ sucess: false, message: "Error processing request" });
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
      return res
        .status(400)
        .json({
          success: false,
          message: "Password reset token is invalid or has expired.",
        });
    }

    //Hash the new password
    const hasedPassword = await bcrypt.hash(password, 10);

    //Update the user's password
    user.password = hasedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    //email
    const { data, error } = await resend.emails.send({
      from: "Acme <lasseisgay@resend.dev>",
      to: [user.primaryEmailAddress],
      subject: "Your Magic Link",
      html: `<strong>Your password has been updated</strong>`,
    });
    if (error) {
      return res.status(400).json(error);
    }

    return res
      .status(200)
      .json({ success: true, message: "Password has been reset." });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ message: "Error" });
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
    console.error("Error retrieving notificationas by user id:", error);
    throw new Error("Failed retrieving notifications by user id.");
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
