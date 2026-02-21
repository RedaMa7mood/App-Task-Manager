import { Request, Response } from "express";
import { CatchAsync } from "../Utilies/CatchAsync.js";
import { addTag,getTagById,modifyTag,removeTag } from "../services/tagServices.js";
export const createTag=CatchAsync(async(req:Request,res:Response)=>{
        const {name,color}=req.body;
        const tag=await addTag(name,color);
        res.status(201).json({message:"Tag created successfully",tag});
})

export const getTag=CatchAsync(async(req:Request,res:Response)=>{
     const tagId=req.params.tagId;
     const tags= await getTagById(+tagId);
     res.status(200).json({message:"Tags fetched successfully",tags});
})

export const updateTag=CatchAsync(async(req:Request,res:Response)=>{
const {name,color}=req.body;
const tagId=req.params.tagId;
const tag=await modifyTag(+tagId,name,color);
res.status(202).json({message:"Tag updated successfully",tag}); 
})

export const deleteTag=CatchAsync(async(req:Request,res:Response)=>{
    const tagId=req.params.tagId;
    const tag=await removeTag(+tagId);
    res.status(204).json({message:"Tag deleted successfully",tag});
})