/*
NOTE : this is a client-side file, do not use require() as it will not work, it is meant to be for server side only and
in order to use it for browser side, we need to use browserify or other third party tools, however try to write entire code in 1 single page
for avoiding learning so many libraries
Use : http://kvazars.com/littera/ to generate bitmap font's xml file (.fnt / xml)
*/

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 768;
var target;
var game = new Phaser.Game(VIEW_WIDTH, VIEW_HEIGHT, Phaser.CANVAS, '', {
    init: function () {
        console.log("game>init for socket " + Client.socket.id);
        //basic configuration
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.maxWidth = VIEW_WIDTH;
        this.scale.maxHeight = VIEW_HEIGHT;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.updateLayout();
        this.stage.disableVisibilityChange = true;
    },
    preload: function () {
        console.log('game>preload');
        this.state.add('Game', Game);
        this.state.add('GameOver', GameOver);
        this.game.load.bitmapFont('loginTitle', '/assets/fonts/pixograd.png', '/assets/fonts/pixograd.fnt');
    },
    create: function () {
        console.log('game>create');

        this.game.stage.backgroundColor = "rgb(" + getRand(50, 150) + "," + getRand(0, 60) + "," + getRand(100, 200) + ")";
        this.loginText = game.add.bitmapText(this.game.world.centerX - 200, 25, 'loginTitle', 'RGB\nNinja', 72);
        this.loginText.text = 'rgb ninja';
        console.log("gamejs > game > create > socket is : " + Client.socket.id);
        //error ; this is never triggered, socket.on() doesn't work
        Client.socket.on("startGame", function (targetRGBValue) {
            target = targetRGBValue;
            game.state.start('Game');
        });
    }
});


//Main Level goes here, where actual gameplay takes place
var targetRGBDisplay;

var redKey, blueKey, greenKey;

var gameReference;
class Game extends Phaser.State {
    init(targetRGBValue) {
        gameReference = this;
        
        this.game.input.onHold.add(this.checkHold, this);
        
        this.gfx = this.game.add.graphics(0, 0); //responsible for rendering on each frame
        this.roomGfx = this.game.add.graphics(0, 0); //renders only once, not on each frame
        redKey = game.input.keyboard.addKey(Phaser.Keyboard.R);
        greenKey = game.input.keyboard.addKey(Phaser.Keyboard.G);
        blueKey = game.input.keyboard.addKey(Phaser.Keyboard.B);
        this.userCircle = {
            posx: VIEW_WIDTH / 2 - VIEW_WIDTH / 4,
            posy: VIEW_HEIGHT - 200,
            displayColor: 0x000000,
            updateColor: function (data) {
                this.displayColor = data;
            },
            render: function (g) {
                g.beginFill(this.displayColor, 1);
                g.drawCircle(this.posx, this.posy, 200);
                g.endFill();
            }
        };
        this.opponentCircle = {
            posx: VIEW_WIDTH / 2 + VIEW_WIDTH / 4,
            posy: VIEW_HEIGHT - 200,
            displayColor: 0x000000,
            updateColor: function (data) {
                this.displayColor = data;
            },
            render: function (g) {
                g.beginFill(this.displayColor, 1);
                g.drawCircle(this.posx, this.posy, 200);
                g.endFill();
            }
        };

        this.SliderBar = function (x, y, fc, nfc, w) {
            this.posx = x;
            this.posy = y;
            this.fillColor = fc;
            this.noFillColor = nfc;
            this.MaxValue = 255; //required by getSliderValue() fxn
            this.sliderWidth = w;
            this.sliderReference = this;
            this.knob = {};
        };
        this.SliderBar.knob = function (x, y) {
            this.posx = x;
            this.posy = y;
        }
        this.SliderBar.prototype.setColor = function (_fillCol, _noFillCol) {
            this.fillColor = _fillCol;
            this.noFillColor = _noFillCol;
        };
        this.SliderBar.prototype.getSliderValue = function () {
            return this.MaxValue * (this.knob.posx - this.posx) / (this.sliderWidth);
        };
        this.SliderBar.prototype.setPos = function (_x, _y) {
            this.posx = _x;
            this.posy = _y;
            this.knob.setPos(_x, _y);
        };
        this.SliderBar.prototype.setSize = function (_size) {
            this.sliderWidth = _size;
        };

        this.SliderBar.knob.prototype.moveKnob = function (_delta, slider) {
            //if change is negative, ignore
            if (_delta < 0)
                return;
            //if change exceeds out of the limit, set knob.posX to max value

            if (_delta + this.posx > slider.posx + slider.sliderWidth) {
                this.posx = slider.posx + slider.sliderWidth;
                return;
            }
            //else add change into knob.posX if within constraints limit
            this.posx += _delta;
        };

        this.SliderBar.knob.prototype.setPos = function (_x, _y) {
            this.posx = _x;
            this.posy = _y;
        };

        this.SliderBar.prototype.render = function (g) {

            //render base rect
            g.beginFill(this.noFillColor, 1);
            g.drawRect(this.posx, this.posy,
                this.sliderWidth, 50);
            g.endFill();

            //render fill rect
            g.beginFill(this.fillColor, 1);
            g.drawRect(this.posx, this.posy,
                this.knob.posx - this.posx, 50);
            g.endFill();

            //render knob
            g.beginFill(0xFFFFFF, 1);
            g.drawRoundedRect(this.knob.posx - 5, this.knob.posy, 10, 50, 4);
            g.endFill();
        };
        //end of sliderbar
    } //END OF INIT()
    preload() {
        console.log("game>preload");
        this.game.load.bitmapFont('userNameFont', '/assets/fonts/pixograd.png', '/assets/fonts/pixograd.fnt');
        this.game.load.bitmapFont('opponentNameFont', '/assets/fonts/pixograd.png', '/assets/fonts/pixograd.fnt');
        
        var diff =500;
        this.redSlider = new this.SliderBar(VIEW_WIDTH / 2 - VIEW_WIDTH / 4 - 100, VIEW_HEIGHT - diff, 0xFF0000, 0x000000, 200);
        this.redSlider.knob = new this.SliderBar.knob(this.redSlider.posx, this.redSlider.posy);

        this.greenSlider = new this.SliderBar(VIEW_WIDTH / 2 - VIEW_WIDTH / 4 - 100, VIEW_HEIGHT - diff + 54, 0x008000, 0x000000, 200);
        this.greenSlider.knob = new this.SliderBar.knob(this.greenSlider.posx, this.greenSlider.posy);

        this.blueSlider = new this.SliderBar(VIEW_WIDTH / 2 - VIEW_WIDTH / 4 - 100, VIEW_HEIGHT - diff + 108, 0x0000FF, 0x000000, 200);
        this.blueSlider.knob = new this.SliderBar.knob(this.blueSlider.posx, this.blueSlider.posy);
    }
    create() {
        console.log("game>create");
        this.game.stage.backgroundColor = "rgb(210,210,210)";

        console.log("color : " + fullColorHex(target.r, target.g, target.b));

        //draw a line for seperation
        this.roomGfx.lineStyle(20, 0x022551);
        this.roomGfx.moveTo(VIEW_WIDTH / 2, 0);
        this.roomGfx.lineTo(VIEW_WIDTH / 2, VIEW_HEIGHT);

        //draw circle to display the target rgb to acheive 
        this.roomGfx.beginFill(fullColorHex(target.r, target.b, target.g), 1);
        this.roomGfx.drawCircle(VIEW_WIDTH / 2, 125, 200);
        this.roomGfx.endFill();

        console.log("game>create>socet id : " + Client.socket.id);

        this.userNameFont = this.game.add.bitmapText(this.game.world.centerX - 200, 25, 'userNameFont', 'You', 32);
        this.opponentNameFont = this.game.add.bitmapText(this.game.world.centerX + 200, 25, 'opponentNameFont', 'Opponent', 32);


        Client.socket.on('opponentAction', function (data) {
            //convert data to hexadecimal 
            var col = fullColorHex(data[0], data[1], data[2]);
            gameReference.opponentCircle.updateColor(col);
        });
        Client.socket.on('clientAction', function (data) {
            var col = fullColorHex(data[0], data[1], data[2]);
            gameReference.userCircle.updateColor(col);
        });

    }
    checkHold(pointer){
        
        this.redSlider.knob.moveKnob(1, this.redSlider);
        
        if(pointer.clientX >= this.redSlider.posx && pointer.clientX <= this.redSlider.posx + this.redSlider.sliderWidth
              && pointer.clientY >= this.redSlider.posy && pointer.clientY <= this.redSlider.posy + 50)
        {
                this.redSlider.knob.moveKnob(1, this.redSlider);
        }
            
    }
    update() {
        if (redKey.isDown) {
            console.log('red key pressed');
            this.redSlider.knob.moveKnob(1, this.redSlider);
            if (this.redSlider.getSliderValue() < 250)
                Client.sendUserInput('input', 'red');
        }
        if (greenKey.isDown) {
            console.log('green key pressed');
            this.greenSlider.knob.moveKnob(1, this.greenSlider);
            if (this.greenSlider.getSliderValue() < 250)
                Client.sendUserInput('input', 'green');
        }
        if (blueKey.isDown) {
            console.log('blue key pressed');

            this.blueSlider.knob.moveKnob(1, this.blueSlider);
            if (this.blueSlider.getSliderValue() < 250)
                Client.sendUserInput('input', 'blue');
        }
    }
    
    render(){
        this.gfx.clear();
        this.userCircle.render(this.gfx);
        this.opponentCircle.render(this.gfx);

        //sliders
        this.redSlider.render(this.gfx);
        this.greenSlider.render(this.gfx);
        this.blueSlider.render(this.gfx);
        
        this.game.debug.pointer(this.game.input.mousePointer);
        this.game.debug.pointer(this.game.input.pointer1);
    }
}

//the final screen
class GameOver extends Phaser.State {
    preload() {

    }
    create() {

    }
    update() {

    }
}

//helper methods
const getRand = function (low, high) {
    return Math.floor((Math.random() * high) + low);
}
var rgbToHex = function (rgb) {
    var hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
}
var fullColorHex = function (r, g, b) {
    var red = rgbToHex(r);
    var green = rgbToHex(g);
    var blue = rgbToHex(b);
    return parseInt(red + green + blue, 16);
}
