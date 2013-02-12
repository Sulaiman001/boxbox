function initViewport(){
    
    var canvas = document.getElementById('canvas');
    var width = window.innerWidth;
    var height = window.innerHeight;
    canvas.width = width;
    canvas.height = 200 || height;
}

if(!!('ontouchstart' in window) && !(/Chrome\/24/.test(navigator.appVersion))){
       
    function log(){
        var args = [];
        for (var i in arguments){
            args.push(arguments[i].toString());
        }
        document.getElementById('log').innerHTML += args.join(',')+"\n__________________________\n";
    }
    console.log = log;
    console.info = log;
    console.warn = log;

    logTouchInfos = function (e){
        var tab = false;
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
        
        var result = {
            type : e.type,
            changedTouches : parseTouchList(e.changedTouches),
            targetTouches : parseTouchList(e.targetTouches),
            touches : parseTouchList(e.touches)
        };
        
        return tab ? JSON.stringify(result, null, 4): JSON.stringify(result);
    };
    
}

else{    

    logTouchInfos = function(e){
        return e;
    };
    
}