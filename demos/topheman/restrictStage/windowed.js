(function(){

function init(){
    
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
    
    left.mouseDraggable({
        start:function(e,mouseInfos){
            console.info('draggable-start',e,mouseInfos);
        },
        drag:function(e,mouseInfos){
            console.info('draggable-drag',e,mouseInfos);
        },
        stop:function(e,mouseInfos){
            console.info('draggable-stop',e,mouseInfos);
        }
    });
    center.mouseDraggable();
    
    myWorld.mousePan({
        start:function(e,viewportInfos){
            point.color('pink');
            console.info('pan-start',viewportInfos);
        },
        drag:function(e,viewportInfos){
            console.info('pan-drag',e,viewportInfos);
        },
        stop:function(e,viewportInfos){
            point.color('black');
            console.info('pan-stop',e,viewportInfos);
        },
        excludeEntityIds:[
            1
        ]
    });
    
    myWorld.mousewheelZoom({step:0.5});
    
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

}   

init();

})();