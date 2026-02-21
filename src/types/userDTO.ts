 import {z} from 'zod'
 export interface CreateTaskDTO{
    title:string;
    description?:string;  
    parentTaskId?:number;
   
 }

 export interface UpdatedTaskDTO{
    status?:string;
    title?:string;
    description?:string;
    assigneeId?:number;
 }
export const createdUserSchema=z.object({
name:z.string().trim().min(3).max(30),
email:z.string().trim().email()
                  .transform((email)=>email.toLowerCase()),
password:z.string().trim().min(6).max(30),
})


export const logInSchema=z.object({
   email:z.string().trim().email()
                 .transform((email)=>email.toLowerCase()),
  password:z.string().trim().min(5).max(10),
})

 export type CreateUserDTO=z.infer<typeof createdUserSchema>;
 export type LogInDTO=z.infer<typeof logInSchema>
 