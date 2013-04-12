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
				
				// we redirect if its html otherwise throw error				
				if( req.accepts('text/html') === 'text/html' ){
					res.redirect(Yolo.config.http.notAuthorizedRedirect);

				} else {
					res.send(401, _.extend( Yolo.errors[401], {
						info : "authorize at " + Yolo.config.http.notAuthorizedRedirect
					}));
				}

				return;
			}
		} 


		next();
	}
};

function callRoute(route){
	var fn = route.to.split('.');
	
	return function callRouteClosure(req, res){

		//lockup controller by name defined into the route and initialize 
		var controller = Yolo.controllers[fn[0]];
		var instance = new controller();

		//merge all into one params object
		var params = new Params();
			params.set( _.extend({}, req.params, req.query, req.body, { files : req.files }));
		
		//make these in the controller available
		instance.request = req;
		instance.response = res;

		//if the user has a session we lookup the user in the db
		if(req.session && req.session.user){
			Yolo.models.User.findById( req.session.user.id, function(user){
				if(user){
					instance.currentUser = user[0];
				}
				instance[fn[1]](params);
			});
			
		} else {
			//otherwise call directly
			instance[fn[1]](params);
		}

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
					callRoute(route)
				);
			});
		} else {
			var route = _.extend({}, routeDefaults, routes[path]);
			server[route.via]('/' + path + '.:format?',
				validateConstraints(route), 
				callRoute(route)
			);
		}
		
	}

	this.routeMismatch();
};

Http.prototype.routeMismatch = function(){
	this.server.use(function(req, res){
  		res.send(404, Yolo.errors[404]);
	});
};

module.exports = function(Yolo){
	return new Http(Yolo);	
};