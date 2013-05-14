function initViewport(){

    var isTouch, IS_ANDROID, fullWindow, canvas;

    //first detect touch
    isTouch = !!('ontouchstart' in window);
    
    //if touch detected, I assume we're mobile (I know it's not allways true, it's only a demo, you will do better !)
    if(isTouch){
        IS_ANDROID = /Android/.test(navigator.userAgent);
        window.scrollTo(0, IS_ANDROID ? 1 : 0); // Android needs to scroll by at least 1px
    }
    
    //if you add ?noFullWindow to the url, we don't resize the canvas
    fullWindow = window.location.search.indexOf("noFullWindow") > -1 ? false : true;
    
    //resize canvas to full window if asked for
    //if full window was not asked for but we're in touch, I assume we're on mobile and resize anyway to prevent canvas oversizing viewport
    if(fullWindow || isTouch){
        canvas = document.getElementById('myCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    return {
        "isTouch" : isTouch
    };
    
}