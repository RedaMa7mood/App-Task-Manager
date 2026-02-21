import {createProject,getProjectsByOwner,updateProject,deleteProject} from '../services/projectServices.js'
import { Response, Request,NextFunction } from 'express';
import{CatchAsync} from "../Utilies/CatchAsync.js";
import ApiError from "../Utilies/ApiError.js";
export const addProject = CatchAsync(async(req:Request,res:Response,next:NextFunction)=>{
        const ownerId= +req.params.ownerId;
        const projectData=req.body;
        const newProject = await createProject(ownerId,projectData);
        res.status(201)
            .json({message:"Project created successfully",project:newProject});
  
})
export const getMyProjects = CatchAsync(async (req: Request, res: Response,next:NextFunction) => {

    const ownerId = Number(req.params.ownerId);
    if (isNaN(ownerId)) {
      return next(new ApiError("Invalid ownerId",400))
    }

    const projects = await getProjectsByOwner(ownerId);

    res.status(200).json({
      count: projects.length,
      projects,
    });

 
})

export const modifyProject=CatchAsync(async(req:Request,res:Response,next:NextFunction)=>{
    
        const projectId= +req.params.projectId;
        const updateData=req.body;
        const updatedProject=await updateProject(projectId,updateData);
        res.status(200).json({message:"Project updated successfully",project:updatedProject});
  
}
)
export const removeProject=CatchAsync(async(req:Request,res:Response,next:NextFunction)=>{
    
        const projectId= +req.params.projectId;
        await deleteProject(projectId);
        res.status(200).json({message:"Project deleted successfully"});
  
})