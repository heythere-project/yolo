var fs = require('fs'),
	formatName = function(str){
		return str.charAt(0).toUpperCase() + str.slice(1).replace('.js', '');
	},
	isDotfile = function(str){
		// exclude files like .DS-store oder .git 
		return !( /^[^.].*$/.test(str));
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

	loadModels : function(){
		var path = APP + 'models/',
			models = fs.readdirSync(path),
			self = this,
			l = {};

		models.forEach(function(model){
			if (isDotfile(model)){
				return;
			}

			var name = formatName(model);
			model = self.initializeModel(path, model, name);

			/* we added only succesfully intialized models */
			if(model){
				l[name] = model;
			}
		});

		return l;
	},

	/*
		this active record like stuff should move into a more
		model related file	
	*/
	initializeModel : function(path, model, name){
		var	Model = require(path + model),
			model_instance = new Model(),
			model_proto = Model.prototype,
			views = {};

		/* 
			Each model have to inherit from the Yolo.Model
		*/
		if( !(model_instance instanceof Yolo.Model)){
			return Yolo.logger.warn("Model '" + name + "' expected to be instance of Yolo.Model");
		} 

		if( !('model_name' in model_instance) ){
			return Yolo.logger.warn("Model '" + name + "' must provied property 'model_name'");
		}

		views = {
			findById : {
				map : "function(doc){ if(doc.type === '"+model_proto.model_name+"'){ emit(doc._id, doc);}}"
			}
		};

		//generate views foreach attribute
		_.each(model_instance.defaults, function(v, attribute){
			views["findBy" + formatName(attribute) ] = {
				map : 'function(doc){ if(doc.type === "'+model_proto.model_name+'"){ emit(doc.'+attribute+', doc);}}'
			};
		});

		//collect view methods
		views = _.extend({}, model_instance.views, views);

		//save view methods to db
		Yolo.db.save('_design/' + model_proto.model_name, views);

		//replace the methods with functions for calling the db
		_.each(views, function(methods, viewName){
			//assign each view as static method to the model
			Model[viewName] = function(options, cb, ctx){
				//if theres no callback we do nothing
				if (!cb || !cb.call){
					return;
				}

				if(_.isString(options)){
					options = {key: options};
				}

				//call the view
				Yolo.db.view(model_proto.model_name + '/' + viewName, options || {}, function(err, result){
					var res = [];
					
					if(err){
						//handle error
						//TODO what should we do with database errors?
						console.log(err);
						return cb.call(ctx || this, res);
					}
						console.log(result, result._attachments)
					//we loop over each item in db result and create a class instance with the result values
					for(var i = 0, len = result.length, item = result[i], Model; i < len; i++, item = result[i]){

						//lockup the model							
						if( (Model = Yolo.models[formatName(item.value.type)]) ){
							//type is only for db storing and referncing back to the model
							delete item.value.type;
							//push the created model to the result
							res.push( new Model(item.value) );
						}
					}

					cb.call(ctx || this, res);
				});
			};
		});

		//delete the the views object
		delete Model.prototype.views;

		return Model;
	},

	loadControllers : function(){
		var path = APP + 'controllers/',
			controllers = fs.readdirSync(path),
			self = this,
			l = {};

		controllers.forEach(function(controller){
			if (isDotfile(controller)){
				return;
			}

			var name = formatName(controller);
			controller = self.initializeController(path , controller);
			
			/* we added only succesfully intialized controllers */
			if(controller){
				l[name] = controller;
			}
			 
		});

		return l;
	},

	initializeController : function(path, controller){
		var Controller = require(path + controller),
			controller_instance = new Controller();

		/* 
			Each Controller have to inherit from the Yolo.Controller
		*/
		if( !(controller_instance instanceof Yolo.Controller)){
			return Yolo.logger.warn("Controller '" + controller + "' expected to be instance of Yolo.Controller");
		}

		return Controller;
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
					Yolo.logger.error("Route '"+ path +"' is not matching any function with: "  + routes[path].to);
				}
			}
		}

		function isValid(fn){
			fn = fn.split('.');

			if( fn[0] in Yolo.controllers ){
				var instance = new Yolo.controllers[ fn[0] ]();
				return instance[fn[1]] && instance[fn[1]].call 
			} 
			return false;
		};

		return l;
	},
}

