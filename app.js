#!/usr/bin/env node
process.title = "Heythere! Appserver";

var Yolo = require('./yolo'),
	server = new Yolo();

server.run({
	app : 'app/',
	config : 'config/'
});