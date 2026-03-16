/* ══════════════════════════════════════════════
   DATADOG LOGS CALCULATOR
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  var DAYS_PER_MONTH = 365 / 12;   // 30.41667
  var WEEKS_PER_MONTH = 52 / 12;   // 4.33333
  var HOURS_PER_MONTH = DAYS_PER_MONTH * 24; // ~730

  var debounceTimer = null;

  // Input elements
  var unitEl, hourlyEl, dailyEl, weeklyEl, twodayEl, customCountEl, customDaysEl;
  var pricingEl, logSizeEl, retentionEl;
  var resultsArea, barChart;

  // Pricing per GB ingested (approximate)
  var PRICING = {
    'ondemand': 0.10,
    'committed': 0.05
  };

  function init() {
    unitEl = document.getElementById('unit');
    hourlyEl = document.getElementById('hourly');
    dailyEl = document.getElementById('daily');
    weeklyEl = document.getElementById('weekly');
    twodayEl = document.getElementById('twoday');
    customCountEl = document.getElementById('customCount');
    customDaysEl = document.getElementById('customDays');
    pricingEl = document.getElementById('pricing');
    logSizeEl = document.getElementById('logSize');
    retentionEl = document.getElementById('retention');
    resultsArea = document.getElementById('logsResults');
    barChart = document.getElementById('barChart');

    // Attach real-time listeners
    var inputs = [unitEl, hourlyEl, dailyEl, weeklyEl, twodayEl, customCountEl, customDaysEl, pricingEl, logSizeEl, retentionEl];
    inputs.forEach(function (el) {
      if (el) {
        el.addEventListener('input', debouncedCompute);
        el.addEventListener('change', debouncedCompute);
      }
    });

    // Copy button
    var copyBtn = document.getElementById('copyResults');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyResults);
    }
  }

  function debouncedCompute() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(computeLogs, 200);
  }

  function computeLogs() {
    var unit = Number(unitEl.value);
    var rawHourly = parseFloat(hourlyEl.value);
    var rawDaily = parseFloat(dailyEl.value);
    var rawWeekly = parseFloat(weeklyEl.value);
    var rawTwoDay = parseFloat(twodayEl.value);
    var rawCustomCount = parseFloat(customCountEl.value);
    var rawCustomDays = parseFloat(customDaysEl.value);

    var entries = [];

    if (!isNaN(rawHourly) && rawHourly > 0) {
      entries.push({
        key: 'hourly',
        label: 'From Hourly',
        cardId: 'cardHourly',
        valId: 'valHourly',
        costId: 'costHourly',
        monthly: rawHourly * unit * HOURS_PER_MONTH
      });
    }

    if (!isNaN(rawDaily) && rawDaily > 0) {
      entries.push({
        key: 'daily',
        label: 'From Daily',
        cardId: 'cardDaily',
        valId: 'valDaily',
        costId: 'costDaily',
        monthly: rawDaily * unit * DAYS_PER_MONTH
      });
    }

    if (!isNaN(rawWeekly) && rawWeekly > 0) {
      entries.push({
        key: 'weekly',
        label: 'From Weekly',
        cardId: 'cardWeekly',
        valId: 'valWeekly',
        costId: 'costWeekly',
        monthly: rawWeekly * unit * WEEKS_PER_MONTH
      });
    }

    if (!isNaN(rawTwoDay) && rawTwoDay > 0) {
      var dailyRate = (rawTwoDay * unit) / 2;
      entries.push({
        key: 'twoday',
        label: 'From 2-Day',
        cardId: 'cardTwoDay',
        valId: 'valTwoDay',
        costId: 'costTwoDay',
        monthly: dailyRate * DAYS_PER_MONTH
      });
    }

    if (!isNaN(rawCustomCount) && rawCustomCount > 0 && !isNaN(rawCustomDays) && rawCustomDays > 0) {
      var customDailyRate = (rawCustomCount * unit) / rawCustomDays;
      entries.push({
        key: 'custom',
        label: 'From Custom',
        cardId: 'cardCustom',
        valId: 'valCustom',
        costId: 'costCustom',
        monthly: customDailyRate * DAYS_PER_MONTH
      });
    }

    if (entries.length === 0) {
      resultsArea.classList.remove('visible');
      barChart.classList.remove('visible');
      return;
    }

    // Cost calculation
    var priceTier = pricingEl.value;
    var pricePerGB = PRICING[priceTier] || 0.10;
    var avgLogSizeKB = parseFloat(logSizeEl.value) || 1;

    // Find min/max
    var values = entries.map(function (e) { return e.monthly; });
    var minVal = Math.min.apply(null, values);
    var maxVal = Math.max.apply(null, values);
    var allEqual = minVal === maxVal;

    // Reset all cards
    var allCardIds = ['cardHourly', 'cardDaily', 'cardWeekly', 'cardTwoDay', 'cardCustom'];
    var allValIds = ['valHourly', 'valDaily', 'valWeekly', 'valTwoDay', 'valCustom'];
    var allCostIds = ['costHourly', 'costDaily', 'costWeekly', 'costTwoDay', 'costCustom'];

    allCardIds.forEach(function (id) {
      var card = document.getElementById(id);
      if (card) {
        card.classList.remove('is-lowest', 'is-highest', 'card-enter');
        card.style.display = 'none';
      }
    });
    allValIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    allCostIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '';
    });

    // Populate cards
    entries.forEach(function (e) {
      var card = document.getElementById(e.cardId);
      var valEl = document.getElementById(e.valId);
      var costEl = document.getElementById(e.costId);

      if (!card || !valEl) return;

      card.style.display = '';
      var rounded = Math.round(e.monthly);

      // Animate number
      if (typeof animateNumber === 'function') {
        var prevVal = parseInt(valEl.textContent.replace(/,/g, ''), 10);
        if (isNaN(prevVal)) prevVal = 0;
        animateNumber(valEl, prevVal, rounded, 500);
      } else {
        valEl.textContent = rounded.toLocaleString('en-US');
      }

      // Cost
      if (costEl) {
        var monthlyGB = (e.monthly * avgLogSizeKB) / (1024 * 1024);
        var monthlyCost = monthlyGB * pricePerGB;
        costEl.textContent = '~$' + monthlyCost.toFixed(2) + '/mo';
      }

      // Coloring
      if (!allEqual && entries.length > 1) {
        if (e.monthly === minVal) card.classList.add('is-lowest');
        if (e.monthly === maxVal) card.classList.add('is-highest');
      }
    });

    // Animate card entrance
    if (typeof animateCards === 'function') {
      animateCards(document.querySelector('.results-grid'));
    }

    // Show results
    resultsArea.classList.add('visible');

    // Update bar chart
    updateBarChart(entries, maxVal, minVal, allEqual);
  }

  function updateBarChart(entries, maxVal, minVal, allEqual) {
    var barContainer = document.getElementById('barChartBars');
    if (!barContainer || !barChart) return;

    barContainer.innerHTML = '';

    entries.forEach(function (e) {
      var pct = maxVal > 0 ? (e.monthly / maxVal) * 100 : 0;

      var row = document.createElement('div');
      row.className = 'bar-row';

      var label = document.createElement('div');
      label.className = 'bar-label';
      label.textContent = e.label;

      var track = document.createElement('div');
      track.className = 'bar-track';

      var fill = document.createElement('div');
      fill.className = 'bar-fill';
      if (!allEqual && entries.length > 1) {
        if (e.monthly === minVal) fill.classList.add('is-lowest');
        if (e.monthly === maxVal) fill.classList.add('is-highest');
      }
      fill.style.width = '0%';
      fill.textContent = Math.round(e.monthly).toLocaleString('en-US');

      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      barContainer.appendChild(row);

      // Trigger animation
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          fill.style.width = Math.max(pct, 8) + '%';
        });
      });
    });

    barChart.classList.add('visible');
  }

  function copyResults() {
    var resultsEl = document.getElementById('logsResults');
    if (!resultsEl) return;

    var cards = resultsEl.querySelectorAll('.result-card');
    var lines = [];

    cards.forEach(function (card) {
      if (card.style.display === 'none') return;
      var label = card.querySelector('.result-label');
      var value = card.querySelector('.result-value');
      var cost = card.querySelector('.result-cost');
      if (label && value) {
        var line = label.textContent + ': ' + value.textContent + ' logs/month';
        if (cost && cost.textContent) {
          line += ' (' + cost.textContent + ')';
        }
        lines.push(line);
      }
    });

    if (lines.length === 0) return;

    var text = 'Datadog Logs — Monthly Estimates\n' + lines.join('\n');

    navigator.clipboard.writeText(text).then(function () {
      if (typeof showToast === 'function') {
        showToast('Copied to clipboard!');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
