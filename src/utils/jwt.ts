import jwt, { VerifyOptions, SignOptions } from "jsonwebtoken";

//Constants
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EMAIL_VERIFICATION_SECRET =
  process.env.JWT_EMAIL_VERIFICATION_SECRET || JWT_SECRET;
const JWT_PASSWORD_RESET_SECRET =
  process.env.JWT_PASSWORD_RESET_SECRET || JWT_SECRET;

export type RefreshTokenPayload = {
  sessionId: string;
};

export type AccessTokenPayload = {
  userId: string;
  sessionId: string;
};

export type EmailVerificationPayload = {
  email: string;
  userId: string;
};

export type PasswordResetPayload = {
  email: string;
  userId: string;
};

//Options for each type of token
const accessTokenOptions: SignOptions = {
  expiresIn: "15m",
};

export const refreshTokenOptions: SignOptions = {
  expiresIn: "30d",
};

const emailVerificationTokenOptions: SignOptions = {
  expiresIn: "1h",
};

const passwordResetTokenOptions: SignOptions = {
  expiresIn: "15m",
};

export const signToken = (
  payload:
    | AccessTokenPayload
    | RefreshTokenPayload
    | EmailVerificationPayload
    | PasswordResetPayload,
  options?: SignOptions
): string => {
  let secret: string;
  let opts: SignOptions;

  // Determine the secret and options based on the payload type
  if ("userId" in payload && "sessionId" in payload) {
    // AccessTokenPayload (with sessionId and userId)
    secret = JWT_SECRET;
    opts = options || accessTokenOptions;
  } else if ("sessionId" in payload) {
    // RefreshTokenPayload (with sessionId only)
    secret = JWT_REFRESH_SECRET;
    opts = options || refreshTokenOptions;
  } else if ("email" in payload && "userId" in payload) {
    if (options?.expiresIn === "1h") {
      // EmailVerificationPayload
      secret = JWT_EMAIL_VERIFICATION_SECRET;
      opts = options || emailVerificationTokenOptions;
    } else {
      // PasswordResetPayload
      secret = JWT_PASSWORD_RESET_SECRET;
      opts = options || passwordResetTokenOptions;
    }
  } else {
    throw new Error("Invalid payload type");
  }

  // Sign the token with the determined secret and options
  const token = jwt.sign(payload, secret, opts);
  return token;
};

export const verifyToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions
): { payload?: TPayload; error?: string } => {
  try {
    // Decode the token to inspect the payload structure before verifying
    const decoded = jwt.decode(token) as TPayload | null;

    //console.log("decoded", decoded);

    if (!decoded) {
      throw new Error("Invalid token");
    }

    // Infer the secret based on the structure of the decoded payload
    let secret: string;

    if ("userId" in decoded && "sessionId" in decoded) {
      // AccessTokenPayload: has userId and sessionId
      secret = JWT_SECRET;
    } else if ("sessionId" in decoded) {
      // RefreshTokenPayload: has only sessionId
      secret = JWT_REFRESH_SECRET;
    } else if ("email" in decoded && "userId" in decoded) {
      // EmailVerificationPayload or PasswordResetPayload: has email and userId
      if (decoded.email && decoded.userId) {
        secret = JWT_EMAIL_VERIFICATION_SECRET;
      } else {
        secret = JWT_PASSWORD_RESET_SECRET;
      }
    } else {
      throw new Error("Unrecognized token payload structure");
    }

    // Verify the token using the inferred secret
    const payload = jwt.verify(token, secret, options || {}) as TPayload;
    return { payload };
  } catch (error: any) {
    return { error: error.message };
  }
};
/*
export const verifyToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions 
) => {
  const { secret = JWT_SECRET, ...verifyOpts } = options || {};
  try {
    const payload = jwt.verify(token, secret, { ...verifyOpts }) as TPayload;
    return { payload };
  } catch (error: any) {
    return { error: error.message };
  }
};
*/
