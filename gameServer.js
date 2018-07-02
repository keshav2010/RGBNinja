//handles socket connection

/*
  Name Convention to follow
    > all the function arguments should begin with _  (example : _name, _arg)
    > function name should be like functionName() instead of function_Name(), with the first character must not be capitalized
*/
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server)
{
  io = socketio.listen(server);
  io.sockets.on('connection', (socket)=>{

    //emitted by nickname dialog, this is responsible for checking if nickname is
    //available or not, if available register it by mapping it to user id (socket id)
    //note that this assumes that the nicknameData is valid
    socket.on('nicknameRequest', (nicknameData)=>{
      console.log('nickname Request accepted for name : ' + nicknameData.name);
      if(nameAvailable(nicknameData.name))
      {
          //mark name as used
      }
    });

    socket.on('disconnect', ()=>{
      // on disconnection,perform following steps
      // > mark the nickname as available
      // *etc (more update coming soon)
    });
  });
};
function nameAvailable( _name )
{

}


/*
function joinRoom(socket, roomName)
{
  socket.join(roomName);
  //user now in room
  currentRoom[socket.id] = roomName;
  socket.emit('joinResult', {room : roomName});
  socket.broadcast.to(roomName).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + roomName + '.'
  });
}

function handleRoomJoining(socket)
{
  socket.on('join', (room)=>{
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}
*/
