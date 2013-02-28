(function(){

function init(){
    
    var canvas = document.getElementById('canvas');
    
    if (canvas.addEventListener) {
	// IE9, Chrome, Safari, Opera
	canvas.addEventListener("mousewheel", MouseWheelHandler, false);
	// Firefox
	canvas.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
    }
    // IE 6/7/8
    else canvas.attachEvent("onmousewheel", MouseWheelHandler);

    }
    
    function MouseWheelHandler(e) {
	// cross-browser wheel delta
	//var e = window.event || e; // old IE support
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        console.info(delta,e.offsetX,e.offsetY,e);
        e.preventDefault();
	return false;
    }

init();

})();