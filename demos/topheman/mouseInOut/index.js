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
    wallLeft.name('wallLeft');

    wallRight = myWorld.createEntity({
      color: "green",
      x: 20,
      y: 6,
      width: 0.5,
      height: 15,
      type: "static"
    });
    wallRight.name('wallRight');

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
      y: 2,
      radius:1,
      shape:'circle'
    });
    circle2.name('circle2');
    
    shape1 = myWorld.createEntity({
      color: "orange",
      x: 6,
      y: 5,
      width: 1,
      height: 1,
      type: "static"
    });
    shape1.name('shape1');
    
    enemy.onMousein(function(e, pos){
        this.color('green');
    });
    
    enemy.onMouseout(function(e, pos){
        this.color('orange');
    });
    
    enemy.mouseDraggable();
    
    circle2.onMousein(function(e, pos){
        this.color('yellow');
    });
    
    circle2.onMouseout(function(e, pos){
        this.color('darkred');
    });
    
    walls = [ground,sky,wallLeft,wallRight];
    for(var i in walls){
        walls[i].onMousein(function(e,pos){
            changeWallsColor('red');
        });
    }
    for(var i in walls){
        walls[i].onMouseout(function(e,pos){
            changeWallsColor('green');
        });
    }
    
    function changeWallsColor(color){
        for(var i in walls){
            walls[i].color(color);
        }
    }
}

init();

})();