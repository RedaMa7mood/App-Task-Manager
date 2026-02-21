import { Request, Response,NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { CatchAsync } from "../Utilies/CatchAsync.js";
import { addMember,deleteMember,getMember,getAllMembers,updateMember } from "../services/projectMemberServices.js";
import AppError  from '../Utilies/ApiError.js'
export const addProjectMember=CatchAsync(async(req:Request,res:Response,next)=>{
    
       const projectId=req.projectId;
       const memberId=req.memberId;
       console.log('projectId ',projectId,'memberId ',memberId);

       const Member= await addMember(projectId,memberId,req.body.role);
       res.status(201).json({message:"Project member added successfully",Member});      
    }
  )

export const getProjectMember=CatchAsync(async(req:Request,res:Response)=>{
         const projectId=req.projectId;
         const userId=req.memberId;
        const projectMembers=await getMember(projectId,userId);
        res.status(200).json({message:"Project members fetched successfully",projectMembers});
})

export const getAllProjectMembers=CatchAsync(async(req:Request,res:Response,next:NextFunction)=>{
       
        const projectId=+req.params.projectId;
        if(isNaN(projectId)){
            return next(new AppError("Invalid projectId",400));
        }
        const projectMembers=await getAllMembers(projectId);
        if(!projectMembers){
            return next(new AppError("Project members not found",404));
        }
        const users= projectMembers.map(member=>({
          id:member.user.id,
          name:member.user.name,
          email:member.user.email,
          role:member.role
        }));
        res.status(200).json({message:"Project members fetched successfully",users});
})
export const updateProjectMember=CatchAsync(async(req:Request,res:Response)=>{
    
        const memberId=req.memberId;
        const projectId=req.projectId;

        const projectMember=await updateMember(projectId,memberId,req.body.role);
        res.status(200).json({message:"Role updated successfully",projectMember});
})
export const deleteProjectMember=CatchAsync(async(req:Request,res:Response)=>{
    
        const memberId=req.memberId;
        const projectId=req.projectId;
        const projectMember=await deleteMember(projectId,memberId);
        res.status(200).json({message:"Member deleted successfully",projectMember});

   
})