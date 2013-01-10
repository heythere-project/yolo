var fs = require('fs'),
	formatName = function(str){
		return str.charAt(0).toUpperCase() + str.slice(1).replace('.js', '');
	};

module.exports = {
	performChecks : function(){
		//list of all files to check before start
		var	checks = {
				"Config File" : CONFIG + Yolo.environment + '.js',
				"Model dir" : APP + 'models',
				"Controller dir" : APP + 'controllers/',
				"Route File" : CONFIG + 'routes.js'
			};

		for( var check in checks ){
			if(!fs.existsSync(checks[check])){
				Yolo.logger.error("No " + check);
				throw new Error("No " + check);
			}
		}
	},

	//TODO: loadModels and loadControllers are the same we should merge this maybe?
	loadModels : function(){
		var path = APP + 'models/',
			models = fs.readdirSync(path),
			l = {};

		models.forEach(function(model){
			var name = formatName(model);
			l[name] = require(path + model); 
		});

		return l;
	},

	loadControllers : function(){
		var path = APP + 'controllers/',
			controllers = fs.readdirSync(path),
			l = {};

		controllers.forEach(function(controller){
			var name = formatName(controller);
			l[name] = require(path + controller); 
		});

		return l;
	},

	loadRoutes : function(){
		var routes = require(CONFIG + 'routes.js'),
			l = {};

		// we check each routes if its matches to a controller and a function
		for( var route in routes ){
			var fn = routes[route];
				fn = fn.split('.');

			if( fn[0] in Yolo.controllers ){
				var instance = new Yolo.controllers[ fn[0] ];

				if(instance[fn[1]] && instance[fn[1]].call ){
					l[route] = routes[route];
				} else {
					Yolo.logger.error("Route '%s' is not matching any function with: %s", route, routes[route]);
				}

			} else {
				Yolo.logger.error("Route '%s' is not matching any controller with: %s", route, routes[route]);
			}
		}

		return l;
	},
}

