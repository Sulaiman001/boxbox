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
      x: 13,
      y: 10,
      width: 12,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');
    
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
    
    myWorld.onMousemove(function(e,pos){
        console.info('world - move',e,pos);
    });

}   

window.addEventListener('load',init);