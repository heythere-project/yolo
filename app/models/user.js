var User = Yolo.Model.extend({
	model_name : 'user',

	attributes : {
		firstName : {
			required : true
		},
		lastName : {
			required : true,
		},
		email : {
			pattern : 'email',
		},
		password : {
			required : true,
			minLength : 5,
			sanitize : false
		},
		bio : {
			required : false,
			maxLength : 180
		},
		lastLogin : {
			"default" : new Date()
		},
		friends : {
			"default" : [],
		}
	}
});


module.exports = User;