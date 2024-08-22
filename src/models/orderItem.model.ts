import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from './product.model';

export interface IOrderItem extends Document {
  product: mongoose.Types.ObjectId | IProduct;
  quantity: number;
  price: number;
}

const OrderItemSchema: Schema = new Schema<IOrderItem>({
  product: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true } // Price at the time of order
});

const OrderItem = mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
export default OrderItem;
