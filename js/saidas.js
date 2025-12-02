/*
  Dashboard logic:
  - Usa PapaParse para carregar CSV
  - Calcula contagem de voluntarioId únicos
  - Gera donut (local), barras (area, funcao)
  - Filtros: area (multi) com opção "Selecionar tudo", local (single) com "Todos"
  - defaultCsvSaidasUrl: caminho local passado (do histórico). Edite se necessário.
*/

const defaultCsvSaidasUrl = 'csv/pp-v-saidas-s.csv'; // <-- substitua pelo CSV real se quiser

// Nota: por instrução, este caminho foi inserido. Use botão "Carregar CSV" para enviar o arquivo CSV real.

let rawDataSaidas = []; // array of rows as objects
let filteredDataSaidas = [];

const totalSaidas = document.getElementById('totalSaidas');
const mediaTempoSaidas = document.getElementById('mediaTempoSaidas');

const areaSelectSaidas = document.getElementById('areaSelectSaidas');
const localSelectSaidas = document.getElementById('localSelectSaidas');
const dateStartSaidas = document.getElementById('dateStartSaidas');
const dateEndSaidas = document.getElementById('dateEndSaidas');
const controlsSaidas = document.getElementById('controls-saidas'); 

let showFilterSaidas = false;

function showFilterSaidass(){

    if(showFilterSaidas){
        controlsSaidas.style.display = 'none';
        showFilterSaidas = false;
    }else{
        controlsSaidas.style.display = 'flex';
        showFilterSaidas = true;
    }
}


document.getElementById('csvFileSaidas').addEventListener('change', (ev)=>{
  const f = ev.target.files[0];
  if(!f) return;
  Papa.parse(f, {
    header:true,
    skipEmptyLines:true,
    complete: (results) => {
      rawDataSaidas = results.data.map(normalizeRowSaidas);
      initAfterLoadSaidas();
    }
  });
});

document.getElementById('btnLoadDefault').addEventListener('click', ()=>{ loadDefaultSaidas(); });

// Load CSV default
function loadDefaultSaidas(){
  fetch(defaultCsvSaidasUrl).then(r => {
    if(!r.ok) throw new Error('Erro ao carregar arquivo padrão. Talvez o caminho não seja CSV.');
    return r.text();
  }).then(txt => {
    const results = Papa.parse(txt, { header:true, skipEmptyLines:true });
    rawDataSaidas = results.data.map(normalizeRowSaidas);
    initAfterLoadSaidas();
  }).catch(err=>{
    alert('Falha ao carregar CSV padrão: ' + err.message + '\nUse o botão "Carregar CSV" para enviar um arquivo .csv local.');
    console.error(err);
  });
}

loadDefaultSaidas();

// Normalize keys to expected column names (lowercase, trimmed)
function normalizeRowSaidas(row){
  const map = {};
  for(const k of Object.keys(row)){
    const key = k.trim().toLowerCase();
    map[key] = row[k] ? row[k].trim() : '';
  }
  // ensure expected fields exist:
  // genero,area,local,dataInforme,dataSaida,dataInicio,dataNascimento,voluntarioId,idade,mesSaida,tempoServicoEmDias,tempoServicoEmMeses,faixaTempoServico,faixaEtaria
  return {
    
    genero: map['genero'] ?? '',
    area: map['area'] ?? '',
    local: map['local'] ?? '',
    dataInforme: map['dataInforme'] ?? map['datainforme'] ?? '',
    dataSaida: map['dataSaida'] ?? map['datasaida'] ?? '',
    dataInicio: map['dataInicio'] ?? map['datainicio'] ?? '',
    dataNascimento: map['dataNascimento'] ?? map['datanascimento'] ?? '',
    voluntarioId: map['voluntarioId'] ?? map['voluntarioid'] ?? '',
    idade: map['idade'] ?? '',
    mesSaida: map['mesSaida'] ?? map['messaida'] ?? '',
    tempoServicoEmDias: map['tempoServicoEmDias'] ?? map['temposervicoemdias'] ?? '',
    tempoServicoEmMeses: map['tempoServicoEmMeses'] ?? map['temposervicoemmeses'] ?? '',
    faixaTempoServico: map['faixaTempoServico'] ?? map['faixatemposervico'] ?? '',
    faixaEtaria: map['faixaEtaria'] ?? map['faixaetaria'] ?? '',

    // dataReferencia: map['dataReferencia'] ?? map['datareferencia'] ?? '',
    // idade: map['idade'] ?? '',
    // area: map['area'] ?? '',
    // campus: map['campus'] ?? '',
    // faixaEtaria: map['faixaEtaria'] ?? map['faixaetaria'] ?? '',
    // voluntarioId: map['voluntarioid'] ?? map['voluntárioid'] ?? map['voluntario_id'] ?? ''
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
function initAfterLoadSaidas(){
  // 1. OBTENÇÃO DOS ELEMENTOS (CRUCIAL para evitar TypeError)
  const areaSelectSaidas = document.getElementById('areaSelectSaidas');
  const localSelectSaidas = document.getElementById('localSelectSaidas');
  
  // Novos campos de data
  const dateStartSaidas = document.getElementById('dateStartSaidas');
  const dateEndSaidas = document.getElementById('dateEndSaidas');

  if (!areaSelectSaidas || !localSelectSaidas || !dateStartSaidas || !dateEndSaidas) {
    console.error("Erro: Um ou mais elementos SELECT não foram encontrados no DOM.");
    return;
  }
  
  // 2. POPULAR SELECTS E TRATAMENTO DE DADOS

  // Popula os arrays de áreas e local (como no seu código original)
  const areas = Array.from(new Set(rawDataSaidas.map(r=>r.area || 'Não informado'))).filter(Boolean).sort();
  const local = Array.from(new Set(rawDataSaidas.map(r=>r.local || 'Não informado'))).filter(Boolean).sort();
  
  // Trata e ordena as datas
  const allDates = Array.from(new Set(rawDataSaidas.map(r=>r.mesSaida || 'Não informado'))).filter(Boolean);
  
  // Ordena as datas cronologicamente (de mais antiga para mais nova)
  const sortedDatesAsc = allDates.sort((a, b) => new Date(a) - new Date(b));
  
  // A data inicial (mais antiga) será o primeiro elemento
  const minDate = sortedDatesAsc[0]; 
  // A data final (mais recente) será o último elemento
  const maxDate = sortedDatesAsc[sortedDatesAsc.length - 1]; 

  // --- LÓGICA PARA POPULAR DATA INÍCIO E DATA FIM ---
  
  // 3. POPULAR COMBOS DE DATA
  
  dateStartSaidas.innerHTML = '';
  dateEndSaidas.innerHTML = '';

  sortedDatesAsc.forEach(date => {
    // Aplica a função de formatação para o texto exibido
    const formattedText = formatMonthLabel(date); 
    
    // Cria options para a data inicial
    const optStart = document.createElement('option');
    optStart.value = date;             // Mantém 'yyyy-mm-dd' no VALUE
    optStart.innerText = formattedText; // Exibe 'mmm/yyyy'
    dateStartSaidas.appendChild(optStart);
    
    // Cria options para a data final
    const optEnd = document.createElement('option');
    optEnd.value = date;             // Mantém 'yyyy-mm-dd' no VALUE
    optEnd.innerText = formattedText; // Exibe 'mmm/yyyy'
    dateEndSaidas.appendChild(optEnd);
  });
  
  // 4. SETAR VALORES DEFAULT
  
  // Data Inicial (dateStartSaidas): Seta para a data mais antiga
  if (minDate) {
    dateStartSaidas.value = minDate;
  }

  // Data Final (dateEndSaidas): Seta para a data mais recente
  if (maxDate) {
    dateEndSaidas.value = maxDate;
  }
  
  // --- RESTO DO CÓDIGO (ÁREA E LOCAL) ---

  // areaSelectSaidas: add "Selecionar tudo" as first option
  areaSelectSaidas.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = '__ALL__';
  optAll.innerText = 'Selecionar tudo';
  areaSelectSaidas.appendChild(optAll);
  areas.forEach(a=>{
    const o = document.createElement('option');
    o.value = a;
    o.innerText = a;
    areaSelectSaidas.appendChild(o);
  });
  // select all by default
  for(let i=0;i<areaSelectSaidas.options.length;i++){
    areaSelectSaidas.options[i].selected = true;
  }

  // local multi-select com "Selecionar tudo"
  localSelectSaidas.innerHTML = '';
  const localAll = document.createElement('option');
  localAll.value = '__ALL__';
  localAll.innerText = 'Selecionar tudo';
  localSelectSaidas.appendChild(localAll);
  
  local.forEach(p => {
    const o = document.createElement('option');
    o.value = p;
    o.innerText = p;
    localSelectSaidas.appendChild(o);
  });

  // seleciona tudo por padrão
  for (let i = 0; i < localSelectSaidas.options.length; i++) {
    localSelectSaidas.options[i].selected = true;
  }

  // 5. LISTENERS
  
  // Adiciona listeners para os novos combos de data
  dateStartSaidas.addEventListener('change', onFilterChangeSaidas);
  dateEndSaidas.addEventListener('change', onFilterChangeSaidas);
  
  areaSelectSaidas.addEventListener('change', onFilterChangeSaidas);
  localSelectSaidas.addEventListener('change', onFilterChangeSaidas);

  // initial filter and draw
  applyFiltersAndUpdateSaidas();
}

function onFilterChangeSaidas() {
  // Área
  const optAllArea = Array.from(areaSelectSaidas.options).find(o => o.value === '__ALL__');
  if (optAllArea) {
    const selected = Array.from(areaSelectSaidas.selectedOptions).map(o => o.value);
    if (selected.includes('__ALL__')) {
      for (let i = 0; i < areaSelectSaidas.options.length; i++) {
        areaSelectSaidas.options[i].selected = true;
      }
    } else if (selected.length === 0) {
      for (let i = 0; i < areaSelectSaidas.options.length; i++) {
        areaSelectSaidas.options[i].selected = true;
      }
    } else {
      optAllArea.selected = false;
    }
  }

  // local — mesma lógica
  const optAlllocal = Array.from(localSelectSaidas.options).find(o => o.value === '__ALL__');
  if (optAlllocal) {
    const selected = Array.from(localSelectSaidas.selectedOptions).map(o => o.value);
    if (selected.includes('__ALL__')) {
      for (let i = 0; i < localSelectSaidas.options.length; i++) {
        localSelectSaidas.options[i].selected = true;
      }
    } else if (selected.length === 0) {
      for (let i = 0; i < localSelectSaidas.options.length; i++) {
        localSelectSaidas.options[i].selected = true;
      }
    } else {
      optAlllocal.selected = false;
    }
  }

  applyFiltersAndUpdateSaidas();
}


function applyFiltersAndUpdateSaidas(){
  // 1. OBTENÇÃO DOS FILTROS

  // Filtros de Data (obtidos do value, que é 'AAAA-MM-DD')
  const startDate = dateStartSaidas.value; 
  const endDate = dateEndSaidas.value;

  // Converte as datas para timestamps para facilitar a comparação.
  // Usamos 'T00:00:00' para garantir que a data inicial comece no início do dia.
  // ATENÇÃO: Se as datas de referência no rawDataSaidas tiverem horário, você precisa ajustar a comparação.
  const startTimestamp = new Date(startDate + 'T00:00:00').getTime();
  const endTimestamp = new Date(endDate + 'T00:00:00').getTime(); 

  // Filtros de Multi-Seleção
  const selectedAreas = Array.from(areaSelectSaidas.selectedOptions).map(o=>o.value).filter(v=>v!=='__ALL__');
  const selectedlocales = Array.from(localSelectSaidas.selectedOptions)
    .map(o => o.value)
    .filter(v => v !== '__ALL__');

  // 2. APLICAÇÃO DO FILTRO
  filteredDataSaidas = rawDataSaidas.filter(r=>{
    
    // --- FILTRO DE DATAS ---
    // Cria o timestamp da data de referência do item atual
    const itemDateTimestamp = new Date(r.mesSaida + 'T00:00:00').getTime();
    
    // Verifica se a data do item está DENTRO do intervalo: start <= item <= end
    const dateOk = itemDateTimestamp >= startTimestamp && itemDateTimestamp <= endTimestamp;

    // Se o item não estiver no intervalo de data, ele é descartado imediatamente
    if (!dateOk) return false;

    // --- FILTRO DE ÁREA ---
    const areaOk = selectedAreas.length===0 ? true : selectedAreas.includes((r.area||'').toString());
    
    // --- FILTRO DE LOCAL ---
    const localOk = selectedlocales.length === 0
        ? true
        : selectedlocales.includes((r.local || '').toString());
        
    // O item deve passar pelos filtros de área e local
    return areaOk && localOk;
  });

  // 3. ATUALIZAÇÃO DO TEXTO (Opcional, se o texto de local precisar ser ajustado)
  const aText = selectedAreas.length ? selectedAreas.join(', ') : 'Todas';
  const pText = selectedlocales.length ? selectedlocales.join(', ') : 'Todos';
  
  // Se você tiver um elemento para exibir o intervalo de data:
  // Exemplo: const dText = `${startDate} até ${endDate}`; 

  updateCountsAndChartsSaidas();
}

/* UTIL counting and grouping */
function uniqueCountByKeySaidas(array, key){
  const s = new Set();
  array.forEach(r=>{
    const v = (r[key] || '').toString().trim();
    if(v) s.add(v);
  });
  return s.size;
}

function mediaByKeySaidas(array, key){
  let totalMeses = 0;
  let quantidadeLinhas = 0;
  array.forEach(r => {
    const valor = parseInt(r[key], 10);
    if(!isNaN(valor)){
      totalMeses += valor;
      quantidadeLinhas++;
    }
  });
  return (totalMeses / quantidadeLinhas).toFixed(2);
}


function groupCountSaidas(array, key){
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
 * @param {string} groupKey - A chave para agrupar (ex: 'local').
 * @param {string} countKey - A chave para contar os únicos (ex: 'voluntarioId').
 * @returns {Array<[string, number]>} Um array de arrays [label, count].
 */
function groupCountSaidasUnique(data, groupKey, countKey, orderBy = null) {
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
let donutLocalSaidaChart = null;
let donutGeneroSaidaChart = null;
let donutTempoServicoSaidaChart = null;
let barAreaSaidaChart = null;
let barFaixaEtariaSaidaChart = null;
let lineMesSaidaSaidaChart = null;

function updateCountsAndChartsSaidas(){
  // big number: unique voluntarioId in filteredDataSaidas (but we should count unique in whole source or filtered? requirement: "contar todos voluntarioId do arquivo .csv ... tirar duplicados" -> count across file. We'll show count across currently filtered set? The requirement asked big number to display total of people counting all volunteer IDs from CSV removing duplicates. We'll display the count on the CURRENT FILTERED dataset but keep a note: we'll show both: default show unique total of ALL and filtered below)
  const uniqueTotalAll = uniqueCountByKeySaidas(rawDataSaidas, 'voluntarioId');
  const uniqueFiltered = uniqueCountByKeySaidas(filteredDataSaidas, 'voluntarioId');

  // Display filtered count (primary) and show full total in tooltip via title attribute
  totalSaidas.innerText = uniqueFiltered;
  totalSaidas.title = `Total únicos no CSV (sem filtros): ${uniqueTotalAll}`;

  const mediaValue = mediaByKeySaidas(filteredDataSaidas, 'tempoServicoEmMeses');
  mediaTempoSaidas.innerText = mediaValue;

  // Donut - by local (DEVE CONTAR VOLUNTARIOID ÚNICOS POR local)
  const localCounts = groupCountSaidasUnique(filteredDataSaidas, 'local', 'voluntarioId');
  const localLabels = localCounts.map(x=>x[0]);
  const localSeries = localCounts.map(x=>x[1]);

  // Donut - by genero (DEVE CONTAR VOLUNTARIOID ÚNICOS POR genero)
  const generoCounts = groupCountSaidasUnique(filteredDataSaidas, 'genero', 'voluntarioId');
  const generoLabels = generoCounts.map(x=>x[0]);
  const generoSeries = generoCounts.map(x=>x[1]);

  // Donut - by genero (DEVE CONTAR VOLUNTARIOID ÚNICOS POR faixaTempoServico)
  const faixaTempoServicoCounts = groupCountSaidasUnique(filteredDataSaidas, 'faixaTempoServico', 'voluntarioId');
  const faixaTempoServicoLabels = faixaTempoServicoCounts.map(x=>x[0]);
  const faixaTempoServicoSeries = faixaTempoServicoCounts.map(x=>x[1]);

  // Bar - by area (DEVE CONTAR VOLUNTARIOID ÚNICOS POR AREA)
  const areaCounts = groupCountSaidasUnique(filteredDataSaidas, 'area', 'voluntarioId');
  const areaLabels = areaCounts.map(x=>x[0]);
  const areaSeries = areaCounts.map(x=>x[1]);

  // Bar - by faixaEtaria (DEVE CONTAR VOLUNTARIOID ÚNICOS POR faixaEtaria) 
  const faixaEtariaCounts = groupCountSaidasUnique(filteredDataSaidas, 'faixaEtaria', 'voluntarioId');
  const faixaEtariaLabels = faixaEtariaCounts.map(x=>x[0]);
  const faixaEtariaSeries = faixaEtariaCounts.map(x=>x[1]);

  // Line - by area (DEVE CONTAR VOLUNTARIOID ÚNICOS POR mesSaida)
  const mesSaidaCounts = groupCountSaidasUnique(filteredDataSaidas, 'mesSaida', 'voluntarioId', '0-asc');
  const mesSaidaLabels = mesSaidaCounts.map(x=>x[0]);
  const mesSaidaSeries = mesSaidaCounts.map(x=>x[1]);


  // Render charts (create if null)
  renderDonutSaida('donutLocalSaida', localLabels, localSeries, 'Escala');
  renderDonutSaida('donutGeneroSaida', generoLabels, generoSeries, 'Gênero');
  renderDonutSaida('donutTempoServicoSaida', faixaTempoServicoLabels, faixaTempoServicoSeries, 'Por de Tempo');
  renderBarSaida('barAreaSaida', areaLabels, areaSeries, 'Áreas');
  renderBarSaida('barFaixaEtariaSaida', faixaEtariaLabels, faixaEtariaSeries, 'Faixa Etária');
  renderLineSaida('lineMesSaidaSaida', mesSaidaLabels, mesSaidaSeries, 'Mês');
}

/* render helpers */
function renderListSaidas(container, items){
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
function renderDonutSaida(elId, labels, series, title){
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
    title: { text: `Saidas por ${title}`, style:{color: 'var(--muted)'} },
    responsive: [{ breakpoint:600, options:{ legend:{show:false} } }]
  };

  if(elId === 'donutLocalSaida') options.chart.height = 212;
  if(donutLocalSaidaChart && elId==='donutLocalSaida'){
    donutLocalSaidaChart.updateOptions({...options, series});
  } else {
    if(elId==='donutLocalSaida'){ donutLocalSaidaChart = new ApexCharts(el, options); donutLocalSaidaChart.render(); }
  }

  if(elId === 'donutGeneroSaida') options.chart.height = 212;
  if(donutGeneroSaidaChart && elId==='donutGeneroSaida'){
    donutGeneroSaidaChart.updateOptions({...options, series});
  } else {
    if(elId==='donutGeneroSaida'){ donutGeneroSaidaChart = new ApexCharts(el, options); donutGeneroSaidaChart.render(); }
  }

  if(elId === 'donutTempoServicoSaida') options.chart.height = 212;
  if(donutTempoServicoSaidaChart && elId==='donutTempoServicoSaida'){
    donutTempoServicoSaidaChart.updateOptions({...options, series});
  } else {
    if(elId==='donutTempoServicoSaida'){ donutTempoServicoSaidaChart = new ApexCharts(el, options); donutTempoServicoSaidaChart.render(); }
  }
}



function renderBarSaida(elId, labels, series, title){
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
    title: { text: `Saidas por ${title}`, style:{color: 'var(--muted)'} },
    colors: undefined,
  };
  if(elId === 'barAreaSaida') options.chart.height = 100 + 25 * labels.length;
  if(elId === 'barFaixaEtariaSaida') options.chart.height = 100 + 25 * labels.length;
  // if(elId === 'barFaixaEtariaSaida'){  options.series[0].name='Faixa Etária'; }
  if(barAreaSaidaChart && elId==='barAreaSaida'){ barAreaSaidaChart.updateOptions({...options}); }
  else if(barFaixaEtariaSaidaChart && elId==='barFaixaEtariaSaida'){ barFaixaEtariaSaidaChart.updateOptions({...options}); }
  else {
    if(elId==='barAreaSaida'){ barAreaSaidaChart = new ApexCharts(el, options); barAreaSaidaChart.render(); }
    if(elId==='barFaixaEtariaSaida'){ barFaixaEtariaSaidaChart = new ApexCharts(el, options); barFaixaEtariaSaidaChart.render(); }
  }
}

function renderLineSaida(elId, labels, series, title){

  console.log(labels);

  for(let i=0;i<labels.length;i++){
    labels[i] = formatMonthLabel(labels[i]);
  }

  console.log(labels);

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
    title:{ text:`Saidas por ${title}`, style:{ color:'var(--muted)'} },
  };
  // if(elId === 'lineMesSaidaSaida') options.chart.height = 220;
  if(lineMesSaidaSaidaChart) {
    // 💡 CORREÇÃO APLICADA: Passe o objeto options completo, sem sobrescrever series
    lineMesSaidaSaidaChart.updateOptions(options, false, true); 
    // O segundo 'false' e o terceiro 'true' são opcionais, 
    // mas indicam que não queremos resetar o zoom e queremos redesenhar.
  }
  else { 
    lineMesSaidaSaidaChart = new ApexCharts(el, options); 
    lineMesSaidaSaidaChart.render(); 
  }
}

/* initial placeholder to avoid empty visuals */
function setupPlaceholders(){
  // placeholder empty charts
  renderDonutSaida('donutLocalSaida', ['...'], [0], 'Escala');
  renderDonutSaida('donutGeneroSaida', ['...'], [0], 'Gênero');
  renderDonutSaida('donutTempoServicoSaida', ['...'], [0], 'Por de Tempo');
  renderBarSaida('barAreaSaida', ['...'], [0], 'Áreas');
  renderBarSaida('barFaixaEtariaSaida', ['...'], [0], 'Faixa Etária');
  renderLineSaida('lineMesSaidaSaida', ['...'], [0], 'Mês');
}
setupPlaceholders();

/* If you want to load quickly a sample CSV string for testing, you can call:
   Papa.parse(sampleCsvString, {header:true, complete:...})
*/

/* EOF */
