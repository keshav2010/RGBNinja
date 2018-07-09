/*
    Act as an interface between client and server
    responsible for detecting clicks, and other user action 
*/
var Client = {
    socket: io.connect()
};