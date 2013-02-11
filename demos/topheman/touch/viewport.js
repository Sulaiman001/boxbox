function initViewport(){
    
    var canvas = document.getElementById('canvas');
    var width = window.innerWidth;
    var height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

if(!!('ontouchstart' in window) && !(/Chrome\/24/.test(navigator.appVersion))){
       
    function log(){
        var args = [];
        for (var i in arguments){
            args.push(arguments[i].toString());
        }
        document.getElementById('log').innerHTML += args.join(',')+"</br>";
    }
    console.log = log;
    console.info = log;
}