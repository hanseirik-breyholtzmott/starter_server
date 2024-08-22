import jwt from 'jsonwebtoken'

//Models
import { IUserModel } from '../models/users.model'


const createRefreshToken = (user: IUserModel):string => {
    return jwt.sign(
        {
          id: user.user_id,
          email: user.primaryEmailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '14d' }
      );
}

const createAccessToken = (email: string):string => {
    return jwt.sign(
        { sub: email }, 
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: '15m' }
    );
}

const verificationToken = ():string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export default {
    createRefreshToken,
    createAccessToken,
    verificationToken
}