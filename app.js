var express  = require('express'),
	url      = require('url'),
	request  = require('request'),
	tumblr   = require('tumblr.js'),
	config = require('./config.js');

var consumer = new config();
console.log(consumer);

var app = express(),
	server = require('http').createServer(app);

app.use(express.bodyParser()),
	app.use(express.static(__dirname + '/public')),
	app.use(express.logger());

app.get('/', function(req, res) {

	res.render('index.jade');

});

app.post('/results', function(req, res) {
	var rebloggerAvatarURLs = [];
	var tags = [];
	console.log(req.body.url);
	getReblogInfo(req.body.url, rebloggerAvatarURLs, tags);

	eventEmitter.on('send data', function() {
		res.render('results.jade', { urls: rebloggerAvatarURLs, tags: tags });
	});

});

var events = require('events');

var eventEmitter = new events.EventEmitter();

eventEmitter.on('got post data', checkForReblogs);
eventEmitter.on('got all data', processTumblrData);
eventEmitter.on('start calls', getReblogInfo);

var client = tumblr.createClient({
	consumer_key: consumer.key,
	consumer_secret: consumer.secret
});

function getReblogInfo(blogURL, rebloggerAvatarURLs, tags) {

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

	getRebloggerInfo(blogName, rebloggerAvatarURLs);

	client.posts(blogName, options, function(err, data){

		if (!err && data.posts[0].reblogged_from_url) {
			console.log(data.posts[0].tags);
			tags.push(data.posts[0].tags);
			rebloggedURL = data.posts[0].reblogged_from_url;
			parsedReblogURL = url.parse(rebloggedURL);
			host = parsedReblogURL.host;
		}

		eventEmitter.emit('got post data', { rebloggedURL: rebloggedURL, host: host, avatars: rebloggerAvatarURLs, tags: tags});


	});


}


function getRebloggerInfo(blogName, rebloggerAvatarURLs) {

	client.avatar(blogName, 128, function(err, data) {
		if (!err) {
			rebloggerAvatarURLs.push(data.avatar_url);
		}
	});

}

function checkForReblogs(results) {
	if (results.host) {
		getReblogInfo(results.rebloggedURL, results.avatars, results.tags);
	}

	else {
		eventEmitter.emit('got all data');
	}

}

function processTumblrData() {
	console.log('successfully got all data');
	eventEmitter.emit('send data');
}

var port = process.env.PORT || 3000;
app.listen(port);
console.log('listening on ' + port);
