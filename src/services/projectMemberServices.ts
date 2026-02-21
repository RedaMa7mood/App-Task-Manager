import { prisma } from "../lib/prisma.js";
import { CatchAsync } from "../Utilies/CatchAsync.js";

export const addMember=async(projectId:number,userId:number,role:string)=>{
    return  prisma.project_Member.create({
        data:{
            projectId,
            userId,
            role
        }
    })
}

export const getMember=async(projectId:number,userId:number)=>{
    return  prisma.project_Member.findUnique({
        where:{
          projectId_userId:{
            projectId,
            userId
          }
        },
        include:{
            user:true
        }
    })
}
export const getAllMembers=async(projectId:number)=>{
 return prisma.project_Member.findMany({
    where:{
        projectId
    },
   
select:{
    role:true,
    user:{
        select:{
            id:true,
            name:true,
            email:true
        }
    }
}
 })
}

export const updateMember=async(projectId:number,userId:number,role:string)=>{
    return  prisma.project_Member.update({
        where:{
            projectId_userId:{
                projectId,
                userId
            }
        },
        data:{
            role
        }
    })
}
export const deleteMember=async(projectId:number,userId:number)=>{
    return  prisma.project_Member.delete({
        where:{
            projectId_userId:{
                projectId,
                userId
            }
        }
    })
}

