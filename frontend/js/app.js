/* ==========================================================================
   AutoScale AI — app.js
   Dashboard orchestration: KPI cards, live refresh loop, panels, tables,
   alerts, settings, theme, navigation. Data comes from window.API (api.js),
   charts from window.Charts (charts.js).
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Small utilities
  ------------------------------------------------------------------ */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  const fmtInt = v => Math.round(v).toLocaleString('en-US');
  const fmtPct = v => (+v).toFixed(1) + '%';
  const pad2 = n => String(n).padStart(2, '0');

  function fmtTime(d) { return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()); }
  function fmtTimeShort(ts) { const d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function fmtDate(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function timeAgo(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 5) return 'just now';
    if (s < 60) return s + 's ago';
    return Math.round(s / 60) + 'm ago';
  }

  function toast(message, kind) {
    const icons = { ok: 'fa-circle-check', warn: 'fa-triangle-exclamation', crit: 'fa-circle-xmark', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = 'app-toast toast-' + (kind || 'info');
    el.innerHTML = `<i class="fa-solid ${icons[kind] || icons.info}"></i><span>${message}</span>`;
    $('#toastContainer').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; setTimeout(() => el.remove(), 400); }, 4200);
  }

  /* ------------------------------------------------------------------
     State
  ------------------------------------------------------------------ */
  const state = {
    charts: {},          // chart instances by key
    sparklines: {},      // kpi sparklines by kpi id
    kpisBuilt: false,
    lastTickAt: null,
    autoRefresh: true,
    refreshTimer: null,
    seenAlertIds: new Set(),
    lastPayload: null,
  };

  /* ==========================================================================
     STAGE 2 — KPI CARDS
  ========================================================================== */
  const KPI_DEFS = [
    { id: 'traffic',     label: 'Current Traffic',    icon: 'fa-tower-broadcast',    cls: 'kpi-blue',   unit: 'req/5m', note: 'Live request volume',      get: d => d.metrics.request_count,               fmt: fmtInt, spark: s => s.actual.slice(-14),              trend: s => pctDelta(s.actual) },
    { id: 'predicted',   label: 'Predicted +15 min',  icon: 'fa-wand-magic-sparkles',cls: 'kpi-purple', unit: 'req/5m', note: 'XGBoost forecast',          get: d => d.prediction.predicted_request_count,  fmt: fmtInt, spark: s => s.predicted.slice(-14),           trend: s => pctDelta(s.predicted) },
    { id: 'accuracy',    label: 'Prediction Accuracy',icon: 'fa-bullseye',           cls: 'kpi-green',  unit: '',       note: 'Rolling model accuracy',    get: d => d.prediction.accuracy,                 fmt: fmtPct, spark: s => s.accuracy.slice(-14),            trend: s => pctDelta(s.accuracy) },
    { id: 'servers',     label: 'Current Servers',    icon: 'fa-server',             cls: 'kpi-indigo', unit: 'inst',   note: 'Active fleet size',         get: d => d.autoscaler.current_servers,          fmt: fmtInt, spark: s => s.current_servers.slice(-14),     trend: s => stepDelta(s.current_servers) },
    { id: 'recommended', label: 'Recommended Servers',icon: 'fa-clipboard-check',    cls: 'kpi-teal',   unit: 'inst',   note: 'Autoscaler suggestion',     get: d => d.autoscaler.recommended_servers,      fmt: fmtInt, spark: s => s.recommended_servers.slice(-14), trend: s => stepDelta(s.recommended_servers) },
    { id: 'cpu',         label: 'CPU Usage',          icon: 'fa-microchip',          cls: 'kpi-orange', unit: '',       note: 'Cluster average',           get: d => d.metrics.cpu_usage,                   fmt: fmtPct, spark: s => s.cpu.slice(-14),                 trend: s => pctDelta(s.cpu) },
    { id: 'memory',      label: 'Memory Usage',       icon: 'fa-memory',             cls: 'kpi-pink',   unit: '',       note: 'Cluster average',           get: d => d.metrics.memory_usage,                fmt: fmtPct, spark: s => s.memory.slice(-14),              trend: s => pctDelta(s.memory) },
    { id: 'queue',       label: 'Queue Length',       icon: 'fa-list-ol',            cls: 'kpi-red',    unit: 'msgs',   note: 'Pending requests',          get: d => d.metrics.queue_length,                fmt: fmtInt, spark: s => s.queue.slice(-14),                trend: s => pctDelta(s.queue) },
  ];

  function pctDelta(arr) {
    const n = arr.length; if (n < 2 || !arr[n - 2]) return 0;
    return ((arr[n - 1] - arr[n - 2]) / arr[n - 2]) * 100;
  }
  function stepDelta(arr) {
    const n = arr.length; if (n < 2) return 0;
    return (arr[n - 1] - arr[n - 2]) * 100; // displayed as ±N steps (scaled below)
  }

  function buildKpiCards() {
    const grid = $('#kpiGrid');
    grid.innerHTML = '';
    KPI_DEFS.forEach(def => {
      const card = document.createElement('article');
      card.className = `kpi-card ${def.cls}`;
      card.id = 'kpi-' + def.id;
      card.innerHTML = `
        <div class="kpi-top">
          <span class="kpi-icon"><i class="fa-solid ${def.icon}"></i></span>
          <span class="kpi-trend" data-role="trend"><i class="fa-solid fa-arrow-trend-up"></i> 0%</span>
        </div>
        <p class="kpi-label">${def.label}</p>
        <p class="kpi-value"><span data-role="value">—</span><small>${def.unit || ''}</small></p>
        <div class="kpi-foot">
          <span class="kpi-note">${def.note}</span>
          <span class="kpi-spark" data-role="spark"></span>
        </div>`;
      grid.appendChild(card);
    });
    state.kpisBuilt = true;
  }

  function updateKpiCards(payload) {
    const s = payload.series;
    KPI_DEFS.forEach(def => {
      const card = $('#kpi-' + def.id);
      if (!card) return;
      const valEl = card.querySelector('[data-role="value"]');
      const trendEl = card.querySelector('[data-role="trend"]');
      const sparkEl = card.querySelector('[data-role="spark"]');

      const newVal = def.fmt(def.get(payload));
      if (valEl.textContent !== newVal) {
        valEl.textContent = newVal;
        valEl.parentElement.animate(
          [{ transform: 'scale(1.04)', opacity: .85 }, { transform: 'scale(1)', opacity: 1 }],
          { duration: 260, easing: 'ease-out' });
      }

      let t = def.trend(s);
      let txt;
      if (def.id === 'servers' || def.id === 'recommended') {
        const steps = Math.round(t / 100);
        txt = (steps > 0 ? '+' : '') + steps + ' inst';
        t = steps * 5; // sign for icon direction
      } else {
        txt = (t >= 0 ? '+' : '') + t.toFixed(1) + '%';
      }
      const up = t >= 0;
      trendEl.innerHTML = `<i class="fa-solid fa-arrow-trend-${up ? 'up' : 'down'}"></i> ${txt}`;
      trendEl.classList.toggle('down', !up);

      const sparkData = def.spark(s);
      if (!state.sparklines[def.id]) {
        state.sparklines[def.id] = Charts.sparkline(sparkEl, sparkData, '#ffffff');
      } else {
        state.sparklines[def.id].updateSeries([{ data: sparkData }]);
      }
    });
  }

  /* ==========================================================================
     CHART INITIALIZATION (Stages 3–4 wiring)
  ========================================================================== */
  function initCharts() {
    const C = Charts;
    state.charts.traffic = C.initTraffic('#chartTrafficMain');
    state.charts.cpu = C.initRadial('#chartCpu', 'CPU', C.PALETTE.orange);
    state.charts.memory = C.initRadial('#chartMemory', 'Memory', C.PALETTE.pink);
    state.charts.queue = C.initRadial('#chartQueue', 'Queue', C.PALETTE.red, 160);
    state.charts.network = C.initNetwork('#chartNetwork');
    state.charts.latency = C.initLatency('#chartLatency');
    state.charts.predError = C.initPredError('#chartPredError');
    state.charts.accuracy = C.initAccuracy('#chartAccuracy');
    state.charts.servers = C.initServers('#chartServers');
    state.charts.autoscaleTimeline = C.initAutoscaleTimeline('#chartAutoscaleTimeline');
    state.charts.regions = C.initHBar('#chartRegions', C.PALETTE.blue);
    state.charts.devices = C.initHBar('#chartDevices', C.PALETTE.teal);
    state.charts.platform = C.initDonut('#chartPlatform');
    state.charts.subscription = C.initDonut('#chartSubscription', { compact: true });
    state.charts.content = C.initDonut('#chartContent', { compact: true });
    state.charts.healthGauge = C.initHealthGauge('#chartHealthGauge');
  }

  function updateAllCharts(payload) {
    const C = Charts, ch = state.charts, s = payload.series;
    C.updateTraffic(ch.traffic, s);
    C.updateRadial(ch.cpu, payload.metrics.cpu_usage);
    C.updateRadial(ch.memory, payload.metrics.memory_usage);
    C.updateRadial(ch.queue, payload.metrics.queue_length);
    C.updateNetwork(ch.network, s);
    C.updateLatency(ch.latency, s);
    C.updatePredError(ch.predError, s);
    C.updateAccuracy(ch.accuracy, s);
    C.updateServers(ch.servers, s);
    C.updateAutoscaleTimeline(ch.autoscaleTimeline, s);
    C.updateHBar(ch.regions, payload.geo.regions);
    C.updateHBar(ch.devices, payload.geo.devices);
    console.log("Full Geo Object:", payload.geo);
    console.log("Platforms:", payload.geo.platforms);
    console.log("Subscriptions:", payload.geo.subscriptions);
    console.log("Content Types:", payload.geo.content_types);
    C.updateDonut(ch.platform, payload.geo.platforms);
    C.updateDonut(ch.subscription, payload.geo.subscriptions);
    C.updateDonut(ch.content, payload.geo.content_types);
    C.renderWorldMap('#mapWorld', payload.geo.countries);
  }

  /* ==========================================================================
     STAGE 5 — STATIC PANEL SKELETONS (ML / Autoscaler / Health)
  ========================================================================== */
  function buildStaticPanels() {
    // ML panel
    $('#mlPanel').innerHTML = `
      <div class="panel-head">
        <div><h3 class="panel-title">Model Metrics</h3><p class="panel-sub">XGBoost regression · 38 features</p></div>
        <span class="chip chip-green" id="mlStatusChip">healthy</span>
      </div>
      <div class="ml-row"><span class="ml-label"><i class="fa-solid fa-wand-magic-sparkles"></i>Current prediction (+15m)</span><span class="ml-value" id="mlCurrent">—</span></div>
      <div class="ml-row"><span class="ml-label"><i class="fa-solid fa-bullseye"></i>Prediction accuracy</span><span class="ml-value" id="mlAccuracy">—</span></div>
      <div class="ml-row"><span class="ml-label"><i class="fa-solid fa-ruler-horizontal"></i>MAE</span><span class="ml-value" id="mlMae">—</span></div>
      <div class="ml-row"><span class="ml-label"><i class="fa-solid fa-ruler-combined"></i>RMSE</span><span class="ml-value" id="mlRmse">—</span></div>
      <div class="ml-row"><span class="ml-label"><i class="fa-solid fa-square-root-variable"></i>R² score</span><span class="ml-value" id="mlR2">—</span></div>
      <div class="ml-row"><span class="ml-label"><i class="fa-solid fa-heart-pulse"></i>Model status</span><span id="mlStatus"></span></div>`;

    // Autoscaler decision panel
    $('#autoscalerPanel').innerHTML = `
      <div class="panel-head">
        <div><h3 class="panel-title">Autoscaler Decision</h3><p class="panel-sub">Latest evaluation</p></div>
      </div>
      <div class="decision-hero maintain" id="decisionHero">
        <div class="decision-icon" id="decisionIcon"><i class="fa-solid fa-equals"></i></div>
        <div class="decision-action" id="decisionAction">MAINTAIN</div>
        <p class="decision-sub" id="decisionSub">Fleet capacity matches forecast demand</p>
      </div>
      <div class="decision-stats">
        <div class="decision-stat"><span class="ds-label">Current servers</span><div class="ds-value" id="asCurrent">—</div></div>
        <div class="decision-stat"><span class="ds-label">Recommended</span><div class="ds-value" id="asRecommended">—</div></div>
        <div class="decision-stat"><span class="ds-label">CPU usage</span><div class="ds-value" id="asCpu">—</div></div>
        <div class="decision-stat"><span class="ds-label">Memory usage</span><div class="ds-value" id="asMemory">—</div></div>
        <div class="decision-stat" style="grid-column:1/-1"><span class="ds-label">Queue length</span><div class="ds-value" id="asQueue">—</div></div>
      </div>`;

    // Health panel
    $('#healthPanel').innerHTML = `
      <div class="panel-head">
        <div><h3 class="panel-title">System Health</h3><p class="panel-sub">Subsystem status &amp; overall score</p></div>
      </div>
      <div class="health-overall">
        <div id="chartHealthGauge"></div>
        <div class="health-overall-text">
          <h4 id="healthHeadline">All systems operational</h4>
          <p id="healthSummary">Every subsystem is within its normal operating range.</p>
        </div>
      </div>
      <div id="healthRows"></div>`;
  }

  function updateMlPanel(d) {
    const p = d.prediction;
    $('#mlCurrent').textContent = fmtInt(p.predicted_request_count) + ' req';
    $('#mlAccuracy').textContent = fmtPct(p.accuracy);
    $('#mlMae').textContent = p.mae;
    $('#mlRmse').textContent = p.rmse;
    $('#mlR2').textContent = p.r2;
    const healthy = (p.model_status || 'healthy') === 'healthy';
    $('#mlStatus').innerHTML = `<span class="status-pill ${healthy ? 'pill-ok' : 'pill-crit'}">${p.model_status}</span>`;
    const chip = $('#mlStatusChip');
    chip.textContent = p.model_status;
    chip.className = 'chip ' + (healthy ? 'chip-green' : 'chip-red');
  }

  function updateAutoscalerPanel(d) {
    const a = d.autoscaler;
    const hero = $('#decisionHero');
    const map = {
      SCALE_UP:   { cls: 'scale-up',   icon: 'fa-arrow-up',   sub: 'Forecast load exceeds capacity — adding instances' },
      SCALE_DOWN: { cls: 'scale-down', icon: 'fa-arrow-down', sub: 'Demand cooling — releasing surplus capacity' },
      MAINTAIN:   { cls: 'maintain',   icon: 'fa-equals',     sub: 'Fleet capacity matches forecast demand' },
    };
    const m = map[a.action] || map.MAINTAIN;
    hero.className = 'decision-hero ' + m.cls;
    $('#decisionIcon').innerHTML = `<i class="fa-solid ${m.icon}"></i>`;
    $('#decisionAction').textContent = a.action.replace('_', ' ');
    $('#decisionSub').textContent = m.sub;
    $('#asCurrent').textContent = a.current_servers;
    $('#asRecommended').textContent = a.recommended_servers;
    $('#asCpu').textContent = fmtPct(a.cpu_usage);
    $('#asMemory').textContent = fmtPct(a.memory_usage);
    $('#asQueue').textContent = fmtInt(a.queue_length) + ' msgs';
  }

  /* ------------------------- System health ------------------------- */
  function evalHealth(d) {
    const m = d.metrics, a = d.autoscaler;
    const lvl = v => (v === 0 ? 'ok' : v === 1 ? 'warn' : 'crit');
    const rows = [
      { icon: 'fa-microchip', label: 'CPU Status',      value: fmtPct(m.cpu_usage),    l: m.cpu_usage < 70 ? 0 : m.cpu_usage < 85 ? 1 : 2 },
      { icon: 'fa-memory',    label: 'Memory Status',   value: fmtPct(m.memory_usage), l: m.memory_usage < 75 ? 0 : m.memory_usage < 88 ? 1 : 2 },
      { icon: 'fa-list-ol',   label: 'Queue Status',    value: fmtInt(m.queue_length) + ' msgs', l: m.queue_length < 30 ? 0 : m.queue_length < 80 ? 1 : 2 },
      { icon: 'fa-network-wired', label: 'Network Status', value: fmtInt(m.network_in) + ' MB/s in', l: m.error_rate < 1.5 ? 0 : m.error_rate < 3 ? 1 : 2 },
      { icon: 'fa-arrows-up-down', label: 'Autoscaler Status', value: a.action.replace('_', ' '), l: 0 },
    ];
    let score = 100;
    rows.forEach(r => { if (r.l === 1) score -= 7; if (r.l === 2) score -= 22; });
    score = Math.max(25, Math.min(100, score));
    return { rows: rows.map(r => ({ ...r, level: lvl(r.l) })), score };
  }

  function updateHealthPanel(d) {
    const h = evalHealth(d);
    $('#healthRows').innerHTML = h.rows.map(r => `
      <div class="health-row">
        <span class="health-label"><i class="fa-solid ${r.icon}"></i>${r.label}</span>
        <span><span class="health-value">${r.value}</span>
        <span class="status-pill pill-${r.level}">${r.level === 'ok' ? 'Healthy' : r.level === 'warn' ? 'Warning' : 'Critical'}</span></span>
      </div>`).join('');

    Charts.updateHealthGauge(state.charts.healthGauge, h.score);
    const headline = $('#healthHeadline'), summary = $('#healthSummary');
    if (h.score >= 85) {
      headline.textContent = 'All systems operational';
      summary.textContent = 'Every subsystem is within its normal operating range.';
    } else if (h.score >= 60) {
      headline.textContent = 'Degraded performance';
      summary.textContent = 'One or more subsystems need attention — autoscaling is compensating.';
    } else {
      headline.textContent = 'Critical issues detected';
      summary.textContent = 'Immediate investigation recommended.';
    }
  }

  /* ------------------------- Alerts feed ------------------------- */
  function updateAlerts(d) {
    const feed = $('#alertsFeed');
    let added = 0;
    (d.alerts || []).forEach(al => {
      if (state.seenAlertIds.has(al.id)) return;
      state.seenAlertIds.add(al.id);
      added++;
      const sevCls = al.severity === 'critical' ? 'alert-crit' : al.severity === 'warning' ? 'alert-warn' : 'alert-info';
      const item = document.createElement('div');
      item.className = 'alert-item ' + sevCls;
      item.innerHTML = `
        <span class="alert-icon"><i class="fa-solid ${al.icon || 'fa-bell'}"></i></span>
        <div><p class="alert-title">${al.type}</p><p class="alert-msg">${al.message}</p></div>
        <span class="alert-time">${fmtTimeShort(al.timestamp)}</span>`;
      feed.prepend(item);
      if (al.severity === 'critical') toast(al.type + ' — ' + al.message, 'crit');
    });
    while (feed.children.length > 15) feed.lastElementChild.remove();
    if (!feed.children.length) {
      feed.innerHTML = `<div class="alert-item alert-info">
        <span class="alert-icon"><i class="fa-solid fa-shield-halved"></i></span>
        <div><p class="alert-title">All clear</p><p class="alert-msg">No active alerts — system operating normally.</p></div>
      </div>`;
    }
    const active = (d.alerts || []).length;
    $('#alertCount').textContent = active + ' active';
  }

  /* ------------------------- Scaling history table ------------------------- */
  function actionBadge(action) {
    if (action === 'SCALE_UP') return '<span class="action-badge action-up"><i class="fa-solid fa-arrow-up"></i>SCALE UP</span>';
    if (action === 'SCALE_DOWN') return '<span class="action-badge action-down"><i class="fa-solid fa-arrow-down"></i>SCALE DOWN</span>';
    return '<span class="action-badge action-hold"><i class="fa-solid fa-equals"></i>MAINTAIN</span>';
  }

  function updateTable(d) {
    const body = $('#scalingTableBody');
    body.innerHTML = (d.history || []).map(r => `
      <tr>
        <td>${fmtTimeShort(r.timestamp)}</td>
        <td>${r.country}</td>
        <td class="text-end">${fmtInt(r.current_requests)}</td>
        <td class="text-end">${fmtInt(r.predicted_requests)}</td>
        <td class="text-end">${fmtPct(r.cpu)}</td>
        <td class="text-end">${fmtPct(r.memory)}</td>
        <td class="text-end">${r.current_servers}</td>
        <td class="text-end">${r.recommended_servers}</td>
        <td>${actionBadge(r.action)}</td>
      </tr>`).join('');
  }

  /* ------------------------- Top countries ------------------------- */
  function updateTopCountries(d) {

    console.log("Geo Object:", d.geo);
    console.log("Countries:", d.geo.countries);

    const container = document.getElementById("countryDetails");

    console.log("Container:", container);

    if (!container) {
        console.error("countryDetails element NOT FOUND");
        return;
    }

    const top = (d.geo.countries || []).slice(0, 10);
    const max = top.length ? top[0].requests : 1;

    container.innerHTML = top.map((c, i) => `
      <div class="rank-item">
        <span class="rank-pos">${i + 1}</span>
        <div class="rank-body">
          <div class="rank-name">
              <span>${c.name}</span>
              <span>${Charts.fmtK(c.requests)}</span>
          </div>
          <div class="rank-bar">
              <i style="width:${Math.max(4, (c.requests / max) * 100)}%"></i>
          </div>
        </div>
      </div>
    `).join('');
  }
  // function updateTopCountries(d) {
  //   console.log("Geo Object:", d.geo);
  //   console.log("Countries:", d.geo.countries);
  //   const top = (d.geo.countries || []).slice(0, 6);
  //   const max = top.length ? top[0].requests : 1;
  //   document.getElementById("countryDetails").innerHTML = top.map((c, i) => `
  //     <div class="rank-item">
  //       <span class="rank-pos">${i + 1}</span>
  //       <div class="rank-body">
  //         <div class="rank-name"><span>${c.name}</span><span>${Charts.fmtK(c.requests)}</span></div>
  //         <div class="rank-bar"><i style="width:${Math.max(4, (c.requests / max) * 100)}%"></i></div>
  //       </div>
  //     </div>`).join('');
  // }

  /* ==========================================================================
     STAGE 6 — LIVE REFRESH LOOP + CONNECTION STATUS
  ========================================================================== */
  async function tick() {
    try {
      const { data } = await API.getDashboard();
      state.lastPayload = data;
      state.lastTickAt = Date.now();

      updateKpiCards(data);
      updateAllCharts(data);
      updateMlPanel(data);
      updateAutoscalerPanel(data);
      updateHealthPanel(data);
      updateAlerts(data);
      updateTable(data);
      updateTopCountries(data);

      $('#lastUpdated').textContent = 'just now';
    } catch (err) {
      console.error('Dashboard tick failed:', err);
      toast('Refresh failed — retrying on next cycle', 'warn');
    }
  }

  function startRefresh() {
    stopRefresh();
    state.refreshTimer = setInterval(tick, API.pollIntervalMs);
  }
  function stopRefresh() {
    if (state.refreshTimer) clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }

  function setPill(el, dot, cls, text) {
    el.classList.remove('is-live', 'is-mock', 'is-down');
    el.classList.add(cls);
    el.querySelector('span:last-child').textContent = text;
    dot.className = 'status-dot ' + (cls === 'is-live' ? 'dot-ok' : cls === 'is-mock' ? 'dot-warn' : 'dot-crit');
  }

  API.onModeChange = function (mode, err) {
    const pill = $('#apiPill'), dot = $('#apiPillDot');
    const sDot = $('#sidebarApiDot'), sLabel = $('#sidebarApiLabel');
    if (mode === 'live') {
      setPill(pill, dot, 'is-live', 'Live');
      sDot.className = 'status-dot dot-ok';
      sLabel.textContent = 'Backend connected';
      toast('Connected to Python backend — live data', 'ok');
    } else if (mode === 'mock') {
      setPill(pill, dot, 'is-mock', 'Mock data');
      sDot.className = 'status-dot dot-warn';
      sLabel.textContent = 'Mock mode (backend offline)';
      toast('Backend unreachable — using built-in simulator', 'warn');
    } else {
      setPill(pill, dot, 'is-down', 'Connecting…');
      sDot.className = 'status-dot dot-crit';
      sLabel.textContent = 'Connecting…';
    }
    updateDatasourceInfo();
  };

  function updateDatasourceInfo() {
    const el = $('#datasourceInfo');
    if (!el) return;
    const modePill = API.mode === 'live'
      ? '<span class="status-pill pill-ok">Live backend</span>'
      : API.mode === 'mock'
        ? '<span class="status-pill pill-warn">Mock simulator</span>'
        : '<span class="status-pill pill-crit">Connecting</span>';
    el.innerHTML = `
      <div class="ds-row"><span>Mode</span>${modePill}</div>
      <div class="ds-row"><span>Base URL</span><code>${API.baseUrl}</code></div>
      <div class="ds-row"><span>Endpoint</span><code>GET ${API.endpoint}</code></div>
      <div class="ds-row"><span>Poll interval</span><code>${API.pollIntervalMs / 1000}s</code></div>
      <div class="ds-row"><span>Last refresh</span><span>${state.lastTickAt ? fmtTime(new Date(state.lastTickAt)) : '—'}</span></div>
      <div class="ds-row"><span>Fallback behavior</span><span>Auto-switch to simulator</span></div>
      <div class="ds-row"><span>Last error</span><span style="max-width:55%;text-align:right">${API.lastError || '—'}</span></div>`;
  }

  /* ==========================================================================
     LAYOUT BEHAVIORS — clock, theme, sidebar, search, notifications
  ========================================================================== */
  function initClock() {
    const tickClock = () => {
      const now = new Date();
      $('#clockDate').textContent = fmtDate(now);
      $('#clockTime').textContent = fmtTime(now);
      if (state.lastTickAt) $('#lastUpdated').textContent = timeAgo(state.lastTickAt);
    };
    tickClock();
    setInterval(tickClock, 1000);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('autoscale.theme', theme);
    $('#themeIcon').className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    const sw = $('#settingsThemeToggle');
    if (sw) { sw.classList.toggle('on', theme === 'dark'); sw.setAttribute('aria-checked', theme === 'dark'); }
    if (window.Charts) Charts.setTheme();
  }

  function initTheme() {
    applyTheme(localStorage.getItem('autoscale.theme') || 'dark');
    $('#themeToggle').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
    $('#settingsThemeToggle').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  function initSidebar() {
    const sidebar = $('#sidebar'), overlay = $('#sidebarOverlay');
    const open = () => { sidebar.classList.add('open'); overlay.classList.add('show'); };
    const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
    $('#sidebarToggle').addEventListener('click', open);
    $('#sidebarClose').addEventListener('click', close);
    overlay.addEventListener('click', close);
    $$('#sidebarNav .nav-link, .sidebar-bottom .nav-link').forEach(a => a.addEventListener('click', close));

    // Scrollspy
    const links = $$('.nav-link[data-section]');
    const sections = links.map(a => document.getElementById(a.dataset.section)).filter(Boolean);
    const onScroll = () => {
      const pos = window.scrollY + 120;
      const ordered = sections.slice().sort((a, b) => a.offsetTop - b.offsetTop);
      let current = ordered[0] && ordered[0].id;
      ordered.forEach(sec => { if (sec.offsetTop <= pos) current = sec.id; });
      links.forEach(a => a.classList.toggle('active', a.dataset.section === current));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initSearch() {
    const input = $('#globalSearch');
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    });
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      $$('#scalingTableBody tr').forEach(tr => {
        tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const q = input.value.trim().toLowerCase();
      if (!q) return;
      const link = $$('.nav-link[data-section]').find(a => a.textContent.trim().toLowerCase().includes(q));
      if (link) { link.click(); toast('Jumped to ' + link.textContent.trim(), 'info'); }
      else toast('No section matches “' + q + '”', 'warn');
    });
  }

  function initNotifications() {
    const items = [
      { icon: 'fa-brain', bg: 'rgba(167,139,250,.15)', fg: '#a78bfa', title: 'Model retrained', sub: 'XGBoost v14 — R² improved to 0.972', time: '12m ago' },
      { icon: 'fa-arrow-up', bg: 'rgba(52,211,153,.15)', fg: '#34d399', title: 'Scale up executed', sub: 'Fleet grew 6 → 7 instances in ap-south-1', time: '26m ago' },
      { icon: 'fa-file-lines', bg: 'rgba(79,140,255,.15)', fg: '#4f8cff', title: 'Weekly report ready', sub: 'Scaling efficiency report available', time: '1h ago' },
    ];
    const render = list => {
      $('#notifList').innerHTML = list.length ? list.map(n => `
        <div class="notif-item">
          <span class="notif-icon" style="background:${n.bg};color:${n.fg}"><i class="fa-solid ${n.icon}"></i></span>
          <div><p class="notif-title">${n.title}</p><p class="notif-sub">${n.sub} · ${n.time}</p></div>
        </div>`).join('') :
        '<div class="notif-item"><p class="notif-sub" style="padding:4px">No notifications</p></div>';
      const badge = $('#notifBadge');
      badge.textContent = list.length;
      badge.style.display = list.length ? '' : 'none';
    };
    render(items);
    $('#clearNotifs').addEventListener('click', () => { render([]); toast('Notifications cleared', 'info'); });
  }

  function initSettings() {
    const autoToggle = $('#autoRefreshToggle');
    autoToggle.addEventListener('click', () => {
      state.autoRefresh = !state.autoRefresh;
      autoToggle.classList.toggle('on', state.autoRefresh);
      autoToggle.setAttribute('aria-checked', state.autoRefresh);
      if (state.autoRefresh) { startRefresh(); toast('Auto refresh enabled', 'ok'); }
      else { stopRefresh(); toast('Auto refresh paused', 'warn'); }
    });

    $('#refreshInterval').addEventListener('change', e => {
      API.setPollInterval(+e.target.value);
      if (state.autoRefresh) startRefresh();
      updateDatasourceInfo();
      toast('Refresh interval set to ' + (+e.target.value / 1000) + 's', 'info');
    });

    const urlInput = $('#apiBaseUrl');
    urlInput.value = API.baseUrl;
    urlInput.addEventListener('change', () => {
      API.setBaseUrl(urlInput.value);
      updateDatasourceInfo();
      tick();
      toast('Backend URL updated — reconnecting…', 'info');
    });
  }

  function initExport() {
    $('#exportCsv').addEventListener('click', () => {
      const d = state.lastPayload;
      if (!d || !d.history) { toast('No data to export yet', 'warn'); return; }
      const head = 'timestamp,country,current_requests,predicted_requests,cpu,memory,current_servers,recommended_servers,action';
      const lines = d.history.map(r =>
        [r.timestamp, r.country, r.current_requests, r.predicted_requests, r.cpu, r.memory, r.current_servers, r.recommended_servers, r.action].join(','));
      const blob = new Blob([head + '\n' + lines.join('\n')], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'scaling_history_' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.csv';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Scaling history exported as CSV', 'ok');
    });
  }

  function initManualRefresh() {
    const btn = $('#manualRefresh');
    btn.addEventListener('click', async () => {
      btn.querySelector('i').classList.add('fa-spin');
      await tick();
      setTimeout(() => btn.querySelector('i').classList.remove('fa-spin'), 400);
    });
  }

  /* ==========================================================================
     BOOT
  ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    buildKpiCards();        // Stage 2
    buildStaticPanels();    // Stage 5 skeletons (creates #chartHealthGauge)
    initCharts();           // Stage 3
    initClock();
    initTheme();
    initSidebar();
    initSearch();
    initNotifications();
    initSettings();
    initExport();
    initManualRefresh();
    updateDatasourceInfo(); // Stage 6

    tick();                 // first data load (map + distributions too — Stage 4)
    startRefresh();
  });
})();

function updateCountryDetails(country) {

    document.getElementById("countryDetails").innerHTML = `
        <div class="country-card">

            <h2>${country.name}</h2>

            <div class="metric">
                <span>Requests</span>
                <b>${country.requests.toLocaleString()}</b>
            </div>

            <div class="metric">
                <span>Active Users</span>
                <b>${country.active_users.toLocaleString()}</b>
            </div>

            <div class="metric">
                <span>CPU</span>
                <b>${country.cpu}%</b>
            </div>

            <div class="metric">
                <span>Memory</span>
                <b>${country.memory}%</b>
            </div>

            <div class="metric">
                <span>Latency</span>
                <b>${country.latency} ms</b>
            </div>

            <div class="metric">
                <span>Cloud Region</span>
                <b>${country.cloud_region}</b>
            </div>

            <div class="metric">
                <span>Status</span>
                <span class="status healthy">${country.status}</span>
            </div>

        </div>
    `;
}