import { Server,Socket } from "socket.io";
export const registerTaskSocket=(io:Server,socket:Socket)=>{
  socket.on('joinProject',(projectId:number)=>{
     const room =`project-${projectId}`
     socket.join(room)
     socket.to(room).emit('joinedProject',{
        userId:socket.id,
        projectId
     })
     socket.emit('joinedProject',{
      message:'you have joined the project'
     })
  })

  //leave project
  socket.on('leaveProject',(projectId:number)=>{
  const room=`project-${projectId}`
  socket.leave(room)
  socket.to(room).emit('leftProject',{
    userId:socket.id,
    projectId
  })

  })
  socket.on('joinTask',(taskId:number)=>{
    const room=`task-${taskId}`;
    socket.join(room);
    socket.to(room).emit('joinedTask',{
      userId:socket.id,
      taskId
    })
    socket.emit('joinedTask',{
      message:'you have joined the task'
    })
  })
  //leave task
  socket.on('leaveTask',(taskId:number)=>{
    const room=`task-${taskId}`;
    socket.leave(room);
    socket.to(room).emit('leftTask',{
      userId:socket.id,
      taskId
    })
    socket.emit('leftTask',{
      message:'you have left the task'
    })
  })
}