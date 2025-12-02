/*
  Dashboard logic:
  - Usa PapaParse para carregar CSV
  - Calcula contagem de voluntarioId únicos
  - Gera donut (campus), barras (area, funcao)
  - Filtros: area (multi) com opção "Selecionar tudo", campus (single) com "Todos"
  - defaultCsvEntradasUrl: caminho local passado (do histórico). Edite se necessário.
*/

const defaultCsvEntradasUrl = 'csv/pp-v-entradas-s.csv'; // <-- substitua pelo CSV real se quiser

// Nota: por instrução, este caminho foi inserido. Use botão "Carregar CSV" para enviar o arquivo CSV real.

let rawDataEntradas = []; // array of rows as objects
let filteredDataEntradas = [];

const totalEntradas = document.getElementById('totalEntradas');

const areaSelectEntradas = document.getElementById('areaSelectEntradas');
const campusSelectEntradas = document.getElementById('campusSelectEntradas');
const dateStartEntradas = document.getElementById('dateStartEntradas');
const dateEndEntradas = document.getElementById('dateEndEntradas');
const controlsEntradas = document.getElementById('controls-entradas'); 

let showFilterEntradas = false;

function showFilterEntradass(){

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

function formatMonthLabel(iso){ // iso 'yyyy-mm-dd' -> 'mmm/yyyy' pt-BR
  if(!iso) return '';
  const [y,m] = iso.split('-');
  // Cria a data usando o dia 2 para evitar problemas de fuso horário na virada do mês
  const date = new Date(`${y}-${m}-02`); 
  return date.toLocaleString('pt-BR',{month:'short', year:'numeric'});
}

// A função deve obter as referências dos elementos que serão manipulados
function initAfterLoadEntradas(){
  // 1. OBTENÇÃO DOS ELEMENTOS (CRUCIAL para evitar TypeError)
  const areaSelectEntradas = document.getElementById('areaSelectEntradas');
  const campusSelectEntradas = document.getElementById('campusSelectEntradas');
  
  // Novos campos de data
  const dateStartEntradas = document.getElementById('dateStartEntradas');
  const dateEndEntradas = document.getElementById('dateEndEntradas');

  if (!areaSelectEntradas || !campusSelectEntradas || !dateStartEntradas || !dateEndEntradas) {
    console.error("Erro: Um ou mais elementos SELECT não foram encontrados no DOM.");
    return;
  }
  
  // 2. POPULAR SELECTS E TRATAMENTO DE DADOS

  // Popula os arrays de áreas e campus (como no seu código original)
  const areas = Array.from(new Set(rawDataEntradas.map(r=>r.area || 'Não informado'))).filter(Boolean).sort();
  const campus = Array.from(new Set(rawDataEntradas.map(r=>r.campus || 'Não informado'))).filter(Boolean).sort();
  
  // Trata e ordena as datas
  const allDates = Array.from(new Set(rawDataEntradas.map(r=>r.dataReferencia || 'Não informado'))).filter(Boolean);
  
  // Ordena as datas cronologicamente (de mais antiga para mais nova)
  const sortedDatesAsc = allDates.sort((a, b) => new Date(a) - new Date(b));
  
  // A data inicial (mais antiga) será o primeiro elemento
  const minDate = sortedDatesAsc[0]; 
  // A data final (mais recente) será o último elemento
  const maxDate = sortedDatesAsc[sortedDatesAsc.length - 1]; 

  // --- LÓGICA PARA POPULAR DATA INÍCIO E DATA FIM ---
  
  // 3. POPULAR COMBOS DE DATA
  
  dateStartEntradas.innerHTML = '';
  dateEndEntradas.innerHTML = '';

  sortedDatesAsc.forEach(date => {
    // Aplica a função de formatação para o texto exibido
    const formattedText = formatMonthLabel(date); 
    
    // Cria options para a data inicial
    const optStart = document.createElement('option');
    optStart.value = date;             // Mantém 'yyyy-mm-dd' no VALUE
    optStart.innerText = formattedText; // Exibe 'mmm/yyyy'
    dateStartEntradas.appendChild(optStart);
    
    // Cria options para a data final
    const optEnd = document.createElement('option');
    optEnd.value = date;             // Mantém 'yyyy-mm-dd' no VALUE
    optEnd.innerText = formattedText; // Exibe 'mmm/yyyy'
    dateEndEntradas.appendChild(optEnd);
  });
  
  // 4. SETAR VALORES DEFAULT
  
  // Data Inicial (dateStartEntradas): Seta para a data mais antiga
  if (minDate) {
    dateStartEntradas.value = minDate;
  }

  // Data Final (dateEndEntradas): Seta para a data mais recente
  if (maxDate) {
    dateEndEntradas.value = maxDate;
  }
  
  // --- RESTO DO CÓDIGO (ÁREA E CAMPUS) ---

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

  // 5. LISTENERS
  
  // Adiciona listeners para os novos combos de data
  dateStartEntradas.addEventListener('change', onFilterChangeEntradas);
  dateEndEntradas.addEventListener('change', onFilterChangeEntradas);
  
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
  // 1. OBTENÇÃO DOS FILTROS

  // Filtros de Data (obtidos do value, que é 'AAAA-MM-DD')
  const startDate = dateStartEntradas.value; 
  const endDate = dateEndEntradas.value;

  // Converte as datas para timestamps para facilitar a comparação.
  // Usamos 'T00:00:00' para garantir que a data inicial comece no início do dia.
  // ATENÇÃO: Se as datas de referência no rawDataEntradas tiverem horário, você precisa ajustar a comparação.
  const startTimestamp = new Date(startDate + 'T00:00:00').getTime();
  const endTimestamp = new Date(endDate + 'T00:00:00').getTime(); 

  // Filtros de Multi-Seleção
  const selectedAreas = Array.from(areaSelectEntradas.selectedOptions).map(o=>o.value).filter(v=>v!=='__ALL__');
  const selectedcampuses = Array.from(campusSelectEntradas.selectedOptions)
    .map(o => o.value)
    .filter(v => v !== '__ALL__');

  // 2. APLICAÇÃO DO FILTRO
  filteredDataEntradas = rawDataEntradas.filter(r=>{
    
    // --- FILTRO DE DATAS ---
    // Cria o timestamp da data de referência do item atual
    const itemDateTimestamp = new Date(r.dataReferencia + 'T00:00:00').getTime();
    
    // Verifica se a data do item está DENTRO do intervalo: start <= item <= end
    const dateOk = itemDateTimestamp >= startTimestamp && itemDateTimestamp <= endTimestamp;

    // Se o item não estiver no intervalo de data, ele é descartado imediatamente
    if (!dateOk) return false;

    // --- FILTRO DE ÁREA ---
    const areaOk = selectedAreas.length===0 ? true : selectedAreas.includes((r.area||'').toString());
    
    // --- FILTRO DE CAMPUS ---
    const campusOk = selectedcampuses.length === 0
        ? true
        : selectedcampuses.includes((r.campus || '').toString());
        
    // O item deve passar pelos filtros de área e campus
    return areaOk && campusOk;
  });

  // 3. ATUALIZAÇÃO DO TEXTO (Opcional, se o texto de campus precisar ser ajustado)
  const aText = selectedAreas.length ? selectedAreas.join(', ') : 'Todas';
  const pText = selectedcampuses.length ? selectedcampuses.join(', ') : 'Todos';
  
  // Se você tiver um elemento para exibir o intervalo de data:
  // Exemplo: const dText = `${startDate} até ${endDate}`; 

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
function groupCountEntradasUnique(data, groupKey, countKey, orderBy = null) {
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
  if(orderBy) result.sort((a, b) => a[0].localeCompare(b[0]));

  return result;
}

/* Charts objects */
let donutCampusEntradaChart = null;
let donutSexoEntradaChart = null;
let barAreaEntradaChart = null;
let barFaixaEtariaEntradaChart = null;
let lineDataReferenciaEntradaChart = null;

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
  const dataReferenciaCounts = groupCountEntradasUnique(filteredDataEntradas, 'dataReferencia', 'voluntarioId', '0-asc');
  const dataReferenciaLabels = dataReferenciaCounts.map(x=>x[0]);
  const dataReferenciaSeries = dataReferenciaCounts.map(x=>x[1]);


  // Render charts (create if null)
  renderDonutEntrada('donutCampusEntrada', campusLabels, campusSeries, 'Escala');
  renderDonutEntrada('donutSexoEntrada', sexoLabels, sexoSeries, 'Gênero');
  renderBarEntrada('barAreaEntrada', areaLabels, areaSeries, 'Áreas');
  renderBarEntrada('barFaixaEtariaEntrada', faixaEtariaLabels, faixaEtariaSeries, 'Faixa Etária');
  renderLineEntrada('lineDataReferenciaEntrada', dataReferenciaLabels, dataReferenciaSeries, 'Mês');
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
function renderDonutEntrada(elId, labels, series, title){
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

    dataLabels: { 
      enabled: true, // Ativado para mostrar números
      formatter: function(val, opts) {
        return opts.w.config.series[opts.seriesIndex]; // Mostra o valor absoluto
      },
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        colors: ['#fff'] // Cor branca para contraste
      },
      dropShadow: {
        enabled: true,
        blur: 3,
        opacity: 0.8
      }
    },

    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text)',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              }
            }
          }
        }
      }
    },

    tooltip: { theme:'dark' },
    title: { text: `Entradas por ${title}`, style:{color: 'var(--muted)'} },
    responsive: [{ breakpoint:600, options:{ legend:{show:false} } }]
  };

  if(donutCampusEntradaChart && elId==='donutCampusEntrada'){
    donutCampusEntradaChart.updateOptions({...options, series});
  } else {
    if(elId==='donutCampusEntrada'){ donutCampusEntradaChart = new ApexCharts(el, options); donutCampusEntradaChart.render(); }
  }

  if(elId === 'donutSexoEntrada') options.chart.height = 212;
  if(donutSexoEntradaChart && elId==='donutSexoEntrada'){
    donutSexoEntradaChart.updateOptions({...options, series});
  } else {
    if(elId==='donutSexoEntrada'){ donutSexoEntradaChart = new ApexCharts(el, options); donutSexoEntradaChart.render(); }
  }
}


function renderBarEntrada(elId, labels, series, title){
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
  if(elId === 'barAreaEntrada') options.chart.height = 100 + 25 * labels.length;
  if(elId === 'barFaixaEtariaEntrada') options.chart.height = 100 + 25 * labels.length;
  // if(elId === 'barFaixaEtariaEntrada'){  options.series[0].name='Faixa Etária'; }
  if(barAreaEntradaChart && elId==='barAreaEntrada'){ barAreaEntradaChart.updateOptions({...options}); }
  else if(barFaixaEtariaEntradaChart && elId==='barFaixaEtariaEntrada'){ barFaixaEtariaEntradaChart.updateOptions({...options}); }
  else {
    if(elId==='barAreaEntrada'){ barAreaEntradaChart = new ApexCharts(el, options); barAreaEntradaChart.render(); }
    if(elId==='barFaixaEtariaEntrada'){ barFaixaEtariaEntradaChart = new ApexCharts(el, options); barFaixaEtariaEntradaChart.render(); }
  }
}

function renderLineEntrada(elId, labels, series, title){

  // console.log(labels);

  for(let i=0;i<labels.length;i++){
    labels[i] = formatMonthLabel(labels[i]);
  }

  // console.log(labels);

  const el = document.getElementById(elId);
  if(!el) return;
  
  const options = {
    chart:{ type:'line', toolbar:{show:false}, zoom:{enabled:false} },
    series:[{ name: title, data: series }], 
    xaxis:{ categories: labels, labels:{ style:{ colors: labels.map(()=> 'var(--text)') } } },
    yaxis:{ labels:{ style:{ colors: ['var(--text)'] } } },
    dataLabels:{ enabled:false },
    stroke:{ curve:'smooth' },
    tooltip:{ theme:'dark' },
    title:{ text:`Entradas por ${title}`, style:{ color:'var(--muted)'} },
  };
  
  if(lineDataReferenciaEntradaChart) {
    // 💡 CORREÇÃO APLICADA: Passe o objeto options completo, sem sobrescrever series
    lineDataReferenciaEntradaChart.updateOptions(options, false, true); 
    // O segundo 'false' e o terceiro 'true' são opcionais, 
    // mas indicam que não queremos resetar o zoom e queremos redesenhar.
  }
  else { 
    lineDataReferenciaEntradaChart = new ApexCharts(el, options); 
    lineDataReferenciaEntradaChart.render(); 
  }
}

/* initial placeholder to avoid empty visuals */
function setupPlaceholders(){
  // placeholder empty charts
  renderDonutEntrada('donutCampusEntrada', ['...'], [0], 'Escala');
  renderDonutEntrada('donutSexoEntrada', ['...'], [0], 'Gênero');
  renderBarEntrada('barAreaEntrada', ['...'], [0], 'Áreas');
  renderBarEntrada('barFaixaEtariaEntrada', ['...'], [0], 'Faixa Etária');
  renderLineEntrada('lineDataReferenciaEntrada', ['...'], [0], 'Mês');
}
setupPlaceholders();

/* If you want to load quickly a sample CSV string for testing, you can call:
   Papa.parse(sampleCsvString, {header:true, complete:...})
*/

/* EOF */
