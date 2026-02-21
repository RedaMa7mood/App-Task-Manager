import { Router } from "express";
const userRouter=Router();
import {signUp,logIn,refreshTokenHandler,logOut} from '../controllers/authController.js'

    userRouter.route('/signup')
         .post(signUp)
    userRouter.route('/login')
         .post(logIn)
    userRouter.route('/refreshtoken')
         .post(refreshTokenHandler)
    userRouter.route('/logout')
         .post(logOut)



     export default userRouter;