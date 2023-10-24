import { Schema, model } from "mongoose";

const userSchema = new Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: { type: String },
    token: { type: String },
    createdAt: { type: Date, default: Date.now},
});

export default model("user", userSchema);



