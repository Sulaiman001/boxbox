(function(){

function init(){
    
    initViewport();
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:60, preventScroll:false, disableTouchEvents : false, disableKeyEvents : true, disableMouseEvents : true, debugDraw:true});
    
    //create entities
    left = myWorld.createEntity({
      color: "orange",
      x: 2,
      y: 2,
      width: 3,
      height: 4
    });
    left.name('left');

    right = myWorld.createEntity({
        x: 10,
        y: 0,
      width: 4,
      height: 4
    });
    right.name('right');
    
    center = myWorld.createEntity({
        color : 'red',
        x: 6,
        y: 0,
        width: 3,
        density: 10,
        height: 4
    });
    center.name('center');

    ground = myWorld.createEntity({
      color: "green",
      x: 15,
      y: 16,
      width: 30,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');
    
    center.touchDraggable();
    left.touchDraggable();
    right.touchDraggable();

}   

init();

})();