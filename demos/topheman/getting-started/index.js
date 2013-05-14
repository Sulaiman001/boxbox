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

//activate the panning on both mouse and touch
myWorld.mousePan();     //you'll receive a warning if disableMouseEvents = true
myWorld.touchPan();     //you'll receive a warning if disableTouchEvents = true

//activate the mousewheel zoom
myWorld.mousewheelZoom({step : 1});

//add walls
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

//add the player
player = myWorld.createEntity({
    name: "player",
    shape: "circle",
    color : "blue",
    borderWidth : 0,
    radius: 1,
    x: 2, 
    y: 2,
    onStartContact:function(entity){    //when the player hits the ground, it goes back to blue
        if(entity.name() === "bottom"){
            this.color("blue");
        }
    }
});

//focus on the player (the framework centers the viewport to the center of the world by default)
myWorld.viewport.centerTo(player);
myWorld.viewport.scaleTo(14);//little scale for little devices (to see most of the world)

//blocks
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