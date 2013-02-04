var express = require('express'),
	connect = require('connect'),
	_ = require('underscore');

var routeDefaults = {
	via : 'get',
	authorized : true
};

function error(status, msg) {
  var err = new Error(msg);
  err.status = status;
  return err;
}

function validateConstraints(route){
	return function(req, res, next){
		if(route.authorized && !req.authorized){
			return res.redirect('/v1/getToken');
		} 
		next();
	}
};

function callRoute(route){
	var fn = route.to.split('.'),
		controller = Yolo.controllers[fn[0]];

	_.extend(controller.prototype, Yolo.Controller.prototype)
	
	return function(req, res){
		var n = new controller();
		var params = _.extend({}, req.params, req.query)
		
		n.request = req;
		n.response = res;

		n[fn[1]](params);
	};
};

var Http = function(){
	this.server = express();

	this.server.use(express.favicon());
	this.server.use(express.static(PUBLIC));
	this.server.use(express.bodyParser());


	this.server.use(function(req, res, next){
	  Yolo.logger.log(req.method + ' ' + req.url);
	  next();
	});

	this.server.use(function(req, res, next){
		req.authorized = false;

		if(req.query["token"]){
			//do db lookup
			req.authorized = true;
			next();
		} else {
			next();
		}
	});

	this.server.listen(Yolo.config.http.port);
	Yolo.logger.log("HttpServer listening :" + Yolo.config.http.port);
};

Http.prototype.bind = function(routes){
	var server = this.server;

	for(var path in routes){
		if(_.isArray(routes[path])){
			routes[path].forEach(function(_route){
				var route = _.extend({}, routeDefaults, _route);
				server[route.via]('/v1/' + path + '.:format?', validateConstraints(route), callRoute(route) );
			});
		} else {
			var route = _.extend({}, routeDefaults, routes[path]);
			server[route.via]('/v1/' + path + '.:format?', validateConstraints(route), callRoute(route) );
		}
		
	}

	this.routeMismatch();
};

Http.prototype.routeMismatch = function(){
	this.server.use(function(req, res){
  		res.send(404, { error: "Lame, can't find that", status : 404 });
	});
};

module.exports = function(){
	return new Http();	
};