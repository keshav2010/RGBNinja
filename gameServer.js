var socketio = require('socket.io');
var io;

var activeRooms = new Map(); //maps room name to roomObject 
var activeClients= new Map();//maps username to user object

//as value since socketio probably have build in method/properties to check for that

/*
constructor method :
*/
function GameRoom(_roomName)
{
    this.roomName = _roomName;
    this.RGBValue = [0, 0, 0];
    this.connectedUsers = new Map(); //map username to User object
    this.playerCount = 0;
    
    this.generateRGBValue = function(){
        this.RGBValue[0] = getRand(10, 200);
        this.RGBValue[1] = getRand(15, 200);
        this.RGBValue[2] = getRand(10, 250);
    }
    this.getRGB = function(){
        return this.RGBValue;
    }
    
    //this method should never be called directly
    this.addNewUser = function( _userObject){
        console.log("adding user : "+ _userObject.userName+" to room");
        user = _userObject;
        if(this.playerCount == 2)
        {
            console.log(">> failed to add");
            return false;
        }
        
        this.connectedUsers.set(user.userName, user);
        this.playerCount = this.connectedUsers.size;
        console.log("player count after adding : "+this.playerCount);
        if(this.playerCount == undefined){
            this.playerCount=0;
            console.log("failed to join,")
        }
        return true;
    }
    //this method should never be called directly
    this.removeUser = function( _userName){
        console.log("Room removeUser > attempting to remove user : "+ _userName+ " from room : "+this.roomName);
        if(this.connectedUsers.get(_userName) == undefined || this.playerCount == 0){
            console.log(" user not registered as connected for this room, current there are :" + this.playerCount + " players");
            return false;
        }
        this.connectedUsers.delete(_userName);
        this.playerCount = this.connectedUsers.size;
        if(this.playerCount == undefined)
            this.playerCount=0;
        console.log(" removed user , player left in room : " + this.playerCount);
        return true;
    }
    
    this.getUser = function( _userName){
        return this.connectedUsers.get(_userName);
    }
    
    return this;
}
function User(_userName, _socket)
{
    this.serverSideSocket = _socket;
    this.userName = _userName;
    this.currentRoom = undefined;
    this.RGBValues = [0, 0, 0];
    this.updateRGB = function(index)
    {
        this.RGBValues[index] += 1;
    };
    this.getRGBValues = function(){
      return this.RGBValues;  
    };
    this.addToRoom = function( _roomObject){ 
        this.leaveCurrentRoom();
        this.currentRoom = _roomObject;
        if(this.currentRoom.addNewUser(this)){
            console.log("joined room : "+ _roomObject.roomName);
            this.serverSideSocket.join( _roomObject.roomName);
        }
    };
    
    //leave current room if it exist, as well inform other users in room about room status,
    //if no player in room then clear the room.
    this.leaveCurrentRoom = function(){
        console.log("User Attempting to leave its current Room");
        if(this.currentRoom == undefined){
            console.log("current room undefined");
            return;
        }
        
        //inform other users in room about user who left the room
        this.serverSideSocket.broadcast.to(this.currentRoom.roomName).emit('userLeft', this.userName);
        
        this.currentRoom.removeUser( this.userName);
        this.serverSideSocket.leave( this.currentRoom.roomName);
        
        //clear the room if no user in it
        if( activeRooms.get(this.currentRoom.roomName).playerCount == 0){
            activeRooms.delete(this.currentRoom.roomName);
        }
        
        this.currentRoom = undefined;
    };
}
exports.listen = function (server) {
    io = socketio.listen(server);

    io.sockets.on('connection', function (socket) {
        
        console.log("connection > socketID: " + socket.id);
        //emitted by nickname dialog, responsible for checking nickname availibity
        socket.on('nicknameRequest', function (nicknameData) {
            if (clientNameAvailable(nicknameData.name)) {

                //added new property to socket object to avoid making new global map 
                socket.clientName = nicknameData.name;
                activeClients.set(nicknameData.name, new User( nicknameData.name, socket));
                socket.emit('nicknameAccepted');
            } else {
                socket.emit('nicknameRejected');
            }
        });

        //creating new room if it doesn't exist
        socket.on("roomCreateRequest", function (requestData) {
            //if room name is available for use
            if (roomNameAvailable(requestData.roomName)) {
                
                activeRooms.set( requestData.roomName, new GameRoom( requestData.roomName));
                activeClients.get(requestData.userName).addToRoom( activeRooms.get(requestData.roomName));
                socket.emit("roomCreateAccepted");
            } 
            else socket.emit('roomCreateRejected');
        });

        // join room if it exist
        socket.on('roomJoinRequest', function (requestData) {
            var username = requestData.userName;
            var roomname = requestData.roomName;
            if(joinRoom(username, roomname, socket)){
                if(activeRooms.get( roomname).playerCount == 2)
                {
                    //setup game by generating target RGBValues for room
                    activeRooms.get(roomname).generateRGBValue();
                    
                    //signals all connected clients in a room to get ready 
                    //and supplies same target value to each client to setup display
                    io.to(roomname).emit('gameReady', {
                        r : activeRooms.get(roomname).getRGB()[0],
                        g : activeRooms.get(roomname).getRGB()[1],
                        b : activeRooms.get(roomname).getRGB()[2]
                    });
                }
            }
            
        });
        
        socket.on('input', (data)=>{
            if(data.color === 'red')
             {
                activeClients.get(socket.clientName).updateRGB(0);
                socket.broadcast.to(activeClients.get(socket.clientName).currentRoom.roomName).emit('opponentAction', activeClients.get(socket.clientName).getRGBValues());
                 
                  //inform emitter about its own color on server
                socket.emit('clientAction', activeClients.get(socket.clientName).getRGBValues());
             }
            else if(data.color === 'green')
             {
                activeClients.get(socket.clientName).updateRGB(1);
                
                //inform other users about opponent display
                socket.broadcast.to(activeClients.get(socket.clientName).currentRoom.roomName).emit('opponentAction', activeClients.get(socket.clientName).getRGBValues());
                 
                //inform emitter about its own color on server
                socket.emit('clientAction', activeClients.get(socket.clientName).getRGBValues());
             }
            else if(data.color === 'blue')
             {
                activeClients.get(socket.clientName).updateRGB(2);
                 //inform other users about opponent display
                socket.broadcast.to(activeClients.get(socket.clientName).currentRoom.roomName).emit('opponentAction', activeClients.get(socket.clientName).getRGBValues());
                 
                  //inform emitter about its own color on server
                socket.emit('clientAction', activeClients.get(socket.clientName).getRGBValues());
             }
        
        });
       
        socket.on("requestGameStart", function(targetRGBValue){
           socket.emit('startGame', targetRGBValue); 
        });
        
        //server recieved user request to terminate the game room and clear it completely
        socket.on("requestRoomEnd", function(roomname){
            var roomname = activeClients.get(socket.clientName).currentRoom.roomName;
            if(leaveRoom(socket)){
                //delete the room
                activeRooms.delete(roomname);
                socket.emit('roomEndAccepted');
            }
            else{ 
                socket.emit('roomEndRejected');
            }
        });
        socket.on('disconnect', function () {
            console.log("disconnect socket : " + socket.id);
            leaveRoom(socket);
            activeClients.delete(socket.clientName);
        });
    });
};

//helper method : returns true if _name is not used otherwise false
function clientNameAvailable(_name) {
    if(activeClients.get(_name) == undefined)
        return true;
    return false;
}
//helper method : returns true if roomName is available to use for creating new room
function roomNameAvailable(_roomName) {
    if (activeRooms.get(_roomName) == undefined)
        return true;
    return false;
}


/*
helper method : joins given user (given as name) to given room (given as name)
parameters : 
    _userName : name of user who wish to join the room
    _roomName : name of room to join
removes user from any existing room
*/
function joinRoom(_userName, _roomName, _socket) {
    
    //if roomName is not used implies room doesn't exist
    if(activeRooms.get(_roomName) == undefined){
        console.log('no such room found active : '+_roomName);
        _socket.emit('roomJoinRejected', "Sorry, No such room exist.");
        return false;
    }
    //else if room exist and is full
    else if (activeRooms.get(_roomName).playerCount > 1){
        console.log('room '+ _roomName+' is full');
        _socket.emit('roomJoinRejected', "Sorry, Room is already full.");
        return false;
    }
    //otherwise join room
    
    //makes sure given user leaves any room to which it belongs 
    //before joining a new room
    leaveRoom(_socket);

    //user joins the room
    activeClients.get(_userName).addToRoom( activeRooms.get(_roomName));
    console.log("players : " + activeRooms.get(_roomName).playerCount);
    _socket.emit('roomJoinAccepted', {
        room: _roomName
    });
    return true;

}


function leaveRoom(_socket) {
    //if socket clientName not registered
    console.log("leaveRoom >> Attempting to leave room");
    if( _socket.clientName == undefined){
        console.log("ERROR !! : leaveRoom > socket clientName not defined");
        return true;
    }
    //if socket object contains clientName but that isn't an activeclient name
    else if( activeClients.get(_socket.clientName) == undefined)
    {
        console.log("leaveRoom > no such client, ERROR, This should never be printed");
        return false;
    }
    console.log(" # activeClient "+_socket.clientName+" is now calling its fxn : leaveCurrentRoom")
    //leave current room
    activeClients.get(_socket.clientName).leaveCurrentRoom();
    return true;
}


const getRand = function(low, high){
  return Math.floor((Math.random() * high) + low);
}