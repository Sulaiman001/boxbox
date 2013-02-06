function init(){
     
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30});
//    myWorld.pause();
    
    decor1 = myWorld.createEntity({
      color: "orange",
      x: 6,
      y: 4,
      width: 6,
      height: 4,
      type: "static",
      active: false
    });
    decor1.name('decor1');

    player = myWorld.createEntity();
    player.name('player');
    
    enemy = myWorld.createEntity({
        color : 'red',
        x: 16,
        y: 2,
        width: 3,
        density: 10,
        height: 4
    });
    enemy.name('enemy');

    ground = myWorld.createEntity({
      color: "green",
      x: 13,
      y: 10,
      width: 12,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');
    
    player.onMousedown(function(a,b){
        this.color('red');
//       console.log('mousedown','a',a,'b',b); 
    });
    
    player.onMouseup(function(a,b){
        this.color('blue');
//       console.log('mouseup','a',a,'b',b); 
    });
    
    ground.onMousemove(function(a,b){
        this._hover = true;//add an inter hover or mousein mouseout method (used in rendering)
//        this.color('yellow');
//       console.log('mousemove','a',a,'b',b); 
    });
    
    ground.onRender(function(ctx){
        if(this._hover === true)
            this.color('yellow');
        else
            this.color('green');
//        this._hover = false;
    });
    
    function onMousedownHandler(e, pos){
//        console.log('enemy mouse down');
        enemy.unbindOnMousedown();
        onMousemoveHandler.call(this,e,pos);
        enemy.onMousemove(onMousemoveHandler);
        enemy.onMouseup(onMouseupHandler);
    }
    
    function onMousemoveHandler(e, pos){
//        console.log('enemy mouse move');
//        this._body.SetFixedRotation(true);
        if(!this._moveJoint){
            var jointDefinition = new Box2D.Dynamics.Joints.b2MouseJointDef();
 
            jointDefinition.bodyA = this._world._world.GetGroundBody();
            jointDefinition.bodyB = this._body;
            jointDefinition.target.Set(pos.x, pos.y);
            jointDefinition.maxForce = 10000000000000000000000000000;//100000
            jointDefinition.timeStep = 1/60;//hard coded ?!!
            this._moveJoint = this._world._world.CreateJoint(jointDefinition);
        }
        this._moveJoint.SetTarget(new Box2D.Common.Math.b2Vec2(pos.x, pos.y));
    }
    
    function onMouseupHandler(e, pos){
//        console.log('enemy mouse up');
        enemy.onMousedown(onMousedownHandler);
        enemy.unbindOnMousemove();
        enemy.unbindOnMouseup();
        if (this._moveJoint) {
            this._world._world.DestroyJoint(this._moveJoint);
            this._moveJoint = null;
        }
//        this._body.SetType(Box2D.Dynamics.b2Body.b2_staticBody);
    }
    
    enemy.onMousedown(onMousedownHandler);
    
//    canvas.addEventListener('mousedown',function(){console.log('mousedown');});

}   

window.addEventListener('load',init);