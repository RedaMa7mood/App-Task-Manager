import express from 'express';
import {Response,Request,NextFunction} from 'express';

// export const createUser=async(req:Request,res:Response)=>{

// try{
// const {name,email,password,confirmPassword}=req.body;
// const newUser=await prisma.user.create({
//     data:{
//         name,
//         email,
//         password,
//     }
// })
// res.status(201).json({message:"User created successfully",user:newUser});

// }
// catch(error:any){
//     res.status(500).json({message:"Internal Server Error",error:error.message});
//     }
// }


// export const getUsers=async(req:Request,res:Response)=>{
// try{
// const users=await prisma.user.findMany(
//     {
//         where:{
//             id:+req.params.id
//         },
//        select:{
//        name:true,
//          email:true,
//          role:true

//            }
//     }
// );
// res.status(200).json({
//     count:users.length,
//     users
    

// });
// }
// catch(error:any){
// console.error("Error fetching users:", error);
// res.status(500).json({message:"Internal Server Error",error:error.message});
// }

// }