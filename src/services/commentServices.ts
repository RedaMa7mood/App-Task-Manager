import { prisma } from "../lib/prisma.js";
import ApiError from "../Utilies/ApiError.js";


export const addComment=async(taskId:number,userId:number,content:string)=>{
 return  prisma.comments.create({
    data:{
        content,
        userId,
        taskId
    }
})
}
export const getCommentsByTaskId=async(taskId:number)=>{
    return  prisma.comments.findMany({
        where:{
            taskId
        }
    })
}

export const modifyComment=async(commentId:number,userId:number,content:string)=>{
     const comment =await prisma.comments.findUnique({
        where:{
           id:commentId
        }
    })
    if(!comment){
        throw new ApiError("Comment not found",404)
    }
    if(comment.userId !== userId){
        throw new ApiError("Unauthorized",401)
    }
    return  prisma.comments.update({
        where:{
           id:commentId
        },
        data:{
            content,
            isEdited:true
        }
    })
}
 
export const removeComment=async(commentId:number,userId:number)=>{
  const comment = await prisma.comments.findUnique({
    where:{
      id:commentId
    }
  })
  if(!comment){
    throw new ApiError("Comment not found",404)
  }
  if(comment.userId !== userId){
    throw new ApiError("Unauthorized",401)
  }
    return  prisma.comments.delete({
        where:{
         id:commentId                                                           
        }
    })
}
