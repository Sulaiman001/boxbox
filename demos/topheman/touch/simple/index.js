(function(){

function init(){
    
    initViewport();
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30,touchEvents:true, preventScroll:false});
    
    //create entities
    decor1 = myWorld.createEntity({
      color: "orange",
      x: 2,
      y: 2,
      width: 3,
      height: 2
    });
    decor1.name('decor1');

    player = myWorld.createEntity();
    player.name('player');
    
    enemy = myWorld.createEntity({
        color : 'red',
        x: 6,
        y: 0,
        width: 1.5,
        density: 10,
        height: 2
    });
    enemy.name('enemy');

    ground = myWorld.createEntity({
      color: "green",
      x: 15,
      y: 6,
      width: 30,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');
    
    function onTouchstartHandler(e,touchInfos){
        console.info('start',logTouchInfos(e),logTouchInfos(touchInfos));
    }
    
    function onTouchmoveHandler(e,touchInfos){
        var i, jointDefinition;
//        console.info('move',logTouchInfos(e),logTouchInfos(touchInfos));
        if(touchInfos.length > 0){
            for(i=0; i<touchInfos.length; i++){
                if(touchInfos[i].entity){
                    if(!touchInfos[i].entity._moveJoint){
                        jointDefinition = new Box2D.Dynamics.Joints.b2MouseJointDef();

                        jointDefinition.bodyA = touchInfos[i].entity._world._world.GetGroundBody();
                        jointDefinition.bodyB = touchInfos[i].entity._body;
                        jointDefinition.target.Set(touchInfos[i].x, touchInfos[i].y);
                        jointDefinition.maxForce = 10000000000000000000000000000;//100000
                        jointDefinition.timeStep = 1/60;//hard coded ?!!
                        touchInfos[i].entity._moveJoint = touchInfos[i].entity._world._world.CreateJoint(jointDefinition);
                    }
                    touchInfos[i].entity._moveJoint.SetTarget(new Box2D.Common.Math.b2Vec2(touchInfos[i].x, touchInfos[i].y));
                }
            }
        }
    }
    
    function onTouchendHandler(e,touchInfos){
        var i, jointDefinition;
        console.info('end',logTouchInfos(e),logTouchInfos(touchInfos));
        if(touchInfos.length > 0){
            for(i=0; i<touchInfos.length; i++){
                if(touchInfos[i].entity){
                    if(touchInfos[i].entity._moveJoint){
                        touchInfos[i].entity._world._world.DestroyJoint(touchInfos[i].entity._moveJoint);
                        touchInfos[i].entity._moveJoint = null;
                    }
                }
            }
        }
    }
    
    myWorld.onTouchstart(onTouchstartHandler);
    myWorld.onTouchmove(onTouchmoveHandler);
    myWorld.onTouchend(onTouchendHandler);

}   

init();

})();