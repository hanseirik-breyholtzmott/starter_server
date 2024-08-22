import bcrypt from "bcrypt";

//Models
import UsersModel, { IUser, IUserModel } from "../models/users.model";

const createUser = async (user: IUser): Promise<IUserModel | boolean> => {
  //Validate user info using joi

  //check if email exists
  const isEmailTaken = await emailExists(user.primaryEmailAddress);

  if (isEmailTaken) {
    return false;
  }

  //check if ssn exists

  //if user has a password then hashpassword, if password not included in the the user object then use password generator to create a password.

  try {
    var newUser = new UsersModel(user);

    await newUser.save();

    return newUser;
  } catch (error) {
    console.error("Error trying to create a user:", error);
    throw new Error("Failed to create a user.");
  }
};

const getUserById = async (id: string) => {
  try {
    const user = await UsersModel.findById(id);
    return user;
  } catch (error) {
    console.error("Error trying to retrieve user by id:", error);
    throw new Error("Error trying to retrieve user by id.");
  }
};

const getUserByUserId = async (userId: string): Promise<IUserModel | null> => {
  try {
    const user = await UsersModel.findOne({ user_id: userId });
    return user;
  } catch (error) {
    console.error("Error trying to retrieve user by userid:", error);
    throw new Error("Error trying to retrieve user by userid.");
  }
};

const getUserByEmail = async (email: string): Promise<IUserModel | null> => {
  try {
    return await UsersModel.findOne({ primaryEmailAddress: email });
  } catch (error) {
    console.error("Error trying to retrieve user by email:", error);
    throw new Error("Error trying to retrieve user by email.");
  }
};

const emailExists = async (email: string): Promise<boolean> => {
  try {
    const user = await UsersModel.findOne({ primaryEmailAddress: email });
    return !!user; //Return true if a user is found, otherwise false
  } catch (error) {
    console.error("Error checking if email exists:", error);
    throw new Error("Error checking if email exists.");
  }
};

const userExists = async (userId: string): Promise<boolean> => {
  try {
    const user = await UsersModel.findOne({ user_id: userId });
    return !!user; //Returns true if a user is found, otherwise false
  } catch (error) {
    console.error("Error checking if user exists:", error);
    throw new Error("Error checking if user exists.");
  }
};

const ssnExists = async (ssn: string): Promise<boolean> => {
  try {
    const user = await UsersModel.findOne({ ssn: ssn });
    return !!user; //Return true if a user is fround, otherwise false
  } catch (error) {
    console.error("Error checking if ssn exists:", error);
    throw new Error("Error checking if ssn exists.");
  }
};

const updateUserById = async (id: string): Promise<IUserModel> => {
  try {
    const user = await UsersModel.findByIdAndUpdate(id);
    return user;
  } catch (error) {
    console.error("Error updating user by id:", error);
    throw new Error("Failed to update user based by id.");
  }
};

const updateUserByUserId = async (
  userId: string,
  updateData: object
): Promise<IUserModel | null> => {
  try {
    const user = await UsersModel.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error("Error updating user by userId:", error);
    throw new Error("Failed to update user based by userid");
  }
};

const deleteUserById = async (id: string) => {};

const deleteUserByUserId = async (userId: string) => {};

const validatePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    throw new Error("Error comparing passwords.");
  }
};

const hashPassword = async (password: string): Promise<string> => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Error hashing password.");
  }
};

const resetPassword = async (token: string, newPassword: string) => {};

const findUserByVerificationToken = async (
  verificationToken: string
): Promise<IUserModel | null> => {
  return UsersModel.findOne({ verificationToken });
};

const updateUserVerificationStatus = async (
  user_id: string
): Promise<IUserModel | null> => {
  return UsersModel.findOneAndUpdate(
    { user_id },
    {
      $set: {
        hasVerifiedPrimaryEmailAddress: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    },
    { new: true }
  );
};

const generateRandomPassword = (length: number = 8) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }

  return password;
};

const generateRandomToken = () => {
  /*
   *
   *   Math.random() generates a random number like 0.123456789
   *   .toString(36) converts it to something like "0.x8g9z5"
   *   .slice(-8) extracts the last 8 characters, which in this case might be "x8g9z5"
   *
   */
  return Math.random().toString(36).slice(-8);
};

export default {
  createUser,
  getUserById,
  getUserByUserId,
  getUserByEmail,
  emailExists,
  userExists,
  ssnExists,
  updateUserById,
  updateUserByUserId,
  deleteUserById,
  deleteUserByUserId,
  validatePassword,
  hashPassword,
  resetPassword,
  generateRandomPassword,
  generateRandomToken,
  findUserByVerificationToken,
  updateUserVerificationStatus,
};
