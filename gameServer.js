//handles socket connection

var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server)
{
  io = socketio.listen(server);
  io.set('log level', 1);

  io.sockets.on('connection', (socket)=>{
    //assign user
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');
    handleRoomJoining(socket);
    socket.on('rooms', ()=>{
      socket.emit('rooms', io.of('/').adapter.rooms);
    });
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed)
{
  var name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;

  //let user know their name
  socket.emit('nameResult',{
    success : true,
    name : name
  });

  //mark as used
  namesUsed.push(name);
  return guestNumber+1;
}
function joinRoom(socket, roomName)
{
  socket.join(roomName);
  //user now in room
  currentRoom[socket.id] = roomName;
  socket.emit('joinResult', {room : roomName});
  socket.broadcast.to(roomName).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + roomName + '.'
  });

   var usersInRoom = io.of('/').in(roomName).clients;
  if(usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in '+roomName+': ';
    for(var index in usersInRoom)
    {
      var userSocketId = usersInRoom[index].id;
      if(userSocketId != socket.id){
        if(index > 0){
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text : usersInRoomSummary});
  }
}

function handleRoomJoining(socket)
{
  socket.on('join', (room)=>{
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}
function handleClientDisconnection(socket, nickNames, namesUsed)
{
  socket.on('disconnect', ()=>{
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}
