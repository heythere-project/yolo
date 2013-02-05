var User = Yolo.Model.extend({
	model_name : 'user',

	defaults : {
		firstName : null,
		lastName : null,
		email : null,
		password : null,
		picture : null
	},

	validation : {
		firstName : { required : true },
		lastName : { required : true },
		email : { pattern: 'email' },
		password : { required: true, minLength : 5}
	}
});


module.exports = User;