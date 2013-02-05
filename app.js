#!/usr/bin/env node

var Yolo = require('./yolo'),
	server = new Yolo();

server.run({
	app : 'app/',
	config : 'config/'
});