function init(){
     
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30});

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
      x: 5,
      y: 1,
      radius:1,
      shape:'circle'
    });
    circle.name('circle');
    
    circle2 = myWorld.createEntity({
      color: "darkred",
      x: 6,
      y: 4,
      radius:1,
      shape:'circle'
    });
    circle2.name('circle2');
    
    //one line , it's draggable !
    player.draggable();
    
    //draggable with callbacks
    enemy.draggable({
        start: function(e,pos){
            this.color('blue');
            player.color('red');
            console.info('startdrag callback','event',e.type,'world pos',pos);
        },
        drag: function(e,pos){
            this.color('#'+Math.floor(Math.random()*16777215).toString(16));//wath your eyes 
            console.info('drag callback','event',e.type,'world pos',pos);
        },
        stop: function(e,pos){
            this.color('blue');
            player.color('gray');
            console.info('stopdrag callback','event',e.type,'world pos',pos);
        }
    });
    
    //draggable (without moving) with callbacks
    circle2.draggable({
        type : 'eventDrag',
        start: function(e,pos){
            this.color('blue');
            console.info('startdrag callback','event',e.type,'world pos',pos);
        },
        drag: function(e,pos){
            console.info('drag callback','event',e.type,'world pos',pos);
        },
        stop: function(e,pos){
            this.color('darkred');
            console.info('stopdrag callback','event',e.type,'world pos',pos);
        }
    });
    
    circle.draggable('disable');

}   

window.addEventListener('load',init);