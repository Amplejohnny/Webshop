import { Schema, model } from 'mongoose';

const cartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  owner: {
    type: Schema.Types.ObjectId, 
    ref: 'user'
  },
  buyer: {
    type: Schema.Types.ObjectId, 
    ref: 'user'
  }
});


export default model('Cart', cartSchema);
