var EventEmitter = require('events').EventEmitter,
	inherits = require('util').inherits,
	levels = {
		'Info' : 1,
		'Log' : 2,
		'Warn' : 3,
		'Error' : 4
	},
	styles = {
		'Info' : 'blue',
		'Log' : 'green',
		'Warn' : 'magenta',
		'Error' : 'red'
	},
	stylize = function (str, style) {
	    var styles = {
	        //styles
	        'bold': [1, 22],
	        'italic': [3, 23],
	        'underline': [4, 24],
	        'inverse': [7, 27],
	        //grayscale
	        'white': [37, 39],
	        'grey': [90, 39],
	        'black': [90, 39],
	        //colors
	        'blue': [34, 39],
	        'cyan': [36, 39],
	        'green': [32, 39],
	        'magenta': [35, 39],
	        'red': [31, 39],
	        'yellow': [33, 39]
	    };
    	
    	return '\033[' + styles[style][0] + 'm' + str + '\033[' + styles[style][1] + 'm';
	};

function Logger(){
	EventEmitter.call(this);
	this.level = 1;
	
	this.on('_', function(type, args){
		if(this.level <= levels[type]){
			console.log(stylize('[' + new Date().toUTCString() + ']', 'cyan') + stylize('['  + type+ '] ' + args, styles[type]));
			this.emit(type, args);
		}
	}, this);
};

inherits(Logger, EventEmitter);



//public
Logger.prototype.log = function(a){
	this.emit('_', 'Log', a);
};

Logger.prototype.info = function(a){
	this.emit('_', 'Info', a);
};


Logger.prototype.warn = function(a){
	this.emit('_', 'Warn', a);
};


Logger.prototype.error = function(a){
	this.emit('_' ,'Error', a);
};

module.exports = Logger;