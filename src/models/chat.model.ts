import mongoose, { Schema, Document } from 'mongoose';
import { IUserModel } from './users.model';

export interface IMessage {
  sender: mongoose.Types.ObjectId | IUserModel;
  content: string;
  timestamp: Date;
  readBy: mongoose.Types.ObjectId[]; // Users who have read this message
}

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[] | IUserModel[]; // Users involved in the chat
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema<IMessage>({
  sender: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Types.ObjectId, ref: 'Users' }]
});

const ChatSchema: Schema = new Schema<IChat>({
  participants: [{ type: mongoose.Types.ObjectId, ref: 'Users', required: true }],
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ChatSchema.pre<IChat>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Chat = mongoose.model<IChat>('Chat', ChatSchema);
export default Chat;