var _ = require('underscore'),
	inherits = require('util').inherits,
	EventEmitter = require('events').EventEmitter, 
	imagemagick = require('imagemagick');

function ImageProcessor(options){
	if(!options.image){
		Yolo.logger.warn("Generating thumbnails failed because no input file was specied in " + JSON.stringify(options));
		return;
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
	var len = 0, options, start = new Date();


	Yolo.logger.log("Generate Thumbnails…");
	//we iterate over all styles an convert or resize the image to them
	for(var style in this.styles){
		len++;

		(function(options, style, processer){
			//if geometry options are passed we resize the image
			if(options.geometry){
				var geometry = _.extend({width:0, height:0}, options.geometry);
				
				imagemagick.resize({
					srcPath : processer.image,
					format : options.format,
					width : geometry.width,
					height : geometry.height
				}, afterProcessing);
			} else {
				//if not we only convert the image
				imagemagick.convert([processer.image, '-quality', '80', ':-' ],  afterProcessing);
			}


			//after the style processing we emit that style with the output data
			function afterProcessing(err, stdout, stderr){
				if(err){
					Yolo.logger.warn("Generating Thumbnails failed for thumbnail:" + style + " with image:" + processer.image);
					console.warn(err);
				} else {
					Yolo.logger.log('Generate thumbnail:' + style );
					processer.emit('style', style, new Buffer(stdout, 'binary'));
				}
				done(processer);
			};

		})(this.styles[style], style, this);
	}

	//if all images are processed we emit done 
	function done(processer){
		if(--len === 0){
			Yolo.logger.info("Thumbnailing took " + (new Date().getTime() - start.getTime()) + 'ms');
			processer.emit('done');
		}
	}
};

module.exports = ImageProcessor;