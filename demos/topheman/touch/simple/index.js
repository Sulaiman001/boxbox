(function(){

function init(){
    
    initViewport();
    
    //init canvas and world
    canvas = document.getElementById("canvas");
    myWorld = boxbox.createWorld(canvas,{scale:30,touchEvents:true, preventScroll:false});
    
    //create entities
    decor1 = myWorld.createEntity({
      color: "orange",
      x: 2,
      y: 2,
      width: 3,
      height: 2
    });
    decor1.name('decor1');

    player = myWorld.createEntity();
    player.name('player');
    
    enemy = myWorld.createEntity({
        color : 'red',
        x: 6,
        y: 0,
        width: 1.5,
        density: 10,
        height: 2
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
    
    myWorld.onTouchmove(function(e,touchInfos){
        console.info('>',logTouchInfos(e),touchInfos);
        if(touchInfos.length > 0)
            for(var i=0; i<touchInfos.length; i++){
                if(touchInfos[i].entity){
                    touchInfos[i].entity.position({x:touchInfos[i].x,y:touchInfos[i].y});
                }
            }
    });

}   

init();

})();