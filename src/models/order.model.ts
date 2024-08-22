import mongoose, { Schema, Document } from 'mongoose';
import { IUserModel } from './users.model';
import { IOrderItem } from './orderItem.model';
import { ITransaction } from './transaction.model';

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId | IUserModel;
  items: IOrderItem[];
  totalAmount: number;
  status: string; // e.g., 'pending', 'completed', 'canceled'
  paymentStatus: string; // e.g., 'paid', 'unpaid'
  transaction: mongoose.Types.ObjectId | ITransaction | null; // Associated transaction if payment is done
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema<IOrder>({
  user: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', required: true }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'unpaid' },
  transaction: { type: mongoose.Types.ObjectId, ref: 'Transaction', default: null },
  shippingAddress: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

OrderSchema.pre<IOrder>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
