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
var logging = SimpleConsole.getInstance({fitToCanvas: canvas, ctxOptions : {x: 10, y: 10}});

//from here this is sample code (most of it is for logging, you could reduce it a lot !)

(function(global){
    
    //your boxbox world accessible all accross this scope
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
            type: "static",
            borderWidth : 0,
            color : "darkred"
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
        
    }

    function phase1(){
        
        //walls
        initWalls();
        
        //instruction
        console.log("Use the smiley like angry birds");
        console.log("It works as well with touch and mouse");
        console.log("You can move the world too");
        console.log(">with mouse : just click on the stage and move + you can mousewheel to zoom in/out");
        console.log(">with touch : touch the stage with one finger to move it, with two finger to zoom in/out");
        console.log("The crates are multitouch draggable all at once !");
        
        //drawing callback for the smiley
        var drawTargetting = function(ctx){
            if(this._canvasPointerInfos){
                ctx.lineWidth = 3;
                ctx.strokeStyle='#900000';
                ctx.beginPath();
                ctx.moveTo(this.canvasPosition().x,this.canvasPosition().y);
                ctx.lineTo(this._canvasPointerInfos.x,this._canvasPointerInfos.y);
                ctx.stroke();
            }
        };
        
        var trackSmiley = function(ctx){
            myWorld.viewport.centerTo(myWorld.getEntityByName("smiley"));
        };
        
        //you could just writ myWorld.mousePan if you don't wan't specific callbacks
        myWorld.mousePan({
            start: function(e, viewportInfos){
                myWorld.unbindOnRender(trackSmiley);//we stop tracking the smiley
                console.log('world.mousePan - start');
            },
            drag: function(e, viewportInfos){
                console.log('world.mousePan - drag');
            },
            stop: function(e, viewportInfos){
                console.log('world.mousePan - stop');
            }
        });
        //you could just write myWorld.touchPan if you don't wan't specific callbacks
        myWorld.touchPan({
            start: function(e, viewportInfos){
                myWorld.unbindOnRender(trackSmiley);//we stop tracking the smiley
                console.log('world.touchPan - start');
            },
            drag: function(e, viewportInfos){
                console.log('world.touchPan - drag');
            },
            stop: function(e, viewportInfos){
                console.log('world.touchPan - stop');
            },
            startPinching: function(e, viewportInfos){
                console.log('world.touchPan - startPinching');
            },
            stopPinching: function(e, viewportInfos){
                console.log('world.touchPan - stopPinching');
            }
        });
        myWorld.mousewheelZoom({step : 1});
        
        var smileyConfig = {
            name: "smiley",
            shape: "circle",
            color : "yellow",
            borderWidth : 0,
            radius: 1,
            image: "./smiley-iddle.png", 		
            imageStretchToFit: true,
            density: 2,
            x: 2, 
            y: 11,
            onStartContact:function(entity){
                if(entity.name() === "bottom"){
                    this.image('./smiley-iddle.png');
                }
            }
	};
        
	myWorld.createEntity( smileyConfig, {
            x: 2,
            score: 0
	});
        
        //you don't have to do this (if you have boundaries, it will automatically center to the center of your world - @see documentation)
        myWorld.viewport.centerTo(myWorld.getEntityByName("smiley"));
        myWorld.viewport.scaleTo(14);//little scale for little devices (to see most of the world)
        
        myWorld.getEntityByName("smiley").mouseDraggable({
            type : 'eventDrag',
            start: function(e,mouseDraggableInfos){
                this._world.unbindOnRender(trackSmiley);
                console.log(this.name()+' eventDrag start');
                this.image('./smiley-launching.png');
                //binding a render callback
                this.onRender(drawTargetting);
            },
            drag: function(e,mouseDraggableInfos){
                console.log(this.name()+' eventDrag drag');
                //adding infos for the render callback
                this._canvasPointerInfos = this._world.canvasPositionAt(mouseDraggableInfos.position.x,mouseDraggableInfos.position.y);
            },
            stop: function(e,mouseDraggableInfos){
                console.log(this.name()+' eventDrag stop');
                //no more need for the render callback
                this._world.unbindOnRender(drawTargetting);
                this._canvasPointerInfos = null;
                this.image('./smiley-launched.png');
                this.applyImpulse(30,-(this.position().x-mouseDraggableInfos.position.x),-(this.position().y-mouseDraggableInfos.position.y));
                myWorld.onRender(trackSmiley);//from now on, we track the smiley
            }
        });
        
        myWorld.getEntityByName("smiley").touchDraggable({
            type : 'eventDrag',
            maxTouches : 1,
            start: function(e,touchDraggableInfos){
                this._world.unbindOnRender(trackSmiley);
                console.log(this.name()+' eventDrag start');
                this.image('./smiley-launching.png');
                //binding a render callback
                this.onRender(drawTargetting);
            },
            drag: function(e,touchDraggableInfos){
                console.log(this.name()+' eventDrag drag');
                //adding infos for the render callback
                this._canvasPointerInfos = this._world.canvasPositionAt(touchDraggableInfos[0].position.x,touchDraggableInfos[0].position.y);
            },
            stop: function(e,touchDraggableInfos){
                console.log(this.name()+' eventDrag stop');
                //no more need for the render callback
                this._world.unbindOnRender(drawTargetting);
                this._canvasPointerInfos = null;
                this.image('./smiley-launched.png');
                this.applyImpulse(30,-(this.position().x-touchDraggableInfos.position.x),-(this.position().y-touchDraggableInfos.position.y));
                myWorld.onRender(trackSmiley);//from now on, we track the smiley
            }
        });
        
        //crates
        var crateConfig = {
            shape: "square",
            color: "yellow",
            width: 2,
            height: 3,
            image: "./wood-crate.png",	
            imageStretchToFit: true,  
            y: 10
        };
        
        var crates = [];
        
        crates.push( myWorld.createEntity( crateConfig, { name: "crate1", x: 16 } ) );
        
        crates.push( myWorld.createEntity( crateConfig, { name: "crate2",  x: 22 } ) );
        
        crates.push( myWorld.createEntity( crateConfig, {
            name: "crate3",
            x: 19,
            y: 5,
            onImpact: function(entity, force){
                if(entity.name() === "bottom"){
                    this._sprite = undefined;
                    this.color("darkred");
                    this.life = 5;
                }
            }
        } ) );
        
        //maybe use onTick ?
        myWorld.onRender(function(){
            if(crates[2] && crates[2].life){
                crates[2].life--;
                if(crates[2].life === 1){
                    crates[2].destroy();
                }
            }
        });
        
        for (var i = 0; i<crates.length; i++){
            crates[i].mouseDraggable({
                start: function(e,mouseDraggableInfos){
                    console.log(this.name()+' drag start');
                },
                drag: function(e,mouseDraggableInfos){
                    console.log(this.name()+' drag drag');
                },
                stop: function(e,mouseDraggableInfos){
                    console.log(this.name()+' drag stop');
                }
            });
            crates[i].touchDraggable({
                start: function(e,touchDraggableInfos){
                    console.log(this.name()+' drag start');
                },
                drag: function(e,touchDraggableInfos){
                    console.log(this.name()+' drag drag');
                },
                stop: function(e,touchDraggableInfos){
                    console.log(this.name()+' drag stop');
                },
                touchadd: function(e,touchDraggableInfos){
                    console.log(this.name()+' drag touchadd');
                },
                touchremove: function(e,touchDraggableInfos){
                    console.log(this.name()+' drag touchremove');
                }
            });
        }
        
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
                    if(force > 40){
                        entity.image('./smiley-impact.png');
                    }
                }
                if ( force > 50 && entity.name() !== "bottom" ) {
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