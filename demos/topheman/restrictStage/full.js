(function(){

function init(){
    
    initViewport();
    
    var borders = {
        left : -2,
        right : 45,
        top : -2,
        bottom : 40
    };
    
    var restrict = {};
    restrict.left = borders.left;
    restrict.right = borders.right;
    restrict.top = borders.top;
    restrict.bottom = borders.bottom;
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{
        scale:30,
        preventScroll:false,
        disableTouchEvents : false,
        disableKeyEvents : true,
        disableMouseEvents : false,
        debugDraw:false,
        restrictStage : restrict
    });
    
    logClick = function(e,mouseInfos){
        console.info(e,mouseInfos);
    };
    
    //create entities
    left = myWorld.createEntity({
      color: "orange",
      x: 4,
      y: 2,
      width: 5,
      height: 6
    });
    left.name('left');
    
    left.onMousedown(logClick);

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
    
    wallLeft = myWorld.createEntity({
      color: "green",
      x: borders.left,
      y: 16,
      width: 1,
      height: 16,
      type: "static"
    });
    wallLeft.name('wallLeft');
    
    wallRight = myWorld.createEntity({
      color: "green",
      x: borders.right,
      y: 16,
      width: 1,
      height: 16,
      type: "static"
    });
    wallRight.name('wallRight');
    
    wallTop = myWorld.createEntity({
      color: "green",
      x: 18,
      y: borders.top,
      width: 16,
      height: 1,
      type: "static"
    });
    wallRight.name('wallTop');
    
    wallBottom = myWorld.createEntity({
      color: "green",
      x: 18,
      y: borders.bottom,
      width: 16,
      height: 1,
      type: "static"
    });
    wallBottom.name('wallBottom');
    
    myWorld.mousePan({
        drag: function(e, viewportInfos){
            console.info('pan - viewport x/y',viewportInfos.viewport.x,viewportInfos.viewport.y,viewportInfos.viewport.y+viewportInfos.viewport.height);
        }
    });
    myWorld.mousewheelZoom({step:0.5});

}   

init();

})();