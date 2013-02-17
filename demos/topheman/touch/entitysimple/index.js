(function(){

function init(){
    
    initViewport();
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:60, preventScroll:false, disableTouchEvents : false, disableKeyEvents : true, disableMouseEvents : true});
    
    //create entities
    decor1 = myWorld.createEntity({
      color: "orange",
      x: 2,
      y: 2,
      width: 3,
      height: 4
    });
    decor1.name('decor1');

    player = myWorld.createEntity({
        x: 10,
        y: 0,
      width: 4,
      height: 4
    });
    player.name('player');
    
    enemy = myWorld.createEntity({
        color : 'red',
        x: 6,
        y: 0,
        width: 3,
        density: 10,
        height: 4
    });
    enemy.name('enemy');

    ground = myWorld.createEntity({
      color: "green",
      x: 15,
      y: 6,
      width: 30,
      height: 0.5,
      type: "static"
    });
    ground.name('ground');
    
//    function world_onTouchstartHandler(e,touchInfos){
//        console.info('world_start',logTouchInfos(e),logTouchInfos(touchInfos));
//    }
    
//    myWorld.onTouchstart(world_onTouchstartHandler);
    enemy.onTouchstart(function(e, touchInfos){
        this.color('#'+Math.floor(Math.random()*16777215).toString(16));
//        console.info('touchstart',logTouchInfos(e),logTouchInfos(touchInfos));
    });
    
    player.onTouchmove(function(e, touchInfos){
        this.color('#'+Math.floor(Math.random()*16777215).toString(16));
//        console.info('touchmove',logTouchInfos(touchInfos));
    });
    
    decor1.onTouchend(function(e, touchInfos){
//        console.info('touchend callback',this.name(),player.color(),decor1.color(),player._ops.color,decor1._ops.color);
        this.color('#'+Math.floor(Math.random()*16777215).toString(16));
//        console.info('touchend callback',this.name(),player.color(),decor1.color(),player._ops.color,decor1._ops.color);
//        console.info('touchend',logTouchInfos(e),logTouchInfos(touchInfos));
    });

}   

init();

})();