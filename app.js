var express       = require('express');
var bodyParser    = require('body-parser');
var request       = require('request');
var dotenv        = require('dotenv');
var SpotifyWebApi = require('spotify-web-api-node');

dotenv.load();

var spotifyApi = new SpotifyWebApi({
  clientId     : process.env.SPOTIFY_KEY,
  clientSecret : process.env.SPOTIFY_SECRET,
  redirectUri  : process.env.SPOTIFY_REDIRECT_URI
});

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res) {
  if (spotifyApi.getAccessToken()) {
    return res.send('You are logged in.');
  }
  return res.send('<a href="/authorise">Authorise</a>');
});

app.get('/authorise', function(req, res) {
  var scopes = ['playlist-modify-public', 'playlist-modify-private'];
  var state  = new Date().getTime();
  var authoriseURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authoriseURL);
});

app.get('/callback', function(req, res) {
  spotifyApi.authorizationCodeGrant(req.query.code)
    .then(function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      return res.redirect('/');
    }, function(err) {
      return res.send(err);
    });
});

app.use('/store', function(req, res, next) {
  if (req.body.token !== process.env.SLACK_TOKEN) {
    return res.status(500).send('Cross site request forgerizzle!');
  }
  next();
});

app.post('/store', function(req, res) {
  spotifyApi.refreshAccessToken()
    .then(function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      if (data.body['refresh_token']) { 
        spotifyApi.setRefreshToken(data.body['refresh_token']);
      }
      var text = process.env.SLACK_OUTGOING ? req.body.text.replace(req.body.trigger_word, '') : req.body.text;
      if(text.indexOf(' - ') === -1) {
        var query = 'track:' + text;
      } else {
        var pieces = text.split(' - ');
      }
      spotifyApi.searchTracks(query)
        .then(function(data) {
          var results = data.body.tracks.items;
          if (results.length === 0) {
            return res.send('Could not find that track.');
          }
          var track = results[0];
          spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID, ['spotify:track:' + track.id])
            .then(function(data) {
              if(process.env.SLACK_INCOMING_WEBHOOK) {
                spotifyApi.getTrack(track.id).then(function(trackData){
                  var album = trackData.body.album;
                  request({
                    url: process.env.SLACK_INCOMING_WEBHOOK,
                    method: "POST",
                    json: true,
                    body: {
                        "color": "#7CD197",
                        "title": "Radio DMI",
                        "fallback": "Added *" + track.name + "* by *" + track.artists[0].name + "* to the playlist.",
                        "text": "A new song was added to the playlist.",
                        "attachments": [{
                          "thumb_url": album.images[3].url
                        }],
                        // Fields are displayed in a table on the message
                        "fields": [
                          {
                              "title": "Song",
                              "value": track.name,
                              "short": true
                          },
                          {
                              "title": "Artist",
                              "value": track.artists[0].name,
                              "short": true
                          }
                        ]
                      }     
                  });
                });
              }
              return res.send({
                "response_type": "ephemeral",
                "text": "Added *" + track.name + "* by *" + track.artists[0].name + "* to the playlist."
              });
            }, function(err) {
              return res.send(err.message);
            });
        }, function(err) {
          return res.send(err.message);
        });
    }, function(err) {
      return res.send('Could not refresh access token. You probably need to re-authorise yourself from your app\'s homepage.');
    });
});

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));
