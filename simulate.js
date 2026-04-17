// js/simulate.js — Smart language classifier with keyboard + step diagrams

// ── DIGIT → SUPERSCRIPT MAP ──────────────────────────────────────────────────
const SIM_SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
function digitToSup(ch) { return SIM_SUP[ch] ?? ch; }

// ── STATE ────────────────────────────────────────────────────────────────────
let simInput = '';

// ── INIT ─────────────────────────────────────────────────────────────────────
function initSimulate() {
  // Keyboard buttons
  document.querySelectorAll('.kb-key').forEach(btn => {
    if (btn.id === 'kb-backspace') return;
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      simInput += digitToSup(val);
      updateDisplay();
    });
  });

  document.getElementById('kb-backspace').addEventListener('click', () => {
    simInput = simInput.slice(0, -1);
    updateDisplay();
  });

  document.getElementById('sim-clear-btn').addEventListener('click', () => {
    simInput = '';
    updateDisplay();
    document.getElementById('sim-results').classList.add('hidden');
  });

  document.getElementById('sim-preset').addEventListener('change', function() {
    if (this.value) {
      simInput = this.value;
      updateDisplay();
    }
  });

  document.getElementById('sim-classify-btn').addEventListener('click', classify);

  // Physical keyboard support
  document.addEventListener('keydown', (e) => {
    // Only listen if the simulate tab is active
    if (!document.getElementById('tab-simulate').classList.contains('active')) return;
    
    // Don't interfere with dropdowns or other inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Backspace') {
      simInput = simInput.slice(0, -1);
      updateDisplay();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      classify();
      e.preventDefault();
    } else if (e.key.length === 1) {
      // Allow letters, numbers, operators, and space
      if (/[a-zA-Z0-9*+()|\^ ]/.test(e.key)) {
        if (e.key === '(') {
          simInput += '()';
        } else if (/[0-9]/.test(e.key)) {
          // Convert digits to superscript (e.g. 3 → ³)
          simInput += digitToSup(e.key);
        } else {
          simInput += e.key.toLowerCase();
        }
        updateDisplay();
        e.preventDefault();
      }
    }
  });
}

function formatDisplay(s) {
  return escHtml(s)
    .replace(/\*/g, "<sup style='font-size:0.65em'>*</sup>")
    .replace(/⁺/g, "<sup style='font-size:0.65em'>+</sup>");
}

function updateDisplay() {
  const d = document.getElementById('sim-display');
  d.innerHTML = simInput ? `<span style="color:#fff">${formatDisplay(simInput)}</span><span class="cursor">|</span>` : `<span class="cursor">|</span>`;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── CLASSIFIER (uses classify.js) ────────────────────────────────────────────
function classify() {
  const raw = simInput.trim();
  if (!raw) { flashDisplay(); return; }

  // classifyInput() is defined in classify.js (loaded before this file)
  const rule = classifyInput(raw);
  if (!rule) { showUnknown(raw); return; }

  showResults(rule, raw);
}

// ── DISPLAY ───────────────────────────────────────────────────────────────────
function showResults(rule, input) {
  const colors  = { reg:'#5c4bcc', cf:'#0d9e8a', cs:'#f07d00', re:'#e63950' };
  const bgColors= { reg:'rgba(92,75,204,.1)', cf:'rgba(13,158,138,.1)', cs:'rgba(240,125,0,.1)', re:'rgba(230,57,80,.1)' };
  const names   = { reg:'Regular Language', cf:'Context-Free Language', cs:'Context-Sensitive Language', re:'Recursively Enumerable' };
  const badges  = { reg:'Type 3', cf:'Type 2', cs:'Type 1', re:'Type 0' };
  const color = colors[rule.type];

  const results = document.getElementById('sim-results');
  results.classList.remove('hidden');

  // Verdict
  const vb = document.getElementById('sim-verdict-box');
  vb.style.borderColor = color;
  vb.style.background = bgColors[rule.type];
  vb.innerHTML = `
    <div class="verd-tag" style="color:${color}">${badges[rule.type]} — ${names[rule.type]}</div>
    <div class="verd-name" style="color:${color}">"${escHtml(input)}"</div>
    <div class="verd-desc">This language belongs to the <strong style="color:${color}">${names[rule.type]}</strong> class — the tightest Chomsky type that accepts it.</div>
  `;

  // Steps with staggered animation + interactive mini testers
  const list = document.getElementById('sim-steps-list');
  list.innerHTML = '';

  // 1. Pick a good example string based on language type
  const exampleMap = { reg: 'aabb', cf: 'aabb', cs: 'aabbcc', re: 'abc' };
  const exampleStr = exampleMap[rule.type] || 'ab';

  rule.steps.forEach((step, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'sim-step';
      div.style.animationDelay = '0s';

      const isPass = step.result === 'pass';
      const iconCls = isPass ? 'pass' : 'fail';
      const icon    = isPass ? '✓' : '✗';

      // We'll show the formal diagram SVG only
      const diagHtml = step.diagram ? `
        <div class="step-diagram-wrap" id="step-diag-wrap-${i}" style="cursor:pointer; transition: transform 0.2s;" title="Click to explore this automaton">
          <div class="step-diagram" id="step-diag-${i}"></div>
        </div>
      ` : '';

      div.innerHTML = `
        <div class="step-icon ${iconCls}">${icon}</div>
        <div class="step-body">
          <div class="step-title ${iconCls}">${step.check}</div>
          <div class="step-detail">${step.detail}</div>
          <div class="step-rule">${step.rule}</div>
          ${diagHtml}
        </div>
      `;
      list.appendChild(div);

      // Initialize the formal diagram
      if (step.diagram) {
        // Add formal diagram via venn.js helper — pass the expression for precise DFA
        if (typeof buildDiagramInto === 'function') {
          buildDiagramInto(`step-diag-${i}`, step.diagram, isPass ? '#0d9e8a' : '#e63950', `step-${i}`, input);
        }

        // Add click listener to open modal
        const wrap = div.querySelector(`#step-diag-wrap-${i}`);
        wrap.addEventListener('click', () => {
          // Open the modal for this language type
          const typeMap = { dfa:'reg', pda:'cf', lba:'cs', tm:'re' };
          if (typeof openAutomatonModal === 'function') {
            openAutomatonModal(typeMap[step.diagram], input, isPass);
          }
        });
      }

      div.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }, i * 420);
  });
}

function showUnknown(input) {
  const results = document.getElementById('sim-results');
  results.classList.remove('hidden');
  document.getElementById('sim-steps-list').innerHTML = '';

  const vb = document.getElementById('sim-verdict-box');
  vb.style.borderColor = '#f07d00';
  vb.style.background = 'rgba(240,125,0,.08)';
  vb.innerHTML = `
    <div class="verd-tag" style="color:#f07d00">PATTERN NOT RECOGNIZED</div>
    <div class="verd-name" style="color:#f07d00">"${escHtml(input)}"</div>
    <div class="verd-desc">
      Try using the preset keyboard buttons or pick from the dropdown.<br><br>
      <strong>Recognizable patterns include:</strong><br>
      • Regular: <code>a*</code>, <code>a*b*</code>, <code>(ab)*</code>, "strings ending in ab"<br>
      • Context-Free: <code>aⁿbⁿ</code>, "palindrome", "balanced parentheses"<br>
      • Context-Sensitive: <code>aⁿbⁿcⁿ</code>, <code>aⁿbⁿcⁿdⁿ</code>, <code>aⁿbⁿcⁿdⁿeⁿ</code>, <code>ww</code><br>
      • RE: "halting problem", "post correspondence"
    </div>
  `;
}

function flashDisplay() {
  const d = document.getElementById('sim-display-wrap');
  d.style.outline = '2px solid #e63950';
  setTimeout(() => d.style.outline = '', 600);
}

// End of simulate.js