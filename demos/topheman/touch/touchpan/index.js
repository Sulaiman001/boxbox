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
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{
        scale:30, 
        preventScroll:true, 
        disableTouchEvents : false,
        disableKeyEvents : true, 
        disableMouseEvents : true, 
        debugDraw:false,
        boundaries : boundaries
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
      x: 15,
      y: 14,
      width: 30,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');
    
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
    
    center.touchDraggable({
        start : function(e, touchDraggableInfos){
            console.info('red start callback',e, touchDraggableInfos);
        },
        drag : function(e, touchDraggableInfos){
//            console.info('red drag callback',e, touchDraggableInfos);
        },
        stop : function(e, touchDraggableInfos){
            console.info('red stop callback',e, touchDraggableInfos);
        },
        touchadd : function(e, touchDraggableInfos,touchesCount){
            console.info('red touchadd callback',e, touchDraggableInfos,touchesCount);
        },
        touchremove : function(e, touchDraggableInfos,touchesCount){
            console.info('red touchremove callback',e, touchDraggableInfos,touchesCount);
        }
    });
    left.touchDraggable({
        type: 'eventDrag',
        start : function(e, touchDraggableInfos){
            console.info('eventdrag start callback',e,touchDraggableInfos);
        },
        drag : function(e, touchDraggableInfos){
//            console.info('eventdrag drag callback',e, touchDraggableInfos);
        },
        stop : function(e, touchDraggableInfos){
            console.info('eventdrag stop callback',e, touchDraggableInfos);
        },
        touchadd : function(e, touchDraggableInfos,touchesCount){
            console.info('eventdrag touchadd callback',e,touchDraggableInfos,touchesCount);
        },
        touchremove : function(e, touchDraggableInfos,touchesCount){
            console.info('eventdrag touchremove callback',e,touchDraggableInfos,touchesCount);
        }
    });
    right.touchDraggable({
        start : function(e, touchDraggableInfos){
            console.info('gray start callback',e, touchDraggableInfos);
        },
        drag : function(e, touchDraggableInfos){
//            console.info('gray drag callback',e, touchDraggableInfos);
        },
        stop : function(e, touchDraggableInfos){
            console.info('gray stop callback',e, touchDraggableInfos);
        },
        touchadd : function(e, touchDraggableInfos,touchesCount){
            console.info('gray touchadd callback',e, touchDraggableInfos,touchesCount);
        },
        touchremove : function(e, touchDraggableInfos,touchesCount){
            console.info('gray touchremove callback',e, touchDraggableInfos,touchesCount);
        }
    });
    
    myWorld.touchPan({
        allowPinch : true,
        start: function(e, viewportInfos){
            console.info('touchPan start callback',e,viewportInfos);
        },
        drag: function(e, viewportInfos){
            console.info('touchPan drag callback');
        },
        stop: function(e, viewportInfos){
            console.info('touchPan stop callback',e,viewportInfos);
        },
        startPinching: function(e, viewportInfos){
            console.info('touchPan startPinching callback',e,viewportInfos);
        },
        stopPinching: function(e, viewportInfos){
            console.info('touchPan stopPinching callback',e,viewportInfos);
        }
    });
}   

init();

})();