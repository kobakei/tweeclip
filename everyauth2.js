/**
 * everyauth + twitter api wrapper
 */
var everyauth = require('everyauth');

// Clone from everyauth
function clone(o) {
  function F() {}
  F.prototype = o;  
  return new F();
}

//
var everyauth2 = clone(everyauth);
 
// Add orginal params/methods

/**
 * Append api wrapper to everyauth.twitter
 */
everyauth2.twitter.getHomeTimeline = function (accessToken, accessSecret, callback) {
  console.log("getHomeTimeline");
  everyauth2.twitter.oauth.getProtectedResource(
    "http://api.twitter.com/1/statuses/home_timeline.json?count=200&include_rts=true",
    "GET",
    accessToken,
    accessSecret,
    callback
  );
};

// /lists/all 
everyauth2.twitter.getListsAll = function (accessToken, accessSecret, callback) {
  console.log("getListsAll");
  everyauth2.twitter.oauth.getProtectedResource(
    "http://api.twitter.com/1/lists/all.json",
    "GET",
    accessToken,
    accessSecret,
    callback
  );
};

// list/statuses
everyauth2.twitter.getListsStatuses = function (param, accessToken, accessSecret, callback) {
  console.log("getListsStatuses: " + param.list_id);
  everyauth2.twitter.oauth.getProtectedResource(
    "http://api.twitter.com/1/lists/statuses.json?list_id=" + param.list_id,
    "GET",
    accessToken,
    accessSecret,
    callback
  );
};

module.exports = everyauth2;
