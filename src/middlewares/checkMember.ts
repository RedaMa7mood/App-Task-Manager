import { NextFunction, Request, Response } from "express";
import ApiError from "../Utilies/ApiError.js";
export const checkProjectMember=(req:Request,res:Response,next:NextFunction)=>{
      const projectId=+req.params.projectId;
      const memberId=+req.params.memberId;
      if(isNaN(projectId)&& isNaN(memberId)){
            return next(new ApiError("Invalid project id or member id",400));
           }    
        req.projectId=projectId;
        req.memberId=memberId;
           next();
}
