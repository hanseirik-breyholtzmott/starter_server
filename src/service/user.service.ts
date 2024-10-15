import bcrypt from "bcrypt";

//Models
import UsersModel, { IUser, IUserModel } from "../models/users.model";

//Logger
import { userLogger } from "../logger";

const isEmailTaken = async (email: string): Promise<boolean> => {
  try {
    const user = await UsersModel.findOne({ primaryEmailAddress: email });
    return !!user;
  } catch (error) {
    userLogger.error("Error checking if email is taken:", { error });
    throw new Error("Error checking if email is taken.");
  }
};

const isSsnTaken = async (ssn: string): Promise<boolean> => {
  if (ssn === null || ssn === "") {
    return true;
  }
  try {
    const user = await UsersModel.findOne({ ssn: ssn });
    return !!user;
  } catch (error) {
    userLogger.error("Error checking if ssn is taken:", { error });
    throw new Error("Error checking if ssn is taken.");
  }
};

const getUserByEmail = async (email: string): Promise<IUserModel | null> => {
  try {
    const user = await UsersModel.findOne({ primaryEmailAddress: email });
    return user;
  } catch (error) {
    userLogger.error("Error getting user by email:", { error });
    throw new Error("Error getting user by email.");
  }
};

const getUserById = async (userId: string): Promise<IUserModel | null> => {
  try {
    const user = await UsersModel.findById(userId);
    return user;
  } catch (error) {
    userLogger.error("Error trying to retrieve user by userId:", { error });
    throw new Error("Error trying to retrieve user by userId.");
  }
};

const getUserByUserId = async (userId: string): Promise<IUserModel | null> => {
  try {
    const user = await UsersModel.findOne({ user_id: userId });
    return user;
  } catch (error) {
    userLogger.error("Error trying to retrieve user by userId:", { error });
    throw new Error("Error trying to retrieve user by userId.");
  }
};

const getUsersWithScope = async (
  fieldsToSelect: string | string[]
): Promise<IUserModel[] | null> => {
  try {
    const fields = Array.isArray(fieldsToSelect)
      ? fieldsToSelect.join(" ")
      : fieldsToSelect;

    const users = await UsersModel.find({}, fields).exec();

    if (!users || users.length === 0) {
      userLogger.warn("No users found");
      return null;
    }

    userLogger.info(`Retrieved ${users.length} users with fields: ${fields}`);

    return users;
  } catch (error) {
    userLogger.error("Error trying to retrieve users with scope:", { error });
    return null;
  }
};
/*
const createUser = async (user: IUser): Promise<IUserModel | null> => {
  try {

    const isEmailTaken = await isEmailTaken(user.primaryEmailAddress);
    if (isEmailTaken) {
      return null;
    }

    const isSsnTaken = await isSsnTaken(user.ssn);
    if (isSsnTaken) {
      return null;
    }

    const newUser = await UsersModel.create(user);

    //Logging
    userLogger.info("User created:", { newUser });
    return newUser;
  } catch (error) {
    userLogger.error("Error creating user:", { error });
    return null;
  }
};

*/
export default {
  isEmailTaken,
  isSsnTaken,
  getUserByEmail,
  getUserById,
  getUserByUserId,
  getUsersWithScope,
  //createUser,
};
