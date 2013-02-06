function init(){
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30});
    
    //create entities
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
    
    //add events (simple on mouse down/up events)
    player.onMousedown(function(e, pos){
        this.color('red');
    });
    
    player.onMouseup(function(e, pos){
        this.color('blue');
    });
    
    //add events to make the enemy entitie draggable (now, you don't have to do all that code, you can simply use the method .draggable() and you will have callbacks for start, drag and stop)
    function onMousedownHandler(e, pos){
        enemy.unbindOnMousedown();
        onMousemoveHandler.call(this,e,pos);
        console.info(this,e,pos);
        enemy.onMousemove(onMousemoveHandler);
        enemy.onMouseup(onMouseupHandler);
    }
    
    function onMousemoveHandler(e, pos){
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
        enemy.onMousedown(onMousedownHandler);
        enemy.unbindOnMousemove();
        enemy.unbindOnMouseup();
        if (this._moveJoint) {
            this._world._world.DestroyJoint(this._moveJoint);
            this._moveJoint = null;
        }
    }
    
    enemy.onMousedown(onMousedownHandler);

}   

window.addEventListener('load',init);