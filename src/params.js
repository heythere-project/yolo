function Params(){}
Params.prototype.set = function(obj){
	for(var key in obj){
		this[key] = obj[key];
	}
};

module.exports = Params;