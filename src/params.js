var _ = require("underscore");

function Params() {}

Params.prototype.set = function(obj) {
	for (var key in obj) {
		this[key] = _.clone(obj[key]);
	}
};

module.exports = Params;