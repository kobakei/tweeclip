
/*
 * GET home page.
 */
var everyauth = require('everyauth')
  , log = require('log4js').getLogger('tweetclip');
log.setLevel('debug');

// index
exports.index = function (req, res) {
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
};

// Filter timelines by list
exports.list = function (req, res) {
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
};

