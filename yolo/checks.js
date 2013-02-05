var fs = require('fs');

module.exports = {
	checks : function(){
		//list of all files to check before start
		var	checks = {
				"Config File" : CONFIG + Yolo.environment + '.js',
				"Model dir" : APP + 'models',
				"COntroller dir" : APP + 'controllers/'
			};

		for( var check in checks ){
			if(!fs.existsSync(checks[check])){
				Yolo.logger.error("No" + check);
				throw new Error("No" + check);
			}
		}
	},
}

