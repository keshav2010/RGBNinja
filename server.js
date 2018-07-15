const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const port=process.env.PORT||3000;
const gameServer = require('./gameServer.js');
const httpServer = http.createServer(app);

gameServer.listen(httpServer);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/', function(req, res){
  //serve the static html
  console.log("app get route triggered");
  res.sendFile(__dirname + '/index.html');
});


httpServer.listen(port, ()=>{
  console.log("started at port "+port);
});
