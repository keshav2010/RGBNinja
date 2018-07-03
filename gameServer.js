/*
  Name Convention to follow
    > all the helper function arguments should begin with _  (example : _name, _arg)
    > function name should be like functionName() instead of function_Name(), with the first character must not be capitalized
*/
var socketio = require('socket.io');
var io;
var usedNames = [];
var currentRoom = {};

exports.listen = function(server)
{
  io = socketio.listen(server);

  //called when a socket is created on client request
  io.sockets.on('connection', (socket)=>{
    console.log("socket id : "+socket.id);
    //emitted by nickname dialog, this is responsible for checking if nickname is
    //available or not, if available register it by mapping it to user id (socket id)
    //note that this assumes that the nicknameData is valid
    socket.on('nicknameRequest', (nicknameData)=>{
      console.log('nickname Request accepted for name : ' + nicknameData.name);
      if(nameAvailable(nicknameData.name))
      {
          //mark name as used
          usedNames[ nicknameData.name] = true;
          console.log(usedNames[nicknameData.name] + " < marked" );
          socket.emit('nicknameAccepted');
      }
      else{
        console.log('DEBUG : name is already in use');
        socket.emit('nicknameRejected');
      }
    });

    socket.on('roomJoinRequest', (roomData)=>{
      console.log("room join request by > socket id : "+socket.id);
      socket.emit('roomJoinRejected');
    });

    socket.on('disconnect', ()=>{
      console.log('disconnnect > socket id : ' + socket.id);
      // on disconnection,perform following steps
      // > mark the nickname as available
      // *etc (more update coming soon)
    });
  });
};
function nameAvailable( _name)
{
  if(usedNames[_name] == undefined)
    return true;
  else if(usedNames[ _name] == true)
    return false;
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
