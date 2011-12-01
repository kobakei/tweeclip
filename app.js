var express = require('express')
  , log4js = require('log4js')
  , everyauth = require('everyauth')
  , RedisStore = require('connect-redis')(express)
  , conf = require('./conf');

// logger
var log = log4js.getLogger('tweeclip');
log.setLevel('debug');

/**
 * Twitter OAuth
 */
var usersById = {}
  , nextUserId = 0
  , usersByTwitId = {};
function addUser (source, sourceUser) {
  var user;
  user = usersById[++nextUserId] = {id: nextUserId};
  user[source] = sourceUser;
  return user;
}
// Find user by id
everyauth.everymodule
  .findUserById( function (id, callback) {
    callback(null, usersById[id]);
  });
//
everyauth
  .twitter
  .consumerKey(conf.twit.consumerKey) 
  .consumerSecret(conf.twit.consumerSecret) 
  .findOrCreateUser( function (sess, accessToken, accessSecret, twitUser) {
    //log.info(accessToken);
    //log.info(accessSecret);
    twitUser.accessToken = accessToken;
    twitUser.accessSecret = accessSecret;
    return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
  })
  .redirectPath('/');

/**
 * Append api wrapper to everyauth.twitter
 */
// /statuses/home_timeline
everyauth.twitter.getHomeTimeline = function (accessToken, accessSecret, callback) {
  log.info("getHomeTimeline");
  everyauth.twitter.oauth.getProtectedResource(
      "http://api.twitter.com/1/statuses/home_timeline.json?count=200&include_rts=true",
      "GET",
      accessToken,
      accessSecret,
      callback
  );
};
// /lists/all 
everyauth.twitter.getListsAll = function (accessToken, accessSecret, callback) {
  log.info("getListsAll");
  everyauth.twitter.oauth.getProtectedResource(
      "http://api.twitter.com/1/lists/all.json",
      "GET",
      accessToken,
      accessSecret,
      callback
  );
};
// list/statuses
everyauth.twitter.getListsStatuses = function (param, accessToken, accessSecret, callback) {
  log.info("getListsStatuses: " + param.list_id);
  everyauth.twitter.oauth.getProtectedResource(
      "http://api.twitter.com/1/lists/statuses.json?list_id=" + param.list_id,
      "GET",
      accessToken,
      accessSecret,
      callback
  );
};

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
  // Only when logged in
  if (req.loggedIn) {
    //
    var token = req.user.twitter.accessToken;
    var secret = req.user.twitter.accessSecret;

    // Get lists
    everyauth.twitter.getListsAll(token, secret, function (err, data) {
        log.info("list callback");
        if (err) {
          log.error(err);
          res.send(err)
        } else {
          // append lists to resp
          resp.lists = JSON.parse(data);
          // Get timeline
          everyauth.twitter.getHomeTimeline(token, secret, function (err, data) {
            log.info("tl callback");
            if (err) {
              log.error(err);
              res.send(err);
            } else {
              var tl = JSON.parse(data);
              resp.tweets = [];
              for (var i = 0; i < tl.length; i++) {
                if (tl[i].text.indexOf('http://') >= 0 || tl[i].text.indexOf('https://') >= 0) {
                  resp.tweets.push(tl[i]);
                }
              }
              res.render('index', resp);
            }
          }); 
        }
    });
  } else {
    res.render('index', resp);
  }
});

// Filter timelines by list
app.get('/list/:id', function (req, res) {
  // debug
  //log.debug(req);
  // response data
  var resp = {
    title: 'Express'
  };
  // Only when logged in
  if (req.loggedIn) {
    //
    var token = req.user.twitter.accessToken;
    var secret = req.user.twitter.accessSecret;

    // Get lists
    everyauth.twitter.getListsAll(token, secret, function (err, data) {
        log.info("list callback");
        if (err) {
          log.error(err);
          res.send(err)
        } else {
          // append lists to resp
          resp.lists = JSON.parse(data);
          // Get timeline
          var param = {
            list_id: req.params.id
          };
          everyauth.twitter.getListsStatuses(param, token, secret, function (err, data) {
            log.info("list tl callback");
            if (err) {
              log.error(err);
              res.send(err);
            } else {
              var tl = JSON.parse(data);
              resp.tweets = [];
              for (var i = 0; i < tl.length; i++) {
                if (tl[i].text.indexOf('http://') >= 0 || tl[i].text.indexOf('https://') >= 0) {
                  resp.tweets.push(tl[i]);
                }
              }
              res.render('index', resp);
            }
          }); 
        }
    });
  } else {
    res.render('index', resp);
  }
});

everyauth.helpExpress(app);
app.listen(3000);
