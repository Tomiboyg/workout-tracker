// ═══════════════════════════════════════════════════════════ EXERCISE LIBRARY
const LIBRARY = {
  Chest:["Bench Press","Incline Bench Press","Decline Bench Press","Close-Grip Bench Press","Dumbbell Bench Press","Incline Dumbbell Press","Decline Dumbbell Press","Dumbbell Fly","Incline Dumbbell Fly","Cable Fly","Cable Crossover","Pec Deck","Push-Up","Incline Push-Up","Diamond Push-Up","Chest Dip","Machine Chest Press","Landmine Press","Svend Press"],
  Back:["Deadlift","Sumo Deadlift","Romanian Deadlift","Stiff-Leg Deadlift","Pull-Up","Chin-Up","Wide-Grip Pull-Up","Neutral-Grip Pull-Up","Barbell Row","Pendlay Row","Dumbbell Row","Cable Row","Seated Cable Row","Lat Pulldown","Close-Grip Lat Pulldown","Single-Arm Lat Pulldown","T-Bar Row","Chest-Supported Row","Meadows Row","Face Pull","Straight-Arm Pulldown","Good Morning","Hyperextension","Rack Pull"],
  Legs:["Squat","Low-Bar Squat","High-Bar Squat","Front Squat","Box Squat","Pause Squat","Goblet Squat","Hack Squat","Bulgarian Split Squat","Leg Press","Leg Curl","Seated Leg Curl","Leg Extension","Walking Lunge","Reverse Lunge","Step-Up","Hip Thrust","Glute Bridge","Cable Kickback","Calf Raise","Seated Calf Raise","Nordic Curl","GHD"],
  Shoulders:["Overhead Press","Seated Overhead Press","Dumbbell Shoulder Press","Arnold Press","Landmine Press","Push Press","Z-Press","Lateral Raise","Cable Lateral Raise","Machine Lateral Raise","Front Raise","Cable Front Raise","Rear Delt Fly","Cable Rear Delt Fly","Face Pull","Upright Row","Shrug","Dumbbell Shrug","Cable Shrug","Reverse Pec Deck","Bradford Press"],
  Arms:["Barbell Curl","EZ-Bar Curl","Dumbbell Curl","Hammer Curl","Incline Dumbbell Curl","Concentration Curl","Preacher Curl","Cable Curl","Machine Curl","Spider Curl","Zottman Curl","Skull Crusher","Tricep Pushdown","Overhead Tricep Extension","Dumbbell Tricep Extension","Cable Tricep Kickback","Dips","Bench Dip","Diamond Push-Up","Wrist Curl","Reverse Curl"],
  Core:["Plank","Side Plank","Hollow Hold","Ab Wheel Rollout","Cable Crunch","Machine Crunch","Crunches","Sit-Up","Leg Raise","Hanging Leg Raise","Hanging Knee Raise","Russian Twist","Pallof Press","Dead Bug","Bird Dog","V-Up","Dragon Flag","L-Sit","Windmill","Landmine Twist","Woodchopper","Suitcase Carry","Farmer Carry"],
  Cardio:["Running","Treadmill","Cycling","Stationary Bike","Rowing","Jump Rope","Burpees","Box Jumps","Sled Push","Sled Pull","Battle Ropes","Stairmaster","Elliptical","Swimming","HIIT"],
};

// ═══════════════════════════════════════════════════════════ RPE TABLE
const RPE_PCT = {
  10:[1.000,0.955,0.922,0.892,0.863,0.837,0.811,0.786,0.762,0.739],
  9.5:[0.978,0.939,0.907,0.878,0.850,0.824,0.799,0.775,0.752,0.730],
  9:[0.955,0.922,0.892,0.863,0.837,0.811,0.786,0.762,0.739,0.718],
  8.5:[0.939,0.907,0.878,0.850,0.824,0.799,0.775,0.752,0.730,0.709],
  8:[0.922,0.892,0.863,0.837,0.811,0.786,0.762,0.739,0.718,0.697],
  7.5:[0.907,0.878,0.850,0.824,0.799,0.775,0.752,0.730,0.709,0.688],
  7:[0.892,0.863,0.837,0.811,0.786,0.762,0.739,0.718,0.697,0.677],
  6.5:[0.878,0.850,0.824,0.799,0.775,0.752,0.730,0.709,0.688,0.668],
  6:[0.863,0.837,0.811,0.786,0.762,0.739,0.718,0.697,0.677,0.658],
};

function calcE1RM(weight, reps, rpe) {
  var w = Number(weight), r = Number(reps), rpeVal = Number(rpe) || 10;
  if (!w || !r || w <= 0 || r <= 0) return 0;
  if (r === 1) return w;
  var row = RPE_PCT[rpeVal] || RPE_PCT[10];
  return Math.round((w / row[Math.min(r - 1, 9)]) * 10) / 10;
}

function rpeColorClass(r) {
  if (r >= 9) return 'tag-red';
  if (r >= 7.5) return 'tag-orange';
  if (r >= 6) return 'tag-gold';
  return 'tag-green';
}

// ═══════════════════════════════════════════════════════════ STATE
// NOTE: renamed from 'supabase' to 'db' to avoid conflict with window.supabase CDN global
var db = null;
var workouts = [];
var customExercises = [];
var activeWorkout = null;
var durSeconds = 0;
var durTimer = null;
var chartInstance = null;
var selectedChartEx = null;
var selectedMetric = 'e1rm';
var pickerGroup = 'All';

// ═══════════════════════════════════════════════════════════ INIT
window.addEventListener('DOMContentLoaded', function() {
  var url = localStorage.getItem('sb_url');
  var key = localStorage.getItem('sb_key');
  if (url && key) {
    initDB(url, key).then(function(ok) {
      if (ok) {
        showApp();
      } else {
        showSetup();
        document.getElementById('setup-error').textContent = '⚠️ Uložené údaje nefungujú, skús znova.';
      }
    });
  } else {
    showSetup();
  }
});

function showSetup() {
  document.getElementById('setup-screen').style.display = '';
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('app').style.display = '';
  showLoading();
  Promise.all([loadWorkouts(), loadCustomExercises()]).then(function() {
    hideLoading();
    renderHome();
    renderHistory();
    renderProgress();
    setupWorkoutTab();
    var opts = {weekday:'long', day:'numeric', month:'long'};
    document.getElementById('home-date').textContent = new Date().toLocaleDateString('sk', opts);
    document.getElementById('workout-date').textContent = new Date().toLocaleDateString('sk', opts);
  }).catch(function(err) {
    hideLoading();
    console.error('Load error:', err);
    showToast('Chyba pri načítaní: ' + err.message);
  });
}

async function initDB(url, key) {
  try {
    // window.supabase is the CDN global — createClient is on it
    db = window.supabase.createClient(url, key);
    var result = await db.from('workouts').select('id').limit(1);
    if (result.error) {
      console.error('Supabase error:', result.error);
      return false;
    }
    return true;
  } catch(e) {
    console.error('initDB exception:', e);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════ SETUP ACTIONS
async function connectSupabase() {
  var url = document.getElementById('sb-url').value.trim();
  var key = document.getElementById('sb-key').value.trim();
  var errEl = document.getElementById('setup-error');
  errEl.textContent = '';

  if (!url || !key) { errEl.textContent = 'Vyplň oba polia.'; return; }
  if (!url.startsWith('https://')) { errEl.textContent = 'URL musí začínať https://'; return; }

  errEl.textContent = '⏳ Pripájam…';
  var ok = await initDB(url, key);
  if (ok) {
    localStorage.setItem('sb_url', url);
    localStorage.setItem('sb_key', key);
    showApp();
  } else {
    errEl.textContent = '❌ Nepodarilo sa pripojiť. Skontroluj URL/Key a či si spustil SQL script v Supabase.';
  }
}

function logout() {
  if (!confirm('Odpojiť Supabase? Dáta zostanú v databáze.')) return;
  localStorage.removeItem('sb_url');
  localStorage.removeItem('sb_key');
  db = null;
  location.reload();
}

function showSQLModal() {
  document.getElementById('sql-modal').classList.remove('hidden');
}

function closeSQLModal(e) {
  if (!e || e.target.id === 'sql-modal' || e.target.classList.contains('modal-close')) {
    document.getElementById('sql-modal').classList.add('hidden');
  }
}

function copySQL() {
  navigator.clipboard.writeText(document.getElementById('sql-code').textContent).then(function() {
    showToast('✅ SQL skopírovaný!');
  });
}

// ═══════════════════════════════════════════════════════════ LOADING
function showLoading() {
  var el = document.getElementById('loading-screen');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-screen';
    el.innerHTML = '<div class="loading-icon">🏋️</div><div class="loading-text">Načítavam tréningy…</div>';
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
}

function hideLoading() {
  var el = document.getElementById('loading-screen');
  if (el) el.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════ SUPABASE DATA
async function loadWorkouts() {
  var result = await db.from('workouts').select('*').order('date', {ascending: false});
  if (!result.error && result.data) workouts = result.data;
}

async function loadCustomExercises() {
  var result = await db.from('custom_exercises').select('*');
  if (!result.error && result.data) customExercises = result.data;
}

async function saveWorkout(w) {
  var result = await db.from('workouts').upsert({
    id: w.id, name: w.name, date: w.date, duration: w.duration, exercises: w.exercises
  });
  if (result.error) throw result.error;
}

async function deleteWorkout(id) {
  await db.from('workouts').delete().eq('id', id);
}

async function saveCustomExercise(ex) {
  await db.from('custom_exercises').upsert({
    id: ex.id, name: ex.name, group_name: ex.group
  });
}

// ═══════════════════════════════════════════════════════════ TABS
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector('.tab-btn[data-tab="' + tab + '"]').classList.add('active');
  if (tab === 'progress') renderProgress();
}

// ═══════════════════════════════════════════════════════════ HOME
function calcWorkoutVol(w) {
  return (w.exercises || []).reduce(function(t, ex) {
    return (ex.sets || []).reduce(function(s, set) {
      return s + (Number(set.weight) * Number(set.reps) || 0);
    }, t);
  }, 0);
}

function getPRs() {
  var names = [];
  workouts.forEach(function(w) {
    (w.exercises || []).forEach(function(ex) {
      if (names.indexOf(ex.name) === -1) names.push(ex.name);
    });
  });
  return names.map(function(name) {
    var best1RM = 0, bestW = 0;
    workouts.forEach(function(w) {
      (w.exercises || []).filter(function(e) { return e.name === name; }).forEach(function(ex) {
        (ex.sets || []).forEach(function(s) {
          var v = calcE1RM(s.weight, s.reps, s.rpe || 10);
          if (v > best1RM) best1RM = v;
          if (Number(s.weight) > bestW) bestW = Number(s.weight);
        });
      });
    });
    return {name: name, best1RM: best1RM, bestW: bestW};
  }).filter(function(e) { return e.best1RM > 0; }).sort(function(a, b) { return b.best1RM - a.best1RM; });
}

function getBest1RMForEx(name) {
  var b = 0;
  workouts.forEach(function(w) {
    (w.exercises || []).filter(function(e) { return e.name === name; }).forEach(function(ex) {
      (ex.sets || []).forEach(function(s) {
        var v = calcE1RM(s.weight, s.reps, s.rpe || 10);
        if (v > b) b = v;
      });
    });
  });
  return b;
}

function renderHome() {
  var total = workouts.length;
  var week = workouts.filter(function(w) { return new Date(w.date) > new Date(Date.now() - 7 * 86400000); }).length;
  var vol = workouts.reduce(function(t, w) { return t + calcWorkoutVol(w); }, 0);
  var names = [];
  workouts.forEach(function(w) { (w.exercises||[]).forEach(function(ex){ if(names.indexOf(ex.name)===-1) names.push(ex.name); }); });
  var uniq = names.length;

  document.getElementById('stats-grid').innerHTML = [
    {icon:'🏋️', val:total, label:'Celkom tréningov'},
    {icon:'🔥', val:week, label:'Tento týždeň'},
    {icon:'📦', val:(vol/1000).toFixed(1)+'t', label:'Celkový objem'},
    {icon:'⚡', val:uniq, label:'Rôznych cvikov'},
  ].map(function(s) {
    return '<div class="stat-card"><div class="stat-icon">'+s.icon+'</div><div class="stat-val">'+s.val+'</div><div class="stat-label">'+s.label+'</div></div>';
  }).join('');

  var PRs = getPRs().slice(0, 3);
  var prsCard = document.getElementById('top-prs-card');
  var homeEmpty = document.getElementById('home-empty');

  if (PRs.length > 0) {
    prsCard.style.display = '';
    document.getElementById('top-prs-list').innerHTML = PRs.map(function(pr, i) {
      var cls = i === 0 ? 'tag-gold' : 'tag-muted';
      return '<div class="pr-row"><div class="pr-left"><span class="tag '+cls+'">'+(i+1)+'</span><span class="pr-name">'+pr.name+'</span></div><span class="pr-val">'+pr.best1RM+' kg</span></div>';
    }).join('');
  } else {
    prsCard.style.display = 'none';
  }
  homeEmpty.style.display = workouts.length === 0 ? '' : 'none';
}

// ═══════════════════════════════════════════════════════════ WORKOUT
function setupWorkoutTab() {
  var saved = localStorage.getItem('wt_active');
  var savedDur = Number(localStorage.getItem('wt_dur') || 0);
  if (saved) {
    try {
      activeWorkout = JSON.parse(saved);
      durSeconds = savedDur;
      showActiveWorkout();
    } catch(e) {
      localStorage.removeItem('wt_active');
      showNoWorkout();
    }
  } else {
    showNoWorkout();
  }
  renderLastWorkout();
}

function showNoWorkout() {
  document.getElementById('no-workout').style.display = '';
  document.getElementById('active-workout').style.display = 'none';
}

function renderLastWorkout() {
  if (!workouts[0]) return;
  var card = document.getElementById('last-workout-card');
  var content = document.getElementById('last-workout-content');
  card.style.display = '';
  var w = workouts[0];
  content.innerHTML = '<div style="font-weight:800;margin-bottom:10px;font-size:15px">'+w.name+'</div>' +
    (w.exercises||[]).map(function(ex) {
      return '<div class="hist-ex-row"><span class="hist-ex-name">'+ex.name+'</span><span style="color:var(--muted);font-size:12px">'+(ex.sets||[]).map(function(s){return (s.weight||0)+'×'+(s.reps||0);}).join(', ')+'</span></div>';
    }).join('');
}

function startWorkout() {
  var n = new Date();
  activeWorkout = {
    id: Date.now(),
    name: 'Tréning ' + n.toLocaleDateString('sk', {day:'numeric', month:'short'}),
    date: n.toISOString(),
    exercises: []
  };
  durSeconds = 0;
  localStorage.setItem('wt_active', JSON.stringify(activeWorkout));
  localStorage.setItem('wt_dur', '0');
  showActiveWorkout();
}

function showActiveWorkout() {
  document.getElementById('no-workout').style.display = 'none';
  document.getElementById('active-workout').style.display = '';
  var nameInput = document.getElementById('workout-name-input');
  nameInput.value = activeWorkout.name;
  nameInput.oninput = function(e) {
    activeWorkout.name = e.target.value;
    localStorage.setItem('wt_active', JSON.stringify(activeWorkout));
  };
  startTimer();
  renderActiveWorkout();
}

function startTimer() {
  if (durTimer) clearInterval(durTimer);
  durTimer = setInterval(function() {
    durSeconds++;
    localStorage.setItem('wt_dur', durSeconds);
    updateActiveTags();
  }, 1000);
}

function fmtTime(s) {
  return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
}

function updateActiveTags() {
  var vol = (activeWorkout ? activeWorkout.exercises || [] : []).reduce(function(t,ex) {
    return (ex.sets||[]).reduce(function(s,set){return s+(Number(set.weight)*Number(set.reps)||0);}, t);
  }, 0);
  document.getElementById('active-tags').innerHTML =
    '<span class="tag tag-green">⏱ '+fmtTime(durSeconds)+'</span>' +
    '<span class="tag tag-purple">📦 '+Math.round(vol)+' kg</span>' +
    '<span class="tag tag-orange">'+((activeWorkout ? activeWorkout.exercises||[] : []).length)+' cvikov</span>';
}

function renderActiveWorkout() {
  updateActiveTags();
  var list = document.getElementById('exercise-list');
  list.innerHTML = '';
  (activeWorkout.exercises || []).forEach(function(ex, ei) {
    var card = document.createElement('div');
    card.className = 'ex-card';
    var prevBest = getBest1RMForEx(ex.name);
    card.innerHTML =
      '<div class="ex-card-header">' +
        '<div>' +
          '<div class="ex-name">'+ex.name+'</div>' +
          '<div class="ex-meta">' +
            '<span class="tag tag-purple">'+ex.group+'</span>' +
            (prevBest > 0 ? '<span class="tag tag-muted">Rekord: '+prevBest+' kg e1RM</span>' : '') +
          '</div>' +
        '</div>' +
        '<button class="btn-icon-danger" onclick="removeExercise('+ei+')">🗑</button>' +
      '</div>' +
      '<div id="sets-'+ei+'"></div>' +
      '<button class="btn-add-set" onclick="addSet('+ei+')">+ Pridaj sériu</button>';
    list.appendChild(card);
    renderSets(ei);
  });
  document.getElementById('finish-btn').disabled = (activeWorkout.exercises || []).length === 0;
}

function renderSets(ei) {
  var ex = activeWorkout.exercises[ei];
  var container = document.getElementById('sets-' + ei);
  if (!container) return;
  container.innerHTML = '';
  var prevBest = getBest1RMForEx(ex.name);
  (ex.sets || []).forEach(function(set, si) {
    var val = calcE1RM(set.weight, set.reps, set.rpe || 10);
    var isPR = val > 0 && val > prevBest;
    var row = document.createElement('div');
    row.className = 'set-row';
    var rpeOptions = [6,6.5,7,7.5,8,8.5,9,9.5,10].map(function(r) {
      return '<option value="'+r+'" '+(Number(set.rpe||8)===r?'selected':'')+'>'+r+'</option>';
    }).join('');
    row.innerHTML =
      '<div class="set-inputs">' +
        '<span class="set-num">'+(si+1)+'</span>' +
        '<div class="input-group"><div class="input-label">KG</div>' +
          '<input class="set-input" type="number" inputmode="decimal" placeholder="0" value="'+(set.weight||'')+'" onchange="updateSet('+ei+','+si+',\'weight\',this.value)"/></div>' +
        '<div class="input-group"><div class="input-label">REPS</div>' +
          '<input class="set-input" type="number" inputmode="numeric" placeholder="0" value="'+(set.reps||'')+'" onchange="updateSet('+ei+','+si+',\'reps\',this.value)"/></div>' +
        '<div class="input-group"><div class="input-label">RPE</div>' +
          '<select class="set-select" onchange="updateSet('+ei+','+si+',\'rpe\',Number(this.value))">'+rpeOptions+'</select></div>' +
        '<button class="set-del" onclick="removeSet('+ei+','+si+')">✕</button>' +
      '</div>' +
      (val > 0 ?
        '<div class="set-tags">' +
          '<span class="tag '+(isPR?'tag-gold':'tag-purple')+'">'+(isPR?'🏆 PR! ':'')+'e1RM '+val+' kg</span>' +
          (set.rpe ? '<span class="tag '+rpeColorClass(set.rpe)+'">RPE '+set.rpe+'</span>' : '') +
        '</div>' : '');
    container.appendChild(row);
  });
}

function updateSet(ei, si, field, val) {
  activeWorkout.exercises[ei].sets[si][field] = val;
  localStorage.setItem('wt_active', JSON.stringify(activeWorkout));
  renderSets(ei);
  updateActiveTags();
}

function addSet(ei) {
  var sets = activeWorkout.exercises[ei].sets;
  var last = sets[sets.length - 1];
  sets.push({weight: last ? last.weight : '', reps: last ? last.reps : '', rpe: last ? last.rpe : 8, id: Date.now()});
  localStorage.setItem('wt_active', JSON.stringify(activeWorkout));
  renderSets(ei);
  updateActiveTags();
}

function removeSet(ei, si) {
  activeWorkout.exercises[ei].sets.splice(si, 1);
  localStorage.setItem('wt_active', JSON.stringify(activeWorkout));
  renderSets(ei);
}

function removeExercise(ei) {
  activeWorkout.exercises.splice(ei, 1);
  localStorage.setItem('wt_active', JSON.stringify(activeWorkout));
  renderActiveWorkout();
}

async function finishWorkout() {
  if (!activeWorkout || !activeWorkout.exercises.length) return;
  activeWorkout.duration = durSeconds;
  clearInterval(durTimer);
  durTimer = null;
  showLoading();
  try {
    await saveWorkout(activeWorkout);
    await loadWorkouts();
    hideLoading();
    localStorage.removeItem('wt_active');
    localStorage.removeItem('wt_dur');
    activeWorkout = null;
    durSeconds = 0;
    document.getElementById('active-workout').style.display = 'none';
    document.getElementById('no-workout').style.display = '';
    renderLastWorkout();
    renderHome();
    renderHistory();
    showToast('✅ Tréning uložený!');
  } catch(e) {
    hideLoading();
    showToast('❌ Chyba pri ukladaní: ' + e.message);
  }
}

function discardWorkout() {
  if (!confirm('Zahodiť tréning?')) return;
  clearInterval(durTimer);
  durTimer = null;
  localStorage.removeItem('wt_active');
  localStorage.removeItem('wt_dur');
  activeWorkout = null;
  durSeconds = 0;
  document.getElementById('active-workout').style.display = 'none';
  document.getElementById('no-workout').style.display = '';
}

// ═══════════════════════════════════════════════════════════ HISTORY
function renderHistory() {
  var list = document.getElementById('history-list');
  var empty = document.getElementById('history-empty');
  document.getElementById('history-count').textContent = workouts.length + ' tréningov';
  if (workouts.length === 0) { list.innerHTML = ''; empty.style.display = ''; return; }
  empty.style.display = 'none';
  list.innerHTML = workouts.map(function(w) {
    var vol = calcWorkoutVol(w);
    var dur = w.duration ? Math.floor(w.duration/60) + 'min' : '';
    return '<div class="hist-card">' +
      '<div class="hist-header">' +
        '<div><div class="hist-name">'+w.name+'</div>' +
        '<div class="hist-date">'+new Date(w.date).toLocaleDateString('sk',{weekday:'short',day:'numeric',month:'short',year:'numeric'})+(dur?' · '+dur:'')+'</div></div>' +
        '<button class="btn-del-hist" onclick="confirmDeleteWorkout('+w.id+')">🗑</button>' +
      '</div>' +
      '<div class="hist-tags">' +
        '<span class="tag tag-purple">📦 '+Math.round(vol)+' kg</span>' +
        '<span class="tag tag-green">'+((w.exercises||[]).length)+' cvikov</span>' +
        (dur ? '<span class="tag tag-muted">⏱ '+dur+'</span>' : '') +
      '</div>' +
      (w.exercises||[]).map(function(ex) {
        var best = (ex.sets||[]).reduce(function(b,s){var v=calcE1RM(s.weight,s.reps,s.rpe||10);return v>b?v:b;},0);
        return '<div class="hist-ex-row">' +
          '<span class="hist-ex-name">'+ex.name+'</span>' +
          '<div class="hist-ex-right">' +
            '<span>'+(ex.sets||[]).map(function(s){return (s.weight||0)+'×'+(s.reps||0);}).join(', ')+'</span>' +
            (best>0?'<span class="tag tag-purple">e1RM '+best+'</span>':'') +
          '</div></div>';
      }).join('') +
    '</div>';
  }).join('');
}

async function confirmDeleteWorkout(id) {
  if (!confirm('Zmazať tento tréning?')) return;
  showLoading();
  await deleteWorkout(id);
  await loadWorkouts();
  hideLoading();
  renderHistory();
  renderHome();
  renderProgress();
}

// ═══════════════════════════════════════════════════════════ PROGRESS
function renderProgress() {
  var PRs = getPRs();
  var prsEl = document.getElementById('prs-list');
  var chartCard = document.getElementById('chart-card');
  var progressEmpty = document.getElementById('progress-empty');

  if (PRs.length === 0) {
    prsEl.innerHTML = '<div style="color:var(--muted2);text-align:center;padding:16px;font-size:13px">Ešte žiadne záznamy</div>';
    chartCard.style.display = 'none';
    progressEmpty.style.display = '';
    return;
  }
  progressEmpty.style.display = 'none';

  prsEl.innerHTML = PRs.slice(0, 8).map(function(pr, i) {
    var cls = i === 0 ? 'tag-gold' : 'tag-muted';
    return '<div class="pr-row" style="cursor:pointer" onclick="selectChartEx(\'' + pr.name.replace(/'/g,"\\'") + '\')">' +
      '<div class="pr-left"><span class="tag '+cls+'">'+(i+1)+'</span><span class="pr-name">'+pr.name+'</span></div>' +
      '<div style="display:flex;gap:6px"><span class="tag tag-gold">e1RM '+pr.best1RM+' kg</span><span class="tag tag-muted">'+pr.bestW+' kg</span></div>' +
    '</div>';
  }).join('');

  var logged = [];
  workouts.forEach(function(w) { (w.exercises||[]).forEach(function(ex){ if(logged.indexOf(ex.name)===-1) logged.push(ex.name); }); });

  chartCard.style.display = '';
  document.getElementById('chart-ex-selector').innerHTML = logged.map(function(ex) {
    return '<button class="ex-btn '+(selectedChartEx===ex?'active':'')+'" onclick="selectChartEx(\'' + ex.replace(/'/g,"\\'") + '\')">' + ex + '</button>';
  }).join('');

  if (!selectedChartEx && logged.length) selectedChartEx = logged[0];
  drawChart();
}

function selectChartEx(name) {
  selectedChartEx = name;
  renderProgress();
}

function setMetric(m) {
  selectedMetric = m;
  document.querySelectorAll('.metric-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.metric === m); });
  drawChart();
}

function drawChart() {
  var hint = document.getElementById('chart-hint');
  if (!selectedChartEx) return;

  var pts = [];
  workouts.slice().reverse().forEach(function(w) {
    var ex = (w.exercises||[]).find(function(e) { return e.name === selectedChartEx; });
    if (!ex) return;
    var best1RM = (ex.sets||[]).reduce(function(b,s){var v=calcE1RM(s.weight,s.reps,s.rpe||10);return v>b?v:b;},0);
    var vol = (ex.sets||[]).reduce(function(t,s){return t+(Number(s.weight)*Number(s.reps)||0);},0);
    var maxW = (ex.sets||[]).reduce(function(b,s){return Number(s.weight)>b?Number(s.weight):b;},0);
    pts.push({date:new Date(w.date).toLocaleDateString('sk',{day:'numeric',month:'short'}),e1rm:best1RM,volume:Math.round(vol),weight:maxW});
  });

  if (pts.length < 2) {
    hint.style.display = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }
  hint.style.display = 'none';

  var labels = pts.map(function(p) { return p.date; });
  var data = pts.map(function(p) { return p[selectedMetric]; });
  var ctx = document.getElementById('progress-chart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: selectedMetric === 'volume' ? 'bar' : 'line',
    data: {
      labels: labels,
      datasets: [{
        label: selectedMetric === 'e1rm' ? 'e1RM (kg)' : selectedMetric === 'volume' ? 'Objem (kg)' : 'Max váha (kg)',
        data: data,
        backgroundColor: 'rgba(124,111,253,0.2)',
        borderColor: '#7c6ffd',
        borderWidth: 2.5,
        borderRadius: selectedMetric === 'volume' ? 6 : 0,
        pointBackgroundColor: '#7c6ffd',
        pointRadius: 4,
        pointHoverRadius: 7,
        fill: selectedMetric !== 'volume',
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {display: false},
        tooltip: {backgroundColor:'#111118',borderColor:'#1e1e2c',borderWidth:1,titleColor:'#e8e8f2',bodyColor:'#7c6ffd'}
      },
      scales: {
        x: {grid:{color:'#161622'}, ticks:{color:'#3a3a52',font:{size:10}}},
        y: {grid:{color:'#161622'}, ticks:{color:'#3a3a52',font:{size:10}}},
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════ EXERCISE PICKER
function openPicker() {
  pickerGroup = 'All';
  renderGroupTabs();
  filterExercises();
  document.getElementById('picker-overlay').classList.remove('hidden');
  var s = document.getElementById('picker-search');
  s.value = '';
  setTimeout(function() { s.focus(); }, 100);
}

function closePicker() {
  document.getElementById('picker-overlay').classList.add('hidden');
  document.getElementById('custom-form').style.display = 'none';
  document.getElementById('custom-collapsed').style.display = '';
}

function renderGroupTabs() {
  var groups = Object.keys(LIBRARY);
  document.getElementById('group-tabs').innerHTML = ['All'].concat(groups).map(function(g) {
    return '<button class="group-tab '+(pickerGroup===g?'active':'')+'" onclick="setPickerGroup(\''+g+'\')">'+g+'</button>';
  }).join('');
  var sel = document.getElementById('custom-group');
  sel.innerHTML = groups.map(function(g) { return '<option value="'+g+'">'+g+'</option>'; }).join('');
}

function setPickerGroup(g) {
  pickerGroup = g;
  document.querySelectorAll('.group-tab').forEach(function(b) { b.classList.toggle('active', b.textContent === g); });
  filterExercises();
}

function filterExercises() {
  var q = document.getElementById('picker-search').value.toLowerCase();
  var allEx = [];
  Object.entries(LIBRARY).forEach(function(entry) {
    entry[1].forEach(function(n) { allEx.push({name:n, group:entry[0], custom:false}); });
  });
  customExercises.forEach(function(e) {
    allEx.push({name:e.name, group:e.group_name||e.group||'Custom', custom:true});
  });

  var filtered = allEx.filter(function(e) {
    return (pickerGroup === 'All' || e.group === pickerGroup) && e.name.toLowerCase().includes(q);
  });

  var list = document.getElementById('picker-list');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="picker-empty">Nič nenájdené</div>';
    return;
  }
  list.innerHTML = filtered.map(function(ex) {
    var safeName = ex.name.replace(/'/g, "\\'");
    return '<div class="picker-item" onclick="selectExercise(\''+safeName+'\',\''+ex.group+'\')">'+
      '<span class="picker-item-name">'+(ex.custom?'⭐ ':'')+ex.name+'</span>'+
      '<span class="tag '+(ex.custom?'tag-gold':'tag-purple')+'">'+ex.group+'</span>'+
    '</div>';
  }).join('');
}

function selectExercise(name, group) {
  if (!activeWorkout) return;
  activeWorkout.exercises.push({name:name, group:group, id:Date.now(), sets:[{weight:'',reps:'',rpe:8,id:Date.now()}]});
  localStorage.setItem('wt_active', JSON.stringify(activeWorkout));
  closePicker();
  renderActiveWorkout();
}

function showCustomForm() {
  document.getElementById('custom-collapsed').style.display = 'none';
  document.getElementById('custom-form').style.display = '';
  document.getElementById('custom-name').focus();
}

function hideCustomForm() {
  document.getElementById('custom-form').style.display = 'none';
  document.getElementById('custom-collapsed').style.display = '';
}

async function addCustomExercise() {
  var name = document.getElementById('custom-name').value.trim();
  var group = document.getElementById('custom-group').value;
  if (!name) return;
  var ex = {id: Date.now(), name: name, group: group};
  customExercises.push({id:ex.id, name:ex.name, group_name:group});
  await saveCustomExercise(ex);
  selectExercise(name, group);
}

// ═══════════════════════════════════════════════════════════ TOAST
function showToast(msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 2800);
}

// close picker overlay
document.addEventListener('DOMContentLoaded', function() {
  var overlay = document.getElementById('picker-overlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePicker();
    });
  }
});
