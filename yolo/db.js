var cradle = require('cradle');

var connection = new(cradle.Connection)('localhost', 5984, {
  cache: false,
  raw: false
});

module.exports = connection.database(Yolo.config.database.name);

