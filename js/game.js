//const socket = io();
//NOTE : this is a client-side file, do not use require() as it will not work, it is meant to be for server side only and
//in order to use it for browser side, we need to use browserify or other third party tools, however try to write entire code in 1 single page
//for avoiding learning so many libraries
//Use : http://kvazars.com/littera/ to generate bitmap font's xml file (.fnt / xml)
var socket = io();
var game = new Phaser.Game(1024, 768, Phaser.CANVAS, '',
{
  init: function(){
    console.log("game>init");
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.maxWidth = 1024;
    this.scale.maxHeight = 768;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    this.scale.updateLayout();
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
    socket.on('welcomeMessage', ()=>{ alert('lol')});
  }
});//end of game object


class Game extends Phaser.State
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

const getRand = function(low, high){
  return Math.floor((Math.random() * high) + low);
}

/*
game.state.add('Game', Game);
game.state.add('GameOver', GameOver);

game.state.start('Game');
*/
