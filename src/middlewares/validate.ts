import {Request,Response,NextFunction} from 'express';
import {ZodSchema } from 'zod'
export const validate=(schema:ZodSchema)=>{
    return (req:Request,res:Response,next:NextFunction)=>{
       const result=schema.safeParse(req.body);
       if(!result.success)
       {
        return res.status(400).json({message:"Invalid request payload",errors:result.error.format()});
       }
       req.body=result.data;
       next();
    }

}
//not used yet