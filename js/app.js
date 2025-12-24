/* ------- TABS -------- */
const tabs = document.querySelectorAll('.nav-tabs div');
tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.querySelectorAll('.tab').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(t.dataset.tab);
  if (target) target.classList.add('active');
}));

/* ------- EQUITY TABS -------- */
const equityTabs = document.querySelectorAll('.equity-tab');
equityTabs.forEach(tab => tab.addEventListener('click', () => {
  equityTabs.forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  const targetTab = tab.dataset.equityTab;
  document.querySelectorAll('.equity-content').forEach(c => c.classList.remove('active'));

  if(targetTab === 'graph'){
    document.getElementById('equityGraphContent').classList.add('active');
  } else if(targetTab === 'stats'){
    document.getElementById('equityStatsContent').classList.add('active');
    updateAdvancedStats();
  } else if(targetTab === 'objectives'){
    document.getElementById('equityObjectivesContent').classList.add('active');
    renderObjectivesWidget();
  }
}));

/* ------- TIME FILTER BUTTONS -------- */
const timeFilters = document.querySelectorAll('.time-filter');
timeFilters.forEach(filter => filter.addEventListener('click', () => {
  timeFilters.forEach(f => f.classList.remove('active'));
  filter.classList.add('active');

  const period = filter.dataset.period;
  currentPeriod = period;
  updateEquityChart(period);
}));

/* ------- STAT INFO TOOLTIPS -------- */
const statInfos = {
  profitFactor: {
    title: 'Profit Factor',
    description: 'Le Profit Factor mesure le rapport entre vos gains totaux et vos pertes totales.',
    formula: 'Profit Factor = Total Gains / Total Pertes (absolues)',
    interpretation: `
      <strong>Interprétation :</strong><br>
      • <strong style="color:var(--pos)">≥ 2.0</strong> : Excellent (tu gagnes 2× plus que tu ne perds)<br>
      • <strong style="color:var(--pos)">≥ 1.5</strong> : Très bon<br>
      • <strong style="color:var(--pos)">≥ 1.0</strong> : Profitable (gains > pertes)<br>
      • <strong style="color:var(--danger)">< 1.0</strong> : En perte (pertes > gains)<br>
      • <strong>∞</strong> : Aucune perte (tous les trades gagnants)
    `
  },
  avgRR: {
    title: 'Risk/Reward Ratio Moyen',
    description: 'Le R/R moyen représente le rapport risque/rendement moyen de tous tes trades ayant un TP et SL définis.',
    formula: 'R/R moyen = Σ(R/R de chaque trade) / Nombre de trades avec TP/SL',
    interpretation: `
      <strong>Interprétation :</strong><br>
      • <strong style="color:var(--pos)">≥ 3.0</strong> : Excellent (tu vises 3× ton risque en gain)<br>
      • <strong style="color:var(--pos)">≥ 2.0</strong> : Très bon<br>
      • <strong style="color:var(--pos)">≥ 1.5</strong> : Bon<br>
      • <strong>≥ 1.0</strong> : Acceptable<br>
      • <strong style="color:var(--danger)">< 1.0</strong> : Mauvais (tu risques plus que tu ne peux gagner)<br><br>
      <em>Note : Seuls les trades avec TP et SL sont comptabilisés</em>
    `
  },
  maxDD: {
    title: 'Maximum Drawdown',
    description: 'Le Max Drawdown représente la plus grande baisse de ton equity depuis un pic historique. C\'est une mesure du risque que tu prends.',
    formula: 'Max DD = ((Peak Equity - Current Equity) / Peak Equity) × 100',
    interpretation: `
      <strong>Interprétation :</strong><br>
      • <strong style="color:var(--pos)">0%</strong> : Parfait (jamais de baisse)<br>
      • <strong>< 10%</strong> : Très bon (risque faible)<br>
      • <strong style="color:var(--muted)">10-20%</strong> : Acceptable (risque modéré)<br>
      • <strong style="color:var(--danger)">> 20%</strong> : Attention ! (risque élevé)<br>
      • <strong style="color:var(--danger)">> 50%</strong> : Danger critique<br><br>
      <em>Exemple : Si ton equity passe de $10,000 à $8,000, ton DD est -20%</em>
    `
  },
  expectancy: {
    title: 'Expectancy (Espérance)',
    description: 'L\'Expectancy représente ton gain/perte moyen espéré par trade. C\'est une métrique cruciale qui combine ton winrate et tes gains/pertes moyens.',
    formula: 'Expectancy = (Winrate × Avg Win) - ((1 - Winrate) × Avg Loss)',
    interpretation: `
      <strong>Interprétation :</strong><br>
      • <strong style="color:var(--pos)">> $0</strong> : Système profitable à long terme<br>
      • <strong style="color:var(--danger)">< $0</strong> : Système perdant à long terme<br>
      • <strong>= $0</strong> : Break-even (ni gagnant ni perdant)<br><br>
      <em>Exemple : Une expectancy de +$15 signifie qu'en moyenne, chaque trade te rapporte $15</em><br><br>
      <strong>Pourquoi c'est important :</strong> Même avec un winrate de 40%, si tes gains moyens sont beaucoup plus grands que tes pertes moyennes, ton expectancy peut être positive !
    `
  },
  winStreak: {
    title: 'Longest Win Streak',
    description: 'Le nombre maximum de trades gagnants consécutifs que tu as réalisés.',
    formula: 'Compte du plus grand nombre de trades gagnants d\'affilée',
    interpretation: `
      <strong>Utilité :</strong><br>
      • Te montre ta meilleure série de succès<br>
      • Utile pour comprendre la variance de tes résultats<br>
      • À comparer avec ton Longest Loss Streak pour avoir une vue d'ensemble<br><br>
      <em>Note : Cette métrique seule ne dit pas grand-chose, c'est la combinaison avec d'autres stats qui est importante</em>
    `
  },
  lossStreak: {
    title: 'Longest Loss Streak',
    description: 'Le nombre maximum de trades perdants consécutifs que tu as subis.',
    formula: 'Compte du plus grand nombre de trades perdants d\'affilée',
    interpretation: `
      <strong>Utilité :</strong><br>
      • Te montre ta pire série de pertes<br>
      • <strong style="color:var(--danger)">Crucial pour le money management</strong> : tu dois pouvoir survivre à cette série !<br>
      • Si ton loss streak est trop élevé, tu risques de perdre trop de capital avant de revenir en profit<br><br>
      <strong>Règle d'or :</strong> Ton capital doit pouvoir supporter au moins 2× ton loss streak actuel pour éviter la ruine
    `
  }
};

function showStatInfo(statKey){
  const info = statInfos[statKey];
  if(!info) return;

  const content = `
    <h4>${info.title}</h4>
    <p>${info.description}</p>
    <div class="formula">${info.formula}</div>
    <div class="interpretation">${info.interpretation}</div>
  `;

  document.getElementById('infoTooltipContent').innerHTML = content;
  document.getElementById('infoTooltipBackdrop').classList.add('visible');
  document.getElementById('infoTooltip').classList.add('visible');
}

function hideStatInfo(){
  document.getElementById('infoTooltipBackdrop').classList.remove('visible');
  document.getElementById('infoTooltip').classList.remove('visible');
}

window.showStatInfo = showStatInfo;
window.hideStatInfo = hideStatInfo;

/* DARK MODE */
const darkToggle = document.getElementById('darkToggle');
// Load saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light');
  darkToggle.innerText = '☀️';
}
darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  darkToggle.innerText = isLight ? '☀️' : '🌙';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

/* PRICES */
const TAKER_FEE = 0.001;
const symbols = ["BTCUSDT","ETHUSDT","SOLUSDT","LTCUSDT"];
let prices = {};
const fallbackPrices = { BTCUSDT:65000, ETHUSDT:4000, SOLUSDT:150, LTCUSDT:120 };

async function fetchPrice(sym){
  try{
    const r=await fetch("https://api.binance.com/api/v3/ticker/price?symbol="+sym);
    if(!r.ok) throw new Error();
    const j=await r.json();
    return parseFloat(j.price);
  } catch(e){
    return null;
  }
}

async function updatePrices(){
  const priceStatus = document.getElementById('priceStatus');
  const priceStatusText = document.getElementById('priceStatusText');

  // Set loading state
  if(priceStatus){
    priceStatus.className = 'price-status loading';
    priceStatusText.innerText = 'Mise à jour...';
  }

  const table=document.getElementById('priceTable');
  if(table.rows.length===1){
    symbols.forEach(s=>{
      const r=table.insertRow();
      r.insertCell().innerText=s.replace('USDT','');
      const c=r.insertCell();
      c.style.textAlign='right';
      c.id='p_'+s;
      c.innerText='...';
    });
  }

  let anyErr=false;

  for(const s of symbols){
    const p=await fetchPrice(s);
    if(p!=null){
      prices[s]=p;
      const el=document.getElementById('p_'+s);
      if(el) el.innerText='$'+p.toFixed(2);
    } else {
      prices[s]=fallbackPrices[s];
      const el=document.getElementById('p_'+s);
      if(el) el.innerText='$'+prices[s].toFixed(2)+" (fallback)";
      anyErr=true;
    }
  }

  // Update status
  if(priceStatus){
    if(anyErr){
      priceStatus.className = 'price-status error';
      priceStatusText.innerText = 'Erreur - Fallback actif';
    } else {
      priceStatus.className = 'price-status connected';
      priceStatusText.innerText = 'Connecté';
    }
  }

  const pe=document.getElementById('priceError');
  if(anyErr){
    pe.style.display="block";
    pe.innerText="Remarque : récupération live échouée — fallback utilisé.";
  } else pe.style.display="none";

  updateRRPreview();
}

/* R/R + SL/TP PREVIEW */
function fmtSignPercent(v){ if(!isFinite(v)) return "-"; const s=v>0?"+":""; return s+v.toFixed(2)+"%"; }

function computeRR_for_side(side,entry,tp,sl){
  if(!isFinite(entry)||!isFinite(tp)||!isFinite(sl)) return "-";
  if(side==="LONG"){
    const up=tp-entry,down=entry-sl;
    if(down===0) return "-";
    return (up/down).toFixed(2);
  } else {
    const up=entry-tp,down=sl-entry;
    if(down===0) return "-";
    return (up/down).toFixed(2);
  }
}

function computePerc_for_side(side,entry,price){
  if(!isFinite(entry)||!isFinite(price)) return NaN;
  return side==="LONG"
    ? ((price-entry)/entry*100)
    : ((entry-price)/entry*100);
}

const t_token=document.getElementById('t_token');
const t_tp=document.getElementById('t_tp');
const t_sl=document.getElementById('t_sl');
const t_side=document.getElementById('t_side');
const rr_info=document.getElementById('rr_info');
const sl_tp_info=document.getElementById('sl_tp_info');
const validationBox=document.getElementById('validationBox');
const valid_msg=document.getElementById('valid_msg');

function updateRRPreview(){
  const token=t_token.value;
  const entry=prices[token];
  const tp=parseFloat(t_tp.value);
  const sl=parseFloat(t_sl.value);
  const side=t_side.value;

  if(!isFinite(entry)){ rr_info.innerText="R/R : -"; return; }

  const rr=computeRR_for_side(side,entry,tp,sl);
  const slp=computePerc_for_side(side,entry,sl);
  const tpp=computePerc_for_side(side,entry,tp);

  // Apply color coding to R/R
  const rrColorClass = (rr !== "-") ? getRRColorClass(parseFloat(rr)) : '';
  rr_info.className = 'line ' + rrColorClass;
  rr_info.innerText="R/R : "+rr;
  sl_tp_info.innerText=`SL% : ${fmtSignPercent(slp)} | TP% : ${fmtSignPercent(tpp)}`;

  let valid=false,msg="";
  if(side==="LONG"){
    if(sl !== null && isFinite(sl) && tp !== null && isFinite(tp)){
      valid=sl<entry && tp>entry;
      msg=valid?"SL < ENTRY < TP — OK":"Erreur LONG";
    } else msg="SL ou TP manquant";
  } else {
    if(sl !== null && isFinite(sl) && tp !== null && isFinite(tp)){
      valid=sl>entry && tp<entry;
      msg=valid?"SL > ENTRY > TP — OK":"Erreur SHORT";
    } else msg="SL ou TP manquant";
  }

  valid_msg.innerText="Validation SL/TP : "+msg;
  validationBox.className=valid?"validation ok":"validation bad";

  // Validate limit price if limit order is active
  const isLimitOrder = document.getElementById('t_limit_order').checked;
  const limitPrice = parseFloat(document.getElementById('t_limit_price').value);

  if(isLimitOrder && isFinite(limitPrice) && isFinite(entry)){
    const limitWarning = document.getElementById('limit_warning');
    let warning = '';
    let isUnusual = false;

    if(side === "LONG" && limitPrice > entry){
      warning = '⚠️ LONG avec prix limite > prix actuel';
      isUnusual = true;
    } else if(side === "SHORT" && limitPrice < entry){
      warning = '⚠️ SHORT avec prix limite < prix actuel';
      isUnusual = true;
    }

    if(limitWarning){
      if(warning){
        limitWarning.innerText = warning;
        limitWarning.style.display = 'block';
        limitWarning.style.color = 'var(--muted)';
        limitWarning.style.fontSize = '12px';
        limitWarning.style.marginTop = '6px';
      } else {
        limitWarning.style.display = 'none';
      }
    }
  }

  // Update capital after opening
  const size = parseFloat(t_size.value);
  const availableCapital = getAvailableCapital();
  const capital_after_info = document.getElementById('capital_after_info');
  if(isFinite(size) && size > 0){
    const capitalAfter = availableCapital - size;
    capital_after_info.innerText = `Après ouverture : $${capitalAfter.toFixed(2)}`;
    capital_after_info.style.color = capitalAfter >= 0 ? 'var(--accent)' : 'var(--danger)';
  } else {
    capital_after_info.innerText = 'Après ouverture : -';
    capital_after_info.style.color = 'var(--accent)';
  }
}

t_tp.addEventListener('input',updateRRPreview);
t_sl.addEventListener('input',updateRRPreview);
t_token.addEventListener('change',updateRRPreview);
t_side.addEventListener('change',updateRRPreview);

/* SIZE SYNC */
const portfolioInput=document.getElementById('portfolioInput');
const t_size=document.getElementById('t_size');
const t_size_pct=document.getElementById('t_size_pct');

// Add event listeners AFTER variables are defined
t_size.addEventListener('input',updateRRPreview);
t_size_pct.addEventListener('input',updateRRPreview);

function syncSizePctToDollar(){
  // Use current capital (initial + PnL) instead of static input value
  const pnl = computeTotalPnL();
  const currentCap = (initialCapital !== null ? initialCapital : parseFloat(portfolioInput.value)) + pnl;
  const pct = parseFloat(t_size_pct.value);
  if(!isFinite(currentCap)||!isFinite(pct)){ t_size.value="";return; }
  t_size.value=((pct/100)*currentCap).toFixed(2);
}

function syncSizeDollarToPct(){
  // Use current capital (initial + PnL) for consistency
  const pnl = computeTotalPnL();
  const currentCap = (initialCapital !== null ? initialCapital : parseFloat(portfolioInput.value)) + pnl;
  const dollars=parseFloat(t_size.value);
  if(!isFinite(currentCap)||!isFinite(dollars)){ t_size_pct.value="";return; }
  t_size_pct.value=((dollars/currentCap)*100).toFixed(2);
}

t_size_pct.addEventListener('input',syncSizePctToDollar);
t_size.addEventListener('input',syncSizeDollarToPct);
portfolioInput.addEventListener('input',()=>{
  if(t_size_pct.value) syncSizePctToDollar();
  saveState();
  updateDashboard();
});

/* LIMIT ORDER TOGGLE */
const t_limit_order = document.getElementById('t_limit_order');
const t_limit_price = document.getElementById('t_limit_price');
const openBtn = document.getElementById('openBtn');

t_limit_order.addEventListener('change', () => {
  if(t_limit_order.checked){
    t_limit_price.style.display = 'block';
    openBtn.innerText = 'Placer l\'ordre';
  } else {
    t_limit_price.style.display = 'none';
    t_limit_price.value = '';
    openBtn.innerText = 'Ouvrir';
  }
  updateRRPreview();
});

// Validate limit price when typing
t_limit_price.addEventListener('input', updateRRPreview);

/* TRADING ENGINE */
let openTrades=[];
let history=[];
let pendingOrders=[]; // Limit orders waiting for execution
let initialCapital=null; // Track starting capital

/* PERSISTENCE */
function saveState(){
  localStorage.setItem('openTrades', JSON.stringify(openTrades));
  localStorage.setItem('history', JSON.stringify(history));
  localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
  localStorage.setItem('capital', portfolioInput.value);
  if (initialCapital !== null) {
    localStorage.setItem('initialCapital', initialCapital);
  }
}

function loadState(){
  try {
    const savedOpen = localStorage.getItem('openTrades');
    const savedHistory = localStorage.getItem('history');
    const savedPending = localStorage.getItem('pendingOrders');
    const savedCapital = localStorage.getItem('capital');
    const savedInitialCapital = localStorage.getItem('initialCapital');

    if (savedOpen) openTrades = JSON.parse(savedOpen);
    if (savedHistory) history = JSON.parse(savedHistory);
    if (savedPending) pendingOrders = JSON.parse(savedPending);
    if (savedCapital) portfolioInput.value = savedCapital;
    if (savedInitialCapital) initialCapital = parseFloat(savedInitialCapital);
  } catch(e) {
    console.error('Error loading state:', e);
  }
}

/* TAGS & TEMPLATES SYSTEM */
let customTags = [];
let customTemplates = [];
let selectedTags = []; // Tags sélectionnés pour le trade en cours

// Format tags as HTML badges
function formatTagsBadges(tagIds){
  if(!tagIds || tagIds.length === 0) return '-';

  return tagIds.map(tagId => {
    const tag = customTags.find(t => t.id === tagId);
    if(!tag) return '';
    return `<span class="tag-badge">${tag.emoji} ${tag.name}</span>`;
  }).join(' ');
}

// Initialize default tags and templates
function initializeTagsAndTemplates(){
  const savedTags = localStorage.getItem('customTags');
  const savedTemplates = localStorage.getItem('customTemplates');

  if(savedTags){
    customTags = JSON.parse(savedTags);
  } else {
    // Default tags
    customTags = [
      {id: 1, name: 'Scalp', emoji: '🎯'},
      {id: 2, name: 'Swing', emoji: '📈'},
      {id: 3, name: 'Breakout', emoji: '⚡'},
      {id: 4, name: 'News', emoji: '📰'},
      {id: 5, name: 'Reversal', emoji: '🔄'},
      {id: 6, name: 'Pattern', emoji: '📊'}
    ];
    localStorage.setItem('customTags', JSON.stringify(customTags));
  }

  if(savedTemplates){
    customTemplates = JSON.parse(savedTemplates);
  } else {
    // Default templates
    customTemplates = [
      {id: 1, name: 'Setup technique', emoji: '📈', content: 'Setup : \nCatalyseur : \nNiveau clé : \nInvalidation : '},
      {id: 2, name: 'État mental', emoji: '💭', content: 'État émotionnel : \nConfiance (1-10) : \nRespect du plan : '},
      {id: 3, name: 'Objectif du trade', emoji: '🎯', content: 'Objectif principal : \nTimeframe : \nTaille de position : '}
    ];
    localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
  }
}

function saveTagsAndTemplates(){
  localStorage.setItem('customTags', JSON.stringify(customTags));
  localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
}

/* OBJECTIVES SYSTEM */
let objectives = [];

// Initialize default objectives
function initializeObjectives(){
  const savedObjectives = localStorage.getItem('objectives');

  if(savedObjectives){
    objectives = JSON.parse(savedObjectives);
  } else {
    // Default objectives (global, no time period)
    objectives = [
      {id: 1, name: 'Premier trade', emoji: '🎯', type: 'trades', target: 1, active: true},
      {id: 2, name: 'Première note journal', emoji: '📝', type: 'journal', target: 1, active: true},
      {id: 3, name: 'Break even', emoji: '💰', type: 'capital', target: 0, active: true},
      {id: 4, name: '10 trades réalisés', emoji: '🔥', type: 'trades', target: 10, active: true},
      {id: 5, name: 'Winrate 55%', emoji: '📈', type: 'winrate', target: 55, active: true},
      {id: 6, name: '+5% de capital', emoji: '💵', type: 'capital', target: 5, active: true},
      {id: 7, name: '10 trades avec journal', emoji: '📓', type: 'journal', target: 10, active: true},
      {id: 8, name: '100 trades réalisés', emoji: '💯', type: 'trades', target: 100, active: true},
      {id: 9, name: 'Winrate 60%', emoji: '📊', type: 'winrate', target: 60, active: true},
      {id: 10, name: '+20% de capital', emoji: '💸', type: 'capital', target: 20, active: true},
      {id: 11, name: '5 trades gagnants consécutifs', emoji: '🏆', type: 'streak', target: 5, active: true},
      {id: 12, name: '50 trades avec journal', emoji: '📚', type: 'journal', target: 50, active: true}
    ];
    localStorage.setItem('objectives', JSON.stringify(objectives));
  }
}

function saveObjectives(){
  localStorage.setItem('objectives', JSON.stringify(objectives));
}

// Calculate progress for an objective
function calculateObjectiveProgress(obj){
  let current = 0;
  let target = obj.target;

  switch(obj.type){
    case 'trades':
      current = history.length;
      break;

    case 'winrate':
      if(history.length > 0){
        const wins = history.filter(h => h.pnl > 0).length;
        current = (wins / history.length) * 100;
      }
      break;

    case 'capital':
      if(initialCapital && initialCapital > 0){
        const currentCapital = parseFloat(portfolioInput.value);
        current = ((currentCapital - initialCapital) / initialCapital) * 100;
      }
      break;

    case 'journal':
      current = history.filter(h => h.hasJournal).length;
      break;

    case 'streak':
      // Calculate longest winning streak
      let maxStreak = 0;
      let currentStreak = 0;
      history.forEach(h => {
        if(h.pnl > 0){
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
      current = maxStreak;
      break;
  }

  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const completed = current >= target;

  return {current, target, percentage, completed};
}

// Render objectives in settings
function renderObjectivesSettings(){
  const container = document.getElementById('objectivesListSettings');
  if(!container) return;

  container.innerHTML = '';

  objectives.forEach(obj => {
    const item = document.createElement('div');
    item.className = 'settings-item';
    item.innerHTML = `
      <div class="emoji-picker" data-obj-id="${obj.id}">${obj.emoji}</div>
      <div style="flex:1">
        <input type="text" value="${obj.name}" data-obj-id="${obj.id}" placeholder="Nom" style="margin-bottom:4px;width:100%">
        <div style="display:flex;gap:8px">
          <select data-obj-id="${obj.id}" data-field="type" style="flex:1;padding:4px;font-size:13px">
            <option value="trades" ${obj.type === 'trades' ? 'selected' : ''}>Trades</option>
            <option value="winrate" ${obj.type === 'winrate' ? 'selected' : ''}>Winrate</option>
            <option value="capital" ${obj.type === 'capital' ? 'selected' : ''}>Capital</option>
            <option value="journal" ${obj.type === 'journal' ? 'selected' : ''}>Journal</option>
            <option value="streak" ${obj.type === 'streak' ? 'selected' : ''}>Streak</option>
          </select>
          <input type="number" value="${obj.target}" data-obj-id="${obj.id}" data-field="target" placeholder="Cible" style="width:80px;padding:4px;font-size:13px">
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
        <input type="checkbox" ${obj.active ? 'checked' : ''} data-obj-id="${obj.id}" data-field="active">
        <span style="font-size:12px">Actif</span>
      </label>
      <button class="delete-btn" data-obj-id="${obj.id}">🗑️</button>
    `;
    container.appendChild(item);
  });

  // Event listeners for emoji picker
  container.querySelectorAll('.emoji-picker').forEach(picker => {
    picker.addEventListener('click', () => {
      const objId = parseInt(picker.dataset.objId);
      const newEmoji = prompt('Entrez un emoji :', picker.innerText);
      if(newEmoji && newEmoji.trim()){
        const obj = objectives.find(o => o.id === objId);
        if(obj){
          obj.emoji = newEmoji.trim();
          saveObjectives();
          renderObjectivesSettings();
        }
      }
    });
  });

  // Event listeners for name input
  container.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener('change', () => {
      const objId = parseInt(input.dataset.objId);
      const obj = objectives.find(o => o.id === objId);
      if(obj){
        obj.name = input.value;
        saveObjectives();
      }
    });
  });

  // Event listeners for type and target
  container.querySelectorAll('select, input[type="number"], input[type="checkbox"]').forEach(el => {
    el.addEventListener('change', () => {
      const objId = parseInt(el.dataset.objId);
      const field = el.dataset.field;
      const obj = objectives.find(o => o.id === objId);
      if(obj && field){
        if(field === 'active'){
          obj[field] = el.checked;
        } else if(field === 'target'){
          obj[field] = parseFloat(el.value);
        } else {
          obj[field] = el.value;
        }
        saveObjectives();
        renderObjectivesWidget(); // Update widget
      }
    });
  });

  // Event listeners for delete button
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const objId = parseInt(btn.dataset.objId);
      if(confirm('Supprimer cet objectif ?')){
        objectives = objectives.filter(o => o.id !== objId);
        saveObjectives();
        renderObjectivesSettings();
        renderObjectivesWidget();
      }
    });
  });
}

// Render objectives widget in dashboard
function renderObjectivesWidget(){
  const container = document.getElementById('objectivesWidget');
  if(!container) return;

  const activeObjectives = objectives.filter(o => o.active);

  // Sort by completion (incomplete first, then by percentage)
  const sorted = activeObjectives.map(obj => {
    const progress = calculateObjectiveProgress(obj);
    return {...obj, ...progress};
  }).sort((a, b) => {
    if(a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.percentage - a.percentage;
  });

  // Display all active objectives
  const displayed = sorted;

  if(displayed.length === 0){
    container.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px">Aucun objectif actif</div>';
    return;
  }

  container.innerHTML = displayed.map(obj => {
    const barColor = obj.completed ? '#22c55e' :
                     obj.percentage >= 80 ? '#86efac' :
                     obj.percentage >= 50 ? '#fb923c' : '#ef4444';

    const statusText = obj.completed ? '✅ Atteint !' :
                       obj.percentage >= 80 ? 'Presque !' :
                       obj.percentage >= 50 ? 'Continue !' : 'Bon début';

    const currentDisplay = obj.type === 'winrate' || obj.type === 'capital' ?
                          `${obj.current.toFixed(1)}%` :
                          Math.floor(obj.current);

    const targetDisplay = obj.type === 'winrate' || obj.type === 'capital' ?
                         `${obj.target}%` :
                         obj.target;

    return `
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-size:14px;font-weight:600">${obj.emoji} ${obj.name}</div>
          <div style="font-size:12px;color:var(--muted)">${Math.floor(obj.percentage)}%</div>
        </div>
        <div style="background:rgba(255,255,255,0.05);height:8px;border-radius:4px;overflow:hidden;margin-bottom:4px">
          <div style="background:${barColor};height:100%;width:${obj.percentage}%;transition:width 0.3s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px">
          <span style="color:var(--muted)">${currentDisplay} / ${targetDisplay}</span>
          <span style="color:${barColor};font-weight:600">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Render tags in settings
function renderTagsSettings(){
  const container = document.getElementById('tagsListSettings');
  container.innerHTML = '';

  customTags.forEach(tag => {
    const item = document.createElement('div');
    item.className = 'settings-item';
    item.innerHTML = `
      <div class="emoji-picker" data-tag-id="${tag.id}">${tag.emoji}</div>
      <input type="text" value="${tag.name}" data-tag-id="${tag.id}" placeholder="Nom du tag">
      <button class="delete-btn" data-tag-id="${tag.id}">🗑️</button>
    `;
    container.appendChild(item);
  });

  // Event listeners for emoji picker
  container.querySelectorAll('.emoji-picker').forEach(picker => {
    picker.addEventListener('click', () => {
      const tagId = parseInt(picker.dataset.tagId);
      const newEmoji = prompt('Entrez un emoji :', picker.innerText);
      if(newEmoji && newEmoji.trim()){
        const tag = customTags.find(t => t.id === tagId);
        if(tag){
          tag.emoji = newEmoji.trim();
          saveTagsAndTemplates();
          renderTagsSettings();
        }
      }
    });
  });

  // Event listeners for name input
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      const tagId = parseInt(input.dataset.tagId);
      const tag = customTags.find(t => t.id === tagId);
      if(tag){
        tag.name = input.value;
        saveTagsAndTemplates();
      }
    });
  });

  // Event listeners for delete button
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tagId = parseInt(btn.dataset.tagId);
      if(confirm('Supprimer ce tag ?')){
        customTags = customTags.filter(t => t.id !== tagId);
        saveTagsAndTemplates();
        renderTagsSettings();
      }
    });
  });
}

// Render templates in settings
function renderTemplatesSettings(){
  const container = document.getElementById('templatesListSettings');
  container.innerHTML = '';

  customTemplates.forEach(template => {
    const item = document.createElement('div');
    item.className = 'settings-item';
    item.style.alignItems = 'flex-start';
    item.innerHTML = `
      <div class="emoji-picker" data-template-id="${template.id}" style="margin-top:6px">${template.emoji}</div>
      <div style="flex:1">
        <input type="text" value="${template.name}" data-template-id="${template.id}" placeholder="Nom du template" style="margin-bottom:6px;width:100%">
        <textarea data-template-id="${template.id}" placeholder="Contenu du template">${template.content}</textarea>
      </div>
      <button class="delete-btn" data-template-id="${template.id}" style="margin-top:6px">🗑️</button>
    `;
    container.appendChild(item);
  });

  // Event listeners for emoji picker
  container.querySelectorAll('.emoji-picker').forEach(picker => {
    picker.addEventListener('click', () => {
      const templateId = parseInt(picker.dataset.templateId);
      const newEmoji = prompt('Entrez un emoji :', picker.innerText);
      if(newEmoji && newEmoji.trim()){
        const template = customTemplates.find(t => t.id === templateId);
        if(template){
          template.emoji = newEmoji.trim();
          saveTagsAndTemplates();
          renderTemplatesSettings();
        }
      }
    });
  });

  // Event listeners for name input
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      const templateId = parseInt(input.dataset.templateId);
      const template = customTemplates.find(t => t.id === templateId);
      if(template){
        template.name = input.value;
        saveTagsAndTemplates();
      }
    });
  });

  // Event listeners for content textarea
  container.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('change', () => {
      const templateId = parseInt(textarea.dataset.templateId);
      const template = customTemplates.find(t => t.id === templateId);
      if(template){
        template.content = textarea.value;
        saveTagsAndTemplates();
      }
    });
  });

  // Event listeners for delete button
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const templateId = parseInt(btn.dataset.templateId);
      if(confirm('Supprimer ce template ?')){
        customTemplates = customTemplates.filter(t => t.id !== templateId);
        saveTagsAndTemplates();
        renderTemplatesSettings();
      }
    });
  });
}

// Render tags selector in journal modal
function renderJournalTagsSelector(existingTags = []){
  const container = document.getElementById('journalTagsSelector');
  if(!container) return;

  container.innerHTML = '';
  selectedTags = existingTags || [];

  customTags.forEach(tag => {
    const isSelected = selectedTags.includes(tag.id);
    const badge = document.createElement('div');
    badge.className = 'tag-badge';
    badge.style.cursor = 'pointer';
    badge.style.opacity = isSelected ? '1' : '0.5';
    badge.style.border = isSelected ? '2px solid var(--accent)' : '1px solid rgba(59,130,246,0.2)';
    badge.textContent = `${tag.emoji} ${tag.name}`;
    badge.dataset.tagId = tag.id;

    badge.addEventListener('click', () => {
      const tagId = parseInt(badge.dataset.tagId);
      const index = selectedTags.indexOf(tagId);

      if(index > -1){
        // Deselect
        selectedTags.splice(index, 1);
      } else {
        // Select (max 3)
        if(selectedTags.length < 3){
          selectedTags.push(tagId);
        } else {
          showToast('error', 'Limite de tags', 'Maximum 3 tags par trade');
          return;
        }
      }

      renderJournalTagsSelector(selectedTags);
    });

    container.appendChild(badge);
  });
}

// Render templates selector in journal modal
function renderJournalTemplatesSelector(){
  const container = document.getElementById('journalTemplatesSelector');
  if(!container) return;

  container.innerHTML = '';

  customTemplates.forEach(template => {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    label.style.marginBottom = '6px';
    label.style.cursor = 'pointer';
    label.style.padding = '6px';
    label.style.borderRadius = '6px';
    label.style.background = 'rgba(255,255,255,0.02)';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.templateId = template.id;

    checkbox.addEventListener('change', () => {
      const noteTextarea = document.getElementById('journal_note');
      if(checkbox.checked){
        // Add template content to note
        const currentNote = noteTextarea.value;
        const separator = currentNote.trim() ? '\n\n' : '';
        noteTextarea.value = currentNote + separator + template.content;
      } else {
        // Remove template content from note
        const currentNote = noteTextarea.value;
        noteTextarea.value = currentNote.replace(template.content, '').replace(/\n\n\n+/g, '\n\n').trim();
      }
    });

    const text = document.createTextNode(`${template.emoji} ${template.name}`);

    label.appendChild(checkbox);
    label.appendChild(text);
    container.appendChild(label);
  });
}

// Add new tag
document.addEventListener('DOMContentLoaded', () => {
  const addTagBtn = document.getElementById('addTagBtn');
  if(addTagBtn){
    addTagBtn.addEventListener('click', () => {
      const newId = customTags.length > 0 ? Math.max(...customTags.map(t => t.id)) + 1 : 1;
      customTags.push({id: newId, name: 'Nouveau tag', emoji: '🏷️'});
      saveTagsAndTemplates();
      renderTagsSettings();
    });
  }

  // Add new template
  const addTemplateBtn = document.getElementById('addTemplateBtn');
  if(addTemplateBtn){
    addTemplateBtn.addEventListener('click', () => {
      const newId = customTemplates.length > 0 ? Math.max(...customTemplates.map(t => t.id)) + 1 : 1;
      customTemplates.push({id: newId, name: 'Nouveau template', emoji: '📋', content: ''});
      saveTagsAndTemplates();
      renderTemplatesSettings();
    });
  }

  // Add new objective
  const addObjectiveBtn = document.getElementById('addObjectiveBtn');
  if(addObjectiveBtn){
    addObjectiveBtn.addEventListener('click', () => {
      const newId = objectives.length > 0 ? Math.max(...objectives.map(o => o.id)) + 1 : 1;
      objectives.push({id: newId, name: 'Nouvel objectif', emoji: '🎯', type: 'trades', target: 10, active: true});
      saveObjectives();
      renderObjectivesSettings();
    });
  }
});

/* MODAL */
const modalBackdrop=document.getElementById('confirmModalBackdrop');
const modalCancel=document.getElementById('modalCancel');
const modalConfirm=document.getElementById('modalConfirm');

const m_entry=document.getElementById('m_entry');
const m_tp_price=document.getElementById('m_tp_price');
const m_tp_var=document.getElementById('m_tp_var');
const m_tp_gain=document.getElementById('m_tp_gain');
const m_sl_price=document.getElementById('m_sl_price');
const m_sl_var=document.getElementById('m_sl_var');
const m_sl_loss=document.getElementById('m_sl_loss');
const m_rr=document.getElementById('m_rr');

let modalState={ token:null,side:null,size:0,tp:null,sl:null };
let modalRefreshInterval=null;

document.getElementById('openBtn').addEventListener('click',()=>{
  const token=t_token.value;
  const side=t_side.value;
  const size=parseFloat(t_size.value);
  const tp=parseFloat(t_tp.value);
  const sl=parseFloat(t_sl.value);
  const isLimitOrder = t_limit_order.checked;
  const limitPrice = parseFloat(t_limit_price.value);

  if(!isFinite(prices[token])){
    showToast('error', 'Prix indisponible', 'Impossible de récupérer le prix actuel');
    return;
  }
  if(!isFinite(size)||size<=0){
    showToast('error', 'Taille invalide', 'Veuillez indiquer un montant valide', `Entrez la taille en $ ou en %`);
    markFieldError('t_size');
    return;
  }

  // Check available capital
  const availableCapital = getAvailableCapital();
  if(size > availableCapital){
    showToast('error', 'Capital insuffisant', `Disponible : $${availableCapital.toFixed(2)}`, `Demandé : $${size.toFixed(2)}`);
    markFieldError('t_size');
    return;
  }

  // LIMIT ORDER
  if(isLimitOrder){
    if(!isFinite(limitPrice)||limitPrice<=0){
      showToast('error', 'Prix invalide', 'Veuillez entrer un prix d\'entrée valide');
      markFieldError('t_limit_price');
      return;
    }

    // Create pending order
    pendingOrders.push({
      token,
      side,
      size,
      limitPrice,
      tp: isFinite(tp) ? tp : null,
      sl: isFinite(sl) ? sl : null,
      createTime: Date.now()
    });

    saveState();
    renderPendingOrders();
    showToast('info', 'Ordre placé', `${side} ${token.replace('USDT','')}`, `Entrée @ $${limitPrice.toFixed(2)}`);

    // Open journal modal for pending order
    const orderIndex = pendingOrders.length - 1;
    openJournalModalForPendingOrder(orderIndex);

    // Reset form
    t_limit_order.checked = false;
    t_limit_price.style.display = 'none';
    t_limit_price.value = '';
    t_size.value = '';
    t_size_pct.value = '';
    t_tp.value = '';
    t_sl.value = '';
    openBtn.innerText = 'Ouvrir';

    return;
  }

  // NORMAL TRADE
  modalState={ token,side,size,tp:isFinite(tp)?tp:null,sl:isFinite(sl)?sl:null };

  modalBackdrop.style.display="flex";

  refreshModalPrice();
  clearInterval(modalRefreshInterval);
  modalRefreshInterval=setInterval(refreshModalPrice,1000);
});

modalCancel.addEventListener('click',()=>{
  modalBackdrop.style.display="none";
  clearInterval(modalRefreshInterval);
});

/* MODAL REFRESH */
function refreshModalPrice(){
  const token=modalState.token;
  const side=modalState.side;
  if(!token) return;

  const live=prices[token];
  if(!isFinite(live)) return;

  m_entry.innerText="$"+live.toFixed(2);

  const qty=modalState.size/live;
  const entryFee = 0; // just for preview, the real fee is computed on confirm

  const tp=modalState.tp, sl=modalState.sl;

  if(tp !== null && isFinite(tp)){
    const tpVar=side==="LONG"
      ? (tp-live)/live*100
      : (live-tp)/live*100;

    const tpGross=side==="LONG"
      ? (tp-live)*qty
      : (live-tp)*qty;

    const tpNet=tpGross-entryFee-((tp*qty)*TAKER_FEE);

    m_tp_price.innerText="$"+tp.toFixed(2);
    m_tp_var.innerText=(tpVar>=0?"+":"")+tpVar.toFixed(2)+"%";
    m_tp_gain.innerText=(tpNet>=0?"+":"") + "$" + tpNet.toFixed(2);

    m_tp_var.classList.toggle("pnl-pos",tpVar>=0);
    m_tp_var.classList.toggle("pnl-neg",tpVar<0);
    m_tp_gain.classList.toggle("pnl-pos",tpNet>=0);
    m_tp_gain.classList.toggle("pnl-neg",tpNet<0);
  } else {
    m_tp_price.innerText="-";
    m_tp_var.innerText="-";
    m_tp_gain.innerText="-";
  }

  if(sl !== null && isFinite(sl)){
    const slVar=side==="LONG"
      ? (sl-live)/live*100
      : (live-sl)/live*100;

    const slGross=side==="LONG"
      ? (sl-live)*qty
      : (live-sl)*qty;

    const slNet=slGross-entryFee-((sl*qty)*TAKER_FEE);

    m_sl_price.innerText="$"+sl.toFixed(2);
    m_sl_var.innerText=(slVar>=0?"+":"")+slVar.toFixed(2)+"%";
    m_sl_loss.innerText=(slNet>=0?"+":"") + "$" + slNet.toFixed(2);

    m_sl_var.classList.toggle("pnl-pos",slVar>=0);
    m_sl_var.classList.toggle("pnl-neg",slVar<0);
    m_sl_loss.classList.toggle("pnl-pos",slNet>=0);
    m_sl_loss.classList.toggle("pnl-neg",slNet<0);
  } else {
    m_sl_price.innerText="-";
    m_sl_var.innerText="-";
    m_sl_loss.innerText="-";
  }

  const rr=(tp !== null && isFinite(tp) && sl !== null && isFinite(sl))
    ? computeRR_for_side(side,live,tp,sl)
    : "-";
  m_rr.innerText=rr;
}

/* CONFIRM TRADE */
modalConfirm.addEventListener('click',()=>{
  const token=modalState.token;
  const side=modalState.side;
  const size=modalState.size;
  const tp=modalState.tp;
  const sl=modalState.sl;

  const entry=prices[token];
  if(!isFinite(entry)){
    showToast('error', 'Prix indisponible', 'Impossible de récupérer le prix actuel');
    return;
  }

  const qty=size/entry;
  const entryFee=(entry*qty)*TAKER_FEE;

console.log("DEBUG SIZE =", size, "ENTRY =", entry, "QTY =", qty, "FEES ENTRY =", entryFee);
  openTrades.push({
    token,side,size,entry,qty,tp,sl,
    entryFee,openTime:Date.now()
  });

  modalBackdrop.style.display="none";
  clearInterval(modalRefreshInterval);

  saveState();
  renderOpenTrades();
  updateDashboard();

  // Show toast notification
  const tokenName = token.replace('USDT', '');
  showToast('info', 'Trade ouvert', `${side} ${tokenName}`, `$${size.toFixed(2)} @ $${entry.toFixed(2)}`);

  // Open journal modal immediately after
  const tradeIndex = openTrades.length - 1;
  openJournalModal(tradeIndex);
});

/* ---- CLOSE TRADE (MODIFIÉ) ---- */
function closeTrade(i, reason = 'MANUAL'){
  const t = openTrades[i];
  const price = prices[t.token];
  if (!isFinite(price)) {
    if (reason === 'MANUAL') showToast('error', 'Prix indisponible', 'Impossible de fermer le trade pour le moment');
    return false;
  }

  // GAIN / PERTE brut
  const gross = (t.side === "LONG")
    ? (price - t.entry) * t.qty
    : (t.entry - price) * t.qty;

  // EXIT FEE = 0.10% du montant de la position au moment de la fermeture
  // ❗ Calcul réel Binance
  const exitValue = price * t.qty;
  const exitFee = exitValue * TAKER_FEE;

  // PnL net
  const pnlNet = gross - t.entryFee - exitFee;
  const percent = (pnlNet / t.size) * 100;
  const closeTime = Date.now();
  const duration = Math.floor((closeTime - t.openTime) / 1000);

  history.push({
    ...t,
    exit: price,
    closeTime: closeTime,
    pnl: pnlNet,
    percent,
    duration,
    exitFee,
    closedReason: reason
  });

  openTrades.splice(i, 1);
  saveState();
  renderOpenTrades();
  renderHistory();
  renderJournal();
  updateDashboard();
  updateTradeCount();

  // Add trade marker for equity chart
  const currentEquity = parseFloat(portfolioInput.value);
  addTradeMarker(closeTime, currentEquity, {
    pnl: pnlNet,
    token: t.token,
    side: t.side,
    entry: t.entry,
    exit: price
  });

  // Show toast notification
  const tokenName = t.token.replace('USDT', '');
  const pnlStr = (pnlNet >= 0 ? '+' : '') + '$' + pnlNet.toFixed(2);
  const pctStr = (percent >= 0 ? '+' : '') + percent.toFixed(2) + '%';

  if(reason === 'TP'){
    showToast('success', 'TP Touché !', `${t.side} ${tokenName}`, `${pnlStr} (${pctStr})`);
  } else if(reason === 'SL'){
    showToast('error', 'SL Touché', `${t.side} ${tokenName}`, `${pnlStr} (${pctStr})`);
  } else {
    showToast('info', 'Trade fermé', `${t.side} ${tokenName}`, `${pnlStr} (${pctStr})`);
  }

  return true;
}

window.closeTrade=closeTrade;

// Close trade with confirmation (manual close)
function closeTradeWithConfirm(index){
  const t = openTrades[index];
  const tokenName = t.token.replace('USDT', '');

  confirmAction(
    '⚠️ Fermer le trade',
    `Êtes-vous sûr de vouloir fermer le trade ${t.side} ${tokenName} ?`,
    () => {
      closeTrade(index, 'MANUAL');
    },
    { index } // Pass trade data for dynamic refresh
  );
}

window.closeTradeWithConfirm = closeTradeWithConfirm;

/* ---- INPUT ERROR FEEDBACK ---- */
function markFieldError(fieldId){
  const field = document.getElementById(fieldId);
  if(!field) return;

  field.classList.add('input-error');

  // Remove error class after animation (3 seconds)
  setTimeout(() => {
    field.classList.remove('input-error');
  }, 3000);
}

/* ---- TOAST NOTIFICATIONS ---- */
function showToast(type, title, message, details){
  const container = document.getElementById('toastContainer');

  // Limit to 3 toasts max
  while(container.children.length >= 3){
    container.removeChild(container.firstChild);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '🎯',
    error: '⚠️',
    info: '✅'
  };

  toast.innerHTML = `
    <div class="toast-title">${icons[type] || '📊'} ${title}</div>
    <div class="toast-message">${message}</div>
    ${details ? `<div class="toast-details">${details}</div>` : ''}
  `;

  // Click to dismiss
  toast.addEventListener('click', () => {
    toast.classList.add('toast-closing');
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    if(toast.parentElement){
      toast.classList.add('toast-closing');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/* ---- JOURNAL SYSTEM ---- */
let currentJournalTradeIndex = null;
let journalImages = [];
let expandedJournalCards = new Set(); // Track which cards are expanded
const MAX_JOURNAL_IMAGES = 3;

// Open journal modal
function openJournalModal(tradeIndex){
  currentJournalTradeIndex = tradeIndex;
  journalImages = [];

  const t = openTrades[tradeIndex];

  // Update modal info
  const tokenName = t.token.replace('USDT', '');
  document.getElementById('journal_trade_info').innerText = `${tokenName} ${t.side} • $${t.entry.toFixed(2)}`;
  document.getElementById('journal_tp').innerText = (t.tp !== null && isFinite(t.tp)) ? `$${t.tp.toFixed(2)}` : '-';
  document.getElementById('journal_sl').innerText = (t.sl !== null && isFinite(t.sl)) ? `$${t.sl.toFixed(2)}` : '-';

  // Clear inputs
  document.getElementById('journal_note').value = '';
  document.getElementById('imagePreviews').innerHTML = '';

  // Render tags and templates selectors
  renderJournalTagsSelector([]);
  renderJournalTemplatesSelector();

  // Show modal
  document.getElementById('journalModalBackdrop').style.display = 'flex';
}

// Open journal modal for pending order
function openJournalModalForPendingOrder(orderIndex){
  currentJournalTradeIndex = -1 - orderIndex; // Negative index for pending orders
  journalImages = [];

  const order = pendingOrders[orderIndex];

  // Update modal info
  const tokenName = order.token.replace('USDT', '');
  document.getElementById('journal_trade_info').innerText = `${tokenName} ${order.side} • Limite @ $${order.limitPrice.toFixed(2)}`;
  document.getElementById('journal_tp').innerText = (order.tp !== null && isFinite(order.tp)) ? `$${order.tp.toFixed(2)}` : '-';
  document.getElementById('journal_sl').innerText = (order.sl !== null && isFinite(order.sl)) ? `$${order.sl.toFixed(2)}` : '-';

  // Clear inputs
  document.getElementById('journal_note').value = '';
  document.getElementById('imagePreviews').innerHTML = '';

  // Render tags and templates selectors
  renderJournalTagsSelector([]);
  renderJournalTemplatesSelector();

  // Show modal
  document.getElementById('journalModalBackdrop').style.display = 'flex';
}

window.openJournalModal = openJournalModal;
window.openJournalModalForPendingOrder = openJournalModalForPendingOrder;

// Open journal modal for existing trade/order/history (add/edit notes)
function openJournalModalForExisting(type, index){
  let item;
  let tokenName, infoText, tp, sl;

  if(type === 'open'){
    // Open trade
    item = openTrades[index];
    currentJournalTradeIndex = index;
    tokenName = item.token.replace('USDT', '');
    infoText = `${tokenName} ${item.side} • $${item.entry.toFixed(2)}`;
    tp = item.tp;
    sl = item.sl;
  } else if(type === 'pending'){
    // Pending order
    item = pendingOrders[index];
    currentJournalTradeIndex = -1 - index; // Negative index for pending
    tokenName = item.token.replace('USDT', '');
    infoText = `${tokenName} ${item.side} • Limite @ $${item.limitPrice.toFixed(2)}`;
    tp = item.tp;
    sl = item.sl;
  } else if(type === 'history'){
    // Closed trade
    item = history[index];
    currentJournalTradeIndex = -10000 - index; // Large negative offset for history
    tokenName = item.token.replace('USDT', '');
    infoText = `${tokenName} ${item.side} • $${item.entry.toFixed(2)} → $${item.exit.toFixed(2)}`;
    tp = item.tp;
    sl = item.sl;
  }

  // Update modal info
  document.getElementById('journal_trade_info').innerText = infoText;
  document.getElementById('journal_tp').innerText = (tp !== null && isFinite(tp)) ? `$${tp.toFixed(2)}` : '-';
  document.getElementById('journal_sl').innerText = (sl !== null && isFinite(sl)) ? `$${sl.toFixed(2)}` : '-';

  // Pre-fill with existing data if available
  document.getElementById('journal_note').value = item.journalNote || '';

  // Pre-fill images
  journalImages = item.journalImages ? [...item.journalImages] : [];
  const previewContainer = document.getElementById('imagePreviews');
  previewContainer.innerHTML = '';

  journalImages.forEach((img, i) => {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'image-preview';
    imgDiv.innerHTML = `
      <img src="${img}" />
      <button class="remove-image" onclick="removeJournalImage(${i})">×</button>
    `;
    previewContainer.appendChild(imgDiv);
  });

  // Render tags and templates selectors (with existing tags if any)
  renderJournalTagsSelector(item.tags || []);
  renderJournalTemplatesSelector();

  // Show modal
  document.getElementById('journalModalBackdrop').style.display = 'flex';
}

window.openJournalModalForExisting = openJournalModalForExisting;

// Skip journal
document.getElementById('journalModalSkip').addEventListener('click', () => {
  document.getElementById('journalModalBackdrop').style.display = 'none';
  currentJournalTradeIndex = null;
  journalImages = [];
});

// Save journal
document.getElementById('journalModalSave').addEventListener('click', async () => {
  if(currentJournalTradeIndex === null) return;

  const note = document.getElementById('journal_note').value.trim();

  // Skip if no note and no images
  if(!note && journalImages.length === 0){
    showToast('error', 'Journal vide', 'Ajoutez au moins une note ou une image');
    return;
  }

  // Check type based on index
  if(currentJournalTradeIndex <= -10000){
    // History (closed trade)
    const historyIndex = -10000 - currentJournalTradeIndex;
    history[historyIndex].journalNote = note;
    history[historyIndex].journalImages = [...journalImages];
    history[historyIndex].tags = [...selectedTags];
    history[historyIndex].hasJournal = true;
  } else if(currentJournalTradeIndex < 0){
    // Pending order
    const orderIndex = -1 - currentJournalTradeIndex;
    pendingOrders[orderIndex].journalNote = note;
    pendingOrders[orderIndex].journalImages = [...journalImages];
    pendingOrders[orderIndex].tags = [...selectedTags];
    pendingOrders[orderIndex].hasJournal = true;
  } else {
    // Open trade
    openTrades[currentJournalTradeIndex].journalNote = note;
    openTrades[currentJournalTradeIndex].journalImages = [...journalImages];
    openTrades[currentJournalTradeIndex].tags = [...selectedTags];
    openTrades[currentJournalTradeIndex].hasJournal = true;
  }

  saveState();
  renderJournal();
  renderHistory(); // Update history table if modified

  // Close modal
  document.getElementById('journalModalBackdrop').style.display = 'none';
  currentJournalTradeIndex = null;
  journalImages = [];

  showToast('success', 'Journal mis à jour', 'Note enregistrée');
});

// Upload zone click
document.getElementById('uploadZone').addEventListener('click', () => {
  document.getElementById('journalImageInput').click();
});

// Handle file input
document.getElementById('journalImageInput').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  await processImages(files);
  e.target.value = ''; // Reset input
});

// Drag and drop
const uploadZone = document.getElementById('uploadZone');

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');

  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  await processImages(files);
});

// Process images
async function processImages(files){
  const remaining = MAX_JOURNAL_IMAGES - journalImages.length;
  if(remaining <= 0){
    showToast('error', 'Limite d\'images', `Maximum ${MAX_JOURNAL_IMAGES} images`);
    return;
  }

  const filesToProcess = files.slice(0, remaining);

  for(const file of filesToProcess){
    // Check file size (max 500KB)
    if(file.size > 500 * 1024){
      showToast('error', 'Image trop grande', `"${file.name}" dépasse 500KB`);
      continue;
    }

    try {
      const base64 = await encodeImageToBase64(file);
      journalImages.push(base64);
      renderImagePreviews();
    } catch(e){
      showToast('error', 'Erreur de chargement', `Impossible de charger "${file.name}"`);
    }
  }
}

// Encode image to base64
function encodeImageToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Render image previews
function renderImagePreviews(){
  const container = document.getElementById('imagePreviews');
  container.innerHTML = '';

  journalImages.forEach((img, i) => {
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.innerHTML = `
      <img src="${img}" alt="Preview ${i+1}" />
      <button class="image-preview-remove" onclick="removeJournalImage(${i})">×</button>
    `;
    container.appendChild(preview);
  });
}

function removeJournalImage(index){
  journalImages.splice(index, 1);
  renderImagePreviews();
}

window.removeJournalImage = removeJournalImage;

// Render journal
function renderJournal(){
  const container = document.getElementById('journalContainer');

  // Get filter
  const activeFilter = document.querySelector('.journal-filter.active');
  const filter = activeFilter ? activeFilter.dataset.journalFilter : 'all';

  // Combine pending orders, open and closed trades with journal
  const allTrades = [];

  // Add pending orders with journal
  pendingOrders.forEach((t, i) => {
    if(t.hasJournal){
      allTrades.push({...t, status: 'pending', index: i, openTime: t.createTime, entry: t.limitPrice});
    }
  });

  // Add open trades with journal
  openTrades.forEach((t, i) => {
    if(t.hasJournal){
      allTrades.push({...t, status: 'open', index: i});
    }
  });

  // Add closed trades with journal
  history.forEach((t, i) => {
    if(t.hasJournal){
      allTrades.push({...t, status: 'closed', index: i});
    }
  });

  // Sort by timestamp (most recent first)
  allTrades.sort((a, b) => (b.openTime || 0) - (a.openTime || 0));

  // Filter
  const filtered = allTrades.filter(t => {
    if(filter === 'pending') return t.status === 'pending';
    if(filter === 'open') return t.status === 'open';
    if(filter === 'closed') return t.status === 'closed';
    return true;
  });

  // Render
  if(filtered.length === 0){
    container.innerHTML = `
      <div class="journal-empty">
        <div class="journal-empty-icon">📖</div>
        <div style="font-size:16px;margin-bottom:8px">Aucun trade dans le journal</div>
        <div style="font-size:13px">Les trades avec notes apparaîtront ici</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const tokenName = t.token.replace('USDT', '');
    const statusClass = t.status === 'pending' ? 'pending' : t.status === 'open' ? 'open' : 'closed';
    const statusText = t.status === 'pending' ? 'En attente' : t.status === 'open' ? 'Ouvert' : 'Fermé';

    // Calculate display info based on status
    let pnlDisplay = '';
    if(t.status === 'pending'){
      // Show gap to limit price
      const currentPrice = prices[t.token] || t.entry;
      const gap = t.side === "LONG"
        ? ((t.entry - currentPrice) / currentPrice * 100)
        : ((currentPrice - t.entry) / currentPrice * 100);
      const gapClass = getPnLColorClass(gap);
      pnlDisplay = `<div class="journal-pnl ${gapClass}">Écart au prix d'entrée : ${gap >= 0 ? '+' : ''}${gap.toFixed(2)}%</div>`;
    } else if(t.status === 'open'){
      const price = prices[t.token] || t.entry;
      const gross = t.side === "LONG" ? (price - t.entry) * t.qty : (t.entry - price) * t.qty;
      const pnl = gross - (t.entryFee || 0);
      const perc = (pnl / t.size) * 100;
      const pnlClass = getPnLColorClass(perc);
      pnlDisplay = `<div class="journal-pnl ${pnlClass}">PnL actuel : ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${perc >= 0 ? '+' : ''}${perc.toFixed(2)}%)</div>`;
    } else {
      const pnlClass = getPnLColorClass(t.percent);
      const reasonBadge = t.closedReason ? `<span style="color:${t.closedReason === 'TP' ? 'var(--pos)' : t.closedReason === 'SL' ? 'var(--danger)' : 'var(--muted)'};font-size:11px;font-weight:700;margin-left:6px">[${t.closedReason}]</span>` : '';
      pnlDisplay = `<div class="journal-pnl ${pnlClass}">PnL final : ${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)} (${t.percent >= 0 ? '+' : ''}${t.percent.toFixed(2)}%)${reasonBadge}</div>`;
    }

    const timeAgo = formatTimeAgo(t.openTime);

    // Images
    const imagesHtml = (t.journalImages && t.journalImages.length > 0) ? `
      <div class="journal-images">
        ${t.journalImages.map(img => `<img src="${img}" class="journal-image-thumb" onclick="viewImage('${img.replace(/'/g, "\\'")}')"/>`).join('')}
      </div>
    ` : '';

    // Use openTime as stable unique ID
    const cardId = `journal-card-${t.openTime}`;
    const isExpanded = expandedJournalCards.has(cardId);
    const expandClass = isExpanded ? 'expanded' : '';
    const iconText = isExpanded ? '▼' : '▶';

    // Tags
    const tagsHTML = t.tags && t.tags.length > 0 ? `
      <div style="margin:8px 0">
        ${formatTagsBadges(t.tags)}
      </div>
    ` : '';

    return `
      <div class="journal-card">
        <div class="journal-card-header">
          <div class="journal-card-title">
            ${tokenName} ${t.side}
            <span class="journal-status ${statusClass}">${statusText}</span>
          </div>
          <div style="font-size:12px;color:var(--muted)">${timeAgo}</div>
        </div>

        ${tagsHTML}

        <div class="journal-meta">
          ${t.status === 'pending' ? `<div class="journal-meta-item">Prix d'entrée: <strong>$${t.entry.toFixed(2)}</strong></div>` : `<div class="journal-meta-item">Entry: <strong>$${t.entry.toFixed(2)}</strong></div>`}
          ${t.status === 'pending' ? `<div class="journal-meta-item">Actuel: <strong>$${(prices[t.token] || t.entry).toFixed(2)}</strong></div>` : ''}
          <div class="journal-meta-item">TP: <strong>${t.tp !== null && isFinite(t.tp) ? '$'+t.tp.toFixed(2) : '-'}</strong></div>
          <div class="journal-meta-item">SL: <strong>${t.sl !== null && isFinite(t.sl) ? '$'+t.sl.toFixed(2) : '-'}</strong></div>
          ${t.status === 'closed' ? `<div class="journal-meta-item">Exit: <strong>$${t.exit.toFixed(2)}</strong></div>` : ''}
        </div>

        <div class="journal-toggle" onclick="toggleJournalDetails('${cardId}')">
          <span id="${cardId}-icon">${iconText}</span>
          <span>Voir les détails</span>
        </div>

        <div class="journal-details ${expandClass}" id="${cardId}">
          ${t.journalNote ? `<div class="journal-note">${escapeHtml(t.journalNote)}</div>` : ''}
          ${imagesHtml}
        </div>

        ${pnlDisplay}
      </div>
    `;
  }).join('');
}

// Format time ago
function formatTimeAgo(timestamp){
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if(seconds < 60) return 'Il y a ' + seconds + 's';
  const minutes = Math.floor(seconds / 60);
  if(minutes < 60) return 'Il y a ' + minutes + 'min';
  const hours = Math.floor(minutes / 60);
  if(hours < 24) return 'Il y a ' + hours + 'h';
  const days = Math.floor(hours / 24);
  return 'Il y a ' + days + 'j';
}

// Escape HTML
function escapeHtml(text){
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Journal filters
document.querySelectorAll('.journal-filter').forEach(filter => {
  filter.addEventListener('click', () => {
    document.querySelectorAll('.journal-filter').forEach(f => f.classList.remove('active'));
    filter.classList.add('active');
    renderJournal();
  });
});

// Image viewer
function viewImage(src){
  document.getElementById('imageViewerImg').src = src;
  document.getElementById('imageViewerModal').classList.add('visible');
}

function closeImageViewer(){
  document.getElementById('imageViewerModal').classList.remove('visible');
}

window.viewImage = viewImage;
window.closeImageViewer = closeImageViewer;

// Toggle journal details
function toggleJournalDetails(cardId){
  const details = document.getElementById(cardId);
  const icon = document.getElementById(cardId + '-icon');

  if(details.classList.contains('expanded')){
    details.classList.remove('expanded');
    icon.innerText = '▶';
    expandedJournalCards.delete(cardId); // Remove from expanded set
  } else {
    details.classList.add('expanded');
    icon.innerText = '▼';
    expandedJournalCards.add(cardId); // Add to expanded set
  }
}

window.toggleJournalDetails = toggleJournalDetails;

/* ---- EDIT TRADE MODAL ---- */
const editTradeModalBackdrop = document.getElementById('editTradeModalBackdrop');
const editModalCancel = document.getElementById('editModalCancel');
const editModalConfirm = document.getElementById('editModalConfirm');
const edit_token_side = document.getElementById('edit_token_side');
const edit_entry_price = document.getElementById('edit_entry_price');
const edit_current_price = document.getElementById('edit_current_price');
const edit_current_var = document.getElementById('edit_current_var');
const edit_tp = document.getElementById('edit_tp');
const edit_sl = document.getElementById('edit_sl');
const edit_tp_info = document.getElementById('edit_tp_info');
const edit_tp_gain = document.getElementById('edit_tp_gain');
const edit_sl_info = document.getElementById('edit_sl_info');
const edit_sl_loss = document.getElementById('edit_sl_loss');
const edit_rr = document.getElementById('edit_rr');

let editTradeIndex = null;
let editModalRefreshInterval = null;

function openEditModal(index){
  editTradeIndex = index;
  const t = openTrades[index];

  edit_token_side.innerText = `${t.token.replace('USDT','')} ${t.side}`;
  edit_entry_price.innerText = "$" + t.entry.toFixed(2);

  // Pré-remplir les inputs avec les valeurs actuelles
  edit_tp.value = (t.tp !== null && isFinite(t.tp)) ? t.tp : "";
  edit_sl.value = (t.sl !== null && isFinite(t.sl)) ? t.sl : "";

  editTradeModalBackdrop.style.display = "flex";

  refreshEditModalPrice();
  clearInterval(editModalRefreshInterval);
  editModalRefreshInterval = setInterval(refreshEditModalPrice, 1000);
}

window.openEditModal = openEditModal;

editModalCancel.addEventListener('click', () => {
  editTradeModalBackdrop.style.display = "none";
  clearInterval(editModalRefreshInterval);
  editTradeIndex = null;
});

function refreshEditModalPrice(){
  if(editTradeIndex === null) return;

  const t = openTrades[editTradeIndex];
  const currentPrice = prices[t.token];

  if(!isFinite(currentPrice)) return;

  // Prix actuel et variation
  const varPercent = (t.side === "LONG")
    ? ((currentPrice - t.entry) / t.entry * 100)
    : ((t.entry - currentPrice) / t.entry * 100);

  edit_current_price.innerText = "$" + currentPrice.toFixed(2);
  edit_current_var.innerText = (varPercent >= 0 ? "+" : "") + varPercent.toFixed(2) + "%";
  edit_current_var.style.color = varPercent >= 0 ? "var(--pos)" : "var(--danger)";

  // Récupérer les nouvelles valeurs TP/SL
  const newTP = parseFloat(edit_tp.value);
  const newSL = parseFloat(edit_sl.value);

  // Calcul pour TP
  if(newTP !== null && isFinite(newTP)){
    const tpVar = (t.side === "LONG")
      ? ((newTP - currentPrice) / currentPrice * 100)
      : ((currentPrice - newTP) / currentPrice * 100);

    const tpGross = (t.side === "LONG")
      ? (newTP - currentPrice) * t.qty
      : (currentPrice - newTP) * t.qty;

    const tpNet = tpGross - ((newTP * t.qty) * TAKER_FEE);

    edit_tp_info.innerHTML = `• Variation : ${(tpVar >= 0 ? "+" : "") + tpVar.toFixed(2)}%`;
    edit_tp_gain.innerHTML = `• Gain net : ${(tpNet >= 0 ? "+" : "") + "$" + tpNet.toFixed(2)}`;
    edit_tp_info.style.color = tpVar >= 0 ? "var(--pos)" : "var(--danger)";
    edit_tp_gain.style.color = tpNet >= 0 ? "var(--pos)" : "var(--danger)";
  } else {
    edit_tp_info.innerHTML = "• Variation : -";
    edit_tp_gain.innerHTML = "• Gain net : -";
    edit_tp_info.style.color = "";
    edit_tp_gain.style.color = "";
  }

  // Calcul pour SL
  if(newSL !== null && isFinite(newSL)){
    const slVar = (t.side === "LONG")
      ? ((newSL - currentPrice) / currentPrice * 100)
      : ((currentPrice - newSL) / currentPrice * 100);

    const slGross = (t.side === "LONG")
      ? (newSL - currentPrice) * t.qty
      : (currentPrice - newSL) * t.qty;

    const slNet = slGross - ((newSL * t.qty) * TAKER_FEE);

    edit_sl_info.innerHTML = `• Variation : ${(slVar >= 0 ? "+" : "") + slVar.toFixed(2)}%`;
    edit_sl_loss.innerHTML = `• Perte nette : ${(slNet >= 0 ? "+" : "") + "$" + slNet.toFixed(2)}`;
    edit_sl_info.style.color = slVar >= 0 ? "var(--pos)" : "var(--danger)";
    edit_sl_loss.style.color = slNet >= 0 ? "var(--pos)" : "var(--danger)";
  } else {
    edit_sl_info.innerHTML = "• Variation : -";
    edit_sl_loss.innerHTML = "• Perte nette : -";
    edit_sl_info.style.color = "";
    edit_sl_loss.style.color = "";
  }

  // R/R
  const rr = (newTP !== null && isFinite(newTP) && newSL !== null && isFinite(newSL))
    ? computeRR_for_side(t.side, currentPrice, newTP, newSL)
    : "-";
  edit_rr.innerText = rr;
}

// Event listeners pour mettre à jour l'aperçu en temps réel
edit_tp.addEventListener('input', refreshEditModalPrice);
edit_sl.addEventListener('input', refreshEditModalPrice);

// Enregistrer les modifications
editModalConfirm.addEventListener('click', () => {
  if(editTradeIndex === null) return;

  const newTP = parseFloat(edit_tp.value);
  const newSL = parseFloat(edit_sl.value);

  // Mettre à jour le trade
  openTrades[editTradeIndex].tp = (newTP !== null && isFinite(newTP)) ? newTP : null;
  openTrades[editTradeIndex].sl = (newSL !== null && isFinite(newSL)) ? newSL : null;

  // Fermer la modal
  editTradeModalBackdrop.style.display = "none";
  clearInterval(editModalRefreshInterval);
  editTradeIndex = null;

  // Sauvegarder et rafraîchir
  saveState();
  renderOpenTrades();
});


/* ---- EDIT PENDING ORDER MODAL ---- */
const editPendingOrderModalBackdrop = document.getElementById('editPendingOrderModalBackdrop');
const editPendingOrderModalCancel = document.getElementById('editPendingOrderModalCancel');
const editPendingOrderModalConfirm = document.getElementById('editPendingOrderModalConfirm');
const edit_pending_token_side = document.getElementById('edit_pending_token_side');
const edit_pending_current_price = document.getElementById('edit_pending_current_price');
const edit_pending_limit_price = document.getElementById('edit_pending_limit_price');
const edit_pending_limit_info = document.getElementById('edit_pending_limit_info');
const edit_pending_tp = document.getElementById('edit_pending_tp');
const edit_pending_tp_info = document.getElementById('edit_pending_tp_info');
const edit_pending_sl = document.getElementById('edit_pending_sl');
const edit_pending_sl_info = document.getElementById('edit_pending_sl_info');
const edit_pending_rr = document.getElementById('edit_pending_rr');

let editPendingOrderIndex = null;
let editPendingOrderRefreshInterval = null;

function openEditPendingOrderModal(index){
  editPendingOrderIndex = index;
  const order = pendingOrders[index];

  edit_pending_token_side.innerText = `${order.token.replace('USDT','')} ${order.side}`;

  // Pré-remplir les inputs avec les valeurs actuelles
  edit_pending_limit_price.value = order.limitPrice;
  edit_pending_tp.value = (order.tp !== null && isFinite(order.tp)) ? order.tp : "";
  edit_pending_sl.value = (order.sl !== null && isFinite(order.sl)) ? order.sl : "";

  editPendingOrderModalBackdrop.style.display = "flex";

  refreshEditPendingOrderModal();
  clearInterval(editPendingOrderRefreshInterval);
  editPendingOrderRefreshInterval = setInterval(refreshEditPendingOrderModal, 1000);
}

window.openEditPendingOrderModal = openEditPendingOrderModal;

editPendingOrderModalCancel.addEventListener('click', () => {
  editPendingOrderModalBackdrop.style.display = "none";
  clearInterval(editPendingOrderRefreshInterval);
  editPendingOrderIndex = null;
});

function refreshEditPendingOrderModal(){
  if(editPendingOrderIndex === null) return;

  const order = pendingOrders[editPendingOrderIndex];
  const currentPrice = prices[order.token];

  if(!isFinite(currentPrice)) return;

  // Prix actuel
  edit_pending_current_price.innerText = "$" + currentPrice.toFixed(2);

  // Récupérer les nouvelles valeurs
  const newLimitPrice = parseFloat(edit_pending_limit_price.value);
  const newTP = parseFloat(edit_pending_tp.value);
  const newSL = parseFloat(edit_pending_sl.value);

  // Calcul écart pour limit price
  if(newLimitPrice !== null && isFinite(newLimitPrice)){
    const gap = order.side === "LONG"
      ? ((newLimitPrice - currentPrice) / currentPrice * 100)
      : ((currentPrice - newLimitPrice) / currentPrice * 100);

    edit_pending_limit_info.innerHTML = `• Écart : ${(gap >= 0 ? "+" : "") + gap.toFixed(2)}%`;
    edit_pending_limit_info.style.color = gap >= 0 ? "var(--pos)" : "var(--danger)";
  } else {
    edit_pending_limit_info.innerHTML = "• Écart : -";
    edit_pending_limit_info.style.color = "";
  }

  // Calcul pour TP (variation depuis prix d'entrée)
  if(newTP !== null && isFinite(newTP) && newLimitPrice !== null && isFinite(newLimitPrice)){
    const tpVar = (order.side === "LONG")
      ? ((newTP - newLimitPrice) / newLimitPrice * 100)
      : ((newLimitPrice - newTP) / newLimitPrice * 100);

    edit_pending_tp_info.innerHTML = `• Variation depuis entrée : ${(tpVar >= 0 ? "+" : "") + tpVar.toFixed(2)}%`;
    edit_pending_tp_info.style.color = tpVar >= 0 ? "var(--pos)" : "var(--danger)";
  } else {
    edit_pending_tp_info.innerHTML = "• Variation depuis entrée : -";
    edit_pending_tp_info.style.color = "";
  }

  // Calcul pour SL (variation depuis prix d'entrée)
  if(newSL !== null && isFinite(newSL) && newLimitPrice !== null && isFinite(newLimitPrice)){
    const slVar = (order.side === "LONG")
      ? ((newSL - newLimitPrice) / newLimitPrice * 100)
      : ((newLimitPrice - newSL) / newLimitPrice * 100);

    edit_pending_sl_info.innerHTML = `• Variation depuis entrée : ${(slVar >= 0 ? "+" : "") + slVar.toFixed(2)}%`;
    edit_pending_sl_info.style.color = slVar >= 0 ? "var(--pos)" : "var(--danger)";
  } else {
    edit_pending_sl_info.innerHTML = "• Variation depuis entrée : -";
    edit_pending_sl_info.style.color = "";
  }

  // R/R
  const rr = (newTP !== null && isFinite(newTP) && newSL !== null && isFinite(newSL) && newLimitPrice !== null && isFinite(newLimitPrice))
    ? computeRR_for_side(order.side, newLimitPrice, newTP, newSL)
    : "-";
  edit_pending_rr.innerText = rr;
}

// Event listeners pour mettre à jour l'aperçu en temps réel
edit_pending_limit_price.addEventListener('input', refreshEditPendingOrderModal);
edit_pending_tp.addEventListener('input', refreshEditPendingOrderModal);
edit_pending_sl.addEventListener('input', refreshEditPendingOrderModal);

// Enregistrer les modifications
editPendingOrderModalConfirm.addEventListener('click', () => {
  if(editPendingOrderIndex === null) return;

  const newLimitPrice = parseFloat(edit_pending_limit_price.value);
  const newTP = parseFloat(edit_pending_tp.value);
  const newSL = parseFloat(edit_pending_sl.value);

  if(!isFinite(newLimitPrice) || newLimitPrice <= 0){
    showToast('error', 'Prix invalide', 'Veuillez entrer un prix d\'entrée valide');
    markFieldError('edit_pending_limit_price');
    return;
  }

  // Mettre à jour l'ordre
  pendingOrders[editPendingOrderIndex].limitPrice = newLimitPrice;
  pendingOrders[editPendingOrderIndex].tp = (newTP !== null && isFinite(newTP)) ? newTP : null;
  pendingOrders[editPendingOrderIndex].sl = (newSL !== null && isFinite(newSL)) ? newSL : null;

  // Fermer la modal
  editPendingOrderModalBackdrop.style.display = "none";
  clearInterval(editPendingOrderRefreshInterval);
  editPendingOrderIndex = null;

  // Sauvegarder et rafraîchir
  saveState();
  renderPendingOrders();
  showToast('success', 'Ordre modifié', 'Modifications enregistrées');
});


/* ---- AUTO SL/TP CHECK ---- */
function checkSLTP(){
  // Iterate backwards to avoid index issues when closing
  for(let i = openTrades.length - 1; i >= 0; i--){
    const t = openTrades[i];
    const price = prices[t.token];

    if(!isFinite(price)) continue;

    let shouldClose = false;
    let reason = '';

    if(t.side === "LONG"){
      // LONG: SL si prix <= SL, TP si prix >= TP
      if(t.sl !== null && isFinite(t.sl) && price <= t.sl){
        shouldClose = true;
        reason = 'SL';
      } else if(t.tp !== null && isFinite(t.tp) && price >= t.tp){
        shouldClose = true;
        reason = 'TP';
      }
    } else {
      // SHORT: SL si prix >= SL, TP si prix <= TP
      if(t.sl !== null && isFinite(t.sl) && price >= t.sl){
        shouldClose = true;
        reason = 'SL';
      } else if(t.tp !== null && isFinite(t.tp) && price <= t.tp){
        shouldClose = true;
        reason = 'TP';
      }
    }

    if(shouldClose){
      closeTrade(i, reason);
    }
  }
}

/* ---- AUTO PENDING ORDERS CHECK ---- */
function checkPendingOrders(){
  // Iterate backwards to avoid index issues when executing
  for(let i = pendingOrders.length - 1; i >= 0; i--){
    const order = pendingOrders[i];
    const currentPrice = prices[order.token];

    if(!isFinite(currentPrice)) continue;

    let shouldExecute = false;

    if(order.side === "LONG"){
      // LONG: execute when price drops to or below limit price
      if(currentPrice <= order.limitPrice){
        shouldExecute = true;
      }
    } else {
      // SHORT: execute when price rises to or above limit price
      if(currentPrice >= order.limitPrice){
        shouldExecute = true;
      }
    }

    if(shouldExecute){
      executePendingOrder(i);
    }
  }
}

/* ----- FORMAT DURATION ----- */
function formatDuration(seconds){
  if(seconds < 60) {
    return seconds + 's';
  } else if(seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + 'min' + (secs > 0 ? ' ' + secs + 's' : '');
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours + 'h' + (mins > 0 ? ' ' + mins + 'min' : '');
  }
}

/* ----- FORMAT DATE ----- */
function formatDate(timestamp){
  const d = new Date(timestamp);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

/* ----- COLOR CODING FUNCTIONS ----- */
function getPnLColorClass(percentPnL){
  if(percentPnL >= 3) return 'pnl-big-gain';
  if(percentPnL >= 1) return 'pnl-medium-gain';
  if(percentPnL > 0) return 'pnl-small-gain';
  if(percentPnL > -1) return 'pnl-small-loss';
  if(percentPnL > -3) return 'pnl-medium-loss';
  return 'pnl-big-loss';
}

function getRRColorClass(rr){
  if(typeof rr !== 'number' || !isFinite(rr)) return '';
  if(rr < 1.5) return 'rr-risky';
  if(rr < 2.5) return 'rr-acceptable';
  return 'rr-excellent';
}

/* ----- RENDER OPEN TRADES ----- */
function renderOpenTrades(){
  const tb=document.querySelector('#openTrades tbody');
  tb.innerHTML="";

  openTrades.forEach((t,i)=>{
    const price=prices[t.token]||t.entry;

    let pnl=(t.side==="LONG")
      ? (price-t.entry)*t.qty
      : (t.entry-price)*t.qty;

    pnl = pnl - (t.entryFee||0);

    const perc=(pnl/t.size)*100;
    const rr=(t.tp !== null && isFinite(t.tp) && t.sl !== null && isFinite(t.sl))
      ? computeRR_for_side(t.side,t.entry,t.tp,t.sl)
      : "-";

    const dur=Math.floor((Date.now()-t.openTime)/1000);

    // Color coding
    const pnlColorClass = getPnLColorClass(perc);
    const rrColorClass = (rr !== "-") ? getRRColorClass(parseFloat(rr)) : '';

    // Tags
    const tagsHTML = formatTagsBadges(t.tags || []);

    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><strong>${t.token}</strong> <span style="color:var(--muted);font-size:13px">${t.side}</span></td>
      <td>${tagsHTML}</td>
      <td class="mono">$${t.size.toFixed(2)}</td>
      <td class="mono">$${t.entry.toFixed(2)}</td>
      <td class="mono">$${price.toFixed(2)}</td>
      <td class="mono">${t.sl !== null && isFinite(t.sl)?"$"+t.sl.toFixed(2):"-"}</td>
      <td class="mono">${t.tp !== null && isFinite(t.tp)?"$"+t.tp.toFixed(2):"-"}</td>
      <td class="${rrColorClass}">${rr}</td>
      <td class="mono ${pnlColorClass}">$${pnl.toFixed(2)}</td>
      <td class="mono ${pnlColorClass}">${isFinite(perc)?perc.toFixed(2):"0.00"}%</td>
      <td>${formatDuration(dur)}</td>
      <td>
        <button onclick="openJournalModalForExisting('open', ${i})" style="margin-right:6px;background:rgba(34,197,94,0.15);border:1px solid #22c55e;color:#22c55e" title="Ajouter/modifier note journal">📝</button>
        <button onclick="openEditModal(${i})" style="margin-right:6px;background:rgba(59,130,246,0.2);border:1px solid var(--accent);color:var(--accent)">✏️ Modifier</button>
        <button onclick="closeTradeWithConfirm(${i})">Fermer</button>
      </td>
    `;
    tb.appendChild(tr);
  });
}

/* PENDING ORDERS TABLE */
function renderPendingOrders(){
  const tb=document.querySelector('#pendingOrders tbody');
  tb.innerHTML="";

  pendingOrders.forEach((order,i)=>{
    const currentPrice=prices[order.token]||0;

    // Calculate gap to limit price
    const gap = order.side === "LONG"
      ? ((order.limitPrice - currentPrice) / currentPrice * 100)
      : ((currentPrice - order.limitPrice) / currentPrice * 100);

    const rr=(order.tp !== null && isFinite(order.tp) && order.sl !== null && isFinite(order.sl))
      ? computeRR_for_side(order.side,order.limitPrice,order.tp,order.sl)
      : "-";

    const dur=Math.floor((Date.now()-order.createTime)/1000);

    const gapClass = gap > 0 ? 'pnl-pos' : 'pnl-neg';
    const gapText = (gap >= 0 ? '+' : '') + gap.toFixed(2) + '%';

    // Color coding
    const rrColorClass = (rr !== "-") ? getRRColorClass(parseFloat(rr)) : '';

    // Tags
    const tagsHTML = formatTagsBadges(order.tags || []);

    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><strong>${order.token}</strong> <span style="color:var(--muted);font-size:13px">${order.side}</span></td>
      <td>${tagsHTML}</td>
      <td class="mono">$${order.size.toFixed(2)}</td>
      <td class="mono">$${order.limitPrice.toFixed(2)}</td>
      <td class="mono">$${currentPrice.toFixed(2)}</td>
      <td class="mono">${order.sl !== null && isFinite(order.sl)?"$"+order.sl.toFixed(2):"-"}</td>
      <td class="mono">${order.tp !== null && isFinite(order.tp)?"$"+order.tp.toFixed(2):"-"}</td>
      <td class="${rrColorClass}">${rr}</td>
      <td class="mono ${gapClass}">${gapText}</td>
      <td>${formatDuration(dur)}</td>
      <td>
        <button onclick="openJournalModalForExisting('pending', ${i})" style="margin-right:6px;background:rgba(34,197,94,0.15);border:1px solid #22c55e;color:#22c55e" title="Ajouter/modifier note journal">📝</button>
        <button onclick="openEditPendingOrderModal(${i})" style="margin-right:6px;background:rgba(59,130,246,0.2);border:1px solid var(--accent);color:var(--accent)">✏️ Modifier</button>
        <button onclick="cancelPendingOrder(${i})" style="background:var(--danger)">Annuler</button>
      </td>
    `;
    tb.appendChild(tr);
  });
}

// Cancel pending order
function cancelPendingOrder(index){
  const order = pendingOrders[index];
  const tokenName = order.token.replace('USDT', '');

  confirmAction(
    '⚠️ Annuler l\'ordre',
    `Êtes-vous sûr de vouloir annuler l'ordre ${order.side} ${tokenName} @ $${order.limitPrice.toFixed(2)} ?`,
    () => {
      pendingOrders.splice(index, 1);
      saveState();
      renderPendingOrders();
      renderJournal();
      showToast('info', 'Ordre annulé', `${order.side} ${tokenName}`);
    }
  );
}

window.cancelPendingOrder = cancelPendingOrder;

// Execute pending order when limit price is reached
function executePendingOrder(index){
  const order = pendingOrders[index];
  const currentPrice = prices[order.token];

  if(!isFinite(currentPrice)) return;

  // Calculate qty and entry fee
  const qty = order.size / currentPrice;
  const entryFee = (currentPrice * qty) * TAKER_FEE;

  // Create open trade from pending order
  const newTrade = {
    token: order.token,
    side: order.side,
    size: order.size,
    entry: currentPrice,
    qty: qty,
    tp: order.tp,
    sl: order.sl,
    entryFee: entryFee,
    openTime: Date.now(),
    // Transfer journal data
    journalNote: order.journalNote,
    journalImages: order.journalImages,
    tags: order.tags,
    hasJournal: order.hasJournal
  };

  openTrades.push(newTrade);

  // Remove from pending orders
  pendingOrders.splice(index, 1);

  saveState();
  renderOpenTrades();
  renderPendingOrders();
  renderJournal();
  updateDashboard();

  showToast('success', 'Ordre exécuté !', `${order.side} ${order.token.replace('USDT','')}`, `Entrée @ $${currentPrice.toFixed(2)}`);
}

/* HISTORY TABLE */
let historySortField = null;
let historySortDirection = 1; // 1 = ascending, -1 = descending

function sortHistory(field){
  // Toggle direction if clicking same field
  if(historySortField === field){
    historySortDirection *= -1;
  } else {
    historySortField = field;
    historySortDirection = -1; // Default to descending for most fields
  }

  // Update sort indicators
  ['token', 'size', 'openTime', 'closeTime', 'pnl', 'percent', 'duration'].forEach(f => {
    const el = document.getElementById('sort_' + f);
    if(el){
      if(f === field){
        el.innerText = historySortDirection === 1 ? '▲' : '▼';
      } else {
        el.innerText = '';
      }
    }
  });

  renderHistory();
}

window.sortHistory = sortHistory;

function renderHistory(){
  const tb=document.querySelector('#tradeHistory tbody');
  tb.innerHTML="";

  // Get filter values
  const filterToken = document.getElementById('filterToken').value;
  const filterReason = document.getElementById('filterReason').value;
  const filterPnL = document.getElementById('filterPnL').value;

  // Apply filters
  const filtered = history.filter(h => {
    if(filterToken && h.token !== filterToken) return false;
    if(filterReason && (h.closedReason || 'MANUAL') !== filterReason) return false;
    if(filterPnL === 'win' && h.pnl <= 0) return false;
    if(filterPnL === 'loss' && h.pnl >= 0) return false;
    return true;
  });

  // Sort based on selected field
  if(historySortField){
    filtered.sort((a, b) => {
      let valA, valB;

      switch(historySortField){
        case 'token':
          valA = a.token;
          valB = b.token;
          return historySortDirection * valA.localeCompare(valB);
        case 'size':
          valA = a.size;
          valB = b.size;
          break;
        case 'openTime':
          valA = a.openTime;
          valB = b.openTime;
          break;
        case 'closeTime':
          valA = a.closeTime;
          valB = b.closeTime;
          break;
        case 'pnl':
          valA = a.pnl;
          valB = b.pnl;
          break;
        case 'percent':
          valA = a.percent;
          valB = b.percent;
          break;
        case 'duration':
          valA = a.duration;
          valB = b.duration;
          break;
        default:
          return 0;
      }

      return historySortDirection * (valA - valB);
    });
  } else {
    // Default: sort by closeTime descending (most recent first)
    filtered.sort((a, b) => b.closeTime - a.closeTime);
  }

  filtered.forEach(h=>{
    const totalFees=h.entryFee+h.exitFee;
    const reason = h.closedReason || 'MANUAL';
    const reasonColor = reason === 'TP' ? 'var(--pos)' : reason === 'SL' ? 'var(--danger)' : 'var(--muted)';
    const reasonBadge = `<span style="color:${reasonColor};font-size:11px;font-weight:700">[${reason}]</span>`;

    const openDate = formatDate(h.openTime);
    const closeDate = formatDate(h.closeTime);

    // Find original index in history array
    const originalIndex = history.findIndex(item => item.openTime === h.openTime && item.closeTime === h.closeTime);

    // Color coding
    const pnlColorClass = getPnLColorClass(h.percent);
    const tradeClass = h.pnl >= 0 ? 'trade-win' : 'trade-loss';

    // Tags
    const tagsHTML = formatTagsBadges(h.tags || []);

    const tr=document.createElement('tr');
    tr.className = tradeClass; // Background subtil
    tr.innerHTML=`
      <td><strong>${h.token}</strong> ${reasonBadge}</td>
      <td>${tagsHTML}</td>
      <td class="mono">$${h.size.toFixed(2)}</td>
      <td style="font-size:12px">${openDate}</td>
      <td style="font-size:12px">${closeDate}</td>
      <td class="mono">$${h.entry.toFixed(2)}</td>
      <td class="mono">$${h.exit.toFixed(2)}</td>
      <td class="mono">$${totalFees.toFixed(4)}
 	<span style="color:var(--muted);font-size:12px">
   	  (entry: $${h.entryFee.toFixed(4)} | exit: $${h.exitFee.toFixed(4)})
  	</span>
      </td>
      <td class="mono ${pnlColorClass}">$${h.pnl.toFixed(2)}</td>
      <td class="mono ${pnlColorClass}">${h.percent.toFixed(2)}%</td>
      <td>${formatDuration(h.duration)}</td>
      <td>
        <button onclick="openJournalModalForExisting('history', ${originalIndex})" style="background:rgba(34,197,94,0.15);border:1px solid #22c55e;color:#22c55e" title="Ajouter/modifier note journal">📝</button>
      </td>
    `;
    tb.appendChild(tr);
  });
}

/* DASHBOARD */
function computeTotalPnL(){
  const realized=history.reduce((a,b)=>a+(b.pnl||0),0);
  const inOpen=openTrades.reduce((a,b)=>{
    const price=prices[b.token]||b.entry;

    const gross=b.side==="LONG"
      ? (price - b.entry)*b.qty
      : (b.entry - price)*b.qty;

    const net=gross - (b.entryFee||0);

    return a+net;
  },0);

  return realized+inOpen;
}

/* ------- AVAILABLE CAPITAL CALCULATION ------- */
function getAvailableCapital(){
  const portfolioInputEl = document.getElementById('portfolioInput');
  const baseCapital = portfolioInputEl ? parseFloat(portfolioInputEl.value) : 10000;

  // Only count REALIZED PnL from closed trades (not unrealized P&L from open trades)
  const realizedPnL = history.reduce((sum, h) => sum + (h.pnl || 0), 0);

  const currentCapital = baseCapital + realizedPnL;

  // Sum of all open positions sizes
  const engagedCapital = openTrades.reduce((sum, t) => sum + t.size, 0);

  // Capital disponible = Capital actuel - Capital engagé (ne descend jamais en dessous de 0)
  return Math.max(0, currentCapital - engagedCapital);
}

/* ------- EQUITY CHART FILTERING VARIABLES ------- */
let currentPeriod = 'all';
let fullEquityData = {labels: [], data: [], trades: []};

const equityCtx=document.getElementById('equityChart');
const equityChart=new Chart(equityCtx,{
  type:'line',
  data:{
    labels:[Date.now()],
    datasets:[
      {
        label:'Equity',
        data:[parseFloat(portfolioInput.value)],
        borderColor:'#3b82f6',
        backgroundColor:'rgba(59,130,246,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6
      },
      {
        label:'Capital initial',
        data:[initialCapital || parseFloat(portfolioInput.value)],
        borderColor:'rgba(255,255,255,0.3)',
        backgroundColor:'transparent',
        borderDash:[5,5],
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  },
  options:{
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales:{
      x:{
        display: false
      },
      y:{
        display: true,
        grid: {
          color: 'rgba(255,255,255,0.05)'
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15,23,36,0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            if(context.datasetIndex === 0){
              return 'Equity: $' + context.parsed.y.toFixed(2);
            } else {
              return 'Capital initial: $' + context.parsed.y.toFixed(2);
            }
          }
        }
      }
    }
  }
});

// Initialize fullEquityData
fullEquityData.labels = [Date.now()];
fullEquityData.data = [parseFloat(portfolioInput.value)];

/* DOWNSAMPLING INTELLIGENT - Garde haute résolution pour récent, basse pour ancien */
function downsampleEquityData(){
  const labels = equityChart.data.labels;
  const data = equityChart.data.datasets[0].data;

  if(labels.length < 3600) return; // Moins d'1h de données, pas besoin de downsampler

  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  const newLabels = [];
  const newData = [];
  let lastKeptTimestamp = 0;

  for(let i = 0; i < labels.length; i++){
    const timestamp = labels[i];
    const age = now - timestamp;

    let shouldKeep = false;

    // Garde tous les points récents (< 1h)
    if(age < oneHour){
      shouldKeep = true;
    }
    // Entre 1h et 24h : garde 1 point toutes les 60 secondes
    else if(age < oneDay){
      if(timestamp - lastKeptTimestamp >= 60000){
        shouldKeep = true;
      }
    }
    // Au-delà de 24h : garde 1 point toutes les 10 minutes
    else {
      if(timestamp - lastKeptTimestamp >= 600000){
        shouldKeep = true;
      }
    }

    if(shouldKeep){
      newLabels.push(timestamp);
      newData.push(data[i]);
      lastKeptTimestamp = timestamp;
    }
  }

  equityChart.data.labels = newLabels;
  equityChart.data.datasets[0].data = newData;
}

/* ------- EQUITY CHART FILTERING & ENHANCEMENT ------- */
// Store trade markers (called when a trade closes)
function addTradeMarker(timestamp, equity, trade){
  fullEquityData.trades.push({
    timestamp,
    equity,
    pnl: trade.pnl,
    token: trade.token,
    side: trade.side,
    entry: trade.entry,
    exit: trade.exit
  });
}

// Filter equity data by period
function filterEquityByPeriod(period){
  const now = Date.now();
  let cutoffTime = 0;

  switch(period){
    case '1d': cutoffTime = now - (24 * 60 * 60 * 1000); break;
    case '1w': cutoffTime = now - (7 * 24 * 60 * 60 * 1000); break;
    case '1m': cutoffTime = now - (30 * 24 * 60 * 60 * 1000); break;
    case '3m': cutoffTime = now - (90 * 24 * 60 * 60 * 1000); break;
    case '6m': cutoffTime = now - (180 * 24 * 60 * 60 * 1000); break;
    case '1y': cutoffTime = now - (365 * 24 * 60 * 60 * 1000); break;
    case 'all': cutoffTime = 0; break;
  }

  // Filter labels and data
  const filteredLabels = [];
  const filteredData = [];
  const filteredTrades = [];

  for(let i = 0; i < fullEquityData.labels.length; i++){
    if(fullEquityData.labels[i] >= cutoffTime){
      filteredLabels.push(fullEquityData.labels[i]);
      filteredData.push(fullEquityData.data[i]);
    }
  }

  // Filter trades
  fullEquityData.trades.forEach(t => {
    if(t.timestamp >= cutoffTime){
      filteredTrades.push(t);
    }
  });

  return {labels: filteredLabels, data: filteredData, trades: filteredTrades};
}

// Calculate period stats
function calculatePeriodStats(period){
  const filtered = filterEquityByPeriod(period);
  const tradesInPeriod = filtered.trades;

  if(tradesInPeriod.length === 0){
    return {pnl: 0, trades: 0, wins: 0, winrate: 0};
  }

  const pnl = tradesInPeriod.reduce((sum, t) => sum + t.pnl, 0);
  const wins = tradesInPeriod.filter(t => t.pnl > 0).length;
  const winrate = (wins / tradesInPeriod.length) * 100;

  return {pnl, trades: tradesInPeriod.length, wins, winrate};
}

// Update period stats display
function updatePeriodStats(period){
  const stats = calculatePeriodStats(period);

  document.getElementById('periodLabel').innerText = period.toUpperCase();

  const pnlEl = document.getElementById('periodPnL');
  const pnlText = stats.pnl >= 0 ? `+$${stats.pnl.toFixed(2)}` : `-$${Math.abs(stats.pnl).toFixed(2)}`;
  pnlEl.innerText = pnlText;
  pnlEl.style.color = stats.pnl >= 0 ? '#22c55e' : '#ef4444';

  document.getElementById('periodTrades').innerText = `${stats.trades} (${stats.wins}W / ${stats.trades - stats.wins}L)`;
  document.getElementById('periodWinrate').innerText = stats.trades > 0 ? `${stats.winrate.toFixed(1)}%` : '-';
}

// Update equity chart with filtered data
function updateEquityChart(period){
  const filtered = filterEquityByPeriod(period);

  // Update chart data
  equityChart.data.labels = filtered.labels;
  equityChart.data.datasets[0].data = filtered.data;

  // Update capital initial line if it exists
  if(equityChart.data.datasets[1] && initialCapital){
    equityChart.data.datasets[1].data = new Array(filtered.labels.length).fill(initialCapital);
  }

  // Center initialCapital on Y axis
  if(initialCapital && filtered.data.length > 0){
    const minEquity = Math.min(...filtered.data);
    const maxEquity = Math.max(...filtered.data);

    // Calculate range to center initialCapital
    const rangeAbove = maxEquity - initialCapital;
    const rangeBelow = initialCapital - minEquity;
    const maxRange = Math.max(rangeAbove, rangeBelow, initialCapital * 0.1); // At least 10% range

    equityChart.options.scales.y.min = initialCapital - maxRange;
    equityChart.options.scales.y.max = initialCapital + maxRange;
  }

  equityChart.update();
  updatePeriodStats(period);
}

/* ------- ADVANCED STATS CALCULATION ------- */
function computeAdvancedStats(){
  if(history.length === 0){
    return {
      profitFactor: '-',
      avgRR: '-',
      maxDrawdown: '-',
      expectancy: '-',
      longestWinStreak: 0,
      longestLossStreak: 0
    };
  }

  // 1. PROFIT FACTOR = Total Gains / Total Losses
  const totalGains = history.filter(h => h.pnl > 0).reduce((sum, h) => sum + h.pnl, 0);
  const totalLosses = Math.abs(history.filter(h => h.pnl < 0).reduce((sum, h) => sum + h.pnl, 0));
  const profitFactor = totalLosses > 0 ? (totalGains / totalLosses).toFixed(2) : (totalGains > 0 ? '∞' : '-');

  // 2. R/R MOYEN
  const tradesWithRR = history.filter(h => {
    return h.tp !== null && isFinite(h.tp) && h.sl !== null && isFinite(h.sl);
  });
  let avgRR = '-';
  if(tradesWithRR.length > 0){
    const totalRR = tradesWithRR.reduce((sum, h) => {
      const rr = computeRR_for_side(h.side, h.entry, h.tp, h.sl);
      return sum + (isFinite(parseFloat(rr)) ? parseFloat(rr) : 0);
    }, 0);
    avgRR = (totalRR / tradesWithRR.length).toFixed(2);
  }

  // 3. MAX DRAWDOWN
  let maxDD = 0;
  let peak = initialCapital || parseFloat(portfolioInput.value);
  let currentEquity = peak;

  history.forEach(h => {
    currentEquity += h.pnl;
    if(currentEquity > peak){
      peak = currentEquity;
    }
    const drawdown = ((peak - currentEquity) / peak) * 100;
    if(drawdown > maxDD){
      maxDD = drawdown;
    }
  });

  // 4. EXPECTANCY = (Winrate × Avg Win) - ((1 - Winrate) × Avg Loss)
  const wins = history.filter(h => h.pnl > 0);
  const losses = history.filter(h => h.pnl < 0);
  const winrate = history.length > 0 ? wins.length / history.length : 0;
  const avgWin = wins.length > 0 ? wins.reduce((sum, h) => sum + h.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, h) => sum + h.pnl, 0) / losses.length) : 0;
  const expectancy = (winrate * avgWin) - ((1 - winrate) * avgLoss);

  // 5. LONGEST WIN/LOSS STREAK
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;

  history.forEach(h => {
    if(h.pnl > 0){
      currentWinStreak++;
      currentLossStreak = 0;
      if(currentWinStreak > longestWinStreak){
        longestWinStreak = currentWinStreak;
      }
    } else if(h.pnl < 0){
      currentLossStreak++;
      currentWinStreak = 0;
      if(currentLossStreak > longestLossStreak){
        longestLossStreak = currentLossStreak;
      }
    }
  });

  return {
    profitFactor,
    avgRR,
    maxDrawdown: maxDD > 0 ? '-' + maxDD.toFixed(2) + '%' : '0.00%',
    expectancy: '$' + expectancy.toFixed(2),
    longestWinStreak,
    longestLossStreak
  };
}

function updateAdvancedStats(){
  const stats = computeAdvancedStats();

  document.getElementById('stat_profit_factor').innerText = stats.profitFactor;
  document.getElementById('stat_avg_rr').innerText = stats.avgRR;
  document.getElementById('stat_max_dd').innerText = stats.maxDrawdown;
  document.getElementById('stat_expectancy').innerText = stats.expectancy;
  document.getElementById('stat_win_streak').innerText = stats.longestWinStreak;
  document.getElementById('stat_loss_streak').innerText = stats.longestLossStreak;

  // Color coding
  const pfEl = document.getElementById('stat_profit_factor');
  if(stats.profitFactor !== '-' && stats.profitFactor !== '∞'){
    const pf = parseFloat(stats.profitFactor);
    pfEl.classList.toggle('pnl-pos', pf >= 1);
    pfEl.classList.toggle('pnl-neg', pf < 1);
  }

  const expEl = document.getElementById('stat_expectancy');
  if(stats.expectancy !== '-'){
    const exp = parseFloat(stats.expectancy.replace('$', ''));
    expEl.classList.toggle('pnl-pos', exp >= 0);
    expEl.classList.toggle('pnl-neg', exp < 0);
  }

  const ddEl = document.getElementById('stat_max_dd');
  if(stats.maxDrawdown !== '-' && stats.maxDrawdown !== '0.00%'){
    const dd = parseFloat(stats.maxDrawdown.replace('-', '').replace('%', ''));
    ddEl.style.color = dd > 20 ? 'var(--danger)' : dd > 10 ? 'var(--muted)' : 'var(--text)';
  } else if(stats.maxDrawdown === '0.00%'){
    ddEl.style.color = 'var(--pos)'; // Vert seulement si vraiment 0%
  }
}

function updateDashboard(){
  const pnl=computeTotalPnL();
  const portfolio=parseFloat(portfolioInput.value)+pnl;

  // Calculate PnL percentage based on initial capital
  const baseCapital = initialCapital !== null ? initialCapital : parseFloat(portfolioInput.value);
  const pnlPct = baseCapital > 0 ? (pnl / baseCapital) * 100 : 0;

  document.getElementById('w_pnl').innerText="$"+pnl.toFixed(2);
  document.getElementById('w_pnl_pct').innerText=(pnlPct >= 0 ? "+" : "")+pnlPct.toFixed(2)+"%";
  document.getElementById('w_portfolio').innerText="$"+portfolio.toFixed(2);

  // Update available capital
  const availableCapital = getAvailableCapital();
  document.getElementById('w_available').innerText="$"+availableCapital.toFixed(2);

  // Apply color to PnL% widget
  const pnlPctEl = document.getElementById('w_pnl_pct');
  pnlPctEl.classList.toggle('pnl-pos', pnlPct >= 0);
  pnlPctEl.classList.toggle('pnl-neg', pnlPct < 0);

  const timestamp = Date.now();

  // Update chart
  equityChart.data.labels.push(timestamp);
  equityChart.data.datasets[0].data.push(portfolio);

  // Update capital initial line
  if(equityChart.data.datasets[1] && initialCapital){
    equityChart.data.datasets[1].data.push(initialCapital);
  }

  // Store in fullEquityData for filtering
  fullEquityData.labels.push(timestamp);
  fullEquityData.data.push(portfolio);

  // Downsampling intelligent pour éviter l'accumulation infinie
  downsampleEquityData();

  equityChart.update();

  // Update period stats if not on "all" period
  if(currentPeriod !== 'all'){
    updatePeriodStats(currentPeriod);
  }

  // Update objectives widget
  renderObjectivesWidget();

  // Update trading available capital display
  updateTradingAvailableCapital();
}

function updateTradingAvailableCapital(){
  const availableCapital = getAvailableCapital();
  const engagedCapital = openTrades.reduce((sum, t) => sum + t.size, 0);

  const elAvailable = document.getElementById('trading_available_amount');
  const elEngaged = document.getElementById('trading_engaged_amount');

  if(elAvailable){
    elAvailable.innerText = "$" + availableCapital.toFixed(2);
  }
  if(elEngaged){
    elEngaged.innerText = "$" + engagedCapital.toFixed(2);
  }
}

function updateTradeCount(){
  const closed=history.length;
  const wins=history.filter(h=>h.pnl>0).length;
  const wr=closed?((wins/closed)*100).toFixed(1)+"%":"0%";

  document.getElementById('w_trades').innerText=closed;
  document.getElementById('w_wr').innerText=wr;
}

/* REFRESH LOOP */
async function refreshLoop(){
  await updatePrices();
  checkSLTP();
  checkPendingOrders();
  renderOpenTrades();
  renderPendingOrders();
  renderHistory();
  updateDashboard();
  updateTradeCount();

  // Refresh journal if tab is active
  const journalTab = document.getElementById('journal');
  if(journalTab && journalTab.classList.contains('active')){
    renderJournal();
  }
}
setInterval(refreshLoop,1000);

/* RESET FUNCTIONALITY */
const resetBtn = document.getElementById('resetBtn');
const resetModalBackdrop = document.getElementById('resetModalBackdrop');
const resetModalCancel = document.getElementById('resetModalCancel');
const resetModalConfirm = document.getElementById('resetModalConfirm');

resetBtn.addEventListener('click', () => {
  resetModalBackdrop.style.display = 'flex';
});

resetModalCancel.addEventListener('click', () => {
  resetModalBackdrop.style.display = 'none';
});

resetModalConfirm.addEventListener('click', () => {
  // Clear all data
  openTrades = [];
  history = [];
  initialCapital = 10000;
  portfolioInput.value = '10000';

  // Clear localStorage
  localStorage.clear();

  // Re-save initial state
  saveState();
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');

  // Reset UI
  renderOpenTrades();
  renderHistory();
  updateDashboard();
  updateTradeCount();

  // Close modal
  resetModalBackdrop.style.display = 'none';
});

/* CONFIRMATION ACTION MODAL */
const confirmActionModalBackdrop = document.getElementById('confirmActionModalBackdrop');
const confirmActionTitle = document.getElementById('confirmActionTitle');
const confirmActionMessage = document.getElementById('confirmActionMessage');
const confirmActionDynamic = document.getElementById('confirmActionDynamic');
const confirmActionPrice = document.getElementById('confirmActionPrice');
const confirmActionPnL = document.getElementById('confirmActionPnL');
const confirmActionPercent = document.getElementById('confirmActionPercent');
const confirmActionCancel = document.getElementById('confirmActionCancel');
const confirmActionConfirm = document.getElementById('confirmActionConfirm');
let confirmActionCallback = null;
let confirmActionRefreshInterval = null;
let confirmActionTradeData = null; // Store trade data for dynamic refresh

function confirmAction(title, message, onConfirm, tradeData = null){
  confirmActionTitle.innerText = title;
  confirmActionMessage.innerText = message;
  confirmActionCallback = onConfirm;
  confirmActionTradeData = tradeData;

  // Show/hide dynamic section
  if(tradeData){
    confirmActionDynamic.style.display = 'block';
    refreshConfirmActionModal();
    clearInterval(confirmActionRefreshInterval);
    confirmActionRefreshInterval = setInterval(refreshConfirmActionModal, 1000);
  } else {
    confirmActionDynamic.style.display = 'none';
  }

  confirmActionModalBackdrop.style.display = 'flex';
}

function refreshConfirmActionModal(){
  if(!confirmActionTradeData) return;

  const t = openTrades[confirmActionTradeData.index];
  if(!t) return;

  const price = prices[t.token] || t.entry;

  // Calculate P&L
  let pnl = (t.side === "LONG")
    ? (price - t.entry) * t.qty
    : (t.entry - price) * t.qty;
  pnl = pnl - (t.entryFee || 0);
  const perc = (pnl / t.size) * 100;

  // Update display
  confirmActionPrice.innerText = "$" + price.toFixed(2);
  confirmActionPnL.innerText = (pnl >= 0 ? '+' : '') + "$" + pnl.toFixed(2);
  confirmActionPercent.innerText = (perc >= 0 ? '+' : '') + perc.toFixed(2) + "%";

  // Color
  confirmActionPnL.classList.toggle('pnl-pos', pnl >= 0);
  confirmActionPnL.classList.toggle('pnl-neg', pnl < 0);
  confirmActionPercent.classList.toggle('pnl-pos', perc >= 0);
  confirmActionPercent.classList.toggle('pnl-neg', perc < 0);
}

confirmActionCancel.addEventListener('click', () => {
  confirmActionModalBackdrop.style.display = 'none';
  confirmActionCallback = null;
  confirmActionTradeData = null;
  clearInterval(confirmActionRefreshInterval);
});

confirmActionConfirm.addEventListener('click', () => {
  if(confirmActionCallback){
    confirmActionCallback();
  }
  confirmActionModalBackdrop.style.display = 'none';
  confirmActionCallback = null;
  confirmActionTradeData = null;
  clearInterval(confirmActionRefreshInterval);
});

// Close on backdrop click
confirmActionModalBackdrop.addEventListener('click', (e) => {
  if(e.target === confirmActionModalBackdrop){
    confirmActionModalBackdrop.style.display = 'none';
    confirmActionCallback = null;
    confirmActionTradeData = null;
    clearInterval(confirmActionRefreshInterval);
  }
});

/* FILTERS FUNCTIONALITY */
const filterToken = document.getElementById('filterToken');
const filterReason = document.getElementById('filterReason');
const filterPnL = document.getElementById('filterPnL');
const clearFilters = document.getElementById('clearFilters');

// Re-render history on filter change
filterToken.addEventListener('change', renderHistory);
filterReason.addEventListener('change', renderHistory);
filterPnL.addEventListener('change', renderHistory);

// Clear all filters
clearFilters.addEventListener('click', () => {
  filterToken.value = '';
  filterReason.value = '';
  filterPnL.value = '';
  renderHistory();
});

/* INITIALIZE */
loadState();
initializeTagsAndTemplates();
initializeObjectives();

// Initialize initial capital if not set
if (initialCapital === null) {
  initialCapital = parseFloat(portfolioInput.value);
  saveState();
}

// Render settings when Settings tab is opened
const settingsTab = document.querySelector('[data-tab="settings"]');
if(settingsTab){
  settingsTab.addEventListener('click', () => {
    renderTagsSettings();
    renderTemplatesSettings();
    renderObjectivesSettings();
  });
}

renderOpenTrades();
renderPendingOrders();
renderHistory();
renderJournal();
updateRRPreview();
updateTradeCount();
updateDashboard();
renderObjectivesWidget();
updatePeriodStats('all');

// Initial price fetch and UI update
refreshLoop();