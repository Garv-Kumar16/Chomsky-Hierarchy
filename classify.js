// ─────────────────────────────────────────────────────────────────────────────
// classify.js  —  Robust Chomsky Hierarchy Language Classifier
//
// DESIGN:
//   1. Normalize input into two forms: text (keyword search) + sym (symbolic)
//   2. Check in order: RE → CS → CF → Reg  (most → least specific)
//      This is CRITICAL — prevents "aⁿbⁿ" (CF pattern) from falsely matching
//      inside "aⁿbⁿcⁿ" (which is CS) because CS is checked first.
//   3. Each checker uses both compact symbolic patterns AND natural-language keys
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUBLIC API
 * classifyInput(rawInput) → matching SIM_RULES entry  |  null if unknown
 * Requires SIM_RULES from data.js to already be loaded.
 */
function classifyInput(rawInput) {
  if (!rawInput || !rawInput.trim()) return null;

  const norms = buildNorms(rawInput);

  // Helper: among rules of a given type, prefer one whose patterns[] match the input
  function bestRule(type) {
    const candidates = SIM_RULES.filter(r => r.type === type);
    if (candidates.length === 1) return candidates[0];
    const lower = rawInput.toLowerCase().trim();
    // Sort so rules with longer patterns are evaluated first —
    // prevents 'anbncn' substring-matching inside 'anbncndnen'.
    const sorted = [...candidates].sort((a, b) => {
      const aMax = Math.max(...(a.patterns||[]).map(p => p.length));
      const bMax = Math.max(...(b.patterns||[]).map(p => p.length));
      return bMax - aMax; // descending
    });
    for (const rule of sorted) {
      if (rule.patterns && rule.patterns.some(p => {
        const pl = p.toLowerCase();
        const ps = pl.replace(/\s/g,'').replace(/ⁿ/g,'n');
        return lower === pl || lower.includes(pl) || norms.sym === ps || norms.sym.includes(ps);
      })) return rule;
    }
    return candidates[0]; // fallback
  }

  if (isRE(norms))  return bestRule('re');
  if (isCS(norms))  return bestRule('cs');
  if (isCF(norms))  return bestRule('cf');
  if (isReg(norms)) return bestRule('reg');

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns { text, sym }
 *
 * text — lowercase, spaces collapsed; used for natural-language keyword search
 *   e.g. "Equal number of A's and B's" → "equal number of a's and b's"
 *
 * sym  — compact symbolic form; all exponent notations unified, spaces/noise removed
 *   "a^n b^n c^n"      → "anbncn"
 *   "aⁿbⁿ"             → "anbn"
 *   "{ w | w = ww, n≥1}" → "wwww"  (conditions stripped)
 *   "0^n 1^n"           → "0n1n"
 *   "(ab)*"             → "(ab)*"
 */
function buildNorms(raw) {
  const lower = raw.toLowerCase().trim();

  // text: readable for phrase/keyword scanning
  const text = lower.replace(/\s+/g, ' ');

  // sym: compact symbolic
  let sym = lower
    // Unicode superscripts → plain
    .replace(/ⁿ/g, 'n').replace(/ᵐ/g, 'm').replace(/ᵏ/g, 'k')
    .replace(/ⁱ/g, 'i').replace(/ʲ/g, 'j')
    .replace(/¹/g, '1').replace(/²/g, '2').replace(/³/g, '3')
    .replace(/⁺/g, '+')
    // ^var → var  (a^n → an,  b^m → bm)
    .replace(/\^([nmkijpqr])/gi, '$1')
    // ^digit → digit  (a^2 → a2)
    .replace(/\^(\d+)/g, '$1')
    // Strip set-builder conditions  (| n >= 0, : n ≥ 1, where n > 0, such that …)
    .replace(/[|:]\s*[nmkijpqr]\s*[><=≥≤]{1,2}\s*\d*/gi, '')
    .replace(/\b(where|such that|for all|for)\b.*/gi, '')
    // Remove ALL whitespace + noise punctuation
    .replace(/[\s{}\[\]()\-=><,;:'"!?∈∀∃≥≤]/g, '');

  return { text, sym };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASSIFIERS  (checked top-to-bottom: RE first, Reg last)
// ─────────────────────────────────────────────────────────────────────────────

// ── TYPE 0 — Recursively Enumerable ──────────────────────────────────────────
function isRE({ text }) {
  const keywords = [
    'halting problem', 'halting',
    'post correspondence', 'pcp',
    'undecidable', 'undecidability',
    'semi-decidable', 'semidecidable', 'semi decidable',
    "rice's theorem", 'rices theorem', 'rice theorem',
    'turing machine acceptance', 'acceptance problem', 'tm acceptance',
    'not recursive', 'not decidable', 'non-recursive',
    'reduces to', 'reduction to',
    'co-re language', 'complement of re',
    'diagonalization', 'diagonalisation',
    'recursively enumerable but not recursive',
    'type 0',
  ];
  return keywords.some(k => text.includes(k));
}

// ── TYPE 1 — Context-Sensitive ────────────────────────────────────────────────
function isCS({ text, sym }) {

  // Direct symbolic matches (exact or substring)
  const csSymbolic = [
    'anbncn',      // aⁿbⁿcⁿ
    'anbncndn',    // aⁿbⁿcⁿdⁿ  (4 equal — CS not RE)
    'anbncndnen',  // aⁿbⁿcⁿdⁿeⁿ
    '0n1n2n',      // 0ⁿ1ⁿ2ⁿ
    'ww',          // copy language
  ];
  if (csSymbolic.some(p => sym === p || sym.includes(p))) return true;

  // Detect dependencies from exponent variables
  if (analyzeDependencies(sym) === 'cs') return true;

  // Natural-language keywords
  const keywords = [
    // Specific language names
    'anbncn', 'a^n b^n c^n', 'aⁿbⁿcⁿ',
    'anbncndn', 'a^nb^nc^nd^n', 'aⁿbⁿcⁿdⁿ',
    'copy language', 'copy of w', 'ww',
    'square language', 'n squared', 'n^2', 'perfect square length',
    // 3+ equal count descriptions
    'three equal', 'four equal', 'five equal',
    'three symbols equal', 'equal three symbols',
    'equal counts of three', 'equal counts of four',
    'equal number of a b c', 'equal number of as bs cs',
    "equal number of a's b's and c's",
    "equal number of a's, b's, and c's",
    "equal number of a's b's c's",
    'same number of a b c', 'same count of a b and c',
    'n as n bs n cs', "n a's n b's n c's",
    'equal a b and c', 'equal a, b, c',
    'equal a b c d', 'n a n b n c',
    // Automaton hints
    'linear bounded', 'lba', 'linear bounded automaton',
    // Chomsky type
    'type 1', 'context sensitive', 'context-sensitive',
  ];
  return keywords.some(k => text.includes(k));
}

/**
 * Analyzes the sequence of exponent variables in sym.
 * E.g. "anbmendam" -> sequence is ['n', 'm', 'n', 'm']
 * Returns 'reg' (independent counts), 'cf' (nested/sequential pairs), or 'cs' (crossing or 3+).
 */
function analyzeDependencies(sym) {
  // Prevent natural English phrases from falsely triggering the variable counter
  // Since 'sym' has spaces removed, we check substring matches of common keywords
  if (/string|end|start|equal|number|language|length|divisible|multiple|contain/i.test(sym)) {
    return 'none';
  }

  const vars = [];
  const regex = /[a-z0-9]([nmkijpqr])/g;
  let match;
  while ((match = regex.exec(sym)) !== null) {
    vars.push(match[1]);
  }
  
  if (vars.length === 0) return 'none'; // No variables
  
  const counts = {};
  vars.forEach(v => counts[v] = (counts[v] || 0) + 1);
  
  let maxCount = 0;
  for (let v in counts) {
    if (counts[v] > maxCount) maxCount = counts[v];
  }
  
  if (maxCount >= 3) return 'cs'; // More than 2 occurrences -> cannot be done with one stack -> CS
  if (maxCount === 1) return 'reg'; // Only independent variables (equivalent to Kleene star) -> Reg
  
  // Track pairs of variables
  const deps = vars.filter(v => counts[v] === 2);
  const stack = [];
  for (let v of deps) {
    if (!stack.includes(v)) {
      stack.push(v);
    } else {
      if (stack[stack.length - 1] !== v) {
        return 'cs'; // Crossing dependencies -> Context-Sensitive
      } else {
        stack.pop(); // Nested or sequential dependencies -> Context-Free
      }
    }
  }
  return 'cf';
}

// ── TYPE 2 — Context-Free ─────────────────────────────────────────────────────
function isCF({ text, sym }) {

  // Exactly 2 properly nested or sequential variables -> Context-Free
  if (analyzeDependencies(sym) === 'cf') return true;

  // Natural-language keywords
  const keywords = [
    // Specific languages
    'anbn', 'a^n b^n', 'aⁿbⁿ',
    'palindrome', 'palindromes',
    'balanced parentheses', 'balanced parenthesis',
    'balanced brackets', 'matched brackets',
    'balanced braces', 'well-formed parentheses', 'well formed parentheses',
    'dyck language', 'dyck word', 'dyck',
    'properly nested', 'nested brackets', 'nested parentheses',
    // 2-equal-count descriptions
    'equal number of a and b', 'equal number of as and bs',
    "equal number of a's and b's",
    "same number of a's and b's",
    'equal a and b', 'equal as and bs',
    'n as followed by n bs', 'n bs followed by n as',
    'n a followed by n b',
    'equal number of 0 and 1', 'equal number of 0s and 1s',
    "equal number of 0's and 1's",
    // Automaton / grammar hints
    'pushdown', 'pda', 'push-down automaton', 'push down automaton',
    'context free', 'context-free', 'cfg',
    // Misc CF examples
    'arithmetic expression', 'arithmetic expressions',
    'reverse of w', 'wwreverse', 'wwr',
    // Chomsky type
    'type 2',
  ];
  return keywords.some(k => text.includes(k));
}

// ── TYPE 3 — Regular ──────────────────────────────────────────────────────────
function isReg({ text, sym }) {

  // If we have independent variables (e.g. aⁿbᵐ), it is functionally identical to a*b* -> Regular
  const depType = analyzeDependencies(sym);
  if (depType === 'reg') return true;

  // Pure regex characters with no counting variable → Regular
  if (sym.length > 0 && /^[a-z0-9*+?|().]+$/i.test(sym) && depType === 'none') return true;

  // Natural-language keywords
  const keywords = [
    // String descriptions
    'ends with', 'ends in', 'ending with', 'ending in',
    'starts with', 'starts in', 'begins with', 'starting with',
    'strings over', 'all strings of',
    'strings containing', 'strings not containing',
    // Length properties (DFA-countable via modular arithmetic)
    'even length', 'odd length',
    'length divisible', 'divisible by', 'multiple of',
    // Lexical / token patterns
    'identifier', 'identifiers',
    'keyword', 'keywords',
    'token', 'tokens',
    'binary string', 'binary strings', 'binary number',
    'decimal number', 'integer literal',
    // Automaton hints
    'finite automaton', 'dfa', 'nfa', 'finite state automaton',
    'regular expression', 'regex', 'regexp',
    'regular language', 'regular grammar',
    // Common examples
    'a*', 'b*', 'a+', 'b+', '(ab)*', '(a|b)*', 'a*b*',
    // Chomsky type
    'type 3',
  ];
  return keywords.some(k => text.includes(k));
}
