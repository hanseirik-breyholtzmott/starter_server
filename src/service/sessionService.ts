import sessionModel, { ISessionModel } from "../models/session.model";

const createSession = async (
  userId: string,
  refreshToken: string
): Promise<ISessionModel> => {
  try {
    const session = await sessionModel.create({
      userId: userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
    });
    return session;
  } catch (error) {
    console.error("Error creating a session:", error);
    throw new Error("Error creating session.");
  }
};

const findSession = async (
  userId: string,
  token?: string
): Promise<ISessionModel | null> => {
  try {
    const query: { userId: string; token?: string } = { userId };
    if (token) {
      query.token = token;
    }

    const session = await sessionModel.findOne(query);
    return session;
  } catch (error) {
    console.error("Error finding session:", error);
    throw new Error("Error finding session.");
  }
};

const findSessionByToken = async (
  token: string
): Promise<ISessionModel | null> => {
  try {
    const session = await sessionModel.findOne({ token: token });
    return session;
  } catch (error) {
    console.error("Error finding session:", error);
    throw new Error("Error finding session.");
  }
};

export default {
  createSession,
  findSession,
  findSessionByToken,
};
