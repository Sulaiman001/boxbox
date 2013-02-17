/**
 * 
 * The code of this file is dirty, it's only some quick made log / screen adjust function I needed for dev
 */

function initViewport(){
    
    var canvas = document.getElementById('canvas');
    var width = window.innerWidth;
    var height = window.innerHeight;
    canvas.width = width;
    canvas.height = 400 || height;
}
//if(true){
if(!!('ontouchstart' in window) && !(/Chrome\/24/.test(navigator.appVersion))){
       
    function log(){
        var args = [];
        for (var i in arguments){
            args.push(arguments[i] !== undefined ? arguments[i].toString() : 'undefined');
        }
        document.getElementById('log').innerHTML += args.join(',')+"\n__________________________\n";
    }
    console.log = log;
    console.info = log;
    console.warn = log;

    logTouchInfos = function (e){
        var tab = false,result;
        
        function parseTouchList(touchList){
            var i,key,infos = {};
            for(i in  touchList){
                if(!/item/.test(i) && !/length/.test(i)){
                    infos[i] = {};
                    for (key in touchList[i]){
                        if(!/webkit/.test(key) && !/item/.test(key) && !/length/.test(key) && !/target/.test(key))
                            infos[i][key] = touchList[i][key];
                    }
                }
            }
            return infos;
        }
        
        if(e.touches){
        
            result = {
                type : e.type,
                changedTouches : parseTouchList(e.changedTouches),
                targetTouches : parseTouchList(e.targetTouches),
                touches : parseTouchList(e.touches)
            };
        
        }
        
        else if(e[0]){
            result = [];
            for (i=0; i < e.length; i++){
                result.push({
                    entity : e[i].entity !== null ? e[i].entity._id : null,
                    identifier : e[i].identifier,
                    x : e[i].x,
                    y : e[i].y
                });
            }
        }
        
        else {
            
            result = {};
            for (var i in e){
                if(i !== 'entity')
                    result[i] = e[i];
                else
                    result[i] = e[i]._id;
            }
            
        }
        
        return tab ? JSON.stringify(result, null, 4): JSON.stringify(result);
    };
    
}

else{    

    logTouchInfos = function(e){
        return e;
    };
    
}