(function(){
 
function init(){
     
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30, debugDraw : false});

    //create entities
    player = myWorld.createEntity();
    player.name('player');
    
    enemy = myWorld.createEntity({
        color : 'orange',
        x: 16,
        y: 2,
        width: 3,
        density: 10,
        height: 4
    });
    enemy.name('enemy');

    ground = myWorld.createEntity({
      color: "green",
      x: 10,
      y: 13,
      width: 20,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');

    sky = myWorld.createEntity({
      color: "green",
      x: 10,
      y: 0,
      width: 20,
      height: 0.5,
      type: "static"
    });
    sky.name('sky');

    wallLeft = myWorld.createEntity({
      color: "green",
      x: 0,
      y: 6,
      width: 0.5,
      height: 15,
      type: "static"
    });
    wallLeft.name('wallLeft');

    wallRight = myWorld.createEntity({
      color: "green",
      x: 20,
      y: 6,
      width: 0.5,
      height: 15,
      type: "static"
    });
    wallRight.name('wallRight');
    
    circle = myWorld.createEntity({
      color: "blue",
      x: 5,
      y: 1,
      radius:1,
      shape:'circle'
    });
    circle.name('circle');
    
    circle2 = myWorld.createEntity({
      color: "darkred",
      x: 6,
      y: 4,
      radius:1,
      shape:'circle'
    });
    circle2.name('circle2');
    
    //one line , it's draggable !
    player.mouseDraggable();
    
    //mouseDraggable with callbacks
    enemy.mouseDraggable({
        start: function(e,pos){
            this._mouseInfos = pos;
            this.color('blue');
            player.color('red');
            console.info('startdrag callback','event',e.type,'world pos',pos);
        },
        drag: function(e,pos){
            this._mouseInfos = pos;
            this.color('#'+Math.floor(Math.random()*16777215).toString(16));//wath your eyes 
            console.info('drag callback','event',e.type,'world pos',pos);
        },
        stop: function(e,pos){
            this._mouseInfos = null;
            this.color('blue');
            player.color('gray');
            console.info('stopdrag callback','event',e.type,'world pos',pos);
        }
    });
    
//    enemy.pin(15,8);
    
    //draw callback binded onRender
    function drawTargetting(ctx){
        console.info('onRender','this',this);
        if(this._canvasMouseInfos){
            ctx.lineWidth = 3;
            ctx.strokeStyle='#33a99a';
            ctx.beginPath();
            ctx.moveTo(this.canvasPosition().x,this.canvasPosition().y);
            ctx.lineTo(this._canvasMouseInfos.x,this._canvasMouseInfos.y);
            ctx.stroke();
        }
    }
    
    //mouseDraggable (without moving) with callbacks
    circle2.mouseDraggable({
        type : 'eventDrag',
        start: function(e,mouseInfos){
            this.color('blue');
            console.info('startdrag callback','event',e.type,'world pos',mouseInfos);
            //binding a render callback
            this.onRender(drawTargetting);
        },
        drag: function(e,mouseInfos){
            //adding infos for the render callback
            this._canvasMouseInfos = this._world.canvasPositionAt(mouseInfos.position.x,mouseInfos.position.y);
            console.info('drag callback','event',e.type,'world pos',mouseInfos,'canvas pos',this._canvasMouseInfos);
        },
        stop: function(e,mouseInfos){
            //no more need for the render callback
            this._world.unbindOnRender(drawTargetting);
            this._canvasMouseInfos = null;
            this.color('darkred');
            this.applyImpulse(30,-(this.position().x-mouseInfos.position.x),-(this.position().y-mouseInfos.position.y));
            console.info('stopdrag callback','event',e.type,'world pos',mouseInfos);
        }
    });
    
    circle.mouseDraggable('disable');
    
    enemy.onKeydown(function(e){
        console.info(e);
        if(e.ctrlKey === true){
            if(this.isPined()){
                this.unPin();
            }
            else{
                if(this._mouseInfos){
                    this.pin(this._mouseInfos.position.x,this._mouseInfos.position.y);
                }
                else{
                    this.pin();
                }
            }                
        }
    });
    
    myWorld.mousePan();
    myWorld.mousewheelZoom({step:0.5});

}

init();

})();