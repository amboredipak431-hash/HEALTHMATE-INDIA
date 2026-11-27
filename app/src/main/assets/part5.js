(function(){
function ls(k){ try{ return localStorage.getItem(k) || ''; }catch(e){ return ''; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function ageOf(v){
  var p = v.split('-');
  var y = parseInt(p[0], 10), m = parseInt(p[1], 10) - 1, d = parseInt(p[2], 10);
  var t = new Date();
  var a = t.getFullYear() - y;
  if(t.getMonth() < m || (t.getMonth() === m && t.getDate() < d)){ a--; }
  return a;
}
function grp(a){ return a < 15 ? '0' : (a < 18 ? '15' : (a < 20 ? '18' : '20')); }
function pad(n){ return ('0' + n).slice(-2); }

function reorder(g){
  var id = g === 'F' ? 'girl' : (g === 'M' ? 'boy' : '');
  if(!id){ return; }
  var idx = -1;
  HM.items.forEach(function(x, i){ if(x.id === id){ idx = i; } });
  if(idx < 0){ return; }
  var it = HM.items.splice(idx, 1)[0];
  var m = 0;
  HM.items.forEach(function(x, i){ if(x.id === 'mitra'){ m = i + 1; } });
  HM.items.splice(m, 0, it);
}

function entryScreen(){
  document.getElementById('back').style.display = 'none';
  var t = new Date();
  var max = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  var min = (t.getFullYear() - 100) + '-01-01';
  var css = 'width:100%;padding:12px;font-size:16px;margin-top:6px;border:2px solid #0F8F85;border-radius:12px;background:#fff';
  document.getElementById('main').innerHTML =
    '<div class="card"><h2>सुरुवात करा</h2>' +
    '<p>जन्मतारीख आणि लिंग सांगितल्याशिवाय ॲप उघडत नाही. ही माहिती एकदा दिल्यावर बदलता येत नाही. ती फक्त तुमच्या फोनमध्ये साठवली जाते आणि कुठेही पाठवली जात नाही.</p>' +
    '<p style="margin-top:12px"><b>जन्मतारीख</b></p>' +
    '<input type="date" id="dob" min="' + min + '" max="' + max + '" style="' + css + '">' +
    '<p style="margin-top:12px"><b>लिंग</b></p>' +
    '<select id="gen" style="' + css + '"><option value="">निवडा</option>' +
    '<option value="F">स्त्री / मुलगी</option><option value="M">पुरुष / मुलगा</option><option value="O">इतर</option></select>' +
    '<label style="display:block;margin-top:14px;font-size:14px;line-height:1.6"><input type="checkbox" id="chk"> मी दिलेली माहिती खरी आहे.</label>' +
    '<p id="dobmsg" style="color:#b3261c;margin-top:8px"></p>' +
    '<button class="btn" onclick="entrySave()">पुढे जा</button></div>';
}

window.entrySave = function(){
  var v = document.getElementById('dob').value;
  var g = document.getElementById('gen').value;
  var c = document.getElementById('chk').checked;
  var msg = document.getElementById('dobmsg');
  if(!v){ msg.textContent = 'कृपया जन्मतारीख निवडा.'; return; }
  if(!g){ msg.textContent = 'कृपया लिंग निवडा.'; return; }
  if(!c){ msg.textContent = 'कृपया माहिती खरी असल्याची खात्री करा (टिक करा).'; return; }
  var a = ageOf(v);
  if(isNaN(a) || a < 0 || a > 100){ msg.textContent = 'जन्मतारीख बरोबर नाही.'; return; }
  lsSet('hm_dob', v);
  lsSet('hm_gender', g);
  home();
};

window.resetAge = function(){};

var oldHome = window.home;
var done = false;
window.home = function(){
  var dob = ls('hm_dob'), g = ls('hm_gender');
  if(!dob || !g){ HM.age = ''; entryScreen(); return; }
  HM.age = grp(ageOf(dob));
  HM.gender = g;
  if(!done){ reorder(g); done = true; }
  if(HM.age === '0'){
    document.getElementById('back').style.display = 'none';
    document.getElementById('main').innerHTML =
      '<div class="card"><h2>धन्यवाद</h2>' +
      '<p>हे ॲप १५ वर्षांपुढील वयोगटासाठी आहे. कृपया पालक, शिक्षक किंवा डॉक्टरांशी बोला. मदतीसाठी Childline 1098.</p></div>';
    return;
  }
  oldHome();
  var bs = document.querySelectorAll('#main .btn');
  for(var i = 0; i < bs.length; i++){
    if(bs[i].textContent.indexOf('वय बदला') !== -1){ bs[i].parentNode.removeChild(bs[i]); }
  }
};

var oldAsk = window.mitraAsk;
window.mitraAsk = function(){
  try{
    oldAsk();
  }catch(e){
    var log = document.getElementById('mlog');
    if(log){
      var d = document.createElement('div');
      d.className = 'card';
      var p = document.createElement('p');
      p.textContent = 'त्रुटी: ' + e.message;
      d.appendChild(p);
      log.insertBefore(d, log.firstChild);
    }
  }
  var inp = document.getElementById('mq');
  if(inp){ inp.blur(); }
  setTimeout(function(){
    var l = document.getElementById('mlog');
    if(l){ l.scrollIntoView(); }
  }, 300);
};
document.addEventListener('keydown', function(e){
  if(e.key === 'Enter' && e.target && e.target.id === 'mq'){ window.mitraAsk(); }
});

home();
})();
