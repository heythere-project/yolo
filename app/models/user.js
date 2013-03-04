var User = Yolo.Model.extend({
	model_name : 'user',

	defaults : {
		firstName : null,
		lastName : null,
		email : null,
		password : null,
		bio : null,
		lastLogin : new Date()
	},

	validation : {
		firstName : { required : true },
		lastName : { required : true },
		bio : { required: false, maxLength : 180 },
		email : { pattern: 'email' },
		password : { required: true, minLength : 5}
	},

	views : {}
});


module.exports = User;