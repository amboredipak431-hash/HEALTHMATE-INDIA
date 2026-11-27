(function(){
function ls(k){ try{ return localStorage.getItem(k) || ''; }catch(e){ return ''; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function pad(n){ return ('0' + n).slice(-2); }
function todayStr(){
  var t = new Date();
  return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
}
function L(t, a){
  return '<div class="card"><h2>' + t + '</h2><p>' + a.map(function(x){ return '• ' + x; }).join('<br>') + '</p></div>';
}
var NOTE = '<p class="note">ही माहिती शिक्षणासाठी आहे. उपचार आणि औषधांसाठी डॉक्टरांना विचारा.</p>';
var INPUT = 'width:100%;padding:12px;font-size:16px;margin-top:12px;border:2px solid #0F8F85;border-radius:12px;background:#fff';

/* ---------- Dark mode आणि अक्षर आकार ---------- */
var st = document.createElement('style');
st.textContent =
  'body.dark{background:#10181a;color:#e6eeee}' +
  'body.dark .card{background:#1b2629;box-shadow:none}' +
  'body.dark .btn.alt{background:#1b2629}' +
  'body.dark .note{color:#9db0b0}' +
  'body.dark input,body.dark select{background:#223033 !important;color:#e6eeee !important}';
document.head.appendChild(st);

function applyPrefs(){
  document.body.classList.toggle('dark', ls('hm_dark') === '1');
  var z = parseFloat(ls('hm_zoom') || '1');
  if(isNaN(z) || z < 0.8 || z > 1.5){ z = 1; }
  document.body.style.zoom = z;
}
window.setDark = function(v){ lsSet('hm_dark', v ? '1' : '0'); applyPrefs(); };
window.setFont = function(v){ lsSet('hm_zoom', String(v)); applyPrefs(); };

/* ---------- PIN lock ---------- */
var unlocked = false;
function pinHash(p){ return btoa('hm' + p); }

function lockScreen(){
  document.getElementById('back').style.display = 'none';
  document.getElementById('main').innerHTML =
    '<div class="card"><h2>PIN टाका</h2><p>ॲप उघडण्यासाठी तुमचा ४ अंकी PIN टाका.</p>' +
    '<input id="pinin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN" style="' + INPUT + '">' +
    '<p id="pinmsg" style="color:#b3261c;margin-top:8px"></p>' +
    '<button class="btn" onclick="pinCheck()">उघडा</button></div>';
  applyPrefs();
}
window.pinCheck = function(){
  var v = document.getElementById('pinin').value;
  if(pinHash(v) === ls('hm_pin')){ unlocked = true; home(); }
  else { document.getElementById('pinmsg').textContent = 'PIN चुकीचा आहे.'; }
};
window.pinSave = function(){
  var v = document.getElementById('pinnew').value;
  var m = document.getElementById('pinmsg2');
  if(!/^[0-9]{4}$/.test(v)){ m.textContent = 'कृपया ४ अंकी PIN टाका.'; return; }
  lsSet('hm_pin', pinHash(v));
  unlocked = true;
  openPage('settings');
};
window.pinRemove = function(){
  try{ localStorage.removeItem('hm_pin'); }catch(e){}
  openPage('settings');
};

document.addEventListener('visibilitychange', function(){
  if(!ls('hm_pin') || !ls('hm_dob') || !ls('hm_gender')){ return; }
  if(document.hidden){ unlocked = false; }
  else if(!unlocked){ lockScreen(); }
});

/* ---------- सेटिंग्ज ---------- */
function settingsPage(){
  var has = !!ls('hm_pin');
  var h = '<div class="card"><h2>दिसणे</h2><p>डार्क मोड आणि अक्षराचा आकार निवडा.</p>' +
    '<button class="btn alt" onclick="setDark(1)">डार्क मोड चालू</button>' +
    '<button class="btn alt" onclick="setDark(0)">डार्क मोड बंद</button>' +
    '<button class="btn alt" onclick="setFont(0.9)">अक्षर लहान</button>' +
    '<button class="btn alt" onclick="setFont(1)">अक्षर सामान्य</button>' +
    '<button class="btn alt" onclick="setFont(1.15)">अक्षर मोठे</button>' +
    '<button class="btn alt" onclick="setFont(1.3)">अक्षर खूप मोठे</button></div>';
  h += '<div class="card"><h2>PIN lock</h2><p>' + (has ? 'PIN चालू आहे. नवा PIN टाकून बदलू शकता.' : 'PIN चालू नाही. ४ अंकी PIN ठेवा.') + '</p>' +
    '<input id="pinnew" type="password" inputmode="numeric" maxlength="4" placeholder="नवा ४ अंकी PIN" style="' + INPUT + '">' +
    '<p id="pinmsg2" style="color:#b3261c;margin-top:8px"></p>' +
    '<button class="btn" onclick="pinSave()">PIN सेव्ह करा</button>' +
    (has ? '<button class="btn alt" onclick="pinRemove()">PIN काढा</button>' : '') + '</div>';
  h += '<div class="card"><h2>तुमची माहिती</h2><p>जन्मतारीख, लिंग, PIN आणि नोंदी फक्त तुमच्या फोनमध्ये साठवल्या जातात.</p></div>';
  return h;
}
Object.defineProperty(HM.pages, 'settings', {get: settingsPage, configurable: true, enumerable: true});

/* ---------- पाळी ट्रॅकर ---------- */
function getP(){ try{ return JSON.parse(ls('hm_periods') || '[]'); }catch(e){ return []; } }
function setP(a){ lsSet('hm_periods', JSON.stringify(a)); }
function dnum(s){
  var p = s.split('-');
  return Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)) / 86400000;
}
function fmt(n){
  var d = new Date(n * 86400000);
  return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
}
window.trkAdd = function(){
  var v = document.getElementById('pdate').value;
  var m = document.getElementById('pmsg');
  if(!v){ m.textContent = 'कृपया तारीख निवडा.'; return; }
  var a = getP();
  if(a.indexOf(v) === -1){ a.push(v); }
  a.sort();
  setP(a);
  openPage('tracker');
};
window.trkDel = function(){
  var a = getP().sort();
  a.pop();
  setP(a);
  openPage('tracker');
};
function trackerPage(){
  var a = getP().sort();
  var h = '<div class="card"><h2>पाळी ट्रॅकर</h2>' +
    '<p>पाळी सुरू झालेली तारीख नोंदवा. मी पुढच्या पाळीचा अंदाज सांगतो. हा फक्त अंदाज आहे.</p>' +
    '<input type="date" id="pdate" max="' + todayStr() + '" style="' + INPUT + '">' +
    '<p id="pmsg" style="color:#b3261c;margin-top:8px"></p>' +
    '<button class="btn" onclick="trkAdd()">नोंद करा</button></div>';
  if(a.length){
    var last = dnum(a[a.length - 1]);
    var today = dnum(todayStr());
    var cyc = 28, info = 'सुरुवातीला २८ दिवसांचा अंदाज वापरला आहे.', i;
    if(a.length >= 2){
      var tot = 0;
      for(i = 1; i < a.length; i++){ tot += dnum(a[i]) - dnum(a[i - 1]); }
      cyc = Math.round(tot / (a.length - 1));
      info = 'सरासरी चक्र: ' + cyc + ' दिवस';
    }
    var next = last + cyc;
    var days = next - today;
    h += '<div class="card"><h2>पुढची पाळी (अंदाज)</h2><p>' + fmt(next) + '<br>' +
      (days >= 0 ? days + ' दिवसांनी' : Math.abs(days) + ' दिवस उशीर') + '<br>' + info + '</p></div>';
    var w = [];
    if(a.length >= 2 && (cyc < 21 || cyc > 35)){ w.push('तुमचे चक्र २१ ते ३५ दिवसांबाहेर आहे. डॉक्टरांना दाखवा.'); }
    if(today - last > 90){ w.push('पाळी ३ महिन्यांपेक्षा जास्त थांबली आहे. डॉक्टरांना भेटा.'); }
    if(w.length){ h += L('लक्षात ठेवा', w); }
    var hist = a.slice(-6).reverse().map(function(x){ return fmt(dnum(x)); });
    h += L('मागच्या नोंदी', hist) + '<button class="btn alt" onclick="trkDel()">शेवटची नोंद काढा</button>';
  }
  h += '<p class="note">पहिली १ ते २ वर्षे पाळी अनियमित असू शकते. शंका असल्यास डॉक्टरांना विचारा. नोंदी फक्त तुमच्या फोनमध्ये राहतात.</p>';
  return h;
}
Object.defineProperty(HM.pages, 'tracker', {get: trackerPage, configurable: true, enumerable: true});

/* ---------- ऑनलाइन सुरक्षा ---------- */
HM.pages.online =
  L('फोटो ब्लॅकमेल म्हणजे काय?', [
    'कोणी तुमचे खाजगी फोटो किंवा व्हिडिओ दाखवण्याची धमकी देऊन पैसे किंवा आणखी फोटो मागतो.',
    'हा गुन्हा आहे. गुन्हेगार तो असतो, तुम्ही नाही.']) +
  L('बचावाचे नियम', [
    'अनोळखी व्यक्तीला खाजगी फोटो किंवा व्हिडिओ पाठवू नका.',
    'ऑनलाइन ओळखीवर पूर्ण विश्वास ठेवू नका. समोरची व्यक्ती खोटी असू शकते.',
    'सोशल मीडिया प्रोफाइल प्रायव्हेट ठेवा.',
    'पासवर्ड कोणालाही सांगू नका. दोन-स्तरीय सुरक्षा (2FA) चालू करा.',
    'अनोळखी लिंक किंवा ॲप उघडू नका.',
    'व्हिडिओ कॉलवर कपडे काढायला सांगणाऱ्याला नाही म्हणा आणि कॉल बंद करा.']) +
  L('धमकी आली तर', [
    'घाबरू नका. पैसे देऊ नका. पैसे दिले तरी धमक्या थांबत नाहीत.',
    'चॅट, नंबर आणि प्रोफाइलचे स्क्रीनशॉट सुरक्षित ठेवा. मेसेज डिलीट करू नका.',
    'त्या व्यक्तीला ब्लॉक करा आणि प्रोफाइल रिपोर्ट करा.',
    'विश्वासू मोठ्या व्यक्तीला सांगा.',
    'सायबर हेल्पलाइन 1930 ला फोन करा किंवा cybercrime.gov.in वर तक्रार करा.',
    '१८ वर्षांखालील असाल तर Childline 1098 ला फोन करा.']) +
  L('फोटो आधीच पसरले असतील तर', [
    'तुमची चूक नाही. लाज बाळगू नका.',
    'प्लॅटफॉर्मवर रिपोर्ट करून फोटो काढायला सांगा.',
    'फोटो पसरू नयेत यासाठी StopNCII.org (१८+) किंवा Take It Down (१८ वर्षांखालील) या सेवा आहेत.',
    'मानसिक त्रास होत असेल तर Tele-MANAS 14416.']) +
  NOTE;

/* ---------- मेनू ---------- */
var idx = -1;
HM.items.forEach(function(x, i){ if(x.id === 'help'){ idx = i; } });
if(idx < 0){ idx = HM.items.length; }
HM.items.splice(idx, 0, {id: 'online', t: 'ऑनलाइन सुरक्षा', d: 'फोटो ब्लॅकमेलपासून बचाव', min: 15});
HM.items.push({id: 'settings', t: 'सेटिंग्ज', d: 'डार्क मोड, अक्षर, PIN', min: 15});
idx = -1;
HM.items.forEach(function(x, i){ if(x.id === 'adult'){ idx = i; } });
if(idx < 0){ idx = HM.items.length; }
HM.items.splice(idx, 0, {id: 'tracker', t: 'पाळी ट्रॅकर', d: 'पुढची पाळी कधी?', min: 15});

function filterItems(g){
  var drop = [];
  if(g === 'F'){ drop = ['boy']; }
  else if(g === 'M'){ drop = ['girl', 'tracker']; }
  HM.items = HM.items.filter(function(x){ return drop.indexOf(x.id) === -1; });
}

/* ---------- लिंगानुसार पाने ---------- */
function dropLine(l, g){
  if(g === 'F'){ return l.indexOf('• पुरुष') === 0 || l.indexOf('प्रोस्टेट') !== -1; }
  if(g === 'M'){ return l.indexOf('• महिला') === 0 || l.indexOf('रजोनिवृत्ती') !== -1; }
  return false;
}
function filterPage(g){
  var cards = document.querySelectorAll('#main .card');
  for(var i = 0; i < cards.length; i++){
    var h2 = cards[i].querySelector('h2');
    var ht = h2 ? h2.textContent : '';
    if((g === 'F' && ht === 'मुलांसाठी') || (g === 'M' && ht === 'मुलींसाठी')){
      cards[i].style.display = 'none';
      continue;
    }
    var p = cards[i].querySelector('p');
    if(p && p.innerHTML.indexOf('<br>') !== -1){
      var lines = p.innerHTML.split('<br>');
      var out = lines.filter(function(l){ return !dropLine(l, g); });
      if(out.length !== lines.length){ p.innerHTML = out.join('<br>'); }
    }
  }
}

var prevOpen = window.openPage;
window.openPage = function(id){
  prevOpen(id);
  var g = ls('hm_gender');
  if(g === 'F' || g === 'M'){ filterPage(g); }
  applyPrefs();
};

var prevHome = window.home;
window.home = function(){
  if(ls('hm_dob') && ls('hm_gender') && ls('hm_pin') && !unlocked){ lockScreen(); return; }
  filterItems(ls('hm_gender'));
  prevHome();
  applyPrefs();
};

home();
})();
