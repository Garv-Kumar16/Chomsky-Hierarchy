// js/compare.js — Side-by-side Chomsky type comparison

function initCompare() {
  document.getElementById('cmp-a').addEventListener('change', renderCompare);
  document.getElementById('cmp-b').addEventListener('change', renderCompare);
  renderCompare();
}

function renderCompare() {
  const a = document.getElementById('cmp-a').value;
  const b = document.getElementById('cmp-b').value;

  const colors = { reg:'#5c4bcc', cf:'#0d9e8a', cs:'#f07d00', re:'#e63950' };
  const names  = { reg:'Type 3 — Regular', cf:'Type 2 — Context-Free', cs:'Type 1 — Context-Sensitive', re:'Type 0 — RE' };
  const ca = colors[a], cb = colors[b];

  let html = `
    <table class="cmp-table">
      <thead>
        <tr>
          <th class="prop-col">Property</th>
          <th class="val-col" style="color:${ca}">${names[a]}</th>
          <th class="val-col" style="color:${cb}">${names[b]}</th>
        </tr>
      </thead>
      <tbody>
  `;

  CMP_ROWS.forEach(row => {
    if (row.section) {
      html += `<tr class="cmp-section-row"><td colspan="3">${row.section}</td></tr>`;
      return;
    }
    html += `
      <tr>
        <td class="prop-name">${row.prop}</td>
        <td class="val-cell">${fmtCell(row[a])}</td>
        <td class="val-cell">${fmtCell(row[b])}</td>
      </tr>`;
  });

  html += '</tbody></table>';
  document.getElementById('cmp-output').innerHTML = html;
}

function fmtCell(val) {
  if (val === 'yes')  return '<span class="cbadge cbadge-yes">✓ Yes</span>';
  if (val === 'no')   return '<span class="cbadge cbadge-no">✗ No</span>';
  if (val === 'part') return '<span class="cbadge cbadge-part">~ Partial</span>';
  return `<span style="color:var(--muted);font-size:.75rem">${val}</span>`;
}