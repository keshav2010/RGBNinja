/*  TEXT EDITOR : BRACKETS (identation issues if working with different TEXTEDITORS)
  Name Convention to follow
    > all the helper function arguments should begin with _  (example : _name, _arg)
    > function name should be like functionName() instead of function_Name(), with the first character must not be capitalized
*/
var socketio = require('socket.io');
var io;

var usedNames = {}; //maps name to socket.id
var userName = {}; //maps socket.id to name 

var usedRoomNames = {}; //maps roomName to number(number of clients in the room), this variable might need not to store number of clients 
//as value since socketio probably have build in method/properties to check for that

var currentRoom = {}; //maps socketID to roomName

exports.listen = function(server)
{
    io = socketio.listen(server);
    
    io.sockets.on('connection', function(socket){
        
        console.log("connection > socketID: "+socket.id);        
        //emitted by nickname dialog, responsible for checking nickname availibity
        socket.on('nicknameRequest', function(nicknameData){
          if(clientNameAvailable(nicknameData.name))
          {
              //mark as used
              usedNames[ nicknameData.name] = socket.id;
              socket.emit('nicknameAccepted');
          }
          else{
            socket.emit('nicknameRejected');
          }
        });
        
        // creating new room if it doesn't exist
        socket.on("roomCreateRequest", function(roomData){
              //if room name is available for use
            if(roomNameAvailable(roomData.roomName))
            {
                socket.emit("roomCreateAccepted");
                joinRoom(socket, roomData.roomName);
            }
            else socket.emit('roomCreateRejected');
        });
        
        // join room if it exist
        socket.on('roomJoinRequest', function(roomData){
            
            //if roomName is not used implies room doesn't exist
            if(usedRoomNames[ roomData.roomName] == undefined)
                socket.emit('roomJoinRejected', "Sorry, No such room exist.");
            //else if room exist and is full
            else if(usedRoomNames[ roomData.roomName] > 1)
                socket.emit('roomJoinRejected', "Sorry, Room is already full.");
            else {
                joinRoom(socket, roomData.roomName);
                socket.emit('roomJoinAccepted');
                
                //see index.html for on('gameBegin')
                //emit gameBegin signal for all connected sockets of given room
                io.to(roomData.roomName).emit('gameBegin');
            }
        });
        
        socket.on('disconnect', function(){
            console.log("disconnect socket : "+socket.id);
            leaveRoom(socket);
            delete usedNames[ userName[socket.id]];
            delete userName[socket.id];
        });
    });
};

//helper method : returns true if _name is not used otherwise false
function clientNameAvailable( _name)
{
    if(usedNames[_name] == undefined)
        return true;
    return false;
}
//helper method : returns true if roomName is available to use for creating new room
function roomNameAvailable( _roomName)
{
    if(usedRoomNames[_roomName] == undefined)
        return true;
    return false;
}

function joinRoom(_socket, _roomName)
{
    //if user is already in a room, leave it before joining a new one
    leaveRoom(_socket);
    
    //this is true when creating room
    if(usedRoomNames[ _roomName] == undefined)
        usedRoomNames[ _roomName]=0;
    
    //join new room and update corresponding variables
    _socket.join(_roomName);
    currentRoom[_socket.id] = _roomName;
    usedRoomNames[ _roomName] += 1;
    
    _socket.emit('roomJoinAccepted', {room : _roomName});
}


function leaveRoom(_socket)
{
    //if no room to leave, return
    if(currentRoom[ _socket.id] == undefined)
        return;
    
    _socket.leave( currentRoom[_socket.id]);
    
    usedRoomNames[currentRoom[_socket.id]] -= 1;
    if(usedRoomNames[currentRoom[_socket.id]] <= 0){
        delete usedRoomNames[currentRoom[_socket.id]]; //mark room name as available
    }
    delete currentRoom[ _socket.id];
}
