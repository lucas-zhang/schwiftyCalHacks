var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongo://localhost:27017/main';
var querystring = require('querystring');
var request = require('request');

var session = require('client-sessions');

var SpotifyWebApi = require('spotify-web-api-node');
var client_id = '5ff7211b2d8c40a6b76b1238e117b3db'; // Your client id
var client_secret = '3dc23c62c02e4c309c2fef0b3980346e'; // Your client secret
var redirect_uri = 'http://cf4e1af0.ngrok.io/callback'; // Your redirect uri

var app = express();
var io = require('socket.io').listen(app.listen(3000));

var users = new Array();
var dict = {};
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));
app.use('public/stylesheets', express.static(path.join(__dirname, 'public/stylesheets')));

//app.use('/', routes);
//app.use('/users', users);

var stateKey = 'spotify_auth_state';

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
/*
app.get('/chatroom', function(req, res) {
  res.sendFile(path.join(__dirname,'search.html'));
});*/
app.get('/generate_choices', function(req, res) {
  console.log("generate called");
  var spotifyApiSearch = new SpotifyWebApi();
  var artist_id = req.query.artist_id;
  var artist_name = req.query.artist_name;
  
  console.log(artist_id);

  var artist_ids = [];
  artist_ids.push(artist_id);

  var artist_names = [];
  artist_names.push(artist_name)




  spotifyApiSearch.getArtistRelatedArtists(artist_id) // gets related artists
    .then(function(data) {
        console.log(data.body);
        for(var i = 0; i < data.body.artists.length; i++){
          artist_ids.push(data.body.artists[i].id);
          artist_names.push(data.body.artists[i].name);
        } 
        res.json({
          artist_ids: artist_ids,
          artist_names: artist_names,
          correctGuessIndex: 0
        })
    }, function(err) {
      done(err);
    });
});
app.post('/search', function(req,res) {
    console.log("post entered");
  var spotifyApiSearch = new SpotifyWebApi();
  var query = req.body.song;

  console.log(query);
  spotifyApiSearch.searchTracks(query, {limit: 10}) //searches for the top 10 matches based off song title
    .then(function(data) {
      var items = data.body.tracks.items;
      //console.log(items);
      //console.log(items[0].album);
      var track_names = [];
      var preview_urls = [];
      var uris = [];
      var artist_names = [];
      var artist_ids = [];
      var image_urls = [];
      var album_names = []; //probably not needed


      var numResults = items.length;
      //console.log(items[0].artists);
      for (var i = 0; i < numResults; i++){
        var track_name = items[i].name;
        var preview_url = items[i].preview_url;
        var uri = items[i].uri;
        var artist_id = items[i].artists[0].id
        var artist_name = items[i].artists[0].name; //only takes the first artist of a specific song
        var image_url = items[i].album.images[0].url;
        var album_name = items[i].album.name;
        track_names.push(track_name);
        preview_urls.push(preview_url);
        uris.push(uri);
        artist_names.push(artist_name);
        artist_ids.push(artist_id);
        image_urls.push(image_url);
        album_names.push(album_name);
      }
      console.log('after loop');
      var retJson = {
        track_names: track_names,
        preview_urls: preview_urls,
        uris: uris,
        artist_names: artist_names,
        artist_ids: artist_ids,
        image_urls: image_urls,
        album_names: album_names
      }
      
      res.json(retJson);
      
    }, function(err) {
      console.error(err);
    });
})
app.get('/', function(req,res) {
  res.redirect('/phase2')
  //res.sendFile(__dirname + '/landing.html')
  //res.redirect('/phase2')
});
app.get('/phase2', function(req, res) {
    //res.sendFile(__dirname + '/chatroom.html');
    
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

app.get('/ingame', function(req, res) {
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
      users.push(data.body['id'])
      return spotifyApi.getUserPlaylists(data.body['id'])
      
    }).then(function(data) {
      res.sendFile(__dirname + '/chatroom.html');

    });
}); 

io.on('connection', function(socket) {
  dict[socket.id] = users[users.length-1]
  console.log(users)
  io.emit('chat message', dict[socket.id] + " has connected!")
  io.emit('user change', users);
  socket.on('chat message', function(msg) {
    io.emit('chat message', dict[socket.id] + ": " +msg);
    console.log(dict)
  });
  socket.on('music upload', function(url) {
    console.log(url)
    io.emit('music download', url);
  });
  socket.on('disconnect', function () {
    io.emit('chat message', dict[socket.id] + " has disconnected!")
    var element = dict[socket.id]
    var i = users.indexOf(element)
    users.splice(i, 1)
    delete dict[socket.id]
    io.emit('user change', users);
    console.log(users)

  });
});

app.get('/users', function(req,res) {
  var jsonString = JSON.stringify({'body': users});
  res.send(jsonString)
})

app.get('/callback', function(req,res) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  //if state != req.cookie[stateKey]:

  res.cookie("code", code)
  res.redirect("/ingame")
  
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
