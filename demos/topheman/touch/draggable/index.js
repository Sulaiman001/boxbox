(function(){

function init(){
    
    initViewport();
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:60, preventScroll:false, disableTouchEvents : false, disableKeyEvents : true, disableMouseEvents : true, debugDraw:true});
    
    //create entities
    decor1 = myWorld.createEntity({
      color: "orange",
      x: 2,
      y: 2,
      width: 3,
      height: 4
    });
    decor1.name('decor1');

    player = myWorld.createEntity({
        x: 10,
        y: 0,
      width: 4,
      height: 4
    });
    player.name('player');
    
    enemy = myWorld.createEntity({
        color : 'red',
        x: 6,
        y: 0,
        width: 3,
        density: 10,
        height: 4
    });
    enemy.name('enemy');

    ground = myWorld.createEntity({
      color: "green",
      x: 15,
      y: 6,
      width: 30,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');
    
    enemy.touchDraggable();

}   

init();

})();