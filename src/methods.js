var before = {
		controllers : []
	},
	after = {
		controllers : []
	},
	async = require('async');


exports.before = function(type, fn){
	if(type in before){
		before[type].push(fn);
	}	
};

exports.after = function(type, fn){
	if(type in after){
		after[type].push(fn);
	}
};

exports.callBefore = function(type, req, res, next){
	if( before[type].length > 0 ){
		async.each(before[type], function(fn, n){
			fn.call(Yolo, req, res, n)
		}, function(){
			next();
		});
	}
};