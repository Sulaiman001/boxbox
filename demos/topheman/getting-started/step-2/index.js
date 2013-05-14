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