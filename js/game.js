/*
NOTE : this is a client-side file, do not use require() as it will not work, it is meant to be for server side only and
in order to use it for browser side, we need to use browserify or other third party tools, however try to write entire code in 1 single page
for avoiding learning so many libraries
Use : http://kvazars.com/littera/ to generate bitmap font's xml file (.fnt / xml)
*/

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 768;
var target;
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
    Client.socket.on("startGame", function(targetRGBValue){
        target = targetRGBValue;
        game.state.start('Game');              
    });
  }
});


//Main Level goes here, where actual gameplay takes place
var targetRGBDisplay;
class Game extends Phaser.State
{
    init( targetRGBValue )
    {
    }
    preload()
    {
        console.log("game>preload");
    }
    create()
    {
        console.log("game>create");
        this.game.stage.backgroundColor = "rgb(250,250,250)";
         var graphics = this.game.add.graphics(0, 0);

        console.log("color : "+ fullColorHex(target.r, target.g, target.b));
        
        //draw a line for seperation
        graphics.lineStyle(20, 0x33FF00);
        graphics.moveTo(VIEW_WIDTH/2,0);
        graphics.lineTo(VIEW_WIDTH/2, VIEW_HEIGHT);
        
        //draw circle to display the target rgb to acheive 
        graphics.beginFill(fullColorHex(target.r, target.b, target.g), 1);
        graphics.drawCircle(VIEW_WIDTH/2,125, 200);
        graphics.endFill();
        
        console.log("game>create>socet id : "+Client.socket.id);
        
    }
    update()
    {
        
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
var rgbToHex = function (rgb) { 
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
}
var fullColorHex = function(r,g,b) {   
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return parseInt(red+green+blue, 16);
}