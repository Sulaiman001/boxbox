(function(){

function init(){
    
    initViewport();
    
//    var borders = {
//        left : -2,
//        right : 45,
//        top : -2,
//        bottom : 40
//    };
    
    var borders = {
        left : 2,
        right : 30,
        top : 2,
        bottom : 25
    };
    
    var boundaries = {};
    boundaries.left = borders.left;
    boundaries.right = borders.right;
    boundaries.top = borders.top;
    boundaries.bottom = borders.bottom;
    
    centerOfBorders = {
        x : (borders.right - borders.left) /2 + borders.left,
        y : (borders.bottom - borders.top) /2 + borders.top
    };
    
//    console.info('centerOfBorders',centerOfBorders);
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{
        scale:30,
        preventScroll:false,
        disableTouchEvents : false,
        disableKeyEvents : true,
        disableMouseEvents : false,
        debugDraw:false,
        boundaries : boundaries
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
    
    polygon.mouseDraggable({
//        drag: function(e,i){console.info(i);}
    });
    right.mouseDraggable();
    
    wallLeft = myWorld.createEntity({
      color: "blue",
      x: borders.left,
      y: 16,
      width: 1,
      height: 16,
      type: "static",
      active: false
    });
    wallLeft.name('wallLeft');
    
    wallRight = myWorld.createEntity({
      color: "blue",
      x: borders.right,
      y: 16,
      width: 1,
      height: 16,
      type: "static",
      active: false
    });
    wallRight.name('wallRight');
    
    wallTop = myWorld.createEntity({
      color: "blue",
      x: 18,
      y: borders.top,
      width: 16,
      height: 1,
      type: "static",
      active: false
    });
    wallRight.name('wallTop');
    
    wallBottom = myWorld.createEntity({
      color: "blue",
      x: 18,
      y: borders.bottom,
      width: 16,
      height: 1,
      type: "static",
      active: false
    });
    wallBottom.name('wallBottom');
    
    point = myWorld.createEntity({
        shape : 'circle',
        radius : 1,
        color : 'black',
        x: centerOfBorders.x,
        y: centerOfBorders.y,
        width: 5,
        density: 10,
        height: 7,
        type: "static",
        active: false
    });
    point.name('point');
    
    myWorld.mousePan({
        start: function(e, viewportInfos){
            point.color('pink');
        },
        stop: function(e, viewportInfos){
            point.color('black');
        }
//        drag: function(e, viewportInfos){
//            console.info('pan - viewport x/y',viewportInfos.viewport.x,viewportInfos.viewport.y,viewportInfos.viewport.y+viewportInfos.viewport.height);
//        }
    });
    myWorld.mousewheelZoom({step:0.5});

}   

init();

})();