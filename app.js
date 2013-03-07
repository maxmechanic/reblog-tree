var express = require('express'),
	url	= require('url'),
	request = require('request'),
	tumblr = require('tumblr.js');

// var app = express(),
// 	server = require('http').createServer(app);

// app.use(express.bodyParser()),
// 	app.use(express.static(__dirname + '/public')),
// 	app.use(express.logger());

var events = require('events');

var eventEmitter = new events.EventEmitter();

eventEmitter.on('got post data', checkForReblogs);
eventEmitter.on('got all data', processTumblrData);

var client = tumblr.createClient({
	consumer_key: '<consumer_key>',
	consumer_secret: '<consumer_secret>',
	token: '<oauth token>',
	token_secret: '<oauth token secret>'
});

var rebloggerAvatarURIs = [];

function getReblogInfo(blogURL) {

	var parsedURL = url.parse(blogURL);
	var blogName = parsedURL.host;
	var paths = parsedURL.path.split('/');
	var id = paths[2];
	console.log('id is ' + id);
	var host = null;
	var rebloggedURL = null;
	var parsedReblogURL;

	var	options = {
		id: id,
		reblog_info: true
	};

	getRebloggerInfo(blogName);

	client.posts(blogName, options, function(err, data){

		if (data.posts[0].reblogged_from_url) {
			rebloggedURL = data.posts[0].reblogged_from_url;
			parsedReblogURL = url.parse(rebloggedURL);
			host = parsedReblogURL.host;
		}

		eventEmitter.emit('got post data', { rebloggedURL: rebloggedURL, host: host});


	});

	


}


function getRebloggerInfo(blogName) {

	client.avatar(blogName, function(err, data) {
		rebloggerAvatarURIs.push(data.avatar_url);
	});

}

function checkForReblogs(results) {
	if (results.host) {
		getReblogInfo(results.rebloggedURL);
	}

	else {
		eventEmitter.emit('got all data');
	}

}

function processTumblrData() {
	console.log('successfully got all data');
	console.log(rebloggerAvatarURIs);
}

getReblogInfo('http://www.kungfugrippe.com/post/44632726681/thehawkguy-this-is-kate-bishop-kate-took');


// client.posts('copperbadge.tumblr.com', {id: 44649533213, reblog_info: true} , function(err, data) {
// 	console.log(data);
// });




// server.listen(3000);
// console.log('Listening on port 3000');
