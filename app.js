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

  return res.send('<a href="/authorise"><img title="Login with Spotify"  alt="Login with Spotify" src="data:image/png;base64,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" /></a>');
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
                "text": "A new song was added to the playlist: " + trackData.body.external_urls.spotify,
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

app.delete('/empty_playlist', function(req, res) {
  spotifyApi.refreshAccessToken()
  .then(function(data) {
    spotifyApi.setAccessToken(data.body['access_token']);
    if (data.body['refresh_token']) {
      spotifyApi.setRefreshToken(data.body['refresh_token']);
    }
    spotifyApi.getPlaylistTracks(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID)
    .then(function(data) {
      var tracks = data.body.items,
          tracks_2_remove = [];
      for (var i = 0, len = tracks.length; i < len; i++) {
        tracks_2_remove.push({
            uri: tracks[i].track.uri
        });
      }
      spotifyApi.removeTracksFromPlaylist(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID, tracks_2_remove)

      return res.send('Playlist was emptied succesfully.');
    }, function(err) {
      return res.send(err.message);
    });
  }, function(err) {
    return res.send('Could not refresh access token. You probably need to re-authorise yourself from your app\'s homepage.');
  });
});

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));
