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
var btnRed,btnGreen, btnBlue;
var redKey, blueKey, greenKey;
var gameReference;
class Game extends Phaser.State
{
    init( targetRGBValue )
    {
        gameReference = this;
        this.gfx = this.game.add.graphics(0, 0); //responsible for rendering on each frame
        this.roomGfx = this.game.add.graphics(0,0); //renders only once, not on each frame
        redKey = game.input.keyboard.addKey(Phaser.Keyboard.R);
        greenKey = game.input.keyboard.addKey(Phaser.Keyboard.G);
        blueKey = game.input.keyboard.addKey(Phaser.Keyboard.B);
        this.userCircle = {
            posx : VIEW_WIDTH/2 - VIEW_WIDTH/4,
            posy : VIEW_HEIGHT - 200,
            displayColor : 0x000000,
            updateColor : function(data){
                this.displayColor = data;
            },
            render : function(g){
                g.beginFill( this.displayColor, 1);
                g.drawCircle(this.posx, this.posy, 200);
                g.endFill();
            }
        };
        this.opponentCircle = {
            posx : VIEW_WIDTH/2 + VIEW_WIDTH/4,
            posy : VIEW_HEIGHT - 200,
            displayColor : 0x000000,
            updateColor : function(data){
                this.displayColor = data;
            },
            render : function(g){
                g.beginFill( this.displayColor, 1);
                g.drawCircle(this.posx, this.posy, 200);
                g.endFill();
            }
        };
        
        this.sliderBar = 
        {
            posx : VIEW_WIDTH/2 - VIEW_WIDTH/4,
            posy : VIEW_HEIGHT - 600,
            fillColor : 0x000000,
            noFillColor : 0x000000,
            MaxValue : 255, //required by getSliderValue() fxn
            sliderWidth : 200,
            sliderReference : this,
            /*
                a basic function that returns value between [0, sliderEnd] inclusive
                and takes variations in sliderWidth into account. The function here only
                returns whole numbers.
            */
            getSliderValue : function(){
                return sliderReference.MaxValue * (this.knob.posx - sliderReference.posx) / ( sliderReference.sliderWidth);
            },
            setPos : function(_x, _y){
                this.knob.setPos( _x, _y);
            },
            setSize : function( _size){
                this.sliderWidth = _size;
            }
        };
        this.sliderBar.knob = {
            /*
                Constraints on knob.posx : 
                slider.posx <= knob.posx <= slider.posx + sliderWidth

                these constraints are important for getSliderValue() method to work correctly
            */
            posx: gameReference.sliderBar.posx,
            posy: gameReference.sliderBar.posy,
            moveKnob : function( _delta)
            {
                //if change is negative, ignore
                if( _delta < 0)
                    return;
                //if change exceeds out of the limit, set knob.posX to max value
                if( _delta + this.posx > gameReference.sliderBar.posx + gameReference.sliderBar.sliderWidth){
                    this.posx = gameReference.sliderBar.posx + gameReference.sliderBar.sliderWidth;
                    return;
                }
                //else add change into knob.posX if within constraints limit
                this.posx += _delta;
            },
            setPos : function( _x, _y){
                this.posx = _x;
                this.posy = _y;
            }
        };
        this.sliderBar.render = function(g){
            
            //render fill rect
            g.beginFill(this.fillColor, 1);
            g.drawRoundedRect(gameReference.sliderBar.posx - gameReference.sliderBar.sliderWidth, gameReference.sliderBar.posy, 
                              gameReference.sliderBar.getSliderValue + gameReference.sliderBar.posx, 50, 1);
            g.endFill();
            
            //render base rect
            g.beginFill(this.noFillColor, 1);
            g.drawRoundedRect(gameReference.sliderBar.posx - gameReference.sliderBar.sliderWidth, gameReference.sliderBar.posy, 
                                gameReference.sliderBar.sliderWidth, 50, 1);
            g.endFill();
            
            //render knob
            g.beginFill(this.fillColor, 1);
            g.drawRoundedRect(gameReference.sliderBar.knob.posx, gameReference.sliderBar.knob.posy, 10, 50, 1);
            g.endFill();
            
            
        };
        //end of sliderbar
    }
    preload()
    {
        console.log("game>preload");
        btnRed = this.game.add.button();
        this.game.load.bitmapFont('userNameFont', '/assets/fonts/pixograd.png', '/assets/fonts/pixograd.fnt');
        this.game.load.bitmapFont('opponentNameFont', '/assets/fonts/pixograd.png', '/assets/fonts/pixograd.fnt');
    }
    create()
    {
        console.log("game>create");
        this.game.stage.backgroundColor = "rgb(210,210,210)";
        
        console.log("color : "+ fullColorHex(target.r, target.g, target.b));
        
        //draw a line for seperation
        this.roomGfx.lineStyle(20, 0x022551);
        this.roomGfx.moveTo(VIEW_WIDTH/2,0);
        this.roomGfx.lineTo(VIEW_WIDTH/2, VIEW_HEIGHT);
        
        //draw circle to display the target rgb to acheive 
        this.roomGfx.beginFill(fullColorHex(target.r, target.b, target.g), 1);
        this.roomGfx.drawCircle(VIEW_WIDTH/2,125, 200);
        this.roomGfx.endFill();
        
        console.log("game>create>socet id : "+Client.socket.id);
        this.sliderBar.setPos(50, 200);
        this.sliderBar.setSize(250);
        
        this.userNameFont = this.game.add.bitmapText(this.game.world.centerX - 200, 25, 'userNameFont', 'You', 32);
        this.opponentNameFont = this.game.add.bitmapText(this.game.world.centerX + 200, 25, 'opponentNameFont', 'Opponent', 32);
        
        Client.socket.on('opponentAction', function(data){
            //convert data to hexadecimal 
            var col = fullColorHex(data[0], data[1], data[2]);
            gameReference.opponentCircle.updateColor(col);
        });
        Client.socket.on('clientAction', function(data){
            var col = fullColorHex(data[0], data[1], data[2]);
            gameReference.userCircle.updateColor(col); 
        });
        
    }
    update()
    {
        if(redKey.isDown){
            console.log('red key pressed');
            Client.sendUserInput('input', 'red');
            this.sliderBar.knob.moveKnob(1);
        }
        if(greenKey.isDown){
            console.log('green key pressed');
            Client.sendUserInput('input','green');
        }
        if(blueKey.isDown){
            console.log('blue key pressed');
            Client.sendUserInput('input','blue');
        }
        this.gfx.clear();
        this.userCircle.render(this.gfx);
        this.opponentCircle.render(this.gfx);
        this.sliderBar.render(this.gfx);
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