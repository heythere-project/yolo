var fs = require('fs');

module.exports = {
	checks : function(Yolo){
		//list of all files to check before start
		var	checks = {
				"Config File" : Yolo.CONFIG + Yolo.environment + '.js',
				"Model dir" : Yolo.APP + 'models',
				"COntroller dir" : Yolo.APP + 'controllers/'
			};

		for( var check in checks ){
			if(!fs.existsSync(checks[check])){
				Yolo.logger.error("No" + check);
				throw new Error("No" + check);
			}
		}
	},
}

