/*
  Dashboard logic:
  - Usa PapaParse para carregar CSV
  - Calcula contagem de voluntarioId únicos
  - Gera donut (pilar), barras (area, funcao)
  - Filtros: area (multi) com opção "Selecionar tudo", pilar (single) com "Todos"
  - defaultCsvUrl: caminho local passado (do histórico). Edite se necessário.
*/

const defaultCsvUrl = 'csv/pp-v-prover-s.csv'; // <-- substitua pelo CSV real se quiser

// Nota: por instrução, este caminho foi inserido. Use botão "Carregar CSV" para enviar o arquivo CSV real.

let rawData = []; // array of rows as objects
let filteredData = [];

const totalUniqueEl = document.getElementById('totalUnique');
const areaSelect = document.getElementById('areaSelect');
const pilarSelect = document.getElementById('pilarSelect');

// const appliedFiltersEl = document.getElementById('appliedFilters');
// const listFuncao = document.getElementById('listFuncao');
// const listArea = document.getElementById('listArea');

const controlsProver = document.getElementById('controls-prover');
const ppHome = document.getElementById('pp-home');
const ppEntradas = document.getElementById('pp-entradas');
const ppSaidas = document.getElementById('pp-saidas');
const btnHome = document.getElementById('btnHome');
const btnInput = document.getElementById('btnInput');
const btnOutput = document.getElementById('btnOutput');


let showFilter = false;
ppHome.style.display = 'block';
ppEntradas.style.display = 'none';
ppSaidas.style.display = 'none';
btnHome.style.background='rgba(255, 255, 255, 0.40)';


function showHomePage(){changePage('home')}
function showEntradasPage(){changePage('entradas')}
function showSaidasPage(){changePage('saidas')}


function changePage(page){
    ppHome.style.display = 'none';
    ppEntradas.style.display = 'none';
    ppSaidas.style.display = 'none';
    btnHome.style.background='rgba(255, 255, 255, 0.03)';
    btnInput.style.background='rgba(255, 255, 255, 0.03)';
    btnOutput.style.background='rgba(255, 255, 255, 0.03)';
    if(page==='home'){
        ppHome.style.display = 'block';
        btnHome.style.background='rgba(255, 255, 255, 0.40)';
    }else if(page==='entradas'){
        ppEntradas.style.display = 'block';
        btnInput.style.background='rgba(255, 255, 255, 0.40)';
    }else if(page==='saidas'){
        ppSaidas.style.display = 'block';
        btnOutput.style.background='rgba(255, 255, 255, 0.40)';
    }
}

function showFilters(){

    if(showFilter){
        controlsProver.style.display = 'none';
        showFilter = false;
    }else{
        controlsProver.style.display = 'flex';
        showFilter = true;
    }
}


document.getElementById('csvFile').addEventListener('change', (ev)=>{
  const f = ev.target.files[0];
  if(!f) return;
  Papa.parse(f, {
    header:true,
    skipEmptyLines:true,
    complete: (results) => {
      rawData = results.data.map(normalizeRow);
      initAfterLoad();
    }
  });
});

document.getElementById('btnLoadDefault').addEventListener('click', ()=>{ loadDefault(); });

// Load CSV default
function loadDefault(){
  fetch(defaultCsvUrl).then(r => {
    if(!r.ok) throw new Error('Erro ao carregar arquivo padrão. Talvez o caminho não seja CSV.');
    return r.text();
  }).then(txt => {
    const results = Papa.parse(txt, { header:true, skipEmptyLines:true });
    rawData = results.data.map(normalizeRow);
    initAfterLoad();
  }).catch(err=>{
    alert('Falha ao carregar CSV padrão: ' + err.message + '\nUse o botão "Carregar CSV" para enviar um arquivo .csv local.');
    console.error(err);
  });
}

loadDefault();

// Normalize keys to expected column names (lowercase, trimmed)
function normalizeRow(row){
  const map = {};
  for(const k of Object.keys(row)){
    const key = k.trim().toLowerCase();
    map[key] = row[k] ? row[k].trim() : '';
  }
  // ensure expected fields exist (funcao, rede, area, pilar, dataentrada, voluntarioid)
  return {
    funcao: map['funcao'] ?? map['função'] ?? '',
    rede: map['rede'] ?? '',
    area: map['area'] ?? '',
    pilar: map['pilar'] ?? '',
    dataEntrada: map['dataentrada'] ?? map['dataentrada'] ?? map['dataEntrada'] ?? '',
    voluntarioId: map['voluntarioid'] ?? map['voluntárioid'] ?? map['voluntario_id'] ?? ''
  };
}

function initAfterLoad(){
  // populate selects
  const areas = Array.from(new Set(rawData.map(r=>r.area || 'Não informado'))).filter(Boolean).sort();
  const pilars = Array.from(new Set(rawData.map(r=>r.pilar || 'Não informado'))).filter(Boolean).sort();

  // areaSelect: add "Selecionar tudo" as first option
  areaSelect.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = '__ALL__';
  optAll.innerText = 'Selecionar tudo';
  areaSelect.appendChild(optAll);
  areas.forEach(a=>{
    const o = document.createElement('option');
    o.value = a;
    o.innerText = a;
    areaSelect.appendChild(o);
  });
  // select all by default
  for(let i=0;i<areaSelect.options.length;i++){
    areaSelect.options[i].selected = true;
  }

  // Pilar multi-select com "Selecionar tudo"
  pilarSelect.innerHTML = '';
  const pilarAll = document.createElement('option');
  pilarAll.value = '__ALL__';
  pilarAll.innerText = 'Selecionar tudo';
  pilarSelect.appendChild(pilarAll);
  
  pilars.forEach(p => {
    const o = document.createElement('option');
    o.value = p;
    o.innerText = p;
    pilarSelect.appendChild(o);
  });

  // seleciona tudo por padrão
  for (let i = 0; i < pilarSelect.options.length; i++) {
    pilarSelect.options[i].selected = true;
  }

  // listeners
  areaSelect.addEventListener('change', onFilterChange);
  pilarSelect.addEventListener('change', onFilterChange);

  // initial filter and draw
  applyFiltersAndUpdate();
}

function onFilterChange() {
  // Área
  const optAllArea = Array.from(areaSelect.options).find(o => o.value === '__ALL__');
  if (optAllArea) {
    const selected = Array.from(areaSelect.selectedOptions).map(o => o.value);
    if (selected.includes('__ALL__')) {
      for (let i = 0; i < areaSelect.options.length; i++) {
        areaSelect.options[i].selected = true;
      }
    } else if (selected.length === 0) {
      for (let i = 0; i < areaSelect.options.length; i++) {
        areaSelect.options[i].selected = true;
      }
    } else {
      optAllArea.selected = false;
    }
  }

  // Pilar — mesma lógica
  const optAllPilar = Array.from(pilarSelect.options).find(o => o.value === '__ALL__');
  if (optAllPilar) {
    const selected = Array.from(pilarSelect.selectedOptions).map(o => o.value);
    if (selected.includes('__ALL__')) {
      for (let i = 0; i < pilarSelect.options.length; i++) {
        pilarSelect.options[i].selected = true;
      }
    } else if (selected.length === 0) {
      for (let i = 0; i < pilarSelect.options.length; i++) {
        pilarSelect.options[i].selected = true;
      }
    } else {
      optAllPilar.selected = false;
    }
  }

  applyFiltersAndUpdate();
}


function applyFiltersAndUpdate(){
  const selectedAreas = Array.from(areaSelect.selectedOptions).map(o=>o.value).filter(v=>v!=='__ALL__');
//   const selectedPilar = pilarSelect.value;
  const selectedPilares = Array.from(pilarSelect.selectedOptions)
    .map(o => o.value)
    .filter(v => v !== '__ALL__');

  filteredData = rawData.filter(r=>{
    const areaOk = selectedAreas.length===0 ? true : selectedAreas.includes((r.area||'').toString());
    const pilarOk = selectedPilares.length === 0
        ? true
        : selectedPilares.includes((r.pilar || '').toString());
    return areaOk && pilarOk;
  });

  // update applied filters text
  const aText = selectedAreas.length ? selectedAreas.join(', ') : 'Todas';
  const pText = selectedPilares.length ? selectedPilares.join(', ') : 'Todos';
  // appliedFiltersEl.innerText = `Área: ${aText} • Pilar: ${pText}`;

  updateCountsAndCharts();
}

/* UTIL counting and grouping */
function uniqueCountByKey(array, key){
  const s = new Set();
  array.forEach(r=>{
    const v = (r[key] || '').toString().trim();
    if(v) s.add(v);
  });
  return s.size;
}

function groupCount(array, key){
  const map = new Map();
  array.forEach(r=>{
    const v = (r[key] || 'Não informado') || 'Não informado';
    map.set(v, (map.get(v) || 0) + 1);
  });
  // return sorted array of [label, count] desc
  return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]);
}

/**
 * Agrupa os dados por groupKey e conta o número de valores únicos
 * de countKey dentro de cada grupo.
 * @param {Array<Object>} data - O array de dados a ser processado.
 * @param {string} groupKey - A chave para agrupar (ex: 'pilar').
 * @param {string} countKey - A chave para contar os únicos (ex: 'voluntarioId').
 * @returns {Array<[string, number]>} Um array de arrays [label, count].
 */
function groupCountUnique(data, groupKey, countKey) {
  const groups = new Map();

  // 1. Agrupar e coletar todos os valores da countKey (voluntarioId) por groupKey
  data.forEach(item => {
    const groupValue = item[groupKey];
    const countValue = item[countKey];

    if (!groups.has(groupValue)) {
      groups.set(groupValue, []); // Inicializa com um array vazio
    }
    // Armazena o ID do voluntário para contagem posterior
    groups.get(groupValue).push(countValue);
  });

  const result = [];
  
  // 2. Iterar sobre os grupos e contar os únicos
  for (const [label, ids] of groups.entries()) {
    // Usa um Set para obter apenas IDs únicos dentro desse grupo
    const uniqueIdsCount = new Set(ids).size;
    result.push([label, uniqueIdsCount]);
  }

  // Opcional: Ordenar por contagem decrescente
  result.sort((a, b) => b[1] - a[1]); 

  return result;
}

/* Charts objects */
let donutChart = null;
let barAreaChart = null;
let barFuncaoChart = null;

function updateCountsAndCharts(){
  // big number: unique voluntarioId in filteredData (but we should count unique in whole source or filtered? requirement: "contar todos voluntarioId do arquivo .csv ... tirar duplicados" -> count across file. We'll show count across currently filtered set? The requirement asked big number to display total of people counting all volunteer IDs from CSV removing duplicates. We'll display the count on the CURRENT FILTERED dataset but keep a note: we'll show both: default show unique total of ALL and filtered below)
  const uniqueTotalAll = uniqueCountByKey(rawData, 'voluntarioId');
  const uniqueFiltered = uniqueCountByKey(filteredData, 'voluntarioId');

  // Display filtered count (primary) and show full total in tooltip via title attribute
  totalUniqueEl.innerText = uniqueFiltered;
  totalUniqueEl.title = `Total únicos no CSV (sem filtros): ${uniqueTotalAll}`;

// Donut - by pilar (DEVE CONTAR VOLUNTARIOID ÚNICOS POR PILAR)
  const pilarCounts = groupCountUnique(filteredData, 'pilar', 'voluntarioId');
  const pilarLabels = pilarCounts.map(x=>x[0]);
  const pilarSeries = pilarCounts.map(x=>x[1]);

  // Area - by area (DEVE CONTAR VOLUNTARIOID ÚNICOS POR AREA)
  const areaCounts = groupCountUnique(filteredData, 'area', 'voluntarioId');
  const areaLabels = areaCounts.map(x=>x[0]);
  const areaSeries = areaCounts.map(x=>x[1]);

  // Funcao - by funcao (DEVE CONTAR VOLUNTARIOID ÚNICOS POR FUNÇÃO)
  const funcaoCounts = groupCountUnique(filteredData, 'funcao', 'voluntarioId');
  const funcaoLabels = funcaoCounts.map(x=>x[0]);
  const funcaoSeries = funcaoCounts.map(x=>x[1]);

  // update lists top 10
  // renderList(listFuncao, funcaoCounts.slice(0,20));
  // renderList(listArea, areaCounts.slice(0,20));

  // Render charts (create if null)
  renderDonut('donutPilar', pilarLabels, pilarSeries);
  renderBar('barArea', areaLabels, areaSeries, 'Áreas');
  renderBar('barFuncao', funcaoLabels, funcaoSeries, 'Funções');
}

/* render helpers */
function renderList(container, items){
  container.innerHTML = '';
  if(items.length===0) {
    container.innerHTML = '<div style="padding:12px;color:var(--muted)">Sem dados</div>';
    return;
  }
  items.forEach(([label,count])=>{
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div style="max-width:70%">${escapeHtml(label)}</div><div style="font-weight:700">${count}</div>`;
    container.appendChild(row);
  });
}

function escapeHtml(s){
  return (s+'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
}

/* ApexCharts renderers */
function renderDonut(elId, labels, series){
  const el = document.getElementById(elId);
  if(!el) return;

  // 🎨 Paleta colorida suave e moderna (tons distintos)
  const palette = [
    "#3DAEAB", // teal (tema principal)
    "#FF6B6B", // vermelho coral
    "#FFD93D", // amarelo quente
    "#6BCB77", // verde claro
    "#4D96FF", // azul forte
    "#A66CFF", // roxo
    "#FF8E3C", // laranja
    "#00C2A8", // aqua
    "#C8F560", // verde lima
    "#FF5DA2"  // pink
  ];

  // garante que exista cor para cada label
  const colors = labels.map((_, i) => palette[i % palette.length]);

  const options = {
    chart: { type:'donut', toolbar:{show:false}, animations:{enabled:true} },
    series: series,
    labels: labels,
    colors: colors,

    legend: {
      position:'right',
      labels:{
        colors: 'var(--text)' // texto uniforme
      },
      markers:{
        fillColors: colors // marcadores coloridos
      }
    },

    dataLabels: { enabled:false },
    tooltip: { theme:'dark' },
    title: { text: 'Quantidade por Pilar', style:{color: 'var(--muted)'} },
    responsive: [{ breakpoint:600, options:{ legend:{show:false} } }]
  };

  if(donutChart){
    donutChart.updateOptions({...options, series});
  } else {
    donutChart = new ApexCharts(el, options);
    donutChart.render();
  }
}


function renderBar(elId, labels, series, title){
  const el = document.getElementById(elId);

  if(!el) return;
  const options = {
    chart: { type:'bar', toolbar:{show:false}, animations:{enabled:true} },
    plotOptions: { bar: { horizontal:true, borderRadius: 4,borderRadiusApplication: 'end' } },
    series: [{ name: title, data: series }],
    xaxis: { categories: labels, labels:{style:{colors:[]}, rotate:0} },
    yaxis: {
      labels: {
        style: {
          colors: labels.map(() => 'var(--text)')
        }
      }
    },
    dataLabels: { enabled:true },
    tooltip: { theme:'dark' },
    title: { text: `Quantidade por ${title}`, style:{color: 'var(--muted)'} },
    colors: undefined,
  };
  if(elId === 'barArea') options.chart.height = 100 + 25 * labels.length;
  if(elId === 'barFuncao') options.chart.height = 100 + 25 * labels.length;
  if(elId === 'barFuncao'){  options.series[0].name='Função'; }
  if(barAreaChart && elId==='barArea'){ barAreaChart.updateOptions({...options}); }
  else if(barFuncaoChart && elId==='barFuncao'){ barFuncaoChart.updateOptions({...options}); }
  else {
    if(elId==='barArea'){ barAreaChart = new ApexCharts(el, options); barAreaChart.render(); }
    if(elId==='barFuncao'){ barFuncaoChart = new ApexCharts(el, options); barFuncaoChart.render(); }
  }
}

/* initial placeholder to avoid empty visuals */
function setupPlaceholders(){
  // placeholder empty charts
  renderDonut('donutPilar', ['...'], [0]);
  renderBar('barArea', ['...'], [0], 'Áreas');
  renderBar('barFuncao', ['...'], [0], 'Funções');
}
setupPlaceholders();

/* If you want to load quickly a sample CSV string for testing, you can call:
   Papa.parse(sampleCsvString, {header:true, complete:...})
*/

/* EOF */
