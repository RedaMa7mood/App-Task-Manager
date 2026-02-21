import {Request, Response,NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export const protect=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const authHeader=req.headers.authorization;
     
        if(!authHeader||!authHeader.startsWith('Bearer ')){
            return res.status(401).json({message:"Unauthorized"});
        }
           const token=authHeader.split(' ')[1];
 
        const decoded=jwt.verify(token,process.env.JWT_SECRET!);
        
        const user=await prisma.user.findUnique({
            where:{
                id:Number(decoded.sub)
            }
        })
        if(!user){
            return res.status(401).json({message:"Unauthorized"});
        }
        req.user=user;
   
        next();
    }
    catch(error){
        return res.status(401).json({message:"Unauthorized"});
    }
    

}