(function(){

function init(){
    
    initViewport();
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{
        scale:30,
        preventScroll:false,
        disableTouchEvents : false,
        disableKeyEvents : true,
        disableMouseEvents : false,
        debugDraw:false,
        restrictStage : {
            top : -2,
            left : -2,
            right: 34,
            bottom: 18
        }
    });
    
    //create entities
    left = myWorld.createEntity({
      color: "orange",
      x: 4,
      y: 2,
      width: 5,
      height: 6
    });
    left.name('left');

    right = myWorld.createEntity({
        x: 20,
        y: 0,
      width: 5,
      height: 6
    });
    right.name('right');
    
    center = myWorld.createEntity({
        color : 'red',
        x: 12,
        y: 0,
        width: 5,
        density: 10,
        height: 7
    });
    center.name('center');

    ground = myWorld.createEntity({
      color: "green",
      x: 17,
      y: 14,
      width: 30,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');

    ground2 = myWorld.createEntity({
      color: "green",
      x: 12,
      y: 16,
      width: 5,
      height: 0.5,
      type: "static"
    });
    ground2.name('ground2');
    
    points = [
          {x:-5,y:0},
          {x:0,y:-2},
          {x:5,y:0},
          {x:5,y:5},
          {x:0,y:5}
      ];
    
    polygon = myWorld.createEntity({
      shape : 'polygon',
      x: 24,
      y: 0,
      points: points
    });
    polygon.name('polygon');
    
    polygon.mouseDraggable();
    right.mouseDraggable();
    
    myWorld.mousePan();
    myWorld.mousewheelZoom({step:0.5});

}   

init();

})();