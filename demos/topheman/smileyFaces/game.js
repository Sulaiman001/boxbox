//a little inspiration from : http://jsfiddle.net/4QG5Q/27/

//first detect touch
var touchDetected = !!('ontouchstart' in window);

//if touch detected, I assume we're mobile (I know it's not allways true, it's only a demo, you will do better !)
if(touchDetected){
    var IS_ANDROID = /Android/.test(navigator.userAgent);
    window.scrollTo(0, IS_ANDROID ? 1 : 0); // Android needs to scroll by at least 1px
}

//if you add ?debug=false to the url there will be no console at all
var debug = window.location.search === "" ? true : false;

//resize canvas to full window
var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//add console
var logging = SoftLogger.getInstance({fitToCanvas: canvas, ctxOptions : {x: 10, y: 10}});

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
        
        //the world is ready, start to populate it
        phase1();
        
    }
    
    function initConsole(){
    
        //this is only the console drawing function, we add it only on debug mode
        if(debug){
            myWorld.onRender(function(){
                logging.draw(this._ctx);
            });
        }
        
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
        
        initConsole();
        
        //stage
	myWorld.createEntity({
            type : "static",
            active : false,
//            color : "blue",
            borderWidth : 0,
            color : function(ctx){
                var g = ctx.createLinearGradient(0,0,0,myWorld._canvas.height*0.7);
                g.addColorStop(0,"blue");
                g.addColorStop(1,"white");
                return g;
            },
            name: "sky",
            shape: "square",
            width: myWorld._ops.boundaries.right - myWorld._ops.boundaries.left,
            height: 11.5,
            x: (myWorld._ops.boundaries.right - myWorld._ops.boundaries.left)/2+myWorld._ops.boundaries.left, 
            y: 4.5
	});
	myWorld.createEntity({
            type : "static",
            active : false,
//            color : "brown",
            borderWidth : 0,
            color : function(ctx){
                var g = ctx.createLinearGradient(0,myWorld._canvas.height*0.7,0,myWorld._canvas.height);
                g.addColorStop(0,"#E08E1B");
                g.addColorStop(1,"#FFE985");
                return g;
            },
            name: "ground",
            shape: "square",
            width: myWorld._ops.boundaries.right - myWorld._ops.boundaries.left,
            height: 1.5,
            x: (myWorld._ops.boundaries.right - myWorld._ops.boundaries.left)/2+myWorld._ops.boundaries.left, 
            y: 11
	});
        var sunnyCloudConfig = {
            type : "static",
            active : false,
            name: "sunny-cloud",
            shape: "square",
            width: 4,
            height: 4,
            color : "yellow",
            borderWidth : 0,
            image: "./sunny-cloud.png", 		
            imageStretchToFit: true,
            density: 2,
            x: 4, 
            y: 5
	};
        var cloudConfig = {
            type : "static",
            active : false,
            name: "cloud",
            shape: "square",
            width: 2,
            height: 2,
            color : "yellow",
            borderWidth : 0,
            image: "./cloud.png", 		
            imageStretchToFit: true,
            density: 2,
            x: 15, 
            y: 4.5
	};
	myWorld.createEntity(sunnyCloudConfig,{
            name: "sunny-cloud1",
            width: 4,
            height: 4,
            x: 4, 
            y: 3
	});
	myWorld.createEntity(cloudConfig,{
            name: "cloud1",
            width: 3,
            height: 3,
            x: 13, 
            y: 4.7
	});
	myWorld.createEntity(cloudConfig,{
            name: "cloud2",
            width: 2,
            height: 2,
            x: 18.5, 
            y: 1.5
	});
        
        //walls
        initWalls();
        
        //this is the rendering callback of the clouds (using boxbox entities)
        var animateStage = function(){
            var e = myWorld.getEntityByName('cloud1');
            e.position({x:e.position().x-0.05,y:e.position().y});
            if(e.position().x < -e._ops.width/2){
                e.position({x:myWorld._ops.boundaries.right+e._ops.width/2,y:e.position().y});
            }
            var e = myWorld.getEntityByName('cloud2');
            e.position({x:e.position().x-0.02,y:e.position().y});
            if(e.position().x < -e._ops.width/2){
                e.position({x:myWorld._ops.boundaries.right+e._ops.width/2,y:e.position().y});
            }
            
        };
        
        //process the size and position of the static icon once and for all
        var iconWidth = canvas.height/15 < 30 ? 30 : canvas.height/15;
        var iconMargin = 4;
        
        var homeIcon = {
            "img"   : document.getElementById('home-icon'),
            "x"     : canvas.width - (iconWidth + iconMargin),
            "y"     : iconMargin,
            "width" : iconWidth,
            "height": iconWidth
        };
        
        var refreshIcon = {
            "img"   : document.getElementById('refresh-icon'),
            "x"     : homeIcon.x - (iconWidth + iconMargin),
            "y"     : iconMargin,
            "width" : iconWidth,
            "height": iconWidth
        };
        
        var stressIcon = {
            "img"   : document.getElementById('stress-icon'),
            "x"     : refreshIcon.x - (iconWidth + iconMargin),
            "y"     : iconMargin,
            "width" : iconWidth,
            "height": iconWidth
        };
        
        //this is the rendering callback of the icons (using direct canvas ctx) - the click/touch on the icons are below on the code
        var drawIcons = function(ctx){
            ctx.drawImage(homeIcon.img,homeIcon.x,homeIcon.y,homeIcon.width,homeIcon.height);
            ctx.drawImage(refreshIcon.img,refreshIcon.x,refreshIcon.y,refreshIcon.width,refreshIcon.height);
            ctx.drawImage(stressIcon.img,stressIcon.x,stressIcon.y,stressIcon.width,stressIcon.height);
        };
        
        //binding the rendering callbacks
        myWorld.onRender(animateStage);
        
        myWorld.onRender(drawIcons);
        
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
        
        //this is a drawing callback wehere we draw nothing (we only adjust the viewport), it's binded and unbinded on the event callbacks below
        var trackSmiley = function(ctx){
            myWorld.viewport.centerTo(myWorld.getEntityByName("smiley"));
        };
        
        //you could just write myWorld.mousePan if you don't wan't specific callbacks
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
        
	myWorld.createEntity( smileyConfig );
        
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
        
        crates.push( myWorld.createEntity( crateConfig, { name: "crate3",  x: 19, y: 5 } ) );
        
        var addDragggableToCrates = function(crates, indexStart){
        
            indexStart = indexStart || 0;
            for (var i = indexStart; i<crates.length; i++){
                crates[i].mouseDraggable({
                    start: function(e,mouseDraggableInfos){
                        this._world.unbindOnRender(trackSmiley);
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
        
        };
        
        //reused in stressTest
        addDragggableToCrates(crates);
        
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
        
        //handlers to bind on the icons
        
        var confirmGoHome = function(){
            myWorld.pause();
            //using setTimout because of confirm on iPhone (seems to take ahead on events)
            setTimeout(function(){
                if(confirm("Are you sure you wan't to go back to boxboxevents home page ?")){
                    window.location.href = "http://topheman.github.com/boxbox";
                }
                else{
                    myWorld.pause();
                }
            },500);
        };
        
        var confirmRestart = function(){
            myWorld.pause();
            //using setTimout because of confirm on iPhone (seems to take ahead on events)
            setTimeout(function(){
                if(confirm("Are you sure you wan't restart game ?")){
                    //restart
                    myWorld.pause();
                    myWorld.cleanup();
                    phase1();
                }
                else{
                    myWorld.pause();
                }
            },500);
        };
        
        var confirmStressTest = function(){
            myWorld.pause();
            //using setTimout because of confirm on iPhone (seems to take ahead on events)
            setTimeout(function(){
                if(confirm("Are you sure you wan't start stress test ? (50 crates)")){
                    //ok for stress test
                    myWorld.pause();
                    var start = crates.length;
                    var stop = start + 50;
                    for(var j=start; j<stop; j++){
                        crates.push( myWorld.createEntity( crateConfig, { name: "crate"+j, x: (myWorld._ops.boundaries.right - myWorld._ops.boundaries.left)/2 , y : (myWorld._ops.boundaries.bottom - myWorld._ops.boundaries.top)/2, width: j < 15 ? 2 : 0.75, height: j < 15 ? 3 : 1 } ) );
                    }
                    addDragggableToCrates(crates,start);
                }
                else{
                    myWorld.pause();
                }
            },500);
        };
        
        //final handler to bind on the world
        var pointerWorld = function(e){
            var x = touchDetected ? (e.touches[0].offsetX || e.touches[0].layerX || e.touches[0].pageX) : (e.offsetX || e.layerX || e.pageX);
            var y = touchDetected ? (e.touches[0].offsetY || e.touches[0].layerY || e.touches[0].pageY) : (e.offsetY || e.layerY || e.pageY);
            if(x > homeIcon.x && x < (homeIcon.x + homeIcon.width) && y > homeIcon.y && y < (homeIcon.y + homeIcon.height)){
                confirmGoHome();
            }
            if(x > refreshIcon.x && x < (refreshIcon.x + refreshIcon.width) && y > refreshIcon.y && y < (refreshIcon.y + refreshIcon.height)){
                confirmRestart();
            }
            if(x > stressIcon.x && x < (stressIcon.x + stressIcon.width) && y > stressIcon.y && y < (stressIcon.y + stressIcon.height)){
                confirmStressTest();
            }
        };
        
        myWorld.onMousedown(pointerWorld);
        myWorld.onTouchstart(pointerWorld);
        
    }
    
    initWorld();
    
})(this);