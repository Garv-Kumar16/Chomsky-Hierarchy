// js/app.js — Tab switching + bootstrap

let courtroomInited = false;

function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
      document.getElementById(`tab-${target}`).classList.add('active');

      // Close panel if leaving diagram tab
      if (target !== 'diagram') closePanel();

      // Re-render compare table when switching to it
      if (target === 'compare') renderCompare();


      // Lazy-init courtroom game on first visit
      if (target === 'courtroom' && !courtroomInited) {
        courtroomInited = true;
        initCourtroom();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initVenn();
  initSimulate();
  initPlayground();
  initCompare();

  console.log('%c⬡ Chomsky Hierarchy Explorer v3 — ready', 'color:#0d9e8a;font-family:monospace;font-size:13px');
});