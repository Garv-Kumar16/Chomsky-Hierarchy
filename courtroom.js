// ── courtroom.js  —  "The Language Courtroom" mock trial game ─────────────

const COURT_CASES = [
  {
    id: 'case-anbncn',
    title: 'The State vs. aⁿbⁿcⁿ',
    language: 'aⁿbⁿcⁿ',
    trueType: 'cs',
    arguments: [
      { side: 'prosecution', text: 'Your Honor, look at this monstrosity! It demands three separate, identical counts. This level of synchronization is dangerous and highly complex!' },
      { side: 'defense', text: 'Objection! The prosecution exaggerates. We can simply use a Pushdown Automaton. We push \'a\'s, match them with \'b\'s... wait. We are out of stack memory for the \'c\'s.' },
      { side: 'prosecution', text: 'Exactly! The single stack is exhausted! It violates the Context-Free Pumping Lemma. It requires a Linear Bounded Automaton to sweep back and forth over the bounded input!' },
      { side: 'defense', text: 'I concede we need sweeps... but no more tape than the input itself! It is not a fully unhinged Turing Machine!' }
    ],
    verdict: 'The court finds aⁿbⁿcⁿ guilty of being Context-Sensitive (Type 1). A single stack cannot hold three simultaneous counts, necessitating a Linear Bounded Automaton with bounded tape sweeps.'
  },
  {
    id: 'case-anbn',
    title: 'The State vs. aⁿbⁿ',
    language: 'aⁿbⁿ',
    trueType: 'cf',
    arguments: [
      { side: 'prosecution', text: 'The defendant claims to be simple, but any counting requires memory! A mere Finite Automaton cannot count to arbitrarily large n.' },
      { side: 'defense', text: 'We admit to needing memory, your Honor. But only a single, humble stack! We push when we see \'a\', and pop when we see \'b\'.' },
      { side: 'prosecution', text: 'But what if the strings get infinitely long?!' },
      { side: 'defense', text: 'The stack depth grows, yes, but one stack is perfectly adequate. It adheres strictly to the Context-Free grammar S → aSb | ε.' }
    ],
    verdict: 'The court finds aⁿbⁿ guilty of being Context-Free (Type 2). The simple pairing requires exactly one stack for memory, far beyond Regular expressions but well within the bounds of a Pushdown Automaton.'
  },
  {
    id: 'case-astar',
    title: 'The State vs. a*',
    language: 'a*',
    trueType: 'reg',
    arguments: [
      { side: 'prosecution', text: 'This language is an endless stream of \'a\'s! Infinity, your Honor! Such unbounded repetition must require intense computing power!' },
      { side: 'defense', text: 'With respect, the prosecution is confused. "Infinity" does not mean "memory". We don\'t care HOW MANY \'a\'s there are, only that there is nothing else.' },
      { side: 'prosecution', text: 'But you have to track them!' },
      { side: 'defense', text: 'No, we just loop! A single state transitioning to itself. "Are you an \'a\'? Yes? Stay here." Zero memory required.' }
    ],
    verdict: 'The court finds a* guilty of being Regular (Type 3). Repetition without counting requires no memory queue or stack—just a simple state loop in a Deterministic Finite Automaton.'
  },
  {
    id: 'case-ww',
    title: 'The State vs. ww',
    language: 'ww',
    trueType: 'cs',
    arguments: [
      { side: 'prosecution', text: 'This "copy language" is deceptive. It requires matching a string against an exact copy of itself!' },
      { side: 'defense', text: 'It\'s just matching two halves. A Pushdown Automaton can match halves! Look at palindromes (wwᴿ)!' },
      { side: 'prosecution', text: 'Aha! Palindromes are reversed (LIFO)! True copies require reading the first half out in the EXACT SAME ORDER (FIFO). A stack reverses things! A stack cannot do this!' },
      { side: 'defense', text: '...This is true. We cannot use a simple stack. We must mark the tape and sweep back and forth to compare symbols across the gap.' }
    ],
    verdict: 'The court finds ww guilty of being Context-Sensitive (Type 1). Pushdown automata reverse order (LIFO), so a true sequential copy requires the linear tape sweeps of an LBA.'
  },
  {
    id: 'case-halting',
    title: 'The State vs. Halting Problem',
    language: 'Halting Problem',
    trueType: 're',
    arguments: [
      { side: 'prosecution', text: 'This language is utterly undecidable! No algorithmic procedure can definitively settle the fate of its strings.' },
      { side: 'defense', text: 'Objection! The prosecution deals in absolutes! A Turing Machine can simply simulate the input program!' },
      { side: 'prosecution', text: 'And if it never halts? Your Machine loops forever, incapable of declaring \'NO\'. It is unbridled chaos!' },
      { side: 'defense', text: 'It may not always halt to reject, but it can recognize valid YES instances given infinite time and tape. That is Type 0!' }
    ],
    verdict: 'The court finds the Halting Problem guilty of being Recursively Enumerable (Type 0). It requires a Turing machine that may fail to halt on invalid inputs, exhibiting unbounded computational power.'
  },
  {
    id: 'case-parens',
    title: 'The State vs. Balanced Parens',
    language: 'Balanced ()',
    trueType: 'cf',
    arguments: [
      { side: 'prosecution', text: 'The depth of nesting here is arbitrary! You could be a million parentheses deep! That much memory requires a sophisticated unbounded tape.' },
      { side: 'defense', text: 'Hardly! We do not need to rewrite or scan back and forth. We only need to remember our current depth via a single stack.' },
      { side: 'prosecution', text: 'But what if you hit (...((...)))... wait, yes, you just pop.' },
      { side: 'defense', text: 'Exactly. Push on open, pop on close. A textbook Pushdown Automaton.' }
    ],
    verdict: 'The court finds Balanced Parentheses guilty of being Context-Free (Type 2). The unbounded memory requirement is strictly Last-In-First-Out, easily handled by a single stack.'
  }
];

let crtActiveCase = null;
let crtArgIndex   = 0;
let crtScore      = 0;

function initCourtroom() {
  renderDocket();
  
  document.getElementById('crt-verdict-btn-reg').addEventListener('click', () => castVote('reg'));
  document.getElementById('crt-verdict-btn-cf').addEventListener('click', () => castVote('cf'));
  document.getElementById('crt-verdict-btn-cs').addEventListener('click', () => castVote('cs'));
  document.getElementById('crt-verdict-btn-re').addEventListener('click', () => castVote('re'));
  
  document.getElementById('crt-next-btn').addEventListener('click', showNextArgument);
  document.getElementById('crt-back-docket').addEventListener('click', closeTrial);
  document.getElementById('crt-replay-btn').addEventListener('click', closeTrial);
}

function renderDocket() {
  const docket = document.getElementById('crt-docket-list');
  docket.innerHTML = '';
  
  COURT_CASES.forEach((c, idx) => {
    const card = document.createElement('div');
    card.className = 'crt-docket-card';
    card.innerHTML = `
      <div class="crt-case-num">CASE #${idx + 1}</div>
      <div class="crt-case-title">${c.title}</div>
      <div class="crt-case-lang">Expression: <strong>${c.language}</strong></div>
      <button class="crt-play-btn">START TRIAL</button>
    `;
    card.querySelector('.crt-play-btn').addEventListener('click', () => startTrial(c));
    docket.appendChild(card);
  });
  
  document.getElementById('crt-score').textContent = crtScore;
}

function startTrial(caseObj) {
  crtActiveCase = caseObj;
  crtArgIndex = 0;
  
  document.getElementById('crt-docket-view').classList.add('hidden');
  document.getElementById('crt-trial-view').classList.remove('hidden');
  document.getElementById('crt-verdict-overlay').classList.add('hidden');
  
  document.getElementById('crt-trial-title').innerHTML = `On Trial: <span class="crt-highlight">${caseObj.language}</span>`;
  
  const chat = document.getElementById('crt-chat');
  chat.innerHTML = '';
  
  document.getElementById('crt-action-bar').classList.remove('hidden');
  document.getElementById('crt-voting-panel').classList.add('hidden');
  
  showNextArgument();
}

function showNextArgument() {
  if (crtArgIndex >= crtActiveCase.arguments.length) {
    // Time for Jury to vote
    document.getElementById('crt-action-bar').classList.add('hidden');
    document.getElementById('crt-voting-panel').classList.remove('hidden');
    return;
  }
  
  const arg = crtActiveCase.arguments[crtArgIndex];
  crtArgIndex++;
  
  const chat = document.getElementById('crt-chat');
  const nextBtn = document.getElementById('crt-next-btn');
  
  // Disable next button while typing
  nextBtn.disabled = true;
  nextBtn.textContent = '...';
  
  const bubbleWrap = document.createElement('div');
  bubbleWrap.className = `crt-bubble-wrap ${arg.side === 'prosecution' ? 'crt-right' : 'crt-left'}`;
  
  const avatar = document.createElement('div');
  avatar.className = `crt-avatar ${arg.side}`;
  avatar.textContent = arg.side === 'prosecution' ? 'PROS.' : 'DEF.';
  
  const bubble = document.createElement('div');
  bubble.className = `crt-bubble ${arg.side}`;
  
  // Typing dots
  const dots = document.createElement('div');
  dots.className = 'crt-typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';
  bubble.appendChild(dots);
  
  if (arg.side === 'prosecution') {
    bubbleWrap.appendChild(bubble);
    bubbleWrap.appendChild(avatar);
  } else {
    bubbleWrap.appendChild(avatar);
    bubbleWrap.appendChild(bubble);
  }
  
  chat.appendChild(bubbleWrap);
  chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
  
  setTimeout(() => {
    bubble.innerHTML = '';
    bubble.textContent = arg.text;
    
    // Check for objection
    if (arg.text.toLowerCase().startsWith('objection')) {
      const flash = document.getElementById('crt-objection-flash');
      
      chat.classList.remove('crt-shake');
      void chat.offsetWidth; 
      chat.classList.add('crt-shake');
      
      flash.classList.remove('hidden');
      setTimeout(() => { flash.classList.add('hidden'); }, 1000);
    }
    
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    nextBtn.disabled = false;
    nextBtn.textContent = 'Next Argument ➦';
    
  }, 1000);
}

function castVote(guessedType) {
  const isCorrect = (guessedType === crtActiveCase.trueType);
  if (isCorrect) {
    crtScore += 100;
  }
  
  const overlay = document.getElementById('crt-verdict-overlay');
  const gavel = document.getElementById('crt-gavel');
  const title = document.getElementById('crt-verdict-result');
  const text = document.getElementById('crt-verdict-text');
  
  // Init hidden for drama
  title.style.opacity = '0';
  title.classList.remove('crt-stamped');
  text.style.opacity = '0';
  
  overlay.classList.remove('hidden');
  
  // Drop the gavel
  gavel.classList.remove('hidden');
  gavel.classList.remove('crt-gavel-anim');
  void gavel.offsetWidth;
  gavel.classList.add('crt-gavel-anim');
  
  // Stamp the text when gavel hits
  setTimeout(() => {
    title.textContent = isCorrect ? '⚖️ JUSTICE SERVED!' : '⚖️ MISTRIAL!';
    title.className = isCorrect ? 'crt-justice text-pass crt-stamped' : 'crt-mistrial text-fail crt-stamped';
    title.style.opacity = '1';
    
    text.textContent = crtActiveCase.verdict;
    text.style.transition = 'opacity 0.4s';
    text.style.opacity = '1';
    
    document.getElementById('crt-score').textContent = crtScore;
  }, 600);
}

function closeTrial() {
  document.getElementById('crt-trial-view').classList.add('hidden');
  document.getElementById('crt-docket-view').classList.remove('hidden');
  renderDocket();
}
