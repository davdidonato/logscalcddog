/* ══════════════════════════════════════════════
   SCRATCHPAD CALCULATOR
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  var MAX_HISTORY = 20;
  var STORAGE_HISTORY = 'dd-calc-history';
  var STORAGE_MEMORY = 'dd-calc-memory';

  var calcAEl, calcBEl, calcOpEl, calcResultBox, calcValEl;
  var historyContainer, historyList;
  var memoryValue = 0;
  var calcHistory = [];
  var debounceTimer = null;

  function init() {
    calcAEl = document.getElementById('calcA');
    calcBEl = document.getElementById('calcB');
    calcOpEl = document.getElementById('calcOp');
    calcResultBox = document.getElementById('calcResult');
    calcValEl = document.getElementById('calcVal');
    historyContainer = document.getElementById('calcHistory');

    // Load persisted state
    loadHistory();
    loadMemory();
    renderHistory();
    updateMemoryIndicator();

    // Real-time calculation
    [calcAEl, calcBEl].forEach(function (el) {
      if (el) {
        el.addEventListener('input', debouncedCompute);
        el.addEventListener('keydown', handleKeydown);
      }
    });

    if (calcOpEl) {
      calcOpEl.addEventListener('change', function () {
        toggleBVisibility();
        debouncedCompute();
      });
    }

    // Memory buttons
    bindButton('btnMPlus', memoryPlus);
    bindButton('btnMMinus', memoryMinus);
    bindButton('btnMR', memoryRecall);
    bindButton('btnMC', memoryClear);
    bindButton('btnClearHistory', clearHistory);

    toggleBVisibility();
  }

  function bindButton(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }

  function debouncedCompute() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(computeCalc, 150);
  }

  function toggleBVisibility() {
    var op = calcOpEl.value;
    var bGroup = document.getElementById('calcBGroup');
    if (bGroup) {
      bGroup.style.display = (op === 'sqrt') ? 'none' : '';
    }
  }

  function computeCalc() {
    var a = parseFloat(calcAEl.value);
    var op = calcOpEl.value;
    var b = parseFloat(calcBEl.value);

    if (isNaN(a)) {
      calcResultBox.classList.remove('visible');
      return;
    }

    // sqrt only needs A
    if (op === 'sqrt') {
      if (a < 0) {
        calcValEl.textContent = 'Invalid (negative)';
        calcResultBox.classList.add('visible');
        return;
      }
      var sqrtResult = Math.sqrt(a);
      displayResult(sqrtResult);
      addHistory('√' + formatDisplay(a), sqrtResult);
      return;
    }

    if (isNaN(b)) {
      calcResultBox.classList.remove('visible');
      return;
    }

    var result;
    var opSymbol;

    switch (op) {
      case '+':
        result = a + b;
        opSymbol = '+';
        break;
      case '-':
        result = a - b;
        opSymbol = '−';
        break;
      case '*':
        result = a * b;
        opSymbol = '×';
        break;
      case '/':
        if (b === 0) {
          calcValEl.textContent = 'Division by zero';
          calcResultBox.classList.add('visible');
          return;
        }
        result = a / b;
        opSymbol = '÷';
        break;
      case '%':
        if (b === 0) {
          calcValEl.textContent = 'Division by zero';
          calcResultBox.classList.add('visible');
          return;
        }
        result = a % b;
        opSymbol = '%';
        break;
      case '^':
        result = Math.pow(a, b);
        opSymbol = '^';
        break;
      default:
        return;
    }

    displayResult(result);
    addHistory(formatDisplay(a) + ' ' + opSymbol + ' ' + formatDisplay(b), result);
  }

  function displayResult(result) {
    var formatted = parseFloat(result.toFixed(8)).toLocaleString('en-US', { maximumFractionDigits: 8 });
    calcValEl.textContent = formatted;
    calcResultBox.classList.add('visible');
  }

  function formatDisplay(n) {
    return parseFloat(n.toFixed(6)).toLocaleString('en-US', { maximumFractionDigits: 6 });
  }

  // ── History ──
  function addHistory(expression, result) {
    var entry = {
      expr: expression,
      result: result,
      time: Date.now()
    };

    // Avoid duplicate consecutive entries
    if (calcHistory.length > 0) {
      var last = calcHistory[0];
      if (last.expr === entry.expr && last.result === entry.result) return;
    }

    calcHistory.unshift(entry);
    if (calcHistory.length > MAX_HISTORY) {
      calcHistory.pop();
    }

    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (!historyContainer) return;

    var list = historyContainer.querySelector('.calc-history-list');
    if (!list) return;

    if (calcHistory.length === 0) {
      historyContainer.classList.remove('visible');
      return;
    }

    historyContainer.classList.add('visible');
    list.innerHTML = '';

    calcHistory.forEach(function (entry, index) {
      var item = document.createElement('div');
      item.className = 'history-item';

      var expr = document.createElement('span');
      expr.className = 'history-expr';
      expr.textContent = entry.expr;

      var res = document.createElement('span');
      res.className = 'history-result';
      res.textContent = '= ' + formatDisplay(entry.result);

      var reuseBtn = document.createElement('button');
      reuseBtn.className = 'btn btn-sm btn-secondary';
      reuseBtn.textContent = 'Use';
      reuseBtn.title = 'Load result into A';
      reuseBtn.addEventListener('click', function () {
        calcAEl.value = entry.result;
        calcAEl.focus();
        debouncedCompute();
      });

      item.appendChild(expr);
      item.appendChild(res);
      item.appendChild(reuseBtn);
      list.appendChild(item);
    });
  }

  function clearHistory() {
    calcHistory = [];
    saveHistory();
    renderHistory();
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_HISTORY, JSON.stringify(calcHistory));
    } catch (e) { /* ignore */ }
  }

  function loadHistory() {
    try {
      var stored = localStorage.getItem(STORAGE_HISTORY);
      if (stored) calcHistory = JSON.parse(stored);
    } catch (e) {
      calcHistory = [];
    }
  }

  // ── Memory ──
  function memoryPlus() {
    var current = parseFloat(calcValEl.textContent.replace(/,/g, ''));
    if (!isNaN(current)) {
      memoryValue += current;
      saveMemory();
      updateMemoryIndicator();
      if (typeof showToast === 'function') showToast('M+ : ' + formatDisplay(memoryValue));
    }
  }

  function memoryMinus() {
    var current = parseFloat(calcValEl.textContent.replace(/,/g, ''));
    if (!isNaN(current)) {
      memoryValue -= current;
      saveMemory();
      updateMemoryIndicator();
      if (typeof showToast === 'function') showToast('M− : ' + formatDisplay(memoryValue));
    }
  }

  function memoryRecall() {
    calcAEl.value = memoryValue;
    calcAEl.focus();
    debouncedCompute();
  }

  function memoryClear() {
    memoryValue = 0;
    saveMemory();
    updateMemoryIndicator();
    if (typeof showToast === 'function') showToast('Memory cleared');
  }

  function updateMemoryIndicator() {
    var mrBtn = document.getElementById('btnMR');
    if (mrBtn) {
      if (memoryValue !== 0) {
        mrBtn.classList.add('has-memory');
      } else {
        mrBtn.classList.remove('has-memory');
      }
    }
  }

  function saveMemory() {
    try {
      localStorage.setItem(STORAGE_MEMORY, JSON.stringify(memoryValue));
    } catch (e) { /* ignore */ }
  }

  function loadMemory() {
    try {
      var stored = localStorage.getItem(STORAGE_MEMORY);
      if (stored !== null) memoryValue = JSON.parse(stored);
    } catch (e) {
      memoryValue = 0;
    }
  }

  // ── Keyboard shortcuts ──
  function handleKeydown(e) {
    if (e.key === 'Enter') {
      computeCalc();
      return;
    }
    if (e.key === 'Escape') {
      calcAEl.value = '';
      calcBEl.value = '';
      calcResultBox.classList.remove('visible');
      return;
    }
  }

  // Global keyboard listener for operator shortcuts
  document.addEventListener('keydown', function (e) {
    // Only if scratchpad section is in view and no other input is focused
    var active = document.activeElement;
    if (!active || (active !== calcAEl && active !== calcBEl)) return;

    var opMap = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%',
      '^': '^'
    };

    if (opMap[e.key] && calcOpEl) {
      var opt = calcOpEl.querySelector('option[value="' + opMap[e.key] + '"]');
      if (opt) {
        e.preventDefault();
        calcOpEl.value = opMap[e.key];
        toggleBVisibility();
        calcBEl.focus();
        debouncedCompute();
      }
    }
  });

  document.addEventListener('DOMContentLoaded', init);
})();
