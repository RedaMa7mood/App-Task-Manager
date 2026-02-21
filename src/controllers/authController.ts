import { Request, Response,NextFunction } from 'express';
import * as DTO from "../types/userDTO.js";
import { createUser, logIn as logInService, generateTokens } from '../services/authServices.js';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import {CatchAsync} from '../Utilies/CatchAsync.js'
import ApiError from '../Utilies/ApiError.js'
const cookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000//after 30 days cookie will expire
}

export const signUp =CatchAsync( async (req: Request, res: Response,next:NextFunction) => {

        const result = DTO.createdUserSchema.safeParse(req.body);
        if (!result.success) {
            //return res.status(400).json({ message: "Invalid request payload", errors: result.error.format() });
            return next(new ApiError(`Invalid ${result.error.issues[0].path}:${result.error.issues[0].message}`,400))
        }
        const data = result.data;
        const user = await createUser(data);
        const { accessToken, refreshToken } = await generateTokens(user.id);
        res.cookie("refreshToken", refreshToken, cookieOptions)
        res.header("Authorization", `Bearer ${accessToken}`);
        res.status(201).json({ message: "User created successfully", user });
    
    
})

export const logIn =CatchAsync( async (req: Request, res: Response,next:NextFunction) => {
  
        const result = DTO.logInSchema.safeParse(req.body);
        if (!result.success) {
           // return res.status(400).json({ message: `Invalid ${result.error.issues[0].path}`, errors: result.error.issues[0].message });
           return next(new ApiError(`${result.error.issues[0].message}`,400))
        }
        const data = result.data;
        const user = await logInService(data);
        if (!user) {
            //return res.status(401).json({ message: "Invalid credentials" });
            return next(new ApiError("Invalid credentials",404))
        }
        const { accessToken, refreshToken } = await generateTokens(user.id, user.role);
        res.cookie("refreshToken", refreshToken, cookieOptions)
        res.header("Authorization", `Bearer ${accessToken}`);
        res.status(200).json({ message: "User logged in successfully" });

    
})

export const refreshTokenHandler = CatchAsync(async (req: Request, res: Response,next:NextFunction) => {
   
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
          //  return res.status(401).json({ message: "Unauthorized" });
          return next(new ApiError("Unauthorized",401))
        }
        const storedToken = await prisma.refreshToken.findUnique({
            where: {
                token: refreshToken
            }
        })
        if (!storedToken || storedToken.revoked) {
           // return res.status(403).json({ message: "Unauthorized" });
           return next(new ApiError("Unauthorized",403))
        }
        await prisma.refreshToken.update({
            where: {
                token: refreshToken
            },
            data: {
                revoked: true
            }
        })
        const payload = await jwt.verify(refreshToken, process.env.JWT_SECRET!) as jwt.JwtPayload;
        const user = await prisma.user.findUnique({
            where: {
                id: Number(payload.sub)
            }
        })
        if (!user) {
           // return res.status(401).json({ message: "Unauthorized" });
           return next(new ApiError("user not found",404))
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user.id, user.role);
        res.cookie("refreshToken", newRefreshToken, cookieOptions)
        res.header("Authorization", `Bearer ${accessToken}`);
        res.status(200).json({ message: "User logged in successfully" });

  
})

export const logOut =CatchAsync (async (req: Request, res: Response,next:NextFunction) => {
 
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
          //  return res.status(401).json({ message: "Unauthorized" });
          return next(new ApiError("unauthorized",401))
        }
        const storedToken = await prisma.refreshToken.findUnique({
            where: {
                token: refreshToken
            }
        })
        if (!storedToken || storedToken.revoked) {
           // return res.status(403).json({ message: "Unauthorized" });
           return next(new ApiError("unauthorized",403))
        }
        await prisma.refreshToken.update({
            where: {
                token: refreshToken
            },
            data: {
                revoked: true
            }
        })
        res.clearCookie("refreshToken", cookieOptions)
        res.status(200).json({ message: "User logged out successfully" });
    
})
