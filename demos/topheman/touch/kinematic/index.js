(function(){

function init(){
    
    initViewport();
    
    function callback (e,infos){
        console.info(infos);
    }
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{
        scale:30,
        preventScroll:false,
        disableTouchEvents : false,
        disableKeyEvents : true,
        disableMouseEvents : false,
        debugDraw:false,
        boundaries : {
            top : -2,
            left : -2,
            right: 34,
            bottom: 18
        }
    });
    
    wallConfig = {
        type: "static",
        borderWidth : 0,
        color : "black"
    };

    myWorld.createEntity( wallConfig, {
        name: "left",
        x: myWorld._ops.boundaries.left,
        y: (myWorld._ops.boundaries.bottom - myWorld._ops.boundaries.top) /2 + myWorld._ops.boundaries.top,
        width : 0.5,
        height : myWorld._ops.boundaries.bottom - myWorld._ops.boundaries.top
    });

    myWorld.createEntity( wallConfig, {
        name: "right",
        x: myWorld._ops.boundaries.right,
        y: (myWorld._ops.boundaries.bottom - myWorld._ops.boundaries.top) /2 + myWorld._ops.boundaries.top,
        width : 0.5,
        height : myWorld._ops.boundaries.bottom - myWorld._ops.boundaries.top
    });

    myWorld.createEntity( wallConfig, {
        name: "top",
        x: (myWorld._ops.boundaries.right - myWorld._ops.boundaries.left) /2 + myWorld._ops.boundaries.left,
        y: myWorld._ops.boundaries.top,
        width : myWorld._ops.boundaries.right - myWorld._ops.boundaries.left,
        height : 0.5
    });

    myWorld.createEntity( wallConfig, {
        name: "bottom",
        x: (myWorld._ops.boundaries.right - myWorld._ops.boundaries.left) /2 + myWorld._ops.boundaries.left,
        y: myWorld._ops.boundaries.bottom,
        width : myWorld._ops.boundaries.right - myWorld._ops.boundaries.left,
        height : 0.5
    });
    
    entityConfig = {
        borderWidth : 1,
        color : "white",
        borderColor : "black"
    };
    
//    totoStatic = myWorld.createEntity( entityConfig, {
//        type : "static",
//        name: "totoStatic",
//        borderColor : "black",
//        x: 5,
//        y: 10,
//        width : 5,
//        height : 3
//    });
//    
//    totoKinematic = myWorld.createEntity( entityConfig, {
//        type : "static",
//        name: "totoKinematic",
//        borderColor : "blue",
//        x: 12,
//        y: 10,
//        width : 5,
//        height : 3
//    });
//    
//    totoDynamic = myWorld.createEntity( entityConfig, {
//        type : "dynamic",
//        name: "totoDynamic",
//        borderColor : "red",
//        x: 20,
//        y: 10,
//        width : 5,
//        height : 3
//    });
//    
//    totoStatic.onMousedown(callback);
//    totoDynamic.onMousedown(callback);
//    totoKinematic.onMousedown(callback);
    
    player = myWorld.createEntity({
        "shape": "circle",
        "x": 25,
        "y": 5,
        "radius": 1,
        "rotation": 0,
        "color": "white",
        "borderColor": 'black',
        "borderWidth": 1
    });
    
    player.mouseDraggable();
    player.touchDraggable();
    
    console.info('toto');
    
    myWorld.mousePan();
    myWorld.mousewheelZoom({step:0.5});
    myWorld.touchPan();
    
    
}   

init();

})();