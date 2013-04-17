var http = require("http");

exports["404"] = function (test) {
	var chunks = "";

	http.get( 'http://localhost:80/v1/foooobar' , function(res){
		res.on('data', function (chunk) {
		    chunks += chunk;
		});
		res.on("end", function(){
			var data = JSON.parse(chunks);
			test.equal(data.code, 404);
			test.equal(res.statusCode, 404);
			test.done();
		})
	});
};