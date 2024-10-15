import mongoose, { Schema, Document } from "mongoose";
import { IUserModel } from "./users.model";

export interface ISessionModel extends Document {
  userId: string | mongoose.Types.ObjectId;
  userAgent?: string;
  token?: string;
  expiresAt: Date;
}

const SessionSchema: Schema = new Schema<ISessionModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    userAgent: { type: String, required: false },
    token: { type: String, required: false },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Make sure to use the correct name for the schema export
export default mongoose.model<ISessionModel>("Session", SessionSchema);
