//put the canvas to fullwindow (if not disabled by url ?noFullWindow) + resizes canvas to window + detects touch
var infos = initViewport();

var canvas = document.getElementById('myCanvas');

//create your world with your options (only the first parameter canvas is mandatory)
var myWorld = boxbox.createWorld(canvas,{
    preventScroll: true,
    disableTouchEvents : !infos.isTouch,    //won't add the touch events listeners if true
    disableKeyEvents : true,                //won't add the key events listeners if true
    disableMouseEvents : infos.isTouch,     //won't add the mouse events listeners if true
    debugDraw: false,
    boundaries : {                          //here you specify where you want your world to stop (while panning for example)
        left : 0,
        right : 30,
        top : 0,
        bottom : 12
    }
});

//walls
//this config is shared by the all the walls
var wallConfig = {
    type: "static",     //the walls won't move
    borderWidth : 0,
    color : "darkred"
};
myWorld.createEntity( wallConfig, {
    name: "left",
    x: 0,
    y: 6,
    width : 0.5,
    height : 12
});
myWorld.createEntity( wallConfig, {
    name: "right",
    x: 30,
    y: 6,
    width : 0.5,
    height : 12
});
myWorld.createEntity( wallConfig, {
    name: "top",
    x: 15,
    y: 0,
    width : 30,
    height : 0.5
});
myWorld.createEntity( wallConfig, {
    name: "bottom",
    x: 15,
    y: 12,
    width : 30,
    height : 0.5
});

//player
var player = myWorld.createEntity({
    name: "player",
    shape: "circle",
    color : "blue",
    borderWidth : 0,
    radius: 1,
    x: 3, 
    y: 2,
    onStartContact:function(entity){    //when the player hits the ground, it goes back to blue
        if(entity.name() === "bottom"){
            this.color("blue");
        }
    }
});

//blocks
//this config is shared by all blocks
var blockConfig = {
    shape: "square",
    color: "brown",
    width: 0.5,
    height: 4,
    y: 10,
    onImpact: function( entity, force ) {
        if ( entity.name() === "player" ) {
            this.color( "black" );
            if(force > 40){
                entity.color("red");
            }
        }
        if ( force > 50 && entity.name() !== "bottom" ) {
            this.destroy();
        }
    }
};
myWorld.createEntity( blockConfig, { x: 13 } );
myWorld.createEntity( blockConfig, { x: 19 } );
myWorld.createEntity( blockConfig, { x: 25 } );
myWorld.createEntity( blockConfig, {
        x: 16,
        y: 7,
        width: 6,
        height: 0.5
});
myWorld.createEntity( blockConfig, {
        x: 22,
        y: 7,
        width: 6,
        height: 0.5
});
myWorld.createEntity( blockConfig, { x: 16, y: 4 } );
myWorld.createEntity( blockConfig, { x: 22, y: 4 } );
myWorld.createEntity( blockConfig, {
        x: 19,
        y: 1,
        width: 6,
        height: 0.5
});

//crates
//this config is shared by all crates
var crateConfig = {
    shape: "square",
    color: "yellow",
    width: 2,
    height: 3,
    y: 10
};
var crate1 = myWorld.createEntity( crateConfig, { x: 16 } );
var crate2 = myWorld.createEntity( crateConfig, { x: 22 } );
var crate3 = myWorld.createEntity( crateConfig, { x: 19, y: 5 } );

//function that will be binded/unbinded as an onRender callback
//binded when launching the player (to track it when it is thrown)
//unbinded when the user pan the world (not to mess with the user panning)
//@see api documentation for more infos
function trackPlayer(ctx){
    myWorld.viewport.centerTo(player);
}

//function that will be binded/unbinded as an onRender callback to the player
//binded when start dragging on the player
//unbinded when stop dragging on the player
function drawTargetting(ctx){
    //this._canvasPointerInfos is injected while dragging on the player
    if(this._canvasPointerInfos){
        ctx.lineWidth = 3;
        ctx.strokeStyle='#900000';
        ctx.beginPath();
        ctx.moveTo(this.canvasPosition().x,this.canvasPosition().y);
        ctx.lineTo(this._canvasPointerInfos.x,this._canvasPointerInfos.y);
        ctx.stroke();
    }
};

//we use the mouseDraggable with type = "eventDrag" to activate the launcher
//it won't physically drag the player
//but we'll have the data to draw the target line + apply the right impulse
player.mouseDraggable({
    type : 'eventDrag',
    start: function(e,mouseDraggableInfos){
        myWorld.unbindOnRender(trackPlayer);    //when start dragging, stop tracking the player
        this.onRender(drawTargetting);          //binding a render callback
    },
    drag: function(e,mouseDraggableInfos){
        //adding infos for the render callback
        this._canvasPointerInfos = this._world.canvasPositionAt(mouseDraggableInfos.position.x,mouseDraggableInfos.position.y);
    },
    stop: function(e,mouseDraggableInfos){
        //no more need for the render callback
        myWorld.unbindOnRender(drawTargetting);
        //reset this._canvasPointerInfos 
        this._canvasPointerInfos = null;
        //launch the player
        this.applyImpulse(30,-(this.position().x-mouseDraggableInfos.position.x),-(this.position().y-mouseDraggableInfos.position.y));
        //from now on, we track the player
        myWorld.onRender(trackPlayer);
    }
});
//touchDraggable is mostly the same but remember, on drag, touchDraggableInfos is an array (this is multitouch)
player.touchDraggable({
    type : 'eventDrag',
    maxTouches : 1,
    start: function(e,touchDraggableInfos){
        myWorld.unbindOnRender(trackPlayer);    //when start dragging, stop tracking the player
        this.onRender(drawTargetting);          //binding a render callback
    },
    drag: function(e,touchDraggableInfos){
        //adding infos for the render callback
        this._canvasPointerInfos = this._world.canvasPositionAt(touchDraggableInfos[0].position.x,touchDraggableInfos[0].position.y);//maxTouches = 1, so we are sure we can take the first item of the array
    },
    stop: function(e,touchDraggableInfos){
        //no more need for the render callback
        myWorld.unbindOnRender(drawTargetting);
        //reset this._canvasPointerInfos 
        this._canvasPointerInfos = null;
        //launch the player
        this.applyImpulse(30,-(this.position().x-touchDraggableInfos.position.x),-(this.position().y-touchDraggableInfos.position.y));
        //from now on, we track the player
        myWorld.onRender(trackPlayer);
    }
});