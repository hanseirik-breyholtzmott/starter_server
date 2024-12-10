import mongoose, { Schema, Document } from "mongoose";
import { IUserModel } from "./users.model";

export interface ISession {
  userId: string;
  expiresAt: Date;
}

export interface ISessionModel extends ISession, Document {}

const SessionSchema: Schema = new Schema<ISessionModel>(
  {
    userId: {
      type: String,
      ref: "Users",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Make sure to use the correct name for the schema export
export default mongoose.model<ISessionModel>("Session", SessionSchema);
