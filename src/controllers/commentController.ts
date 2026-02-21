import { Request, Response } from "express";
import {addComment,removeComment,modifyComment,getCommentsByTaskId} from "../services/commentServices.js";
import { CatchAsync } from "../Utilies/CatchAsync.js";
import { getIO } from "../sockets/socket.js";



export const createComment=CatchAsync(async(req:Request,res:Response)=>{
    
         const {content}=req.body;
         const {taskId}=req.params;
         const userId=req.user.id;
     const room = `task-${taskId}`
         const comment=await addComment(+taskId,+userId,content);
         const io=getIO();
         if(comment){
          io.to(room).emit('commentCreated',comment);
         }
         res.status(201).json({message:"Comment added successfully",comment});

    })
 
export const getCommnents=CatchAsync(async(req:Request,res:Response)=>{
    
        const {taskId}=req.params;
        const comments=await getCommentsByTaskId(Number(taskId));
        res.status(200).json({message:"Comments fetched successfully",comments});

    })
 

export const updateComment=CatchAsync(async(req:Request,res:Response)=>{
      const taskId=Number(req.params.taskId);
      const {content}=req.body;
      const {id}=req.params;
     const userId=req.user.id;
     const room=`task-${taskId}`
      const comment=await modifyComment(Number(id),userId,content);
      const io=getIO();
      if(comment){
        io.to(room).emit('commentUpdated',{
            taskId,
            comment
        });
      }
      res.status(202).json({message:"Comment updated successfully",comment});
    })
export const deleteComment=CatchAsync(async(req:Request,res:Response)=>{
        const taskId=Number(req.params.taskId);
           const {id}=req.params;
           const room=`task-${taskId}`
           const userId=req.user.id;
           const comment=await removeComment(Number(id),userId);
           const io=getIO();
           if(comment){
            io.to(room).emit('commentDeleted',{
                commentId:id,
                taskId
            });
           }
           res.status(204).json({message:"Comment deleted successfully",comment});
    
})