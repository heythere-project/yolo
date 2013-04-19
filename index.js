var flags = require('optimist').argv,
	Logger = require('./src/logger'),
	startup = require('./src/startup'),
	path = require('path'),
	redis = require("redis"),
	methods = require('./src/methods');


function YoloApp(){};

YoloApp.version = require('./package.json').version;

/*
	this method is doing all the magic 
	follow the function calls if you want to know 
	who yolo works…
*/

YoloApp.prototype.after = methods.after;
YoloApp.prototype.before = methods.before;
YoloApp.prototype.initializersBefore = methods.callBefore;

YoloApp.prototype.run = function(options) {
	//global Yolo
	Yolo = this;

	this.PATH = path.resolve(__dirname, '../../') + "/";
	
	this.APP = this.PATH + options.app;
	this.CONFIG = this.PATH + options.config;

	this.environment = flags.e || 'development';
	this.models = {};
	this.controllers = {};
	this.routes = {};

	//start logger
	this.logger = new Logger(this);

	this.logger.info('You only live once - Welcome');
	this.logger.info('Booting ' + Yolo.environment + ' …');
	this.logger.info('Version: ' + YoloApp.version);

	//perform all checks
	startup.performChecks(this);

	//if all files are present we are good to go
	this.config = require(this.CONFIG + Yolo.environment);

	//set log level
	this.logger.levels = this.config.logger.levels;

	//etablish db connection
	this.db = require('./src/db').initialize(this);

	//load base classes
	this.baseModel = require('./src/model');

	// load all the models that extend the BaseModel to adapt
	// to different data stores
	startup.loadModelDefinitions();

	//backwards compatibility || Yolo.Model is allways Yolo.CouchDbModel
	this.Model = this.CouchdbModel;

	this.Controller = require('./src/controller');

	startup.loadInitializers();

	//load models & controllers
	this.models = startup.loadModels(this);
	this.controllers = startup.loadControllers(this);

	this.errors = require('./src/errors.js');

	
	//load routes & check them
	this.routes = startup.loadRoutes(this);

	//start redis 
	this.redis = redis.createClient();
	this.redis.on("error", function(err){
		Yolo.logger.warn(err);
	});

	//start http
	this.httpServer = require('./src/http')(this);

	//bind routes
	this.httpServer.bind(this.routes);

	if(this.config.liveReload){
		require('./src/liveReload').bind(this);
	}

	//start socket
	//ready to go
	this.logger.info("Ready!");
};



       
module.exports = YoloApp;