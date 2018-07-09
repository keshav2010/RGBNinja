/*
NOTE : this is a client-side file, do not use require() as it will not work, it is meant to be for server side only and
in order to use it for browser side, we need to use browserify or other third party tools, however try to write entire code in 1 single page
for avoiding learning so many libraries
Use : http://kvazars.com/littera/ to generate bitmap font's xml file (.fnt / xml)
*/

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 768;
var game = new Phaser.Game(VIEW_WIDTH, VIEW_HEIGHT, Phaser.CANVAS, '',
{
  init: function(){
    console.log("game>init for socket "+Client.socket.id);
    //basic configuration
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.maxWidth = VIEW_WIDTH;
    this.scale.maxHeight = VIEW_HEIGHT;
    this.scale.pageAlignHorizontally = true;    
    this.scale.pageAlignVertically = true;
    this.scale.updateLayout();
    this.stage.disableVisibilityChange = true;
  },
  preload : function()
  {
    alert("alert works"); 
    console.log('game>preload');
    this.state.add('Game', Game);
    this.state.add('GameOver', GameOver);
    this.game.load.bitmapFont('loginTitle', '/assets/fonts/pixograd.png', '/assets/fonts/pixograd.fnt');
  },    
  create : function()
  {
    console.log('game>create');
    
    this.game.stage.backgroundColor = "rgb("+getRand(50, 150)+","+getRand(0, 60)+","+getRand(100, 200)+")";
    this.loginText = game.add.bitmapText(this.game.world.centerX - 200, 25, 'loginTitle', 'RGB\nNinja', 72);
    this.loginText.text = 'rgb ninja';
    console.log("gamejs > game > create > socket is : "+Client.socket.id);
    //error ; this is never triggered, socket.on() doesn't work
    Client.socket.on("startGameState", ()=>{
        game.state.start('Game');
    });
  }
});


//Main Level goes here, where actual gameplay takes place
class Game extends Phaser.State
{
    preload()
    {
        console.log("game>preload");        
        this.centerRGBDisplay = {
            displayWidth : 100, 
            displayHeight : 100, 
            posX : (VIEW_WIDTH/2) - (displayWidth/2),
            posY : 100
        };

    }
    create()
    {
        console.log("game>create");
        this.game.stage.backgroundColor = "rgb(0, 0, 0)";
        console.log("game>create>socet id : "+Client.socket.id);
    }
    update()
    {
        console.log("game>update");
    }
}

//the final screen
class GameOver extends Phaser.State
{
  preload()
  {
      
  }
  create()
  {

  }
  update()
  {

  }
}


//helper methods
const getRand = function(low, high){
  return Math.floor((Math.random() * high) + low);
}