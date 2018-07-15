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
Client.sendUserInput = function(userEmitMessage, data)
{
    Client.socket.emit(userEmitMessage, data);
}
Client.informOpponents= function()
{
    Client.socket.emit('dataBroadcastRequest');
}