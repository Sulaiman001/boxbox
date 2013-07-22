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
    
    totoStatic = myWorld.createEntity( entityConfig, {
        type : "kinematic",
        name: "totoStatic",
        borderColor : "black",
        x: 5,
        y: 10,
        width : 5,
        height : 3
    });
    
    totoKinematic = myWorld.createEntity( entityConfig, {
        type : "kinematic",
        name: "totoKinematic",
        borderColor : "blue",
        image : "../../smileyFaces/wood-crate.png",		
        imageStretchToFit: true,
        x: 12,
        y: 10,
        width : 5,
        height : 3
    });
    
    totoDynamic = myWorld.createEntity( entityConfig, {
        type : "dynamic",
        name: "totoDynamic",
        borderColor : "red",
        x: 20,
        y: 10,
        width : 5,
        height : 3
    });
    
    totoStatic.onMousedown(callback);
    totoDynamic.onMousedown(callback);
//    totoKinematic._body.SetLinearVelocity(new Box2D.Common.Math.b2Vec2(1,1));
//            totoKinematic._body.SetAngularVelocity(Math.PI/6);

    totoKinematic.onStartContact(function(entity){
        console.log('contact',entity);
    });
    
    velocity = 2;
    xMove = 5;
    yMove = 5;
    originalPosition = totoKinematic.position();
    vector = getVector(totoKinematic.position(),{x:totoKinematic.position().x+xMove,y:totoKinematic.position().y+yMove});
    totoKinematic.setVelocity('t',velocity,vector.x,vector.y);
    
    myWorld.onRender(function(){
        if(totoKinematic.position().y>=originalPosition.y+yMove){
//            totoKinematic._body.SetLinearVelocity(new Box2D.Common.Math.b2Vec2(-1,-1));
            totoKinematic.setVelocity('t',velocity,-vector.x,-vector.y);
//            totoKinematic._body.SetAngularVelocity(Math.PI/6);
            console.info(totoKinematic.position());
        }
        else if(totoKinematic.position().y<=originalPosition.y){
            totoKinematic.setVelocity('t',velocity,vector.x,vector.y);
//            totoKinematic._body.SetLinearVelocity(new Box2D.Common.Math.b2Vec2(1,1));
//            totoKinematic._body.SetAngularVelocity(Math.PI/6);
            console.info(totoKinematic.position());
        }
    });
    
    totoKinematic.onMousedown(callback);
    
//    totoKinematic.mouseDraggable({
//        start:function(){
//            console.info('start');
//        }
//    });
    
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
    
    function getVector(sourcePosition,targetPosition){
        sourcePosition = new Box2D.Common.Math.b2Vec2(sourcePosition.x,sourcePosition.y);
        targetPosition = new Box2D.Common.Math.b2Vec2(targetPosition.x,targetPosition.y);
        targetPosition.Subtract(sourcePosition);
        targetPosition.Multiply(1/(Math.min(targetPosition.x,targetPosition.y)));
        return targetPosition;
    }
    
    
}   

init();

})();