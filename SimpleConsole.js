/*
Copyright (C) 2013 Christophe Rosset <tophe@topheman.com>
*/

/**
 * 
 * @param {Object} options
 * {
 *   logMaxNumber,
 *   fitToCanvas,
 *   canvas,
 *   ctxOptions : {
 *     x,
 *     y,
 *     lineHeight,
 *     fillStyle,
 *     font
 *   }
 * }
 * @returns {SimpleConsole}
 */
function SimpleConsole(options){
    
    if ( SimpleConsole.caller !== SimpleConsole.getInstance ) {  
        throw new Error("This object cannot be instanciated");
    }
    
    options = options ? options : {};
    
    var logMaxNumber,
        logs = [],
        lastLog = null,
        lastLogIteration = 1,
        log,
        oldConsoleInfo, oldConsoleLog,
        logging = false,
        canvas, ctx, ctxOptions;

    logMaxNumber = options.logMaxNumber > 0 ? options.logMaxNumber : 10;
    
    //init options
    canvas  = options.canvas;
    ctx     = canvas.getContext('2d');
    
    //init logMaxNumber
    if(ctx && options.fitToCanvas){
        
    }
    else{
        logMaxNumber = options.logMaxNumber > 0 ? options.logMaxNumber : 10;
    }
    
    oldConsoleInfo = console.info;
    oldConsoleLog = console.log;
    
    log = function(){
        var result = '',i;
        //process the arugments to a string
        for(i=0; i<arguments.length; i++){
            if(i > 0){
                result += ', ';
            }
            result += arguments[i].toString();
        }
        //compare to the last log and add it to the logs
        if(lastLog === result){
            lastLogIteration++;
            logs.splice(logs.length-1,1);
            logs.push(result + '('+lastLogIteration+')');
        }
        else{
            lastLogIteration = 1;
            lastLog = result;
            logs.push(result);
        }
        //crop the logs array if > logsMaxNumber
        if(logs.length > logMaxNumber){
            logs.splice(0,1);
        }
    };
    
    /**
     * Toggles from catching console entries to normal console mode
     */
    this.toggleConsole = function(){
        //only works if console api is present
        if(oldConsoleInfo && oldConsoleLog){
            //catch the console entries, redirect them to SimpleConsole
            if(logging === false){
                console.info = log;
                console.log = log;
                logging = true;
            }
            //switch back to normal consol logging
            else{
                console.info = oldConsoleInfo;
                console.log = oldConsoleLog;
                logging = false;
            }
        }
    };
    
    /**
     * Returns an array of the logs of the length logMaxNumber
     * @returns {Array}
     */
    this.getLogs = function(){
        return logs;
    };
    
    this.draw = function(ctx){
        ctx.save();
        ctx.fillStyle = 
        ctx.restore();
    };
    
    //switch on catching console entries
    this.toggleConsole();
    
}

SimpleConsole.instance = null;

SimpleConsole.getInstance = function(logMaxNumber){
    if(this.instance === null){
        this.instance = new SimpleConsole(logMaxNumber);
    }
    return this.instance;
};

/*
function lol(args){alert(arguments[0])};
logging = SimpleConsole.getInstance(10,lol);
lol('test',(new Date()).getTime());
lol('test',(new Date()).getTime());
lol('test',(new Date()).getTime());
lol('test',(new Date()).getTime());
lol('test',(new Date()).getTime());
lol('test',(new Date()).getTime());
lol('test',(new Date()).getTime());
lol('test',(new Date()).getTime());
lol('test',(new Date()).getTime());
lol('test',(new Date()).getTime());
lol('test','toto');
lol('test','toto','titi');
lol('test','toto','titi');
lol('test','toto','tata');
lol('test','toto','tutu');
lol('test','toto','tutu');
lol('test','toto','tutu');
lol('test','toto','tutu');
lol('test','toto','tata');
lol('test','toto','toto');
logging.getLogs();


logging = SimpleConsole.getInstance(10);
console.log('test',(new Date()).getTime());
console.log('test',(new Date()).getTime());
console.log('test',(new Date()).getTime());
console.log('test',(new Date()).getTime());
console.log('test',(new Date()).getTime());
console.log('test',(new Date()).getTime());
console.log('test',(new Date()).getTime());
console.log('test',(new Date()).getTime());
console.log('test',(new Date()).getTime());
console.log('test',(new Date()).getTime());
console.log('test','toto');
console.log('test','toto','titi');
console.log('test','toto','titi');
console.log('test','toto','tata');
console.log('test','toto','tutu');
console.log('test','toto','tutu');
console.log('test','toto','tutu');
console.log('test','toto','tutu');
console.log('test','toto','tata');
console.log('test','toto','toto');
logging.getLogs();
*/