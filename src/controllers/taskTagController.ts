import { CatchAsync } from "../Utilies/CatchAsync.js";
import { Request, Response } from "express";
import { addTaskTag, getTaskTags, getTagTasks, removeTaskTag } from "../services/taskTagServices.js";

export const addTaskTagController=CatchAsync(async(req:Request,res:Response)=>{
    const {taskId,tagId}=req.params;
    const taskTag=await addTaskTag(+taskId,+tagId);
    res.status(201).json({message:"Task tag added successfully",taskTag});
})
export const getTaskTagsController=CatchAsync(async(req:Request,res:Response)=>{
    const taskId=req.params.taskId;
    const taskTags=await getTaskTags(+taskId);
    res.status(200).json({message:"Task tags fetched successfully",taskTags});
})
export const getTagTasksController=CatchAsync(async(req:Request,res:Response)=>{
    const tagId=req.params.tagId;
    const tagTasks=await getTagTasks(+tagId);
    res.status(200).json({message:"Tag tasks fetched successfully",tagTasks});
})
export const removeTaskTagController=CatchAsync(async(req:Request,res:Response)=>{
    const {taskId,tagId}=req.params;
    const taskTag=await removeTaskTag(+taskId,+tagId);
    res.status(200).json({message:"Task tag removed successfully",taskTag});
})