// js/playground.js — Unified Closure Playground
// ─────────────────────────────────────────────────────────────────────────────
// State: each language is just a string stored in pgState.l1 / pgState.l2
// ─────────────────────────────────────────────────────────────────────────────

// Digit → Superscript (shared with simulate.js pattern)
const PG_SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
function pgDigitToSup(ch) { return PG_SUP[ch] ?? ch; }

const pgState = { l1: '', l2: '' };

function initPlayground() {

  // ── Operation buttons ──
  document.querySelectorAll('.pg-op').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pg-op').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Toggle L2 opacity for complement (unary)
      const isComplement = btn.dataset.op === 'complement';
      document.getElementById('pg-card-l2').style.opacity = isComplement ? '.4' : '1';
      document.getElementById('pg-card-l2').style.pointerEvents = isComplement ? 'none' : '';
      const hint = document.getElementById('pg-op-hint');
      hint.style.display = isComplement ? 'block' : 'none';
    });
  });

  // Initially hide the hint
  document.getElementById('pg-op-hint').style.display = 'none';

  // ── Keyboard / chip buttons ──
  document.querySelectorAll('.pg-kb').forEach(kb => {
    const target = kb.dataset.target; // 'l1' or 'l2'

    kb.querySelectorAll('.pg-kb-key').forEach(key => {
      key.addEventListener('click', () => {
        if (key.dataset.action === 'del') {
          // Backspace — remove last char
          pgState[target] = pgState[target].slice(0, -1);
        } else {
          // Preset: REPLACE full value; Symbol: APPEND
          const isPreset = key.classList.contains('pg-kb-wide');
          pgState[target] = isPreset ? key.dataset.val : pgState[target] + key.dataset.val;
        }
        renderDisplay(target);
        renderBadge(target);
      });
    });
  });

  // ── Clear buttons ──
  document.getElementById('pg-clear-l1').addEventListener('click', () => clearLang('l1'));
  document.getElementById('pg-clear-l2').addEventListener('click', () => clearLang('l2'));

  // ── Preset dropdowns ──
  ['l1', 'l2'].forEach(which => {
    const sel = document.getElementById(`pg-preset-${which}`);
    if (!sel) return;
    sel.addEventListener('change', () => {
      const val = sel.value;
      if (!val) return;
      pgState[which] = val;
      renderDisplay(which);
      renderBadge(which);
      sel.value = ''; // reset back to placeholder
    });
  });

  // ── Compute ──
  document.getElementById('pg-compute-btn').addEventListener('click', computePlayground);

  // ── Physical keyboard on real <input> elements ──
  ['l1', 'l2'].forEach(which => {
    const inp = document.getElementById(`pg-display-${which}`);

    // Intercept digit keys BEFORE they land in the input value
    inp.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') { computePlayground(); e.preventDefault(); return; }
      if (e.key === 'Tab') {
        const other = which === 'l1' ? 'l2' : 'l1';
        document.getElementById(`pg-display-${other}`).focus();
        e.preventDefault(); return;
      }
      if (/^[0-9]$/.test(e.key)) {
        // Insert superscript at cursor position instead of the raw digit
        const sup = pgDigitToSup(e.key);
        const start = inp.selectionStart, end = inp.selectionEnd;
        inp.value = inp.value.slice(0, start) + sup + inp.value.slice(end);
        inp.selectionStart = inp.selectionEnd = start + sup.length;
        pgState[which] = inp.value;
        renderBadge(which);
        e.preventDefault();
      }
    });

    // Sync any other typing (letters, *, backspace, etc.) to pgState
    inp.addEventListener('input', () => {
      pgState[which] = inp.value;
      renderBadge(which);
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearLang(which) {
  pgState[which] = '';
  const inp = document.getElementById(`pg-display-${which}`);
  if (inp) inp.value = '';
  renderBadge(which);
}

function renderDisplay(which) {
  // With real <input> elements, just sync the value from pgState
  const inp = document.getElementById(`pg-display-${which}`);
  if (inp && inp.tagName === 'INPUT') {
    inp.value = pgState[which];
  }
}

function renderBadge(which) {
  const badge = document.getElementById(`pg-badge-${which}`);
  const val   = pgState[which].trim();

  if (!val) { badge.textContent = ''; badge.className = 'pg-inferred-badge'; return; }

  const rule = classifyInput(val);
  if (!rule) {
    badge.textContent = '? unrecognized';
    badge.className   = 'pg-inferred-badge badge-unknown';
    return;
  }
  const labels = { reg:'Type 3 — Regular', cf:'Type 2 — Context-Free', cs:'Type 1 — Context-Sensitive', re:'Type 0 — RE' };
  badge.textContent = labels[rule.type];
  badge.className   = `pg-inferred-badge badge-type-${rule.type}`;
}

// ─── Compute ──────────────────────────────────────────────────────────────────

function computePlayground() {
  const raw1 = pgState.l1.trim();
  const raw2 = pgState.l2.trim();
  const op   = document.querySelector('.pg-op.active').dataset.op;

  const resultArea = document.getElementById('pg-result-area');
  resultArea.classList.remove('hidden');

  const rule1 = raw1 ? classifyInput(raw1) : null;
  const rule2 = raw2 ? classifyInput(raw2) : null;

  if (!raw1 || !rule1) {
    renderError('Language 1', raw1);
    return;
  }
  if (op !== 'complement' && (!raw2 || !rule2)) {
    renderError('Language 2', raw2);
    return;
  }

  // Build language objects from classifier rule
  const levelMap   = { reg:3, cf:2, cs:1, re:0 };
  const typeNames  = { 3:'Regular', 2:'Context-Free', 1:'Context-Sensitive', 0:'Recursively Enumerable' };
  const typeBadges = { 3:'Type 3', 2:'Type 2', 1:'Type 1', 0:'Type 0' };
  const typeColors = { 3:'#5c4bcc', 2:'#0d9e8a', 1:'#f07d00', 0:'#e63950' };
  const typeBg     = { 3:'rgba(92,75,204,.12)', 2:'rgba(13,158,138,.12)', 1:'rgba(240,125,0,.12)', 0:'rgba(230,57,80,.12)' };
  const opSym      = { union:'∪', intersection:'∩', complement:'∁', concatenation:'·' };

  const l1 = { level: levelMap[rule1.type], color: rule1.type, label: raw1, samples: rule1.samples || [] };
  const l2 = rule2 ? { level: levelMap[rule2.type], color: rule2.type, label: raw2, samples: rule2.samples || [] } : l1;

  const isUnary = op === 'complement';

  // For binary ops, the "effective" level is the LOWER (more restricted) class.
  // e.g. CF ∩ Regular: inputLevel = min(2,3) = 2 (CF). We do closure check at CF level.
  const inputLevel = isUnary ? l1.level : Math.min(l1.level, l2.level);
  const bothSame   = isUnary || (l1.level === l2.level);

  // Special case: CFL ∩ Regular IS closed (result is always CFL — important theorem).
  // We only mark isClosed=false when both langs are the same type AND the class is not closed.
  let isClosed;
  if (op === 'intersection' && !isUnary && l1.level !== l2.level &&
      (l1.level === 2 || l2.level === 2) &&
      (l1.level === 3 || l2.level === 3)) {
    // CFL ∩ Regular = CFL — this IS closed
    isClosed = true;
  } else {
    isClosed = bothSame ? CLOSURE[inputLevel][op] : true;
  }

  // Determine the result class level when closure is NOT preserved
  let displayLevel = inputLevel;
  if (!isClosed) {
    if (inputLevel === 2 && (op === 'intersection' || op === 'complement')) {
      // CFL ∩ CFL or complement CFL: result may exit CFL — worst case is CS (Type 1)
      // but it could be any class; we display it as "at most CS" (conservative upper bound)
      displayLevel = 1;
    } else if (inputLevel === 0 && op === 'complement') {
      // Complement of RE is co-RE — not RE, not CS. Keep at 0 to signal "outside normal hierarchy".
      displayLevel = 0;
    } else {
      displayLevel = Math.max(0, inputLevel - 1);
    }
  }

  // Build explanation
  let explain;
  if (!bothSame) {
    const higherName = typeNames[inputLevel];       // e.g. "Context-Free"
    const lowerName  = typeNames[Math.max(l1.level, l2.level)]; // e.g. "Regular"
    const mixed = {
      // CFL ∪ Regular = CFL, CFL · Regular = CFL, CFL ∩ Regular = CFL (well-known theorems)
      union:         `${higherName} is closed under union. The union of a ${lowerName} and a ${higherName} language stays within ${higherName}.`,
      intersection:  (
        (inputLevel === 2 && (l1.level === 3 || l2.level === 3))
          ? `CFLs are closed under intersection with Regular languages. This is a key theorem: CFL ∩ Regular = CFL. The result is still a CFL.`
          : `${higherName} is closed under intersection. The result stays within ${higherName}.`
      ),
      concatenation: `${higherName} is closed under concatenation. Concatenating a ${lowerName} and a ${higherName} language stays within ${higherName}.`,
    };
    explain = mixed[op] || CLOSURE_EXPLAIN[inputLevel][op];
  } else {
    explain = CLOSURE_EXPLAIN[inputLevel][op];
  }

  const rColor = typeColors[displayLevel];

  const exData    = generateExamples(l1, l2, op);
  const inputLabel = isUnary
    ? `∁ ${typeNames[l1.level]}`
    : `${typeNames[l1.level]} ${opSym[op]} ${typeNames[l2.level]}`;
  const inputNote = (!isUnary && l1.level !== l2.level)
    ? `<div style="font-size:.78rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:.3rem">
        ${typeBadges[l1.level]} and ${typeBadges[l2.level]} → closure checked against <strong style="color:${typeColors[inputLevel]}">${typeBadges[inputLevel]}</strong>
      </div>` : '';

  // Show what was entered as a formula at the top
  const formula = `
    <div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-bottom:.8rem">
      <span style="font-family:'JetBrains Mono',monospace;font-size:.88rem;background:var(--surface2);padding:5px 13px;border-radius:6px;border:1.5px solid var(--border);color:var(--text)">${escHtml(raw1)}</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:1.1rem;color:var(--muted)">${opSym[op]}</span>
      ${!isUnary ? `<span style="font-family:'JetBrains Mono',monospace;font-size:.88rem;background:var(--surface2);padding:5px 13px;border-radius:6px;border:1.5px solid var(--border);color:var(--text)">${escHtml(raw2)}</span>` : ''}
    </div>`;

  document.getElementById('pg-result-header').innerHTML = `
    ${formula}
    <div style="font-family:'JetBrains Mono',monospace;font-size:.62rem;letter-spacing:.18em;color:var(--muted);margin-bottom:.5rem">OPERATION RESULT</div>
    <div class="pg-res-title" style="color:${rColor}">${inputLabel}</div>
    ${inputNote}
    <span class="pg-res-badge ${isClosed ? 'badge-yes' : 'badge-no'}">
      ${isClosed ? '✓ Closure PRESERVED' : '✗ Closure NOT PRESERVED'}
    </span>
    <div style="font-size:.82rem;color:var(--muted);font-family:'JetBrains Mono',monospace">
      Result class: <strong style="color:${rColor}">${typeBadges[displayLevel]} — ${typeNames[displayLevel]}</strong>
    </div>`;

  document.getElementById('pg-result-body').innerHTML = `
    <p class="pg-explain">${explain}</p>
    ${ (exData.strings.length === 1 && exData.strings[0] === 'ε' && displayLevel < 3)
      ? `<div style="margin-top:1rem;margin-bottom:1rem;padding:12px 14px;background:rgba(92,75,204,.08);border-left:4px solid #5c4bcc;font-size:.85rem;color:var(--text);border-radius:4px;line-height:1.5;">
           <strong style="color:#5c4bcc;">Wait, shouldn't this be Type 3?</strong><br/>
           You noticed! The actual intersection of your two specific patterns only yields the empty string <code style="color:#5c4bcc;font-family:'JetBrains Mono',monospace">{ε}</code>. Since <code style="color:#5c4bcc;font-family:'JetBrains Mono',monospace">{ε}</code> is a finite language, it is indeed <strong>Type 3 — Regular</strong>!<br/><br/>
           However, the Closure Playground calculates the <em>mathematical bounds of the operation</em> on the language classes, not individual strings. While your specific intersection happens to be Regular, intersecting an arbitrary Type ${displayLevel} language with another guarantees bounded closure in <strong>Type ${displayLevel}</strong>.
         </div>`
      : ''
    }
    <div class="pg-examples-box" style="border-color:${rColor}40">
      <span class="pg-examples-title">EXAMPLE OUTPUT STRINGS</span>
      <ul class="pg-examples-list">
        ${exData.strings.map(s => `<li style="border-color:${rColor}">${s}</li>`).join('')}
      </ul>
      <div style="margin-top:.5rem;font-size:.78rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${exData.desc}</div>
    </div>
    ${buildClosureGrid(inputLevel, op, typeColors)}`;
}

function renderError(which, raw) {
  const msg = raw
    ? `Could not classify <strong>"${escHtml(raw)}"</strong>. Try a preset from the keyboard above, or type: <code style="color:var(--cf);font-family:'JetBrains Mono',monospace">aⁿbⁿ</code>, <code style="color:var(--cf);font-family:'JetBrains Mono',monospace">aⁿbⁿcⁿ</code>, <code style="color:var(--cf);font-family:'JetBrains Mono',monospace">palindrome</code> etc.`
    : `${which} is empty — use the keyboard above to enter a language.`;

  document.getElementById('pg-result-header').innerHTML = `
    <div style="text-align:center;padding:.5rem 0">
      <div style="font-size:1.8rem;margin-bottom:.5rem">⚠️</div>
      <div style="font-weight:700;margin-bottom:.4rem">${which} unrecognized</div>
      <div style="font-size:.88rem;color:var(--muted);line-height:1.65">${msg}</div>
    </div>`;
  document.getElementById('pg-result-body').innerHTML = '';
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function generateExamples(l1, l2, op) {
  const s1 = l1.samples || [];
  const s2 = l2 ? (l2.samples || []) : [];
  let res = [], desc = '';

  if (op === 'union') {
    res  = [...new Set([...s1, ...s2])].sort(() => Math.random() - 0.5).slice(0, 6);
    desc = `strings that belong to either ${l1.label} or ${l2.label}`;
  } else if (op === 'concatenation') {
    const p1 = s1.slice(0, 3), p2 = s2.slice(0, 3);
    p1.forEach(a => p2.forEach(b => {
      const c = (a === 'ε' ? '' : a) + (b === 'ε' ? '' : b);
      res.push(c || 'ε');
    }));
    res  = [...new Set(res)].slice(0, 6);
    desc = `strings formed by taking one from L1 and appending one from L2`;
  } else if (op === 'intersection') {
    res = s1.filter(s => s2.includes(s));
    if (res.length < 2) {
      desc = 'intersection narrows the language — strings must satisfy BOTH patterns';
      res  = res.length ? res : ['ε (only the empty string may match, or the intersection is empty)'];
    } else {
      desc = `strings satisfying both the ${l1.label} and ${l2.label} patterns`;
    }
  } else if (op === 'complement') {
    desc = `all strings over the alphabet NOT in ${l1.label}`;
    res  = ['strings not matching the pattern', '(complement depends on the full alphabet Σ*)'];
  }
  return { strings: res, desc };
}

function buildClosureGrid(activeLevel, activeOp, colors) {
  const ops    = ['union', 'intersection', 'complement', 'concatenation'];
  const opSym  = { union:'∪', intersection:'∩', complement:'∁', concatenation:'·' };
  const levels = [3, 2, 1, 0];
  const typeShort = { 3:'Reg', 2:'CF', 1:'CS', 0:'RE' };

  let html = '<div style="margin-top:1.5rem"><div style="font-family:\'JetBrains Mono\',monospace;font-size:.62rem;letter-spacing:.18em;color:var(--muted);margin-bottom:.75rem">FULL CLOSURE TABLE</div>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-family:\'JetBrains Mono\',monospace;font-size:.75rem">';
  html += '<thead><tr><th style="padding:8px 12px;text-align:left;color:var(--muted);border-bottom:1.5px solid var(--border)">Operation</th>';
  levels.forEach(l => {
    html += `<th style="padding:8px 12px;text-align:center;color:${colors[l]};border-bottom:1.5px solid var(--border)">${typeShort[l]}</th>`;
  });
  html += '</tr></thead><tbody>';

  ops.forEach(op => {
    const isActiveOp = op === activeOp;
    html += `<tr style="${isActiveOp ? 'background:var(--surface2)' : ''}">`;
    html += `<td style="padding:8px 12px;color:var(--text);font-weight:${isActiveOp ? '700' : '400'}">${opSym[op]} ${op.charAt(0).toUpperCase() + op.slice(1)}</td>`;
    levels.forEach(l => {
      const val      = CLOSURE[l][op];
      const isActive = isActiveOp && l === activeLevel;
      const txt      = val ? '✓' : '✗';
      const clr      = val ? '#0d9e8a' : '#e63950';
      html += `<td style="padding:8px 12px;text-align:center;color:${clr};font-weight:${isActive ? '800' : '400'};background:${isActive ? (val ? 'rgba(13,158,138,.1)' : 'rgba(230,57,80,.1)') : ''}">${txt}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div></div>';
  return html;
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}