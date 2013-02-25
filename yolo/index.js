var flags = require('optimist').argv,
	Logger = require('./src/logger'),
	startup = require('./src/startup'),
	redis = require("redis");

//make underscore global
_ = require('underscore');

function YoloApp(){};

YoloApp.prototype.run = function(options) {
	//global constants
	PATH = __dirname.replace('/yolo', '/') 
	
	APP = PATH + options.app;
	CONFIG = PATH + options.config;
	Yolo = this;

	this.environment = flags.e || 'development';
	this.models = {};
	this.controllers = {};
	this.routes = {};

	//start logger
	this.logger = new Logger();

	this.logger.info('You only live once - Welcome');
	this.logger.log('Booting ' + Yolo.environment + ' …')

	//perform all checks
	startup.performChecks();

	//if all files are present we are good to go
	this.config = require(CONFIG + Yolo.environment);

	//etablish db connection
	this.db = require('./src/db');

	//load base classes
	this.Model = require('./src/model');
	this.Controller = require('./src/controller')

	//load models & controllers
	this.models = startup.loadModels();
	this.controllers = startup.loadControllers();

	//load routes & check them
	this.routes = startup.loadRoutes();

	//start redis 
	this.redis = redis.createClient();
	this.redis.on("error", function(err){
		Yolo.logger.warn(err);
	});

	//start http
	this.httpServer = require('./src/http')();

	//bind routes
	this.httpServer.bind(this.routes);

	if(this.config.liveReload){
		require('./src/liveReload');
	}

	//start socket
	//ready to go
	this.logger.info("Ready!");
};
       

module.exports = YoloApp;