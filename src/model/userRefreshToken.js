import { Schema, model } from "mongoose";

const userRefreshTokenSchema = new Schema({
    userId: { type: String, required: true },
    token: { 
        type: String, 
        ref: 'UserAccessToken', 
        required: true, 
     }, 
    createdAt: { type: Date, default: Date.now },
});




export default model("UserRefreshToken", userRefreshTokenSchema);




