import { prisma } from "../lib/prisma.js";

interface UpdateProjectDTO {
  title?: string;
  description?: string;
}

export const createProject=async(ownerId:number,data:any)=>{
    return prisma.project.create({
            data:{
                ...data,
                ownerId:ownerId
            }
        });
         
}
export const getProjectsByOwner=async(ownerId:number)=>{
   
    return prisma.project.findMany({
        where:{
            ownerId:ownerId
        },
       omit:{
        ownerId:true
       },
       include:{
        tasks:true
       }
    
        
    })    
}
export const updateProject=async(projectId:number,data:UpdateProjectDTO)=>{
    return prisma.project.update({
        where:{
            id:projectId
        },
        data:{
            ...data
        }
        })
}
export const deleteProject=async(projectId:number)=>{
    return prisma.project.delete({
        where:{
            id:projectId
        }
    })
}