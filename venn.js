// ── SVG HELPERS ───────────────────────────────────────────────────────────────
const NS = 'http://www.w3.org/2000/svg';


function mkSVG(vb) {
  const s = document.createElementNS(NS,'svg');
  s.setAttribute('viewBox', vb);
  return s;
}
function mkDefs(uid, color) {
  const d = document.createElementNS(NS,'defs');
  d.innerHTML = `
    <marker id="ar-${uid}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="${color}"/>
    </marker>
    <filter id="gl-${uid}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  return d;
}
function mkPath(d, color, uid, delay=0) {
  const p = document.createElementNS(NS,'path');
  p.setAttribute('d',d); p.setAttribute('stroke',color);
  p.setAttribute('stroke-width','2'); p.setAttribute('fill','none');
  p.setAttribute('marker-end',`url(#ar-${uid})`);
  p.classList.add('aline'); p.style.animationDelay=`${delay}s`;
  return p;
}
function mkText(x,y,txt,{fs=11,fill='#ccc',fw='400',anchor='middle',ff='JetBrains Mono, monospace'}={}) {
  const t = document.createElementNS(NS,'text');
  t.setAttribute('x',x); t.setAttribute('y',y);
  t.setAttribute('text-anchor',anchor);
  t.setAttribute('font-family',ff);
  t.setAttribute('font-size',fs); t.setAttribute('fill',fill);
  t.setAttribute('font-weight',fw);
  t.textContent = txt;
  return t;
}
function mkState(svg,{x,y,label,accept,start,color,uid,R=24}) {
  if(start) {
    svg.appendChild(mkPath(`M${x-R-24},${y} L${x-R-2},${y}`, color, uid));
  }
  if(accept) {
    const o=document.createElementNS(NS,'circle');
    o.setAttribute('cx',x); o.setAttribute('cy',y); o.setAttribute('r',R+6);
    o.setAttribute('stroke',color); o.setAttribute('stroke-width','2');
    o.setAttribute('fill','none'); o.setAttribute('opacity','.7');
    svg.appendChild(o);
  }
  const c=document.createElementNS(NS,'circle');
  c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',R);
  c.setAttribute('stroke',color); c.setAttribute('stroke-width','2.5');
  c.setAttribute('fill', accept?`${color}28`:'rgba(255,255,255,0.06)');
  c.setAttribute('data-state-id', label); // use data-attribute for matching
  c.style.transition = 'all 0.3s ease';
  if(accept) c.setAttribute('filter',`url(#gl-${uid})`);
  svg.appendChild(c);
  svg.appendChild(mkText(x,y+5,label,{fill:accept?color:'#ddd',fw:accept?'700':'400',fs:12})); 
}

// ── STATE ────────────────────────────────────────────────────────────────────
let activeType = null;

// ── INIT ─────────────────────────────────────────────────────────────────────
function initVenn() {
  const vennContainer = document.getElementById('venn');
  
  // 3D tilt effect on mouse move
  vennContainer.addEventListener('mousemove', e => {
    const rect = vennContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12; // Max 12deg tilt
    const rotateY = ((x - centerX) / centerX) * 12;
    
    vennContainer.style.transition = 'none'; // disable transition for smooth tracking
    vennContainer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  
  vennContainer.addEventListener('mouseleave', () => {
    vennContainer.style.transition = 'transform 0.5s var(--ease)';
    vennContainer.style.transform = `rotateX(0deg) rotateY(0deg)`;
  });

  document.querySelectorAll('.v-ring').forEach(ring => {
    const t = ring.dataset.type;
    ring.addEventListener('mouseenter', () => { if (activeType !== t) dimAll(t); });
    ring.addEventListener('mouseleave', () => { if (activeType !== t) undimAll(); });
    ring.addEventListener('click', e => {
      e.stopPropagation();
      activeType === t ? closePanel() : activateType(t);
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#venn') && !e.target.closest('#info-panel')) closePanel();
  });
}

function dimAll(activeT) {
  document.querySelectorAll('.v-ring').forEach(r =>
    r.style.opacity = r.dataset.type === activeT ? '1' : '0.3');
}
function undimAll() {
  document.querySelectorAll('.v-ring').forEach(r => r.style.opacity = '1');
}

function activateType(type) {
  activeType = type;
  document.querySelectorAll('.v-ring').forEach(r => {
    r.classList.toggle('active', r.dataset.type === type);
    r.style.opacity = r.dataset.type === type ? '1' : '0.25';
  });
  document.getElementById('venn-wrap').classList.add('shifted');
  openPanel(CHOMSKY_DATA[type]);
}

function deactivateAll() {
  activeType = null;
  document.querySelectorAll('.v-ring').forEach(r => {
    r.classList.remove('active');
    r.style.opacity = '1';
  });
  document.getElementById('venn-wrap').classList.remove('shifted');
}

// ── PANEL ─────────────────────────────────────────────────────────────────────
function openPanel(data) {
  const p = document.getElementById('info-panel');
  p.className = ''; // clear classes
  void p.offsetWidth;
  p.classList.add('t-' + data.type);

  document.getElementById('panel-badge').textContent = data.badge;
  document.getElementById('panel-title').textContent = data.title;
  document.getElementById('panel-grammar').textContent = data.grammar;
  document.getElementById('panel-def').textContent = data.def;
  document.getElementById('panel-automaton').textContent = 'Recognized by: ' + data.automaton;

  const ul = document.getElementById('panel-examples');
  ul.innerHTML = '';
  data.examples.forEach((ex, i) => {
    const li = document.createElement('li');
    li.textContent = ex;
    li.style.animationDelay = `${0.3 + i * 0.07}s`;
    ul.appendChild(li);
  });

  const colors = { re:'#e63950', cs:'#f07d00', cf:'#0d9e8a', reg:'#5c4bcc' };
  buildDiagramInto('panel-diagram', data.diagram, colors[data.type], 'panel');

  p.classList.add('open');
  p.scrollTop = 0;
}

function closePanel() {
  const p = document.getElementById('info-panel');
  p.classList.remove('open');
  deactivateAll();
}

// ── EXPLORATION MODAL ─────────────────────────────────────────────────────────

document.getElementById('panel-diagram').addEventListener('click', () => {
  if (!activeType) return;
  openAutomatonModal(activeType);
});

function openAutomatonModal(type, inputStr = null, isPass = null) {
  const data = CHOMSKY_DATA[type];
  if (!data) return;
  
  const m = document.getElementById('automaton-modal');
  document.getElementById('modal-title').textContent = data.automaton;
  document.getElementById('modal-badge').textContent = data.badge;
  
  const colors = { re:'#e63950', cs:'#f07d00', cf:'#0d9e8a', reg:'#5c4bcc' };
  const color = colors[type];
  
  document.getElementById('modal-badge').style.color = color;
  document.getElementById('modal-badge').style.borderColor = color;
  document.getElementById('modal-title').style.color = color;
  
  // Re-build diagram into the modal container — pass the expression for precise DFA.
  buildDiagramInto('modal-diagram-container', data.diagram, color, 'modal', inputStr);
  
  const infoArea = document.querySelector('.modal-info');
  
  // Show Static Explanation and classification result summary
  infoArea.innerHTML = `
    <div class="modal-section-label">HOW IT WORKS</div>
    <p id="modal-explanation">${data.sim_explanation}</p>
    ${inputStr ? `
      <div class="modal-section-label" style="margin-top:2rem">RESULT FOR: "${inputStr}"</div>
      <div style="font-family:'JetBrains Mono', monospace; font-size:1.1rem; font-weight:700; color:${isPass ? 'var(--cf)' : 'var(--re)'}">
        ${isPass ? '✓ MATCHED' : '✗ FAILED'}
      </div>
    ` : ''}
  `;
  
  m.classList.remove('hidden');
}

function closeAutomatonModal() {
  document.getElementById('automaton-modal').classList.add('hidden');
  
  if (activeType) {
    const colors = { re:'#e63950', cs:'#f07d00', cf:'#0d9e8a', reg:'#5c4bcc' };
    const data = CHOMSKY_DATA[activeType];
    buildDiagramInto('panel-diagram', data.diagram, colors[activeType], 'panel');
  }
}

function toggleModalPlay() {
  const btn = document.getElementById('mt2-play');
  if (modalTesterInterval) {
    clearInterval(modalTesterInterval);
    modalTesterInterval = null;
    btn.textContent = '▶ PLAY';
    btn.classList.remove('playing');
  } else {
    btn.textContent = '⏸ PAUSE';
    btn.classList.add('playing');
    modalTesterInterval = setInterval(() => {
      if (!stepModalTester()) toggleModalPlay();
    }, modalTesterState.intervalVal);
  }
}

// ── DIAGRAM ROUTER ────────────────────────────────────────────────────────────

/**
 * @param {string} containerId - Element to inject into
 * @param {string} type - 'dfa', 'pda', etc.
 * @param {string} color - Primary accent color
 * @param {string} instanceId - Unique ID to prevent SVG ID collisions
 * @param {string|null} expr - Original expression string (for precise DFA selection)
 */
function buildDiagramInto(containerId, type, color, instanceId = 'gen', expr = null) {
  const c = document.getElementById(containerId);
  if (!c) return;

  // 1. Thoroughly clear existing content and intervals
  const oldSvg = c.querySelector('svg');
  if (oldSvg && oldSvg._animInterval) {
    clearInterval(oldSvg._animInterval);
  }
  c.innerHTML = '';
  
  // 2. Build the new diagram — for DFA, pick expression-specific variant
  let svg;
  if (type === 'dfa') {
    svg = buildDFA(color, instanceId, expr);
  } else if (type === 'pda') {
    svg = buildPDA(color, instanceId, expr);
  } else if (type === 'lba') {
    svg = buildLBA(color, instanceId, expr);
  } else if (type === 'tm') {
    svg = buildTM(color, instanceId, expr);
  }
  if (svg) c.appendChild(svg);
}

// ── DFA EXPRESSION ROUTER ─────────────────────────────────────────────────────
// Picks the right DFA diagram + caption based on the input expression.
function buildDFA(color, prefix, expr) {
  const e = (expr || '').trim().toLowerCase()
    .replace(/\s+/g, ' ');

  // Route to expression-specific builders
  if (e === 'a*')                            return buildDFA_astar(color, prefix);
  if (e === 'b*')                            return buildDFA_bstar(color, prefix);
  if (e === 'a+')                            return buildDFA_aplus(color, prefix);
  if (e === 'b+')                            return buildDFA_bplus(color, prefix);
  if (e === 'a*b*' || e === '0*1*')         return buildDFA_astarBstar(color, prefix, e);
  if (e === 'ab*')                           return buildDFA_abstar(color, prefix);
  if (e === 'a*b')                           return buildDFA_astarb(color, prefix);
  if (e === 'a+b' || e === 'a|b')           return buildDFA_aOrb(color, prefix);
  if (e === '(ab)*')                         return buildDFA_abRepeat(color, prefix);
  if (e === '(a|b)*' || e === '(a+b)*')    return buildDFA_aOrBstar(color, prefix);
  if (e === 'a*ba*')                         return buildDFA_astarba(color, prefix);
  if (e === 'strings ending in ab' || e === 'ends in ab')
                                             return buildDFA_endsAB(color, prefix);
  // ── new: single-symbol c ──────────────────────────────────────────────────
  if (e === 'c*')                            return buildDFA_cstar(color, prefix);
  if (e === 'c+')                            return buildDFA_cplus(color, prefix);
  // ── new: two-symbol ab / ac / bc combos ──────────────────────────────────
  if (e === 'ab')                            return buildDFA_ab(color, prefix);
  if (e === '(ab)+')                         return buildDFA_abplus(color, prefix);
  if (e === 'a+b*')                          return buildDFA_aplusbstar(color, prefix);
  if (e === 'a*b+')                          return buildDFA_astarbplus(color, prefix);
  if (e === 'a+b+')                          return buildDFA_aplusbplus(color, prefix);
  if (e === 'a*c*')                          return buildDFA_astarcstar(color, prefix);
  if (e === 'b*c*')                          return buildDFA_bstarcstar(color, prefix);
  if (e === 'a+c*')                          return buildDFA_aplusccstar(color, prefix);
  if (e === 'b+c*')                          return buildDFA_bpluscstar(color, prefix);
  // ── new: three-symbol abc combos ──────────────────────────────────────────
  if (e === 'abc')                           return buildDFA_abc(color, prefix);
  if (e === 'a*b*c*')                        return buildDFA_astarBstarCstar(color, prefix);
  if (e === '(abc)*')                        return buildDFA_abcRepeat(color, prefix);
  if (e === 'abc*')                          return buildDFA_abcstar(color, prefix);
  if (e === 'a+b*c*')                        return buildDFA_aplusbstarcstar(color, prefix);
  if (e === '(a|b|c)*' || e === '(a+b+c)*') return buildDFA_aOrBOrCstar(color, prefix);

  // Fallback: generic DFA for "strings ending in ab"
  return buildDFA_endsAB(color, prefix);
}

// ── DFA: a* (single accepting state, self-loop on a) ──────────────────────────
function buildDFA_astar(color, prefix) {
  const svg=mkSVG('0 0 240 140'), uid=`dfa-as-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=26;
  // Dead state for 'b'
  mkState(svg,{x:80,y:70,label:'q₀',accept:true,start:true,color,uid,R});
  mkState(svg,{x:195,y:70,label:'q_d',accept:false,start:false,color,uid,R});
  // self-loop on q0 for a
  svg.appendChild(mkPath(`M${80-R},70 C${80-R},10 ${80+R},10 ${80+R},70`,color,uid,0));
  svg.appendChild(mkText(80,6,'a',{fill:'#bbb',fs:12}));
  // q0 → dead on b
  svg.appendChild(mkPath(`M${80+R},70 L${195-R},70`,color,uid,0.1));
  svg.appendChild(mkText(137,58,'b',{fill:'#bbb',fs:12}));
  // dead → dead on a,b
  svg.appendChild(mkPath(`M${195-R},65 C${195-R},10 ${195+R},10 ${195+R},65`,color,uid,0.2));
  svg.appendChild(mkText(195,6,'a,b',{fill:'#bbb',fs:11}));
  svg.appendChild(mkText(118,130,'DFA for a*',{fill:'#888',fs:10}));

  const seq=['q₀','q₀','q₀','q_d'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q_d'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill',sn==='q₀'?`${color}28`:'rgba(255,255,255,0.06)');
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: b* ──────────────────────────────────────────────────────────────────
function buildDFA_bstar(color, prefix) {
  const svg=mkSVG('0 0 240 140'), uid=`dfa-bs-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=26;
  mkState(svg,{x:80,y:70,label:'q₀',accept:true,start:true,color,uid,R});
  mkState(svg,{x:195,y:70,label:'q_d',accept:false,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${80-R},70 C${80-R},10 ${80+R},10 ${80+R},70`,color,uid,0));
  svg.appendChild(mkText(80,6,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${80+R},70 L${195-R},70`,color,uid,0.1));
  svg.appendChild(mkText(137,58,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${195-R},65 C${195-R},10 ${195+R},10 ${195+R},65`,color,uid,0.2));
  svg.appendChild(mkText(195,6,'a,b',{fill:'#bbb',fs:11}));
  svg.appendChild(mkText(118,130,'DFA for b*',{fill:'#888',fs:10}));
  const seq=['q₀','q₀','q₀','q_d'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q_d'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill',sn==='q₀'?`${color}28`:'rgba(255,255,255,0.06)');
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: a+ (one or more a's) ────────────────────────────────────────────────
function buildDFA_aplus(color, prefix) {
  const svg=mkSVG('0 0 260 140'), uid=`dfa-ap-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=26;
  mkState(svg,{x:65,y:70,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:185,y:70,label:'q₁',accept:true,start:false,color,uid,R});
  // q0 →a→ q1
  svg.appendChild(mkPath(`M${65+R},70 L${185-R},70`,color,uid,0));
  svg.appendChild(mkText(125,58,'a',{fill:'#bbb',fs:12}));
  // q1 self-loop on a
  svg.appendChild(mkPath(`M${185-R},70 C${185-R},10 ${185+R},10 ${185+R},70`,color,uid,0.1));
  svg.appendChild(mkText(185,6,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(118,130,'DFA for a⁺ (one or more a\'s)',{fill:'#888',fs:10}));
  const seq=['q₀','q₁','q₁','q₁'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q₁'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill',sn==='q₁'?`${color}28`:'rgba(255,255,255,0.06)');
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: b+ ──────────────────────────────────────────────────────────────────
function buildDFA_bplus(color, prefix) {
  const svg=mkSVG('0 0 260 140'), uid=`dfa-bp-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=26;
  mkState(svg,{x:65,y:70,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:185,y:70,label:'q₁',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${65+R},70 L${185-R},70`,color,uid,0));
  svg.appendChild(mkText(125,58,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${185-R},70 C${185-R},10 ${185+R},10 ${185+R},70`,color,uid,0.1));
  svg.appendChild(mkText(185,6,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(118,130,'DFA for b⁺ (one or more b\'s)',{fill:'#888',fs:10}));
  const seq=['q₀','q₁','q₁','q₁'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q₁'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill',sn==='q₁'?`${color}28`:'rgba(255,255,255,0.06)');
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: a*b* ─────────────────────────────────────────────────────────────────
function buildDFA_astarBstar(color, prefix, orig='a*b*') {
  const label = orig==='0*1*' ? '0*1*' : 'a*b*';
  const aLbl  = orig==='0*1*' ? '0' : 'a';
  const bLbl  = orig==='0*1*' ? '1' : 'b';
  const svg=mkSVG('0 0 300 140'), uid=`dfa-abs-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=26;
  mkState(svg,{x:65,y:70,label:'q₀',accept:true,start:true,color,uid,R});
  mkState(svg,{x:195,y:70,label:'q₁',accept:true,start:false,color,uid,R});
  // q0 self-loop: a
  svg.appendChild(mkPath(`M${65-R},70 C${65-R},10 ${65+R},10 ${65+R},70`,color,uid,0));
  svg.appendChild(mkText(65,6,aLbl,{fill:'#bbb',fs:12}));
  // q0 →b→ q1
  svg.appendChild(mkPath(`M${65+R},70 L${195-R},70`,color,uid,0.1));
  svg.appendChild(mkText(130,58,bLbl,{fill:'#bbb',fs:12}));
  // q1 self-loop: b
  svg.appendChild(mkPath(`M${195-R},70 C${195-R},10 ${195+R},10 ${195+R},70`,color,uid,0.2));
  svg.appendChild(mkText(195,6,bLbl,{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(130,130,`DFA for ${label}`,{fill:'#888',fs:10}));
  const seq=['q₀','q₀','q₁','q₁','q₀'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q₁'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill',`${color}28`);
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: ab* ─────────────────────────────────────────────────────────────────
function buildDFA_abstar(color, prefix) {
  const svg=mkSVG('0 0 280 140'), uid=`dfa-abstar-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=26;
  mkState(svg,{x:65,y:70,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:190,y:70,label:'q₁',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${65+R},70 L${190-R},70`,color,uid,0));
  svg.appendChild(mkText(127,58,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${190-R},70 C${190-R},10 ${190+R},10 ${190+R},70`,color,uid,0.1));
  svg.appendChild(mkText(190,6,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(127,130,'DFA for ab*',{fill:'#888',fs:10}));
  const seq=['q₀','q₁','q₁','q₁'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q₁'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill',sn==='q₁'?`${color}28`:'rgba(255,255,255,0.06)');
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: a*b ─────────────────────────────────────────────────────────────────
function buildDFA_astarb(color, prefix) {
  const svg=mkSVG('0 0 280 140'), uid=`dfa-astarb-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=26;
  mkState(svg,{x:65,y:70,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:190,y:70,label:'q₁',accept:true,start:false,color,uid,R});
  // q0 self-loop: a
  svg.appendChild(mkPath(`M${65-R},70 C${65-R},10 ${65+R},10 ${65+R},70`,color,uid,0));
  svg.appendChild(mkText(65,6,'a',{fill:'#bbb',fs:12}));
  // q0 →b→ q1
  svg.appendChild(mkPath(`M${65+R},70 L${190-R},70`,color,uid,0.1));
  svg.appendChild(mkText(127,58,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(127,130,'DFA for a*b',{fill:'#888',fs:10}));
  const seq=['q₀','q₀','q₁','q₀'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q₁'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill',sn==='q₁'?`${color}28`:'rgba(255,255,255,0.06)');
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: a+b (accept only a OR b — single character) ─────────────────────────
function buildDFA_aOrb(color, prefix) {
  const svg=mkSVG('0 0 300 170'), uid=`dfa-aob-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=26;
  // States: q0 (start), q_a (accept a), q_b (accept b), q_d (dead)
  mkState(svg,{x:65 ,y:85,label:'q₀',accept:false,start:true ,color,uid,R});
  mkState(svg,{x:195,y:40,label:'q_a',accept:true ,start:false,color,uid,R});
  mkState(svg,{x:195,y:130,label:'q_b',accept:true ,start:false,color,uid,R});
  // q0 →a→ q_a
  svg.appendChild(mkPath(`M${65+R},75 L${195-R},48`,color,uid,0));
  svg.appendChild(mkText(120,52,'a',{fill:'#bbb',fs:12}));
  // q0 →b→ q_b
  svg.appendChild(mkPath(`M${65+R},95 L${195-R},122`,color,uid,0.1));
  svg.appendChild(mkText(120,122,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(130,162,'DFA for a+b (a OR b)',{fill:'#888',fs:10}));
  const seq=['q₀','q_a','q₀','q_b'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q_a','q_b'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill','rgba(255,255,255,0.06)');
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },900);
  return svg;
}

// ── DFA: (ab)* ───────────────────────────────────────────────────────────────
function buildDFA_abRepeat(color, prefix) {
  const svg=mkSVG('0 0 300 140'), uid=`dfa-abr-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=26;
  mkState(svg,{x:65,y:70,label:'q₀',accept:true,start:true,color,uid,R});
  mkState(svg,{x:195,y:70,label:'q₁',accept:false,start:false,color,uid,R});
  // q0 →a→ q1
  svg.appendChild(mkPath(`M${65+R},63 L${195-R},63`,color,uid,0));
  svg.appendChild(mkText(130,52,'a',{fill:'#bbb',fs:12}));
  // q1 →b→ q0 (arc back)
  svg.appendChild(mkPath(`M${195-R},77 L${65+R},77`,color,uid,0.15));
  svg.appendChild(mkText(130,92,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(130,130,'DFA for (ab)*',{fill:'#888',fs:10}));
  const seq=['q₀','q₁','q₀','q₁','q₀'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q₁'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill',sn==='q₀'?`${color}28`:'rgba(255,255,255,0.06)');
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: (a|b)* ──────────────────────────────────────────────────────────────
function buildDFA_aOrBstar(color, prefix) {
  const svg=mkSVG('0 0 200 130'), uid=`dfa-aobs-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=28;
  mkState(svg,{x:100,y:65,label:'q₀',accept:true,start:true,color,uid,R});
  // self-loop for a and b
  svg.appendChild(mkPath(`M${100-R},65 C${100-R},5 ${100+R},5 ${100+R},65`,color,uid,0));
  svg.appendChild(mkText(100,0,'a, b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(100,122,'DFA for (a|b)* — accepts all strings',{fill:'#888',fs:9}));
  const seq=['q₀','q₀','q₀'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    const cc=svg.querySelector(`[data-state-id="q₀"]`);
    if(cc) cc.setAttribute('fill',step%2===0?color+'66':`${color}28`);
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: a*ba* ───────────────────────────────────────────────────────────────
function buildDFA_astarba(color, prefix) {
  const svg=mkSVG('0 0 320 145'), uid=`dfa-aba-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=24;
  mkState(svg,{x:55 ,y:72,label:'q₀',accept:false,start:true ,color,uid,R});
  mkState(svg,{x:175,y:72,label:'q₁',accept:true ,start:false,color,uid,R});
  mkState(svg,{x:290,y:72,label:'q_d',accept:false,start:false,color,uid,R});
  // q0 self-loop: a
  svg.appendChild(mkPath(`M${55-R},72 C${55-R},12 ${55+R},12 ${55+R},72`,color,uid,0));
  svg.appendChild(mkText(55,8,'a',{fill:'#bbb',fs:12}));
  // q0 →b→ q1
  svg.appendChild(mkPath(`M${55+R},72 L${175-R},72`,color,uid,0.1));
  svg.appendChild(mkText(115,60,'b',{fill:'#bbb',fs:12}));
  // q1 self-loop: a
  svg.appendChild(mkPath(`M${175-R},72 C${175-R},12 ${175+R},12 ${175+R},72`,color,uid,0.2));
  svg.appendChild(mkText(175,8,'a',{fill:'#bbb',fs:12}));
  // q1 →b→ dead
  svg.appendChild(mkPath(`M${175+R},72 L${290-R},72`,color,uid,0.3));
  svg.appendChild(mkText(232,60,'b',{fill:'#bbb',fs:12}));
  // dead self-loop
  svg.appendChild(mkPath(`M${290-R},67 C${290-R},12 ${290+R},12 ${290+R},67`,color,uid,0.4));
  svg.appendChild(mkText(290,8,'a,b',{fill:'#bbb',fs:10}));
  svg.appendChild(mkText(160,135,'DFA for a*ba* (exactly one b)',{fill:'#888',fs:10}));
  const seq=['q₀','q₀','q₁','q₁','q₀'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    ['q₀','q₁','q_d'].forEach(sn=>{
      const cc=svg.querySelector(`[data-state-id="${sn}"]`);
      if(cc) cc.setAttribute('fill',sn==='q₁'?`${color}28`:'rgba(255,255,255,0.06)');
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── DFA: strings ending in "ab" (original/fallback) ───────────────────────────
function buildDFA_endsAB(color, prefix) {
  const svg=mkSVG('0 0 380 180'), uid=`dfa-eab-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=24;
  const st=[{x:65,y:90,label:'q₀',accept:false,start:true},{x:190,y:90,label:'q₁',accept:false,start:false},{x:315,y:90,label:'q₂',accept:true,start:false}];
  // Transitions
  svg.appendChild(mkPath(`M${65+R},90 L${190-R},90`,color,uid,0));
  svg.appendChild(mkText(127,78,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${190+R},90 L${315-R},90`,color,uid,.1));
  svg.appendChild(mkText(252,78,'b',{fill:'#bbb',fs:12}));
  // self loops
  svg.appendChild(mkPath(`M${65-R},90 C${65-R},30 ${65+R},30 ${65+R},90`,color,uid,.2));
  svg.appendChild(mkText(65,22,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${190-R},90 C${190-R},30 ${190+R},30 ${190+R},90`,color,uid,.3));
  svg.appendChild(mkText(190,22,'a',{fill:'#bbb',fs:12}));
  // back arc q2→q1
  svg.appendChild(mkPath(`M${315-R},95 C280,140 220,140 ${190+R},95`,color,uid,.4));
  svg.appendChild(mkText(252,148,'a',{fill:'#bbb',fs:12}));
  // back arc q2→q0
  svg.appendChild(mkPath(`M315,${90+R} C315,160 65,160 65,${90+R}`,color,uid,.5));
  svg.appendChild(mkText(190,170,'b',{fill:'#bbb',fs:12}));
  st.forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkText(190,178,'DFA accepting strings ending in "ab"',{fill:'#888',fs:9}));
  const seq=['q₀','q₁','q₂','q₁','q₂'];
  let step=0;
  svg._animInterval=setInterval(()=>{
    seq.forEach(stName=>{
      const c=svg.querySelector(`[data-state-id="${stName}"]`);
      if(c) c.setAttribute('fill',c.getAttribute('stroke')+(stName==='q₂'?'28':'00'));
    });
    const curr=svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if(curr) curr.setAttribute('fill',color+'66');
    step=(step+1)%seq.length;
  },800);
  return svg;
}

// ── NEW DFA BUILDERS ─────────────────────────────────────────────────────────

// Shared animation helper for new DFA builders
function dfaAnimate(svg, seq, allStates, acceptState, color, ms=800) {
  let step = 0;
  svg._animInterval = setInterval(() => {
    allStates.forEach(sn => {
      const cc = svg.querySelector(`[data-state-id="${sn}"]`);
      if (cc) cc.setAttribute('fill', sn === acceptState ? `${color}28` : 'rgba(255,255,255,0.06)');
    });
    const curr = svg.querySelector(`[data-state-id="${seq[step]}"]`);
    if (curr) curr.setAttribute('fill', color + '66');
    step = (step + 1) % seq.length;
  }, ms);
}

// ── DFA: c* ──────────────────────────────────────────────────────────────────
function buildDFA_cstar(color, prefix) {
  const svg=mkSVG('0 0 240 140'), uid=`dfa-cs-${prefix}`, R=26;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:80,y:70,label:'q₀',accept:true,start:true,color,uid,R});
  mkState(svg,{x:195,y:70,label:'q_d',accept:false,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${80-R},70 C${80-R},10 ${80+R},10 ${80+R},70`,color,uid,0));
  svg.appendChild(mkText(80,6,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${80+R},70 L${195-R},70`,color,uid,0.1));
  svg.appendChild(mkText(137,58,'a,b',{fill:'#bbb',fs:11}));
  svg.appendChild(mkPath(`M${195-R},65 C${195-R},10 ${195+R},10 ${195+R},65`,color,uid,0.2));
  svg.appendChild(mkText(195,6,'a,b,c',{fill:'#bbb',fs:10}));
  svg.appendChild(mkText(118,130,'DFA for c*',{fill:'#888',fs:10}));
  dfaAnimate(svg,['q₀','q₀','q₀','q_d'],['q₀','q_d'],'q₀',color);
  return svg;
}

// ── DFA: c+ ──────────────────────────────────────────────────────────────────
function buildDFA_cplus(color, prefix) {
  const svg=mkSVG('0 0 260 140'), uid=`dfa-cp-${prefix}`, R=26;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:65,y:70,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:185,y:70,label:'q₁',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${65+R},70 L${185-R},70`,color,uid,0));
  svg.appendChild(mkText(125,58,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${185-R},70 C${185-R},10 ${185+R},10 ${185+R},70`,color,uid,0.1));
  svg.appendChild(mkText(185,6,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(118,130,'DFA for cⁿ (one or more c\'s)',{fill:'#888',fs:10}));
  dfaAnimate(svg,['q₀','q₁','q₁','q₁'],['q₀','q₁'],'q₁',color);
  return svg;
}

// ── DFA: ab (literal) ────────────────────────────────────────────────────────
function buildDFA_ab(color, prefix) {
  const svg=mkSVG('0 0 340 145'), uid=`dfa-ab-${prefix}`, R=22;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:55,y:72,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:165,y:72,label:'q₁',accept:false,start:false,color,uid,R});
  mkState(svg,{x:280,y:72,label:'q₂',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${55+R},72 L${165-R},72`,color,uid,0));
  svg.appendChild(mkText(110,60,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${165+R},72 L${280-R},72`,color,uid,0.1));
  svg.appendChild(mkText(222,60,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(167,136,'DFA for literal "ab"',{fill:'#888',fs:10}));
  dfaAnimate(svg,['q₀','q₁','q₂','q₀'],['q₀','q₁','q₂'],'q₂',color);
  return svg;
}

// ── DFA: (ab)+ ───────────────────────────────────────────────────────────────
function buildDFA_abplus(color, prefix) {
  const svg=mkSVG('0 0 360 155'), uid=`dfa-abp-${prefix}`, R=22;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:50,y:72,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:180,y:72,label:'q₁',accept:false,start:false,color,uid,R});
  mkState(svg,{x:310,y:72,label:'q₂',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${50+R},72 L${180-R},72`,color,uid,0));
  svg.appendChild(mkText(115,60,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${180+R},72 L${310-R},72`,color,uid,0.1));
  svg.appendChild(mkText(245,60,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${310-R},82 C270,138 88,138 ${50+R},82`,color,uid,0.2));
  svg.appendChild(mkText(180,148,'a (repeat cycle)',{fill:'#bbb',fs:9}));
  svg.appendChild(mkText(180,14,'DFA for (ab)ⁿ — one or more "ab"',{fill:'#888',fs:9}));
  dfaAnimate(svg,['q₀','q₁','q₂','q₁','q₂'],['q₀','q₁','q₂'],'q₂',color);
  return svg;
}

// ── DFA: a+b* ────────────────────────────────────────────────────────────────
function buildDFA_aplusbstar(color, prefix) {
  const svg=mkSVG('0 0 300 150'), uid=`dfa-apbs-${prefix}`, R=24;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:55,y:75,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:195,y:75,label:'q₁',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${55+R},75 L${195-R},75`,color,uid,0));
  svg.appendChild(mkText(125,63,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${195-R},68 C${195-R},10 ${195+R},10 ${195+R},68`,color,uid,0.1));
  svg.appendChild(mkText(195,5,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${195-R},82 C${195-R},138 ${195+R},138 ${195+R},82`,color,uid,0.2));
  svg.appendChild(mkText(195,146,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(125,15,'DFA for aⁿb* (1+ a\'s then b\'s)',{fill:'#888',fs:9}));
  dfaAnimate(svg,['q₀','q₁','q₁','q₁'],['q₀','q₁'],'q₁',color);
  return svg;
}

// ── DFA: a*b+ ────────────────────────────────────────────────────────────────
function buildDFA_astarbplus(color, prefix) {
  const svg=mkSVG('0 0 340 145'), uid=`dfa-asbp-${prefix}`, R=22;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:50,y:72,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:175,y:72,label:'q₁',accept:false,start:false,color,uid,R});
  mkState(svg,{x:300,y:72,label:'q₂',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${50-R},65 C${50-R},8 ${50+R},8 ${50+R},65`,color,uid,0));
  svg.appendChild(mkText(50,4,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${50+R},72 L${175-R},72`,color,uid,0.1));
  svg.appendChild(mkText(112,60,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${175+R},72 L${300-R},72`,color,uid,0.2));
  svg.appendChild(mkText(237,60,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${300-R},65 C${300-R},8 ${300+R},8 ${300+R},65`,color,uid,0.3));
  svg.appendChild(mkText(300,4,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(175,136,'DFA for a*bⁿ (a\'s then 1+ b\'s)',{fill:'#888',fs:9}));
  dfaAnimate(svg,['q₀','q₀','q₁','q₂','q₂'],['q₀','q₁','q₂'],'q₂',color);
  return svg;
}

// ── DFA: a+b+ ────────────────────────────────────────────────────────────────
function buildDFA_aplusbplus(color, prefix) {
  const svg=mkSVG('0 0 360 145'), uid=`dfa-apbp-${prefix}`, R=22;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:50,y:72,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:175,y:72,label:'q₁',accept:false,start:false,color,uid,R});
  mkState(svg,{x:305,y:72,label:'q₂',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${50+R},72 L${175-R},72`,color,uid,0));
  svg.appendChild(mkText(112,60,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${175-R},65 C${175-R},8 ${175+R},8 ${175+R},65`,color,uid,0.1));
  svg.appendChild(mkText(175,4,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${175+R},72 L${305-R},72`,color,uid,0.2));
  svg.appendChild(mkText(240,60,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${305-R},65 C${305-R},8 ${305+R},8 ${305+R},65`,color,uid,0.3));
  svg.appendChild(mkText(305,4,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(177,136,'DFA for aⁿbⁿ (both required, no ε)',{fill:'#888',fs:9}));
  dfaAnimate(svg,['q₀','q₁','q₁','q₂','q₂'],['q₀','q₁','q₂'],'q₂',color);
  return svg;
}

// ── DFA: a*c* ────────────────────────────────────────────────────────────────
function buildDFA_astarcstar(color, prefix) {
  const svg=mkSVG('0 0 300 145'), uid=`dfa-ascs-${prefix}`, R=24;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:65,y:72,label:'q₀',accept:true,start:true,color,uid,R});
  mkState(svg,{x:205,y:72,label:'q₁',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${65-R},65 C${65-R},8 ${65+R},8 ${65+R},65`,color,uid,0));
  svg.appendChild(mkText(65,4,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${65+R},72 L${205-R},72`,color,uid,0.1));
  svg.appendChild(mkText(135,60,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${205-R},65 C${205-R},8 ${205+R},8 ${205+R},65`,color,uid,0.2));
  svg.appendChild(mkText(205,4,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(135,136,'DFA for a*c*',{fill:'#888',fs:10}));
  dfaAnimate(svg,['q₀','q₀','q₁','q₁'],['q₀','q₁'],'q₀',color,900);
  return svg;
}

// ── DFA: b*c* ────────────────────────────────────────────────────────────────
function buildDFA_bstarcstar(color, prefix) {
  const svg=mkSVG('0 0 300 145'), uid=`dfa-bscs-${prefix}`, R=24;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:65,y:72,label:'q₀',accept:true,start:true,color,uid,R});
  mkState(svg,{x:205,y:72,label:'q₁',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${65-R},65 C${65-R},8 ${65+R},8 ${65+R},65`,color,uid,0));
  svg.appendChild(mkText(65,4,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${65+R},72 L${205-R},72`,color,uid,0.1));
  svg.appendChild(mkText(135,60,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${205-R},65 C${205-R},8 ${205+R},8 ${205+R},65`,color,uid,0.2));
  svg.appendChild(mkText(205,4,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(135,136,'DFA for b*c*',{fill:'#888',fs:10}));
  dfaAnimate(svg,['q₀','q₀','q₁','q₁'],['q₀','q₁'],'q₀',color,900);
  return svg;
}

// ── DFA: a+c* ────────────────────────────────────────────────────────────────
function buildDFA_aplusccstar(color, prefix) {
  const svg=mkSVG('0 0 310 150'), uid=`dfa-apcs-${prefix}`, R=24;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:55,y:75,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:200,y:75,label:'q₁',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${55+R},75 L${200-R},75`,color,uid,0));
  svg.appendChild(mkText(127,63,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${200-R},68 C${200-R},10 ${200+R},10 ${200+R},68`,color,uid,0.1));
  svg.appendChild(mkText(200,5,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${200-R},82 C${200-R},140 ${200+R},140 ${200+R},82`,color,uid,0.2));
  svg.appendChild(mkText(200,148,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(127,15,'DFA for aⁿc* (1+ a\'s then c\'s)',{fill:'#888',fs:9}));
  dfaAnimate(svg,['q₀','q₁','q₁','q₁'],['q₀','q₁'],'q₁',color);
  return svg;
}

// ── DFA: b+c* ────────────────────────────────────────────────────────────────
function buildDFA_bpluscstar(color, prefix) {
  const svg=mkSVG('0 0 310 150'), uid=`dfa-bpcs-${prefix}`, R=24;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:55,y:75,label:'q₀',accept:false,start:true,color,uid,R});
  mkState(svg,{x:200,y:75,label:'q₁',accept:true,start:false,color,uid,R});
  svg.appendChild(mkPath(`M${55+R},75 L${200-R},75`,color,uid,0));
  svg.appendChild(mkText(127,63,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${200-R},68 C${200-R},10 ${200+R},10 ${200+R},68`,color,uid,0.1));
  svg.appendChild(mkText(200,5,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${200-R},82 C${200-R},140 ${200+R},140 ${200+R},82`,color,uid,0.2));
  svg.appendChild(mkText(200,148,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(127,15,'DFA for bⁿc*',{fill:'#888',fs:9}));
  dfaAnimate(svg,['q₀','q₁','q₁','q₁'],['q₀','q₁'],'q₁',color);
  return svg;
}

// ── DFA: abc (literal) ───────────────────────────────────────────────────────
function buildDFA_abc(color, prefix) {
  const svg=mkSVG('0 0 430 148'), uid=`dfa-abc-${prefix}`, R=20;
  svg.appendChild(mkDefs(uid,color));
  [{x:42,y:74,label:'q₀',accept:false,start:true},{x:152,y:74,label:'q₁',accept:false,start:false},{x:268,y:74,label:'q₂',accept:false,start:false},{x:385,y:74,label:'q₃',accept:true,start:false}].forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkPath(`M${42+R},74 L${152-R},74`,color,uid,0)); svg.appendChild(mkText(97,62,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${152+R},74 L${268-R},74`,color,uid,0.1)); svg.appendChild(mkText(210,62,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${268+R},74 L${385-R},74`,color,uid,0.2)); svg.appendChild(mkText(327,62,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(214,140,'DFA for literal "abc"',{fill:'#888',fs:10}));
  dfaAnimate(svg,['q₀','q₁','q₂','q₃','q₀'],['q₀','q₁','q₂','q₃'],'q₃',color);
  return svg;
}

// ── DFA: a*b*c* ──────────────────────────────────────────────────────────────
function buildDFA_astarBstarCstar(color, prefix) {
  const svg=mkSVG('0 0 370 145'), uid=`dfa-abcs-${prefix}`, R=22;
  svg.appendChild(mkDefs(uid,color));
  [{x:55,y:72,label:'q₀',accept:true,start:true},{x:185,y:72,label:'q₁',accept:true,start:false},{x:315,y:72,label:'q₂',accept:true,start:false}].forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkPath(`M${55-R},65 C${55-R},8 ${55+R},8 ${55+R},65`,color,uid,0)); svg.appendChild(mkText(55,4,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${55+R},72 L${185-R},72`,color,uid,0.1)); svg.appendChild(mkText(120,60,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${185-R},65 C${185-R},8 ${185+R},8 ${185+R},65`,color,uid,0.2)); svg.appendChild(mkText(185,4,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${185+R},72 L${315-R},72`,color,uid,0.3)); svg.appendChild(mkText(250,60,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${315-R},65 C${315-R},8 ${315+R},8 ${315+R},65`,color,uid,0.4)); svg.appendChild(mkText(315,4,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(185,136,'DFA for a*b*c*',{fill:'#888',fs:10}));
  dfaAnimate(svg,['q₀','q₀','q₁','q₁','q₂','q₂'],['q₀','q₁','q₂'],'q₀',color,700);
  return svg;
}

// ── DFA: (abc)* ──────────────────────────────────────────────────────────────
function buildDFA_abcRepeat(color, prefix) {
  const svg=mkSVG('0 0 410 155'), uid=`dfa-abcr-${prefix}`, R=22;
  svg.appendChild(mkDefs(uid,color));
  [{x:55,y:72,label:'q₀',accept:true,start:true},{x:185,y:72,label:'q₁',accept:false,start:false},{x:315,y:72,label:'q₂',accept:false,start:false}].forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkPath(`M${55+R},65 L${185-R},65`,color,uid,0)); svg.appendChild(mkText(120,53,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${185+R},65 L${315-R},65`,color,uid,0.1)); svg.appendChild(mkText(250,53,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${315-R},80 C270,136 90,136 ${55+R},80`,color,uid,0.2)); svg.appendChild(mkText(185,146,'c (cycle back)',{fill:'#bbb',fs:9}));
  svg.appendChild(mkText(185,14,'DFA for (abc)* — repeat "abc"',{fill:'#888',fs:9}));
  dfaAnimate(svg,['q₀','q₁','q₂','q₀','q₁'],['q₀','q₁','q₂'],'q₀',color);
  return svg;
}

// ── DFA: abc* ────────────────────────────────────────────────────────────────
function buildDFA_abcstar(color, prefix) {
  const svg=mkSVG('0 0 400 145'), uid=`dfa-abcst-${prefix}`, R=22;
  svg.appendChild(mkDefs(uid,color));
  [{x:50,y:72,label:'q₀',accept:false,start:true},{x:180,y:72,label:'q₁',accept:false,start:false},{x:320,y:72,label:'q₂',accept:true,start:false}].forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkPath(`M${50+R},72 L${180-R},72`,color,uid,0)); svg.appendChild(mkText(115,60,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${180+R},72 L${320-R},72`,color,uid,0.1)); svg.appendChild(mkText(250,60,'b',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${320-R},65 C${320-R},8 ${320+R},8 ${320+R},65`,color,uid,0.2)); svg.appendChild(mkText(320,4,'c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(185,136,'DFA for abc* — ab then zero or more c',{fill:'#888',fs:9}));
  dfaAnimate(svg,['q₀','q₁','q₂','q₂'],['q₀','q₁','q₂'],'q₂',color);
  return svg;
}

// ── DFA: a+b*c* ──────────────────────────────────────────────────────────────
function buildDFA_aplusbstarcstar(color, prefix) {
  const svg=mkSVG('0 0 390 145'), uid=`dfa-apbscs-${prefix}`, R=22;
  svg.appendChild(mkDefs(uid,color));
  [{x:45,y:72,label:'q₀',accept:false,start:true},{x:180,y:72,label:'q₁',accept:true,start:false},{x:322,y:72,label:'q₂',accept:true,start:false}].forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkPath(`M${45+R},72 L${180-R},72`,color,uid,0)); svg.appendChild(mkText(112,60,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${180-R},65 C${180-R},8 ${180+R},8 ${180+R},65`,color,uid,0.1)); svg.appendChild(mkText(180,4,'a',{fill:'#bbb',fs:12}));
  svg.appendChild(mkPath(`M${180+R},72 L${322-R},72`,color,uid,0.2)); svg.appendChild(mkText(251,60,'b,c',{fill:'#bbb',fs:11}));
  svg.appendChild(mkPath(`M${322-R},65 C${322-R},8 ${322+R},8 ${322+R},65`,color,uid,0.3)); svg.appendChild(mkText(322,4,'b,c',{fill:'#bbb',fs:11}));
  svg.appendChild(mkText(183,136,'DFA for aⁿb*c*',{fill:'#888',fs:10}));
  dfaAnimate(svg,['q₀','q₁','q₁','q₂','q₂'],['q₀','q₁','q₂'],'q₁',color);
  return svg;
}

// ── DFA: (a|b|c)* ─────────────────────────────────────────────────────────────
function buildDFA_aOrBOrCstar(color, prefix) {
  const svg=mkSVG('0 0 200 130'), uid=`dfa-abcany-${prefix}`, R=30;
  svg.appendChild(mkDefs(uid,color));
  mkState(svg,{x:100,y:65,label:'q₀',accept:true,start:true,color,uid,R});
  svg.appendChild(mkPath(`M${100-R},65 C${100-R},5 ${100+R},5 ${100+R},65`,color,uid,0));
  svg.appendChild(mkText(100,0,'a, b, c',{fill:'#bbb',fs:12}));
  svg.appendChild(mkText(100,122,'DFA for (a|b|c)* — all strings over {a,b,c}',{fill:'#888',fs:8}));
  let s=0;
  svg._animInterval=setInterval(()=>{
    const cc=svg.querySelector('[data-state-id="q₀"]');
    if(cc)cc.setAttribute('fill',s%2===0?color+'66':`${color}28`);
    s=(s+1)%3;
  },800);
  return svg;
}

// ── PDA EXPRESSION ROUTER ────────────────────────────────────────────────────
function buildPDA(color, prefix, expr) {
  const _e = (expr || '').trim().toLowerCase().replace(/\s+/g,' ');
  if (_e === 'palindrome' || _e === 'palindrome over {a,b}' || _e === 'palindromes')
    return buildPDA_palindrome(color, prefix);
  if (_e === 'balanced parentheses' || _e === 'balanced parens')
    return buildPDA_balancedParens(color, prefix);
  if (_e.includes('arithmetic') || _e.includes('expression'))
    return buildPDA_arithmetic(color, prefix);
  return buildPDA_anbn(color, prefix);
}

// ── PDA: aⁿbⁿ ────────────────────────────────────────────────────────────────
function buildPDA_anbn(color, prefix) {
  const svg=mkSVG('0 0 380 215'), uid=`pda-ab-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=21;
  const states=[
    {x:48, y:90,label:'q\u2080',accept:false,start:true},
    {x:145,y:90,label:'q\u2081',accept:false,start:false},
    {x:242,y:90,label:'q\u2082',accept:false,start:false},
    {x:332,y:90,label:'q\u2083',accept:true, start:false}
  ];
  function addT(x1,y1,x2,y2,lbl,lx,ly,d){
    const dx=x2-x1;
    svg.appendChild(mkPath(`M${x1+R*(dx/Math.abs(dx))},${y1} L${x2-R*(dx/Math.abs(dx))},${y2}`,color,uid,d));
    const lw=lbl.length*6+10;
    const rb=document.createElementNS(NS,'rect');
    rb.setAttribute('x',lx-lw/2); rb.setAttribute('y',ly-12);
    rb.setAttribute('width',lw); rb.setAttribute('height',14);
    rb.setAttribute('fill','#111'); rb.setAttribute('rx','3');
    svg.appendChild(rb);
    svg.appendChild(mkText(lx,ly,lbl,{fill:'#aaa',fs:9}));
  }
  addT(48,90,145,90,'\u03b5,\u03b5\u2192Z\u2080',96,77,.0);
  addT(145,90,242,90,'\u03b5,\u03b5\u2192\u03b5',193,77,.1);
  addT(242,90,332,90,'\u03b5,Z\u2080\u2192\u03b5',288,77,.2);
  svg.appendChild(mkPath(`M${145-R},90 C${145-R},30 ${145+R},30 ${145+R},90`,color,uid,.3));
  svg.appendChild(mkText(145,22,'a,\u03b5\u2192A',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${242-R},90 C${242-R},30 ${242+R},30 ${242+R},90`,color,uid,.4));
  svg.appendChild(mkText(242,22,'b,A\u2192\u03b5',{fill:'#aaa',fs:9}));
  states.forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkText(190,118,'\u2500\u2500 STACK \u2500\u2500',{fill:'#555',fs:9}));
  const sg=document.createElementNS(NS,'g'); svg.appendChild(sg);
  function ds(it){ sg.innerHTML=''; it.forEach((sym,i)=>{ const y=122+i*16,x=190; const r=document.createElementNS(NS,'rect'); r.setAttribute('x',x-18); r.setAttribute('y',y); r.setAttribute('width',36); r.setAttribute('height',16); r.setAttribute('stroke',`${color}66`); r.setAttribute('fill',`${color}15`); r.setAttribute('rx','3'); sg.appendChild(r); sg.appendChild(mkText(x,y+11,sym,{fill:color,fs:9})); }); }
  ds(['Z\u2080']);
  svg.appendChild(mkText(190,207,'PDA for { a\u207fb\u207f | n \u2265 1 }',{fill:'#888',fs:9}));
  const sq=[['Z\u2080'],['Z\u2080','A'],['Z\u2080','A','A'],['Z\u2080','A','A','A'],['Z\u2080','A','A'],['Z\u2080','A'],['Z\u2080'],[]];
  let ii=0;
  svg._animInterval=setInterval(()=>{ ii=(ii+1)%sq.length; ds(sq[ii]); let n='q\u2080'; if(ii>=1&&ii<=3)n='q\u2081'; else if(ii>=4&&ii<=6)n='q\u2082'; else if(ii===0||ii===7)n='q\u2083'; ['q\u2080','q\u2081','q\u2082','q\u2083'].forEach(q=>{ const c=svg.querySelector(`[data-state-id="${q}"]`); if(c)c.setAttribute('fill',q===n?color+'66':'rgba(255,255,255,0.02)'); }); },700);
  return svg;
}

// ── PDA: palindrome over {a,b} ────────────────────────────────────────────────
function buildPDA_palindrome(color, prefix) {
  const svg=mkSVG('0 0 370 215'), uid=`pda-pal-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=22;
  [{x:55,y:90,label:'q\u2080',accept:false,start:true},{x:185,y:90,label:'q\u2081',accept:false,start:false},{x:315,y:90,label:'q\u2082',accept:true,start:false}].forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkPath(`M${55-R},83 C${55-R},28 ${55+R},28 ${55+R},83`,color,uid,.0));
  svg.appendChild(mkText(55,14,'a,\u03b5\u2192a',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${55-R},97 C${55-R},148 ${55+R},148 ${55+R},97`,color,uid,.05));
  svg.appendChild(mkText(55,158,'b,\u03b5\u2192b',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${55+R},90 L${185-R},90`,color,uid,.1));
  svg.appendChild(mkText(120,77,'\u03b5,\u03b5\u2192\u03b5',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${185-R},83 C${185-R},28 ${185+R},28 ${185+R},83`,color,uid,.2));
  svg.appendChild(mkText(185,14,'a,a\u2192\u03b5',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${185-R},97 C${185-R},148 ${185+R},148 ${185+R},97`,color,uid,.25));
  svg.appendChild(mkText(185,158,'b,b\u2192\u03b5',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${185+R},90 L${315-R},90`,color,uid,.3));
  svg.appendChild(mkText(250,77,'\u03b5,Z\u2080\u2192\u03b5',{fill:'#aaa',fs:9}));
  svg.appendChild(mkText(185,118,'\u2500\u2500 STACK \u2500\u2500',{fill:'#555',fs:9}));
  const sg2=document.createElementNS(NS,'g'); svg.appendChild(sg2);
  function ds2(it){ sg2.innerHTML=''; it.forEach((sym,i)=>{ const y=122+i*16,x=185; const r=document.createElementNS(NS,'rect'); r.setAttribute('x',x-18); r.setAttribute('y',y); r.setAttribute('width',36); r.setAttribute('height',16); r.setAttribute('stroke',`${color}66`); r.setAttribute('fill',`${color}15`); r.setAttribute('rx','3'); sg2.appendChild(r); sg2.appendChild(mkText(x,y+11,sym,{fill:color,fs:9})); }); }
  ds2(['Z\u2080']);
  svg.appendChild(mkText(185,207,'PDA for palindromes over {a,b}',{fill:'#888',fs:9}));
  const stk=[['Z\u2080'],['Z\u2080','a'],['Z\u2080','a','b'],['Z\u2080','a','b'],['Z\u2080','a'],['Z\u2080'],[]];
  const sts=['q\u2080','q\u2080','q\u2080','q\u2081','q\u2081','q\u2081','q\u2082'];
  let jj=0;
  svg._animInterval=setInterval(()=>{ jj=(jj+1)%stk.length; ds2(stk[jj]); ['q\u2080','q\u2081','q\u2082'].forEach(q=>{ const c=svg.querySelector(`[data-state-id="${q}"]`); if(c)c.setAttribute('fill',q===sts[jj]?color+'66':'rgba(255,255,255,0.02)'); }); },700);
  return svg;
}

// ── PDA: balanced parentheses ─────────────────────────────────────────────────
function buildPDA_balancedParens(color, prefix) {
  const svg=mkSVG('0 0 320 215'), uid=`pda-parens-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=22;
  [{x:65,y:90,label:'q\u2080',accept:false,start:true},{x:260,y:90,label:'q\u2081',accept:true,start:false}].forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkPath(`M${65-R},83 C${65-R},25 ${65+R},25 ${65+R},83`,color,uid,.0));
  svg.appendChild(mkText(65,11,'(,\u03b5\u2192(',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${65-R},97 C${65-R},150 ${65+R},150 ${65+R},97`,color,uid,.05));
  svg.appendChild(mkText(65,162,'),(\u2192\u03b5',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${65+R},90 L${260-R},90`,color,uid,.2));
  svg.appendChild(mkText(162,77,'\u03b5,Z\u2080\u2192\u03b5',{fill:'#aaa',fs:9}));
  svg.appendChild(mkText(162,118,'\u2500\u2500 STACK \u2500\u2500',{fill:'#555',fs:9}));
  const sg3=document.createElementNS(NS,'g'); svg.appendChild(sg3);
  function ds3(it){ sg3.innerHTML=''; it.forEach((sym,i)=>{ const y=122+i*16,x=162; const r=document.createElementNS(NS,'rect'); r.setAttribute('x',x-18); r.setAttribute('y',y); r.setAttribute('width',36); r.setAttribute('height',16); r.setAttribute('stroke',`${color}66`); r.setAttribute('fill',`${color}15`); r.setAttribute('rx','3'); sg3.appendChild(r); sg3.appendChild(mkText(x,y+11,sym,{fill:color,fs:9})); }); }
  ds3(['Z\u2080']);
  svg.appendChild(mkText(162,207,'PDA for balanced parentheses',{fill:'#888',fs:9}));
  const stk3=[['Z\u2080'],['Z\u2080','('],['Z\u2080','(','('],['Z\u2080','('],['Z\u2080'],[]];
  const sts3=['q\u2080','q\u2080','q\u2080','q\u2080','q\u2080','q\u2081'];
  let kk=0;
  svg._animInterval=setInterval(()=>{ kk=(kk+1)%stk3.length; ds3(stk3[kk]); ['q\u2080','q\u2081'].forEach(q=>{ const c=svg.querySelector(`[data-state-id="${q}"]`); if(c)c.setAttribute('fill',q===sts3[kk]?color+'66':'rgba(255,255,255,0.02)'); }); },700);
  return svg;
}

// ── PDA: arithmetic expressions (shift-reduce) ───────────────────────────────
function buildPDA_arithmetic(color, prefix) {
  const svg=mkSVG('0 0 390 220'), uid=`pda-arith-${prefix}`, R=22;
  svg.appendChild(mkDefs(uid,color));
  [{x:55,y:90,label:'q₀',accept:false,start:true},
   {x:195,y:90,label:'q₁',accept:false,start:false},
   {x:325,y:90,label:'q₂',accept:true,start:false}].forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkPath(`M${55-R},83 C${55-R},28 ${55+R},28 ${55+R},83`,color,uid,.0));
  svg.appendChild(mkText(55,14,'id,ε→E',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${55-R},97 C${55-R},152 ${55+R},152 ${55+R},97`,color,uid,.05));
  svg.appendChild(mkText(55,162,'+,*,ε→op',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${55+R},90 L${195-R},90`,color,uid,.1));
  svg.appendChild(mkText(125,78,'ε,Z₀→E',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${195-R},83 C${195-R},28 ${195+R},28 ${195+R},83`,color,uid,.2));
  svg.appendChild(mkText(195,14,'E+E→E',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${195-R},97 C${195-R},152 ${195+R},152 ${195+R},97`,color,uid,.25));
  svg.appendChild(mkText(195,162,'E*E→E',{fill:'#aaa',fs:9}));
  svg.appendChild(mkPath(`M${195+R},90 L${325-R},90`,color,uid,.3));
  svg.appendChild(mkText(260,78,'ε,E→ε',{fill:'#aaa',fs:9}));
  svg.appendChild(mkText(195,118,'── STACK ──',{fill:'#555',fs:9}));
  const sg=document.createElementNS(NS,'g');svg.appendChild(sg);
  function ds(it){sg.innerHTML='';it.forEach((sym,i)=>{const y=122+i*16,x=195;const r=document.createElementNS(NS,'rect');r.setAttribute('x',x-22);r.setAttribute('y',y);r.setAttribute('width',44);r.setAttribute('height',16);r.setAttribute('stroke',`${color}66`);r.setAttribute('fill',`${color}15`);r.setAttribute('rx','3');sg.appendChild(r);sg.appendChild(mkText(x,y+11,sym,{fill:color,fs:9}));});}
  ds(['Z₀']);
  svg.appendChild(mkText(195,210,'PDA for arithmetic expressions (shift-reduce)',{fill:'#888',fs:8}));
  const stacks=[['Z₀'],['Z₀','id'],['Z₀','E'],['Z₀','E','+'],['Z₀','E','+','id'],['Z₀','E'],['Z₀','E','*','E'],['Z₀','E'],[]];
  const sts=['q₀','q₀','q₀','q₀','q₀','q₁','q₁','q₁','q₂'];
  let ii=0;
  svg._animInterval=setInterval(()=>{ii=(ii+1)%stacks.length;ds(stacks[ii]);['q₀','q₁','q₂'].forEach(q=>{const c=svg.querySelector(`[data-state-id="${q}"]`);if(c)c.setAttribute('fill',q===sts[ii]?color+'66':'rgba(255,255,255,0.02)');});},700);
  return svg;
}


// ── TM ────────────────────────────────────────────────────────────────────────
function buildTM(color, prefix, expr) {
  const e = (expr || '').trim().toLowerCase();
  if (e.includes('halting') || e.includes('halt'))            return buildTM_halting(color, prefix);
  if (e.includes('post correspondence') || e.includes('pcp')) return buildTM_pcp(color, prefix);
  return buildTM_generic(color, prefix);
}

function buildTM_generic(color, prefix) {
  const svg=mkSVG('0 0 380 220'), uid=`tm-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=20;

  const tape=['a','a','b','b','c','c','⊔'], cw=38;
  svg.appendChild(mkText(12,15,'TAPE →',{fill:'#666',fs:9,anchor:'start'}));
  
  const tapeCells = [];
  tape.forEach((sym,i)=>{
    const x=18+i*cw;
    const rect=document.createElementNS(NS,'rect');
    rect.setAttribute('x',x); rect.setAttribute('y',18);
    rect.setAttribute('width',cw-2); rect.setAttribute('height',32);
    rect.setAttribute('stroke',`${color}40`); rect.setAttribute('fill','rgba(255,255,255,0.06)');
    rect.setAttribute('rx','4');
    svg.appendChild(rect);
    const ttxt = mkText(x+cw/2-1,39,sym,{fill:'#bbb',fs:14});
    svg.appendChild(ttxt);
    tapeCells.push({rect, text: ttxt});
  });
  
  const headLine = mkPath(`M0,78 L0,54`, color, uid);
  headLine.style.transition = 'transform 0.3s cubic-bezier(0.3, 1, 0.3, 1)';
  svg.appendChild(headLine);
  const headText = mkText(0,88,'HEAD',{fill:color,fs:9});
  headText.style.transition = 'transform 0.3s cubic-bezier(0.3, 1, 0.3, 1)';
  svg.appendChild(headText);

  function setHead(pos) {
    const hx = 18 + pos*cw + cw/2 - 1;
    headLine.setAttribute('transform', `translate(${hx},0)`);
    headText.setAttribute('transform', `translate(${hx},0)`);
    tapeCells.forEach((c, i) => {
      const isH = (i===pos);
      c.rect.setAttribute('stroke', isH?color:`${color}40`);
      c.rect.setAttribute('fill', isH?`${color}28`:'rgba(255,255,255,0.06)');
      c.text.setAttribute('fill', isH?color:'#bbb');
      c.text.setAttribute('font-weight', isH?'700':'400');
    });
  }
  setHead(0);

  const states=[{x:48, y:148,label:'q₀',accept:false,start:true }, {x:140,y:148,label:'q₁',accept:false,start:false}, {x:232,y:148,label:'q₂',accept:false,start:false}, {x:320,y:148,label:'qₐ',accept:true, start:false}];
  svg.appendChild(mkPath(`M${48+R},148 L${140-R},148`, color, uid, .3));
  svg.appendChild(mkText(94,136,'a→X,R',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${140+R},148 L${232-R},148`, color, uid, .4));
  svg.appendChild(mkText(186,136,'b→Y,L',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${232-R},153 C210,190 162,190 ${140+R},153`, color, uid, .5));
  svg.appendChild(mkText(186,200,'back,R',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${232+R},148 L${320-R},148`, color, uid, .6));
  svg.appendChild(mkText(278,136,'done',{fill:'#888',fs:9}));
  states.forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkText(190,214,'TM: tape + control states',{fill:'#888',fs:9}));

  const tmMoves = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2];
  let tm_step = 0;
  svg._animInterval = setInterval(() => {
    setHead(tmMoves[tm_step]);
    const q = tmMoves[tm_step] > 2 ? 'q₂' : 'q₁';
    ['q₀','q₁','q₂','qₐ'].forEach(st => {
      const c = svg.querySelector(`[data-state-id="${st}"]`);
      if(c) c.setAttribute('fill', st===q ? color+'66' : 'rgba(255,255,255,0.02)');
    });
    tm_step = (tm_step + 1) % tmMoves.length;
  }, 600);

  return svg;
}


// ── TM: Halting Problem ───────────────────────────────────────────────────────
function buildTM_halting(color, prefix) {
  const svg=mkSVG('0 0 420 230'), uid=`tm-halt-${prefix}`, R=18;
  svg.appendChild(mkDefs(uid,color));
  const cw=44;
  const tape=['⊢','⟨M⟩','#','w','⊔','⊔'];
  svg.appendChild(mkText(12,15,'TAPE → (encoding ⟨M,w⟩)',{fill:'#666',fs:8,anchor:'start'}));
  const tc=[];
  tape.forEach((sym,i)=>{
    const x=12+i*cw, mk=(sym==='⊢'||sym==='⊔'||sym==='#');
    const r=document.createElementNS(NS,'rect');
    r.setAttribute('x',x);r.setAttribute('y',16);r.setAttribute('width',cw-2);r.setAttribute('height',34);
    r.setAttribute('stroke',mk?`${color}80`:`${color}55`);r.setAttribute('fill',mk?`${color}18`:'rgba(255,255,255,0.07)');r.setAttribute('rx','4');
    svg.appendChild(r);
    const t=mkText(x+cw/2-1,37,sym,{fill:mk?`${color}cc`:'#ccc',fs:12,fw:'600'});
    svg.appendChild(t);tc.push({r,t,mk});
  });
  const hl=mkPath('M0,82 L0,54',color,uid);hl.style.transition='transform 0.28s';svg.appendChild(hl);
  const ht=mkText(0,92,'HEAD',{fill:color,fs:8});ht.style.transition='transform 0.28s';svg.appendChild(ht);
  function sh(pos){const hx=12+pos*cw+cw/2-1;hl.setAttribute('transform',`translate(${hx},0)`);ht.setAttribute('transform',`translate(${hx},0)`);tc.forEach((c,i)=>{const h=(i===pos);c.r.setAttribute('stroke',h?color:c.mk?`${color}80`:`${color}55`);c.r.setAttribute('fill',h?`${color}33`:c.mk?`${color}18`:'rgba(255,255,255,0.07)');c.t.setAttribute('fill',h?color:(c.mk?`${color}cc`:'#ccc'));});}
  sh(1);
  const states=[
    {x:52,y:165,label:'q_sim',accept:false,start:true},
    {x:162,y:165,label:'q_acc',accept:false,start:false},
    {x:280,y:165,label:'q_rej',accept:false,start:false},
    {x:380,y:165,label:'qₐ',accept:true,start:false}
  ];
  svg.appendChild(mkPath(`M${52+R},165 L${162-R},165`,color,uid,.1));svg.appendChild(mkText(107,153,'sim M',{fill:'#888',fs:8}));
  svg.appendChild(mkPath(`M${162+R},165 L${280-R},165`,color,uid,.2));svg.appendChild(mkText(221,153,'accept?',{fill:'#888',fs:8}));
  svg.appendChild(mkPath(`M${280+R},165 L${380-R},165`,color,uid,.3));svg.appendChild(mkText(330,153,'halt',{fill:'#888',fs:8}));
  states.forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkText(205,224,'Universal TM simulating ⟨M⟩ on input w',{fill:'#888',fs:9}));
  const mv=[1,2,3,4,3,2,1,2,1,3,4,3];
  let ts=0;
  const qs=['q_sim','q_sim','q_acc','q_acc','q_rej','q_rej','q_sim','q_acc','q_sim','q_rej','q_rej','qₐ'];
  svg._animInterval=setInterval(()=>{
    sh(mv[ts%mv.length]);
    const q=qs[ts%qs.length];
    ['q_sim','q_acc','q_rej','qₐ'].forEach(st=>{const c=svg.querySelector(`[data-state-id="${st}"]`);if(c)c.setAttribute('fill',st===q?color+'66':'rgba(255,255,255,0.02)');});
    ts=(ts+1)%mv.length;
  },620);
  return svg;
}

// ── TM: Post Correspondence Problem ──────────────────────────────────────────
function buildTM_pcp(color, prefix) {
  const svg=mkSVG('0 0 430 230'), uid=`tm-pcp-${prefix}`, R=20;
  svg.appendChild(mkDefs(uid,color));
  const cw=58;
  const tiles=[{t:'a',b:'ab'},{t:'ab',b:'b'},{t:'b',b:'a'},{t:'⊔',b:'?'}];
  svg.appendChild(mkText(12,14,'DOMINOES (top / bottom):',{fill:'#666',fs:8,anchor:'start'}));
  const domCells=[];
  tiles.forEach((tile,i)=>{
    const x=10+i*cw;
    const rt=document.createElementNS(NS,'rect');rt.setAttribute('x',x);rt.setAttribute('y',18);rt.setAttribute('width',cw-4);rt.setAttribute('height',18);rt.setAttribute('stroke',`${color}55`);rt.setAttribute('fill','rgba(255,255,255,0.06)');rt.setAttribute('rx','3');svg.appendChild(rt);
    const tt=mkText(x+(cw-4)/2,31,tile.t,{fill:'#ccc',fs:11,fw:'600'});svg.appendChild(tt);
    const line=document.createElementNS(NS,'line');line.setAttribute('x1',x);line.setAttribute('y1',39);line.setAttribute('x2',x+cw-4);line.setAttribute('y2',39);line.setAttribute('stroke',`${color}66`);line.setAttribute('stroke-width','1.5');svg.appendChild(line);
    const rb=document.createElementNS(NS,'rect');rb.setAttribute('x',x);rb.setAttribute('y',41);rb.setAttribute('width',cw-4);rb.setAttribute('height',18);rb.setAttribute('stroke',`${color}55`);rb.setAttribute('fill','rgba(255,255,255,0.04)');rb.setAttribute('rx','3');svg.appendChild(rb);
    const tb=mkText(x+(cw-4)/2,54,tile.b,{fill:'#999',fs:11});svg.appendChild(tb);
    domCells.push({rt,tt,rb,tb});
  });
  const hl=mkPath('M0,82 L0,61',color,uid);hl.style.transition='transform 0.3s';svg.appendChild(hl);
  const ht=mkText(0,92,'HEAD',{fill:color,fs:8});ht.style.transition='transform 0.3s';svg.appendChild(ht);
  function sh(pos){const hx=10+pos*cw+(cw-4)/2;hl.setAttribute('transform',`translate(${hx},0)`);ht.setAttribute('transform',`translate(${hx},0)`);domCells.forEach((d,i)=>{const h=(i===pos);[d.rt,d.rb].forEach(r=>r.setAttribute('fill',h?`${color}28`:'rgba(255,255,255,0.04)'));[d.tt,d.tb].forEach(t=>t.setAttribute('fill',h?color:(t===d.tt?'#ccc':'#999')));});}
  sh(0);
  const states=[
    {x:55,y:160,label:'q_try',accept:false,start:true},
    {x:185,y:160,label:'q_mat',accept:false,start:false},
    {x:315,y:160,label:'q_chk',accept:false,start:false},
    {x:405,y:160,label:'qₐ',accept:true,start:false}
  ];
  svg.appendChild(mkPath(`M${55+R},160 L${185-R},160`,color,uid,.1));svg.appendChild(mkText(120,148,'try tile',{fill:'#888',fs:8}));
  svg.appendChild(mkPath(`M${185+R},160 L${315-R},160`,color,uid,.2));svg.appendChild(mkText(250,148,'match?',{fill:'#888',fs:8}));
  svg.appendChild(mkPath(`M${315+R},160 L${405-R},160`,color,uid,.3));svg.appendChild(mkText(360,148,'check',{fill:'#888',fs:8}));
  states.forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkText(210,224,'TM for Post Correspondence Problem (dominoes)',{fill:'#888',fs:8}));
  const mv=[0,1,2,1,0,2,1,3];
  let ts=0;
  const qs=['q_try','q_try','q_mat','q_mat','q_chk','q_chk','q_mat','qₐ'];
  svg._animInterval=setInterval(()=>{
    sh(mv[ts%mv.length]);
    const q=qs[ts%qs.length];
    ['q_try','q_mat','q_chk','qₐ'].forEach(st=>{const c=svg.querySelector(`[data-state-id="${st}"]`);if(c)c.setAttribute('fill',st===q?color+'66':'rgba(255,255,255,0.02)');});
    ts=(ts+1)%mv.length;
  },650);
  return svg;
}

// ── LBA EXPRESSION ROUTER ────────────────────────────────────────────────────
function buildLBA(color, prefix, expr) {
  // normalise: collapse superscripts and spaces so matching is clean
  const _e = (expr || '').trim().toLowerCase()
    .replace(/[ⁿᵐᵏʲᵖᵒʳ]/g, n => 'nmkijpr'['nᵐᵏʲᵖᵒʳ'.indexOf(n)] || 'n')
    .replace(/ⁿ/g,'n').replace(/\s+/g,'');
  if (_e === 'ww' || _e === 'copylanguage') return buildLBA_ww(color, prefix);
  if (_e === 'anbncndnen')                   return buildLBA_anbncndnen(color, prefix);
  if (_e === 'anbncndn')                     return buildLBA_anbncndn(color, prefix);
  return buildLBA_anbncn(color, prefix);
}

// ── LBA: aⁿbⁿcⁿ ──────────────────────────────────────────────────────────────
function buildLBA_anbncn(color, prefix) {
  const svg=mkSVG('0 0 380 220'), uid=`lba-abc-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=20, cw=38;
  const tape=['\u22a2','a','a','b','b','c','\u22a3'];
  svg.appendChild(mkText(12,15,'LB-TAPE \u2192',{fill:'#666',fs:9,anchor:'start'}));
  const tc=[];
  tape.forEach((sym,i)=>{
    const x=18+i*cw, mk=(sym==='\u22a2'||sym==='\u22a3');
    const r=document.createElementNS(NS,'rect');
    r.setAttribute('x',x); r.setAttribute('y',18); r.setAttribute('width',cw-2); r.setAttribute('height',32);
    r.setAttribute('stroke',mk?`${color}80`:`${color}35`); r.setAttribute('fill',mk?`${color}15`:'rgba(255,255,255,0.05)'); r.setAttribute('rx','4');
    svg.appendChild(r);
    const t=mkText(x+cw/2-1,39,sym,{fill:mk?`${color}dd`:'#bbb',fs:13,fw:mk?'700':'400'});
    svg.appendChild(t); tc.push({r,t,mk});
  });
  const hl=mkPath('M0,80 L0,55',color,uid); hl.style.transition='transform 0.25s'; svg.appendChild(hl);
  const ht=mkText(0,90,'HEAD',{fill:color,fs:9}); ht.style.transition='transform 0.25s'; svg.appendChild(ht);
  function sh(pos){ const hx=18+pos*cw+cw/2-1; hl.setAttribute('transform',`translate(${hx},0)`); ht.setAttribute('transform',`translate(${hx},0)`); tc.forEach((c,i)=>{ const h=(i===pos); c.r.setAttribute('stroke',h?color:c.mk?`${color}80`:`${color}40`); c.r.setAttribute('fill',h?`${color}28`:c.mk?`${color}15`:'rgba(255,255,255,0.06)'); c.t.setAttribute('fill',h?color:(c.mk?`${color}dd`:'#bbb')); c.t.setAttribute('font-weight',h||c.mk?'700':'400'); }); }
  sh(1);
  const states=[{x:48,y:150,label:'q\u2080',accept:false,start:true},{x:145,y:150,label:'q\u2081',accept:false,start:false},{x:242,y:150,label:'q\u2082',accept:false,start:false},{x:325,y:150,label:'q\u2090',accept:true,start:false}];
  svg.appendChild(mkPath(`M${48+R},150 L${145-R},150`,color,uid,.1)); svg.appendChild(mkText(96,138,'a\u2192X,R',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${145+R},150 L${242-R},150`,color,uid,.2)); svg.appendChild(mkText(193,138,'b\u2192Y,R',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${242-R},155 C220,192 167,192 ${145+R},155`,color,uid,.3)); svg.appendChild(mkText(193,202,'back,L',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${242+R},150 L${325-R},150`,color,uid,.4)); svg.appendChild(mkText(285,138,'done',{fill:'#888',fs:9}));
  states.forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkText(190,214,'LBA for a\u207fb\u207fc\u207f \u2014 tape bounded by input',{fill:'#888',fs:9}));
  const mv=[1,2,3,4,3,2,1,2,3,4,5,4,3,2]; let ls=0;
  svg._animInterval=setInterval(()=>{ sh(mv[ls]); const q=mv[ls]%2===0?'q\u2082':'q\u2081'; ['q\u2080','q\u2081','q\u2082','q\u2090'].forEach(st=>{ const c=svg.querySelector(`[data-state-id="${st}"]`); if(c)c.setAttribute('fill',st===q?color+'66':'rgba(255,255,255,0.02)'); }); ls=(ls+1)%mv.length; },550);
  return svg;
}

// ── LBA: ww (copy language) ───────────────────────────────────────────────────
function buildLBA_ww(color, prefix) {
  const svg=mkSVG('0 0 380 220'), uid=`lba-ww-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=20, cw=38;
  // tape shows "ab#ab" = ww with # as center separator
  const tape=['\u22a2','a','b','#','a','b','\u22a3'];
  svg.appendChild(mkText(12,15,'LB-TAPE \u2192',{fill:'#666',fs:9,anchor:'start'}));
  const tc2=[];
  tape.forEach((sym,i)=>{
    const x=18+i*cw, mk=(sym==='\u22a2'||sym==='\u22a3'||sym==='#');
    const r=document.createElementNS(NS,'rect');
    r.setAttribute('x',x); r.setAttribute('y',18); r.setAttribute('width',cw-2); r.setAttribute('height',32);
    r.setAttribute('stroke',mk?`${color}80`:`${color}35`); r.setAttribute('fill',mk?`${color}15`:'rgba(255,255,255,0.05)'); r.setAttribute('rx','4');
    svg.appendChild(r);
    const t=mkText(x+cw/2-1,39,sym,{fill:mk?`${color}dd`:'#bbb',fs:13,fw:mk?'700':'400'});
    svg.appendChild(t); tc2.push({r,t,mk});
  });
  const hl2=mkPath('M0,80 L0,55',color,uid); hl2.style.transition='transform 0.25s'; svg.appendChild(hl2);
  const ht2=mkText(0,90,'HEAD',{fill:color,fs:9}); ht2.style.transition='transform 0.25s'; svg.appendChild(ht2);
  function sh2(pos){ const hx=18+pos*cw+cw/2-1; hl2.setAttribute('transform',`translate(${hx},0)`); ht2.setAttribute('transform',`translate(${hx},0)`); tc2.forEach((c,i)=>{ const h=(i===pos); c.r.setAttribute('stroke',h?color:c.mk?`${color}80`:`${color}40`); c.r.setAttribute('fill',h?`${color}28`:c.mk?`${color}15`:'rgba(255,255,255,0.06)'); c.t.setAttribute('fill',h?color:(c.mk?`${color}dd`:'#bbb')); c.t.setAttribute('font-weight',h||c.mk?'700':'400'); }); }
  sh2(1);
  const states2=[{x:48,y:150,label:'q\u2080',accept:false,start:true},{x:145,y:150,label:'q\u2081',accept:false,start:false},{x:242,y:150,label:'q\u2082',accept:false,start:false},{x:325,y:150,label:'q\u2090',accept:true,start:false}];
  svg.appendChild(mkPath(`M${48+R},150 L${145-R},150`,color,uid,.1)); svg.appendChild(mkText(96,138,'x\u2192X,R',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${145+R},150 L${242-R},150`,color,uid,.2)); svg.appendChild(mkText(193,138,'y\u2192Y,L',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${242-R},155 C220,192 167,192 ${145+R},155`,color,uid,.3)); svg.appendChild(mkText(193,202,'back,R',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${242+R},150 L${325-R},150`,color,uid,.4)); svg.appendChild(mkText(285,138,'done',{fill:'#888',fs:9}));
  states2.forEach(s=>mkState(svg,{...s,color,uid,R}));
  svg.appendChild(mkText(190,214,'LBA for ww \u2014 match w against second copy w',{fill:'#888',fs:9}));
  // sweep: left side then right side
  const mv2=[1,2,4,5,4,2,1,2,4,5,4,2]; let ls2=0;
  svg._animInterval=setInterval(()=>{ sh2(mv2[ls2]); const q=mv2[ls2]<=3?'q\u2081':'q\u2082'; ['q\u2080','q\u2081','q\u2082','q\u2090'].forEach(st=>{ const c=svg.querySelector(`[data-state-id="${st}"]`); if(c)c.setAttribute('fill',st===q?color+'66':'rgba(255,255,255,0.02)'); }); ls2=(ls2+1)%mv2.length; },550);
  return svg;
}

// ── LBA: aⁿbⁿcⁿdⁿ ────────────────────────────────────────────────────────────
function buildLBA_anbncndn(color, prefix) {
  const svg=mkSVG('0 0 420 235'), uid=`lba-abcd-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=18, cw=34;
  const tape=['\u22a2','a','a','b','b','c','c','d','d','\u22a3'];
  svg.appendChild(mkText(12,15,'LB-TAPE \u2192',{fill:'#666',fs:9,anchor:'start'}));
  const tcD=[];
  tape.forEach((sym,i) => {
    const x=12+i*cw, mk=(sym==='\u22a2'||sym==='\u22a3');
    const r=document.createElementNS(NS,'rect');
    r.setAttribute('x',x);r.setAttribute('y',18);r.setAttribute('width',cw-2);r.setAttribute('height',32);
    r.setAttribute('stroke',mk?`${color}80`:`${color}35`);r.setAttribute('fill',mk?`${color}15`:'rgba(255,255,255,0.05)');r.setAttribute('rx','4');
    svg.appendChild(r);
    const t=mkText(x+cw/2-1,39,sym,{fill:mk?`${color}dd`:'#bbb',fs:13,fw:mk?'700':'400'});
    svg.appendChild(t);tcD.push({r,t,mk});
  });
  const hlD=mkPath('M0,80 L0,55',color,uid);hlD.style.transition='transform 0.25s';svg.appendChild(hlD);
  const htD=mkText(0,90,'HEAD',{fill:color,fs:9});htD.style.transition='transform 0.25s';svg.appendChild(htD);
  function shD(pos){
    const hx=12+pos*cw+cw/2-1;
    hlD.setAttribute('transform',`translate(${hx},0)`);htD.setAttribute('transform',`translate(${hx},0)`);
    tcD.forEach((c,i)=>{const h=(i===pos);c.r.setAttribute('stroke',h?color:c.mk?`${color}80`:`${color}40`);c.r.setAttribute('fill',h?`${color}28`:c.mk?`${color}15`:'rgba(255,255,255,0.06)');c.t.setAttribute('fill',h?color:(c.mk?`${color}dd`:'#bbb'));c.t.setAttribute('font-weight',h||c.mk?'700':'400');});
  }
  shD(1);
  const statesD=[
    {x:42,y:160,label:'q\u2080',accept:false,start:true},
    {x:118,y:160,label:'q\u2081',accept:false,start:false},
    {x:194,y:160,label:'q\u2082',accept:false,start:false},
    {x:270,y:160,label:'q\u2083',accept:false,start:false},
    {x:354,y:160,label:'q\u2090',accept:true,start:false}
  ];
  svg.appendChild(mkPath(`M${42+R},160 L${118-R},160`,color,uid,.1));svg.appendChild(mkText(80,148,'a\u2192X,R',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${118+R},160 L${194-R},160`,color,uid,.2));svg.appendChild(mkText(156,148,'b\u2192Y,R',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${194+R},160 L${270-R},160`,color,uid,.3));svg.appendChild(mkText(232,148,'c\u2192Z,R',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${270-R},165 C240,215 148,215 ${118+R},165`,color,uid,.4));svg.appendChild(mkText(194,228,'d\u2192W, back L',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${270+R},160 L${354-R},160`,color,uid,.5));svg.appendChild(mkText(312,148,'done',{fill:'#888',fs:9}));
  statesD.forEach(s=>mkState(svg,{...s,color,uid,R}));
  const mvD=[1,2,3,4,5,6,7,8,7,6,5,4,3,2,1,2,3,4,5,6];let lsD=0;
  const sqD=['q\u2081','q\u2081','q\u2082','q\u2082','q\u2083','q\u2083','q\u2081','q\u2081','q\u2083','q\u2083','q\u2082','q\u2082','q\u2081','q\u2081','q\u2082','q\u2082','q\u2083','q\u2083','q\u2081','q\u2081'];
  svg._animInterval=setInterval(()=>{shD(mvD[lsD]);const q=sqD[lsD];['q\u2080','q\u2081','q\u2082','q\u2083','q\u2090'].forEach(st=>{const c=svg.querySelector(`[data-state-id="${st}"]`);if(c)c.setAttribute('fill',st===q?color+'66':'rgba(255,255,255,0.02)');});lsD=(lsD+1)%mvD.length;},500);
  return svg;
}

// ── LBA: aⁿbⁿcⁿdⁿeⁿ ──────────────────────────────────────────────────────────
function buildLBA_anbncndnen(color, prefix) {
  const svg=mkSVG('0 0 430 240'), uid=`lba-abcde-${prefix}`;
  svg.appendChild(mkDefs(uid,color));
  const R=15, cw=28;
  const tape=['\u22a2','a','a','b','b','c','c','d','d','e','e','\u22a3'];
  svg.appendChild(mkText(10,15,'LB-TAPE \u2192',{fill:'#666',fs:9,anchor:'start'}));
  const tcE=[];
  tape.forEach((sym,i)=>{
    const x=10+i*cw,mk=(sym==='\u22a2'||sym==='\u22a3');
    const r=document.createElementNS(NS,'rect');
    r.setAttribute('x',x);r.setAttribute('y',18);r.setAttribute('width',cw-2);r.setAttribute('height',30);
    r.setAttribute('stroke',mk?`${color}80`:`${color}35`);r.setAttribute('fill',mk?`${color}15`:'rgba(255,255,255,0.05)');r.setAttribute('rx','3');
    svg.appendChild(r);
    const t=mkText(x+cw/2-1,37,sym,{fill:mk?`${color}dd`:'#bbb',fs:12,fw:mk?'700':'400'});
    svg.appendChild(t);tcE.push({r,t,mk});
  });
  const hlE=mkPath('M0,78 L0,53',color,uid);hlE.style.transition='transform 0.22s';svg.appendChild(hlE);
  const htE=mkText(0,88,'HEAD',{fill:color,fs:8});htE.style.transition='transform 0.22s';svg.appendChild(htE);
  function shE(pos){
    const hx=10+pos*cw+cw/2-1;
    hlE.setAttribute('transform',`translate(${hx},0)`);htE.setAttribute('transform',`translate(${hx},0)`);
    tcE.forEach((c,i)=>{const h=(i===pos);c.r.setAttribute('stroke',h?color:c.mk?`${color}80`:`${color}40`);c.r.setAttribute('fill',h?`${color}28`:c.mk?`${color}15`:'rgba(255,255,255,0.06)');c.t.setAttribute('fill',h?color:(c.mk?`${color}dd`:'#bbb'));c.t.setAttribute('font-weight',h||c.mk?'700':'400');});
  }
  shE(1);
  const statesE=[
    {x:32,y:158,label:'q\u2080',accept:false,start:true},
    {x:94,y:158,label:'q\u2081',accept:false,start:false},
    {x:156,y:158,label:'q\u2082',accept:false,start:false},
    {x:218,y:158,label:'q\u2083',accept:false,start:false},
    {x:280,y:158,label:'q\u2084',accept:false,start:false},
    {x:358,y:158,label:'q\u2090',accept:true,start:false}
  ];
  [[32,94,'a\u2192X,R',63,146],[94,156,'b\u2192Y,R',125,146],[156,218,'c\u2192Z,R',187,146],[218,280,'d\u2192W,R',249,146]].forEach(([x1,x2,lbl,lx,ly],di)=>{
    svg.appendChild(mkPath(`M${x1+R},158 L${x2-R},158`,color,uid,di*0.1));svg.appendChild(mkText(lx,ly,lbl,{fill:'#888',fs:8}));
  });
  svg.appendChild(mkPath(`M${280-R},163 C250,218 112,218 ${94+R},163`,color,uid,.5));svg.appendChild(mkText(187,232,'e\u2192V, back L',{fill:'#888',fs:9}));
  svg.appendChild(mkPath(`M${280+R},158 L${358-R},158`,color,uid,.6));svg.appendChild(mkText(319,146,'done',{fill:'#888',fs:9}));
  statesE.forEach(s=>mkState(svg,{...s,color,uid,R}));
  const mvE=[1,2,3,4,5,6,7,8,9,10,9,8,7,6,5,4,3,2,1,2,3,4];let lsE=0;
  const sqE=['q\u2081','q\u2081','q\u2082','q\u2082','q\u2083','q\u2083','q\u2084','q\u2084','q\u2081','q\u2081','q\u2084','q\u2084','q\u2083','q\u2083','q\u2082','q\u2082','q\u2081','q\u2081','q\u2082','q\u2082','q\u2083','q\u2083'];
  svg._animInterval=setInterval(()=>{shE(mvE[lsE]);const q=sqE[lsE];['q\u2080','q\u2081','q\u2082','q\u2083','q\u2084','q\u2090'].forEach(st=>{const c=svg.querySelector(`[data-state-id="${st}"]`);if(c)c.setAttribute('fill',st===q?color+'66':'rgba(255,255,255,0.02)');});lsE=(lsE+1)%mvE.length;},460);
  return svg;
}
