//a little inspiration from : http://jsfiddle.net/4QG5Q/27/

//first detect touch
var touchDetected = !!('ontouchstart' in window);

//if touch detected, I assume we're mobile (I know it's not allways true, it's only a demo, you will do better !)
if(touchDetected){
    var IS_ANDROID = /Android/.test(navigator.userAgent);
    window.scrollTo(0, IS_ANDROID ? 1 : 0); // Android needs to scroll by at least 1px
}

var debug = window.location.search === "" ? true : false;

//canvas to full window
var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//add console
var logging = SimpleConsole.getInstance({fitToCanvas: canvas, ctxOptions : {x: 10, y: 100}});

//--- page init (please do it cleaner than that, use things such as Modernizer, or viewporter.js ...) ---

(function(global){
    
    var myWorld;
    
    function initWorld(){
        
        //create your world
        myWorld = boxbox.createWorld(canvas,{
            scale:30,
            preventScroll: true,
            disableTouchEvents : !touchDetected,
            disableKeyEvents : true,
            disableMouseEvents : touchDetected,
            debugDraw: false,
            boundaries : {
                left : -1,
                right : 30,
                top : -1,
                bottom : 12
            }
        });
    
        //this is only the console drawing function
        if(debug){
            myWorld.onRender(function(){
                logging.draw(this._ctx);
            });
        }
        
        //the world is ready, start to populate it
        phase1();
        
    }
    
    function initWalls(){
        var wallConfig = {
            type: "static"
        };
        
	myWorld.createEntity( wallConfig, {
            name: "left",
            x: myWorld._ops.boundaries.left,
            y: (myWorld._ops.boundaries.bottom - myWorld._ops.boundaries.top) /2 + myWorld._ops.boundaries.top,
            width : 0.5,
            height : myWorld._ops.boundaries.bottom - myWorld._ops.boundaries.top
	});
        
	myWorld.createEntity( wallConfig, {
            name: "right",
            x: myWorld._ops.boundaries.right,
            y: (myWorld._ops.boundaries.bottom - myWorld._ops.boundaries.top) /2 + myWorld._ops.boundaries.top,
            width : 0.5,
            height : myWorld._ops.boundaries.bottom - myWorld._ops.boundaries.top
	});
        
	myWorld.createEntity( wallConfig, {
            name: "top",
            x: (myWorld._ops.boundaries.right - myWorld._ops.boundaries.left) /2 + myWorld._ops.boundaries.left,
            y: myWorld._ops.boundaries.top,
            width : myWorld._ops.boundaries.right - myWorld._ops.boundaries.left,
            height : 0.5
	});
        
	myWorld.createEntity( wallConfig, {
            name: "bottom",
            x: (myWorld._ops.boundaries.right - myWorld._ops.boundaries.left) /2 + myWorld._ops.boundaries.left,
            y: myWorld._ops.boundaries.bottom,
            width : myWorld._ops.boundaries.right - myWorld._ops.boundaries.left,
            height : 0.5
	});
        
        myWorld.mousePan();
        myWorld.touchPan();
        myWorld.mousewheelZoom({step : 1});
        
    }

    function phase1(){
        
        //walls
        initWalls();
        
        //smiley
        var drawTargetting = function(ctx){
            console.info('onRender','this',this);
            if(this._canvasPointerInfos){
                ctx.lineWidth = 3;
                ctx.strokeStyle='gray';
                ctx.beginPath();
                ctx.moveTo(this.canvasPosition().x,this.canvasPosition().y);
                ctx.lineTo(this._canvasPointerInfos.x,this._canvasPointerInfos.y);
                ctx.stroke();
            }
        };
        
        var smileyConfig = {
            name: "smiley",
            shape: "circle",
            color : "white",
            radius: 1,
//            image: "https://dl.dropbox.com/u/200135/imgs/green-bird.png", 		
//            imageStretchToFit: true,
            density: 2,
            x: 2, 
            y: 11
	};
        
	myWorld.createEntity( smileyConfig, {
            x: 2,
            score: 0
	});
        
        myWorld.getEntityByName("smiley").mouseDraggable({
            type : 'eventDrag',
            start: function(e,mouseDraggableInfos){
                console.log(this.name()+' eventDrag start');
//                this.color('blue');
                console.info('startdrag callback','event',e.type,'world pos',mouseDraggableInfos);
                //binding a render callback
                this.onRender(drawTargetting);
            },
            drag: function(e,mouseDraggableInfos){
                console.log(this.name()+' eventDrag drag');
                //adding infos for the render callback
                this._canvasPointerInfos = this._world.canvasPositionAt(mouseDraggableInfos.position.x,mouseDraggableInfos.position.y);
                console.info('drag callback','event',e.type,'world pos',mouseDraggableInfos,'canvas pos',this._canvasPointerInfos);
            },
            stop: function(e,mouseDraggableInfos){
                console.log(this.name()+' eventDrag stop');
                //no more need for the render callback
                this._world.unbindOnRender(drawTargetting);
                this._canvasPointerInfos = null;
//                this.color('darkred');
                this.applyImpulse(30,-(this.position().x-mouseDraggableInfos.position.x),-(this.position().y-mouseDraggableInfos.position.y));
                console.info('stopdrag callback','event',e.type,'world pos',mouseDraggableInfos);
            }
        });
        
        myWorld.getEntityByName("smiley").touchDraggable({
            type : 'eventDrag',
            maxTouches : 1,
            start: function(e,touchDraggableInfos){
                console.log(this.name()+' eventDrag start');
//                this.color('blue');
                console.info('startdrag callback','event',e.type,'world pos',touchDraggableInfos);
                //binding a render callback
                this.onRender(drawTargetting);
            },
            drag: function(e,touchDraggableInfos){
                console.log(this.name()+' eventDrag drag');
                //adding infos for the render callback
                this._canvasPointerInfos = this._world.canvasPositionAt(touchDraggableInfos[0].position.x,touchDraggableInfos[0].position.y);
                console.info('drag callback','event',e.type,'world pos',touchDraggableInfos,'canvas pos',this._canvasPointerInfos);
            },
            stop: function(e,touchDraggableInfos){
                console.log(this.name()+' eventDrag stop');
                //no more need for the render callback
                this._world.unbindOnRender(drawTargetting);
                this._canvasPointerInfos = null;
//                this.color('darkred');
                this.applyImpulse(30,-(this.position().x-touchDraggableInfos.position.x),-(this.position().y-touchDraggableInfos.position.y));
                console.info('stopdrag callback','event',e.type,'world pos',touchDraggableInfos);
            }
        });
        
        //pigs
        
        //blocks
        var blockConfig = {
            name: "block",
            shape: "square",
            color: "brown",
            width: 0.5,
            height: 4,
            y: 10,
            onImpact: function( entity, force ) {
                if ( entity.name() === "smiley" ) {
                    this.color( "black" );
                }
                if ( force > 70 && entity.name() !== "bottom" ) {
                    this.destroy();
                }
            }
	};
        
        var blocks = []; //keep the reference to blocks in this array to add callbacks to each of them (don't forget to reset the array befor world cleanup)

	blocks.push( myWorld.createEntity( blockConfig, { x: 13 } ) );

	blocks.push( myWorld.createEntity( blockConfig, { x: 19 } ) );

	blocks.push( myWorld.createEntity( blockConfig, { x: 25 } ) );

	blocks.push( myWorld.createEntity( blockConfig, {
		x: 16,
		y: 7,
		width: 6,
		height: 0.5
	}) );

	blocks.push( myWorld.createEntity( blockConfig, {
		x: 22,
		y: 7,
		width: 6,
		height: 0.5
	}) );

	blocks.push( myWorld.createEntity( blockConfig, { x: 16, y: 4 } ) );

	blocks.push( myWorld.createEntity( blockConfig, { x: 22, y: 4 } ) );

	blocks.push( myWorld.createEntity( blockConfig, {
		x: 19,
		y: 1,
		width: 6,
		height: 0.5
	}) );
        
    }
    
    function phase2(){
        
    }
    
    initWorld();
    
})(this);