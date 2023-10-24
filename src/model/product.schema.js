import { Schema, model } from "mongoose";



const productSchema = new Schema({
    name: String,
    price: String,
    description: String,
    createdAt: { 
        type: Date, default: Date.now
    },
    updatedAt: { 
        type: Date, default: Date.now
    },
    thumbnail: String,
    owner: {
        type: Schema.Types.ObjectId, 
        ref: 'user',
    },
    buyer: {
        type: Schema.Types.ObjectId, 
        ref: 'user',
    }
});

productSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});


export default model("Product", productSchema);