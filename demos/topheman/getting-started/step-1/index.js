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