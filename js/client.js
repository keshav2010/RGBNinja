/*
    Act as an interface between client and server
    responsible for detecting clicks, and other user action 
*/
var Client = {
    socket: io.connect()
};

Client.launchGame = function(targetRGB)
{
    //signals server to begin game
    Client.socket.emit("requestGameStart", targetRGB);
}
Client.sendUserInput = function( inputObject )
{
    Client.socket.emit('userInput', inputObject);
}