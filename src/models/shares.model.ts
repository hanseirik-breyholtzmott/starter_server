import mongoose, { Document, Schema } from 'mongoose';
import { IUserModel } from './users.model';

//Define the IShare interface
export interface IShare {
    userId: string | IUserModel;
    numberOfShares: number;
    purchaseDate: Date;
    purchasePrice: number;
}

//Define the IShareModel interface, extending the IShare and Document
export interface IShareModel extends IShare, Document {}

//Define the SharesSchema with Mongoose
const SharesSchema = new Schema({
    userid: { type: String, ref: 'Users', required: true},
    numberOfShares: { type: Number, required: true },
    purchaseDate: { type: Date, required: true, default: Date.now},
    purchasePrice: { type : Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

export default mongoose.model<IShareModel>('Shares', SharesSchema)