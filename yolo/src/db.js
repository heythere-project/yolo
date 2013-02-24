var cradle = require('cradle');

var connection = new(cradle.Connection)('localhost', 5984, {
  		cache: false,
  		raw: false
	}),
	db = connection.database(Yolo.config.database.name);

	db.exists(function(err, exists){
		if(err && err.code === 'ECONNREFUSED'){
			Yolo.logger.error("Couldnt connect to Database");
			Yolo.logger.log("Stopping Yolo…");
			process.exit(1);
		}

		if(!exists){
			Yolo.logger.warn("Database '" + Yolo.config.database.name + "' was created");
			db.create();
		} 
	})

module.exports = db;

