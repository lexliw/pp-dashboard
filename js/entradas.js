/*
  Dashboard logic:
  - Usa PapaParse para carregar CSV
  - Calcula contagem de voluntarioId únicos
  - Gera donut (campus), barras (area, funcao)
  - Filtros: area (multi) com opção "Selecionar tudo", campus (single) com "Todos"
  - defaultCsvEntradasUrl: caminho local passado (do histórico). Edite se necessário.
*/

const defaultCsvEntradasUrl = 'csv/pp-v-Entradas-s.csv'; // <-- substitua pelo CSV real se quiser

// Nota: por instrução, este caminho foi inserido. Use botão "Carregar CSV" para enviar o arquivo CSV real.

let rawDataEntradas = []; // array of rows as objects
let filteredDataEntradas = [];

const totalEntradas = document.getElementById('totalEntradas');

const areaSelectEntradas = document.getElementById('areaSelectEntradas');
const campusSelectEntradas = document.getElementById('campusSelectEntradas');


// TODO: configurar esse id 
const controlsEntradas = document.getElementById('controls-Entradas'); 


let showFilterEntradas = false;

function showFilterEntradas(){

    if(showFilterEntradas){
        controlsEntradas.style.display = 'none';
        showFilterEntradas = false;
    }else{
        controlsEntradas.style.display = 'flex';
        showFilterEntradas = true;
    }
}


document.getElementById('csvFileEntradas').addEventListener('change', (ev)=>{
  const f = ev.target.files[0];
  if(!f) return;
  Papa.parse(f, {
    header:true,
    skipEmptyLines:true,
    complete: (results) => {
      rawDataEntradas = results.data.map(normalizeRowEntradas);
      initAfterLoadEntradas();
    }
  });
});

document.getElementById('btnLoadDefault').addEventListener('click', ()=>{ loadDefaultEntradas(); });

// Load CSV default
function loadDefaultEntradas(){
  fetch(defaultCsvEntradasUrl).then(r => {
    if(!r.ok) throw new Error('Erro ao carregar arquivo padrão. Talvez o caminho não seja CSV.');
    return r.text();
  }).then(txt => {
    const results = Papa.parse(txt, { header:true, skipEmptyLines:true });
    rawDataEntradas = results.data.map(normalizeRowEntradas);
    initAfterLoadEntradas();
  }).catch(err=>{
    alert('Falha ao carregar CSV padrão: ' + err.message + '\nUse o botão "Carregar CSV" para enviar um arquivo .csv local.');
    console.error(err);
  });
}

loadDefaultEntradas();

// Normalize keys to expected column names (lowercase, trimmed)
function normalizeRowEntradas(row){
  const map = {};
  for(const k of Object.keys(row)){
    const key = k.trim().toLowerCase();
    map[key] = row[k] ? row[k].trim() : '';
  }
  // ensure expected fields exist(dataReferencia, sexo, idade, area, campus, faixaEtaria, voluntarioId)
  return {
    dataReferencia: map['dataReferencia'] ?? map['datareferencia'] ?? '',
    sexo: map['sexo'] ?? '',
    idade: map['idade'] ?? '',
    area: map['area'] ?? '',
    campus: map['campus'] ?? '',
    faixaEtaria: map['faixaEtaria'] ?? map['faixaetaria'] ?? '',
    voluntarioId: map['voluntarioid'] ?? map['voluntárioid'] ?? map['voluntario_id'] ?? ''
  };
}

function initAfterLoadEntradas(){
  // populate selects
  const areas = Array.from(new Set(rawDataEntradas.map(r=>r.area || 'Não informado'))).filter(Boolean).sort();
  const campus = Array.from(new Set(rawDataEntradas.map(r=>r.campus || 'Não informado'))).filter(Boolean).sort();

  // areaSelectEntradas: add "Selecionar tudo" as first option
  areaSelectEntradas.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = '__ALL__';
  optAll.innerText = 'Selecionar tudo';
  areaSelectEntradas.appendChild(optAll);
  areas.forEach(a=>{
    const o = document.createElement('option');
    o.value = a;
    o.innerText = a;
    areaSelectEntradas.appendChild(o);
  });
  // select all by default
  for(let i=0;i<areaSelectEntradas.options.length;i++){
    areaSelectEntradas.options[i].selected = true;
  }

  // campus multi-select com "Selecionar tudo"
  campusSelectEntradas.innerHTML = '';
  const campusAll = document.createElement('option');
  campusAll.value = '__ALL__';
  campusAll.innerText = 'Selecionar tudo';
  campusSelectEntradas.appendChild(campusAll);
  
  campus.forEach(p => {
    const o = document.createElement('option');
    o.value = p;
    o.innerText = p;
    campusSelectEntradas.appendChild(o);
  });

  // seleciona tudo por padrão
  for (let i = 0; i < campusSelectEntradas.options.length; i++) {
    campusSelectEntradas.options[i].selected = true;
  }

  // listeners
  areaSelectEntradas.addEventListener('change', onFilterChangeEntradas);
  campusSelectEntradas.addEventListener('change', onFilterChangeEntradas);

  // initial filter and draw
  applyFiltersAndUpdateEntradas();
}

function onFilterChangeEntradas() {
  // Área
  const optAllArea = Array.from(areaSelectEntradas.options).find(o => o.value === '__ALL__');
  if (optAllArea) {
    const selected = Array.from(areaSelectEntradas.selectedOptions).map(o => o.value);
    if (selected.includes('__ALL__')) {
      for (let i = 0; i < areaSelectEntradas.options.length; i++) {
        areaSelectEntradas.options[i].selected = true;
      }
    } else if (selected.length === 0) {
      for (let i = 0; i < areaSelectEntradas.options.length; i++) {
        areaSelectEntradas.options[i].selected = true;
      }
    } else {
      optAllArea.selected = false;
    }
  }

  // campus — mesma lógica
  const optAllcampus = Array.from(campusSelectEntradas.options).find(o => o.value === '__ALL__');
  if (optAllcampus) {
    const selected = Array.from(campusSelectEntradas.selectedOptions).map(o => o.value);
    if (selected.includes('__ALL__')) {
      for (let i = 0; i < campusSelectEntradas.options.length; i++) {
        campusSelectEntradas.options[i].selected = true;
      }
    } else if (selected.length === 0) {
      for (let i = 0; i < campusSelectEntradas.options.length; i++) {
        campusSelectEntradas.options[i].selected = true;
      }
    } else {
      optAllcampus.selected = false;
    }
  }

  applyFiltersAndUpdateEntradas();
}


function applyFiltersAndUpdateEntradas(){
  const selectedAreas = Array.from(areaSelectEntradas.selectedOptions).map(o=>o.value).filter(v=>v!=='__ALL__');
//   const selectedcampus = campusSelectEntradas.value;
  const selectedcampuses = Array.from(campusSelectEntradas.selectedOptions)
    .map(o => o.value)
    .filter(v => v !== '__ALL__');

  filteredDataEntradas = rawDataEntradas.filter(r=>{
    const areaOk = selectedAreas.length===0 ? true : selectedAreas.includes((r.area||'').toString());
    const campusOk = selectedcampuses.length === 0
        ? true
        : selectedcampuses.includes((r.campus || '').toString());
    return areaOk && campusOk;
  });

  // update applied filters text
  const aText = selectedAreas.length ? selectedAreas.join(', ') : 'Todas';
  const pText = selectedcampuses.length ? selectedcampuses.join(', ') : 'Todos';

  updateCountsAndChartsEntradas();
}

/* UTIL counting and grouping */
function uniqueCountByKeyEntradas(array, key){
  const s = new Set();
  array.forEach(r=>{
    const v = (r[key] || '').toString().trim();
    if(v) s.add(v);
  });
  return s.size;
}

function groupCountEntradas(array, key){
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
 * @param {string} groupKey - A chave para agrupar (ex: 'campus').
 * @param {string} countKey - A chave para contar os únicos (ex: 'voluntarioId').
 * @returns {Array<[string, number]>} Um array de arrays [label, count].
 */
function groupCountEntradasUnique(data, groupKey, countKey) {
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
let donutCampusEntradasChart = null;
let donutSexoEntradasChart = null;
let barAreaEntradasChart = null;
let barFaixaEtariaEntradasChart = null;

function updateCountsAndChartsEntradas(){
  // big number: unique voluntarioId in filteredDataEntradas (but we should count unique in whole source or filtered? requirement: "contar todos voluntarioId do arquivo .csv ... tirar duplicados" -> count across file. We'll show count across currently filtered set? The requirement asked big number to display total of people counting all volunteer IDs from CSV removing duplicates. We'll display the count on the CURRENT FILTERED dataset but keep a note: we'll show both: default show unique total of ALL and filtered below)
  const uniqueTotalAll = uniqueCountByKeyEntradas(rawDataEntradas, 'voluntarioId');
  const uniqueFiltered = uniqueCountByKeyEntradas(filteredDataEntradas, 'voluntarioId');

  // Display filtered count (primary) and show full total in tooltip via title attribute
  totalEntradas.innerText = uniqueFiltered;
  totalEntradas.title = `Total únicos no CSV (sem filtros): ${uniqueTotalAll}`;

  // Donut - by campus (DEVE CONTAR VOLUNTARIOID ÚNICOS POR campus)
  const campusCounts = groupCountEntradasUnique(filteredDataEntradas, 'campus', 'voluntarioId');
  const campusLabels = campusCounts.map(x=>x[0]);
  const campusSeries = campusCounts.map(x=>x[1]);

  // Donut - by sexo (DEVE CONTAR VOLUNTARIOID ÚNICOS POR sexo)
  const sexoCounts = groupCountEntradasUnique(filteredDataEntradas, 'sexo', 'voluntarioId');
  const sexoLabels = sexoCounts.map(x=>x[0]);
  const sexoSeries = sexoCounts.map(x=>x[1]);

  // Bar - by area (DEVE CONTAR VOLUNTARIOID ÚNICOS POR AREA)
  const areaCounts = groupCountEntradasUnique(filteredDataEntradas, 'area', 'voluntarioId');
  const areaLabels = areaCounts.map(x=>x[0]);
  const areaSeries = areaCounts.map(x=>x[1]);

  // Bar - by faixaEtaria (DEVE CONTAR VOLUNTARIOID ÚNICOS POR faixaEtaria) 
  const faixaEtariaCounts = groupCountEntradasUnique(filteredDataEntradas, 'faixaEtaria', 'voluntarioId');
  const faixaEtariaLabels = faixaEtariaCounts.map(x=>x[0]);
  const faixaEtariaSeries = faixaEtariaCounts.map(x=>x[1]);

  // Line - by area (DEVE CONTAR VOLUNTARIOID ÚNICOS POR dataReferencia)
  const dataReferenciaCounts = groupCountEntradasUnique(filteredDataEntradas, 'dataReferencia', 'voluntarioId');
  const dataReferenciaLabels = dataReferenciaCounts.map(x=>x[0]);
  const dataReferenciaSeries = dataReferenciaCounts.map(x=>x[1]);


  // Render charts (create if null)
  renderDonutEntradas('donutCampusEntradas', campusLabels, campusSeries, 'Escala');
  renderDonutEntradas('donutSexoEntradas', sexoLabels, sexoSeries, 'Gênero');
  renderBarEntradas('barAreaEntradas', areaLabels, areaSeries, 'Áreas');
  renderBarEntradas('barFaixaEtariaEntradas', faixaEtariaLabels, faixaEtariaSeries, 'Faixa Etária');
  // renderLineEntradas('lineDataReferenciaEntradas', dataReferenciaLabels, dataReferenciaSeries, 'Data de Referência');
}

/* render helpers */
function renderListEntradas(container, items){
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
function renderDonutEntradas(elId, labels, series, title){
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
    title: { text: `Entradas por ${title}`, style:{color: 'var(--muted)'} },
    responsive: [{ breakpoint:600, options:{ legend:{show:false} } }]
  };

  if(donutCampusEntradasChart && elId==='donutCampusEntradas'){
    donutCampusEntradasChart.updateOptions({...options, series});
  } else {
    if(elId==='donutCampusEntradas'){ donutCampusEntradasChart = new ApexCharts(el, options); donutCampusEntradasChart.render(); }
  }

  if(donutSexoEntradasChart && elId==='donutSexoEntradas'){
    donutSexoEntradasChart.updateOptions({...options, series});
  } else {
    if(elId==='donutSexoEntradas'){ donutSexoEntradasChart = new ApexCharts(el, options); donutSexoEntradasChart.render(); }
  }
}


function renderBarEntradas(elId, labels, series, title){
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
    title: { text: `Entradas por ${title}`, style:{color: 'var(--muted)'} },
    colors: undefined,
  };
  if(elId === 'barAreaEntradas') options.chart.height = 100 + 25 * labels.length;
  if(elId === 'barFaixaEtariaEntradas') options.chart.height = 100 + 25 * labels.length;
  // if(elId === 'barFaixaEtariaEntradas'){  options.series[0].name='Faixa Etária'; }
  if(barAreaEntradasChart && elId==='barAreaEntradas'){ barAreaEntradasChart.updateOptions({...options}); }
  else if(barFaixaEtariaEntradasChart && elId==='barFaixaEtariaEntradas'){ barFaixaEtariaEntradasChart.updateOptions({...options}); }
  else {
    if(elId==='barAreaEntradas'){ barAreaEntradasChart = new ApexCharts(el, options); barAreaEntradasChart.render(); }
    if(elId==='barFaixaEtariaEntradas'){ barFaixaEtariaEntradasChart = new ApexCharts(el, options); barFaixaEtariaEntradasChart.render(); }
  }
}

/* initial placeholder to avoid empty visuals */
function setupPlaceholders(){
  // placeholder empty charts
  renderDonutEntradas('donutCampusEntradas', ['...'], [0], 'Escala');
  renderDonutEntradas('donutSexoEntradas', ['...'], [0], 'Gênero');
  renderBarEntradas('barAreaEntradas', ['...'], [0], 'Áreas');
  renderBarEntradas('barFaixaEtariaEntradas', ['...'], [0], 'Faixa Etária');
  // renderLineEntradas('lineDataReferenciaEntradas', ['...'], [0], 'Data de Referência');
}
setupPlaceholders();

/* If you want to load quickly a sample CSV string for testing, you can call:
   Papa.parse(sampleCsvString, {header:true, complete:...})
*/

/* EOF */
