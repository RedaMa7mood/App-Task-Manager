import { prisma } from "../lib/prisma.js";

export const addTag=async(name:string,color:string)=>{
    return  prisma.tags.create({
        data:{
            name,
            color
        }
    })
}
export const getTagById=async(tagId:number)=>{
    return  prisma.tags.findMany()
}
export const modifyTag=async(id:number,name:string,color:string)=>{
    return  prisma.tags.update({
        where:{
            id
        },
        data:{
            name,
            color
        }
    })
}
export const removeTag=async(id:number)=>{
    return  prisma.tags.delete({
        where:{
            id
        }
    })
}
