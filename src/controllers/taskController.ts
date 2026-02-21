import { createTask, getTasksByProject, getTaskById, updateTask, deleteTask } from "../services/taskServices.js";
import { Request, Response,NextFunction } from "express";
import * as DTO from "../types/taskDTO.js";
import {CatchAsync} from "../Utilies/CatchAsync.js"
import ApiError from "../Utilies/ApiError.js"
import { getIO } from "../sockets/socket.js";

export const addTask = CatchAsync(async (req: Request, res: Response,next:NextFunction) => {
     const io=getIO();
    
        const projectId = +req.params.projectId
        const room = `project-${projectId}`
        console.log("projectId",projectId);

        if (isNaN(projectId)) {
            return next(new ApiError("Invalid projectId",400))
        }
        console.log("body",req.body);
        //const createdBy = Number(req.body.createdBy);
        const {title,description,createdBy} = req.body;
        const data = {title,description,createdBy}
 console.log("createdBy",createdBy);
 console.log("data",data);
        const task = await createTask(projectId, data);
        if(task)
        {
            io.to(room).emit('taskCreated',task);
        }

        res.status(200).json({ message: "Task created successfully", data: task });
   


})

export const getProjectTasks =CatchAsync( async (req: Request, res: Response,next:NextFunction) => {


        const projectId = Number(req.params.projectId);
        if (isNaN(projectId)) {
            return next(new ApiError("Invalid projectId",400))
        }
const filter = req.query;
        const data = await getTasksByProject(projectId,filter)

        res.status(200).json({
            data
        });
    })
 


export const getTask =CatchAsync(async (req: Request, res: Response,next:NextFunction) => {

        const projectId = Number(req.params.projectId);
        const taskId = Number(req.params.taskId);
        if (isNaN(projectId) || isNaN(taskId)) {
            return next(new ApiError("Invalid projectId",400))
        }

        const task = await getTaskById(projectId, taskId)
        if (!task) {
            return next(new ApiError("Task not found",404))
        }

        res.status(200).json({
          data: task
        });
  
})

export const modifyTask =CatchAsync(async (req: Request, res: Response,next:NextFunction) => {
         
    const projectId = Number(req.params.projectId);
        const taskId = Number(req.params.taskId);
        const updateData: Partial<DTO.CreateTaskDTO> = req.body;
        const updatedTask = await updateTask(taskId, updateData);
        const io=getIO();
        const room = `project-${projectId}`
        io.to(room).emit('taskUpdated',updatedTask);
        res.status(200).json({ message: "Task updated successfully", task: updatedTask });
    })  
    
export const removeTask =CatchAsync(async (req: Request, res: Response,next:NextFunction) => {
    const io=getIO();
    const projectId = Number(req.params.projectId);
        const taskId = Number(req.params.taskId);
        await deleteTask(taskId);
        const room = `project-${projectId}`
        io.to(room).emit('taskDeleted',taskId);
        res.status(200).json({ message: "Task deleted successfully" });
    })
    
