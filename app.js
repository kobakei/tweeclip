var express = require('express')
  , log4js = require('log4js')
  , everyauth = require('everyauth')
  , RedisStore = require('connect-redis')(express)
  , conf = require('./conf');

// logger
var log = log4js.getLogger('tweeclip');
log.setLevel('debug');

//user stack
var usersById = {}
  , nextUserId = 0
  , usersByTwitId = {};

function addUser (source, sourceUser) {
  var user;
  user = usersById[++nextUserId] = {id: nextUserId};
  user[source] = sourceUser;
  return user;
}

everyauth.everymodule
  .findUserById( function (id, callback) {
    callback(null, usersById[id]);
  });


/**
 * Twitter OAuth
 */
everyauth
  .twitter
  .consumerKey(conf.twit.consumerKey) //Twitterのアプリ登録で得られるconsumer kye.
  .consumerSecret(conf.twit.consumerSecret) //〃 consumer secret.
  .findOrCreateUser( function (sess, accessToken, accessSecret, twitUser) {
    //log.info(accessToken);
    //log.info(accessSecret);
    twitUser.accessToken = accessToken;
    twitUser.accessSecret = accessSecret;
    return usersByTwitId[twitUser.id] 
      || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
  })
  .redirectPath('/');

/**
 * create server, listening port is 3000.
 */
var app = express.createServer(
      express.bodyParser()
      , express.static(__dirname + "/public")
      , express.cookieParser()
      //, express.session({ secret: 'secret'})
      , express.session({
          secret: 'keisuke',
          store: new RedisStore(),
          cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } //1 week
        })
      , everyauth.middleware()
    );


/**
 * Setting to view engine is jade.
 */
app.configure( function () {
  app.set('view engine', 'jade');
});
app.get('/', function (req, res) {
  // debug
  //log.debug(req);
  // response data
  var resp = {
    title: 'Express'
  };
  // Get home_timeline
  if (req.loggedIn) {
    everyauth.twitter.oauth.getProtectedResource(
      "http://api.twitter.com/1/statuses/home_timeline.json?count=200&include_rts=true",
      "GET",
      req.user.twitter.accessToken,
      req.user.twitter.accessSecret,
      function (err, data) {
        if (err) {
          log.error(err);
          res.send('get error');
        } else {
          log.info("get hometimeline OK");
          var tl = JSON.parse(data);
          resp.tweets = [];
          for (var i = 0; i < tl.length; i++) {
            if (tl[i].text.indexOf('http://') >= 0 || tl[i].text.indexOf('https://') >= 0) {
              resp.tweets.push(tl[i]);
            }
          }
          res.render('index', resp);
        }
      }
    );
  } else {
    res.render('index', resp);
  }
});

everyauth.helpExpress(app);
app.listen(3000);
