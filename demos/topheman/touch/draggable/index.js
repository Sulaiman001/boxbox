(function(){

function init(){
    
    initViewport();
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30, preventScroll:false, disableTouchEvents : false, disableKeyEvents : true, disableMouseEvents : true, debugDraw:true});
    
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
    
    center.touchDraggable({
        start : function(e, touchDraggableInfos){
            console.info('start callback',e, touchDraggableInfos);
        },
        drag : function(e, touchDraggableInfos){
//            console.info('drag callback',e, touchDraggableInfos);
        },
        stop : function(e, touchDraggableInfos){
            console.info('stop callback',e, touchDraggableInfos);
        },
        touchadd : function(e, touchDraggableInfos,touchesCount){
            console.info('touchadd callback',e, touchDraggableInfos,touchesCount);
        },
        touchremove : function(e, touchDraggableInfos,touchesCount){
            console.info('touchremove callback',e, touchDraggableInfos,touchesCount);
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
        maxTouches : 2
    });

}   

init();

})();