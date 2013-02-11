(function(){

function init(){
    
    initViewport();
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30,touchEvents:true});
    
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
    
    //add events (simple on mouse down/up events)
    player.onMousedown(function(e, pos){
        this.color('red');
    });
    
    player.onMouseup(function(e, pos){
        this.color('blue');
    });
    
    enemy.draggable();

}   

init();

})();