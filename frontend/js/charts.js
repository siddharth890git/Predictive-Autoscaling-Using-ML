/* ==========================================================================
   AutoScale AI — charts.js
   Chart factories (ApexCharts + Plotly) with a shared enterprise theme.
   Every factory returns the chart instance so app.js can push live updates.
   ========================================================================== */
(function () {
  'use strict';

  const PALETTE = {
    blue: '#4f8cff', cyan: '#22d3ee', purple: '#a78bfa', magenta: '#e879f9',
    green: '#34d399', teal: '#2dd4bf', amber: '#fbbf24', orange: '#fb923c',
    red: '#f87171', pink: '#f472b6', slate: '#94a3b8',
  };
  const DONUT_COLORS = [PALETTE.blue, PALETTE.purple, PALETTE.cyan, PALETTE.amber, PALETTE.green, PALETTE.pink];

  const registry = [];           // ApexCharts instances (for re-theming)
  const plotlyState = new Map(); // el → {data, layout, config} for re-render

  function themeMode() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function foreColor() {
    return themeMode() === 'light' ? '#475069' : '#8b94a7';
  }

  function baseOpts(extra) {
    const base = {
      chart: {
        background: 'transparent',
        fontFamily: 'Inter, Segoe UI, sans-serif',
        toolbar: { show: false },
        animations: { enabled: true, speed: 350, dynamicAnimation: { enabled: false } },
        parentHeightOffset: 0,
      },
      theme: { mode: themeMode() },
      grid: { borderColor: 'rgba(148,163,184,.12)', strokeDashArray: 4, padding: { left: 8, right: 8 } },
      tooltip: { theme: themeMode() },
      dataLabels: { enabled: false },
    };
    const merged = Object.assign(base, extra || {});
    // deep-merge the chart key so per-chart options don't wipe the shared defaults
    merged.chart = Object.assign({
      background: 'transparent',
      fontFamily: 'Inter, Segoe UI, sans-serif',
      toolbar: { show: false },
      animations: { enabled: true, speed: 350, dynamicAnimation: { enabled: false } },
      parentHeightOffset: 0,
    }, (extra && extra.chart) || {});
    return merged;
  }

  function mount(el, opts) {
    const target = typeof el === 'string' ? document.querySelector(el) : el;
    const chart = new ApexCharts(target, opts);
    chart.render();
    registry.push(chart);
    return chart;
  }

  function fmtK(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    return Math.round(v);
  }

  const Charts = { PALETTE, fmtK };

  /* ----------------------------------------------------------------------
     KPI sparkline (tiny area)
  ---------------------------------------------------------------------- */
  Charts.sparkline = function (el, values, color) {
    const c = mount(el, baseOpts({
      chart: { type: 'area', height: 38, width: 96, sparkline: { enabled: true } },
      series: [{ data: values.slice() }],
      stroke: { width: 2, curve: 'smooth', colors: ['rgba(255,255,255,.95)'] },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0.02 } },
      colors: [color || '#ffffff'],
      tooltip: { enabled: true },
      grid: { padding: { left: 0, right: 0 } },
    }));
    c.__isSpark = true;
    return c;
  };

  /* ----------------------------------------------------------------------
     Main traffic chart — actual vs predicted vs +15m forecast
  ---------------------------------------------------------------------- */
  Charts.initTraffic = function (el) {
    return mount(el, baseOpts({
      chart: { type: 'line', height: '100%' },
      series: [
        { name: 'Actual Traffic', type: 'line', data: [] },
        { name: 'ML Prediction', type: 'line', data: [] },
        { name: 'Forecast', type: 'line', data: [] },
      ],
      colors: [
        PALETTE.blue,
        PALETTE.purple,
        PALETTE.green
      ],
      stroke: { width: [3, 3, 3], curve: 'smooth', dashArray: [0, 0, 6] },
      // fill: {
      //   type: ['gradient', 'solid', 'solid'],
      //   gradient: { opacityFrom: 0.32, opacityTo: 0.02 },
      // },
      markers: { size: 0, hover: { size: 5 } },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          format: 'HH:mm',
          rotate: -35,
          style: {
            colors: foreColor()
          },
          rotate: 0,
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: { labels: { formatter: fmtK, style: { colors: foreColor() } }, title: { text: 'Requests Count', style: { color: foreColor(), fontWeight: 500 } } },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        labels: {
          colors: foreColor()
        },
        markers: {
          radius: 12
        } 
      },
      annotations: { xaxis: [] },
    }));
  };

  Charts.updateTraffic = function (chart, s) {

    const actual = s.timestamps.map((t, i) => ({
        x: t,
        y: s.actual[i]
    }));

    const predicted = s.timestamps.map((t, i) => ({
        x: t,
        y: s.predicted[i]
    }));

    // Start forecast from the last prediction point
    const forecast = [
        {
            x: s.timestamps[s.timestamps.length - 1],
            y: s.predicted[s.predicted.length - 1]
        },
        ...s.forecast
    ];

    chart.updateSeries([
        {
            name: "Actual Traffic",
            data: actual
        },
        {
            name: "ML Prediction",
            data: predicted
        },
        {
            name: "Forecast",
            data: forecast
        }
    ]);
  };

  /* ----------------------------------------------------------------------
     Radial gauges (CPU / Memory / Queue)
  ---------------------------------------------------------------------- */
  Charts.initRadial = function (el, label, color, max) {
    const chart = mount(el, baseOpts({
      chart: { type: 'radialBar', height: '100%' },
      series: [0],
      colors: [color],
      plotOptions: {
        radialBar: {
          startAngle: -120, endAngle: 120,
          hollow: { size: '58%' },
          track: { background: 'rgba(148,163,184,.15)' },
          dataLabels: {
            name: { show: true, fontSize: '12px', color: foreColor(), offsetY: 22 },
            value: { show: true, fontSize: '22px', fontWeight: 700, color: themeMode() === 'light' ? '#111827' : '#fff',
                     offsetY: -12, formatter: v => Math.round(v) + (max === 100 ? '%' : '') },
          },
        },
      },
      labels: [label],
      stroke: { lineCap: 'round' },
      fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', gradientToColors: [color], opacityFrom: 1, opacityTo: 0.75 } },
    }));
    chart.__max = max || 100;
    return chart;
  };
  Charts.updateRadial = function (chart, value, displayText) {
    const pct = chart.__max === 100 ? value : Math.min(100, (value / (chart.__max)) * 100);
    chart.updateOptions({
      plotOptions: {
        radialBar: {
          dataLabels: {
            value: {
              formatter: () => displayText != null
                ? String(displayText)
                : Math.round(value) + (chart.__max === 100 ? '%' : ''),
            },
          },
        },
      },
    }, false, false);
    chart.updateSeries([+pct.toFixed(1)]);
  };

  /* ----------------------------------------------------------------------
     Network throughput (area, in vs out)
  ---------------------------------------------------------------------- */
  Charts.initNetwork = function (el) {
    return mount(el, baseOpts({
      chart: { type: 'area', height: '100%' },
      series: [{ name: 'Network In', data: [] }, { name: 'Network Out', data: [] }],
      colors: [PALETTE.teal, PALETTE.purple],
      stroke: { width: 2, curve: 'smooth' },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0.03 } },
      xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'HH:mm', style: { colors: foreColor() } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { formatter: v => fmtK(v) + ' MB/s', style: { colors: foreColor() } } },
      legend: { position: 'top', horizontalAlign: 'right', labels: { colors: foreColor() }, markers: { radius: 12 } },
    }));
  };
  Charts.updateNetwork = function (chart, s) {
    const toXY = ys => s.timestamps.map((t, i) => ({ x: t, y: ys[i] }));
    chart.updateSeries([{ name: 'Network In', data: toXY(s.network_in) }, { name: 'Network Out', data: toXY(s.network_out) }]);
  };

  /* ----------------------------------------------------------------------
     Response time + error rate (dual axis)
  ---------------------------------------------------------------------- */
  Charts.initLatency = function (el) {
    return mount(el, baseOpts({
      chart: { type: 'line', height: '100%' },
      series: [{ name: 'Response Time (ms)', type: 'area', data: [] }, { name: 'Error Rate (%)', type: 'line', data: [] }],
      colors: [PALETTE.orange, PALETTE.red],
      stroke: { width: [2, 2.5], curve: 'smooth', dashArray: [0, 0] },
      fill: { type: ['gradient', 'solid'], gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
      xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'HH:mm', style: { colors: foreColor() } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: [
        { title: { text: 'ms', style: { color: foreColor() } }, labels: { style: { colors: foreColor() } } },
        { opposite: true, title: { text: '%', style: { color: foreColor() } }, labels: { style: { colors: foreColor() }, formatter: v => v.toFixed(1) } },
      ],
      legend: { position: 'top', horizontalAlign: 'right', labels: { colors: foreColor() }, markers: { radius: 12 } },
    }));
  };
  Charts.updateLatency = function (chart, s) {
    const toXY = ys => s.timestamps.map((t, i) => ({ x: t, y: ys[i] }));
    chart.updateSeries([
      { name: 'Response Time (ms)', type: 'area', data: toXY(s.response_time) },
      { name: 'Error Rate (%)', type: 'line', data: toXY(s.error_rate) },
    ]);
  };

  /* ----------------------------------------------------------------------
     Prediction error (bar, colored by sign)
  ---------------------------------------------------------------------- */
  Charts.initPredError = function (el) {
    return mount(el, baseOpts({
      chart: { type: 'bar', height: '100%' },
      series: [{ name: 'Error', data: [] }],
      plotOptions: { bar: { borderRadius: 3, columnWidth: '62%' } },
      colors: [({ value }) => value >= 0 ? PALETTE.amber : PALETTE.blue],
      xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'HH:mm', style: { colors: foreColor() } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: foreColor() }, formatter: v => Math.round(v) } },
      tooltip: { theme: themeMode(), y: { formatter: v => (v >= 0 ? '+' : '') + Math.round(v) + ' req' } },
    }));
  };
  Charts.updatePredError = function (chart, s) {
    const data = s.timestamps.map((t, i) => ({ x: t, y: s.actual[i] - s.predicted[i] }));
    chart.updateSeries([{ name: 'Error', data }]);
  };

  /* ----------------------------------------------------------------------
     Prediction accuracy trend
  ---------------------------------------------------------------------- */
  Charts.initAccuracy = function (el) {
    return mount(el, baseOpts({
      chart: { type: 'area', height: '100%' },
      series: [{ name: 'Accuracy', data: [] }],
      colors: [PALETTE.green],
      stroke: { width: 2.5, curve: 'smooth' },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.32, opacityTo: 0.03 } },
      markers: { size: 0, hover: { size: 4 } },
      xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'HH:mm', style: { colors: foreColor() } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { min: 80, max: 100, labels: { formatter: v => v.toFixed(0) + '%', style: { colors: foreColor() } } },
    }));
  };
  Charts.updateAccuracy = function (chart, s) {
    chart.updateSeries([{ name: 'Accuracy', data: s.timestamps.map((t, i) => ({ x: t, y: s.accuracy[i] })) }]);
  };

  /* ----------------------------------------------------------------------
     Servers: current vs recommended (stepline)
  ---------------------------------------------------------------------- */
  Charts.initServers = function (el) {
    return mount(el, baseOpts({
      chart: { type: 'line', height: '100%' },
      series: [{ name: 'Current Servers', data: [] }, { name: 'Recommended', data: [] }],
      colors: [PALETTE.cyan, PALETTE.amber],
      stroke: { width: [2.5, 2], curve: 'stepline', dashArray: [0, 5] },
      markers: { size: 0 },
      xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'HH:mm', style: { colors: foreColor() } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: foreColor() }, formatter: v => Math.round(v) } },
      legend: { show: false },
    }));
  };
  Charts.updateServers = function (chart, s) {
    const toXY = ys => s.timestamps.map((t, i) => ({ x: t, y: ys[i] }));
    chart.updateSeries([
      { name: 'Current Servers', data: toXY(s.current_servers) },
      { name: 'Recommended', data: toXY(s.recommended_servers) },
    ]);
  };

  /* ----------------------------------------------------------------------
     Autoscaling timeline (rangeBar gantt strip)
  ---------------------------------------------------------------------- */
const ACTION_COLORS = {
    SCALE_UP: "#22c55e",
    SCALE_DOWN: "#f59e0b",
    MAINTAIN: "#4f8cff"
};

Charts.initAutoscaleTimeline = function (el) {

    return mount(el, baseOpts({

        chart: {
            type: "rangeBar",
            height: "100%",
            toolbar: {
                show: false
            },
            animations: {
                enabled: true
            }
        },

        series: [{
            name: "Autoscaling Events",
            data: []
        }],

        plotOptions: {
            bar: {
                horizontal: true,
                rangeBarOverlap: false,
                borderRadius: 5,
                barHeight: "40%",
                distributed: true
            }
        },

        xaxis: {
            type: "datetime",
            labels: {
                datetimeUTC: false,
                format: "HH:mm",
                style: {
                    colors: foreColor()
                }
            }
        },

        yaxis: {
            labels: {
                style: {
                    colors: foreColor()
                }
            }
        },

        grid: {
            borderColor: "rgba(148,163,184,.12)"
        },

        legend: {
            show: false
        },

        tooltip: {

            theme: themeMode(),

            custom: function ({ dataPointIndex, w }) {

                const d = w.config.series[0].data[dataPointIndex];

                const start = new Date(d.y[0]);
                const end = new Date(d.y[1]);

                const fmt = (t) =>
                    `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;

                return `
                    <div style="padding:10px;font-size:12px">
                        <b style="color:${d.fillColor}">
                            ${d.meta}
                        </b><br>
                        ${fmt(start)} → ${fmt(end)}
                    </div>
                `;
            }
        }

    }));
};


Charts.updateAutoscaleTimeline = function (chart, s) {

    if (!s?.timestamps?.length || !s?.actions?.length) {
        chart.updateSeries([{ name: "Actions", data: [] }]);
        return;
    }

    const timestamps = s.timestamps.map(t => new Date(t).getTime());

    const events = [];

    let start = timestamps[0];
    let currentAction = (s.actions[0] || "MAINTAIN").toUpperCase();

    for (let i = 1; i < timestamps.length; i++) {

        const nextAction = (s.actions[i] || "MAINTAIN").toUpperCase();

        if (nextAction !== currentAction) {

            events.push({

                x: "Autoscaling",

                y: [start, timestamps[i]],

                fillColor: ACTION_COLORS[currentAction],

                meta: currentAction.replace("_", " ")

            });

            start = timestamps[i];
            currentAction = nextAction;
        }
    }

    events.push({

        x: "Autoscaling",

        y: [
            start,
            timestamps[timestamps.length - 1] + 60000
        ],

        fillColor: ACTION_COLORS[currentAction],

        meta: currentAction.replace("_", " ")

    });

    chart.updateSeries([
        {
            name: "Actions",
            data: events
        }
    ]);

``};

  /* ----------------------------------------------------------------------
     Horizontal bar (regions / devices)
  ---------------------------------------------------------------------- */
  Charts.initHBar = function (el, color) {
    return mount(el, baseOpts({
      chart: { type: 'bar', height: '100%' },
      series: [{ name: 'Requests', data: [] }],
      colors: [color],
      plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '58%', distributed: false } },
      fill: { type: 'gradient', gradient: { type: 'horizontal', opacityFrom: 0.95, opacityTo: 0.55 } },
      xaxis: { labels: { formatter: fmtK, style: { colors: foreColor(), fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: foreColor(), fontSize: '11px' } } },
      grid: { borderColor: 'rgba(148,163,184,.08)', padding: { left: 4, right: 4 } },
    }));
  };
  Charts.updateHBar = function (chart, items) {

    if (!Array.isArray(items)) {
        chart.updateOptions({
            yaxis: { categories: [] }
        }, false, false);

        chart.updateSeries([
            {
                name: "Requests",
                data: []
            }
        ]);

        return;
    }

    const top = items.slice(0, 6);

    chart.updateOptions({
        yaxis: {
            categories: top.map(i => i.name)
        }
    }, false, false);

    chart.updateSeries([
        {
            name: "Requests",
            data: top.map(i => ({
                x: i.name,
                y: i.requests
            }))
        }
    ]);
  };

  /* ----------------------------------------------------------------------
     Donut (platform / subscription / content)
  ---------------------------------------------------------------------- */
  Charts.initDonut = function (el, opts) {
    const compact = !!(opts && opts.compact);
    const chart = mount(el, baseOpts({
      chart: { type: 'donut', height: '100%' },
      series: [],
      labels: [],
      colors: DONUT_COLORS,
      stroke: { width: 2, colors: ['rgba(0,0,0,0)'] },
      plotOptions: {
        pie: {
          donut: {
            size: compact ? '72%' : '68%',
            labels: {
              show: true,
              name: { fontSize: compact ? '10px' : '11px', color: foreColor() },
              value: { fontSize: compact ? '13px' : '16px', fontWeight: 700, color: themeMode() === 'light' ? '#111827' : '#fff', formatter: v => fmtK(+v) },
              total: { show: true, label: 'Total', fontSize: compact ? '9px' : '11px', color: foreColor(), formatter: w => fmtK(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) },
            },
          },
        },
      },
      legend: compact
        ? { show: false }
        : { position: 'bottom', fontSize: '11px', labels: { colors: foreColor() }, markers: { radius: 8, width: 8, height: 8 }, itemMargin: { horizontal: 6, vertical: 2 } },
    }));
    chart.__retheme = () => ({
      plotOptions: { pie: { donut: { labels: {
        name: { color: foreColor() },
        value: { color: themeMode() === 'light' ? '#111827' : '#fff' },
        total: { color: foreColor() },
      } } } },
    });
    return chart;
  };
  Charts.updateDonut = function (chart, items) {
    chart.updateOptions({ labels: items.map(i => i.name) }, false, false);
    chart.updateSeries(items.map(i => i.requests));
  };

  /* ----------------------------------------------------------------------
     Overall health gauge
  ---------------------------------------------------------------------- */
  Charts.initHealthGauge = function (el) {
    return mount(el, baseOpts({
      chart: { type: 'radialBar', height: 150, width: 150 },
      series: [100],
      colors: [PALETTE.green],
      plotOptions: {
        radialBar: {
          hollow: { size: '60%' },
          track: { background: 'rgba(148,163,184,.15)' },
          dataLabels: {
            name: { show: false },
            value: { fontSize: '24px', fontWeight: 700, color: themeMode() === 'light' ? '#111827' : '#fff', offsetY: 8, formatter: v => Math.round(v) + '%' },
          },
        },
      },
      stroke: { lineCap: 'round' },
      labels: ['Health'],
    }));
    chart.__retheme = () => ({
      plotOptions: { radialBar: { dataLabels: {
        value: { color: themeMode() === 'light' ? '#111827' : '#fff' },
      } } },
    });
    return chart;
  };
  Charts.updateHealthGauge = function (chart, pct) {
    const color = pct >= 85 ? PALETTE.green : pct >= 60 ? PALETTE.amber : PALETTE.red;
    chart.updateOptions({ colors: [color] }, false, false);
    chart.updateSeries([pct]);
  };

  /* ----------------------------------------------------------------------
     World map (Plotly choropleth)
  ---------------------------------------------------------------------- */
  Charts.renderWorldMap = function (el, countries) {

    const container = typeof el === "string"
        ? document.querySelector(el)
        : el;

    const data = [{
        type: "choropleth",
        locations: countries.map(c => c.iso3),
        z: countries.map(c => c.requests),
        text: countries.map(c => c.name),
        customdata: countries,
        hovertemplate:
            "<b>%{text}</b><br>" +
            "Traffic: %{z:,} requests<extra></extra>",

        colorscale: [
            [0.00, "#1e293b"],
            [0.20, "#2563eb"],
            [0.40, "#06b6d4"],
            [0.60, "#22c55e"],
            [0.80, "#f59e0b"],
            [1.00, "#ef4444"]
        ],

        marker: {
            line: {
                color: "rgba(255,255,255,.25)",
                width: 1
            }
        }
    }];

    const layout = {
        margin: { l: 0, r: 0, t: 0, b: 0 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",

        geo: {
            projection: {
                type: "natural earth",
                scale: 1.25
            },

            bgcolor: "rgba(0,0,0,0)",
            showcountries: true,
            countrycolor: "rgba(148,163,184,.18)",
            showland: true,
            landcolor: "#111a2b",
            showocean: true,
            oceancolor: "#0b1220",
            showframe: false,
            showcoastlines: false
        },

        font: {
            color: foreColor()
        }
    };

    Plotly.react(container, data, layout, {
        displayModeBar: false,
        responsive: true
    });

    // Remove previous click listeners
    container.removeAllListeners?.("plotly_click");

    // Add click listener
    container.on("plotly_click", function (e) {

        const country = e.points[0].customdata;

        console.log("Selected Country:", country);

        window.selectedCountry = country;

        // We'll replace this in Step 2
        alert(country.name);

    });
  };

  /* ----------------------------------------------------------------------
     Theme switching — restyle every live chart
  ---------------------------------------------------------------------- */
  Charts.setTheme = function () {
    const mode = themeMode();
    registry.forEach(chart => {
      try {
        chart.updateOptions({ theme: { mode }, tooltip: { theme: mode } }, false, false);
      } catch (e) { /* noop */ }
    });
    plotlyState.forEach((st, el) => {
      st.layout.font.color = foreColor();
      st.layout.geo.oceancolor = mode === 'light' ? '#dfe7f3' : '#0b1220';
      st.layout.geo.landcolor = mode === 'light' ? '#eef2f9' : '#111a2b';
      if (st.data && st.data[0] && st.data[0].colorbar) st.data[0].colorbar.tickfont.color = foreColor();
      Plotly.react(document.querySelector(el), st.data, st.layout, st.config);
    });
  };

  window.Charts = Charts;
})();
