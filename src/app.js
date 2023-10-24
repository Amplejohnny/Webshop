import express, { json } from "express";
import User from "./model/user.schema.js";
import {generateToken, saveTokens} from "./utils/generateToken.js";
import verifyRefreshToken from "./utils/verifyRefreshToken.js";
import UserRefreshToken from "./model/userRefreshToken.js";
import { hashPassword, comparePassword } from './utils/helpers.js';
import jwt from 'jsonwebtoken';
import auth from './middleware/auth.js';
import dotenv from 'dotenv';
import connect  from './config/database.js';

//middlewares
import shopRoute from './routes/shop.js';
import historyRoute from './routes/history.js';



dotenv.config();
connect();

const app = express();
app.use(json());


//middleware
app.use('/api/shop/items' , shopRoute);
app.use('/api/shop/history', historyRoute);


       
//validation function using regrex
const is_valid_Email = (mail) => (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
const is_valid_Username = (username) => (/^[a-zA-Z0-9]+$/.test(username))
const is_valid_Password = (password) => (/^(?=.*[a-zA-Z0-9])(?=.*[\p{P}\p{S}])(?!.*\s).{8,}$/u.test(password))
 
const validate = ({username, password, email}) =>{
    if ( password.length < 8 ) {
        throw new Error("passwword too short")
    }
    if ( !is_valid_Username(username) ) {
        throw new Error("Username must not contain special characters")
    }
    if ( !is_valid_Password(password) ) {
        throw new Error("Password must not contain spaces and have at least 8 characters including one special character")
    }
    if ( username.length <  5 ) {
        throw new Error("Username must be at least 5 characters")
    }
    if ( !is_valid_Email(email) ) {
        throw new Error("Enter a valid email")
    }
    if ( !username ) {
        throw new Error('Username cannot be empty');
    }
    if ( !password ) {
        throw new Error('Password cannot be empty');
    }
    if ( !email ) {
        throw new Error('Email cannot be empty');
    }
};




class BadUsername extends Error {
    //pass
}


/**
* @openapi
* components:
*   schemas:
*     userSignup:
*       type: object
*       required:
*         - username
*         - email
*         - password
*       properties:
*         username:
*           type: string
*           description: The username of the user
*         email:
*           type: string
*           description: The email of the user
*         password:
*           type: string
*           description: The password of the user
*/

/**
* @openapi
* tags:
*   name: Users
*/

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     description: This API is used to create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/userSignup'
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *               example:
 *                 username: "example"
 *                 email: "example@gmail.com"
 *                 password: "must not contain spaces and have at least 8 characters including one special character"
 */
app.post("/api/auth/signup", async(req, res) => {
    const { username, email, password } = req.body;
    try{
        validate(req.body)
    } catch(err){
        return res.status(400).send({
            msg: 'Validation Error',
            status: 'Failed',
            data: null,
            error: err.message
        });
    }
    try {
        if(await User.findOne({ username })) {
            throw new Error('username already exists');
        }
        if(await User.findOne({ email })) {
            throw new BadUsername('email already exists');
        } else {
        
        const hashedPassword = hashPassword(password);
        const data = {
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
          
          }
        const user = await User.create(data);
        //create token
        const token = jwt.sign(
            { userId: user._id, username },
            process.env.ACCESS_TOKEN_KEY,
            {
              expiresIn: "2h",
            }
          );
        user.token = token;
        res.status(201).send({ 
            msg: 'new user created!',
            status: 'success',
            data: { username, email }
        });
        };
    } catch(err) {
        return res.status(400).send({
            msg: 'Registration Unsuccessful',
            status: 'Failed',
            data: null,
            error: err.message
        });
    };
});


/**
* @openapi
* components:
*   schemas:
*     userLogin:
*       type: object
*       required:
*         - username
*         - password
*       properties:
*         username:
*           type: string
*           description: The username of the user
*         password:
*           type: string
*           description: The password of the user
*/

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     description: This API is used to login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/userLogin'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *               example:
 *                 username: "example"
 *                 password: "must have at least 8 characters including one special character"
 */
app.post("/api/auth/login", async(req, res) => {
    try {
        const { username , password } = req.body;
        if (!username) {
            throw new Error('Username cannot be empty');
        }
        if (!password) {
            throw new Error('Password cannot be empty');
        }
        const user = await User.findOne({ username });
        if(!user) {
            throw new Error("Invalld username")
        }
        const isValid = comparePassword(password , user.password);
            if (isValid) {
                console.log('Authetication successful!');
            const { accessToken, refreshToken } = await generateToken(user); 
            await saveTokens(
                user, 
                accessToken, 
                refreshToken
            );
            res.status(200).send({ 
                msg: 'Login successful!',
                status: 'success',
                data: { accessToken, refreshToken }
            });
            } else {
                return res.status(401).send({
                    msg: 'Invalid Authetication',
                    status: 'Failed',
                    data: null,
                    error: 'Incorrect password'
                })
            }
    } catch(err){
        return res.status(400).send({
            msg: 'Login Unsuccessful',
            status: 'Failed',
            data: null,
            error: err.message
        });
    };
});



/**
* @openapi
* components:
*   schemas:
*     refreshToken:
*       type: object
*       required:
*         - refreshToken
*       properties:
*         refreshToken:
*           type: string
*           description: The refreshToken of the user
*/

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     description: This API is used to refresh the token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/refreshToken'
 *     responses:
 *       200:
 *         description: Token refresh successfully
 */
app.post("/api/auth/refresh", async(req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) 
            throw new Error('Refresh token cannot be empty');
        const { tokenDetails } = await verifyRefreshToken(refreshToken);
        const { userId } = tokenDetails;
        const user = await User.findById(userId);
        if (!user) 
            throw new Error('User not found');
        await UserRefreshToken.findOne({token: refreshToken}).findOneAndRemove()
        const { accessToken, refreshToken: newRefreshToken } = await generateToken(user);
        await saveTokens(
            user,
            accessToken,
            newRefreshToken
        );
        res.status(200).send({ 
            msg: 'Refresh successful!',
            status: 'success',
            data: { accessToken, refreshToken: newRefreshToken }
        });
    
    } catch(err){
        return res.status(400).send({
            msg: 'Refresh Unsuccessful',
            status: 'Failed',
            data: null,
            error: err.message
        });
    };
});


/**
* @openapi
* components:
*   schemas:
*     userEdit:
*       type: object
*       required:
*         - oldPassword
*         - newPassword
*       properties:
*         oldPassword:
*           type: string
*           description: user old password
*         newPassword:
*           type: string
*           description: user new password
*/

/**
 * @openapi
 * /api/auth/account:
 *   post:
 *     description: This API is used to edit the user password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/userEdit'
 *     responses:
 *       200:
 *         description: User password changed successfully
 *         content:
 *           application/json:
 *               example:
 *                 oldPassword: "current password"
 *                 newPassword: "must have at least 8 characters including one special character"
 */
app.post("/api/auth/account", auth, async(req, res) => {
    try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;
    const user = await User.findOne({ _id: userId });
    const isValid = comparePassword(oldPassword , user.password);
    if(!isValid) {
        throw new Error("Invalld Password")
    } else {
        const hashedPassword = hashPassword(newPassword);
        user.password = hashedPassword;
        await user.save();
        res.status(200).send({
            msg: 'Password changed successfully!',
            status: 'success',
            data: null
        });
    }
    } catch(err) {
        return res.status(400).send({
            msg: 'Password change Unsuccessful',
            status: 'Failed',
            data: null,
            error: err.message
        });
    }
});



export default app