import {Server} from 'socket.io';
import { registerTaskSocket } from "./taskSocket.js";
let io:Server;

export const initSocket=(server:any)=>{
  io = new Server(server,{
    cors:{
      origin:"*"
    }
  })
  io.on('connection',(socket)=>{
    console.log('a user connected');

       registerTaskSocket(io,socket)
       
    socket.on('disconnect',()=>{
      console.log('user disconnected');
    })
  
  })
}
export const getIO=()=>{
    if(!io){
        throw new Error('IO is not initialized')
    }
    return io
}