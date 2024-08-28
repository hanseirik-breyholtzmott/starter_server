import mongoose, { Schema, Document } from "mongoose";
import { IUserModel } from "./users.model";

export interface ISessionModel extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
}

const SessionSchema: Schema = new Schema<ISessionModel>(
  {
    userId: { type: String, ref: "Users", required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Make sure to use the correct name for the schema export
export default mongoose.model<ISessionModel>("Session", SessionSchema);
