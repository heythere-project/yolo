var fs = require('fs'),
	_ = require('underscore'),
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
				Yolo.logger.error("No " +check+ " searched for: " +checks[check] );
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
		for( var path in routes ){

			// we check if its an array of routes match to a path
			// in other words if its a resourceful routig
			if( _.isArray( routes[path] ) ){
				
				l[path] = [];

				//iterate over the routes array and check each
				routes[path].forEach(function(route){
					if( isValid(route.to) ){
						l[path].push(route);
					} else {
						Yolo.logger.error("Route '"+ path +"' via '" + route.via + "' is not matching any function with: "  + route.to);
					}
				});

			} else {
				if( isValid(routes[path].to) ){
					l[path] = routes[path]
				} else {
					Yolo.logger.error("Route '"+ path +"' is not matching any function with: "  + route.to);
				}
			}
		}

		function isValid(fn){
			fn = fn.split('.');

			if( fn[0] in Yolo.controllers ){
				var instance = new Yolo.controllers[ fn[0] ];
				return instance[fn[1]] && instance[fn[1]].call 
			} 
			return false;
		};

		return l;
	},
}

