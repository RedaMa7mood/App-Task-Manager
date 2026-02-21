import { Request,Response,NextFunction } from "express"
import ApiError from "./ApiError.js"
import { ZodError } from "zod"
import logger from "./logger.js"
export const NotFound=(req:Request,res:Response,next:NextFunction)=>{
   next(new ApiError("route not found",400))
}
 
export const globalError=(err:any,req:Request,res:Response,next:NextFunction)=>{

  let error = err;

if (err instanceof ZodError) {
  error = new ApiError(err.issues[0].message, 400);
}

else if (err.name === "JsonWebTokenError") {
  error = new ApiError("Invalid token", 401);
}

else if (err.name === "TokenExpiredError") {
  error = new ApiError("Token expired", 401);
}
else if (err.name === "ValidationError") {
  error = new ApiError(err.message, 400);
}
else if(err.code==='P2025'){
  error = new ApiError("Record not found", 404);
}

else if (!(err instanceof ApiError)) {
  error = new ApiError("Internal Server Error", 500);
}
   
logger.error({
  message: error.message,
  stack: error.stack,
  route: req.originalUrl,
  method: req.method
});


  //DEV ERROR
  if(process.env.NODE_ENV==='development'){
    return  res.status(error.statusCode).json({
        status:error.status,
        message:err.message,
        error:process.env.NODE_ENV==='development'?err:undefined,
        stack:process.env.NODE_ENV==='development'?err.stack:undefined
            })
  }
  //PRODUCTION ERROR
  res.status(error.statusCode).json({
    status:error.status,
    message:error.message
  })
  

}