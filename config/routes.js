
module.exports = {
	
	'getToken' : {
		to : 'Users.getToken',
		via : 'get',
		authorized : false
	},

	'destroyToken' : {
		to : 'Users.destroyToken',
		via : 'delete'
	}

};