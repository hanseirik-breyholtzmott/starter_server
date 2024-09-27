import jwt, { VerifyOptions, SignOptions } from "jsonwebtoken";

//Constants
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

//Models
import { ISessionModel } from "../models/session.model";
import { IUserModel } from "../models/users.model";

export type RefreshTokenPayload = {
  sessionId: ISessionModel["_id"];
};

export type AccessTokenPayload = {
  userId: IUserModel["_id"];
  sessionId: ISessionModel["_id"];
};

export type SignOptionsAndSecret = SignOptions & {
  secret: string;
};

const accessTokenOptions: SignOptionsAndSecret = {
  expiresIn: "15m",
  secret: JWT_SECRET,
};

const refreshTokenOptions: SignOptionsAndSecret = {
  expiresIn: "30d",
  secret: JWT_REFRESH_SECRET,
};

export const signToken = (
  payload: AccessTokenPayload | RefreshTokenPayload,
  options?: SignOptionsAndSecret
) => {
  const secret =
    options?.secret || (payload as AccessTokenPayload).userId
      ? JWT_SECRET
      : JWT_REFRESH_SECRET;
  const opts =
    options || (payload as AccessTokenPayload).userId
      ? accessTokenOptions
      : refreshTokenOptions;
  return jwt.sign(payload, secret, opts);
};

export const verifyToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions & { secret?: string }
) => {
  const { secret = JWT_SECRET, ...verifyOpts } = options || {};
  try {
    const payload = jwt.verify(token, secret, { ...verifyOpts }) as TPayload;
    return { payload };
  } catch (error: any) {
    return { error: error.message };
  }
};
