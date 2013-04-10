var cradle = require('cradle'),
	options = {
		cache: false,
  		raw: false
	};


exports.initialize = function(Yolo){
	if(Yolo.config.database.auth){
		options.auth = Yolo.config.database.auth;
	}

	var connection = new(cradle.Connection)('localhost', 5984, options),
		db = connection.database(Yolo.config.database.name);

	db.exists(function(err, exists){
		if(err && err.code === 'ECONNREFUSED'){
			Yolo.logger.error("Couldnt connect to Database");
			Yolo.logger.log("Stopping Yolo…");
			process.exit(1);
		} else if(err){
			Yolo.logger.error("Database Error: " + err.error + ' ' + err.reason);
		}

		if(!exists){
			Yolo.logger.warn("Database '" + Yolo.config.database.name + "' was created");
			db.create();
		} 
	})
	
	return db;
};