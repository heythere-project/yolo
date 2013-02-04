/* 
	Route Table

	a route consists of a *key and a *value
	
	The *key is the string we pass as "path" variable to express
		the path can also contain dynamic parts - read more 
		about more here http://expressjs.com/api.html#app.VERB

	The *value is either a object or an array of objects if the 
		path should match different http methods. 
		
	Example:
		
	"user/:id" : { 	
		//routes to the controller named 'User' and the method named 'set'
		to : 'User.set',
		
		//the http method the route should match. can be either get, post, put or delete
		via : 'post',

		//set false if the request dont have to be authorized
		authorized : false

	}
*/


module.exports = {
	
	'token' : [{
			to : 'Users.getToken',
			via : 'get',
			authorized : false
		},{
			to : 'Users.destroyToken',
			via : 'delete'
		}]
};