/*
Copyright (C) 2013 Christophe Rosset <tophe@topheman.com>
Copyright (C) 2012 Greg Smith <gsmith@incompl.com>

Released under the MIT license:
https://github.com/topheman/boxbox/blob/master/LICENSE

This version of boxbox is a fork of the original version created by Greg Smith. ( http://incompl.github.com/boxbox/ )
The whole mouse/touch events management layer and some other features are from Christophe Rosset aka topheman. ( http://topheman.github.com/boxbox/ )
Changes from the original are tagged @added by topheman for a future merge.
See more on the readme file
*/

/**
 * @_page_title boxbox
 * @_page_description api documentation
 * @_page_home_path .
 * @_page_compact_index
 */

// Erik Moller's requestAnimationFrame shim
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelRequestAnimationFrame = window[vendors[x]+
          'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
      };
    }
}());

(function() {

    var DEGREES_PER_RADIAN = 57.2957795; // 180 / pi

    /**
     * @_name boxbox
     * @header
     * @description contains a single self-contained physics simulation
     */
    window.boxbox = {};
    window.boxbox.codeName = "boxboxevents";
    
    // Make sure Box2D exists
    if (Box2D === undefined) {
        console.error('boxbox needs Box2d to work');
        return;
    }
    
    // Object creation inspired by Crockford
    // http://javascript.crockford.com/prototypal.html
    function create(o) {
        function F() {}
        F.prototype = o;
        return new F();
    }
    
    // A minimal extend for simple objects inspired by jQuery modified by topheman : simple deep copy + array copy added because of reference problems
    function extend(target, o) {
        var index, key, i;
        if (target === undefined) {
            target = {};
        }
        if (o !== undefined) {
            for (key in o) {
                if (o.hasOwnProperty(key) && target[key] === undefined) {
                    if(Object.prototype.toString.call(o[key]) === '[object Array]'){
                        target[key] = [];
                        for(i = 0; i < o[key].length; i++){
                            target[key].push(o[key][i]);
                        }
                    }
                    else if (typeof o[key] === 'object' && o[key] !== null && o[key] !== undefined){
                        target[key] = extend(target[key], o[key]);
                    }
                    else{
                        target[key] = o[key];
                    }
                }
            }
        }
        return target;
    }
    
    /**
     * @param {World} | {Entity} object
     * @param {String} pointerType "touch" | "mouse" | "key"
     * @param {String} methodName
     * @returns {Boolean}
     */
    function checkBeforeAddEvent(object, pointerType, methodName) {
        var worldOptions, active = true;
        if(object._id > -1){
            worldOptions = object._world._ops;
            active = object._ops.active;
        }
        else{
            worldOptions = object._ops;
        }
        
        if(active === false && pointerType !== "key"){
            console.warn(methodName+" only on active objects");
            return false;
        }
        
        if(worldOptions.disableKeyEvents === true && pointerType === "key"){
            console.warn("Key events are disabled, you tried to call "+methodName);
            return false;
        }
        
        if(worldOptions.disableMouseEvents === true && pointerType === "mouse"){
            console.warn("Mouse events are disabled, you tried to call "+methodName);
            return false;
        }
        
        if(worldOptions.disableTouchEvents === true && pointerType === "touch"){
            console.warn("Touch events are disabled, you tried to call "+methodName);
            return false;
        }
        
        //everything's ok, you can add the event
        return true;
        
    }

    // these look like imports but there is no cost here
    var b2Vec2 = Box2D.Common.Math.b2Vec2;
    var b2Math = Box2D.Common.Math.b2Math;
    var b2BodyDef = Box2D.Dynamics.b2BodyDef;
    var b2Body = Box2D.Dynamics.b2Body;
    var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
    var b2Fixture = Box2D.Dynamics.b2Fixture;
    var b2World = Box2D.Dynamics.b2World;
    var shapes = Box2D.Collision.Shapes;
    var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
    var b2AABB = Box2D.Collision.b2AABB;
    
    /**
     * @_name createWorld
     * @_module boxbox
     * @_params canvas, [options]
     * @canvas element to render on
     * @options
     * <ul>
     * @gravity (default {x:0, y:10}) can be horizontal, negative, etc
     * @allowSleep (default true) bodies may sleep when they come to
     *     rest. a sleeping body is no longer being simulated, which can
     *     improve performance.
     * @scale (default 30) scale for rendering in pixels / meter
     * @tickFrequency (default 50) onTick events happen every tickFrequency milliseconds
     * @collisionOutlines (default false) render outlines over everything for debugging collisions
     * @disableTouchEvents (default false) doesn't add the touch listeners you'll declare if true
     * @disableMouseEvents (default false) doesn't add the mouse listeners you'll declare if true
     * @disableKeyEvents (default false) doesn't add the touch listeners you'll declare if true
     * @preventScroll (default false) prevents scrolling on touch devices if true
     * @boundaries will restrict your world to this boundaries when you pan, pinch, scale, etc (please use the viewport api for those purposes)
     * <ul>
     * @left
     * @right
     * @top
     * @bottom
     * </ul>
     * </ul>
     * @return a new <a href="#World">World</a>
     * @description
     without options
     <code>var canvasElem = document.getElementById("myCanvas");
     var world = boxbox.createWorld(canvasElem);</code>
     with options
     <code>var canvasElem = document.getElementById("myCanvas");
     var world = boxbox.createWorld(canvasElem, {
     &nbsp;&nbsp;gravity: {x: 0, y: 20},
     &nbsp;&nbsp;scale: 60
     });</code>
     */
    window.boxbox.createWorld = function(canvas, options) {
        var world = create(World);
        world._init(canvas, options);
        return world;
    };
    
    var WORLD_DEFAULT_OPTIONS = {
        gravity: {x:0, y:10},
        allowSleep: true,
        scale: 30,
        tickFrequency: 50,
        collisionOutlines: false,
        disableTouchEvents : false, //@added by topheman
        disableMouseEvents : false, //@added by topheman
        disableKeyEvents : false, //@added by topheman
        preventScroll : false, //@added by topheman
        _mousePan : { //@added by topheman
            disabled: true,
            excludeEntityIds: [],
            multiplier: 1
        },
        _touchPan : { //@added by topheman
            disabled: true,
            panMultiplier: 1,
            excludeEntityIds: [],
            triggerWorldEvents: true,
            allowPinch: true
        },
        _mousewheelZoom: {
            disabled: true,
            step: 0.1
        },
        boundaries:{
            top: null,
            right: null,
            bottom: null,
            left: null,
            maxScale: null //@for the moment, not released
        },
        _hasBoundaries: null //initialize on world init
    };
    
    var JOINT_DEFAULT_OPTIONS = {
        type: "distance",
        allowCollisions: false
    };
    
    /*
     * Id used to identify the world in the list of callbacks
     * could be changed to switch if you wan't to be triggered before or after the entities events
     * @added by topheman
     * @type String
     */
    var worldCallbackEventId = 'world';

    /**
     * @_name World
     * @header
     * @description contains a single self-contained physics simulation
     */
    var World = {
        
        _ops: null,
        _world: null,
        _canvas: null,
        _keydownHandlers: {},
        _keyupHandlers: {},
        _mousedownHandlers: {},//@added by topheman
        _mouseupHandlers: {},//@added by topheman
        _mousemoveHandlers: {},//@added by topheman
        _mouseinHandlers: {},//@added by topheman
        _mouseoutHandlers: {},//@added by topheman
        _mouseStartdragHandlers: {},//@added by topheman
        _mouseDragHandlers: {},//@added by topheman
        _mouseStopdragHandlers: {},//@added by topheman
        _mousePanStartdragHandler: null,//@added by topheman
        _mousePanDragHandler: null,//@added by topheman
        _mousePanStopdragHandler: null,//@added by topheman
        _touchstartHandlers: {},//@added by topheman
        _touchendHandlers: {},//@added by topheman
        _touchmoveHandlers: {},//@added by topheman
        _touchStartdragHandlers: {},//@added by topheman
        _touchDragHandlers: {},//@added by topheman
        _touchStopdragHandlers: {},//@added by topheman
        _touchAddtouchdragHandlers: {},//@added by topheman
        _touchRemovetouchdragHandlers: {},//@added by topheman
        _touchPanStartdragHandler: null,//@added by topheman
        _touchPanDragHandler: null,//@added by topheman
        _touchPanStopdragHandler: null,//@added by topheman
        _touchPanStartPinchingHandler: null,//@added by topheman
        _touchPanStopPinchingHandler: null,//@added by topheman
        _mousewheelHandlers: {},//@added by topheman
        _startContactHandlers: {},
        _finishContactHandlers: {},
        _impactHandlers: {},
        _destroyQueue: [],
        _impulseQueue: [],
        _constantVelocities: {},
        _constantForces: {},
        _entities: {},
        _nextEntityId: 0,
        _cameraX: 0,
        _cameraY: 0,
        _onRender: [],
        _onTick: [],
        _creationQueue: [],
        _positionQueue: [],
        _pause: false,//@added by topheman
        _mouseHoverEntityId: null,//@added by topheman (track the entity which hovered) - used to track entities for mousein/mouseout events
        _mouseDraggingEntityId: null,//@added by topheman (track the entity which is dragged)
        _touchDraggingEntityIds : [],//@added by topheman (track the entity which is dragged)
        _mouseDraggableEntityIds: [],//@added by topheman (track the entities which can be dragged)
        _touchDraggableEntityIds: [],//@added by topheman (track the entities which can be dragged)
        
        _init: function(canvasElem, options) {
            var self = this;
            var key;
            var i;
            var world;
            var listener;
            this._ops = extend(options, WORLD_DEFAULT_OPTIONS);
            this.checkListenersOptions();
            this._world = new b2World(new b2Vec2(this._ops.gravity.x,
                                                 this._ops.gravity.y),
                                                 true);
            world = this._world;
            this._canvas = canvasElem;
            this._ctx = this._canvas.getContext("2d");
            this._scale = this._ops.scale;
            
            //init viewport namespace with a reference to world
            this.viewport = (function(world){
                return {
                    _world : world,
        
                    /**
                     * 
                     * @_name viewport&#46;getCurrentWindowInfos
                     * @_module world
                     * @description Returns the position/size/scale the of the current viewport
                     * @return viewportInfos
                     * @viewportInfos
                     * <ul>
                     * @x
                     * @y
                     * @width
                     * @height
                     * @scale
                     * </ul>
                     * @added by topheman
                     */
                    getCurrentWindowInfos : function(){
                        var result, camera = this._world.camera(), scale = this._world.scale();
                        result = {
                            x : camera.x,
                            y : camera.y,
                            width : this._world._canvas.width / scale,
                            height : this._world._canvas.height / scale,
                            scale : scale
                        };

                        return result;
                    },
        
                    /**
                     * 
                     * @_name viewport&#46;getScaledWindowInfos
                     * @_module world
                     * @_params newScale
                     * @newScale
                     * @description Returns the position/size/scale the of the rescaled viewport, according to the boundaries (used by scaleTo)
                     * @newScale New scale to apply
                     * @overrideCurrentViewport Object typeof viewportInfos, to override the currentViewport (to apply this method to this "overrideCurrentViewport")
                     * @preventLoop Boolean prevent infinite loops
                     * @return viewportInfos
                     * @viewportInfos
                     * <ul>
                     * @x
                     * @y
                     * @width
                     * @height
                     * @scale
                     * </ul>
                     * @added by topheman
                     */
                    //todo take account of the pointerPos or the event (for the moment scaling on the center of the viewport)
                    getScaledWindowInfos: function(newScale, overrideCurrentViewport, preventLoop){
                        var rescaledViewport = {},
                            currentViewport = overrideCurrentViewport ? overrideCurrentViewport : this.getCurrentWindowInfos(),
                            boundaries = this._world._ops.boundaries,
                            canvasWidth = this._world._canvas.width,
                            canvasHeight = this._world._canvas.height,
                            requiredWidth = canvasWidth / newScale,
                            requiredHeight = canvasHeight / newScale,
                            requiredLeft, requiredTop, requiredScale,
                            rescaledFlag = false;

                        //process requiredLeft and requiredTop from center of the viewport
                        requiredLeft = (currentViewport.width - requiredWidth)/2 + currentViewport.x;
                        requiredTop = (currentViewport.height - requiredHeight)/2 + currentViewport.y;
                        requiredScale = newScale;
                        
                        //check for rescale in/out necessity to stick with the opposit borders of the restrict stage
                        if(boundaries.top !== null && boundaries.bottom !== null){
                            //check for scale out need
                            if(requiredScale > boundaries.maxScale){
                                
                            }
                            //check for scale in need
                            if(requiredHeight > (boundaries.bottom - boundaries.top) ){
                                requiredWidth = (requiredWidth * (boundaries.bottom - boundaries.top))/requiredHeight;
                                requiredHeight = boundaries.bottom - boundaries.top;
                                requiredScale = this._world._canvas.height / requiredHeight;
                                rescaledFlag = true;
                            }
                        }
                        if(boundaries.right !== null && boundaries.left !== null){
                            //check for scale out need
                            if(requiredScale > boundaries.maxScale){
                                
                            }
                            //check for scale in need
                            if(requiredWidth > (boundaries.right - boundaries.left) ){
                                requiredHeight = (requiredHeight * (boundaries.right - boundaries.left))/requiredWidth;
                                requiredWidth = boundaries.right - boundaries.left;
                                requiredScale = this._world._canvas.width / requiredWidth;
                                rescaledFlag = true;
                            }
                        }
                        
                        //apply them to the rescaledViewport
                        rescaledViewport.x = requiredLeft;
                        rescaledViewport.y = requiredTop;
                        rescaledViewport.width = requiredWidth;
                        rescaledViewport.height = requiredHeight;
                        rescaledViewport.scale = requiredScale;
                        
                        //if need for rescale, reexecute getWindowInfosCenterTo with rescaledViewport as the "currentViewport"
                        if(rescaledFlag && typeof preventLoop === 'undefined'){
                            rescaledViewport = this.getScaledWindowInfos(newScale, rescaledViewport, true);
                        }
                        
                        return rescaledViewport;
                    },

                    /**
                     * @deprecated not sure to rely on
                     * @_name viewport&#46;getMaxWindowInfos
                     * @_module world
                     * @_params forceCurrentRatio
                     * @description Returns the position/size/scale of the map that would cover all the objects present in the world
                     * @forceCurrentRatio true will force with the current ratio of the canvas
                     * @return viewportInfos
                     * @viewportInfos
                     * <ul>
                     * @x
                     * @y
                     * @width
                     * @height
                     * @scale
                     * </ul>
                     * @added by topheman
                     */
                    //todo adjust process for stageRatio < 1
                    getMaxWindowInfos : function(forceCurrentRatio){
                        var i,tmpPosition,tmpRadius,tmpAngle, body,vertices,tmpVertices,j,currentWindowInfos,stageRatio,
                            x = [],y = [], minX, maxX, minY, maxY, result,
                            canvasWidth = this._world._canvas.width,
                            canvasHeight = this._world._canvas.height,
                            newX,newY, nonRescaledWorldWidth, nonRescaledWorldHeight,
                            currentScale = this._world.scale();

                        for (i in this._world._entities){
                            tmpPosition = this._world._entities[i].position();
                            tmpAngle    = this._world._entities[i]._body.GetAngle();
                            if(this._world._entities[i]._ops.shape === 'circle'){
                                tmpRadius = this._world._entities[i]._ops.radius;
                                x.push(tmpPosition.x+tmpRadius);
                                x.push(tmpPosition.x-tmpRadius);
                                y.push(tmpPosition.y+tmpRadius);
                                y.push(tmpPosition.y-tmpRadius);
                            }
                            else {
                                body = this._world._entities[i]._body;
                                vertices = body.GetFixtureList().GetShape().GetVertices();
                                tmpVertices = {};
                                for(j= 0; j < vertices.length; j++){
                                    tmpVertices[j] = body.GetWorldPoint(vertices[j]);
                                    x.push(tmpVertices[j].x);
                                    y.push(tmpVertices[j].y);
                                }
                            }
                        }
                        x.sort(function(a,b){return a-b;});
                        y.sort(function(a,b){return a-b;});
                        minX = x[0];
                        maxX = x[x.length - 1];
                        minY = y[0];
                        maxY = y[y.length - 1];

                        result = {
                            x : minX,
                            y : minY,
                            width : maxX - minX,
                            height : maxY - minY,
                            scale : currentScale
                        };

                        if(forceCurrentRatio){
                            currentWindowInfos = this.getCurrentWindowInfos();
                            nonRescaledWorldWidth = result.width;
                            nonRescaledWorldHeight = result.height;
                            stageRatio = nonRescaledWorldWidth/nonRescaledWorldHeight;
                            result.width = Math.max(result.height * currentWindowInfos.width/currentWindowInfos.height, result.width);
                            result.height = Math.max(result.width * currentWindowInfos.height/currentWindowInfos.width, result.height);
                            result.scale = Math.min(canvasWidth/nonRescaledWorldWidth,canvasHeight/nonRescaledWorldHeight);
                            if(stageRatio > 1){
                                newX = Math.max( (result.x - result.width + nonRescaledWorldWidth)/2, (result.x - result.width + nonRescaledWorldWidth) );
                                newY = Math.min( (result.y - result.height + nonRescaledWorldHeight)/2, (result.y - result.height + nonRescaledWorldHeight) );
                            }
                            else{
                                newX = Math.min( (result.x + result.width - nonRescaledWorldWidth)/2, (result.x + result.width - nonRescaledWorldWidth) );
                                newY = Math.max( (result.y - result.height + nonRescaledWorldHeight)/2, (result.y - result.height + nonRescaledWorldHeight) );
                                console.warn('Troubles with computing the correct x/y coordinates with stageRatio < 1 worlds');
                            }
                            result.x = newX;
                            result.y = newY;
                        }

                        return result;

                    },

                    /**
                     * @deprecated not sure to rely on
                     * @_name viewport&#46;focusAll
                     * @_module world
                     * @description Adjust the camera to see all the objects present in the world and centers the camera
                     * @return viewportInfos
                     * @viewportInfos
                     * <ul>
                     * @x
                     * @y
                     * @width
                     * @height
                     * @scale
                     * </ul>
                     * @added by topheman
                     */
                    focusAll : function(){
                        var windowInfos = this.getMaxWindowInfos(true);
                        this._world.camera({x:windowInfos.x,y:windowInfos.y});
                        this._world.scale(windowInfos.scale);
                        return windowInfos;
                    },

                    /**
                     * 
                     * @_name viewport&#46;checkBoundaries
                     * @_module world
                     * @_params viewport
                     * @description Returns a viewport that fits inside the boundaries of the world
                     * @return viewportInfos
                     * @viewportInfos
                     * <ul>
                     * @x
                     * @y
                     * @width
                     * @height
                     * @scale
                     * @outOfBounds true if the viewport needs any changes (so if it needs to apply world.camera() and world.scale())
                     * </ul>
                     * @added by topheman
                     */
                    checkBoundaries: function(viewport){
                        var result = {
                            x: viewport.x,
                            y: viewport.y,
                            width: viewport.width,
                            height: viewport.height,
                            scale: viewport.scale,
                            outOfBounds: false
                        },
                            boundaries = this._world._ops.boundaries,
                            outOfBounds = false,
                            preserveScaleX = 0,
                            preserveScaleY = 0;
                    
                        if(boundaries.left !== null && viewport.x < boundaries.left){
                            result.x = boundaries.left;
                            outOfBounds = true;
                            preserveScaleX++;
                        }
                        if(boundaries.top !== null && viewport.y < boundaries.top){
                            result.y = boundaries.top;
                            outOfBounds = true;
                            preserveScaleY++;
                        }
                        if(boundaries.right !== null && (viewport.x + viewport.width) > boundaries.right){
                            result.x = boundaries.right - viewport.width;
                            outOfBounds = true;
                            preserveScaleX++;
                        }
                        if(boundaries.bottom !== null && (viewport.y + viewport.height) > boundaries.bottom){
                            result.y = boundaries.bottom - viewport.height;
                            outOfBounds = true;
                            preserveScaleY++;
                        }
                        
                        if(preserveScaleX > 1){
                            //dont scale out
                            result.width =  boundaries.right - boundaries.left;
                            result.x = boundaries.left;
                            result.scale = this._world._canvas.width / result.width;
                        }
                        else if(preserveScaleY > 1){
                            //dont scale out
                            result.height = boundaries.bottom - boundaries.top;
                            result.y = boundaries.top;
                            result.scale = this._world._canvas.height / result.height;
                        }
                        result.outOfBounds = outOfBounds;
                        return result;
                    },                            

                    /**
                     * 
                     * @_name viewport&#46;getWindowInfosCenterTo
                     * @_module world
                     * @_params position
                     * @description Returns a viewport rescaled and repositionned, centered on {x,y}, according to the boundaries (used by centerTo)
                     * @position {x,y}
                     * @overrideCurrentViewport Object typeof viewportInfos, to override the currentViewport (to apply this method to this "overrideCurrentViewport")
                     * @preventLoop Boolean prevent infinite loops
                     * @return viewportInfos
                     * @viewportInfos
                     * <ul>
                     * @x
                     * @y
                     * @width
                     * @height
                     * @scale
                     * </ul>
                     * @added by topheman
                     */
                    getWindowInfosCenterTo : function(position, overrideCurrentViewport, preventLoop){
                        
                        if(typeof position.x === 'undefined' || typeof position.y === 'undefined'){
                            throw new Error("x and y must be specified in position");
                        }
                        
                        var requiredTop, requiredLeft, requiredWidth, requiredHeight, requiredScale, //required parameters, non rescaled if x,y are center of viewport
                            boundaries = this._world._ops.boundaries,
                            currentViewport = overrideCurrentViewport ? overrideCurrentViewport : this.getCurrentWindowInfos(),
                            rescaledViewport = {},
                            rescaledFlag = false;

                        //non rescaled viewportInfos from center coordinated x,y
                        requiredScale       = currentViewport.scale;
                        requiredWidth       = currentViewport.width;
                        requiredHeight      = currentViewport.height;
                        requiredTop         = position.y - requiredHeight/2;
                        requiredLeft        = position.x - requiredWidth/2;
                        
                        //check for rescale in/out necessity to stick with the opposit borders of the restrict stage
                        if(boundaries.top !== null && boundaries.bottom !== null){
                            //check for scale out need
                            if(requiredScale > boundaries.maxScale){
                                
                            }
                            //check for scale in need
                            if(requiredHeight > (boundaries.bottom - boundaries.top) ){
                                requiredWidth = (requiredWidth * (boundaries.bottom - boundaries.top))/requiredHeight;
                                requiredHeight = boundaries.bottom - boundaries.top;
                                requiredScale = this._world._canvas.height / requiredHeight;
                                rescaledFlag = true;
                            }
                        }
                        if(boundaries.right !== null && boundaries.left !== null){
                            //check for scale out need
                            if(requiredScale > boundaries.maxScale){
                                
                            }
                            //check for scale in need
                            if(requiredWidth > (boundaries.right - boundaries.left) ){
                                requiredHeight = (requiredHeight * (boundaries.right - boundaries.left))/requiredWidth;
                                requiredWidth = boundaries.right - boundaries.left;
                                requiredScale = this._world._canvas.width / requiredWidth;
                                rescaledFlag = true;
                            }
                        }
                        
                        //apply them to the rescaledViewport
                        rescaledViewport.x = requiredLeft;
                        rescaledViewport.y = requiredTop;
                        rescaledViewport.width = requiredWidth;
                        rescaledViewport.height = requiredHeight;
                        rescaledViewport.scale = requiredScale;
                        
                        //if need for rescale, reexecute getWindowInfosCenterTo with rescaledViewport as the "currentViewport"
                        if(rescaledFlag && typeof preventLoop === 'undefined'){
                            rescaledViewport = this.getWindowInfosCenterTo(position, rescaledViewport, true);
                        }
                        
                        //then, after the rescaling (if necessary), apply checkBoundaries to reposition the viewport according to the boundaries of the world
                        return this.checkBoundaries(rescaledViewport);
                        
                    },
                            
                    /**
                     * 
                     * @_name viewport&#46;isRestricted
                     * @_module world
                     * @description Returns true if the world is restricted with boundaries
                     * @return Boolean
                     * @added by topheman
                     */
                    isRestricted: function(){
                        //use cache the times after
                        if(this._world._ops._hasBoundaries !== null){
                            return this._world._ops._hasBoundaries;
                        }
                        //first time cache the var this._world._ops._hasBoundaries (no local variable used, this is the reason of the writting bellow)
                        for(var i in Object.keys(this._world._ops.boundaries)){
                            if(['top','bottom','left','right'].indexOf(Object.keys(this._world._ops.boundaries)[i]) > -1){
                                this._world._ops._hasBoundaries = true;
                                return true;
                            }
                        }
                        this._world._ops._hasBoundaries = false;
                        return this._world._ops._hasBoundaries;
                    }, 
                            
                    /**
                     * 
                     * @_name viewport&#46;centerToStage
                     * @_module world
                     * @description Centers the viewport to the center of the boundaries of the world - and adjust scale if necessary<br>Does nothing if no boundaries<br>Called on init if there are boundaries
                     * @return Boolean
                     * @added by topheman
                     */
                    centerToStage: function(){
                        var boundaries = this._world._ops.boundaries,
                            currentViewport = null,
                            center = {};
                        if(this.isRestricted()){
                            if(boundaries.right !== null && boundaries.left !== null){
                                center.x = (boundaries.right - boundaries.left) /2 + boundaries.left;
                            }
                            else if(boundaries.right !== null){
                                center.x = boundaries.right;
                            }
                            else if(boundaries.left !== null){
                                center.x = boundaries.left;
                            }
                            else{
                                currentViewport = currentViewport === null ? this.getCurrentWindowInfos() : currentViewport;
                                center.x = currentViewport.x + currentViewport.width/2;
                            }
                            if(boundaries.top !== null && boundaries.bottom !== null){
                                center.y = (boundaries.bottom - boundaries.top) /2 + boundaries.top;
                            }
                            else if(boundaries.top !== null){
                                center.y = boundaries.top;
                            }
                            else if(boundaries.bottom !== null){
                                center.y = boundaries.bottom;
                            }
                            else{
                                currentViewport = currentViewport === null ? this.getCurrentWindowInfos() : currentViewport;
                                center.y = currentViewport.y + currentViewport.height/2;
                            }
                            this.centerTo(center);
                        }
                            
                    },

                    /**
                     * 
                     * @_name viewport&#46;centerTo
                     * @_module world
                     * @_params {x,y} or Entity
                     * @description Centers the viewport to {x,y} - and adjust scale if necessary, according to the boundaries of the world
                     * @return viewport
                     * @viewportInfos
                     * <ul>
                     * @x
                     * @y
                     * @width
                     * @height
                     * @scale
                     * </ul>
                     * @added by topheman
                     */
                    centerTo: function(position){
                        position = position.position ? position.position() : position;
                        var windowInfos = this.getWindowInfosCenterTo(position);
                        this._world.camera({x:windowInfos.x,y:windowInfos.y});
                        this._world.scale(windowInfos.scale);
                        return windowInfos;
                    },

                    /**
                     * 
                     * @_name viewport&#46;scaleTo
                     * @_module world
                     * @_params scale
                     * @description Rescales the viewport, according to the boundaries of the world
                     * @return viewport
                     * @viewportInfos
                     * <ul>
                     * @x
                     * @y
                     * @width
                     * @height
                     * @scale
                     * </ul>
                     * @added by topheman
                     */   
                    scaleTo: function(scale){
                        var rescaledViewport;
                
                        //rescale
                        rescaledViewport = this.getScaledWindowInfos(scale);
                        
                        //prevent 0 or negative scale
                        if(rescaledViewport.scale > 0){
                            
                            //check viewport boundarie
                            rescaledViewport = this.checkBoundaries(rescaledViewport);
                            
                            //update viewport
                            this._world.camera({x: rescaledViewport.x,y : rescaledViewport.y});
                            this._world.scale(rescaledViewport.scale);
                        }
                    }
 
                };
            })(this);
            
            //repositions / rescales the viewport according to the boundaries (if any) of the world @added by topheman
            this.viewport.centerToStage();
            
            // Set up rendering on the provided canvas
            if (this._canvas !== undefined) {
                
                // debug rendering
                if (this._ops.debugDraw) {
                    var debugDraw = new b2DebugDraw();
                    debugDraw.SetSprite(this._canvas.getContext("2d"));
                    debugDraw.SetDrawScale(this._scale); // TODO update this if changed?
                    debugDraw.SetFillAlpha(0.3);
                    debugDraw.SetLineThickness(1.0);
                    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
                    world.SetDebugDraw(debugDraw);
                }                

                // game loop (onTick events)
                window.setInterval(function() {
                    var i;
                    var ctx;
                    for (i = 0; i < self._onTick.length; i++) {
                        ctx = self._onTick[i].ctx;
                        if (!ctx._destroyed) {
                            self._onTick[i].fun.call(ctx);
                        }
                    }
                }, this._ops.tickFrequency);
                
                // animation loop
                (function animationLoop(){

                    var key;
                    var entity;
                    var v;
                    var impulse;
                    var f;
                    var toDestroy;
                    var id;
                    var o;

                    // set velocities for this step
                    for (key in self._constantVelocities) {
                        v = self._constantVelocities[key];
                        v.body.SetLinearVelocity(new b2Vec2(v.x, v.y),
                                                 v.body.GetWorldCenter());
                    }

                    // apply impulses for this step
                    for (i = 0; i < self._impulseQueue.length; i++) {
                        impulse = self._impulseQueue.pop();
                        impulse.body.ApplyImpulse(new b2Vec2(impulse.x, impulse.y),
                                                  impulse.body.GetWorldCenter());
                    }               
                    
                    // set forces for this step
                    for (key in self._constantForces) {
                        f = self._constantForces[key];
                        f.body.ApplyForce(new b2Vec2(f.x, f.y),
                                          f.body.GetWorldCenter());
                    }

                    for (key in self._entities) {
                        entity = self._entities[key];
                        v = entity._body.GetLinearVelocity();
                        if (v.x > entity._ops.maxVelocityX) {
                            v.x = entity._ops.maxVelocityX;
                        }
                        if (v.x < -entity._ops.maxVelocityX) {
                            v.x = -entity._ops.maxVelocityX;
                        }
                        if (v.y > entity._ops.maxVelocityY) {
                            v.y = entity._ops.maxVelocityY;
                        }
                        if (v.y < -entity._ops.maxVelocityY) {
                            v.y = -entity._ops.maxVelocityY;
                        }
                    }
                    
                    // destroy
                    for (i = 0; i < self._destroyQueue.length; i++) {
                        toDestroy = self._destroyQueue.pop();
                        id = toDestroy._id;
                        world.DestroyBody(toDestroy._body);
                        toDestroy._destroyed = true;
                        delete self._keydownHandlers[id];
                        delete self._keyupHandlers[id];//@added by topheman
                        delete self._mousedownHandlers[id];//@added by topheman
                        delete self._mousemoveHandlers[id];//@added by topheman
                        delete self._mouseupHandlers[id];//@added by topheman
                        delete self._mouseinHandlers[id];//@added by topheman
                        delete self._mouseoutHandlers[id];//@added by topheman
                        delete self._mouseStartdragHandlers[id];//@added by topheman
                        delete self._mouseDragHandlers[id];//@added by topheman
                        delete self._mouseStopdragHandlers[id];//@added by topheman
                        delete self._touchstartHandlers[id];//@added by topheman
                        delete self._touchmoveHandlers[id];//@added by topheman
                        delete self._touchendHandlers[id];//@added by topheman
                        delete self._touchStartdragHandlers[id];//@added by topheman
                        delete self._touchDragHandlers[id];//@added by topheman
                        delete self._touchStopdragHandlers[id];//@added by topheman
                        delete self._touchAddtouchdragHandlers[id];//@added by topheman
                        delete self._touchRemovetouchdragHandlers[id];//@added by topheman
                        delete self._mousewheelHandlers[id];//@added by topheman
                        delete self._startContactHandlers[id];
                        delete self._finishContactHandlers[id];
                        delete self._impactHandlers[id];
                        self._destroyQueue.splice(id, 1);
                        self._impulseQueue.splice(id, 1);
                        delete self._constantVelocities[id];
                        delete self._constantForces[id];
                        delete self._entities[id];
                    }

                    // framerate, velocity iterations, position iterations
                    //@modified by topheman
                    if(self._pause === false){
                        world.Step(1 / 60, 10, 10);
                    }
                    else{
                        world.Step(null);
                    }

                    // create
                    for (i = 0; i < self._creationQueue.length; i++) {
                        self.createEntity(self._creationQueue.pop());
                    }

                    // position
                    for (i = 0; i < self._positionQueue.length; i++) {
                        o = self._positionQueue.pop();
                        o.o.position.call(o.o, o.val);
                    }
                    
                    // render stuff
                    self._canvas.width = self._canvas.width;
                    for (key in self._entities) {
                      entity = self._entities[key];
                      entity._draw(self._ctx,
                                   entity.canvasPosition().x,
                                   entity.canvasPosition().y);
                    }
                    for (i = 0; i < self._onRender.length; i++) {
                      self._onRender[i].fun.call(self._onRender[i].ctx, self._ctx);
                    }
                    
                    world.ClearForces();
                    world.DrawDebugData();
                    window.requestAnimationFrame(animationLoop);
                }());
                
                /**
                 * Objects managing dragging
                 */
                
                /**
                 * @function PanDraggingObject
                 * @param {DraggingInfos}
                 * @added by topheman
                 */
                var PanDraggingObject = function(originalDraggingInfos){
                    this.infos = [];
                    
                    /**
                     * Adds a snapshot of the viewport to the PanDraggingObject
                     * @param {DraggingInfos} draggingInfos
                     */
                    this.addDraggingInfos = function(draggingInfos){
                        this.infos.push(draggingInfos);
                    };
                    this.getOriginalDraggingInfos = function(){
                        return this.infos[0];
                    };
                    this.getLastDraggingInfos = function(){
                        return this.infos[this.infos.length-1];
                    };
                    
                    /**
                     * Returns a viewportInfos object (to be used in the viewport modifying methods callbacks such as .mousePan or .touchPan)
                     * @param {MouseEvent} | {TouchEvent} e
                     * @param {String} mode
                     * @return {Object} ViewportInfos
                     */
                    this.getViewportInfos = function(e,mode){
                        var originalDraggingInfos   = this.getOriginalDraggingInfos(),
                            lastDraggingInfos       = this.getLastDraggingInfos(),
                            currentRelativePointer  = {
                                x : (e.offsetX || e.layerX || e.pageX) / lastDraggingInfos.viewport.scale,
                                y : (e.offsetY || e.layerY || e.pageY) / lastDraggingInfos.viewport.scale
                            },
                            result, multiplier;
                        switch(mode){
                            case 'touch' :
                                multiplier = self._ops._touchPan.panMultiplier;
                                break;
                            case 'mouse' :
                                multiplier = self._ops._mousePan.multiplier;
                                break;
                            default :
                                multiplier = 1;
                        }
                        result = {
                            originalViewport : {
                                x       : originalDraggingInfos.viewport.x,
                                y       : originalDraggingInfos.viewport.y,
                                width   : originalDraggingInfos.viewport.width,
                                height  : originalDraggingInfos.viewport.height,
                                scale   : originalDraggingInfos.viewport.scale
                            },
                            viewport : {
                                x : lastDraggingInfos.viewport.x - (currentRelativePointer.x - lastDraggingInfos.relativePointer.x)*multiplier,
                                y : lastDraggingInfos.viewport.y - (currentRelativePointer.y - lastDraggingInfos.relativePointer.y)*multiplier,
                                width : lastDraggingInfos.viewport.width,
                                height : lastDraggingInfos.viewport.height,
                                scale : lastDraggingInfos.viewport.scale
                            }
                        };
                        return result;
                    };

                    //init the object
                    this.addDraggingInfos(originalDraggingInfos);
                };
                
                /**
                 * @function DraggingInfos
                 * @param {MouseEvent} | {TouchEvent} mouse or touch event at the time of the creation of the DraggingInfos (the one that manage the pan)
                 * @param {Object} Viewport @optional
                 * @added by topheman
                 */
                var DraggingInfos = function(e, overrideViewport){
                    //no overrideViewport specified, take the current one
                    if(!overrideViewport){
                        overrideViewport = self.viewport.getCurrentWindowInfos();
                    }
                    //this is only a relative position in the world (doesn't takes in account the camera position)
                    this.relativePointer = {
                            x : (e.offsetX || e.layerX || e.pageX) / self.scale(),
                            y : (e.offsetY || e.layerY || e.pageY) / self.scale(),
                            identifier : e.idenfier !== null ? e.identifier : null
                    };
                    this.viewport = {
                        x : overrideViewport.x,
                        y : overrideViewport.y,
                        width : overrideViewport.width,
                        height : overrideViewport.height,
                        scale : overrideViewport.scale
                    };
                };
                
                /**
                 * Key events
                 */
                if(!self._ops.disableKeyEvents){ //@added by topheman (only the test part)
                    // keyboard events
                    window.addEventListener('keydown', function(e) {
                        for (var key in self._keydownHandlers) {
                            if (!self._entities[key]._destroyed) {
                                self._keydownHandlers[key].call(self._entities[key], e);
                            }
                        }
                    }, false);
                    window.addEventListener('keyup', function(e) {
                        for (var key in self._keyupHandlers) {
                            if (!self._entities[key]._destroyed) {
                                self._keyupHandlers[key].call(self._entities[key], e);
                            }
                        }
                    }, false);
                }
                
                
                /**
                 * To prevent trigger twice the same touchstart event (bug on touchstart inside touchmove events)
                 * @added by topheman
                 */
                var previousTouchStartIdentifier = null;
                
                /*
                 * Mouse events
                 * @added by topheman
                 */
                
                /*
                 * @function mousedownHandler
                 * @param {MouseEvent} e
                 * @added by topheman
                 */
                var mousedownHandler = function(e) {
                    var mousePos = getEntityFromMouse(e);
                    _world_mousedownHandler(e, mousePos);
                    for (var key in self._mousedownHandlers) {
                        if(key === worldCallbackEventId){
                            self._mousedownHandlers[key].call(self, e, mousePos);
                        }
                        else if (mousePos.entity && mousePos.entity._id == key && !mousePos.entity._destroyed) {
                            self._mousedownHandlers[key].call(mousePos.entity, e, mousePos);
                        }
                    }
                };
                
                /*
                 * @function mouseupHandler
                 * @param {MouseEvent} e
                 * @added by topheman
                 */
                var mouseupHandler = function(e) {
                    var mousePos = getEntityFromMouse(e);
                    _world_mouseupHandler(e, mousePos);
                    for (var key in self._mouseupHandlers) {
                        if(key === worldCallbackEventId){
                            self._mouseupHandlers[key].call(self, e, mousePos);
                        }
                        else if (mousePos.entity && mousePos.entity._id == key && !mousePos.entity._destroyed) {
                            self._mouseupHandlers[key].call(mousePos.entity, e, mousePos);
                        }
                    }
                };
                
                /*
                 * @function mousemoveHandler
                 * @param {MouseEvent} e
                 * @added by topheman
                 */
                var mousemoveHandler = function(e) {
                    var mousePos = getEntityFromMouse(e);
                    _world_mousemoveHandler(e, mousePos);
                    for (var key in self._mousemoveHandlers) {
                        if(key === worldCallbackEventId){
                            self._mousemoveHandlers[key].call(self, e, mousePos);
                        }
                        else if (mousePos.entity && mousePos.entity._id == key && !mousePos.entity._destroyed) {
                            self._mousemoveHandlers[key].call(mousePos.entity, e, mousePos);
                        }
                    }
                };
                
                /*
                 * Callback binded on the mouseover eventListener of the canvas (so only for the world, not the entities)
                 * @function mouseinHandler
                 * @param {MouseEvent} e
                 * @added by topheman
                 */
                var mouseinHandler = function (e) {
                    var mousePos = getEntityFromMouse(e);
                    _world_mouseinHandler(e, mousePos);
                    if(self._mouseinHandlers[worldCallbackEventId]){
                        self._mouseinHandlers[worldCallbackEventId].call(self, e, mousePos);
                    }
                };
                
                /*
                 * Callback binded on the mouseout eventListener of the canvas (so only for the world, not the entities)
                 * @function mouseinHandler
                 * @param {MouseEvent} e
                 * @added by topheman
                 */
                var mouseoutHandler = function (e) {
                    var mousePos = getEntityFromMouse(e);
                    _world_mouseoutHandler(e, mousePos);
                    if(self._mouseoutHandlers[worldCallbackEventId]){
                        self._mouseoutHandlers[worldCallbackEventId].call(self, e, mousePos);
                    }
                };
                
                /*
                 * Callback binded on the mousewheel eventListener of the canvas (so only for the world, not the entities)
                 * @function mousewheelHandler
                 * @param {MouseEvent} e
                 * @added by topheman
                 */
                var mousewheelHandler = function(e) {
                    var mousePos = getEntityFromMouse(e),
                        delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))),
                        callMousewheelzoom = true;
                    mousePos.delta = delta;
                    for (var key in self._mousewheelHandlers) {
                        if(key === worldCallbackEventId){
                            self._mousewheelHandlers[key].call(self, e, mousePos);
                        }
                        else if (mousePos.entity && mousePos.entity._id == key && !mousePos.entity._destroyed) {
                            self._mousewheelHandlers[key].call(self._entities[key], e, mousePos);
                            callMousewheelzoom = false;//if an entity catches the mousewheel event, don't trigger the mousewheelZoomEvent
                        }
                    }
                    //update the viewport if mousePanning
                    //at the opposite of the others events (where the special events are called before the user events), here we call it after
                    _world_mousewheelHandler(e, mousePos,callMousewheelzoom);
                    e.preventDefault();
                };
                
                /*
                 * Returns an object with the entity corresponding to the MouseEvent
                 * @param {MouseEvent} e
                 * @returns {Object}
                 * @added by topheman
                 */
                var getEntityFromMouse = function (e){
                    var mousePos = self.calculateWorldPositionFromPointer(e);
                    var entityX = mousePos.x,
                    entityY = mousePos.y;
                    mousePos.entity = self.getEntityByPosition(entityX,entityY);
                    return mousePos;
                };
                
                /*
                 * Returns an object with the entity and the identifier corresponding to the touch
                 * @param {Touch} touch
                 * @returns {Object}
                 * @added by topheman
                 */
                var getEntityFromTouch = function (touch){
                    var touchPos = self.calculateWorldPositionFromPointer(touch);
                    var entityX = touchPos.x,
                    entityY = touchPos.y;
                    touchPos.entity = self.getEntityByPosition(entityX,entityY);
                    touchPos.touchIdentifier = touch.identifier;
                    return touchPos;
                };
                
                /*
                 * Returns an array of infos about the changed touches
                 * @param {TouchEvent} e
                 * @returns {Array}[{TouchInfos}]
                 */
                var getTouchInfos = function(e){
                    var infos = [],i;
                    for(i=0; i < e.changedTouches.length; i++){
                        if(e.changedTouches[i]){
                            infos.push(getEntityFromTouch(e.changedTouches[i]));
                        }
                    }
                    return infos;
                };
                
                /*
                 * @function touchstartHandler
                 * @param {TouchEvent} e
                 * @added by topheman
                 */
                var touchstartHandler = function (e) {
                    
                    //prevent triggering twice the same event on the same touch identifier
                    if(previousTouchStartIdentifier === e.changedTouches[0].identifier){
                        previousTouchStartIdentifier = null;
                        return false;
                    }
                    else{
                        previousTouchStartIdentifier = e.changedTouches[0].identifier;
                    }
                    
                    var touchInfos = getTouchInfos(e),i,key,
                        //prevent triggering non welcomed events while panning
                        allowWorldEvents = self.isAllowedToTriggerTouchEvents(),
                        allowEntityEvents = self.isTouchNotPanningNorPinching();
                    _world_touchstartHandler(e, touchInfos);
                    for(key in self._touchstartHandlers) {
                        if(key === worldCallbackEventId && allowWorldEvents){
                            self._touchstartHandlers[key].call(self,e,touchInfos);
                        }
                        else if(allowEntityEvents){
                            for (i in touchInfos){
                                if(touchInfos[i].entity && touchInfos[i].entity._id == key && !touchInfos[i].entity._destroyed){
                                    self._touchstartHandlers[key].call(touchInfos[i].entity,e,touchInfos[i]);
                                }
                            }
                        }
                    }
                    e.preventDefault();
                };
                
                
                /*
                 * @function touchmoveHandler
                 * @param {TouchEvent} e
                 * @added by topheman
                 */
                var touchmoveHandler = function(e) {
                    var touchInfos = getTouchInfos(e),i,key,
                        //prevent triggering non welcomed events while panning
                        allowWorldEvents = self.isAllowedToTriggerTouchEvents(),
                        allowEntityEvents = self.isTouchNotPanningNorPinching();
                    _world_touchmoveHandler(e, touchInfos);
                    for(key in self._touchmoveHandlers) {
                        if(key === worldCallbackEventId && allowWorldEvents){
                            self._touchmoveHandlers[key].call(self,e,touchInfos);
                        }
                        else if(allowEntityEvents){
                            for (i in touchInfos){
                                if(touchInfos[i].entity && touchInfos[i].entity._id == key && !touchInfos[i].entity._destroyed){
                                    self._touchmoveHandlers[key].call(touchInfos[i].entity,e,touchInfos[i]);
                                }
                            }
                        }
                    }
                    e.preventDefault();
                };
                
                
                /*
                 * @function touchendHandler
                 * @param {TouchEvent} e
                 * @added by topheman
                 */
                var touchendHandler = function(e) {
                    
                    //update previousTouchStartIdentifier for touchstartHandler to prevent triggering twice the same event on the same touch identifier
                    if(previousTouchStartIdentifier === e.changedTouches[0].identifier){
                        previousTouchStartIdentifier = null;
                    }
                    
                    var touchInfos = getTouchInfos(e),i,key,
                        //prevent triggering non welcomed events while panning
                        allowWorldEvents = self.isAllowedToTriggerTouchEvents(),
                        allowEntityEvents = self.isTouchNotPanningNorPinching();
                    _world_touchendHandler(e, touchInfos);
                    for(key in self._touchendHandlers) {
                        if(key === worldCallbackEventId && allowWorldEvents){
                            self._touchendHandlers[key].call(self,e,touchInfos);
                        }
                        else if(allowEntityEvents){
                            for (i in touchInfos){
                                if(touchInfos[i].entity && touchInfos[i].entity._id == key && !touchInfos[i].entity._destroyed){
                                    self._touchendHandlers[key].call(touchInfos[i].entity,e,touchInfos[i]);
                                }
                            }
                        }
                    }
                };
                
                /*
                 * Global world events handlers
                 * Triggers specific handlers such as drag events, in/out events
                 * Also triggers public handlers @todo
                 * @added by topheman
                 * @called by their respective public handlers (before the entities handlers) see mouse events section for example
                 */
                
                /*
                 * @function _world_mousedownHandler
                 * @param {MouseEvent} e
                 * @param {Object} mousePos
                 * @description manages special events on world_mousemove such as dragEvent or panEvents
                 * @added by topheman
                 */
                var _world_mousedownHandler = function(e, mousePos){
                    // --- dragging entity part ---
                    //if no dragging active and if a click on the world is on an entity, trigger the _world_mousemoveHandlerForDragEvent,
                    //no need to loop through the entities of the world, we already have the mousePos.entity which has been clicked
                    if(self._mouseDraggingEntityId === null && mousePos.entity !== null && mousePos.entity._ops._mouseDraggable.disabled === false){
                        _world_mousemoveHandlerForDragEvent.call(mousePos.entity,e,mousePos);
                    }
                    
                    // --- pan part ---
                    //if after searching for starting a drag on an entity, after all, no drag has began, we can try to start a pan if pan is enabled
                    if(self._ops._mousePan.disabled === false && self._mouseDraggingEntityId === null){
                        //if ever we are on a non draggable entity, but it isn't on the list of excludeEntityIds for the mousePan
                        if(mousePos.entity === null || self._ops._mousePan.excludeEntityIds.indexOf(mousePos.entity._id) === -1){
                            _world_mousemoveHandlerForPanEvent.call(self,e, mousePos);
                        }
                    }
                };
                
                /*
                 * @function _world_mousemoveHandler
                 * @param {MouseEvent} e
                 * @param {Object} mousePos
                 * @description manages special events on world_mousemove such as dragEvent or panEvents
                 * @added by topheman
                 */
                var _world_mousemoveHandler = function(e, mousePos){
                    // --- dragging entity part ---
                    //if a dragging is active, trigger the _world_mousemoveHandlerForDragEvent (no matter if the mouse is on an entity)
                    if(self._mouseDraggingEntityId !== null && self._entities[self._mouseDraggingEntityId]._mouseDragging){
                        _world_mousemoveHandlerForDragEvent.call(self._entities[self._mouseDraggingEntityId],e,mousePos);
                    }
                    
                    // --- pan part ---
                    //if a pan dragging is active, trigger the _world_mousemoveHandlerForPanDragEvent
                    if(self._ops._mousePan.disabled === false && self._mousePanDragging){
                        _world_mousemoveHandlerForPanEvent.call(self,e, mousePos);
                    }
                    
                    // --- mouse in/out part ---
                    var previousHoveredEntityId = self._mouseHoverEntityId,
                    currentHoveredEntityId = null;
                    //track the hovered entity
                    for(var key in self._entities){
                        if(!self._entities[key]._destroyed && self._entities[key].checkPosition(mousePos.x,mousePos.y)){
                            currentHoveredEntityId = key;//we don't break the loop, to catch the last entity (the one on top of the canvas)
                        }
                    }
                    //update the hoverEntityId flag in the world
                    self._mouseHoverEntityId = currentHoveredEntityId;
                    //mouse in
                    if(previousHoveredEntityId === null && currentHoveredEntityId !== null && self._mouseinHandlers[currentHoveredEntityId]){
                        self._mouseinHandlers[currentHoveredEntityId].call(self._entities[currentHoveredEntityId],e, mousePos);
                    }
                    //mouse out
                    if(previousHoveredEntityId !== null && currentHoveredEntityId === null && self._mouseoutHandlers[previousHoveredEntityId]){
                        self._mouseoutHandlers[previousHoveredEntityId].call(self._entities[previousHoveredEntityId],e, mousePos);
                    }
                };
                
                /*
                 * @function _world_mouseupHandler
                 * @param {MouseEvent} e
                 * @param {Object} mousePos
                 * @description manages special events on world_mouseup such as dragEvent or panEvents
                 * @added by topheman
                 */
                var _world_mouseupHandler = function(e, mousePos){
                    //if a dragging is active, trigger the _world_mouseupHandlerForDragEvent (to stop drag)
                    if(self._mouseDraggingEntityId !== null && self._entities[self._mouseDraggingEntityId]._mouseDragging){
                        _world_mouseupHandlerForDragEvent.call(self._entities[self._mouseDraggingEntityId],e,mousePos);
                    }
                    
                    //if a pan dragging is active, trigger the _world_mousemoveHandlerForPanDragEvent
                    if(self._ops._mousePan.disabled === false && self._mousePanDragging){
                        _world_mouseupdHandlerForPanEvent.call(self,e, mousePos);
                    }
                    
                };
                
                /*
                 * @function _world_touchstartHandler
                 * @param {TouchEvent} e
                 * @param {Array}[touchInfos]
                 * @description manages special events on world_start such as dragEvent
                 * @added by topheman
                 */
                var _world_touchstartHandler = function(e, touchInfos){                    
                    //if a touch on the world is on an entity, trigger the _world_touchmoveHandlerForDragEvent
                    //but ONLY if the world isn't already panning
                    var touchInfoIndex;
                    if(self.isTouchNotPanningNorPinching() && touchInfos.length > 0){
                        for(touchInfoIndex in touchInfos){
                            if(touchInfos[touchInfoIndex].entity && touchInfos[touchInfoIndex].entity._ops._touchDraggable.disabled === false){
                                _world_touchmoveHandlerForDragEvent.call(self._entities[touchInfos[touchInfoIndex].entity._id],e,touchInfos,touchInfoIndex);
                            }
                        }
                    }
                    
                    // --- pan part ---
                    // if only one touch active, not already panning, panning enabled and not currently dragging any entity, we can start panning mode
                    if(e.touches.length === 1 && self.isTouchNotPanningNorPinching() && self._ops._touchPan.disabled === false && self._touchDraggingEntityIds.length === 0){
                        _world_touchmoveHandlerForPanEvent.call(self,e, touchInfos);
                    }
                    // if a second touch activates, whenwe already are panning and that the pinching is allowed and there is still not currently any dragging entity, we can switch from panning mode to pinching mode
                    else if(e.touches.length === 2 && self.isTouchPanning() && self._ops._touchPan.allowPinch === true && self._touchDraggingEntityIds.length === 0){
                        _world_touchmoveHandlerForPanEvent.call(self,e, touchInfos, {pinching : true});
                    }
                };
                
                /*
                 * @function _world_touchmoveHandler
                 * @param {TouchEvent} e
                 * @param {Object} touchInfos
                 * @description manages special events on world_touchmove such as dragEvent
                 * @added by topheman
                 * todo - refactor code between _world_touchmoveHandler and _world_touchendHandler
                 * toto - optimize for loop , deep object watching ...
                 */
                var _world_touchmoveHandler = function(e, touchInfos){
                    //reset the list of entityIds waiting for executing there drag callback at touchmove event
                    _world_touchmove_DragEvents_entityIdsForQueueCallback = [];
                    //-> check if the touches in the event correspond to the touches referenced in the touchDraggable entities
                    //if so, trigger the _world_touchmoveHandlerForDragEvent
                    var i,entityId,touchId,touchInfoIndex;
                    if(self._touchDraggingEntityIds.length > 0){
                        //loop through changed touches
                        for(i = 0; i < e.changedTouches.length; i++){
                            //loop through the dragging entityIds
                            for(entityId in self._touchDraggingEntityIds){
                                //loop through the moveJoints of this entity
                                for(touchId in self._entities[self._touchDraggingEntityIds[entityId]]._touchMoveJoints){
                                    //match the touchIdentifier from the changedTouches from the event To the touchIdentifier from the moveJoint of the entity
                                    if(touchId == e.changedTouches[i].identifier){
                                        //loop through touchInfos
                                        for(touchInfoIndex = 0; touchInfoIndex < touchInfos.length; touchInfoIndex++){
                                            //at last, we match the touchInfos to the correct touchIdentifier in order to pass it to the callback
                                            if(touchInfos[touchInfoIndex].touchIdentifier == touchId){
                                                if(_world_touchmove_DragEvents_entityIdsForQueueCallback.indexOf(self._touchDraggingEntityIds[entityId]) === -1){
                                                    _world_touchmove_DragEvents_entityIdsForQueueCallback.push(self._touchDraggingEntityIds[entityId]);
                                                }
                                                _world_touchmoveHandlerForDragEvent.call(self._entities[self._touchDraggingEntityIds[entityId]],e,touchInfos,touchInfoIndex);
                                                //@todo in _world_touchendHandlerForDragEvent : 
                                                // - pass only the touchInfos that are related to the entity, remove the others
                                                // - process the touchInfo specified by touchInfoIndex
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    //execute the drag events waiting in the queue
                    if(_world_touchmove_DragEvents_entityIdsForQueueCallback.length > 0){
                        for(i = 0; i < _world_touchmove_DragEvents_entityIdsForQueueCallback.length; i++){
                            if(self._touchDragHandlers[_world_touchmove_DragEvents_entityIdsForQueueCallback[i]]){
                                self._touchDragHandlers[_world_touchmove_DragEvents_entityIdsForQueueCallback[i]].call(self._entities[_world_touchmove_DragEvents_entityIdsForQueueCallback[i]],e, mergeTouchDraggableInfos(touchInfos,self._entities[_world_touchmove_DragEvents_entityIdsForQueueCallback[i]]));
                            }
                        }
                    }
                    
                    // --- pan part ---
                    //if a pan dragging is active, trigger the _world_touchmoveHandlerForPanEvent
                    if(self._ops._touchPan.disabled === false && !self.isTouchNotPanningNorPinching()){
                        _world_touchmoveHandlerForPanEvent.call(self,e, touchInfos);
                    }
                };
                
                /*
                 * @function _world_touchendHandler
                 * @param {TouchEvent} e
                 * @param {Object} touchInfos
                 * @description manages special events on world_touchend such as dragEvent
                 * @added by topheman
                 */
                var _world_touchendHandler = function(e, touchInfos){                      
                    //-> check if the touches in the event correspond to the touches referenced in the touchDraggable entities
                    //if so, trigger the _world_touchendHandlerForDragEvent
                    var i,entityId,touchId,touchInfoIndex;
                    if(self._touchDraggingEntityIds.length > 0){
                        //loop through changed touches
                        for(i = 0; i < e.changedTouches.length; i++){
                            //loop through the dragging entityIds
                            for(entityId in self._touchDraggingEntityIds){
                                //loop through the moveJoints of this entity
                                for(touchId in self._entities[self._touchDraggingEntityIds[entityId]]._touchMoveJoints){
                                    //match the touchIdentifier from the changedTouches from the event To the touchIdentifier from the moveJoint of the entity
                                    if(touchId == e.changedTouches[i].identifier){
                                        //loop through touchInfos
                                        for(touchInfoIndex = 0; touchInfoIndex < touchInfos.length; touchInfoIndex++){
                                            //at last, we match the touchInfos to the correct touchIdentifier in order to pass it to the callback
                                            if(touchInfos[touchInfoIndex].touchIdentifier == touchId){
                                                _world_touchendHandlerForDragEvent.call(self._entities[self._touchDraggingEntityIds[entityId]],e,touchInfos,touchInfoIndex);
                                                //@todo in _world_touchendHandlerForDragEvent : 
                                                // - pass only the touchInfos that are related to the entity, remove the others
                                                // - process the touchInfo specified by touchInfoIndex
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // --- pan part ---
                    // if panning or pinching has start, delegate to _world_touchendHandlerForPanEvent to end the panning or switch from pinching to panning
                    if(!self.isTouchNotPanningNorPinching()){
                        _world_touchendHandlerForPanEvent.call(self,e, touchInfos);
                    }
                };
                
                /*
                 * @function _world_mouseinHandler
                 * @param MouseEvent e
                 * @param {Object} mousePos
                 * @description manages special events on world_mousein such as the very first mousein on the world
                 * @added by topheman
                 */
                var _world_mouseinHandler = function(e, mousePos){
                    //trigger the mousein of the entity if it hasn't been trigger when the mouse entered the world (like when there was no pixels between the entity and the border of the world)
                    if(mousePos.entity && self._mouseinHandlers[mousePos.entity._id]){
                        self._mouseinHandlers[mousePos.entity._id].call(self._entities[mousePos.entity._id],e, mousePos);
                    }
                };
                
                /*
                 * @function _world_mouseoutHandler
                 * @param MouseEvent e
                 * @param {Object} mousePos
                 * @description manages special events on world_mouseout such as stopping dragging, panning (when the mouse goes out of the canvas) or trggering the mouseout of the canvas
                 * @added by topheman
                 */
                var _world_mouseoutHandler = function(e, mousePos){
                    //trigger the mouseup of the dragging - to prevent the entity to be stuck dragging if the mouse goes out of the canvas
                    if(self._mouseDraggingEntityId !== null && self._entities[self._mouseDraggingEntityId]._mouseDragging){
                        _world_mouseupHandlerForDragEvent.call(self._entities[self._mouseDraggingEntityId],e,mousePos);
                    }
                    //trigger the mouseup of the pan - to prevent the dragging world to be stuck waiting for a mouseup
                    if(self._mousePanDragging){
                        _world_mouseupdHandlerForPanEvent.call(self,e,mousePos);
                    }
                    //trigger the mouseout
                    if(self._mouseHoverEntityId !== null && self._mouseoutHandlers[self._mouseHoverEntityId]){
                        self._mouseoutHandlers[self._mouseHoverEntityId].call(self._entities[self._mouseHoverEntityId],e, mousePos);
                    }
                };
                
                /*
                 * @function _world_mousewheelHandler
                 * @param {MouseEvent} e
                 * @param {Object} mousePos
                 * @param {Boolean} callMousewheelEvent
                 * @context World
                 * @description manages special events on world_mousewheel such as the mousewheelZoom
                 * @added by topheman
                 */
                var _world_mousewheelHandler = function(e, mousewheelInfos, callMousewheelEvent){
                    var rescaledViewport, newScale;
                    if(callMousewheelEvent === true && self._ops._mousewheelZoom.disabled === false){
                        newScale = self.scale()+mousewheelInfos.delta*self._ops._mousewheelZoom.step;
                        
                        //prevent maxScale
                        if(self._ops.boundaries.maxScale !== null && newScale > self._ops.boundaries.maxScale){
                            newScale = self._ops.boundaries.maxScale;
                        }
                        
                        //rescale
                        rescaledViewport = self.viewport.getScaledWindowInfos(newScale);
                        
                        //if panning, update the viewports
                        if(self._mousePanDragging){
                            self._mousePanDragging.addDraggingInfos(new DraggingInfos(e, rescaledViewport));
                        }
                        
                        //prevent 0 or negative scale
                        if(rescaledViewport.scale > 0){
                            
                            //check viewport boundarie
                            rescaledViewport = self.viewport.checkBoundaries(rescaledViewport);
                            
                            //update viewport
                            self.camera({x: rescaledViewport.x,y : rescaledViewport.y});
                            self.scale(rescaledViewport.scale);
                        }
                    }
                };
                
                /*
                 * Special world events handlers, triggered by global world event handlers
                 * The events are splitted to emulate a bind/event system
                 * @added by topheman
                 * @called by the global world event handlers
                 */
                
                /*
                 * @function _world_mouseupHandler
                 * @param {MouseEvent} e
                 * @param {Object} mousePos
                 * @context Entity
                 * @added by topheman
                 * @triggers the startdrag or the drag event specified in the .mouseDraggable() method
                 */
                var _world_mousemoveHandlerForDragEvent = function(e, mousePos) {
                    //tag as dragging when passing for the first time
                    if(self._mouseDraggingEntityId === null && !this._mouseDragging && !this._mouseStartDrag){
                        //tag as dragging (all along the drag), with the original coordinates
                        this._mouseDragging = mousePos;
                        //tag as startDrag to know that startDrag event will have to be triggered next time on mousemove event
                        this._mouseStartDrag = true;
                        //tag the entity as dragged on the world
                        self._mouseDraggingEntityId = this._id;
                        
                        //init regularDrag
                        if(this._ops._mouseDraggable.type === 'regularDrag'){
                            if(!this._mouseMoveJoint){
                                //create the joint with the mouse on first call
                                var jointDefinition = new Box2D.Dynamics.Joints.b2MouseJointDef();

                                jointDefinition.bodyA = self._world.GetGroundBody();
                                jointDefinition.bodyB = this._body;
                                jointDefinition.target.Set(mousePos.x, mousePos.y);
                                jointDefinition.maxForce = 10000000000000000000000000000;//100000
                                jointDefinition.timeStep = 1/60;//hard coded ?!!
                                this._mouseMoveJoint = self._world.CreateJoint(jointDefinition);
                            }
                        }
                        //init eventDrag
                        else if(this._ops._mouseDraggable.type === 'eventDrag'){

                        }
                    }
                    else if(this._mouseDragging) {
                        //trigger startdrag event on the first move
                        if(this._mouseStartDrag && e.type === 'mousemove'){
                            if(self._mouseStartdragHandlers[this._id]){
                                self._mouseStartdragHandlers[this._id].call(this,e, mergeMouseInfos(mousePos,this._mouseDragging));
                            }
                            this._mouseStartDrag = false;//reset startDrag state after the first drag
                        }
                        //trigger the drag event on the next moves
                        else {
                            if(self._mouseDragHandlers[this._id]){
                                self._mouseDragHandlers[this._id].call(this,e, mergeMouseInfos(mousePos,this._mouseDragging));
                            }
                        }
                    }
                    
                    //update the move joint if regularDrag
                    if(this._mouseMoveJoint){
                        this._mouseMoveJoint.SetTarget(new Box2D.Common.Math.b2Vec2(mousePos.x, mousePos.y));
                    }
                };
                
                /*
                 * @function _world_mouseupHandlerForDragEvent
                 * @param {MouseEvent} e
                 * @param {Object} mousePos
                 * @context Entity
                 * @added by topheman
                 * @triggers the stopdrag event specified in the .mouseDraggable() method
                 */
                var _world_mouseupHandlerForDragEvent = function(e, mousePos) {
                    if(this._mouseDragging){
                        //if there is a move joint, we are in regularDrag (no test, in case the type of drag is change in the middle of a drag)
                        if (this._mouseMoveJoint) {
                            self._world.DestroyJoint(this._mouseMoveJoint);
                            this._mouseMoveJoint = null;
                        }
                        //trigger the stopdrag event (don't trigger it if the first drag hasn't happened)
                        if(this._mouseStartDrag === false && self._mouseStopdragHandlers[this._id]){
                            self._mouseStopdragHandlers[this._id].call(this,e, mergeMouseInfos(mousePos,this._mouseDragging));
                        }
                    }
                    this._mouseStartDrag = false;//reset startDrag state if there was no drag at all
                    this._mouseDragging = false;//all the dragging process is ended, reset this propertie
                    self._mouseDraggingEntityId = null;//untag the dragging entity on world
                };
                
                /*
                 * Prepares the mouseInfos object passed in callback
                 * @param {Object} mouseInfos
                 * @param {Object} originalMouseInfos
                 * @todo optimize
                 * @added by topheman
                 */
                var mergeMouseInfos = function(mouseInfos,originalMouseInfos){
                    var result = {};
                    result.position = {};
                    result.position.x = mouseInfos.x;
                    result.position.y = mouseInfos.y;
                    if(originalMouseInfos){
                        result.originalPosition = {};
                        result.originalPosition.x = originalMouseInfos.x;
                        result.originalPosition.y = originalMouseInfos.y;
                    }
                    return result;
                };
                
                /*
                 * Prepares the touchDraggableInfos object passed in callback
                 * @param {Object} touchInfos
                 * @param {Entity} entity
                 * @added by topheman
                 */
                var mergeTouchDraggableInfos = function(touchInfos,entity){
                    var entityId = entity._id,
                        result = [],
                        touchIndex,
                        touchIdentifier;
                    for(touchIndex = 0; touchIndex < touchInfos.length; touchIndex++){
                        for(touchIdentifier in entity._touchMoveJoints){
                            if(touchIdentifier == touchInfos[touchIndex].touchIdentifier){
                                result.push({
                                    touchIdentifier     : touchIdentifier,
                                    originalPosition    : entity._touchMoveJoints[touchIdentifier].originalPosition,
                                    position            : {
                                        x : touchInfos[touchIndex].x,
                                        y : touchInfos[touchIndex].y
                                    }
                                });
                            }
                        }
                    }
                    //@todo break the loop ?
                    return result;
                };
                
                
                /*
                 * @function _world_touchAddtouchHandlerForDragEvent
                 * @param {TouchEvent} e
                 * @param Array[{Object}] touchInfos
                 * @param Integer touchIndex (of the touchInfos to process)
                 * @context Entity
                 * @added by topheman
                 * @used in .touchDraggable()
                 * @description Adds a mouse joint, if it's not the first, will trigger the touchadd callback
                 */
                var _world_touchAddtouchHandlerForDragEvent = function(e, touchInfos, touchIndex){
                    var jointDefinition, touchesCount;
                    if(!this._touchMoveJoints){
                        this._touchMoveJoints = {};
                    }
                    //remove joint if there is already a joint on this touch (shouldn't happend on multitouch screen) - backwards compatibility for non mutitouch devices 
                    if(this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier] && this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier].joint){
                        self._world.DestroyJoint(this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier].joint);
                    }
                    //add the originalPosition of the touch
                    this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier] = {
                        originalPosition : {
                            x : touchInfos[touchIndex].x,
                            y : touchInfos[touchIndex].y
                        }
                    };
                    
                    //init the regularDrag (only create a joint in that case)
                    if(this._ops._touchDraggable.type === 'regularDrag'){
                        //create the joint with the touch
                        jointDefinition = new Box2D.Dynamics.Joints.b2MouseJointDef();

                        jointDefinition.bodyA = self._world.GetGroundBody();
                        jointDefinition.bodyB = this._body;
                        jointDefinition.target.Set(touchInfos[touchIndex].x, touchInfos[touchIndex].y);
                        jointDefinition.maxForce = 10000000000000000000000000000;//100000
                        jointDefinition.timeStep = 1/60;//hard coded ?!!
                        this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier].joint = self._world.CreateJoint(jointDefinition);
                    }
                    //init eventDrag
                    else if(this._ops._touchDraggable.type === 'eventDrag'){

                    }
                    
                    //trigger the touchadd callback if not the first touch on the dragging entity
                    touchesCount = Object.keys(this._touchMoveJoints).length;
                    if(touchesCount > 1 && self._touchAddtouchdragHandlers[this._id]){
                        self._touchAddtouchdragHandlers[this._id].call(this,e, mergeTouchDraggableInfos(touchInfos,this)[0],touchesCount);
                    }
                };
                
                /*
                 * @function _world_touchRemovetouchHandlerForDragEvent
                 * @param {TouchEvent} e
                 * @param Array[{Object}] touchInfos
                 * @param Integer touchIndex (of the touchInfos to process)
                 * @context Entity
                 * @added by topheman
                 * @used in .touchDraggable()
                 * @description Removes a mouse joint, if it's not the last one, triggers the touchremove callback
                 */
                var _world_touchRemovetouchHandlerForDragEvent = function(e, touchInfos, touchIndex){
                    var touchesCount,
                        touchDraggableInfos = mergeTouchDraggableInfos(touchInfos, this)[0];
                    //remove the joint
                    if(this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier]){
                        //destroy the mouseJoint created in case of a regularDrag
                        if(this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier].joint){
                            self._world.DestroyJoint(this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier].joint);
                        }
                        this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier] = null;
                        delete this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier];
                    }
                    //trigger the touchremove callback if not the first touch on the dragging entity
                    touchesCount = Object.keys(this._touchMoveJoints).length;
                    if(touchesCount > 0 && self._touchRemovetouchdragHandlers[this._id]){
                        self._touchRemovetouchdragHandlers[this._id].call(this,e, touchDraggableInfos,touchesCount);
                    }
                };
                
                /*
                 * list of the entityIds meant to trigger a touchDragEvent
                 * will be flushed at the beginning of each touchmove event
                 * will be used at the end of each touchmove event
                 * 
                 * used in _world_touchmoveHandler, so that the drag callbacks be triggered only once per touchmove
                 */
                var _world_touchmove_DragEvents_entityIdsForQueueCallback = [];
                
                /*
                 * @function _world_touchmoveHandlerForDragEvent
                 * @param {TouchEvent} e
                 * @param Array[{Object}] touchInfos
                 * @param Integer touchIndex (of the touchInfos to process)
                 * @context Entity
                 * @added by topheman
                 * @used in .touchDraggable()
                 * @description Sets up the entity for the next draggable events
                 * On the first touchmove, triggers the start drag callback
                 * Updates the position of the multiple joints set up
                 * The drag callback is triggered in _world_touchmoveHandler
                 */
                var _world_touchmoveHandlerForDragEvent = function(e, touchInfos, touchIndex) {
                    //tag as dragging when passing for the first time
                    if(e.type === 'touchstart' && self._touchDraggingEntityIds.indexOf(this._id) === -1 && !this._touchDragging && !this._touchStartDrag){
                        //force the entity not to sleep for all the time it will be dragged
                        this._body.SetSleepingAllowed(false);
                        //tag as dragging (all along the drag)
                        this._touchDragging = true;
                        //tag as startDrag to know that startDrag event will have to be triggered next time on touchmove event
                        this._touchStartDrag = true;
                        //tag the entity as dragged on the world
                        self._touchDraggingEntityIds.push(this._id);
                        
                        //here with the very first touch to this entity, we add the very first joint
                        _world_touchAddtouchHandlerForDragEvent.call(this, e, touchInfos, touchIndex);
                    }
                    //if it's a new touch while dragging the same entity
                    else if(e.type === 'touchstart' && self._touchDraggingEntityIds.indexOf(this._id) > -1){
                        if(Object.keys(this._touchMoveJoints).length < this._ops._touchDraggable.maxTouches){
                            //here with the nth touch to this entity, we add the nth joint
                            _world_touchAddtouchHandlerForDragEvent.call(this, e, touchInfos, touchIndex);
                        }
                    }
                    else if(this._touchDragging){
                        //trigger startdrag event on the first move
                        if(this._touchStartDrag && e.type === 'touchmove'){
                            if(self._touchStartdragHandlers[this._id]){
                                self._touchStartdragHandlers[this._id].call(this,e, mergeTouchDraggableInfos(touchInfos,this)[0]);
                            }
                            this._touchStartDrag = false;//reset startDrag state after the first drag
                        }
                        //the drag callbacks are triggered directly in the _world_touchmoveHandler function because they are queued
                        //so that they are fired only once per touchmove
                        
                    }
                    //update the move joint if regularDrag
                    if(this._touchMoveJoints && this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier]){
                        if(this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier].joint){
                            this._touchMoveJoints[touchInfos[touchIndex].touchIdentifier].joint.SetTarget(new Box2D.Common.Math.b2Vec2(touchInfos[touchIndex].x, touchInfos[touchIndex].y));
                        }
                    }
                };
                
                /*
                 * @function _world_touchendHandlerForDragEvent
                 * @param {TouchEvent} e
                 * @param Array[{Object}] touchInfos
                 * @param Integer touchIndex
                 * @context Entity
                 * @added by topheman
                 * @used in .touchDraggable()
                 * @description If this is the last touch on the entity, releases the entity, triggers the stopdrag callback
                 * It there are still touches on the entity, removes the joint and triggers the touchremove callback
                 */
                var _world_touchendHandlerForDragEvent = function(e, touchInfos, touchIndex) {
                    var touchDraggableInfos = mergeTouchDraggableInfos(touchInfos, this)[0];                            
                    _world_touchRemovetouchHandlerForDragEvent.call(this,e,touchInfos, touchIndex);
                    if(Object.keys(this._touchMoveJoints).length === 0){
                        //let the entity go back sleeping eventually, only when the dragging is finished
                        this._body.SetSleepingAllowed(true);
                        //trigger the stopdrag event (don't trigger it if the first drag hasn't happened)
                        if(this._touchStartDrag === false && self._touchStopdragHandlers[this._id]){
                            self._touchStopdragHandlers[this._id].call(this,e, touchDraggableInfos);
                        }
                        this._touchStartDrag = false;//reset startDrag state if there was no drag at all
                        this._touchDragging = false;//all the dragging process is ended, reset this propertie
                        self._touchDraggingEntityIds.splice(self._touchDraggingEntityIds.indexOf(this._id),1);//untag the dragging entity on world
                    }
                };
                
                /**
                 * @function getRangeBetweenTwoTouches
                 * @param {Touch} touch1
                 * @param {Touch} touch2
                 * @return {Number}
                 */
                var getRangeBetweenTwoTouches = function(touch1,touch2){
                    var x1 = touch1.offsetX || touch1.layerX || touch1.pageX;
                    var y1 = touch1.offsetY || touch1.layerY || touch1.pageY;
                    var x2 = touch2.offsetX || touch2.layerX || touch2.pageX;
                    var y2 = touch2.offsetY || touch2.layerY || touch2.pageY;
                    return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
                };
                
                /*
                 * @function _world_mousemoveHandlerForPanEvent
                 * @param {MouseEvent} e
                 * @param {Object} mousePos
                 * @context World
                 * @added by topheman
                 * @triggers the startdrag or the drag event specified in the .mousePan() method
                 */
                var _world_mousemoveHandlerForPanEvent = function(e){
                    var viewportInfos;
                    //tag as dragging when passing for the first time
                    if(!this._mousePanDragging && !this._mousePanStartDrag){
                        //tag as dragging (all along the drag), with the original viewport and the original pointer infos
                        this._mousePanDragging = new PanDraggingObject(new DraggingInfos(e));
                        //tag as startDrag to know that startDrag event will have to be triggered next time on mousemove event
                        this._mousePanStartDrag = true;                        
                    }
                    else if(this._mousePanDragging){
                        viewportInfos = this._mousePanDragging.getViewportInfos(e, 'mouse');
                        //check viewport boundaries
                        viewportInfos.viewport = this.viewport.checkBoundaries(viewportInfos.viewport);
                        
                        //update viewport
                        this.camera({x:viewportInfos.viewport.x,y:viewportInfos.viewport.y});
                        
                        //trigger startdrag event on the first move
                        if(this._mousePanStartDrag && e.type === 'mousemove'){
                            if(this._mousePanStartdragHandler){
                                this._mousePanStartdragHandler.call(this,e, viewportInfos);
                            }
                            this._mousePanStartDrag = false;//reset startDrag state after the first drag
                        }
                        //trigger the drag event on the next moves
                        else {
                            if(this._mousePanDragHandler){
                                this._mousePanDragHandler.call(this,e, viewportInfos);
                            }
                        }
                    }                    
                };
                
                /*
                 * @function _world_mouseupdHandlerForPanEvent
                 * @param {MouseEvent} e
                 * @param {Object} mousePos
                 * @context World
                 * @added by topheman
                 * @triggers the stopdrag event specified in the .mousePan() method
                 */
                var _world_mouseupdHandlerForPanEvent = function(e, mousePos){
                    var viewportInfos;
                    if(this._mousePanDragging){
                        viewportInfos = this._mousePanDragging.getViewportInfos(e, 'mouse');
                        //trigger the stopdrag event (don't trigger it if the first drag hasn't happened)
                        if(this._mousePanStartDrag === false && this._mousePanStopdragHandler){
                            this._mousePanStopdragHandler.call(this,e,viewportInfos,'stop');
                        }
                        
                        //check viewport boundaries
                        viewportInfos.viewport = this.viewport.checkBoundaries(viewportInfos.viewport);
                        
                        //update viewport
                        this.camera({x:viewportInfos.viewport.x,y:viewportInfos.viewport.y});
                    }
                    this._mousePanStartDrag = false;//reset startDrag state if there was no drag at all
                    this._mousePanDragging = false;//all the dragging process is ended, reset this propertie
                };
                
                /*
                 * @function _world_touchmoveHandlerForPanEvent
                 * @param {TouchEvent} e
                 * @param {Object} touchInfos
                 * @param options May specify switching between panning and pinching modes
                 * @context World
                 * @added by topheman
                 */
                var _world_touchmoveHandlerForPanEvent = function(e, touchInfos, options){
                    var viewportInfos,originalRelativePointerPos, newScale, panningTouchIdentifier, pinchingInfos;
                    
                    //tag as dragging when passing for the first time
                    if(!this._touchPanDragging && !this._touchPanStartDrag){
                        //tag as dragging (all along the drag), with the original viewport and the original pointer infos
                        this._touchPanDragging = new PanDraggingObject(new DraggingInfos(e.touches[0]));
                        //tag as startDrag to know that startDrag event will have to be triggered next time on mousemove event
                        this._touchPanStartDrag = true;
                    }
                    else if(this._touchPanDragging){
                    
                        //retrieve the touch identifier of the touch that initiated the pan (at "start" pan)
                        panningTouchIdentifier = this._touchPanDragging.getOriginalDraggingInfos().relativePointer.identifier;
                    
                        //updating viewportInfos with panning pointer infos
                        viewportInfos = this._touchPanDragging.getViewportInfos(e.touches[0], 'touch');

                        //if we are pinching, adjust the scale here, before checking the viewport boundaries (only if this isn't the beginning of the pinching)
                        if(this._touchPanDragging.pinchingInfos && !this._touchPanDragging.pinchingInfos.startPinching){
                            newScale = Math.round(100*(getRangeBetweenTwoTouches(e.touches[0],e.touches[1])*(this._touchPanDragging.pinchingInfos.baseScale))/(this._touchPanDragging.pinchingInfos.baseRange))/100;
                            viewportInfos.viewport = this.viewport.getScaledWindowInfos(newScale,viewportInfos.viewport,true);
                        }
                        //check viewport boundaries
                        viewportInfos.viewport = this.viewport.checkBoundaries(viewportInfos.viewport);
                        //update viewport position
                        this.camera({x:viewportInfos.viewport.x,y:viewportInfos.viewport.y});
                        //if scale changed, update viewport scale
                        if(newScale){
                            this.scale(viewportInfos.viewport.scale);
                        }
                        
                        //trigger startdrag event on the first move of the first touch (the panning one) or on the touchstart of the second touch (the pinching one) - if the first touch hasn't moved (to keep being transactional)
                        if(this._touchPanStartDrag && ((e.type === 'touchmove' && e.changedTouches[0].identifier === panningTouchIdentifier) || (e.type === 'touchstart' && e.changedTouches[0].identifier !== panningTouchIdentifier))){
                            if(this._touchPanStartdragHandler){
                                this._touchPanStartdragHandler.call(this,e, viewportInfos);
                            }
                            this._touchPanStartDrag = false;//reset startDrag state after the first drag
                        }
                        //if the pinching just has been initiated, trigger the startPinching handler
                        else if(this._touchPanDragging.pinchingInfos && this._touchPanDragging.pinchingInfos.startPinching === true){
                            if(this._touchPanStartPinchingHandler){
                                this._touchPanStartPinchingHandler.call(this,e, viewportInfos);
                            }
                            this._touchPanDragging.pinchingInfos.startPinching = false;
                        }
                        //trigger the drag event on the next moves
                        else {
                            if(this._touchPanDragHandler){
                                this._touchPanDragHandler.call(this,e, viewportInfos);
                            }
                        }
                    }
                    // if world is panning but not pinching already, is allowed to pinch and received a second touch, then switch to pinching mode
                    if(this._touchPanDragging && !this._touchPanDragging.pinchingInfos && this._ops._touchPan.allowPinch === true && e.touches.length > 1){
                        this._touchPanDragging.pinchingInfos = {};
                        //process the range (px) between the two touches that will be used as base to calculate the scaling modifications after
                        this._touchPanDragging.pinchingInfos.baseRange = getRangeBetweenTwoTouches(e.touches[0],e.touches[1]);
                        this._touchPanDragging.pinchingInfos.baseScale = this.scale();
                        //tag as start pinching
                        this._touchPanDragging.pinchingInfos.startPinching = true;
                        this._touchPanDragging.pinchingInfos.identifier = e.touches[1].identifier;
                        
                        //create a new snapshot of the viewport
                        this._touchPanDragging.addDraggingInfos(new DraggingInfos(e.touches[0]));
                    }
                };
                
                /*
                 * @function _world_mouseupdHandlerForPanEvent
                 * @param {TouchEvent} e
                 * @param {Object} touchInfos
                 * @context World
                 * @added by topheman
                 */
                var _world_touchendHandlerForPanEvent = function(e, touchInfos){
                    var viewportInfos, newScale, panningTouchIdentifier, rescale;
                    
                    //retrieve the touch identifier of the touch that initiated the pan (at "start" pan) (if panning)
                    panningTouchIdentifier = this._touchPanDragging ? this._touchPanDragging.getOriginalDraggingInfos().relativePointer.identifier : null;
                    
                    //if world is currently panning and has received a touchend from the correct identifier (the one that initiated the panning) then we stop panning 
                    if(this._touchPanDragging && panningTouchIdentifier === e.changedTouches[0].identifier){
                        
                        //we need to settle the pinching and stop it before managing the panning
                        if(this._touchPanDragging.pinchingInfos){
                            //create a new snapshot of the viewport
                            this._touchPanDragging.addDraggingInfos(new DraggingInfos(e.changedTouches[0]));
                            rescale = true;
                        }
                        
                        //updating viewportInfos with panning pointer infos
                        viewportInfos = this._touchPanDragging.getViewportInfos(e.changedTouches[0], 'touch');
                        //check viewport boundaries
                        viewportInfos.viewport = this.viewport.checkBoundaries(viewportInfos.viewport);
                        //update viewport
                        this.camera({x:viewportInfos.viewport.x,y:viewportInfos.viewport.y});
                        //if scale changed, update viewport scale
                        if(rescale){
                            this.scale(viewportInfos.viewport.scale);
                        }
                        
                        //if pinching, trigger the stopPinching event
                        if(this._touchPanDragging.pinchingInfos && this._touchPanStopPinchingHandler){
                            this._touchPanStopPinchingHandler.call(this,e,viewportInfos,'stop');
                        }
                        
                        //trigger the stopdrag event (don't trigger it if the first drag hasn't happened)
                        if(this._touchPanStartDrag === false && this._touchPanStopdragHandler){
                            this._touchPanStopdragHandler.call(this,e,viewportInfos,'stop');
                        }
                        
                        this._touchPanStartDrag = false;//reset startDrag state if there was no drag at all
                        this._touchPanDragging = false;//all the dragging process is ended, reset this propertie
                    }
                    //however if the world is pinching and has received a touchend from the identifier that initiated the pinching, we switch back to panning
                    else if(this._touchPanDragging && this._touchPanDragging.pinchingInfos && this._touchPanDragging.pinchingInfos.identifier === e.changedTouches[0].identifier){
                        
                        //create a new snapshot of the viewport
                        this._touchPanDragging.addDraggingInfos(new DraggingInfos(e.touches[0]));
                        
                        if(this._touchPanDragging.pinchingInfos.startPinching !== true){
                        
                            //updating viewportInfos with panning pointer infos
                            viewportInfos = this._touchPanDragging.getViewportInfos(e.touches[0], 'touch');

                            //if we are pinching, adjust the scale here, before checking the viewport boundaries (only if this isn't the beginning of the pinching)
                            if(this._touchPanDragging.pinchingInfos && !this._touchPanDragging.pinchingInfos.startPinching){
                                newScale = Math.round(100*(getRangeBetweenTwoTouches(e.touches[0],e.changedTouches[0])*(this._touchPanDragging.pinchingInfos.baseScale))/(this._touchPanDragging.pinchingInfos.baseRange))/100;
                                viewportInfos.viewport = this.viewport.getScaledWindowInfos(newScale,viewportInfos.viewport,true);
                            }
                            //check viewport boundaries
                            viewportInfos.viewport = this.viewport.checkBoundaries(viewportInfos.viewport);
                            //update viewport
                            this.camera({x:viewportInfos.viewport.x,y:viewportInfos.viewport.y});
                            //if scale changed, update viewport scale
                            if(newScale){
                                this.scale(viewportInfos.viewport.scale);
                            }
                        
                            //trigger the stopPinchingEvent event
                            if(this._touchPanStopPinchingHandler){
                                this._touchPanStopPinchingHandler.call(this,e,viewportInfos,'stop');
                            }
                            
                        }

                        this._touchPanDragging.pinchingInfos = false;//reset pinching state
                    }
                };
                
                /*
                 * adding mouse/touch events to the canvas with the level1 handlers
                 * @added by topheman
                 */
                
                if(!self._ops.disableTouchEvents){
                    self._canvas.addEventListener('touchstart', touchstartHandler, false);
                    self._canvas.addEventListener('touchmove', touchmoveHandler, false);
                    self._canvas.addEventListener('touchend', touchendHandler, false);
                }
                if(!self._ops.disableMouseEvents){
                    self._canvas.addEventListener('mousedown', mousedownHandler, false);
                    self._canvas.addEventListener('mouseup', mouseupHandler, false);
                    self._canvas.addEventListener('mousemove', mousemoveHandler, false);
                    self._canvas.addEventListener('mouseover', mouseinHandler, false);
                    self._canvas.addEventListener('mouseout', mouseoutHandler, false);
                    self._canvas.addEventListener("mousewheel", mousewheelHandler, false);
                    // Firefox
                    self._canvas.addEventListener("DOMMouseScroll", mousewheelHandler, false);
                }
                
                if(self._ops.preventScroll){
                    document.body.addEventListener('touchmove', function(e) {
                        e.preventDefault();
                    }, false);
                }

                // contact events
                listener = new Box2D.Dynamics.b2ContactListener();
                listener.BeginContact = function(contact) {
                    var a = self._entities[contact.GetFixtureA().GetBody()._bbid];
                    var b = self._entities[contact.GetFixtureB().GetBody()._bbid];
                    for (var key in self._startContactHandlers) {
                        if (a._id === Number(key) && !a._destroyed) {
                            self._startContactHandlers[key].call(self._entities[key], b);
                        }
                        if (b._id === Number(key) && !b._destroyed) {
                            self._startContactHandlers[key].call(self._entities[key], a);
                        }
                    }
                };
                listener.EndContact = function(contact) {
                    var a = self._entities[contact.GetFixtureA().GetBody()._bbid];
                    var b = self._entities[contact.GetFixtureB().GetBody()._bbid];
                    for (var key in self._finishContactHandlers) {
                        if (a._id === Number(key) && !a._destroyed) {
                            self._finishContactHandlers[key].call(self._entities[key], b);
                        }
                        if (b._id === Number(key) && !b._destroyed) {
                            self._finishContactHandlers[key].call(self._entities[key], a);
                        }
                    }
                };
                listener.PostSolve = function(contact, impulse) {
                    var a = self._entities[contact.GetFixtureA().GetBody()._bbid];
                    var b = self._entities[contact.GetFixtureB().GetBody()._bbid];
                    
                    for (var key in self._impactHandlers) {
                        if (a._id === Number(key) && !a._destroyed) {
                            self._impactHandlers[key].call(self._entities[key],
                                                           b,
                                                           impulse.normalImpulses[0],
                                                           impulse.tangentImpulses[0]);
                        }
                        if (b._id === Number(key) && !b._destroyed) {
                            self._impactHandlers[key].call(self._entities[key],
                                                           a,
                                                           impulse.normalImpulses[0],
                                                           impulse.tangentImpulses[0]);
                        }
                    }
                };
                world.SetContactListener(listener);
            }
        },
        
        /*
         * Checks if at least one type of listeners has been left enabled
         * @added by topheman
         */
        checkListenersOptions : function(){
            var eventsEnabled = [];
            //if both touch and mouse events are disabled, enable the event listener available
            if(this._ops.disableTouchEvents && this._ops.disableMouseEvents && this._ops.disableKeyEvents){
                if(!!('ontouchstart' in window)){
                    this._ops.disableTouchEvents = false;
                    eventsEnabled.push('touchEvents');
                }
                if(!!('mousedown' in window)){
                    this._ops.disableMouseEvents = false;
                    eventsEnabled.push('mouseEvents');
                }
                if(!!('onkeydown' in window)){
                    this._ops.disableKeyEvents = false;
                    eventsEnabled.push('keyEvents');
                }
                console.warn('All events were disabled in your config. The following available events on your device have been enabled : "'+eventsEnabled.join(', ')+'"');
            }
        },
        
        /**
         * @_name pause
         * @_module world
         * @description Stops or resumes the box2d engine (the animation loops keeps going on - i.e. your specific renderers on the canvas ctx will keep animate)
         * @added by topheman
         */
        pause : function(){
            if(this._pause === false){
                this._pause = true;
            }
            else
            {
                this._pause = false;
            }
        },
        
        /**
         * @_name cleanup
         * @_module world
         * @description Removes all the entities, all the handlers (even the world handlers such as mouse/touch Pan/wheelZoom) while keeping your boundaries (if any) in options
         * <br>Usefull when you have multiple levels
         * @added by topheman
         */
        cleanup : function(){
            
            var i,j, world = this._world, toDestroy, id, self = this;
            //destroy the entities
            for(i in this._entities){
                toDestroy = this._entities[i];
                id = toDestroy._id;
                //destriy the box2d body
                world.DestroyBody(toDestroy._body);
                toDestroy._destroyed = true;
                //destroy the handlers
                delete self._keydownHandlers[id];
                delete self._keyupHandlers[id];
                delete self._mousedownHandlers[id];
                delete self._mousemoveHandlers[id];
                delete self._mouseupHandlers[id];
                delete self._mouseinHandlers[id];
                delete self._mouseoutHandlers[id];
                delete self._mouseStartdragHandlers[id];
                delete self._mouseDragHandlers[id];
                delete self._mouseStopdragHandlers[id];
                delete self._touchstartHandlers[id];
                delete self._touchmoveHandlers[id];
                delete self._touchendHandlers[id];
                delete self._touchStartdragHandlers[id];
                delete self._touchDragHandlers[id];
                delete self._touchStopdragHandlers[id];
                delete self._touchAddtouchdragHandlers[id];
                delete self._touchRemovetouchdragHandlers[id];
                delete self._mousewheelHandlers[id];
                delete self._startContactHandlers[id];
                delete self._finishContactHandlers[id];
                delete self._impactHandlers[id];
                delete self._constantVelocities[id];
                delete self._constantForces[id];
                //destroy the entity itself
                delete self._entities[id];
            }
        
//            self._ops = null;
//            self._world = null;
//            self._canvas = null;
//          //reinit some of the ops
            self._ops._mousePan = {
                disabled: true,
                excludeEntityIds: [],
                multiplier: 1
            };
            self._ops._touchPan = { //@added by topheman
                disabled: true,
                panMultiplier: 1,
                excludeEntityIds: [],
                triggerWorldEvents: true,
                allowPinch: true
            },
            self._ops._mousewheelZoom = {
                disabled: true,
                step: 0.1
            };
            //destroy the references in the world
            self._destroyQueue = [];
            self._impulseQueue = [];
            //reinit the world handlers
            self._keyupHandlers = {};
            self._mousedownHandlers = {};
            self._mouseupHandlers = {};
            self._mousemoveHandlers = {};
            self._mouseinHandlers = {};
            self._mouseoutHandlers = {};
            self._mouseStartdragHandlers = {};
            self._mouseDragHandlers = {};
            self._mouseStopdragHandlers = {};
            self._mousePanStartdragHandler = null;
            self._mousePanDragHandler = null;
            self._mousePanStopdragHandler = null;
            self._touchstartHandlers = {};
            self._touchendHandlers = {};
            self._touchmoveHandlers = {};
            self._touchStartdragHandlers = {};
            self._touchDragHandlers = {};
            self._touchStopdragHandlers = {};
            self._touchAddtouchdragHandlers = {};
            self._touchRemovetouchdragHandlers = {};
            self._touchPanStartdragHandler = null;
            self._touchPanDragHandler = null;
            self._touchPanStopdragHandler = null;
            self._touchPanStartPinchingHandler = null;
            self._touchPanStopPinchingHandler = null;
            self._mousewheelHandlers = {};
            self._startContactHandlers = {};
            self._finishContactHandlers = {};
            self._impactHandlers = {};
            self._destroyQueue = [];
            self._impulseQueue = [];
            self._constantVelocities = {};
            self._constantForces = {};
            self._entities = {};
            self._nextEntityId = 0;
            self._cameraX = 0;
            self._cameraY = 0;
            self._onRender = [];
            self._onTick = [];
            self._creationQueue = [];
            self._positionQueue = [];
            self._pause = false;
            self._mouseHoverEntityId = null;
            self._mouseDraggingEntityId = null;
            self._touchDraggingEntityIds  = [];
            self._mouseDraggableEntityIds = [];
            self._touchDraggableEntityIds = [];
            
            //repositions / rescales the viewport according to the boundaries (if any) of the world @added by topheman
            self.viewport.centerToStage();
            
        },
        
        _addKeydownHandler: function(id, f) {
            this._keydownHandlers[id] = f;
        },
        
        _addKeyupHandler: function(id, f) {
            this._keyupHandlers[id] = f;
        },
        
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMousedownHandler: function(id, f) {
            this._mousedownHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMouseupHandler: function(id, f) {
            this._mouseupHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMousemoveHandler: function(id, f) {
            this._mousemoveHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMousedownHandler: function(id) {
            delete this._mousedownHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMouseupHandler: function(id) {
            delete this._mouseupHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMousemoveHandler: function(id) {
            delete this._mousemoveHandlers[id];
        },
        
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchstartHandler: function(id, f) {
            this._touchstartHandlers[id] = f;
        },
        
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchendHandler: function(id, f) {
            this._touchendHandlers[id] = f;
        },
        
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchmoveHandler: function(id, f) {
            this._touchmoveHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchstartHandler: function(id) {
            delete this._touchstartHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchendHandler: function(id) {
            delete this._touchendHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchmoveHandler: function(id) {
            delete this._touchmoveHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMouseStartdragHandler: function(id, f) {
            this._mouseStartdragHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMouseDragHandler: function(id, f) {
            this._mouseDragHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMouseStopdragHandler: function(id, f) {
            this._mouseStopdragHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMouseinHandler: function(id, f) {
            this._mouseinHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMouseoutHandler: function(id, f) {
            this._mouseoutHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMouseinHandler: function(id) {
            delete this._mouseinHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMouseoutHandler: function(id) {
            delete this._mouseoutHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMouseStartdragHandler: function(id) {
            delete this._mouseStartdragHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMouseDragHandler: function(id) {
            delete this._mouseDragHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMouseStopdragHandler: function(id) {
            delete this._mouseStopdragHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchStartdragHandler: function(id, f) {
            this._touchStartdragHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchDragHandler: function(id, f) {
            this._touchDragHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchStopdragHandler: function(id, f) {
            this._touchStopdragHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchStartdragHandler: function(id) {
            delete this._touchStartdragHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchDragHandler: function(id) {
            delete this._touchDragHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchStopdragHandler: function(id) {
            delete this._touchStopdragHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchAddtouchDragHandler: function(id, f) {
            this._touchAddtouchdragHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchRemovetouchDragHandler: function(id, f) {
            this._touchRemovetouchdragHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchAddtouchDragHandler: function(id) {
            delete this._touchAddtouchdragHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchRemovetouchDragHandler: function(id) {
            delete this._touchRemovetouchdragHandlers[id];
        },
                
        /*
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMousewheelHandler: function(id, f) {
            this._mousewheelHandlers[id] = f;
        },
                
        /*
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMousewheelHandler: function(id) {
            delete this._mousewheelHandlers[id];
        },

        _addStartContactHandler: function(id, f) {
            this._startContactHandlers[id] = f;
        },
        
        _addFinishContactHandler: function(id, f) {
            this._finishContactHandlers[id] = f;
        },

        _addImpactHandler: function(id, f) {
            this._impactHandlers[id] = f;
        },
        
        _destroy: function(obj) {
            this._destroyQueue.push(obj);
        },

        _applyImpulse: function(id, body, x, y) {
          this._impulseQueue.push({
                id:id,
                body:body,
                x:x,
                y:y
            });
        },
        
        _setConstantVelocity: function(name, id, body, x, y) {
            this._constantVelocities[name + id] = {
                id:id,
                body:body,
                x:x,
                y:y
            };
        },
        
        _clearConstantVelocity: function(name, id) {
            delete this._constantVelocities[name + id];
        },

        _setConstantForce: function(name, id, body, x, y) {
            this._constantForces[name + id] = {
                id:id,
                body:body,
                x:x,
                y:y
            };
        },
        
        _clearConstantForce: function(name, id) {
            delete this._constantForces[name + id];
        },
                
        _addMouseDraggableEntityId : function(id){
            if(this._mouseDraggableEntityIds.indexOf(id) === -1){
                this._mouseDraggableEntityIds.push(id);
            }
        },
                
        _addTouchDraggableEntityId : function(id){
            if(this._touchDraggableEntityIds.indexOf(id) === -1){
                this._touchDraggableEntityIds.push(id);
            }
        },
                
        _removeMouseDraggableEntityId : function(id){
            var index = this._mouseDraggableEntityIds.indexOf(id);
            if(index > -1){
                this._mouseDraggableEntityIds.splice(index, 1);
            }
        },
                
        _removeTouchDraggableEntityId : function(id){
            var index = this._touchDraggableEntityIds.indexOf(id);
            if(index > -1){
                this._touchDraggableEntityIds.splice(index, 1);
            }
        },
                
        _addMousePanExcludeEntityId : function(id){
            if(this._ops._mousePan.excludeEntityIds.indexOf(id) === -1){
                this._ops._mousePan.excludeEntityIds.push(id);
            }
        },
                
        _addTouchPanExcludeEntityId : function(id){
            if(this._ops._touchPan.excludeEntityIds.indexOf(id) === -1){
                this._ops._touchPan.excludeEntityIds.push(id);
            }
        },
                
        _removeMousePanExcludeEntityId : function(id){
            var index = this._ops._mousePan.excludeEntityIds.indexOf(id);
            if(index > -1){
                this._ops._mousePan.excludeEntityIds.splice(index, 1);
            }
        },
                
        _removeTouchPanExcludeEntityId : function(id){
            var index = this._ops._touchPan.excludeEntityIds.indexOf(id);
            if(index > -1){
                this._ops._touchPan.excludeEntityIds.splice(index, 1);
            }
        },
                
        /**
         * @_name calculateWorldPositionFromPointer
         * @_module world
         * @_params [value]
         * @value: {MouseEvent}|{Touch}
         * @return: {x,y}
         * @description Returns the position in the world from the position of the mouse or a touch
         * @added by topheman
         */
        calculateWorldPositionFromPointer: function(e){
            return {
                x: (e.offsetX || (e.layerX ? e.clientX - e.target.offsetLeft : false) || e.pageX) / this.scale() + this._cameraX,
                y: (e.offsetY || (e.layerY ? e.clientY - e.target.offsetTop : false) || e.pageY) / this.scale() + this._cameraY
            };
        },

        /**
         * @_name gravity
         * @_module world
         * @_params [value]
         * @value: {x,y}
         * @return: {x,y}
         * @description get or set the world's gravity
         */
        gravity: function(value) {
            if (value !== undefined) {
                this._world.SetGravity(new b2Vec2(0, value));
            }
            var v = this._world.GetGravity();
            return {x: v.x, y: v.y};
        },
        
        /**
         * @_name createEntity
         * @_module world
         * @_params options
         * @options
         * <ul>
         * @name of this entity
         * @x starting x coordinate for the center of the new entity
         * @y starting y coordinate for the center of the new entity
         * @type 'dynamic' or 'static'. static objects can't move
         * @shape 'square' or 'circle' or 'polygon'
         * @height for box (default 1)
         * @width for box (default 1)
         * @radius for circle (default 1)
         * @points for polygon [{x,y}, {x,y}, {x,y}] must go clockwise
         * must be convex
         * @density (default 2)
         * @friction (default 1)
         * @restitution or bounciness (default .2)
         * @active (default true) participates in collisions and dynamics
         * @rotation (default 0) initial rotation in degrees
         * @fixedRotation (default false) prevent entity from rotating
         * @bullet (default false) perform expensive continuous
         * collision detection
         * @maxVelocityX Prevent entity from moving too fast either left or right
         * @maxVelocityY Prevent entity from moving too fast either up or down
         * @image file for rendering
         * @imageOffsetX (default 0) for image
         * @imageOffsetY (default 0) for image
         * @imageStretchToFit (default false) for image
         * @spriteSheet Image is a sprite sheet (default false)
         * @spriteWidth Used with spriteSheet (default 16)
         * @spriteHeight Used with spriteSheet (default 16)
         * @spriteX Used with spriteSheet (default 0)
         * @spriteY Used with spriteSheet (default 0)
         * @color CSS color for rendering if no image is given (default 'gray')
         * @borderColor CSS color for rendering the shape's border (default 'black')
         * @borderWidth Width of the border. The border does not impact physics. (default 1)
         * @draw custom draw function, params are context, x, and y
         * @init a function that is run when the entity is created
         * @onKeyDown keydown event handler
         * @onKeyUp keyup event handler
         * @onMousedown mousedown event handler
         * @onMouseup mouseup event handler
         * @onMousemove mousemove event handler
         * @onMousein mousein event handler
         * @onMouseout mouseout event handler
         * @onMousewheel mousewheel event handler
         * @onTouchstart touchstart event handler
         * @onTouchend touchend event handler
         * @onTouchmove touchmove event handler
         * @onStartContact start contact event handler
         * @onFinishContact finish contact event handler
         * @onImpact impact event handler
         * @onRender event handler on render
         * @onTick event handler on tick
         * </ul>
         * @return a new <a href="#Entity">Entity</a>
         * @description
         <h2>Example</h2>
         <code>var player = world.createEntity({
         &nbsp;&nbsp;name: "player",
         &nbsp;&nbsp;shape: "circle",
         &nbsp;&nbsp;radius: 2
         });</code>
         <h2>Templates</h2>
         You can pass multiple options objects. This allows for "templates"
         with reusable defaults:
         <code>var redCircleTemplate = {color: "red", shape: "circle", radius: 3};
         world.createEntity(redCircleTemplate, {x: 5, y: 5});
         world.createEntity(redCircleTemplate, {x: 10, y: 5});</code>
         The options objects on the right take precedence.
         <h2>Dollar Properties</h2>
         You can provide options that start with a $ like this:
         <code>var ball = world.createEntity({color: "red", $customValue: 15});</code>
         These are passed onto the resulting entity as they are:
         <code>ball.$customValue === 15</code>
         This allows you to provide your own custom methods and properties.
         */
        createEntity: function() {
            var o = {};
            var args = Array.prototype.slice.call(arguments);
            args.reverse();
            for (var key in args) {
                extend(o, args[key]);
            }
            if (this._world.IsLocked()) {
                this._creationQueue.push(o);
                return;
            }
            var entity = create(Entity);
            var id = this._nextEntityId++;
            entity._init(this, o, id);
            this._entities[id] = entity;
            return entity;
        },
        
        /**
         * @_name createJoint
         * @_module world
         * @_params entity1, entity2, [options]
         * @entity1 Entity on one side of the joint
         * @entity2 Entity on the other side of the joint
         * @options
         * <ul>
         * @enableMotor (default false)
         * @type one of
         * <ul>
         * @distance these entities will always remain the same distance apart
         * @revolute
         * @gear
         * @friction
         * @prismatic
         * @weld
         * @pulley
         * @mouse
         * @line
         * </ul>
         * </ul>
         * @description Experimental joint support.
         * See <a href="http://box2d.org/">box2d documentation</a> for more
         * info.
         */
        createJoint: function(entity1, entity2, options) {
            options = options || {};
            options = extend(options, JOINT_DEFAULT_OPTIONS);
            var type = options.type;
            
            var joint;
            
            if (type === "distance") {
                joint = new Box2D.Dynamics.Joints.b2DistanceJointDef();
            }
            else if (type === "revolute") {
                joint = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
            }
            else if (type === "gear") {
                joint = new Box2D.Dynamics.Joints.b2GearJointDef();
            }
            else if (type === "friction") {
                joint = new Box2D.Dynamics.Joints.b2FrictionJointDef();
            }
            else if (type === "prismatic") {
                joint = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
            }
            else if (type === "weld") {
                joint = new Box2D.Dynamics.Joints.b2WeldJointDef();
            }
            else if (type === "pulley") {
                joint = new Box2D.Dynamics.Joints.b2PulleyJointDef();
            }
            else if (type === "mouse") {
                joint = new Box2D.Dynamics.Joints.b2MouseJointDef();
            }
            else if (type === "line") {
                joint = new Box2D.Dynamics.Joints.b2LineJointDef();
            }
            
            if (options.enableMotor) {
                joint.enableMotor = true;
            }
            
            var jointPositionOnEntity1 = entity1._body.GetWorldCenter();
            if (options.jointPositionOnEntity1) {
                jointPositionOnEntity1.x += options.jointPositionOnEntity1.x;
                jointPositionOnEntity1.y += options.jointPositionOnEntity1.y;
            }
            
            var jointPositionOnEntity2 = entity2._body.GetWorldCenter();
            if (options.jointPositionOnEntity2) {
                jointPositionOnEntity2.x += options.jointPositionOnEntity2.x;
                jointPositionOnEntity2.y += options.jointPositionOnEntity2.y;
            }
            
            if (type === "mouse") {
                joint.bodyA = entity1._body;
                joint.bodyB = entity2._body;
            }
            else if (joint.Initialize) {
                joint.Initialize(entity1._body,
                                 entity2._body,
                                 jointPositionOnEntity1,
                                 jointPositionOnEntity2);
            }
            if (options.allowCollisions) {
                joint.collideConnected = true;
            }
            this._world.CreateJoint(joint);
        },

        /**
         * @_name find
         * @_module world
         * @_params x1, y1, x2, y2
         * @x1 upper left of query box
         * @y1 upper left of query box
         * @x2 lower right of query box
         * @y2 lower right of query box
         * @return array of Entities. may be empty
         * @description find Entities in a given query box
         */
        find: function(x1, y1, x2, y2) {
            if (x2 === undefined) {
                x2 = x1;
            }
            if (y2 === undefined) {
                y2 = y1;
            }
            var self = this;
            var result = [];
            var aabb = new b2AABB();
            aabb.lowerBound.Set(x1, y1);
            aabb.upperBound.Set(x2, y2);
            this._world.QueryAABB(function(fixt) {
                result.push(self._entities[fixt.GetBody()._bbid]);
                return true;
            }, aabb);
            return result;
        },   

        /**
         * @_name getEntityByPosition
         * @_module world
         * @_params x,y
         * @x
         * @y
         * @return Entity
         * @description returns the Entity at a given point (more accurate than .find())
         * @added by topheman
         */
        getEntityByPosition : function(x,y){
            var body = null;
            this._world.QueryPoint(function (fixture) {
                body = fixture.GetBody();
            }, new b2Vec2(x, y));
            
            if(body !== null && this._entities[body._bbid]){
                return this._entities[body._bbid];
            }
            else{
                return null;
            }
        },

        /**
         * @_name getEntityById
         * @_module world
         * @_params entityId
         * @return Entity
         * @description returns the Entity of the id entityId
         * @added by topheman
         */
        getEntityById: function(id){
            return this._entities[id] ? this._entities[id] : null;
        },

        /**
         * @_name getEntityByName
         * @_module world
         * @_params entityName
         * @return Entity
         * @description returns the Entity of the name entityName
         * @added by topheman
         */   
        getEntityByName: function(name){
            for(var i in this._entities){
                if(this._entities[i]._name === name){
                    return this._entities[i];
                }
            }
            return null;
        },
        
        /**
         * @_name camera
         * @_module world
         * @_params [value]
         * @value {x,y}
         * @return {x,y}
         * @description get or set position of camera
         */
        camera: function(v) {
            v = v || {};
            if (v.x === undefined && v.y === undefined) {
                return {x:this._cameraX, y: this._cameraY};
            }
            if (v.x !== undefined) {
                this._cameraX = v.x;
            }
            if (v.y !== undefined) {
                this._cameraY = v.y;
            }
        },
        
        /**
         * @_name onRender
         * @_module world
         * @_params callback
         * @callback function( context )
         * <ul>
         * @context canvas context for rendering
         * @this World
         * </ul>
         * @description Add an onRender callback to the World
         * This is useful for custom rendering. For example, to draw text
         * on every frame:
         * <code>world.onRender(function(ctx) {
         * &nbsp;&nbsp;ctx.fillText("Score: " + score, 10, 10);
         * });</code>
         * This callback occurs after all entities have been rendered on the
         * frame.
         * <br>
         * Multiple onRender callbacks can be added, and they can be removed
         * with unbindOnRender.
         */
        onRender: function(callback) {
            this._onRender.push({
                fun: callback,
                ctx: this
            });
        },
        
        /**
         * @_name unbindOnRender
         * @_module world
         * @callback callback
         * @description
         * If the provided function is currently an onRender callback for this
         * World, it is removed.
         */
        unbindOnRender: function(callback) {
            var newArray = [];
            var i;
            for (i = 0; i < this._onRender.length; i++) {
              if (this._onRender[i].fun !== callback) {
                newArray.push(this._onRender[i]);
              }
            }
            this._onRender = newArray;
        },

        /**
         * @_name onTick
         * @_module world
         * @_params callback
         * @callback function()
         * <ul>
         * @this World
         * </ul>
         * @description Add an onTick callback to the World
         * <br>
         * Ticks are periodic events that happen independant of rendering.
         * You can use ticks as your "game loop". The default tick frequency
         * is 50 milliseconds, and it can be set as an option when creating
         * the world.
         * <br>
         * Multiple onTick callbacks can be added, and they can be removed
         * with unbindOnTick.
         */
        onTick: function(callback) {
            this._onTick.push({
                fun: callback,
                ctx: this
            });
        },

        /**
         * @_name unbindOnTick
         * @_module world
         * @callback callback
         * @description
         * If the provided function is currently an onTick callback for this
         * World, it is removed.
         */
        unbindOnTick: function(callback) {
            var newArray = [];
            var i;
            for (i = 0; i < this._onTick.length; i++) {
              if (this._onTick[i].fun !== callback) {
                newArray.push(this._onTick[i]);
              }
            }
            this._onTick = newArray;
        },
        
        /**
         * @_name scale
         * @_module world
         * @_params [value]
         * @value number
         * @return number
         * @description get or set the scale for rendering in pixels / meter
         */
        scale: function(s) {
            if (s !== undefined) {
                this._scale = s;
                // TODO update debug draw?
            }
            return this._scale;
        },

        /**
         * @_name canvasPositionAt
         * @_module world
         * @return {x,y}
         * @description Get a canvas position for a corresponding world position. Useful
         * for custom rendering in onRender. Respects world scale and camera position.
         */
        canvasPositionAt: function(x, y) {
            var c = this.camera();
            var s = this.scale();
            
            return {
                x: Math.round((x + -c.x) * s),
                y: Math.round((y + -c.y) * s)
            };
        },
        
        /**
         * @_name onMousedown
         * @_module world
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {Entity,x,y}
         * @this World
         * </ul>
         * @description Add an onMousedown callback to the World
         * @added by topheman
         */
        onMousedown : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMousedown") === false){
                return false;
            }
            this._addMousedownHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @_name onMouseup
         * @_module world
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {Entity,x,y}
         * @this World
         * </ul>
         * @description Add an onMouseup callback to the World
         * @added by topheman
         */
        onMouseup : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMouseup") === false){
                return false;
            }
            this._addMouseupHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @_name onMousemove
         * @_module world
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {Entity,x,y}
         * @this World
         * </ul>
         * @description Add an onMousemove callback to the World
         * @added by topheman
         */
        onMousemove : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMousemove") === false){
                return false;
            }
            this._addMousemoveHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @_name unbindOnMousedown
         * @_module world
         * @description Removes the onMousedown callback from this World
         * @added by topheman
         */    
        unbindOnMousedown: function(){
            this._removeMousedownHandler(worldCallbackEventId);
        },
        
        /**
         * @_name unbindOnMouseup
         * @_module world
         * @description Removes the onMouseup callback from this World
         * @added by topheman
         */   
        unbindOnMouseup: function(){
            this._removeMouseupHandler(worldCallbackEventId);
        },
        
        /**
         * @_name unbindOnMousemove
         * @_module world
         * @description Removes the onMousemove callback from this World
         * @added by topheman
         */    
        unbindOnMousemove: function(){
            this._removeMousemoveHandler(worldCallbackEventId);
        },
        
        /**
         * @_name onMousein
         * @_module world
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {Entity,x,y}
         * @this World
         * </ul>
         * @description Add an onMousein callback to the World
         * @added by topheman
         */
        onMousein : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMousein") === false){
                return false;
            }
            this._addMouseinHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @_name onMouseout
         * @_module world
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {Entity,x,y}
         * @this World
         * </ul>
         * @description Add an onMouseout callback to the World
         * @added by topheman
         */
        onMouseout : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMouseout") === false){
                return false;
            }
            this._addMouseoutHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @_name unbindOnMousein
         * @_module world
         * @description Removes the onMousein callback from this World
         * @added by topheman
         */    
        unbindOnMousein: function(){
            this._removeMouseinHandler(worldCallbackEventId);
        },
        
        /**
         * @_name unbindOnMouseout
         * @_module world
         * @description Removes the onMouseout callback from this World
         * @added by topheman
         */    
        unbindOnMouseout: function(){
            this._removeMouseoutHandler(worldCallbackEventId);
        },
        
        /**
         * @_name onTouchstart
         * @_module world
         * @_params callback
         * @callback function(e,touchInfos)
         * <ul>
         * @e TouchEvent
         * @touchInfos [{Entity,touchIdentifier,x,y}]
         * @this World
         * </ul>
         * @description Add an onTouchstart callback to the World
         * @added by topheman
         */
        onTouchstart : function(callback){
            if(checkBeforeAddEvent(this, "touch", "onTouchstart") === false){
                return false;
            }
            this._addTouchstartHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @_name onTouchmove
         * @_module world
         * @_params callback
         * @callback function(e,touchInfos)
         * <ul>
         * @e TouchEvent
         * @touchInfos [{Entity,touchIdentifier,x,y}]
         * @this World
         * </ul>
         * @description Add an onTouchmove callback to the World
         * @added by topheman
         */
        onTouchmove : function(callback){
            if(checkBeforeAddEvent(this, "touch", "onTouchmove") === false){
                return false;
            }
            this._addTouchmoveHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @_name onTouchend
         * @_module world
         * @_params callback
         * @callback function(e,touchInfos)
         * <ul>
         * @e TouchEvent
         * @touchInfos [{Entity,touchIdentifier,x,y}]
         * @this World
         * </ul>
         * @description Add an onTouchend callback to the World
         * @added by topheman
         */
        onTouchend : function(callback){
            if(checkBeforeAddEvent(this, "touch", "onTouchend") === false){
                return false;
            }
            this._addTouchendHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @_name unbindOnTouchstart
         * @_module world
         * @description Removes the onTouchstart callback from this World
         * @added by topheman
         */
        unbindOnTouchstart : function(){
            this._removeTouchstartHandler(worldCallbackEventId);
        },
        
        /**
         * @_name unbindOnTouchmove
         * @_module world
         * @description Removes the onTouchmove callback from this World
         * @added by topheman
         */
        unbindOnTouchmove : function(callback){
            this._removeTouchmoveHandler(worldCallbackEventId);
        },
        
        /**
         * @_name unbindOnTouchend
         * @_module world
         * @description Removes the onTouchend callback from this World
         * @added by topheman
         */
        unbindOnTouchend : function(callback){
            this._removeTouchendHandler(worldCallbackEventId);
        },
        
        /**
         * @_name onMousewheel
         * @_module world
         * @_params callback
         * @callback function(e,mousewheelInfos)
         * <ul>
         * @e MouseEvent
         * @mousewheelInfos
         * <ul>
         * @x
         * @y
         * @delta : -1 or 1
         * @entity : Entity
         * </ul>
         * @this World
         * </ul>
         * @description Add an onMousewheel callback to the World
         * @added by topheman
         */
        onMousewheel : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMousewheel") === false){
                return false;
            }
            this._addMousewheelHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @_name unbindOnMousewheel
         * @_module world
         * @description Removes the onMousewheel callback from this World
         * @added by topheman
         */
        unbindOnMousewheel : function(callback){
            this._removeMousewheelHandler(worldCallbackEventId);
        },
                
        /**
         * @_name mousePan
         * @_module world
         * @_params [options]
         * @description 
         Enables pan with the mouse, on the world
         <br>The viewportInfos variable passed within the callback function contains the original viewport parameters when the drag started, and the current viewport parameters at the time of your callback.
         <br>Draggable entities are excluded by default (pan will not trigger if you click on it), you exclude other entities in the "excludeEntityIds" array (if you have special behaviours on them that would mess with the pan for example)
         <h2>Examples</h2>
         <h3>Without options</h3>
         <code>world.mousePan();</code>
         <h3>With options</h3>
         <code>world.mousePan({
        &nbsp;&nbsp;start:function(e,viewportInfos){
        &nbsp;&nbsp;&nbsp;&nbsp;console.info('pan-start',viewportInfos);
        &nbsp;&nbsp;},
        &nbsp;&nbsp;drag:function(e,viewportInfos){
        &nbsp;&nbsp;&nbsp;&nbsp;console.info('pan-drag',e,viewportInfos);
        &nbsp;&nbsp;},
        &nbsp;&nbsp;stop:function(e,viewportInfos){
        &nbsp;&nbsp;&nbsp;&nbsp;console.info('pan-stop',e,viewportInfos);
        &nbsp;&nbsp;},
        &nbsp;&nbsp;excludeEntityIds:[
        &nbsp;&nbsp;&nbsp;&nbsp;2,5
        &nbsp;&nbsp;]
        });</code>
         <h3>Enable / disable</h3>
         <code>world.mousePan('disable');
         world.mousePan('enable');</code>
         <h3>Exclude / include entities by their ids</h3>
         <code>world.mousePan('exclude',2);
         world.mousePan('include',4);
         world.mousePan('exclude',[7,8,12]);</code>
         * @options
         * <ul>
         * @disabled {Boolean} true/false to disable/enable the draggable state
         * @multiplier {Number} 1 by default
         * @excludeEntityIds [Ids ...] Ids of entities (optional)
         * @start function(e,viewportInfos)
         * @drag function(e,viewportInfos)
         * @stop function(e,viewportInfos)
         * </ul>
         * @viewportInfos
         * <ul>
         * @x
         * @y
         * @width
         * @height
         * @scale
         * </ul>
         * @added by topheman
         */
        mousePan : function(options,value){
            var i,tmpValue;
            if(checkBeforeAddEvent(this, "mouse", "mousePan") === false){
                return false;
            }
            
            if(!this._ops._mousePan.excludeEntityIds){
                this._ops._mousePan.excludeEntityIds = [];
            }
            
            //simple init without options
            if(typeof options === 'undefined'){
                this._ops._mousePan.disabled = false;
            }
            //method call
            else if(typeof options === 'string'){
                switch(options){
                    case 'disable':
                        this._ops._mousePan.disabled = true;
                        break;
                    case 'enable':
                        this._ops._mousePan.disabled = false;
                        break;
                    case 'exclude':
                        if(!value.length){
                            tmpValue = value;
                            value = [];
                            value.push(tmpValue);
                        }
                        for(i = 0; i < value.length; i++){
                            this._addMousePanExcludeEntityId(value[i]);
                        }
                        break;
                    case 'include':
                        if(!value.length){
                            tmpValue = value;
                            value = [];
                            value.push(tmpValue);
                        }
                        for(i = 0; i < value.length; i++){
                            this._removeMousePanExcludeEntityId(value[i]);
                        }
                        break;
                }
            }
            else if(typeof options === 'object'){
                if(options.disabled === false || options.disabled === true){
                    this._ops._mousePan.disabled = options.disabled;
                }
                else{
                    this._ops._mousePan.disabled = false;//active by default (if not specified)
                }
                
                if(typeof options.excludeEntityIds !== 'undefined' && options.excludeEntityIds !== false){
                    this._ops._mousePan.excludeEntityIds = typeof options.excludeEntityIds === 'number' ? [options.excludeEntityIds] : options.excludeEntityIds;
                }
                else if(options.excludeEntityIds === false){
                    this._ops._mousePan.excludeEntityIds = [];//reset
                }
                
                if(typeof options.multiplier === 'number'){
                    this._ops._mousePan.multiplier = options.multiplier;
                }
                else if(typeof options.multiplier !== 'undefined'){
                    this._ops._mousePan.multiplier = 1;//1 by default
                }
                
                if(typeof options.start === 'function'){
                    this._mousePanStartdragHandler = options.start;
                }
                else if(typeof options.start !== 'undefined'){
                    this._mousePanStartdragHandler = null;
                }
                
                if(typeof options.drag === 'function'){
                    this._mousePanDragHandler = options.drag;
                }
                else if(typeof options.drag !== 'undefined'){
                    this._mousePanDragHandler = null;
                }
                
                if(typeof options.stop === 'function'){
                    this._mousePanStopdragHandler = options.stop;
                }
                else if(typeof options.stop !== 'undefined'){
                    this._mousePanStopdragHandler = null;
                }
            }
    
        },
                
        isMousePanEnabled : function(){
            return !this._ops._mousePan.disabled;
        },
                
        /**
         * @_name isMousePanning
         * @_module world
         * @description Returns true if the world is panning
         */ 
        isMousePanning: function(){
            return !!this._mousePanDragging;
        },
                
        /**
         * @_name touchPan
         * @_module world
         * @_params [options]
         * @description 
         Enables pan and pinch with touch, on the world.
         <br>The viewportInfos variable passed within the callback function contains the original viewport parameters when the drag started, and the current viewport parameters at the time of your callback.
         <br>Draggable entities are excluded by default (pan will not trigger if you click on it), you exclude other entities in the "excludeEntityIds" array (if you have special behaviours on them that would mess with the pan for example)
         <br>You can choose not to trigger the events you added to the world by flagging triggerWorldEvents = false
         <br>You can choose to disable the pinching by flagging allowPinch = false
         <h2>Examples</h2>
         <h3>Without options</h3>
         <code>world.touchPan();</code>
         <h3>With options</h3>
         <code>world.touchPan({
        &nbsp;&nbsp;start:function(e,viewportInfos){
        &nbsp;&nbsp;&nbsp;&nbsp;console.info('pan-start',viewportInfos);
        &nbsp;&nbsp;},
        &nbsp;&nbsp;drag:function(e,viewportInfos){
        &nbsp;&nbsp;&nbsp;&nbsp;console.info('pan-drag',e,viewportInfos);
        &nbsp;&nbsp;},
        &nbsp;&nbsp;stop:function(e,viewportInfos){
        &nbsp;&nbsp;&nbsp;&nbsp;console.info('pan-stop',e,viewportInfos);
        &nbsp;&nbsp;},
        &nbsp;&nbsp;startPinching:function(e,viewportInfos){
        &nbsp;&nbsp;&nbsp;&nbsp;console.info('pan+pinching started',e,viewportInfos);
        &nbsp;&nbsp;},
        &nbsp;&nbsp;stopPinching:function(e,viewportInfos){
        &nbsp;&nbsp;&nbsp;&nbsp;console.info('pan+pinching stopped',e,viewportInfos);
        &nbsp;&nbsp;},
        &nbsp;&nbsp;excludeEntityIds:[
        &nbsp;&nbsp;&nbsp;&nbsp;2,5
        &nbsp;&nbsp;],
        &nbsp;&nbsp;multiplier:1.2 //(default = 1)
        });</code>
         <h3>Enable / disable</h3>
         <code>world.touchPan('disable');
         world.touchPan('enable');</code>
         <h3>Exclude / include entities by their ids</h3>
         <code>world.touchPan('exclude',2);
         world.touchPan('include',4);
         world.touchPan('exclude',[7,8,12]);</code>
         * @options
         * <ul>
         * @disabled {Boolean} true/false to disable/enable the draggable state
         * @multiplier {Number} 1 by default
         * @allowPinch {Boolean} true by default
         * @triggerWorldEvents {Boolean} true by default
         * @excludeEntityIds [Ids ...] Ids of entities (optional)
         * @start function(e,viewportInfos)
         * @drag function(e,viewportInfos)
         * @stop function(e,viewportInfos)
         * @startPinching function(e,viewportInfos)
         * @stopPinching function(e,viewportInfos)
         * </ul>
         * @viewportInfos
         * <ul>
         * @x
         * @y
         * @width
         * @height
         * @scale
         * </ul>
         * @added by topheman
         */                
        touchPan : function(options,value){
            var i,tmpValue;
            if(checkBeforeAddEvent(this, "touch", "touchPan") === false){
                return false;
            }
            
            if(!this._ops._touchPan.excludeEntityIds){
                this._ops._touchPan.excludeEntityIds = [];
            }
            
            //simple init without options
            if(typeof options === 'undefined'){
                this._ops._touchPan.disabled = false;
            }
            //method call
            else if(typeof options === 'string'){
                switch(options){
                    case 'disable':
                        this._ops._touchPan.disabled = true;
                        break;
                    case 'enable':
                        this._ops._touchPan.disabled = false;
                        break;
                    case 'exclude':
                        if(!value.length){
                            tmpValue = value;
                            value = [];
                            value.push(tmpValue);
                        }
                        for(i = 0; i < value.length; i++){
                            this._addTouchPanExcludeEntityId(value[i]);
                        }
                        break;
                    case 'include':
                        if(!value.length){
                            tmpValue = value;
                            value = [];
                            value.push(tmpValue);
                        }
                        for(i = 0; i < value.length; i++){
                            this._removeTouchPanExcludeEntityId(value[i]);
                        }
                        break;
                }
            }
            else if(typeof options === 'object'){
                if(options.disabled === false || options.disabled === true){
                    this._ops._touchPan.disabled = options.disabled;
                }
                else{
                    this._ops._touchPan.disabled = false;//active by default (if not specified)
                }
                
                if(typeof options.excludeEntityIds !== 'undefined' && options.excludeEntityIds !== false){
                    this._ops._touchPan.excludeEntityIds = typeof options.excludeEntityIds === 'number' ? [options.excludeEntityIds] : options.excludeEntityIds;
                }
                else if(options.excludeEntityIds === false){
                    this._ops._touchPan.excludeEntityIds = [];//reset
                }
                
                if(options.triggerWorldEvents === false || options.triggerWorldEvents === true){
                    this._ops._touchPan.triggerWorldEvents = options.triggerWorldEvents;
                }
                else{
                    this._ops._touchPan.triggerWorldEvents = true;//active by default (if not specified)
                }
                
                if(options.allowPinch === false || options.allowPinch === true){
                    this._ops._touchPan.allowPinch = options.allowPinch;
                }
                else{
                    this._ops._touchPan.allowPinch = true;//enabled by default (if not specified)
                }
                
                if(typeof options.multiplier === 'number'){
                    this._ops._touchPan.panMultiplier = options.multiplier;
                }
                else if(typeof options.multiplier !== 'undefined'){
                    this._ops._touchPan.panMultiplier = 1;//1 by default
                }
                
                //this one isn't implemented yet
                if(typeof options.pinchMultiplier === 'number'){
                    this._ops._touchPan.pinchMultiplier = options.pinchMultiplier;
                }
                else if(typeof options.pinchMultiplier !== 'undefined'){
                    this._ops._touchPan.pinchMultiplier = 1;//1 by default
                }
                
                if(typeof options.start === 'function'){
                    this._touchPanStartdragHandler = options.start;
                }
                else if(typeof options.start !== 'undefined'){
                    this._touchPanStartdragHandler = null;
                }
                
                if(typeof options.drag === 'function'){
                    this._touchPanDragHandler = options.drag;
                }
                else if(typeof options.drag !== 'undefined'){
                    this._touchPanDragHandler = null;
                }
                
                if(typeof options.stop === 'function'){
                    this._touchPanStopdragHandler = options.stop;
                }
                else if(typeof options.stop !== 'undefined'){
                    this._touchPanStopdragHandler = null;
                }
                
                if(typeof options.startPinching === 'function'){
                    this._touchPanStartPinchingHandler = options.startPinching;
                }
                else if(typeof options.startPinching !== 'undefined'){
                    this._touchPanStartPinchingHandler = null;
                }
                
                if(typeof options.stopPinching === 'function'){
                    this._touchPanStopPinchingHandler = options.stopPinching;
                }
                else if(typeof options.stopPinching !== 'undefined'){
                    this._touchPanStopPinchingHandler = null;
                }
            }
        },
        
        /**
         * @_name isTouchPanEnabled
         * @_module world
         * @description Returns true if touchPan is enabled
         * @added by topheman
         */
        isTouchPanEnabled : function(){
            return !this._ops._touchPan.disabled;
        },
                
        /*
         * @function isTouchNotPanningNorPinching
         * @context World
         * @private (may not be used by the user)
         * @added by topheman
         * @description Returns true if world isn't panning at all
         */
        isTouchNotPanningNorPinching: function(){
            if(!this._touchPanDragging){
                return true;
            }
            return false;
        },
                
        /*
         * @function isTouchPanning
         * @context World
         * @private (may not be used by the user)
         * @added by topheman
         * @description Returns true if world is in touchPanning state (means only panning)
         */
        isTouchPanning: function(){
            if(this._touchPanDragging && !this._touchPanDragging.pinchingInfos){
                return true;
            }
            return false;
        },
                
        /*
         * @function isTouchPinching
         * @context World
         * @private (may not be used by the user)
         * @added by topheman
         * @description Returns true if world is in touchPinching state (means only panning + pinching)
         */
        isTouchPinching: function(){
            if(this._touchPanDragging && this._touchPanDragging.pinchingInfos){
                return true;
            }
            return false;
        },
                
        /*
         * @function isAllowedToTriggerTouchEvents
         * @context World
         * @private (may not be used by the user)
         * @added by topheman
         * @description Returns true if the world is allowed to trigger his events (the user may have set triggerWorldEvents to false when panning)
         */  
        isAllowedToTriggerTouchEvents: function(){
            if(!this._touchPanDragging || (this._touchPanDragging && this._ops._touchPan.triggerWorldEvents === true)){
                return true;
            }
            return false;
        },

        
        /**
         * @_name mousewheelZoom
         * @_module world
         * @_params [options]
         * @description 
         * Enables zooming with the mouse wheeling
         * @options
         * <ul>
         * @disabled {Boolean} true/false
         * @step {Number} 0.1 by default (how much you scale in/out at each wheel event)
         * </ul>
         * @added by topheman
         */
        mousewheelZoom : function(options){
            if(checkBeforeAddEvent(this, "mouse", "mousewheelZoom") === false){
                return false;
            }
            
            //simple init without options
            if(typeof options === 'undefined'){
                this._ops._mousewheelZoom.disabled = false;
            }
            //method call
            else if(typeof options === 'string'){
                switch(options){
                    case 'disable':
                        this._ops._mousewheelZoom.disabled = true;
                        break;
                    case 'enable':
                        this._ops._mousewheelZoom.disabled = false;
                        break;
                }
            }
            else if(typeof options === 'object'){
                if(options.disabled === false || options.disabled === true){
                    this._ops._mousewheelZoom.disabled = options.disabled;
                }
                else{
                    this._ops._mousewheelZoom.disabled = false;//active by default (if not specified)
                }
                
                if(typeof options.step === 'number'){
                    this._ops._mousewheelZoom.step = options.step;
                }
                else if(typeof options.step !== 'undefined'){
                    this._ops._mousewheelZoom.step = 0.1;//0.1 by default
                }
            }
        },
        
        /**
         * @_name isMousewheelZoomEnabled
         * @_module world
         * @description Returns true if mouseWheelZoom is enabled
         * @added by topheman
         */    
        isMousewheelZoomEnabled : function(){
            return !this._ops._mousewheelZoom.disabled;
        }
        
    };
    
    var ENTITY_DEFAULT_OPTIONS = {
        name: 'unnamed object',
        x: 10,
        y: 5,
        type: 'dynamic', // or static
        shape: 'square', // or circle or polygon
        height: 1, // for box
        width: 1, // for box
        radius: 1, // for circle
        points: [{x:0, y:0}, // for polygon
                 {x:2, y:0},
                 {x:0, y:2}],
        density: 2,
        friction: 1,
        restitution: 0.2, // bounciness
        active: true, // participates in collision and dynamics
        rotation: null,
        fixedRotation: false,
        bullet: false, // perform expensive continuous collision detection
        maxVelocityX: 1000,
        maxVelocityY: 1000,
        image: null,
        imageOffsetX: 0,
        imageOffsetY: 0,
        imageStretchToFit: null,
        color: 'gray',
        borderColor: 'black',
        borderWidth: 1,
        spriteSheet: false,
        spriteWidth: 16,
        spriteHeight: 16,
        spriteX: 0,
        spriteY: 0,
        _mouseDraggable : {//@added by topheman
            disabled: true,//drag disabled by default
            type: 'regularDrag'
        },
        _touchDraggable : {//@added by topheman
            disabled: true,
            type: 'regularDrag',
            maxTouches: 100
        },
        init: null,
        draw: function(ctx, x, y) {
            var cameraOffsetX = -this._world._cameraX;
            var cameraOffsetY = -this._world._cameraY;
            ctx.fillStyle = typeof this._ops.color === 'function' ? this._ops.color.call(this,ctx) : this._ops.color;
            ctx.strokeStyle = this._ops.borderColor;
            ctx.lineWidth = this._ops.borderWidth;
            var i;
            var scale = this._world._scale;
            var collisionOutlines = this._world._ops.collisionOutlines;
            var ox = this._ops.imageOffsetX || 0;
            var oy = this._ops.imageOffsetY || 0;
            ox *= scale;
            oy *= scale;
            if (this._sprite !== undefined) {
                var width;
                var height;
                if (this._ops.shape === "circle" && this._ops.imageStretchToFit) {
                    width = height = this._ops.radius * 2;
                    x -= this._ops.radius / 2 * scale;
                    y -= this._ops.radius / 2 * scale;
                }
                else if (this._ops.shape === "square" && this._ops.imageStretchToFit) {
                    width = this._ops.width;
                    height = this._ops.height;
                    x -= this._ops.width / 4 * scale;
                    y -= this._ops.height / 4 * scale;
                }
                else if (this._ops.imageStretchToFit) {
                    width = this._ops.width;
                    height = this._ops.height;
                }
                else if (this._ops.spriteSheet) {
                    width = this._ops.spriteWidth / 30;
                    height = this._ops.spriteHeight / 30;
                }
                else {
                    width = this._sprite.width / 30;
                    height = this._sprite.height / 30;
                }

                var tx = ox + (x + width / 4 * scale);
                var ty = oy + (y + height / 4 * scale);
                
                ctx.translate(tx, ty);
                
                ctx.rotate(this._body.GetAngle());
                
                if (this._ops.spriteSheet) {
                    ctx.drawImage(this._sprite,
                                  this._ops.spriteX * this._ops.spriteWidth,
                                  this._ops.spriteY * this._ops.spriteHeight,
                                  this._ops.spriteWidth,
                                  this._ops.spriteHeight,
                                  -(width / 2 * scale),
                                  -(height / 2 * scale),
                                  width * scale,
                                  height * scale);
                }
                else {
                    ctx.drawImage(this._sprite,
                                  -(width / 2 * scale),
                                  -(height / 2 * scale),
                                  width * scale,
                                  height * scale);
                }
                              
                ctx.rotate(0 - this._body.GetAngle());              
                              
                ctx.translate(-tx, -ty);

            }

            if (this._sprite && !collisionOutlines) {
                return;
            }

            if (collisionOutlines) {
                if (this._sprite !== undefined) {
                    ctx.fillStyle = "transparent";
                }
                ctx.strokeStyle = "rgb(255, 0, 255)";
                ctx.lineWidth = 2;
            }

            if (this._ops.shape === 'polygon' || this._ops.shape === 'square') {
                var poly = this._body.GetFixtureList().GetShape();
                var vertexCount = parseInt(poly.GetVertexCount(), 10);
                var localVertices = poly.GetVertices();
                var vertices = new Vector(vertexCount);
                var xf = this._body.m_xf;
                for (i = 0; i < vertexCount; ++i) {
                   vertices[i] = b2Math.MulX(xf, localVertices[i]);
                }
                ctx.beginPath();
                ctx.moveTo((cameraOffsetX + vertices[0].x) * scale, (cameraOffsetY + vertices[0].y) * scale);
                for (i = 1; i < vertices.length; i++) {
                    ctx.lineTo((cameraOffsetX + vertices[i].x) * scale, (cameraOffsetY + vertices[i].y) * scale);
                }
                ctx.closePath();
                if (this._ops.borderWidth !== 0 || collisionOutlines) {
                    ctx.stroke();
                }
                ctx.fill();
            }
            else if (this._ops.shape === 'circle') {
                var p = this.position();
                ctx.beginPath();
                ctx.arc((cameraOffsetX + p.x) * scale,
                        (cameraOffsetY + p.y) * scale,
                        this._ops.radius * scale,
                        0,
                        Math.PI * 2, true);
                ctx.closePath();
                if (this._ops.borderWidth !== 0 || collisionOutlines) {
                    ctx.stroke();
                }
                ctx.fill();
            }
        }
    };
    
    /**
     * @_name Entity
     * @header
     * @description a single physical object in the physics simulation
     */
    var Entity = {
        
        _id: null,
        _ops: null,
        _body: null,
        _world: null,
        
        _init: function(world, options, id) {
            var ops;
            var op;

            if (options && options.components !== undefined) {
                options.components.reverse();
                options.components.forEach(function(component) {
                    extend(options, component);
                });
            }

            this._ops = extend(options, ENTITY_DEFAULT_OPTIONS);
            ops = this._ops;
            
            this._body = new b2BodyDef();
            var body = this._body;
            
            this._world = world;
            this._id = id;

            // $ props
            for (op in this._ops) {
                if (op.match(/^\$/)) {
                    this[op] = this._ops[op];
                }
            }
            
            var fixture = new b2FixtureDef();
            fixture.density = ops.density;
            fixture.friction = ops.friction;
            fixture.restitution = ops.restitution;
            
            body.position.x = ops.x;
            body.position.y = ops.y;
            
            this._name = ops.name;

            // type
            if (ops.type === 'static') {
                body.type = b2Body.b2_staticBody;
            }
            else if (ops.type === 'dynamic') {
                body.type = b2Body.b2_dynamicBody;
            }
            
            // shape
            if (ops.shape === 'square') {
                fixture.shape = new shapes.b2PolygonShape();
                // box2d asks for "half the width", we ask for the actual width
                fixture.shape.SetAsBox(ops.width / 2, ops.height / 2);
            }
            else if (ops.shape === 'circle') {
                fixture.shape = new shapes.b2CircleShape(ops.radius);
            }
            else if (ops.shape === 'polygon') {
                fixture.shape = new shapes.b2PolygonShape();
                fixture.shape.SetAsArray(ops.points, ops.points.length);
            }
            
            // rotation
            if (ops.rotation) {
                body.angle = ops.rotation / DEGREES_PER_RADIAN;
            }

            // rendering stuff
            if (ops.draw) {
                this._draw = ops.draw;
            }
            if (ops.image) {
                this._sprite = new Image();
                this._sprite.src = ops.image;
            }
            
            body.active = ops.active;
            body.fixedRotation = ops.fixedRotation;
            body.bullet = ops.bullet;
            
            this._body = world._world.CreateBody(body);
            this._body.CreateFixture(fixture);
            this._body._bbid = id;
            
            // events
            if (ops.onStartContact) {
                this._world._addStartContactHandler(id, ops.onStartContact);
            }
            if (ops.onFinishContact) {
                this._world._addFinishContactHandler(id, ops.onFinishContact);
            }
            if (ops.onImpact) {
                this._world._addImpactHandler(id, ops.onImpact);
            }
            if (ops.onKeyDown) {
                if(checkBeforeAddEvent(this, "key", "onKeyDown") === true){
                    this._world._addKeydownHandler(id, ops.onKeyDown);
                }
            }
            //@added by topheman to keep case matching
            else if(ops.onKeydown) {
                if(checkBeforeAddEvent(this, "key", "onKeydown") === true){
                    this._world._addKeydownHandler(id, ops.onKeydown);
                }
            }
            if (ops.onKeyUp) {
                if(checkBeforeAddEvent(this, "key", "onKeyUp") === true){
                    this._world._addKeyupHandler(id, ops.onKeyUp);
                }
            }
            //@added by topheman to keep case matching
            else if(ops.onKeyup) {
                if(checkBeforeAddEvent(this, "key", "onKeyup") === true){
                    this._world._addKeydownHandler(id, ops.onKeyup);
                }
            }
            if (ops.onRender) {
                this.onRender(ops.onRender);
            }
            if (ops.onTick) {
                this.onTick(ops.onTick);
            }
            
            //@added by topheman
            if (ops.onMousedown) {
                if(checkBeforeAddEvent(this, "mouse", "onMousedown") === true){
                    this._world._addMousedownHandler(id, ops.onMousedown);
                }
            }
            if (ops.onMouseup) {
                if(checkBeforeAddEvent(this, "mouse", "onMouseup") === true){
                    this._world._addMouseupHandler(id, ops.onMouseup);
                }
            }
            if (ops.onMousemove) {
                if(checkBeforeAddEvent(this, "mouse", "onMousemove") === true){
                    this._world._addMousemoveHandler(id, ops.onMousemove);
                }
            }
            if (ops.onMousein) {
                if(checkBeforeAddEvent(this, "mouse", "onMousein") === true){
                    this._world._addMouseinHandler(id, ops.onMousein);
                }
            }
            if (ops.onMouseout) {
                if(checkBeforeAddEvent(this, "mouse", "onMouseout") === true){
                    this._world._addMouseoutHandler(id, ops.onMouseout);
                }
            }
            if (ops.onMousewheel) {
                if(checkBeforeAddEvent(this, "mouse", "onMousewheel") === true){
                    this._world._addMousewheelHandler(id, ops.onMousewheel);
                }
            }
            if (ops.onTouchstart) {
                if(checkBeforeAddEvent(this, "touch", "onTouchstart") === true){
                    this._world._addTouchstartHandler(id, ops.onTouchstart);
                }
            }
            if (ops.onTouchend) {
                if(checkBeforeAddEvent(this, "touch", "onTouchend") === true){
                    this._world._addTouchendHandler(id, ops.onTouchend);
                }
            }
            if (ops.onTouchmove) {
                if(checkBeforeAddEvent(this, "touch", "onTouchmove") === true){
                    this._world._addTouchmoveHandler(id, ops.onTouchmove);
                }
            }

            // custom init function
            if (ops.init) {
                ops.init.call(this);
            }
        },
        
        // returns a vector. params can be either of the following:
        // power, x, y
        // power, degrees
        _toVector: function(power, a, b) {
            var x;
            var y;
            a = a || 0;
            if (b === undefined) {
                a -= 90;
                x = Math.cos(a * (Math.PI / 180)) * power;
                y = Math.sin(a * (Math.PI / 180)) * power;
            }
            else {
                x = a * power;
                y = b * power;
            }
            return {x:x,y:y};
        },
        
        /**
         * @_name name
         * @_module entity
         * @_params [value]
         * @return entity name
         * @description get or set entity name
         */
        name: function(value) {
          if (value !== undefined) {
            this._name = value;
          }
          return this._name;
        },
        
        /**
         * @_name position
         * @_module entity
         * @_params [value]
         * @value {x,y}
         * @return {x,y}
         * @description get or set entity position
         */
        position: function(value) {
            if (value !== undefined) {
                if (this._world._world.IsLocked()) {
                    this._world._positionQueue.push({
                        o: this,
                        val: value
                    });
                }
                else {
                    this._body.SetPosition(new b2Vec2(value.x, value.y));
                }
            }
            var p = this._body.GetPosition();
            return {x: p.x, y: p.y};
        },
        
        /**
         * @_name checkPosition
         * @_module entity
         * @_params x,y
         * @description Checks if the entity is at x,y
         * @returns {Boolean}
         * @added by topheman
         */
        checkPosition: function(x,y){
            var body;
            
            if(this._body.GetType() !== b2Body.b2_staticBody){
                this._world._world.QueryPoint(function (fixture) {
                    body = fixture.GetBody();
                }, new b2Vec2(x, y));
            }
            else{
                var aabb = new b2AABB();
                aabb.lowerBound.Set(x - 0.001, y - 0.001);
                aabb.upperBound.Set(x - 0.001, y - 0.001);
                this._world._world.QueryAABB(function(fixture){
                    body = fixture.GetBody();
                }, aabb);
            }
            
            if(body !== undefined && this._id === body._bbid){
                return true;
            }
            else{
                return false;
            }
        },
        
        /**
         * @_name canvasPosition
         * @_module entity
         * @_params
         * @return {x,y}
         * @description Get the Entity position in pixels. Useful for custom
         * rendering. Unlike <a href="#entity.position">position</a> the result
         * is relative to the World's scale and camera position.
         */
        canvasPosition: function(value) {
            if (value !== undefined) {
                // TODO set
            }
            
            var p = this.position();

            return this._world.canvasPositionAt(p.x, p.y);
        },
        
        /**
         * @_name rotation
         * @_module entity
         * @_params [value]
         * @value degrees
         * @return degrees
         * @description get or set entity rotation
         */
        rotation: function(value) {
            if (value !== undefined) {
                this._body.SetAngle(value / DEGREES_PER_RADIAN);
            }
            return this._body.GetAngle() * DEGREES_PER_RADIAN;
        },
        
        /**
         * @_name friction
         * @_module entity
         * @_params [value]
         * @value number
         * @return number
         * @description get or set entity friction
         */
        friction: function(value) {
            if (value !== undefined) {
                this._body.GetFixtureList().SetFriction(value);
            }
            return this._body.GetFixtureList().GetFriction();
        },

        /**
         * @_name restitution
         * @_module entity
         * @_params [value]
         * @value number
         * @return number
         * @description get or set entity restitution (bounciness)
         */
        restitution: function(value) {
            if (value !== undefined) {
                this._body.GetFixtureList().SetRestitution(value);
            }
            return this._body.GetFixtureList().GetRestitution();
        },

        /**
         * @_name maxVelocityX
         * @_module entity
         * @_params [value]
         * @value number
         * @return number
         * @description get or set entity max velocity left or right
         */
        maxVelocityX: function(value) {
            if (value !== undefined) {
                this._ops.maxVelocityX = value;
            }
            return this._ops.maxVelocityX;
        },

        /**
         * @_name maxVelocityY
         * @_module entity
         * @_params [value]
         * @value number
         * @return number
         * @description get or set entity max velocity up or down
         */
        maxVelocityY: function(value) {
            if (value !== undefined) {
                this._ops.maxVelocityY = value;
            }
            return this._ops.maxVelocityY;
        },

        /**
         * @_name image
         * @_module entity
         * @_params [value]
         * @value string
         * @return string
         * @description get or set entity image
         */
        image: function(value) {
            if (value !== undefined) {
                this._sprite = new Image();
                this._sprite.src = value;
            }
            return this._sprite.src;
        },

        /**
         * @_name imageOffsetX
         * @_module entity
         * @_params [value]
         * @value number
         * @return number
         * @description get or set entity image offset in the x direction
         */
        imageOffsetX: function(value) {
            if (value !== undefined) {
                this._ops.imageOffsetX = value;
            }
            return this._ops.imageOffsetX;
        },

        /**
         * @_name imageOffsetY
         * @_module entity
         * @_params [value]
         * @value number
         * @return number
         * @description get or set entity image offset in the y direction
         */
        imageOffsetY: function(value) {
            if (value !== undefined) {
                this._ops.imageOffsetY = value;
            }
            return this._ops.imageOffsetY;
        },

        /**
         * @_name imageStretchToFit
         * @_module entity
         * @_params [value]
         * @value boolean
         * @return boolean
         * @description set to true to stretch image to entity size
         */
        imageStretchToFit: function(value) {
            if (value !== undefined) {
                this._ops.imageStretchToFit = value;
            }
            return this._ops.imageStretchToFit;
        },

        /**
         * @_name color
         * @_module entity
         * @_params [value]
         * @value css color string
         * @return css color string
         * @description get or set entity's color
         */
        color: function(value) {
            if (value !== undefined) {
                this._ops.color = value;
            }
            return this._ops.color;
        },

        /**
         * @_name borderColor
         * @_module entity
         * @_params [value]
         * @value css color string
         * @return css color string
         * @description get or set entity's border color
         */
        borderColor: function(value) {
            if (value !== undefined) {
                this._ops.borderColor = value;
            }
            return this._ops.borderColor;
        },

        /**
         * @_name borderWidth
         * @_module entity
         * @_params [value]
         * @value number
         * @return number
         * @description get or set entity's border width.
         * Set to 0 to not show a border.
         */
        borderWidth: function(value) {
            if (value !== undefined) {
                this._ops.borderWidth = value;
            }
            return this._ops.borderWidth;
        },

        /**
         * @_name spriteSheet
         * @_module entity
         * @_params [value]
         * @value boolean
         * @return boolean
         * @description get or set if this entity's image is a sprite sheet
         */
        spriteSheet: function(value) {
            if (value !== undefined) {
                this._ops.spriteSheet = value;
            }
            return this._ops.spriteSheet;
        },

        /**
         * @_name spriteWidth
         * @_module entity
         * @_params [value]
         * @value number
         * @return number
         * @description get or set width of a sprite on the sprite sheet
         */
        spriteWidth: function(value) {
            if (value !== undefined) {
                this._ops.spriteWidth = value;
            }
            return this._ops.spriteWidth;
        },

        /**
         * @_name spriteHeight
         * @_module entity
         * @_params [value]
         * @value number
         * @return number
         * @description get or set height of a sprite on the sprite sheet
         */
        spriteHeight: function(value) {
            if (value !== undefined) {
                this._ops.spriteHeight = value;
            }
            return this._ops.spriteHeight;
        },

        /**
         * @_name draw
         * @_module entity
         * @_params [value]
         * @value function
         * @return function
         * @description get or set the draw function for this entity
         */
        draw: function(value) {
            if (value !== undefined) {
                this._draw = value;
            }
            return this._draw;
        },
        
        /**
         * @_name destroy
         * @_module entity
         * @description destroy this entity and remove it from the world
         */
        destroy: function() {
            this._destroyed = true;
            this._world._destroy(this);
        },

        /**
         * @_name applyImpulse
         * @_module entity
         * @power of impulse
         * @degrees direction of force. 0 is up, 90 is right, etc.
         * @_params power, degrees
         * @description Apply an instantanious force on this Entity.
         * <br>
         * With this and all functions that take degrees, you can also provide
         * a vector.
         * <code>entity.applyImpulse(10, 45); // 45 degree angle
         * entity.applyImpulse(10, 1, -1); // the vector x=1 y=-1}</code>
         */
        applyImpulse: function(power, a, b) {
            var v = this._toVector(power, a, b);
            this._world._applyImpulse(this._id, this._body, v.x, v.y);
        },
        
        /**
         * @_name setForce
         * @_module entity
         * @name of force
         * @power of force
         * @degrees direction of force
         * @_params name, power, degrees
         * @description Apply a constant force on this Entity. Can be removed later
         * using clearForce.
         */
        setForce: function(name, power, a, b) {
            var v = this._toVector(power, a, b);
            this._world._setConstantForce(name, this._id, this._body, v.x, v.y);
        },
        
        /**
         * @_name setVelocity
         * @_module entity
         * @name of velocity
         * @power of velocity
         * @degrees direction of velocity
         * @_params name, power, degrees
         * @description Continuously override velocity of this Entity. Can be removed later
         * using clearVelocity. Usually you probably want setForce or applyImpulse.
         */
        setVelocity: function(name, power, a, b) {
            var v = this._toVector(power, a, b);
            this._world._setConstantVelocity(name, this._id, this._body, v.x, v.y);
        },

        /**
         * @_name clearForce
         * @_module entity
         * @description Stop the force with the given name.
         */
        clearForce: function(name) {
            this._world._clearConstantForce(name, this._id);
        },

        /**
         * @_name clearVelocity
         * @_module entity
         * @description Stop the constant velocity with the given name.
         */
        clearVelocity: function(name) {
            this._world._clearConstantVelocity(name, this._id);
        },
        
        /**
         * @_name onKeydown
         * @_module entity
         * @_params callback
         * @callback function( e )
         * <ul>
         * @e keydown event
         * @this this Entity
         * </ul>
         * @description Handle keydown event for this entity.
         */
        onKeydown: function(callback) {
            if(checkBeforeAddEvent(this, "key", "onKeydown") === false){
                return false;
            }
            this._world._addKeydownHandler(this._id, callback);
        },
        
        /**
         * @_name onKeyup
         * @_module entity
         * @_params callback
         * @callback function( e )
         * <ul>
         * @e keyup event
         * @this this Entity
         * </ul>
         * @description Handle keyup event for this entity.
         */
        onKeyup: function(callback) {
            if(checkBeforeAddEvent(this, "key", "onKeyup") === false){
                return false;
            }
            this._world._addKeyupHandler(this._id, callback);
        },
        
        /**
         * @_name onMousedown
         * @_module entity
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {x,y}
         * @this Entity
         * </ul>
         * @description Add an onMousedown callback to this entity
         * @added by topheman
         */
        onMousedown : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMousedown") === false){
                return false;
            }
            this._world._addMousedownHandler(this._id, callback);
        },
        
        /**
         * @_name onMouseup
         * @_module entity
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {x,y}
         * @this Entity
         * </ul>
         * @description Add an onMouseup callback to this entity
         * @added by topheman
         */     
        onMouseup : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMouseup") === false){
                return false;
            }
            this._world._addMouseupHandler(this._id, callback);
        },
        
        /**
         * @_name onMousemove
         * @_module entity
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {x,y}
         * @this Entity
         * </ul>
         * @description Add an onMousemove callback to this entity
         * @added by topheman
         */    
        onMousemove : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMousemove") === false){
                return false;
            }
            this._world._addMousemoveHandler(this._id, callback);
        },
        
        /**
         * @_name unbindOnMousedown
         * @_module entity
         * @description Removes the onMousedown callback from this entity
         * @added by topheman
         */    
        unbindOnMousedown: function(){
            this._world._removeMousedownHandler(this._id);
        },
        
        /**
         * @_name unbindOnMouseup
         * @_module entity
         * @description Removes the onMouseup callback from this entity
         * @added by topheman
         */   
        unbindOnMouseup: function(){
            this._world._removeMouseupHandler(this._id);
        },
        
        /**
         * @_name unbindOnMousemove
         * @_module entity
         * @description Removes the onMousemove callback from this entity
         * @added by topheman
         */    
        unbindOnMousemove: function(){
            this._world._removeMousemoveHandler(this._id);
        },
        
        /**
         * @_name onMousein
         * @_module entity
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {x,y}
         * @this Entity
         * </ul>
         * @description Add an onMousein callback to this entity
         * @added by topheman
         */    
        onMousein : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMousein") === false){
                return false;
            }
            this._world._addMouseinHandler(this._id, callback);
        },
        
        /**
         * @_name onMouseout
         * @_module entity
         * @_params callback
         * @callback function(e,mouseInfos)
         * <ul>
         * @e MouseEvent
         * @mouseInfos {x,y}
         * @this Entity
         * </ul>
         * @description Add an onMouseout callback to this entity
         * @added by topheman
         */    
        onMouseout : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMouseout") === false){
                return false;
            }
            this._world._addMouseoutHandler(this._id, callback);
        },
        
        /**
         * @_name unbindOnMousein
         * @_module entity
         * @description Removes the onMousein callback from this entity
         * @added by topheman
         */    
        unbindOnMousein: function(){
            this._world._removeMouseinHandler(this._id);
        },
        
        /**
         * @_name unbindOnMouseout
         * @_module entity
         * @description Removes the onMouseout callback from this entity
         * @added by topheman
         */    
        unbindOnMouseout: function(){
            this._world._removeMouseoutHandler(this._id);
        },
        
        /**
         * @_name onTouchstart
         * @_module entity
         * @_params callback
         * @callback function(e,touchInfos)
         * <ul>
         * @e TouchEvent
         * @touchInfos {touchIdentifier,x,y}
         * @this Entity
         * </ul>
         * @description Add an onTouchstart callback to this entity
         * @added by topheman
         */  
        onTouchstart : function(callback){
            if(checkBeforeAddEvent(this, "touch", "onTouchstart") === false){
                return false;
            }
            this._world._addTouchstartHandler(this._id, callback);
        },
        
        /**
         * @_name onTouchend
         * @_module entity
         * @_params callback
         * @callback function(e,touchInfos)
         * <ul>
         * @e TouchEvent
         * @touchInfos {touchIdentifier,x,y}
         * @this Entity
         * </ul>
         * @description Add an onTouchend callback to this entity
         * @added by topheman
         */  
        onTouchend : function(callback){
            if(checkBeforeAddEvent(this, "touch", "onTouchend") === false){
                return false;
            }
            this._world._addTouchendHandler(this._id, callback);
        },
        
        /**
         * @_name onTouchmove
         * @_module entity
         * @_params callback
         * @callback function(e,touchInfos)
         * <ul>
         * @e TouchEvent
         * @touchInfos {touchIdentifier,x,y}
         * @this Entity
         * </ul>
         * @description Add an onTouchmove callback to this entity
         * @added by topheman
         */  
        onTouchmove : function(callback){
            if(checkBeforeAddEvent(this, "touch", "onTouchmove") === false){
                return false;
            }
            this._world._addTouchmoveHandler(this._id, callback);
        },
        
        /**
         * @_name unbindOnTouchstart
         * @_module entity
         * @description Removes the onTouchstart callback from this entity
         * @added by topheman
         */    
        unbindOnTouchstart: function(){
            this._world._removeTouchstartHandler(this._id);
        },
        
        /**
         * @_name unbindOnTouchend
         * @_module entity
         * @description Removes the onTouchend callback from this entity
         * @added by topheman
         */    
        unbindOnTouchend: function(){
            this._world._removeTouchendHandler(this._id);
        },
        
        /**
         * @_name unbindOnTouchmove
         * @_module entity
         * @description Removes the onTouchmove callback from this entity
         * @added by topheman
         */    
        unbindOnTouchmove: function(){
            this._world._removeTouchmoveHandler(this._id);
        },
        
        /**
         * @_name onMousewheel
         * @_module entity
         * @_params callback
         * @callback function(e,mousewheelInfos)
         * <ul>
         * @e MouseEvent
         * @mousewheelInfos
         * <ul>
         * @x
         * @y
         * @delta : -1 or 1
         * </ul>
         * @this Entity
         * </ul>
         * @description Add an onMousewheel callback to this entity
         * @added by topheman
         */
        onMousewheel : function(callback){
            if(checkBeforeAddEvent(this, "mouse", "onMousewheel") === false){
                return false;
            }
            this._world._addMousewheelHandler(this._id, callback);
        },
        
        /**
         * @_name unbindOnMousewheel
         * @_module entity
         * @description Removes the onMousewheel callback from this entity
         * @added by topheman
         */ 
        unbindOnMousewheel: function(){
            this._world._removeMousewheelHandler(this._id);
        },

        /**
         * @_name onStartContact
         * @_module entity
         * @_params callback
         * @callback function( entity )
         * <ul>
         * @entity that contact started with
         * @this this Entity
         * </ul>
         * @description Handle start of contact with another entity.
         */
        onStartContact: function(callback) {
            this._world._addStartContactHandler(this._id, callback);
        },

        /**
         * @_name onFinishContact
         * @_module entity
         * @_params callback
         * @callback function( entity )
         * <ul>
         * @entity that contact ended with
         * @this this Entity
         * </ul>
         * @description Handle end of contact with another entity.
         */
        onFinishContact: function(callback) {
            this._world._addFinishContactHandler(this._id, callback);
        },

        /**
         * @_name onImpact
         * @_module entity
         * @_params callback
         * @callback function( entity, normalForce, tangentialForce )
         * <ul>
         * @entity collided with
         * @normalForce force of two entities colliding
         * @tangentialForce force of two entities "rubbing" up against each other
         * @this this Entity
         * </ul>
         * @description Handle impact with another entity.
         */
        onImpact: function(callback) {
            this._world._addImpactHandler(this._id, callback);
        },

        /**
         * @_name onRender
         * @_module entity
         * @_params callback
         * @callback function( context )
         * <ul>
         * @context canvas context for rendering
         * @this Entity
         * </ul>
         * @description Add an onRender callback to this Entity
         * <br>
         * Multiple onRender callbacks can be added, and they can be removed
         * with world.unbindOnRender.
         */
        onRender: function(callback) {
            this._world._onRender.push({
                fun: callback,
                ctx: this
            });
        },

        /**
         * @_name onTick
         * @_module entity
         * @_params callback
         * @callback function()
         * <ul>
         * @this Entity
         * </ul>
         * @description Add an onTick callback to this Entity
         * <br>
         * Ticks are periodic events that happen independant of rendering.
         * You can use ticks as your "game loop". The default tick frequency
         * is 50 milliseconds, and it can be set as an option when creating
         * the world.
         * <br>
         * Multiple onTick callbacks can be added, and they can be removed
         * with world.unbindOnTick.
         */
        onTick: function(callback) {
            this._world._onTick.push({
                fun: callback,
                ctx: this
            });
        },

        /**
         * @_name sprite
         * @_module entity
         * @_params x,y
         * @description Set the entity's image to the sprite at x, y on the sprite sheet.
         * Used only on entities with spriteSheet:true
         */
        sprite: function(x, y) {
            this._ops.spriteX = x;
            this._ops.spriteY = y;
        },
          
        /**
         * @_name pin
         * @_module entity
         * @_params x,y
         * @optional x,y
         * @description Pins an entity to the world
         * @added by topheman
         */
        pin: function(x,y) {
            if(this.isPined()){
                this.unPin();
            }
            var position = this.position(), jointDefinition, localX, localY, localCoords;
            x = x || position.x;
            y = y || position.y;
            localCoords = this._body.GetLocalPoint(new b2Vec2(x,y));
            localX = localCoords.x;
            localY = localCoords.y;
            
            jointDefinition = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
            jointDefinition.bodyA = this._world._world.GetGroundBody();
            jointDefinition.bodyB = this._body;
            if(jointDefinition.target && jointDefinition.target.Set){
                jointDefinition.target.Set(x, y);
            }
            else{
                jointDefinition.localAnchorA.Set(x,y);
            }
            jointDefinition.localAnchorB.Set(localX,localY);
            jointDefinition.maxForce = 10000000000000000000000000000;//100000
            jointDefinition.timeStep = 1/60;//hard coded ?!!
            this._pinJoint = this._world._world.CreateJoint(jointDefinition);
        },
          
        /**
         * @_name unPin
         * @_module entity
         * @description Unpins an entity from the world
         * @added by topheman
         */
        unPin: function(){
            if(this._pinJoint){
                this._world._world.DestroyJoint(this._pinJoint);
                this._pinJoint = null;
            }
        },
          
        /**
         * @_name isPined
         * @_module entity
         * @return {Boolean}
         * @description Returns true if the entity is pined to the world
         * @added by topheman
         */   
        isPined : function(){
            return this._pinJoint ? true : false;
        },
                
        /**
         * @_name mouseDraggable
         * @_module entity
         * @_params [options]
         * @description 
         Turns an entity to draggable by the mouse, with multiple callbacks.
         <br>The mouseDraggableInfos variable passed within the callback function contains the original position of the mouse when the drag started and its current position.
         <h2>Examples</h2>
         <h3>Without options</h3>
         <code>entity.mouseDraggable();</code>
         <h3>With options</h3>
         <code>entity.mouseDraggable({
         &nbsp;&nbsp;start : function(e, mouseDraggableInfos){
         &nbsp;&nbsp;&nbsp;&nbsp;console.info('start dragging '+this.name()+' at position',{mouseDraggableInfos.position.x, mouseDraggableInfos.position.y});
         &nbsp;&nbsp;},
         &nbsp;&nbsp;drag : function(e, mouseDraggableInfos){
         &nbsp;&nbsp;&nbsp;&nbsp;console.info('dragging '+this.name()+' at position', {mouseDraggableInfos.position.x, mouseDraggableInfos.position.y});
         &nbsp;&nbsp;},
         &nbsp;&nbsp;stop : function(e, mouseDraggableInfos){
         &nbsp;&nbsp;&nbsp;&nbsp;console.info('just dragged '+this.name(), 'from', {mouseDraggableInfos.originalPosition.x, mouseDraggableInfos.originalPosition.y}, 'to', {mouseDraggableInfos.position.x, mouseDraggableInfos.position.y});
         &nbsp;&nbsp;}
         });</code>
         <h3>Enable / disable</h3>
         <code>entity.mouseDraggable('disable');</code>
         * @options
         * <ul>
         * @disabled {Boolean} true/false to disable/enable the draggable state
         * @type {String} "regularDrag" or "eventDrag"
         * <ul>
         * @regularDrag : Moves the entity with the mouse (by default)
         * @eventDrag : doesn't move the entity, only sends you the data and callbacks
         * </ul>
         * @start function(e,mouseDraggableInfos)
         * @drag function(e,mouseDraggableInfos)
         * @stop function(e,mouseDraggableInfos)
         * </ul>
         * @mouseDraggableInfos
         * <ul>
         * @position : {x,y}
         * @originalPosition : {x,y}
         * </ul>
         * @added by topheman
         */
        mouseDraggable: function(options){
            if(checkBeforeAddEvent(this, "mouse", "mouseDraggable") === false){
                return false;
            }
            //simple init without options
            if(typeof options === 'undefined'){
                this._ops._mouseDraggable.disabled = false;
            }
            //method call
            else if(typeof options === 'string'){
                switch(options){
                    case 'disable':
                        this._ops._mouseDraggable.disabled = true;
                        break;
                    case 'enable':
                        this._ops._mouseDraggable.disabled = false;
                        break;
                }
            }
            else if(typeof options === 'object'){
                if(options.disabled === false || options.disabled === true){
                    this._ops._mouseDraggable.disabled = options.disabled;
                }
                else{
                    this._ops._mouseDraggable.disabled = false;//active by default (if not specified)
                }
                
                if(typeof options.type === 'string'){
                    this._ops._mouseDraggable.type = options.type;
                }
                
                if(typeof options.start === 'function'){
                    this._world._addMouseStartdragHandler(this._id,options.start);
                }
                else if(typeof options.start !== 'undefined'){
                    this._world._removeMouseStartdragHandler(this._id);
                }
                
                if(typeof options.drag === 'function'){
                    this._world._addMouseDragHandler(this._id,options.drag);
                }
                else if(typeof options.drag !== 'undefined'){
                    this._world._removeMouseDragHandler(this._id);
                }
                
                if(typeof options.stop === 'function'){
                    this._world._addMouseStopdragHandler(this._id,options.stop);
                }
                else if(typeof options.stop !== 'undefined'){
                    this._world._removeMouseStopdragHandler(this._id);
                }
            }
            
            //tag or untag the entity as draggable in the world to exclude it from the pan
            if(this._ops._mouseDraggable.disabled === false){
                this._world._addMouseDraggableEntityId(this._id);
            }
            else{
                this._world._removeMouseDraggableEntityId(this._id);
            }
        },
          
        /**
         * @_name isMouseDraggable
         * @_module entity
         * @return {Boolean}
         * @description Returns true if the mouse draggable event is active on the entity
         * @added by topheman
         */     
        isMouseDraggable : function() {
    
            return !this._ops._mouseDraggable.disabled;
    
        },
                
        /**
         * @_name touchDraggable
         * @_module entity
         * @_params [options]
         * @description 
         Turns an entity to draggable by touch, with multiple callbacks.
         <br>The touchDraggableInfos variable passed within the callback function contains the original position of the mouse when the drag started, its current position and the touchIdentifier (to id the touch in the event object).
         <h2>Examples</h2>
         <h3>Without options</h3>
         <code>entity.touchDraggable();</code>
         <h3>With options</h3>
         <code>entity.touchDraggable({
         &nbsp;&nbsp;start : function(e, touchDraggableInfos){
         &nbsp;&nbsp;&nbsp;&nbsp;console.info('start dragging '+this.name()+' at position',{touchDraggableInfos.position.x, touchDraggableInfos.position.y});
         &nbsp;&nbsp;},
         &nbsp;&nbsp;drag : function(e, touchDraggableInfos){
         &nbsp;&nbsp;&nbsp;&nbsp;console.info('dragging'+this.name(), 'all the touches infos active are available here : ',touchDraggableInfos);
         &nbsp;&nbsp;},
         &nbsp;&nbsp;stop : function(e, touchDraggableInfos){
         &nbsp;&nbsp;&nbsp;&nbsp;console.info('just dragged '+this.name(), 'from', {touchDraggableInfos.originalPosition.x, touchDraggableInfos.originalPosition.y}, 'to', {touchDraggableInfos.position.x, touchDraggableInfos.position.y});
         &nbsp;&nbsp;},
         &nbsp;&nbsp;touchadd : function(e, touchDraggableInfos, totalTouches){
         &nbsp;&nbsp;&nbsp;&nbsp;console.info('a touch has been made while dragging at this position ',{touchDraggableInfos.position.x, touchDraggableInfos.position.y}, 'there are now '+totalTouches+' touche(s)');
         &nbsp;&nbsp;},
         &nbsp;&nbsp;touchremove : function(e, touchDraggableInfos, totalTouches){
         &nbsp;&nbsp;&nbsp;&nbsp;console.info('a touch has been removed while dragging at this position ',{touchDraggableInfos.position.x, touchDraggableInfos.position.y}, 'there are now '+totalTouches+' touche(s) remaining on this entity');
         &nbsp;&nbsp;}
         });</code>
         <h3>Enable / disable</h3>
         <code>entity.touchDraggable('disable');</code>
         * @options
         * <ul>
         * @disabled {Boolean} true/false to disable/enable the draggable state
         * @maxTouches {Number}
         * @type {String} "regularDrag" or "eventDrag"
         * <ul>
         * @regularDrag : Moves the entity with the touch (by default)
         * @eventDrag : doesn't move the entity, only sends you the data and callbacks
         * </ul>
         * @start function(e,touchDraggableInfos)
         * @drag function(e,[touchDraggableInfos, ...])
         * @stop function(e,touchDraggableInfos)
         * @touchadd function(e,touchDraggableInfos,totalTouches)
         * @touchremove function(e,touchDraggableInfos,totalTouches)
         * </ul>
         * @touchDraggableInfos
         * <ul>
         * @position : {x,y}
         * @originalPosition : {x,y}
         * @touchIdentifier : Number (the identifier of the touch in the TouchEvent object)
         * </ul>
         * @added by topheman
         */
        touchDraggable: function(options){
            if(checkBeforeAddEvent(this, "touch", "touchDraggable") === false){
                return false;
            }
            //simple init without options
            if(typeof options === 'undefined'){
                this._ops._touchDraggable.disabled = false;
            }
            //method call
            else if(typeof options === 'string'){
                switch(options){
                    case 'disable':
                        this._ops._touchDraggable.disabled = true;
                        break;
                    case 'enable':
                        this._ops._touchDraggable.disabled = false;
                        break;
                }
            }
            else if(typeof options === 'object'){
                if(options.disabled === false || options.disabled === true){
                    this._ops._touchDraggable.disabled = options.disabled;
                }
                else{
                    this._ops._touchDraggable.disabled = false;//active by default (if not specified)
                }
                
                if(options.maxTouches > 0){
                    this._ops._touchDraggable.maxTouches = options.maxTouches;
                }
                else{
                    this._ops._touchDraggable.maxTouches = 100;//100 by default (if not specified)
                }
                
                if(typeof options.type === 'string'){
                    this._ops._touchDraggable.type = options.type;
                }
                
                if(typeof options.start === 'function'){
                    this._world._addTouchStartdragHandler(this._id,options.start);
                }
                else if(typeof options.start !== 'undefined'){
                    this._world._removeTouchStartdragHandler(this._id);
                }
                
                if(typeof options.drag === 'function'){
                    this._world._addTouchDragHandler(this._id,options.drag);
                }
                else if(typeof options.drag !== 'undefined'){
                    this._world._removeTouchDragHandler(this._id);
                }
                
                if(typeof options.stop === 'function'){
                    this._world._addTouchStopdragHandler(this._id,options.stop);
                }
                else if(typeof options.stop !== 'undefined'){
                    this._world._removeTouchStopdragHandler(this._id);
                }
                
                if(typeof options.touchadd === 'function'){
                    this._world._addTouchAddtouchDragHandler(this._id,options.touchadd);
                }
                else if(typeof options.touchadd !== 'undefined'){
                    this._world._removeTouchAddtouchDragHandler(this._id);
                }
                
                if(typeof options.touchremove === 'function'){
                    this._world._addTouchRemovetouchDragHandler(this._id,options.touchremove);
                }
                else if(typeof options.touchremove !== 'undefined'){
                    this._world._removeTouchRemovetouchDragHandler(this._id);
                }
            }
            
            //tag or untag the entity as draggable in the world to exclude it from the pan
            if(this._ops._touchDraggable.disabled === false){
                this._world._addTouchDraggableEntityId(this._id);
            }
            else{
                this._world._removeTouchDraggableEntityId(this._id);
            }
        },
          
        /**
         * @_name isTouchDraggable
         * @_module entity
         * @return {Boolean}
         * @description Returns true if the touch draggable event is active on the entity
         * @added by topheman
         */     
        isTouchDraggable : function() {
    
            return !this._ops._touchDraggable.disabled;
    
        }
        
    };

}());
