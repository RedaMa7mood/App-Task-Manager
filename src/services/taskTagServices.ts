import { prisma } from "../lib/prisma.js";

export const addTaskTag=async(taskId:number,tagId:number)=>{
    return prisma.task_Tags.create({
        data:{
            taskId,
            tagId
        }
    })
}
export const getTaskTags=async(taskId:number)=>{
    return prisma.task_Tags.findMany({
        where:{
            taskId
        }
    })
}
export const getTagTasks=async(tagId:number)=>{
    return prisma.task_Tags.findMany({
        where:{
            tagId
        }
    })
}
export const removeTaskTag=async(taskId:number,tagId:number)=>{
    return prisma.task_Tags.delete({
        where:{
           taskId_tagId:{
            taskId,
            tagId
           }
        }
    })
}