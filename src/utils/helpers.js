import bcrypt from "bcryptjs";

function hashPassword(password) {
    const salt = bcrypt.genSaltSync();
    return bcrypt.hashSync(password, salt);
}

function comparePassword(raw, hash) {
    return bcrypt.compareSync(raw, hash);
}
const Response = (res, statusCode=200, data=null, msg="Request Successful", status="success", error=[]) =>{
    return res.status(statusCode).send({
        msg,
        data,
        status,
        error
    })
}


export {
    hashPassword, 
    comparePassword,
    Response
};
