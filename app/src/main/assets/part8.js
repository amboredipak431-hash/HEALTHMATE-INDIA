(function(){
var orig = window.fetch.bind(window);
var MODELS = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
var RETRY = [429, 500, 502, 503, 504];

function sleep(ms){
  return new Promise(function(res){ setTimeout(res, ms); });
}

window.fetch = function(url, opts){
  if(typeof url !== 'string' || url.indexOf('generativelanguage.googleapis.com') === -1){
    return orig(url, opts);
  }
  var round = 0;
  function attempt(i){
    var u = url.replace(/models\/[^:\/]+:/, 'models/' + MODELS[i] + ':');
    return orig(u, opts).then(function(r){
      var busy = RETRY.indexOf(r.status) !== -1;
      if(!busy && r.status !== 404){ return r; }
      if(i + 1 < MODELS.length){ return attempt(i + 1); }
      if(busy && round < 1){
        round++;
        return sleep(3000).then(function(){ return attempt(0); });
      }
      return r;
    });
  }
  return attempt(0);
};
})();
