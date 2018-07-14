var socketio = require('socket.io');
var io;

var activeRooms = {}; //maps room name to roomObject 
var activeClients= {};//maps username to user object

//as value since socketio probably have build in method/properties to check for that

var usersMap = {}; //maps socketid to user object
/*
constructor method :
*/
function GameRoom(_roomName)
{
    this.roomName = _roomName;
    this.RGBValue = [];
    this.connectedUsers = {}; //map username to User object
    this.playerCount = 0;
    
    //this method should never be called directly
    this.addNewUser = function( _userObject){
        user = _userObject;
        if(this.playerCount == 2)
        {
            return false;
        }
        
        this.connectedUsers[ user.userName] = user;
        this.playerCount = this.connectedUsers.length;
        return true;
    }
    //this method should never be called directly
    this.removeUser = function( _userName){
        if(this.connectedUsers[ _userName] == undefined || this.connectedUsers.length == 0)
            return false;
        delete this.connectedUsers[ _userName]; //removes only the property, doesn't free up memory
        this.playerCount = this.connectedUsers.length;
        return true;
    }
    
    this.getUser = function( _userName){
        return this.connectedUsers[ _userName];
    }
    
    return this;
}
function User(_userName, _socket)
{
    this.serverSideSocket = _socket;
    this.userName = _userName;
    this.currentRoom = undefined;
    
    this.addToRoom = function( _roomObject){ 
        this.leaveCurrentRoom();
        this.currentRoom = _roomObject;
        this.currentRoom.addNewUser( this);
        this.serverSideSocket.join( _roomObject.roomName);
    };
    this.leaveCurrentRoom = function(){
        
        if(this.currentRoom == undefined)
            return;
        
        this.currentRoom.removeUser( _userName);
        
        this.serverSideSocket.leave( this.currentRoom.roomName);
        
        //clear room if no user in it
        if( activeRooms[ this.currentRoom.roomName].playerCount == 0){
            delete activeRooms[ _roomName];
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
                
                activeClients[nicknameData.name] = new User( nicknameData.name, socket);
                
                socket.emit('nicknameAccepted');
            } else {
                socket.emit('nicknameRejected');
            }
        });

        //creating new room if it doesn't exist
        socket.on("roomCreateRequest", function (requestData) {
            //if room name is available for use
            if (roomNameAvailable(requestData.roomName)) {
                socket.emit("roomCreateAccepted");
                activeRooms[requestData.roomName] = new GameRoom( requestData.roomName);
                activeClients[requestData.userName].addToRoom( activeRooms[requestData.roomName]);
            } 
            else socket.emit('roomCreateRejected');
        });

        socket.on('startGame', () => {
            //starts the game by sending data to all clients connected
            //as well as generating target rgb which is same for both clients
            io.to(roomData.roomName).emit('startGameState');
        })

        // join room if it exist
        socket.on('roomJoinRequest', function (requestData) {
            var username = requestData.userName;
            var roomname = requestData.roomName;
            joinRoom(username, roomname, socket);
        });

        socket.on('disconnect', function () {
            console.log("disconnect socket : " + socket.id);
            leaveRoom(socket);
            delete activeClients[socket.clientName];
        });
    });
};

//helper method : returns true if _name is not used otherwise false
function clientNameAvailable(_name) {
    if(activeClients[_name] == undefined)
        return true;
    return false;
}
//helper method : returns true if roomName is available to use for creating new room
function roomNameAvailable(_roomName) {
    if (activeRooms[_roomName] == undefined)
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
    if(activeRooms[_roomName] == undefined)
        _socket.emit('roomJoinRejected', "Sorry, No such room exist.");
    
    //else if room exist and is full
    else if (activeRooms[_roomName].playerCount > 1)
        _socket.emit('roomJoinRejected', "Sorry, Room is already full.");
    
    //otherwise join room
    else {
        //makes sure given user leaves any room to which it belongs 
        //before joining a new room
        leaveRoom(_socket);

        //user joins the room
        activeClients[_userName].addToRoom( activeRooms[ _roomName]);

        _socket.emit('roomJoinAccepted', {
            room: _roomName
        });
    }
}


function leaveRoom(_socket) {
    if( _socket.clientName == undefined){
        console.log("leaveRoom > socket clientName not defined");
        return;
    }
    else if( activeClients[_socket.clientName] == undefined)
        {
            console.log("leaveRoom > no such client, ERROR, This should never be printed");
            return;
        }
    activeClients[ _socket.clientName].leaveCurrentRoom();
}
const getRand = function(low, high){
  return Math.floor((Math.random() * high) + low);
}