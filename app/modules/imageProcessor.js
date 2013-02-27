var _ = require('underscore'),
	inherits = require('util').inherits,
	EventEmitter = require('events').EventEmitter, 
	imagemagick = require('imagemagick');


function ImageProcessor(options){
	if(!options.image){
		throw new Error("Provide an image to convert");
	}

	this.image = options.image;

	if(options.styles){
		this.styles = options.styles;
	}

	EventEmitter.call(this);

	if(!options.process){
		this.process();
	}
};
inherits(ImageProcessor, EventEmitter);


ImageProcessor.prototype.process = function(){
	var len = 0, options;

	for(var style in this.styles){
		len++;

		(function(options, style, processer){
			var geo = _.extend({width:0, height:0}, options.geometry);

			imagemagick.resize({
				srcPath : processer.image,
				format : options.format,
				width : geo.width,
				height : geo.height
			}, function(err, stdout, stderr){
				if(err){
					console.warn(err);
				} else {
					processer.emit('style', style, new Buffer(stdout, 'binary'));
				}
				done(processer);
			});
		})(this.styles[style], style, this);
	}

	function done(processer){
		if(--len === 0){
			processer.emit('done');
		}
	}
};


module.exports = ImageProcessor;
