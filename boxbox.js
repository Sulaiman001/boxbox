/*
Copyright (C) 2012 Greg Smith <gsmith@incompl.com>

Released under the MIT license:
https://github.com/incompl/boxbox/blob/master/LICENSE

Created at Bocoup http://bocoup.com

This version is a fork of the original boxbox (created by Greg Smith) by topheman aka Christophe Rosset : https://github.com/topheman/boxbox
Functions, methods, etc ... added by topheman are marked with a comment @added by topheman
See more on the readme file
*/

/**
 * @_page_title boxbox
 * @_page_css updoc-custom.css
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
     * @description global boxbox object
     */
    window.boxbox = {};
    
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
    
    // A minimal extend for simple objects inspired by jQuery
    //@todo topheman : use the prototype (here and on the other parts of the code)
    function extend(target, o) {
        if (target === undefined) {
            target = {};
        }
        if (o !== undefined) {
            for (var key in o) {
                if (o.hasOwnProperty(key) && target[key] === undefined) {
                    target[key] = o[key];
                }
            }
        }
        return target;
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
     * </ul>
     * @return a new <a href="#name-World">World</a>
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
        disableTouchEvents : false, //@add by topheman
        disableMouseEvents : false, //@add by topheman
        disableKeyEvents : false, //@add by topheman
        preventScroll : false
    };
    
    var JOINT_DEFAULT_OPTIONS = {
        type: "distance",
        allowCollisions: false
    };
    
    /**
     * Id used to identify the world in the list of callbacks
     * could be changed to switch if you wan't to be triggered before or after the entities events
     * @added by topheman
     * @type String
     */
    var worldCallbackEventId = 'world';

    /**
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
        _startdragHandlers: {},//@added by topheman
        _dragHandlers: {},//@added by topheman
        _stopdragHandlers: {},//@added by topheman
        _touchstartHandlers: {},//@added by topheman
        _touchendHandlers: {},//@added by topheman      (only for world) @todo change array to simple var or keep the same structure ?
        _touchmoveHandlers: {},//@added by topheman     (only for world) @todo change array to simple var or keep the same structure ?
        _touchcancelHandlers: {},//@added by topheman   (only for world) @todo change array to simple var or keep the same structure ?
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
        _hoverEntityId: null,//@added by topheman (track the entity which hovered) - used to track entities for mousein/mouseout events
        _draggingEntityId: null,//@added by topheman (track the entity which is dragged)
        
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
                    world.Step(1 / 60, 10, 10);

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
                    //@modified by topheman
                    if(self._pause === false){
                        window.requestAnimationFrame(animationLoop);
                    }
                    else{
                        self._pause = animationLoop;
                    }
                }());
                
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
                 * Mouse events
                 * @added by topheman
                 */
                
                /**
                 * @function mousedownHandler
                 * @added by topheman
                 */
                var mousedownHandler = function(e) {
                    var mousePos = self.calculateWorldPositionFromMouse(e);
                    var entityX = mousePos.x,
                    entityY = mousePos.y,
                    entities;
                    _world_mousedownHandler(e, mousePos);
                    for (var key in self._mousedownHandlers) {
                        if(key === worldCallbackEventId){
                            entities = self.find(entityX,entityY);
                            mousePos.entity = entities.length > 0 ? entities[0] : null;
                            self._mousedownHandlers[key].call(self, e, mousePos);
                        }
                        else if (!self._entities[key]._destroyed && self._entities[key].checkPosition(entityX,entityY)) {
                            self._mousedownHandlers[key].call(self._entities[key], e, mousePos);
                        }
                    }
                };
                
                /**
                 * @function mouseupHandler
                 * @added by topheman
                 */
                var mouseupHandler = function(e) {
                    var mousePos = self.calculateWorldPositionFromMouse(e);
                    var entityX = mousePos.x,
                    entityY = mousePos.y,
                    entities;
                    _world_mouseupHandler(e, mousePos);
                    for (var key in self._mouseupHandlers) {
                        if(key === worldCallbackEventId){
                            entities = self.find(entityX,entityY);
                            mousePos.entity = entities.length > 0 ? entities[0] : null;
                            self._mouseupHandlers[key].call(self, e, mousePos);
                        }
                        else if (!self._entities[key]._destroyed && self._entities[key].checkPosition(entityX,entityY)) {
                            self._mouseupHandlers[key].call(self._entities[key], e, mousePos);
                        }
                    }
                };
                
                /**
                 * @function mousemoveHandler
                 * @added by topheman
                 */
                var mousemoveHandler = function(e) {
                    var mousePos = self.calculateWorldPositionFromMouse(e);
                    var entityX = mousePos.x,
                    entityY = mousePos.y,
                    entities;
                    _world_mousemoveHandler(e, mousePos);
                    for (var key in self._mousemoveHandlers) {
                        if(key === worldCallbackEventId){
                            entities = self.find(entityX,entityY);
                            mousePos.entity = entities.length > 0 ? entities[0] : null;
                            self._mousemoveHandlers[key].call(self, e, mousePos);
                        }
                        else if (!self._entities[key]._destroyed && self._entities[key].checkPosition(entityX,entityY)) {
                            self._mousemoveHandlers[key].call(self._entities[key], e, mousePos);
                        }
                    }
                };
                
                /**
                 * Callback binded on the mouseover eventListener of the canvas (so only for the world, not the entities)
                 * @function mouseinHandler
                 * @added by topheman
                 */
                var mouseinHandler = function (e) {
                    var mousePos = self.calculateWorldPositionFromMouse(e);
                    var entityX = mousePos.x,
                    entityY = mousePos.y,
                    entities;
                    entities = self.find(entityX,entityY);
                    mousePos.entity = entities.length > 0 ? entities[0] : null;
                    _world_mouseinHandler(e, mousePos);
                    if(self._mouseinHandlers[worldCallbackEventId]){
                        self._mouseinHandlers[worldCallbackEventId].call(self, e, mousePos);
                    }
                };
                
                /**
                 * Callback binded on the mouseout eventListener of the canvas (so only for the world, not the entities)
                 * @function mouseinHandler
                 * @added by topheman
                 */
                var mouseoutHandler = function (e) {
                    var mousePos = self.calculateWorldPositionFromMouse(e);
                    var entityX = mousePos.x,
                    entityY = mousePos.y,
                    entities;
                    entities = self.find(entityX,entityY);
                    mousePos.entity = entities.length > 0 ? entities[0] : null;
                    _world_mouseoutHandler(e, mousePos);
                    if(self._mouseoutHandlers[worldCallbackEventId]){
                        self._mouseoutHandlers[worldCallbackEventId].call(self, e, mousePos);
                    }
                };
                
                /**
                 * Returns an object with the entity and the identifier corresponding to the touch
                 * @param {Touch} touch
                 * @returns {Object}
                 * @added by topheman
                 */
                var getEntityFromTouch = function (touch){
                    var touchPos = self.calculateWorldPositionFromMouse(touch);
                    var entityX = touchPos.x,
                    entityY = touchPos.y,
                    entities;
                    entities = self.find(entityX,entityY);
                    touchPos.entity = entities.length > 0 ? entities[0] : null;
                    touchPos.touchIdentifier = touch.identifier;
                    return touchPos;
                };
                
                /**
                 * Returns an array of infos about the changed touches
                 * @param {TouchEvent} e
                 * @returns {Array}
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
                
                /**
                 * @function touchstartHandler
                 * @added by topheman
                 */
                var touchstartHandler = function (e) {
                    var touchInfos = getTouchInfos(e);
                    _world_touchstartHandler(e, touchInfos);
                    e.preventDefault();
                };
                
                
                /**
                 * @function touchmoveHandler
                 * @added by topheman
                 */
                var touchmoveHandler = function(e) {
                    var touchInfos = getTouchInfos(e);
                    _world_touchmoveHandler(e, touchInfos);
                    e.preventDefault();
                };
                
                
                /**
                 * @function touchendHandler
                 * @added by topheman
                 */
                var touchendHandler = function(e) {
                    var touchInfos = getTouchInfos(e);
                   _world_touchendHandler(e, touchInfos);
                    e.preventDefault();
                };
                
                
                /**
                 * @function touchcancelHandler
                 * @added by topheman
                 */
                var touchcancelHandler = function (e) {
//                    console.warn('touchcancel',logTouchInfos(e));
                    if(self._touchcancelHandlers[worldCallbackEventId]){
                        self._touchcancelHandlers[worldCallbackEventId].call(self, e);
                    }
                    e.preventDefault();
                };
                
                /**
                 * Global world events handlers
                 * Triggers specific handlers such as drag events, in/out events
                 * Also triggers public handlers @todo
                 * @added by topheman
                 * @called by their respective public handlers (before the entities handlers) see mouse events section for example
                 */
                
                /**
                 * @function _world_mousedownHandler
                 * @added by topheman
                 */
                var _world_mousedownHandler = function(e, mousePos){
                    //if no dragging active and if a click on the world is on an entity, trigger the _world_mousemoveHandlerForDragEvent
                    var entityX = mousePos.x,
                    entityY = mousePos.y;
                    if(self._draggingEntityId === null){
                        for(var key in self._entities){
                            if(!self._entities[key]._destroyed && self._entities[key].checkPosition(entityX,entityY) && self._entities[key]._ops._draggable.disabled === false){
                                _world_mousemoveHandlerForDragEvent.call(self._entities[key],e,mousePos);
                            }
                        }
                    }
                };
                
                /**
                 * @function _world_mousemoveHandler
                 * @added by topheman
                 */
                var _world_mousemoveHandler = function(e, mousePos){
                    // --- dragging part ---
                    //if a dragging is active, trigger the _world_mousemoveHandlerForDragEvent (no matter if the mouse is on an entity)
                    if(self._draggingEntityId !== null && self._entities[self._draggingEntityId]._dragging){
                        _world_mousemoveHandlerForDragEvent.call(self._entities[self._draggingEntityId],e,mousePos);
                    }
                    
                    // --- mouse in/out part ---
                    var previousHoveredEntityId = self._hoverEntityId,
                    currentHoveredEntityId = null;
                    //track the hovered entity
                    for(var key in self._entities){
                        if(!self._entities[key]._destroyed && self._entities[key].checkPosition(mousePos.x,mousePos.y)){
                            currentHoveredEntityId = key;//we don't break the loop, to catch the last entity (the one on top of the canvas)
                        }
                    }
                    //update the hoverEntityId flag in the world
                    self._hoverEntityId = currentHoveredEntityId;
                    //mouse in
                    if(previousHoveredEntityId === null && currentHoveredEntityId !== null && self._mouseinHandlers[currentHoveredEntityId]){
                        self._mouseinHandlers[currentHoveredEntityId].call(self._entities[currentHoveredEntityId],e, mousePos);
                    }
                    //mouse out
                    if(previousHoveredEntityId !== null && currentHoveredEntityId === null && self._mouseoutHandlers[previousHoveredEntityId]){
                        self._mouseoutHandlers[previousHoveredEntityId].call(self._entities[previousHoveredEntityId],e, mousePos);
                    }
                };
                
                /**
                 * @function _world_mouseupHandler
                 * @added by topheman
                 */
                var _world_mouseupHandler = function(e, mousePos){
                    //if a dragging is active, trigger the _world_mouseupHandlerForDragEvent (to stop drag)
                    if(self._draggingEntityId !== null && self._entities[self._draggingEntityId]._dragging){
                        _world_mouseupHandlerForDragEvent.call(self._entities[self._draggingEntityId],e,mousePos);
                    }
                    
                };
                
                /**
                 * @function _world_touchstartHandler
                 * @added by topheman
                 */
                var _world_touchstartHandler = function(e, touchInfos){
                    if(self._touchstartHandlers[worldCallbackEventId]){
                        self._touchstartHandlers[worldCallbackEventId].call(self, e, touchInfos);
                    }
                };
                
                /**
                 * @function _world_touchmoveHandler
                 * @added by topheman
                 */
                var _world_touchmoveHandler = function(e, touchInfos){
                    if(self._touchmoveHandlers[worldCallbackEventId]){
                        self._touchmoveHandlers[worldCallbackEventId].call(self, e, touchInfos);
                    }
                };
                
                /**
                 * @function _world_touchmoveHandler
                 * @added by topheman
                 */
                var _world_touchendHandler = function(e, touchInfos){
                    if(self._touchendHandlers[worldCallbackEventId]){
                        self._touchendHandlers[worldCallbackEventId].call(self, e, touchInfos);
                    }
                };
                
                /**
                 * @function _world_mouseinHandler
                 * @added by topheman
                 */
                var _world_mouseinHandler = function(e, mousePos){
                    //trigger the mousein of the entity if it hasn't been trigger when the mouse entered the world (like when there was no pixels between the entity and the border of the world)
                    if(mousePos.entity && self._mouseinHandlers[mousePos.entity._id]){
                        self._mouseinHandlers[mousePos.entity._id].call(self._entities[mousePos.entity._id],e, mousePos);
                    }
                };
                
                /**
                 * @function _world_mouseinHandler
                 * @added by topheman
                 */
                var _world_mouseoutHandler = function(e, mousePos){
                    //trigger the mouseup of the dragging - to prevent the entity to be stuck dragging if the mouse goes out of the canvas
                    if(self._draggingEntityId !== null && self._entities[self._draggingEntityId]._dragging){
                        _world_mouseupHandlerForDragEvent.call(self._entities[self._draggingEntityId],e,mousePos);
                    }
                    //trigger the mouseout
                    if(self._hoverEntityId !== null && self._mouseoutHandlers[self._hoverEntityId]){
                        self._mouseoutHandlers[self._hoverEntityId].call(self._entities[self._hoverEntityId],e, mousePos);
                    }
                };
                
                /**
                 * Special world events handlers, triggered by global world event handlers
                 * The events are splitted to emulate a bind/event system
                 * @added by topheman
                 * @called by the global world event handlers
                 */
                
                /**
                 * @function _world_mouseupHandler
                 * @context Entity
                 * @added by topheman
                 * @triggers the startdrag or the drag event specified in the .draggable() method
                 */
                var _world_mousemoveHandlerForDragEvent = function(e, mousePos) {
                    //tag as dragging when passing for the first time
                    if(this._world._draggingEntityId === null && !this._dragging && !this._startDrag){
                        //tag as dragging (all along the drag), with the original coordinates
                        this._dragging = mousePos;
                        //tag as startDrag to know that startDrag event will have to be triggered next time on mousemove event
                        this._startDrag = true;
                        //tag the entity as dragged on the world
                        this._world._draggingEntityId = this._id;
                        
                        //init regularDrag
                        if(this._ops._draggable.type === 'regularDrag'){
                            if(!this._moveJoint){
                                //create the joint with the mouse on first call
                                var jointDefinition = new Box2D.Dynamics.Joints.b2MouseJointDef();

                                jointDefinition.bodyA = this._world._world.GetGroundBody();
                                jointDefinition.bodyB = this._body;
                                jointDefinition.target.Set(mousePos.x, mousePos.y);
                                jointDefinition.maxForce = 10000000000000000000000000000;//100000
                                jointDefinition.timeStep = 1/60;//hard coded ?!!
                                this._moveJoint = this._world._world.CreateJoint(jointDefinition);
                            }
                        }
                        //init eventDrag
                        else if(this._ops._draggable.type === 'eventDrag'){

                        }
                    }
                    else if(this._dragging) {
                        //trigger startdrag event on the first move
                        if(this._startDrag && e.type === 'mousemove'){
                            if(this._world._startdragHandlers[this._id]){
                                this._world._startdragHandlers[this._id].call(this,e, mergeMouseInfos(mousePos,this._dragging));
                            }
                            this._startDrag = false;//reset startDrag state after the first drag
                        }
                        //trigger the drag event on the next moves
                        else {
                            if(this._world._dragHandlers[this._id]){
                                this._world._dragHandlers[this._id].call(this,e, mergeMouseInfos(mousePos,this._dragging));
                            }
                        }
                    }
                    
                    //update the move joint if regularDrag
                    if(this._moveJoint){
                        this._moveJoint.SetTarget(new Box2D.Common.Math.b2Vec2(mousePos.x, mousePos.y));
                    }
                };
                
                /**
                 * @function _world_mouseupHandlerForDragEvent
                 * @context Entity
                 * @added by topheman
                 * @triggers the stopdrag event specified in the .draggable() method
                 */
                var _world_mouseupHandlerForDragEvent = function(e, mousePos) {
                    if(this._dragging){
                        //if there is a move joint, we are in regularDrag (no test, in case the type of drag is change in the middle of a drag)
                        if (this._moveJoint) {
                            this._world._world.DestroyJoint(this._moveJoint);
                            this._moveJoint = null;
                        }
                        //trigger the stopdrag event (don't trigger it if the first drag hasn't happened)
                        if(this._startDrag === false && this._world._stopdragHandlers[this._id]){
                            this._world._stopdragHandlers[this._id].call(this,e, mergeMouseInfos(mousePos,this._dragging));
                        }
                    }
                    this._startDrag = false;//reset startDrag state if there was no drag at all
                    this._dragging = false;//all the dragging process is ended, reset this propertie
                    this._world._draggingEntityId = null;//untag the dragging entity on world
                };
                
                /**
                 * Prepares the mouseInfos object passed in callback
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
                
                /**
                 * adding mouse/touch events to the canvas with the previous handlers
                 * @added by topheman
                 */
                
                if(!self._ops.disableTouchEvents){
                    self._canvas.addEventListener('touchstart', touchstartHandler, false);
                    self._canvas.addEventListener('touchmove', touchmoveHandler, false);
                    self._canvas.addEventListener('touchend', touchendHandler, false);
                    self._canvas.addEventListener('touchcancel', touchcancelHandler, false);
                }
                if(!self._ops.disableMouseEvents){
                    self._canvas.addEventListener('mousedown', mousedownHandler, false);
                    self._canvas.addEventListener('mouseup', mouseupHandler, false);
                    self._canvas.addEventListener('mousemove', mousemoveHandler, false);
                    self._canvas.addEventListener('mouseover', mouseinHandler, false);
                    self._canvas.addEventListener('mouseout', mouseoutHandler, false);
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
         * Stops or resumes the animationLoop
         * @added by topheman
         */
        pause : function(){
            if(this._pause === false){
                this._pause = true;
            }
            else
            {
                window.requestAnimationFrame(this._pause);
                this._pause = false;
            }
        },
        
        _addKeydownHandler: function(id, f) {
            this._keydownHandlers[id] = f;
        },
        
        _addKeyupHandler: function(id, f) {
            this._keyupHandlers[id] = f;
        },
        
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMousedownHandler: function(id, f) {
            this._mousedownHandlers[id] = f;
        },
                
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMouseupHandler: function(id, f) {
            this._mouseupHandlers[id] = f;
        },
                
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMousemoveHandler: function(id, f) {
            this._mousemoveHandlers[id] = f;
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMousedownHandler: function(id) {
            delete this._mousedownHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMouseupHandler: function(id) {
            delete this._mouseupHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMousemoveHandler: function(id) {
            delete this._mousemoveHandlers[id];
        },
        
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchstartHandler: function(id, f) {
            this._touchstartHandlers[id] = f;
        },
        
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchendHandler: function(id, f) {
            this._touchendHandlers[id] = f;
        },
        
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchmoveHandler: function(id, f) {
            this._touchmoveHandlers[id] = f;
        },
        
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addTouchcancelHandler: function(id, f) {
            this._touchcancelHandlers[id] = f;
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchstartHandler: function(id) {
            delete this._touchstartHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchendHandler: function(id) {
            delete this._touchendHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchmoveHandler: function(id) {
            delete this._touchmoveHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeTouchcancelHandler: function(id) {
            delete this._touchHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addStartdragHandler: function(id, f) {
            this._startdragHandlers[id] = f;
        },
                
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addDragHandler: function(id, f) {
            this._dragHandlers[id] = f;
        },
                
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addStopdragHandler: function(id, f) {
            this._stopdragHandlers[id] = f;
        },
                
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMouseinHandler: function(id, f) {
            this._mouseinHandlers[id] = f;
        },
                
        /**
         * @param {Int} id
         * @param {Function} f callback
         * @private
         * @added by topheman
         */
        _addMouseoutHandler: function(id, f) {
            this._mouseoutHandlers[id] = f;
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMouseinHandler: function(id) {
            delete this._mouseinHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeMouseoutHandler: function(id) {
            delete this._mouseoutHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeStartdragHandler: function(id) {
            delete this._startdragHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeDragHandler: function(id) {
            delete this._dragHandlers[id];
        },
                
        /**
         * @param {Int} id
         * @private
         * @added by topheman
         */
        _removeStopdragHandler: function(id) {
            delete this._stopdragHandlers[id];
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
                
        /**
         * @param {Object} e event
         * @returns {Object} position x,y
         * @added by topheman
         */
        calculateWorldPositionFromMouse: function(e){
            return {
                x: (e.offsetX || e.layerX || e.pageX) / this.scale(),
                y: (e.offsetY || e.layerY || e.pageY) / this.scale()
            };
        },

        /**
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
         * @onStartContact start contact event handler
         * @onFinishContact finish contact event handler
         * @onImpact impact event handler
         * @onRender event handler on render
         * @onTick event handler on tick
         * </ul>
         * @return a new <a href="#name-Entity">Entity</a>
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
         * @_module world
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
         * @_module world
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
         * @_module world
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
         * @param {Function} callback
         * @context World
         * @added by topheman
         */
        onMousedown : function(callback){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMousedown');
                return false;
            }
            this._addMousedownHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */
        onMouseup : function(callback){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMouseup');
                return false;
            }
            this._addMouseupHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */
        onMousemove : function(callback){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMousemove');
                return false;
            }
            this._addMousemoveHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */    
        unbindOnMousedown: function(){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMousedown');
                return false;
            }
            this._removeMousedownHandler(worldCallbackEventId);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */   
        unbindOnMouseup: function(){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMouseup');
                return false;
            }
            this._removeMouseupHandler(worldCallbackEventId);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */    
        unbindOnMousemove: function(){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMousemove');
                return false;
            }
            this._removeMousemoveHandler(worldCallbackEventId);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */
        onMousein : function(callback){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMousein');
                return false;
            }
            this._addMouseinHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */
        onMouseout : function(callback){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMouseout');
                return false;
            }
            this._addMouseoutHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */    
        unbindOnMousein: function(){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMousein');
                return false;
            }
            this._removeMouseinHandler(worldCallbackEventId);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */    
        unbindOnMouseout: function(){
            if(this._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMouseout');
                return false;
            }
            this._removeMouseoutHandler(worldCallbackEventId);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */
        onTouchstart : function(callback){
            if(this._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call onTouchstart');
                return false;
            }
            this._addTouchstartHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */
        onTouchmove : function(callback){
            if(this._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call onTouchmove');
                return false;
            }
            this._addTouchmoveHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */
        onTouchend : function(callback){
            if(this._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call onTouchend');
                return false;
            }
            this._addTouchendHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @param {Function} callback
         * @context World
         * @added by topheman
         */
        onTouchcancel : function(callback){
            if(this._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call onTouchcancel');
                return false;
            }
            this._addTouchcancelHandler(worldCallbackEventId, callback);
        },
        
        /**
         * @context World
         * @added by topheman
         */
        unbindOnTouchstart : function(){
            if(this._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call unbindOnTouchstart');
                return false;
            }
            this._removeTouchstartHandler(worldCallbackEventId);
        },
        
        /**
         * @context World
         * @added by topheman
         */
        unbindOnTouchmove : function(callback){
            if(this._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call unbindOnTouchmove');
                return false;
            }
            this._removeTouchmoveHandler(worldCallbackEventId);
        },
        
        /**
         * @context World
         * @added by topheman
         */
        unbindOnTouchend : function(callback){
            if(this._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call unbindOnTouchend');
                return false;
            }
            this._removeTouchendHandler(worldCallbackEventId);
        },
        
        /**
         * @context World
         * @added by topheman
         */
        unbindOnTouchcancel : function(callback){
            if(this._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call unbindOnTouchcancel');
                return false;
            }
            this._removeTouchcancelHandler(worldCallbackEventId);
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
        init: null,
        draw: function(ctx, x, y) {
            var cameraOffsetX = -this._world._cameraX;
            var cameraOffsetY = -this._world._cameraY;
            ctx.fillStyle = this._ops.color;
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
            
            //@added by topheman
            ops._draggable = {
                disabled: true,//drag disabled by default
                type: 'regularDrag'
            };
            
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
                this._world._addKeydownHandler(id, ops.onKeyDown);
            }
            if (ops.onKeyUp) {
                this._world._addKeyupHandler(id, ops.onKeyUp);
            }
            if (ops.onRender) {
                this.onRender(ops.onRender);
            }
            if (ops.onTick) {
                this.onTick(ops.onTick);
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
         * Checks if the entity is at x,y
         * @param {Number} x
         * @param {Number} y
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
         * @_module entity
         * @_params
         * @return {x,y}
         * @description Get the Entity position in pixels. Useful for custom
         * rendering. Unlike <a href="#name-position">position</a> the result
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
         * @_module entity
         * @description destroy this entity and remove it from the world
         */
        destroy: function() {
            this._destroyed = true;
            this._world._destroy(this);
        },

        /**
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
         * @_module entity
         * @description Stop the force with the given name.
         */
        clearForce: function(name) {
            this._world._clearConstantForce(name, this._id);
        },

        /**
         * @_module entity
         * @description Stop the constant velocity with the given name.
         */
        clearVelocity: function(name) {
            this._world._clearConstantVelocity(name, this._id);
        },
        
        /**
         * @_module entity
         * @callback function( e )
         * <ul>
         * @e keydown event
         * @this this Entity
         * </ul>
         * @description Handle keydown event for this entity.
         */
        onKeydown: function(callback) {
            if(this._world._ops.disableKeyEvents){
                console.warn('Key events are disabled, you tried to call onKeydown');
                return false;
            }
            this._world._addKeydownHandler(this._id, callback);
        },
        
        /**
         * @_module entity
         * @callback function( e )
         * <ul>
         * @e keyup event
         * @this this Entity
         * </ul>
         * @description Handle keyup event for this entity.
         */
        onKeyup: function(callback) {
            if(this._world._ops.disableKeyEvents){
                console.warn('Key events are disabled, you tried to call onKeyup');
                return false;
            }
            this._world._addKeyupHandler(this._id, callback);
        },
        
        /**
         * @param {Function} callback
         * @added by topheman
         */
        onMousedown : function(callback){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMousedown');
                return false;
            }
            this._world._addMousedownHandler(this._id, callback);
        },
        
        /**
         * @param {Function} callback
         * @added by topheman
         */     
        onMouseup : function(callback){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMouseup');
                return false;
            }
            this._world._addMouseupHandler(this._id, callback);
        },
        
        /**
         * @param {Function} callback
         * @added by topheman
         */    
        onMousemove : function(callback){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMousemove');
                return false;
            }
            this._world._addMousemoveHandler(this._id, callback);
        },
        
        /**
         * @added by topheman
         */    
        unbindOnMousedown: function(){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMousedown');
                return false;
            }
            this._world._removeMousedownHandler(this._id);
        },
        
        /**
         * @added by topheman
         */   
        unbindOnMouseup: function(){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMouseup');
                return false;
            }
            this._world._removeMouseupHandler(this._id);
        },
        
        /**
         * @added by topheman
         */    
        unbindOnMousemove: function(){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMousemove');
                return false;
            }
            this._world._removeMousemoveHandler(this._id);
        },
        
        /**
         * @param {Function} callback
         * @added by topheman
         */    
        onMousein : function(callback){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMousein');
                return false;
            }
            if(this._ops.active === false){
                console.warn('onMousein only on active objects');
            }
            this._world._addMouseinHandler(this._id, callback);
        },
        
        /**
         * @param {Function} callback
         * @added by topheman
         */    
        onMouseout : function(callback){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call onMouseout');
                return false;
            }
            if(this._ops.active === false){
                console.warn('onMousein only on active objects');
            }
            this._world._addMouseoutHandler(this._id, callback);
        },
        
        /**
         * @added by topheman
         */    
        unbindOnMousein: function(){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMousein');
                return false;
            }
            this._world._removeMouseinHandler(this._id);
        },
        
        /**
         * @added by topheman
         */    
        unbindOnMouseout: function(){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call unbindOnMouseout');
                return false;
            }
            this._world._removeMouseoutHandler(this._id);
        },
        
        /**
         * @added by topheman
         */  
        onTouchstart : function(callback){
            if(this._world._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call onTouchstart');
                return false;
            }
            console.warn('Not implemented yet');
        },
        
        /**
         * @added by topheman
         */  
        onTouchend : function(callback){
            if(this._world._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call onTouchend');
                return false;
            }
            console.warn('Not implemented yet');
        },
        
        /**
         * @added by topheman
         */  
        onTouchmove : function(callback){
            if(this._world._ops.disableTouchEvents){
                console.warn('Touch events are disabled, you tried to call onTouchmove');
                return false;
            }
            console.warn('Not implemented yet');
        },

        /**
         * @_module entity
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
         * @_module entity
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
         * @_module entity
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
         * @_module entity
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
         * @_module entity
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
         * @_module entity
         * @description Set the entity's image to the sprite at x, y on the sprite sheet.
         * Used only on entities with spriteSheet:true
         */
        sprite: function(x, y) {
            this._ops.spriteX = x;
            this._ops.spriteY = y;
        },
          
        /**
         * Pins an entity to the world
         * @param type of joint
         * @param {type} x @optional
         * @param {type} y @optional
         */
        pin: function(type,x,y) {
            var position = this.position(), jointDefinition, localX, localY, localCoords;
            type = type || "revolute";
            x = x || position.x;
            y = y || position.y;
            localCoords = this._body.GetLocalVector(new b2Vec2(x,y));
            var worldCoords = this._body.GetWorldCenter();
            localX = localCoords.x -worldCoords.x;
            localY = localCoords.y - worldCoords.y;
            
            if (type === "distance") {
                jointDefinition = new Box2D.Dynamics.Joints.b2DistanceJointDef();
            }
            else if (type === "revolute") {
                jointDefinition = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
            }
            else if (type === "mouse") {
                jointDefinition = new Box2D.Dynamics.Joints.b2MouseJointDef();
            }
            
            jointDefinition.bodyA = this._world._world.GetGroundBody();
            jointDefinition.bodyB = this._body;
            if(jointDefinition.target && jointDefinition.target.Set){
                jointDefinition.target.Set(x, y);
            }
            else{
                jointDefinition.localAnchorA.Set(x,y);
            }
            jointDefinition.localAnchorB.Set(localX,localY);
            console.info(localX,localY,jointDefinition,localCoords,worldCoords);
            jointDefinition.maxForce = 10000000000000000000000000000;//100000
            jointDefinition.timeStep = 1/60;//hard coded ?!!
            this._pinJoint = this._world._world.CreateJoint(jointDefinition);
        },
        
        unPin: function(){
            if(this._pinJoint){
                this._world._world.DestroyJoint(this._pinJoint);
                this._pinJoint = null;
            }
        },
                
        isPined : function(){
            return this._pinJoint ? true : false;
        },
                
        /**
         * @param {String}|{Object} options @optional
         *      @disabled {Boolean}
         *      @type {String} regularDrag or eventDrag
         *      @start {Function}
         *      @drag {Function}
         *      @stop {Function}
         * @added by topheman
         */
        mouseDraggable: function(options){
            if(this._world._ops.disableMouseEvents){
                console.warn('Mouse events are disabled, you tried to call mouseDraggable');
                return false;
            }
            //simple init without options
            if(typeof options === 'undefined'){
                this._ops._draggable.disabled = false;
                this._ops._draggable.type = 'regularDrag';
            }
            //method call
            else if(typeof options === 'string'){
                switch(options){
                    case 'disable':
                        this._ops._draggable.disabled = true;
                        break;
                    case 'enable':
                        this._ops._draggable.disabled = false;
                        break;
                }
            }
            else if(typeof options === 'object'){
                if(options.disabled === false || options.disabled === true){
                    this._ops._draggable.disabled = options.disabled;
                }
                else{
                    this._ops._draggable.disabled = false;//active by default (if not specified)
                }
                if(typeof options.type === 'string'){
                    this._ops._draggable.type = options.type;
                }
                if(typeof options.start === 'function'){
                    this._world._addStartdragHandler(this._id,options.start);
                }
                else if(typeof options.start !== 'undefined'){
                    this._world._removeStartdragHandler(this._id);
                }
                if(typeof options.drag === 'function'){
                    this._world._addDragHandler(this._id,options.drag);
                }
                else if(typeof options.drag !== 'undefined'){
                    this._world._removeDragHandler(this._id);
                }
                if(typeof options.stop === 'function'){
                    this._world._addStopdragHandler(this._id,options.stop);
                }
                else if(typeof options.stop !== 'undefined'){
                    this._world._removeStopdragHandler(this._id);
                }
            }
        }
        
    };

}());
