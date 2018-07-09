/*
    Act as an interface between client and server
    responsible for detecting clicks, and other user action 
*/
var Client = {
    socket: io.connect()
};

Client.launchGame = function()
{
    //signals server to begin game
    Client.socket.emit("startGame");
}