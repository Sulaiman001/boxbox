(function(){

function init(){
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30});
    
    //create entities
    decor1 = myWorld.createEntity({
      color: "orange",
      x: 6,
      y: 4,
      width: 6,
      height: 4,
      type: "static"
    });
    decor1.name('decor1');

    player = myWorld.createEntity();
    player.name('player');
    
    enemy = myWorld.createEntity({
        color : 'red',
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
    
    enemy.draggable();
    
    enemy.onMousemove(function(){
       console.info('enemy mousemove'); 
    });
    
    myWorld.onMousedown(function(e,pos){
        console.info('world - mousedown',e,pos);
    });
    
    myWorld.onMouseup(function(e,pos){
        console.info('world - up',e,pos);
    });
    
    myWorld.onMousein(function(e,pos){
        console.info('world - in',e,pos);
    });
    
    myWorld.onMouseout(function(e,pos){
        console.info('world - out',e,pos);
    });

}

init();

})();