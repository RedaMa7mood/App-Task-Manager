import { prisma } from "../lib/prisma.js";
import * as DTO from "../types/taskDTO.js";
import { Prisma } from "../generated/prisma/client.js"
import { TaskStatus } from "../generated/prisma/enums.js";

type TaskFilter = {
    status?: TaskStatus,
    assigneeId?: number,
    createdBy?:number
    search?:string,
    page?:number,
    limit?:number,
    sortedBy?:'createdAt'|'updatedAt'|'status',
    sortedOrder?:'asc'|'desc'
}

export const createTask = async (projectId: number,  data:DTO.CreateTaskDTO) => {
    return prisma.task.create({
        data: {
           title:data.title,
           description:data.description,
           projectId,
           createdBy:data.createdBy,
          parentTaskId:data.parentTaskId
  
        }

    })
}
export const getTasksByProject = async (projectId: number, filter: TaskFilter = {}) => {
    const where: Prisma.TaskWhereInput = {
        projectId
    }
    if (filter.assigneeId) {
        where.assigneeId = +filter.assigneeId
    }
    if (filter.status) {
        where.status = filter.status
    }
    if(filter.createdBy){
        where.createdBy = +filter.createdBy
    }
   if(filter.search)
   {
    where.OR=[
        {
            title:{
                contains:filter.search,
                mode:'insensitive'
            }
         
        },{
               description:{
                contains:filter.search,
                mode:'insensitive'
            }
        }
    ]
   }
   const total=await prisma.task.count({where})
     const page = filter.page && filter.page>0?filter.page:1;
    const sortedfields=['createdAt','updatedAt','status']
   

     const limit = filter.limit && filter.limit>0?filter.limit:10;
       const totalPages=Math.ceil(total/limit)
         const currentPage=page>totalPages?totalPages:page;
     const skip=(currentPage-1)*limit;
     const hasNextPage=currentPage<totalPages;
     const hasPrevPage=currentPage>1;
     const sortedBy= filter.sortedBy||'createdAt';
     const sortedOrder= filter.sortedOrder==='asc'? 'asc': 'desc';
     const tasks=await prisma.task.findMany({
        where,
        take:limit,
        skip,
        orderBy: {
            [sortedBy]: sortedOrder
        },
        include: {
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                }
            },
            subTasks: {
                select: {
                    title: true,
                }
            },
            creator: {
                select: {
                    name: true,
                }
            }

        }
    })
    return {
        tasks,
        pagination:{
            total,
            totalPages,
            currentPage,
            hasNextPage,
            hasPrevPage
        }
    }
}

export const getTaskById = async (projectId: number, id: number) => {

    return prisma.task.findMany({
        where: {
            projectId,
            id
        },
    })
}

export const updateTask = async (taskId: number, data: Partial<DTO.CreateTaskDTO>) => {
    return prisma.task.update({
        where: {
            id: taskId
        },
        data: {
            ...data
        }
    })
}
export const deleteTask = async (taskId: number) => {
    return prisma.task.delete({
        where: {
            id: taskId
        }
    })
}