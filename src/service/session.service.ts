import { Types } from "mongoose";
//Models
import sessionModel, { ISessionModel } from "../models/session.model";

//Logger
import { sessionLogger } from "../logger";

//Utils
import { oneMonthFromNow } from "../utils/date";

const createSession = async (userId: string): Promise<ISessionModel> => {
  try {
    const session = new sessionModel({
      userId,
      expiresAt: oneMonthFromNow(),
    });

    await session.save();

    sessionLogger.info("Session created successfully", {
      userId,
      sessionId: session._id,
    });

    return session;
  } catch (error) {
    sessionLogger.error("Error creating session", {
      error,
      userId,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
};

const getSessionById = async (
  sessionId: string
): Promise<ISessionModel | null> => {
  try {
    const session = await sessionModel.findById(sessionId);
    return session;
  } catch (error) {
    sessionLogger.error("Error getting session by id", { sessionId, error });
    throw new Error("Error getting session by id.");
  }
};

const deleteSessionsByUserId = async (userId: string): Promise<void> => {
  try {
    await sessionModel.deleteMany({ userId: userId });
    sessionLogger.info("Sessions deleted", { userId: userId });
  } catch (error) {
    sessionLogger.error("Error deleting sessions by user id", {
      userId,
      error,
    });
    throw new Error("Error deleting sessions by user id.");
  }
};

const deleteSessionById = async (sessionId: string): Promise<void> => {
  try {
    await sessionModel.findByIdAndDelete(sessionId);
    sessionLogger.info("Session deleted", { sessionId: sessionId });
  } catch (error) {
    sessionLogger.error("Error deleting session by id", { sessionId, error });
    throw new Error("Error deleting session by id.");
  }
};

export default {
  createSession,
  getSessionById,
  deleteSessionsByUserId,
  deleteSessionById,
};
