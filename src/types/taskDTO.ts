 
 export interface CreateTaskDTO{
    title:string;
    description?:string;  
    parentTaskId?:number;
   createdBy:number;
 }

 export interface UpdatedTaskDTO{
    status?:string;
    title?:string;
    description?:string;
    assigneeId?:number;
 }
