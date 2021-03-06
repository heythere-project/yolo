var express = require('express'),
	connect = require('connect'),
	engine = require('ejs-locals'),
	RedisStore = require('connect-redis')(express),
	_ = require('underscore'),
	Params = require('./params');

var routeDefaults = {
	via : 'get',
	authorized : true
};


function validateConstraints(route){
	return function validateConstraintsClosure(req, res, next){
		
		//check if the route should be authorized
		if( route.authorized ){
			
			if( !req.session.authorized ){
				res.status(401);

 				var formatJson = req.params.format && req.params.format === 'json',
            		headerJson = req.is('application/json');

				// we redirect if its html 			
				if( !(formatJson || headerJson) ){
					res.redirect(Yolo.config.http.notAuthorizedRedirect);
				} else {
					res.end();
				}
				
				return;
			}
		} 


		next();
	}
};

function initializers(req, res, next){
	req.data = {};
	Yolo.initializersBefore("controllers", req, res, next);
};

function callRoute(route){
	var fn = route.to.split('.');
	
	return function callRouteClosure(req, res){

		//lockup controller by name defined into the route and initialize 
		var controller = Yolo.controllers[fn[0]];
		var instance = new controller();

		//merge all into one params object
		var params = new Params();
			params.set( _.extend({}, req.params, req.query, req.body, req.files));
		
		_.extend( instance, req.data);
		delete(req.data);

		if(Yolo.devMode){
			Yolo.logger.log(fn[0] + "#" + fn[1] );
			Yolo.logger.log(JSON.stringify(params));
		}

		//make these in the controller available
		instance.request = req;
		instance.response = res;

		instance[fn[1]](params);		

		req.on("end", function(){
			//free memory
			delete instance;
		})
	};
};

var Http = function(Yolo){
	this.server = express();

	//serve static files
	if(Yolo.config.http.statics){
		this.server.use(express.static(Yolo.PATH + Yolo.config.http.statics));
	}

	//parse the request body eg post requests
	this.server.use(express.bodyParser());

	//parse cockies
	this.server.use(express.cookieParser()); 

	//use redis session store
	this.server.use(connect.session({ store: new RedisStore({}), secret: Yolo.config.http.session.secret  }));

	//.html is the default extension
	this.server.set("view engine", "html");

	// render .html files with ejs
	this.server.engine('html', engine);

	//set the views directory
	this.server.set('views', Yolo.APP + '/views/');

	//setup logger for all request
	this.server.use(
		express.logger({
			format : Yolo.config.http.logger,
			stream : Yolo.logger
		})
	);

	this.server.listen(Yolo.config.http.port);
	Yolo.logger.log("HttpServer listening :" + Yolo.config.http.port);
};

Http.prototype.bind = function(routes){
	var server = this.server;

	for(var path in routes){
		if(_.isArray(routes[path])){
			routes[path].forEach(function(_route){
				var route = _.extend({}, routeDefaults, _route);
				server[route.via]('/' + path + '.:format?', 
					validateConstraints(route), 
					initializers,
					callRoute(route)
				);
			});
		} else {
			var route = _.extend({}, routeDefaults, routes[path]);
			server[route.via]('/' + path + '.:format?',
				validateConstraints(route), 
				initializers,
				callRoute(route)
			);
		}
		
	}

	this.routeMismatch();
};

Http.prototype.routeMismatch = function(){
	this.server.use(function(req, res){
  		res.send(404);
	});
};

module.exports = function(Yolo){
	return new Http(Yolo);	
};