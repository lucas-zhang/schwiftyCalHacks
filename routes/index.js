var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongo://localhost:27017/main';
var querystring = require('querystring');
var request = require('request');

var session = require('client-sessions');

var SpotifyWebApi = require('spotify-web-api-node');
var client_id = '5ff7211b2d8c40a6b76b1238e117b3db'; // Your client id
var client_secret = '3dc23c62c02e4c309c2fef0b3980346e'; // Your client secret
var redirect_uri = 'http://b4045f2f.ngrok.io/callback'; // Your redirect uri


var stateKey = 'spotify_auth_state';

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

router.get('/login', function(req, res, next) {
  

  	var scopes = ['user-library-read', 'playlist-modify-public', 'playlist-read-private'],
    redirectUri = redirect_uri,
    clientId = client_id,
    state = generateRandomString(16);
    res.cookie(stateKey, state)
    var spotifyApi = new SpotifyWebApi({
		redirectUri : redirectUri,
		clientId : clientId,
	});

	var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
	console.log(authorizeURL + '&show_dialog=true')
	res.redirect(authorizeURL + '&show_dialog=true');

  	
});
router.get('/', function(req,res) {
	console.log(req.cookies['code'])
	if (!req.cookies['code']) {
		res.redirect('/login');
	}


	var credentials = {
	  clientId : client_id,
	  clientSecret : client_secret,
	  redirectUri : redirect_uri
	};

	var tokenExpirationEpoch;

	var spotifyApi = new SpotifyWebApi(credentials);

	spotifyApi.authorizationCodeGrant(req.cookies['code'])
  	.then(function(data) {
  		/*
    	console.log('The token expires in ' + data.body['expires_in']);
    	console.log('The access token is ' + data.body['access_token']);
    	console.log('The refresh token is ' + data.body['refresh_token']);
		*/
    	// Set the access token on the API object to use it in later calls
    	spotifyApi.setAccessToken(data.body['access_token']);
    	spotifyApi.setRefreshToken(data.body['refresh_token']);
    	return spotifyApi.getMe();

  	}).then(function(data) {
  		return spotifyApi.getUserPlaylists(data.body['id'])
  		
  	}).then(function(data) {
  		console.log(data.body);
		res.sendFile('views/test.html', {root: __dirname })
  	});
});

router.get('/callback', function(req,res) {
	var code = req.query.code || null;
	var state = req.query.state || null;
	//if state != req.cookie[stateKey]:

	res.cookie("code", code)
	res.redirect("/")
	
});

module.exports = router;
