import { Schema, model } from "mongoose";

const userAccessTokenSchema = new Schema({
    userId: { type: String, required: true },
    token: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now },
});


export default model("UserAccessToken", userAccessTokenSchema);




