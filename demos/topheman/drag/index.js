(function(){

function init(){
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30});

    //create entities
    player = myWorld.createEntity();
    player.name('player');
    
    enemy = myWorld.createEntity({
        color : 'orange',
        x: 16,
        y: 2,
        width: 3,
        density: 10,
        height: 4
    });
    enemy.name('enemy');

    ground = myWorld.createEntity({
      color: "green",
      x: 10,
      y: 13,
      width: 20,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');

    sky = myWorld.createEntity({
      color: "green",
      x: 10,
      y: 0,
      width: 20,
      height: 0.5,
      type: "static"
    });
    sky.name('sky');

    wallLeft = myWorld.createEntity({
      color: "green",
      x: 0,
      y: 6,
      width: 0.5,
      height: 15,
      type: "static"
    });
    sky.name('wallLeft');

    wallRight = myWorld.createEntity({
      color: "green",
      x: 20,
      y: 6,
      width: 0.5,
      height: 15,
      type: "static"
    });
    sky.name('wallRight');

    sky = myWorld.createEntity({
      color: "green",
      x: 10,
      y: 0,
      width: 20,
      height: 0.5,
      type: "static"
    });
    sky.name('sky');
    
    circle = myWorld.createEntity({
      color: "blue",
      x: 6,
      y: 4,
      radius:1,
      shape:'circle'
    });
    circle.name('circle');

    //one line , it's draggable !
    player.draggable();
    enemy.draggable({
        start: function(e,pos){
            this.color('blue');
            player.color('red');
            console.info('startdrag callback','event',e,'world pos',pos);
        },
        drag: function(e,pos){
            this.color('#'+Math.floor(Math.random()*16777215).toString(16));//wath your eyes 
            console.info('drag callback','event',e,'world pos',pos);
        },
        stop: function(e,pos){
            this.color('blue');
            player.color('gray');
            console.info('stopdrag callback','event',e,'world pos',pos);
        }
    });

        //if you wan't to disable or enable the drag :
//    player.draggable('disable');

}   

init();

})();
