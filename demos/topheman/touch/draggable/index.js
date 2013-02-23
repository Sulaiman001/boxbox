(function(){

function init(){
    
    initViewport();
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30, preventScroll:false, disableTouchEvents : false, disableKeyEvents : true, disableMouseEvents : true, debugDraw:true});
    
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
    
    center.touchDraggable({
        start : function(e, touchDraggableInfos, touchIndex){
            console.info('start callback',e, touchDraggableInfos, touchIndex);
        },
        drag : function(e, touchDraggableInfos, touchIndex){
            console.info('drag callback',e, (function(){var r = ''; for(var i=0;i<touchDraggableInfos.length;i++){ r += touchDraggableInfos[i].touchIdentifier } return r; })(), touchIndex);
        },
        stop : function(e, touchDraggableInfos, touchIndex){
            console.info('stop callback',e, touchDraggableInfos, touchIndex);
        },
        touchadd : function(e, touchDraggableInfos, touchIndex){
            console.info('touchadd callback',e, touchDraggableInfos, touchIndex);
        },
        touchremove : function(e, touchDraggableInfos, touchIndex){
            console.info('touchremove callback',e, touchDraggableInfos, touchIndex);
        }
    });
    left.touchDraggable();
    right.touchDraggable();

}   

init();

})();