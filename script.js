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

function calcE1RM(weight, reps, rpe=10) {
  const w=Number(weight), r=Number(reps);
  if(!w||!r||w<=0||r<=0) return 0;
  if(r===1) return w;
  const row = RPE_PCT[rpe]||RPE_PCT[10];
  return Math.round((w/row[Math.min(r-1,9)])*10)/10;
}

function rpeColor(r) {
  if(r>=9) return 'tag-red';
  if(r>=7.5) return 'tag-orange';
  if(r>=6) return 'tag-gold';
  return 'tag-green';
}

// ═══════════════════════════════════════════════════════════ STATE
let supabase = null;
let workouts = [];
let customExercises = [];
let activeWorkout = null;
let durSeconds = 0;
let durTimer = null;
let chartInstance = null;
let selectedChartEx = null;
let selectedMetric = 'e1rm';
let pickerGroup = 'All';

// ═══════════════════════════════════════════════════════════ INIT
window.addEventListener('DOMContentLoaded', () => {
  const url = localStorage.getItem('sb_url');
  const key = localStorage.getItem('sb_key');
  if(url && key) {
    initSupabase(url, key).then(ok => {
      if(ok) showApp();
      else showSetup();
    });
  } else {
    showSetup();
  }
});

function showSetup() {
  document.getElementById('setup-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  showLoading();
  Promise.all([loadWorkouts(), loadCustomExercises()]).then(() => {
    hideLoading();
    renderHome();
    renderHistory();
    renderProgress();
    setupWorkoutTab();
    document.getElementById('home-date').textContent = new Date().toLocaleDateString('sk',{weekday:'long',day:'numeric',month:'long'});
    document.getElementById('workout-date').textContent = new Date().toLocaleDateString('sk',{weekday:'long',day:'numeric',month:'long'});
  });
}

async function initSupabase(url, key) {
  try {
    supabase = window.supabase.createClient(url, key);
    // test connection
    const { error } = await supabase.from('workouts').select('id').limit(1);
    if(error) { console.error(error); return false; }
    return true;
  } catch(e) { console.error(e); return false; }
}

// ═══════════════════════════════════════════════════════════ SETUP ACTIONS
async function connectSupabase() {
  const url = document.getElementById('sb-url').value.trim();
  const key = document.getElementById('sb-key').value.trim();
  const errEl = document.getElementById('setup-error');
  errEl.textContent = '';

  if(!url || !key) { errEl.textContent = 'Vyplň oba polia.'; return; }
  if(!url.startsWith('https://')) { errEl.textContent = 'URL musí začínať https://'; return; }

  errEl.textContent = 'Pripájam…';
  const ok = await initSupabase(url, key);
  if(ok) {
    localStorage.setItem('sb_url', url);
    localStorage.setItem('sb_key', key);
    showApp();
  } else {
    errEl.textContent = '❌ Nepodarilo sa pripojiť. Skontroluj URL a Key, a či si spustil SQL script.';
  }
}

function logout() {
  if(!confirm('Odpojiť Supabase? Dáta zostanú v databáze.')) return;
  localStorage.removeItem('sb_url');
  localStorage.removeItem('sb_key');
  supabase = null;
  location.reload();
}

function showSQLModal() { document.getElementById('sql-modal').classList.remove('hidden'); }
function closeSQLModal(e) {
  if(!e || e.target.id==='sql-modal' || e.target.classList.contains('modal-close')) {
    document.getElementById('sql-modal').classList.add('hidden');
  }
}
function copySQL() {
  navigator.clipboard.writeText(document.getElementById('sql-code').textContent);
  showToast('SQL skopírovaný!');
}

// ═══════════════════════════════════════════════════════════ LOADING
function showLoading() {
  let el = document.getElementById('loading-screen');
  if(!el) {
    el = document.createElement('div');
    el.id = 'loading-screen';
    el.innerHTML = '<div class="loading-icon">🏋️</div><div class="loading-text">Načítavam tréningy…</div>';
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loading-screen');
  if(el) el.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════ SUPABASE DATA
async function loadWorkouts() {
  const { data, error } = await supabase.from('workouts').select('*').order('date', {ascending:false});
  if(!error && data) workouts = data;
}

async function loadCustomExercises() {
  const { data, error } = await supabase.from('custom_exercises').select('*');
  if(!error && data) customExercises = data;
}

async function saveWorkout(w) {
  await supabase.from('workouts').upsert({
    id: w.id,
    name: w.name,
    date: w.date,
    duration: w.duration,
    exercises: w.exercises
  });
}

async function deleteWorkout(id) {
  await supabase.from('workouts').delete().eq('id', id);
}

async function saveCustomExercise(ex) {
  await supabase.from('custom_exercises').upsert({
    id: ex.id,
    name: ex.name,
    group_name: ex.group
  });
}

// ═══════════════════════════════════════════════════════════ TABS
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
  if(tab==='progress') renderProgress();
}

// ═══════════════════════════════════════════════════════════ HOME
function renderHome() {
  const total = workouts.length;
  const week  = workouts.filter(w=>new Date(w.date)>new Date(Date.now()-7*86400000)).length;
  const vol   = workouts.reduce((t,w)=>t+(calcWorkoutVol(w)),0);
  const uniq  = [...new Set(workouts.flatMap(w=>(w.exercises||[]).map(e=>e.name)))].length;

  document.getElementById('stats-grid').innerHTML = [
    {icon:'🏋️', val:total, label:'Celkom tréningov', col:'purple'},
    {icon:'🔥', val:week,  label:'Tento týždeň',     col:'orange'},
    {icon:'📦', val:(vol/1000).toFixed(1)+'t', label:'Celkový objem', col:'green'},
    {icon:'⚡', val:uniq,  label:'Rôznych cvikov',   col:'gold'},
  ].map(s=>`
    <div class="stat-card" style="background:linear-gradient(135deg,var(--surf),var(--${s.col}-dim));border-color:rgba(var(--${s.col}-rgb,124,111,253),0.15)">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-val">${s.val}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');

  const PRs = getPRs().slice(0,3);
  const prsCard = document.getElementById('top-prs-card');
  const homeEmpty = document.getElementById('home-empty');

  if(PRs.length>0) {
    prsCard.style.display='';
    document.getElementById('top-prs-list').innerHTML = PRs.map((pr,i)=>`
      <div class="pr-row">
        <div class="pr-left">
          <span class="tag ${['tag-gold','tag-muted','tag-muted'][i]}">${i+1}</span>
          <span class="pr-name">${pr.name}</span>
        </div>
        <span class="pr-val">${pr.best1RM} kg</span>
      </div>
    `).join('');
  } else {
    prsCard.style.display='none';
  }

  homeEmpty.style.display = workouts.length===0 ? '' : 'none';
}

function calcWorkoutVol(w) {
  return (w.exercises||[]).reduce((t,ex)=>(ex.sets||[]).reduce((s,set)=>s+(Number(set.weight)*Number(set.reps)||0),t),0);
}

function getPRs() {
  const names = [...new Set(workouts.flatMap(w=>(w.exercises||[]).map(e=>e.name)))];
  return names.map(name=>{
    let best1RM=0, bestW=0;
    workouts.forEach(w=>(w.exercises||[]).filter(e=>e.name===name).forEach(ex=>{
      (ex.sets||[]).forEach(s=>{
        const v=calcE1RM(s.weight,s.reps,s.rpe||10); if(v>best1RM) best1RM=v;
        if(Number(s.weight)>bestW) bestW=Number(s.weight);
      });
    }));
    return {name,best1RM,bestW};
  }).filter(e=>e.best1RM>0).sort((a,b)=>b.best1RM-a.best1RM);
}

function getBest1RMForEx(name) {
  let b=0;
  workouts.forEach(w=>(w.exercises||[]).filter(e=>e.name===name).forEach(ex=>{
    (ex.sets||[]).forEach(s=>{const v=calcE1RM(s.weight,s.reps,s.rpe||10);if(v>b)b=v;});
  }));
  return b;
}

// ═══════════════════════════════════════════════════════════ WORKOUT
function setupWorkoutTab() {
  // restore active workout from localStorage (temp, not cloud)
  const saved = localStorage.getItem('wt_active');
  const savedDur = Number(localStorage.getItem('wt_dur')||0);
  if(saved) {
    activeWorkout = JSON.parse(saved);
    durSeconds = savedDur;
    showActiveWorkout();
  } else {
    document.getElementById('no-workout').style.display='';
    document.getElementById('active-workout').style.display='none';
  }
  renderLastWorkout();
}

function renderLastWorkout() {
  if(!workouts[0]) return;
  const card = document.getElementById('last-workout-card');
  const content = document.getElementById('last-workout-content');
  card.style.display='';
  const w = workouts[0];
  content.innerHTML = `
    <div style="font-weight:800;margin-bottom:10px;font-size:15px">${w.name}</div>
    ${(w.exercises||[]).map(ex=>`
      <div class="hist-ex-row">
        <span class="hist-ex-name">${ex.name}</span>
        <span style="color:var(--muted);font-size:12px">${(ex.sets||[]).map(s=>`${s.weight||0}×${s.reps||0}`).join(', ')}</span>
      </div>
    `).join('')}
  `;
}

function startWorkout() {
  const n = new Date();
  activeWorkout = {
    id: Date.now(),
    name: `Tréning ${n.toLocaleDateString('sk',{day:'numeric',month:'short'})}`,
    date: n.toISOString(),
    exercises: []
  };
  durSeconds = 0;
  localStorage.setItem('wt_active', JSON.stringify(activeWorkout));
  localStorage.setItem('wt_dur', '0');
  showActiveWorkout();
}

function showActiveWorkout() {
  document.getElementById('no-workout').style.display='none';
  document.getElementById('active-workout').style.display='';
  document.getElementById('workout-name-input').value = activeWorkout.name;

  // sync name changes
  document.getElementById('workout-name-input').oninput = (e) => {
    activeWorkout.name = e.target.value;
    localStorage.setItem('wt_active', JSON.stringify(activeWorkout));
  };

  startTimer();
  renderActiveWorkout();
}

function startTimer() {
  if(durTimer) clearInterval(durTimer);
  durTimer = setInterval(()=>{
    durSeconds++;
    localStorage.setItem('wt_dur', durSeconds);
    updateActiveTags();
  }, 1000);
}

function fmtTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function updateActiveTags() {
  const vol = (activeWorkout?.exercises||[]).reduce((t,ex)=>(ex.sets||[]).reduce((s,set)=>s+(Number(set.weight)*Number(set.reps)||0),t),0);
  document.getElementById('active-tags').innerHTML = `
    <span class="tag tag-green">⏱ ${fmtTime(durSeconds)}</span>
    <span class="tag tag-purple">📦 ${Math.round(vol)} kg</span>
    <span class="tag tag-orange">${(activeWorkout?.exercises||[]).length} cvikov</span>
  `;
}

function renderActiveWorkout() {
  updateActiveTags();
  const list = document.getElementById('exercise-list');
  list.innerHTML = '';
  (activeWorkout.exercises||[]).forEach((ex,ei)=>{
    const card = document.createElement('div');
    card.className='ex-card';
    const prevBest = getBest1RMForEx(ex.name);
    card.innerHTML=`
      <div class="ex-card-header">
        <div>
          <div class="ex-name">${ex.name}</div>
          <div class="ex-meta">
            <span class="tag tag-purple">${ex.group}</span>
            ${prevBest>0?`<span class="tag tag-muted">Rekord: ${prevBest} kg e1RM</span>`:''}
          </div>
        </div>
        <button class="btn-icon-danger" onclick="removeExercise(${ei})">🗑</button>
      </div>
      <div id="sets-${ei}"></div>
      <button class="btn-add-set" onclick="addSet(${ei})">+ Pridaj sériu</button>
    `;
    list.appendChild(card);
    renderSets(ei);
  });

  const finBtn = document.getElementById('finish-btn');
  finBtn.disabled = (activeWorkout.exercises||[]).length===0;
}

function renderSets(ei) {
  const ex = activeWorkout.exercises[ei];
  const container = document.getElementById(`sets-${ei}`);
  if(!container) return;
  container.innerHTML = '';
  (ex.sets||[]).forEach((set,si)=>{
    const val = calcE1RM(set.weight,set.reps,set.rpe||10);
    const prevBest = getBest1RMForEx(ex.name);
    const isPR = val>0 && val>prevBest;
    const row = document.createElement('div');
    row.className='set-row';
    row.innerHTML=`
      <div class="set-inputs">
        <span class="set-num">${si+1}</span>
        <div class="input-group">
          <div class="input-label">KG</div>
          <input class="set-input" type="number" inputmode="decimal" placeholder="0" value="${set.weight||''}"
            onchange="updateSet(${ei},${si},'weight',this.value)"/>
        </div>
        <div class="input-group">
          <div class="input-label">REPS</div>
          <input class="set-input" type="number" inputmode="numeric" placeholder="0" value="${set.reps||''}"
            onchange="updateSet(${ei},${si},'reps',this.value)"/>
        </div>
        <div class="input-group">
          <div class="input-label">RPE</div>
          <select class="set-select" onchange="updateSet(${ei},${si},'rpe',Number(this.value))">
            ${[6,6.5,7,7.5,8,8.5,9,9.5,10].map(r=>`<option value="${r}" ${(set.rpe||8)==r?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
        <button class="set-del" onclick="removeSet(${ei},${si})">✕</button>
      </div>
      ${val>0?`<div class="set-tags">
        <span class="tag ${isPR?'tag-gold':'tag-purple'}">${isPR?'🏆 PR! ':''}e1RM ${val} kg</span>
        ${set.rpe?`<span class="tag ${rpeColor(set.rpe)}">RPE ${set.rpe}</span>`:''}
      </div>`:''}
    `;
    container.appendChild(row);
  });
}

function updateSet(ei,si,field,val) {
  activeWorkout.exercises[ei].sets[si][field]=val;
  localStorage.setItem('wt_active',JSON.stringify(activeWorkout));
  renderSets(ei);
  updateActiveTags();
}

function addSet(ei) {
  const sets = activeWorkout.exercises[ei].sets;
  const last = sets[sets.length-1];
  sets.push({weight:last?.weight||'',reps:last?.reps||'',rpe:last?.rpe||8,id:Date.now()});
  localStorage.setItem('wt_active',JSON.stringify(activeWorkout));
  renderSets(ei);
  updateActiveTags();
}

function removeSet(ei,si) {
  activeWorkout.exercises[ei].sets.splice(si,1);
  localStorage.setItem('wt_active',JSON.stringify(activeWorkout));
  renderSets(ei);
}

function removeExercise(ei) {
  activeWorkout.exercises.splice(ei,1);
  localStorage.setItem('wt_active',JSON.stringify(activeWorkout));
  renderActiveWorkout();
}

async function finishWorkout() {
  if(!activeWorkout||!activeWorkout.exercises.length) return;
  activeWorkout.duration = durSeconds;
  clearInterval(durTimer);
  durTimer=null;
  showLoading();
  await saveWorkout(activeWorkout);
  await loadWorkouts();
  hideLoading();
  localStorage.removeItem('wt_active');
  localStorage.removeItem('wt_dur');
  activeWorkout=null;
  durSeconds=0;
  document.getElementById('active-workout').style.display='none';
  document.getElementById('no-workout').style.display='';
  renderLastWorkout();
  renderHome();
  renderHistory();
  showToast('✅ Tréning uložený!');
}

function discardWorkout() {
  if(!confirm('Zahodiť tréning? Dáta sa nestratia z predchádzajúcich tréningov.')) return;
  clearInterval(durTimer); durTimer=null;
  localStorage.removeItem('wt_active');
  localStorage.removeItem('wt_dur');
  activeWorkout=null; durSeconds=0;
  document.getElementById('active-workout').style.display='none';
  document.getElementById('no-workout').style.display='';
}

// ═══════════════════════════════════════════════════════════ HISTORY
function renderHistory() {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  document.getElementById('history-count').textContent=`${workouts.length} tréningov`;
  if(workouts.length===0){ list.innerHTML=''; empty.style.display=''; return; }
  empty.style.display='none';
  list.innerHTML = workouts.map(w=>{
    const vol=calcWorkoutVol(w);
    const dur=w.duration?`${Math.floor(w.duration/60)}min`:'';
    return `
      <div class="hist-card">
        <div class="hist-header">
          <div>
            <div class="hist-name">${w.name}</div>
            <div class="hist-date">${new Date(w.date).toLocaleDateString('sk',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}${dur?' · '+dur:''}</div>
          </div>
          <button class="btn-del-hist" onclick="confirmDeleteWorkout(${w.id})">🗑</button>
        </div>
        <div class="hist-tags">
          <span class="tag tag-purple">📦 ${Math.round(vol)} kg</span>
          <span class="tag tag-green">${(w.exercises||[]).length} cvikov</span>
          ${dur?`<span class="tag tag-muted">⏱ ${dur}</span>`:''}
        </div>
        ${(w.exercises||[]).map(ex=>{
          const best=(ex.sets||[]).reduce((b,s)=>{const v=calcE1RM(s.weight,s.reps,s.rpe||10);return v>b?v:b;},0);
          return `<div class="hist-ex-row">
            <span class="hist-ex-name">${ex.name}</span>
            <div class="hist-ex-right">
              <span>${(ex.sets||[]).map(s=>`${s.weight||0}×${s.reps||0}`).join(', ')}</span>
              ${best>0?`<span class="tag tag-purple">e1RM ${best}</span>`:''}
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
  }).join('');
}

async function confirmDeleteWorkout(id) {
  if(!confirm('Zmazať tento tréning?')) return;
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
  const PRs=getPRs();
  const prsEl=document.getElementById('prs-list');
  const chartCard=document.getElementById('chart-card');
  const progressEmpty=document.getElementById('progress-empty');

  if(PRs.length===0){
    prsEl.innerHTML='<div style="color:var(--muted2);text-align:center;padding:16px;font-size:13px">Ešte žiadne záznamy</div>';
    chartCard.style.display='none';
    progressEmpty.style.display='';
    return;
  }
  progressEmpty.style.display='none';

  prsEl.innerHTML=PRs.slice(0,8).map((pr,i)=>`
    <div class="pr-row" style="cursor:pointer" onclick="selectChartEx('${pr.name}')">
      <div class="pr-left">
        <span class="tag ${['tag-gold','tag-muted','tag-muted'][i]||'tag-muted'}">${i+1}</span>
        <span class="pr-name">${pr.name}</span>
      </div>
      <div style="display:flex;gap:6px">
        <span class="tag tag-gold">e1RM ${pr.best1RM} kg</span>
        <span class="tag tag-muted">${pr.bestW} kg</span>
      </div>
    </div>
  `).join('');

  // logged exercises
  const logged=[...new Set(workouts.flatMap(w=>(w.exercises||[]).map(e=>e.name)))];
  chartCard.style.display='';
  document.getElementById('chart-ex-selector').innerHTML=logged.map(ex=>`
    <button class="ex-btn ${selectedChartEx===ex?'active':''}" onclick="selectChartEx('${ex}')">${ex}</button>
  `).join('');

  if(!selectedChartEx && logged.length) selectedChartEx=logged[0];
  drawChart();
}

function selectChartEx(name) {
  selectedChartEx=name;
  renderProgress();
}

function setMetric(m) {
  selectedMetric=m;
  document.querySelectorAll('.metric-btn').forEach(b=>b.classList.toggle('active',b.dataset.metric===m));
  drawChart();
}

function drawChart() {
  const hint=document.getElementById('chart-hint');
  if(!selectedChartEx){return;}
  const pts=workouts.slice().reverse().flatMap(w=>{
    const ex=(w.exercises||[]).find(e=>e.name===selectedChartEx);
    if(!ex) return [];
    const best1RM=(ex.sets||[]).reduce((b,s)=>{const v=calcE1RM(s.weight,s.reps,s.rpe||10);return v>b?v:b;},0);
    const vol=(ex.sets||[]).reduce((t,s)=>t+(Number(s.weight)*Number(s.reps)||0),0);
    const maxW=(ex.sets||[]).reduce((b,s)=>Number(s.weight)>b?Number(s.weight):b,0);
    return [{date:new Date(w.date).toLocaleDateString('sk',{day:'numeric',month:'short'}),e1rm:best1RM,volume:Math.round(vol),weight:maxW}];
  });

  if(pts.length<2){
    hint.style.display='';
    if(chartInstance){chartInstance.destroy();chartInstance=null;}
    return;
  }
  hint.style.display='none';

  const labels=pts.map(p=>p.date);
  const data=pts.map(p=>p[selectedMetric]);
  const ctx=document.getElementById('progress-chart').getContext('2d');
  if(chartInstance) chartInstance.destroy();

  chartInstance=new Chart(ctx,{
    type: selectedMetric==='volume'?'bar':'line',
    data:{
      labels,
      datasets:[{
        label:selectedMetric==='e1rm'?'e1RM (kg)':selectedMetric==='volume'?'Objem (kg)':'Max váha (kg)',
        data,
        backgroundColor:'rgba(124,111,253,0.2)',
        borderColor:'#7c6ffd',
        borderWidth:2.5,
        borderRadius:selectedMetric==='volume'?6:0,
        pointBackgroundColor:'#7c6ffd',
        pointRadius:4,
        pointHoverRadius:7,
        fill:selectedMetric!=='volume',
        tension:0.3,
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{backgroundColor:'#111118',borderColor:'#1e1e2c',borderWidth:1,titleColor:'#e8e8f2',bodyColor:'#7c6ffd',titleFont:{family:'Syne'},bodyFont:{family:'Syne',weight:'bold'}}},
      scales:{
        x:{grid:{color:'#161622'},ticks:{color:'#3a3a52',font:{family:'Syne',size:10}}},
        y:{grid:{color:'#161622'},ticks:{color:'#3a3a52',font:{family:'Syne',size:10}}},
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════ EXERCISE PICKER
function openPicker() {
  pickerGroup='All';
  renderGroupTabs();
  filterExercises();
  document.getElementById('picker-overlay').classList.remove('hidden');
  document.getElementById('picker-search').value='';
  document.getElementById('picker-search').focus();
}

function closePicker() {
  document.getElementById('picker-overlay').classList.add('hidden');
  document.getElementById('custom-form').style.display='none';
  document.getElementById('custom-collapsed').style.display='';
}

function renderGroupTabs() {
  const groups=Object.keys(LIBRARY);
  document.getElementById('group-tabs').innerHTML=['All',...groups].map(g=>`
    <button class="group-tab ${pickerGroup===g?'active':''}" onclick="setPickerGroup('${g}')">${g}</button>
  `).join('');

  // populate custom group select
  const sel=document.getElementById('custom-group');
  sel.innerHTML=groups.map(g=>`<option value="${g}">${g}</option>`).join('');
}

function setPickerGroup(g) {
  pickerGroup=g;
  document.querySelectorAll('.group-tab').forEach(b=>b.classList.toggle('active',b.textContent===g));
  filterExercises();
}

function filterExercises() {
  const q=document.getElementById('picker-search').value.toLowerCase();
  const allEx=[
    ...Object.entries(LIBRARY).flatMap(([g,exs])=>exs.map(n=>({name:n,group:g,custom:false}))),
    ...customExercises.map(e=>({name:e.name,group:e.group_name||e.group,custom:true})),
  ];
  const filtered=allEx.filter(e=>
    (pickerGroup==='All'||e.group===pickerGroup)&&
    e.name.toLowerCase().includes(q)
  );
  const list=document.getElementById('picker-list');
  if(filtered.length===0){
    list.innerHTML='<div class="picker-empty">Nič nenájdené</div>';
    return;
  }
  list.innerHTML=filtered.map(ex=>`
    <div class="picker-item" onclick="selectExercise('${ex.name.replace(/'/g,"\\'")}','${ex.group}')">
      <span class="picker-item-name">${ex.custom?'⭐ ':''}${ex.name}</span>
      <span class="tag ${ex.custom?'tag-gold':'tag-purple'}">${ex.group}</span>
    </div>
  `).join('');
}

function selectExercise(name, group) {
  if(!activeWorkout) return;
  activeWorkout.exercises.push({name,group,id:Date.now(),sets:[{weight:'',reps:'',rpe:8,id:Date.now()}]});
  localStorage.setItem('wt_active',JSON.stringify(activeWorkout));
  closePicker();
  renderActiveWorkout();
}

function showCustomForm() {
  document.getElementById('custom-collapsed').style.display='none';
  document.getElementById('custom-form').style.display='';
  document.getElementById('custom-name').focus();
}

function hideCustomForm() {
  document.getElementById('custom-form').style.display='none';
  document.getElementById('custom-collapsed').style.display='';
}

async function addCustomExercise() {
  const name=document.getElementById('custom-name').value.trim();
  const group=document.getElementById('custom-group').value;
  if(!name) return;
  const ex={id:Date.now(),name,group};
  customExercises.push({...ex,group_name:group});
  await saveCustomExercise(ex);
  selectExercise(name,group);
}

// ═══════════════════════════════════════════════════════════ TOAST
function showToast(msg) {
  const t=document.createElement('div');
  t.className='toast';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2800);
}

// close picker on overlay click
document.getElementById('picker-overlay').addEventListener('click',function(e){
  if(e.target===this) closePicker();
});
