import jwt from "jsonwebtoken";
import UserAccessToken from "../model/userAccessToken.js";
import UserRefreshToken from "../model/userRefreshToken.js";
import dotenv, { config } from 'dotenv';
dotenv.config();


const generateToken = async(user) => {
    try {
        const payload = {userId: user._id };
        const accessToken = jwt.sign(
            payload,
            process.env.ACCESS_TOKEN_KEY,
            { expiresIn: process.env.ACCESS_TOKEN_LIFE }
            );
        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_KEY,
            { expiresIn: process.env.REFRESH_TOKEN_LIFE}
            );

        return ({ accessToken, refreshToken });
    } catch (err) {
        return Promise.reject(err);
    }
};

const saveTokens = async (user, accessToken, refreshToken) => {
    await new UserAccessToken({ userId: user._id, token: accessToken }).save();
    await new UserRefreshToken({ userId: user._id, token: refreshToken }).save();
};

export {
    generateToken,
    saveTokens,
};