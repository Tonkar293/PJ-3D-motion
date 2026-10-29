import './style.css';
import { createScene } from './scene.js';
import { Plotter } from './plotter.js';
import { highlightLine } from './code.js';
import { pinInfo, ALL_PINS, GROUPS, labelOf } from './pins.js';
import { LESSONS } from './lessons.js';

// App state
let currentLessonIdx = 0;
let currentParams = {};
let currentLessonInstance = null;
let isPlaying = true;
let simTime = 0;
let simSpeed = 1.0;
let completedLessons = new Set(JSON.parse(localStorage.getItem('voltlab_done') || '[]'));
let lastFrameTime = performance.now();
let fpsCount = 0, lastFpsTime = performance.now();
let baudRate = 115200;
let showTimestamp = true;
let autoScrollSerial = true;
let activePinInspector = null;

// DOM Elements
const canvas = document.getElementById('c');
const scene = createScene(canvas);
const plotCanvas = document.getElementById('plot');
const plotter = new Plotter(plotCanvas);

const bootEl = document.getElementById('boot');
const playBtn = document.getElementById('btn-play');
const stepBtn = document.getElementById('btn-step');
const restartBtn = document.getElementById('btn-restart');
const speedSel = document.getElementById('speed');
const simtimeEl = document.getElementById('simtime');
const crumbNum = document.getElementById('crumb-num');
const crumbTitle = document.getElementById('crumb-title');
const progRing = document.getElementById('prog-ring');
const progText = document.getElementById('prog-text');
const themeBtn = document.getElementById('btn-theme');
const settingsBtn = document.getElementById('btn-settings');
const settingsPop = document.getElementById('settings');
const toastEl = document.getElementById('toast');
const fpsEl = document.getElementById('fps');
const tooltipEl = document.getElementById('tooltip');
const inspectorEl = document.getElementById('inspector');
const schemEl = document.getElementById('schem');
const schemBody = document.getElementById('schem-body');

const codeEl = document.getElementById('code');
const copyBtn = document.getElementById('btn-copy');
const dlBtn = document.getElementById('btn-dl');
const serialEl = document.getElementById('serial');
const serialForm = document.getElementById('serial-form');
const serialInput = document.getElementById('serial-input');
const baudSel = document.getElementById('baud');
const tsCheck = document.getElementById('ts');
const autoscrollCheck = document.getElementById('autoscroll');
const clearSerialBtn = document.getElementById('btn-clear');
const plotWinSel = document.getElementById('plot-win');
const plotPauseBtn = document.getElementById('btn-plot-pause');

const outTabs = document.getElementById('out-tabs');
const serialTools = document.getElementById('serial-tools');
const plotTools = document.getElementById('plot-tools');

const panelTabs = document.getElementById('panel-tabs');
const readoutsEl = document.getElementById('readouts');
const customPanelEl = document.getElementById('custom-panel');
const paramsEl = document.getElementById('params');
const infoEl = document.getElementById('info');
const pinsEl = document.getElementById('pins');
const specsEl = document.getElementById('specs');

const btnResetParam = document.getElementById('btn-reset');
const btnSavePreset = document.getElementById('btn-save');
const presetListSel = document.getElementById('preset-list');
const btnShareLink = document.getElementById('btn-share');

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toastEl.classList.remove('on'), 2500);
}

// -------------------------------------------------------------
// Formatters & Helpers
// -------------------------------------------------------------
function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(m).padStart(2, '0')}:${String(Math.floor(sec)).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function updateProgress() {
  const total = LESSONS.length;
  const done = completedLessons.size;
  progText.textContent = `${done}/${total}`;
  const circumference = 2 * Math.PI * 15;
  const offset = circumference * (1 - done / total);
  progRing.style.strokeDashoffset = offset;
  localStorage.setItem('voltlab_done', JSON.stringify([...completedLessons]));
}

function appendSerial(text, cls = '') {
  const line = document.createElement('div');
  line.className = 'l ' + cls;
  const ts = showTimestamp ? `<i>[${formatTime(simTime)}]</i>` : '';
  line.innerHTML = `${ts}${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}`;
  serialEl.appendChild(line);
  if (serialEl.childElementCount > 400) {
    serialEl.removeChild(serialEl.firstElementChild);
  }
  if (autoScrollSerial) {
    serialEl.scrollTop = serialEl.scrollHeight;
  }
}

// -------------------------------------------------------------
// Lesson Loading & Switching
// -------------------------------------------------------------
function loadLesson(idx, customInitialParams = null) {
  currentLessonIdx = idx;
  const lesson = LESSONS[idx];
  currentParams = customInitialParams ? { ...lesson.defaultParams, ...customInitialParams } : { ...lesson.defaultParams };

  // Update Topbar
  crumbNum.textContent = lesson.num;
  crumbTitle.textContent = lesson.title;

  // Rail active state
  document.querySelectorAll('.lesson').forEach((el, i) => {
    el.classList.toggle('is-on', i === idx);
    el.classList.toggle('done', completedLessons.has(LESSONS[i].id));
  });

  // Pins highlight on 3D board
  scene.highlight(lesson.pins || [], 0x39e6ff);

  // Setup 3D objects
  if (currentLessonInstance && currentLessonInstance.cleanup) {
    currentLessonInstance.cleanup();
  }
  currentLessonInstance = lesson.setup(scene, currentParams);

  // Reset Plotter channels
  plotter.reset(lesson.plotChannels || []);

  // Update Schematic
  renderSchematic(lesson.schematic || []);

  // Render Parameters Pane
  renderParams(lesson);

  // Render Info Pane
  renderInfo(lesson);

  // Render Code
  renderCode(lesson);

  // Serial notification
  appendSerial(`--- โหลดบทเรียน: ${lesson.title} ---`, 'sys');
}

function renderSchematic(chains) {
  schemBody.innerHTML = '';
  chains.forEach(c => {
    const row = document.createElement('div');
    row.className = 'chain';
    row.innerHTML = `
      <span class="n ${c.type || ''}">${c.from}</span>
      <span class="a">→</span>
      <span class="n ${c.type === 'gnd' ? 'gnd' : ''}">${c.to}</span>
    `;
    schemBody.appendChild(row);
  });
}

function renderCode(lesson) {
  const rawCode = lesson.getCode(currentParams);
  const lines = rawCode.trim().split('\n');
  codeEl.innerHTML = lines.map(l => `<span class="ln">${highlightLine(l)}</span>`).join('');
}

function renderParams(lesson) {
  paramsEl.innerHTML = '';
  customPanelEl.innerHTML = '';

  // Custom Interactive UI (e.g. Phone mock or custom press buttons)
  if (lesson.customUI && currentLessonInstance) {
    lesson.customUI(customPanelEl, currentLessonInstance);
  }

  // Parameter Groups
  const groupDiv = document.createElement('div');
  groupDiv.className = 'pgroup';
  groupDiv.textContent = 'พารามิเตอร์ของวงจร';
  paramsEl.appendChild(groupDiv);

  (lesson.paramSchema || []).forEach(schema => {
    const wrap = document.createElement('div');
    wrap.className = 'param';

    const row = document.createElement('div');
    row.className = 'row';

    const lbl = document.createElement('label');
    lbl.textContent = schema.label;
    row.appendChild(lbl);

    const val = currentParams[schema.key] !== undefined ? currentParams[schema.key] : schema.default;

    if (schema.type === 'range') {
      const valBox = document.createElement('div');
      valBox.className = 'val';
      const numIn = document.createElement('input');
      numIn.type = 'number';
      numIn.min = schema.min;
      numIn.max = schema.max;
      numIn.step = schema.step || 1;
      numIn.value = val;

      const unit = document.createElement('em');
      unit.textContent = schema.unit || '';
      valBox.appendChild(numIn);
      valBox.appendChild(unit);
      row.appendChild(valBox);
      wrap.appendChild(row);

      const rangeIn = document.createElement('input');
      rangeIn.type = 'range';
      rangeIn.min = schema.min;
      rangeIn.max = schema.max;
      rangeIn.step = schema.step || 1;
      rangeIn.value = val;

      const updateRangeProgress = (v) => {
        const pct = ((v - schema.min) / (schema.max - schema.min)) * 100;
        rangeIn.style.setProperty('--p', `${pct}%`);
      };
      updateRangeProgress(val);

      rangeIn.addEventListener('input', e => {
        const v = parseFloat(e.target.value);
        numIn.value = v;
        updateRangeProgress(v);
        currentParams[schema.key] = v;
        renderCode(lesson);
      });
      numIn.addEventListener('change', e => {
        let v = parseFloat(e.target.value);
        if (Number.isNaN(v)) v = schema.min;
        v = Math.max(schema.min, Math.min(schema.max, v));
        numIn.value = v;
        rangeIn.value = v;
        updateRangeProgress(v);
        currentParams[schema.key] = v;
        renderCode(lesson);
      });

      wrap.appendChild(rangeIn);
    } else if (schema.type === 'select') {
      const sel = document.createElement('select');
      (schema.options || []).forEach(opt => {
        const op = document.createElement('option');
        op.value = opt.v;
        op.textContent = opt.l;
        if (String(opt.v) === String(val)) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', e => {
        currentParams[schema.key] = e.target.value;
        renderCode(lesson);
      });
      row.appendChild(sel);
      wrap.appendChild(row);
    } else if (schema.type === 'toggle') {
      const sw = document.createElement('label');
      sw.className = 'switch';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = !!val;
      const sp = document.createElement('span');
      chk.addEventListener('change', e => {
        currentParams[schema.key] = e.target.checked;
        renderCode(lesson);
      });
      sw.appendChild(chk);
      sw.appendChild(sp);
      row.appendChild(sw);
      wrap.appendChild(row);
    } else if (schema.type === 'color') {
      const colIn = document.createElement('input');
      colIn.type = 'color';
      colIn.value = val || '#39e6ff';
      colIn.addEventListener('input', e => {
        currentParams[schema.key] = e.target.value;
        renderCode(lesson);
      });
      row.appendChild(colIn);
      wrap.appendChild(row);
    }

    paramsEl.appendChild(wrap);
  });
}

function renderInfo(lesson) {
  const i = lesson.info || {};
  const isDone = completedLessons.has(lesson.id);
  infoEl.innerHTML = `
    <div class="info">
      <h2>${lesson.title}</h2>
      <p class="lead">${i.lead || ''}</p>
      <h3>จุดสำคัญที่ควรรู้</h3>
      <ul>
        ${(i.bullets || []).map(b => `<li>${b}</li>`).join('')}
      </ul>
      ${i.quiz ? `
        <div class="quiz">
          <p>❓ คำถามทบทวน: ${i.quiz.q}</p>
          <div id="quiz-opts">
            ${i.quiz.opts.map((opt, idx) => `
              <button data-idx="${idx}">${opt.t}</button>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <button class="done-btn ${isDone ? 'is-done' : ''}" id="btn-mark-done">
        ${isDone ? '✓ สำเร็จบทเรียนนี้แล้ว' : 'ทำเครื่องหมายว่าเรียนจบแล้ว'}
      </button>
    </div>
  `;

  // Quiz click listener
  const quizOpts = infoEl.querySelector('#quiz-opts');
  if (quizOpts && i.quiz) {
    quizOpts.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const opt = i.quiz.opts[Number(btn.dataset.idx)];
        if (opt.right) {
          btn.className = 'right';
          showToast('ถูกต้องยอดเยี่ยม! 🎉');
          completedLessons.add(lesson.id);
          updateProgress();
          document.querySelectorAll('.lesson')[currentLessonIdx]?.classList.add('done');
          const markBtn = infoEl.querySelector('#btn-mark-done');
          if (markBtn) {
            markBtn.className = 'done-btn is-done';
            markBtn.textContent = '✓ สำเร็จบทเรียนนี้แล้ว';
          }
        } else {
          btn.className = 'wrong';
          showToast('ยังไม่ถูกต้อง ลองคิดดูอีกครั้งนะ');
        }
      });
    });
  }

  // Done button
  const markBtn = infoEl.querySelector('#btn-mark-done');
  if (markBtn) {
    markBtn.addEventListener('click', () => {
      if (completedLessons.has(lesson.id)) {
        completedLessons.delete(lesson.id);
        markBtn.className = 'done-btn';
        markBtn.textContent = 'ทำเครื่องหมายว่าเรียนจบแล้ว';
      } else {
        completedLessons.add(lesson.id);
        markBtn.className = 'done-btn is-done';
        markBtn.textContent = '✓ สำเร็จบทเรียนนี้แล้ว';
        showToast('ยินดีด้วย! คุณผ่านบทเรียนนี้แล้ว 🚀');
      }
      updateProgress();
      document.querySelectorAll('.lesson')[currentLessonIdx]?.classList.toggle('done', completedLessons.has(lesson.id));
    });
  }
}

// -------------------------------------------------------------
// Pins Pane & Search
// -------------------------------------------------------------
function renderPinsPane() {
  pinsEl.innerHTML = `
    <div style="padding-bottom: 8px;">
      <input type="text" class="pin-search" id="pin-search-input" placeholder="ค้นหาขา เช่น 4, ADC, Touch, PWM..." />
      <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px;" id="pin-group-chips">
        <button class="ghost" data-group="all" style="font-size:11px; padding:3px 7px;">ทั้งหมด</button>
        <button class="ghost" data-group="PWM" style="font-size:11px; padding:3px 7px;">PWM</button>
        <button class="ghost" data-group="ADC" style="font-size:11px; padding:3px 7px;">ADC</button>
        <button class="ghost" data-group="Touch" style="font-size:11px; padding:3px 7px;">Touch</button>
        <button class="ghost" data-group="Strapping" style="font-size:11px; padding:3px 7px;">Strapping</button>
        <button class="ghost" data-group="Power" style="font-size:11px; padding:3px 7px;">Power</button>
      </div>
      <table class="t">
        <thead>
          <tr>
            <th>ขา</th>
            <th>GPIO</th>
            <th>ฟังก์ชันหลัก</th>
            <th>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody id="pin-table-body"></tbody>
      </table>
    </div>
  `;

  const tbody = pinsEl.querySelector('#pin-table-body');
  const searchIn = pinsEl.querySelector('#pin-search-input');
  const groupChips = pinsEl.querySelector('#pin-group-chips');

  function filterPins(query = '', group = 'all') {
    tbody.innerHTML = '';
    const q = query.toLowerCase();
    ALL_PINS.forEach(id => {
      const info = pinInfo(id);
      const isGrp = group === 'all' || (GROUPS[group] && GROUPS[group].includes(id));
      const matchText = `${id} ${info.label} ${info.funcs.map(f => f.t).join(' ')} ${info.notes.join(' ')}`.toLowerCase();
      if (isGrp && (!q || matchText.includes(q))) {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
          <td><b>${info.label}</b></td>
          <td>${info.gpio !== null ? 'GPIO' + info.gpio : '—'}</td>
          <td>${info.funcs.map(f => `<span class="tag ${f.k}">${f.t}</span>`).join(' ')}</td>
          <td style="font-size:11px; color:var(--text-3);">${info.notes[0] || '—'}</td>
        `;
        tr.addEventListener('mouseenter', () => scene.highlight([id], 0xa77bff));
        tr.addEventListener('mouseleave', () => scene.highlight(LESSONS[currentLessonIdx].pins || [], 0x39e6ff));
        tr.addEventListener('click', () => {
          showPinInspector(id, window.innerWidth / 2, window.innerHeight / 3);
        });
        tbody.appendChild(tr);
      }
    });
  }

  filterPins();

  searchIn.addEventListener('input', e => filterPins(e.target.value));
  groupChips.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => filterPins(searchIn.value, btn.dataset.group));
  });
}

// -------------------------------------------------------------
// Specs Pane
// -------------------------------------------------------------
function renderSpecsPane() {
  specsEl.innerHTML = `
    <div style="line-height: 1.6; font-size: 13px;">
      <h3 style="margin-top:0; color:var(--accent);">ESP32 DevKit V1 สเปกฮาร์ดแวร์</h3>
      <table class="t">
        <tbody>
          <tr><td>หน่วยประมวลผล</td><td>Tensilica Xtensa Dual-Core 32-bit LX6 @ 240 MHz (สูงสุด 600 DMIPS)</td></tr>
          <tr><td>หน่วยความจำ</td><td>520 KB SRAM, 448 KB ROM, 4 MB SPI Flash</td></tr>
          <tr><td>การเชื่อมต่อไร้สาย</td><td>Wi-Fi 802.11 b/g/n (สูงสุด 150 Mbps) + Bluetooth v4.2 BR/EDR & BLE</td></tr>
          <tr><td>แรงดันทำงาน (Logic)</td><td><b>3.3V</b> (ระดับลอจิกห้ามเกิน 3.6V)</td></tr>
          <tr><td>แรงดันไฟเลี้ยง (VIN)</td><td>5V – 12V (ผ่าน onboard LDO AMS1117 3.3V) หรือ 5V ผ่าน Micro-USB</td></tr>
          <tr><td>กระแสจ่ายสูงสุดต่อขา</td><td>12 mA แนะนำ (Absolute Max 40 mA)</td></tr>
          <tr><td>ADC (อนาล็อกอินพุต)</td><td>12-bit (0–4095) 18 ช่อง (ADC1 8 ช่อง, ADC2 10 ช่อง)</td></tr>
          <tr><td>DAC (อนาล็อกเอาต์พุต)</td><td>8-bit 2 ช่อง (GPIO25, GPIO26)</td></tr>
          <tr><td>PWM (LEDC)</td><td>16 ช่องฮาร์ดแวร์อิสระ ความละเอียดสูงสุด 16 บิต</td></tr>
          <tr><td>การสื่อสารข้อมูล</td><td>3x UART, 2x I2C, 3x SPI, 2x I2S, 10x Touch sensor</td></tr>
          <tr><td>การกินกระแส (Active)</td><td>80 – 240 mA (ขณะส่งสัญญาณ Wi-Fi เต็มกำลัง)</td></tr>
          <tr><td>การกินกระแส (Deep Sleep)</td><td>~10 µA – 150 µA (โหมดประหยัดพลังงาน)</td></tr>
        </tbody>
      </table>
      <div style="margin-top:16px; padding:10px; border-radius:10px; background:var(--surface-2); border:1px solid var(--line);">
        <b style="color:var(--warn);">⚠️ ข้อควรระวังในการต่อวงจร:</b>
        <p style="margin:4px 0; font-size:12px; color:var(--text-2);">
          1. ห้ามต่อเซนเซอร์ 5V เข้าขา GPIO ตรงๆ เพราะไม่มีตัวป้องกัน Over-voltage (ต้องใช้ตัวแบ่งแรงดัน Resistor Divider หรือ Logic Level Shifter)<br/>
          2. ขา GPIO34, 35, 36, 39 ไม่มีตัวต้านทาน Pull-up/Pull-down ภายในและเป็นขา Input ได้เท่านั้น
        </p>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Pin Inspector Popup
// -------------------------------------------------------------
function showPinInspector(pinId, x, y) {
  activePinInspector = pinId;
  const p = pinInfo(pinId);
  inspectorEl.removeAttribute('hidden');

  inspectorEl.innerHTML = `
    <button class="x" id="inspector-close">×</button>
    <h4>${p.label} <small>${p.gpio !== null ? 'GPIO' + p.gpio : 'POWER/GND'}</small></h4>
    <div class="tags">
      ${p.funcs.map(f => `<span class="tag ${f.k}">${f.t}</span>`).join('')}
    </div>
    <div class="live">
      <div><small>ชนิด</small><b>${p.kind.toUpperCase()}</b></div>
      <div><small>ระดับแรงดัน</small><b>3.3V Max</b></div>
      <div><small>สถานะ</small><b id="insp-state">READING</b></div>
    </div>
    ${p.notes.map(n => `<div class="note">${n}</div>`).join('')}
  `;

  inspectorEl.style.left = `${Math.min(window.innerWidth - 300, Math.max(10, x - 135))}px`;
  inspectorEl.style.top = `${Math.min(window.innerHeight - 300, Math.max(70, y - 100))}px`;

  inspectorEl.querySelector('#inspector-close').addEventListener('click', () => {
    inspectorEl.setAttribute('hidden', '');
    activePinInspector = null;
  });
}

// -------------------------------------------------------------
// UI Event Bindings
// -------------------------------------------------------------
function setupEventListeners() {
  // Lesson Rail list creation
  const lessonListEl = document.getElementById('lesson-list');
  lessonListEl.innerHTML = '';
  LESSONS.forEach((les, idx) => {
    const btn = document.createElement('button');
    btn.className = 'lesson' + (idx === 0 ? ' is-on' : '') + (completedLessons.has(les.id) ? ' done' : '');
    btn.innerHTML = `
      <div class="ic">${les.icon}</div>
      <div class="tx">
        <small>บทที่ ${les.num}</small>
        <b>${les.title.split('(')[0].trim()}</b>
        <span>${les.sub}</span>
      </div>
      <div class="ck">✓</div>
    `;
    btn.addEventListener('click', () => loadLesson(idx));
    lessonListEl.appendChild(btn);
  });

  // Topbar Simulation Controls
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.classList.toggle('paused', !isPlaying);
  });

  stepBtn.addEventListener('click', () => {
    if (!isPlaying) {
      simTime += 0.01;
      simtimeEl.textContent = formatTime(simTime);
      if (currentLessonInstance && currentLessonInstance.update) {
        currentLessonInstance.update(0.01, simTime, currentParams, { appendSerial });
      }
    }
  });

  restartBtn.addEventListener('click', () => {
    simTime = 0;
    simtimeEl.textContent = formatTime(0);
    loadLesson(currentLessonIdx);
    showToast('รีเซ็ตบอร์ด ESP32 เรียบร้อย ⟲');
  });

  speedSel.addEventListener('change', e => {
    simSpeed = parseFloat(e.target.value);
  });

  // Theme Toggle
  themeBtn.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    scene.setTheme(next === 'dark');
    plotter.setTheme();
    localStorage.setItem('voltlab_theme', next);
  });

  // Restore saved theme
  const savedTheme = localStorage.getItem('voltlab_theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  scene.setTheme(savedTheme === 'dark');

  // Settings popover
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPop.hidden = !settingsPop.hidden;
  });
  window.addEventListener('click', (e) => {
    if (!settingsPop.contains(e.target) && e.target !== settingsBtn) {
      settingsPop.hidden = true;
    }
  });

  document.getElementById('set-bloom').addEventListener('change', e => scene.setBloom(e.target.checked));
  document.getElementById('set-shadow').addEventListener('change', e => scene.setShadows(e.target.checked));
  document.getElementById('set-labels').addEventListener('change', e => scene.setLabels(e.target.checked));
  document.getElementById('set-flow').addEventListener('change', e => scene.setFlow(e.target.checked));
  document.getElementById('set-rotate').addEventListener('change', e => { scene.controls.autoRotate = e.target.checked; });
  document.getElementById('set-fps').addEventListener('change', e => { fpsEl.hidden = !e.target.checked; });
  document.getElementById('set-dpr').addEventListener('input', e => scene.setDpr(parseFloat(e.target.value)));
  document.getElementById('set-camspeed').addEventListener('input', e => { scene.controls.rotateSpeed = parseFloat(e.target.value); });

  // 3D View Buttons
  document.querySelectorAll('.viewbar button[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v === 'schem') {
        schemEl.classList.toggle('off');
        btn.classList.toggle('is-on');
      } else if (v === 'reset') {
        scene.flyTo([70, 95, 115], [0, 0, 5]);
      } else if (v === 'top') {
        scene.flyTo([0, 150, 0.1], [0, 0, 0]);
      } else if (v === 'front') {
        scene.flyTo([0, 25, 130], [0, 5, 0]);
      } else {
        document.querySelectorAll('.viewbar button[data-view]').forEach(b => {
          if (['normal', 'xray', 'wire'].includes(b.dataset.view)) b.classList.remove('is-on');
        });
        btn.classList.add('is-on');
        scene.setView(v);
      }
    });
  });

  // Scene Pick & Hover callbacks
  scene.onPick(hit => {
    if (hit) {
      showPinInspector(hit.id, hit.x, hit.y);
    }
  });

  scene.onHover((tip, e) => {
    if (tip && e) {
      tooltipEl.textContent = tip;
      tooltipEl.classList.add('on');
      tooltipEl.style.left = `${e.clientX + 14}px`;
      tooltipEl.style.top = `${e.clientY + 14}px`;
    } else {
      tooltipEl.classList.remove('on');
    }
  });

  // Dock Out Tabs (Serial vs Plotter)
  outTabs.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      outTabs.querySelectorAll('button').forEach(b => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      const isPlot = btn.dataset.out === 'plot';
      serialEl.hidden = isPlot;
      serialTools.hidden = isPlot;
      plotCanvas.hidden = !isPlot;
      plotTools.hidden = !isPlot;
      if (isPlot) plotter.draw();
    });
  });

  // Serial controls
  clearSerialBtn.addEventListener('click', () => { serialEl.innerHTML = ''; });
  baudSel.addEventListener('change', e => { baudRate = parseInt(e.target.value, 10); showToast(`Baud rate: ${baudRate}`); });
  tsCheck.addEventListener('change', e => { showTimestamp = e.target.checked; });
  autoscrollCheck.addEventListener('change', e => { autoScrollSerial = e.target.checked; });

  serialForm.addEventListener('submit', e => {
    e.preventDefault();
    const val = serialInput.value.trim();
    if (!val) return;
    appendSerial(`> ${val}`, 'in');
    serialInput.value = '';

    const lesson = LESSONS[currentLessonIdx];
    if (lesson.onSerialInput && currentLessonInstance) {
      const resp = lesson.onSerialInput(val, currentLessonInstance, (k, v) => {
        currentParams[k] = v;
        renderParams(lesson);
        renderCode(lesson);
      });
      if (resp) appendSerial(resp, 'ok');
    } else {
      appendSerial(`[Echo] ${val}`);
    }
  });

  // Plotter controls
  plotWinSel.addEventListener('change', e => { plotter.win = parseFloat(e.target.value); });
  plotPauseBtn.addEventListener('click', () => {
    plotter.paused = !plotter.paused;
    plotPauseBtn.textContent = plotter.paused ? 'เล่นกราฟต่อ' : 'หยุดกราฟ';
  });

  // Right Panel Tabs
  panelTabs.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      panelTabs.querySelectorAll('button').forEach(b => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('is-on', p.dataset.pane === tab));
    });
  });

  // Code actions: Copy & Download
  copyBtn.addEventListener('click', () => {
    const code = LESSONS[currentLessonIdx].getCode(currentParams);
    navigator.clipboard.writeText(code).then(() => showToast('คัดลอกโค้ด .ino ลงคลิปบอร์ดแล้ว! 📋'));
  });

  dlBtn.addEventListener('click', () => {
    const code = LESSONS[currentLessonIdx].getCode(currentParams);
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `esp32_lesson_${LESSONS[currentLessonIdx].id}.ino`;
    a.click();
    showToast('ดาวน์โหลด sketch.ino สำเร็จ 📥');
  });

  // Presets & Sharing
  btnResetParam.addEventListener('click', () => {
    currentParams = { ...LESSONS[currentLessonIdx].defaultParams };
    renderParams(LESSONS[currentLessonIdx]);
    renderCode(LESSONS[currentLessonIdx]);
    showToast('คืนค่าพารามิเตอร์เริ่มต้นแล้ว ↺');
  });

  btnSavePreset.addEventListener('click', () => {
    const name = prompt('ตั้งชื่อ Preset สำหรับการตั้งค่านี้:');
    if (!name) return;
    const key = `preset_${LESSONS[currentLessonIdx].id}_${name}`;
    localStorage.setItem(key, JSON.stringify(currentParams));
    refreshPresetList();
    showToast(`บันทึก Preset "${name}" เรียบร้อย! 💾`);
  });

  function refreshPresetList() {
    presetListSel.innerHTML = '<option value="">โหลด Preset…</option>';
    const prefix = `preset_${LESSONS[currentLessonIdx].id}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(prefix)) {
        const name = k.replace(prefix, '');
        const op = document.createElement('option');
        op.value = k;
        op.textContent = name;
        presetListSel.appendChild(op);
      }
    }
  }
  presetListSel.addEventListener('change', e => {
    const k = e.target.value;
    if (!k) return;
    const data = JSON.parse(localStorage.getItem(k));
    if (data) {
      currentParams = { ...data };
      renderParams(LESSONS[currentLessonIdx]);
      renderCode(LESSONS[currentLessonIdx]);
      showToast('โหลด Preset สำเร็จ!');
    }
  });

  btnShareLink.addEventListener('click', () => {
    const encoded = encodeURIComponent(JSON.stringify({ idx: currentLessonIdx, params: currentParams }));
    const url = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
    navigator.clipboard.writeText(url).then(() => showToast('คัดลอกลิงก์แชร์ที่มีพารามิเตอร์แล้ว! 🔗'));
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      playBtn.click();
    } else if (e.key === 'r' || e.key === 'R') {
      restartBtn.click();
    }
  });
}

// -------------------------------------------------------------
// Readout Cards Live Renderer
// -------------------------------------------------------------
function updateReadouts(readouts = []) {
  readoutsEl.innerHTML = '';
  readouts.forEach(r => {
    const d = document.createElement('div');
    d.className = `ro ${r.cls || ''}`;
    d.innerHTML = `
      <small>${r.label}</small>
      <b>${r.val}</b>
    `;
    readoutsEl.appendChild(d);
  });
}

// -------------------------------------------------------------
// Main Loop
// -------------------------------------------------------------
function loop(now) {
  requestAnimationFrame(loop);

  const rawDt = Math.min(0.1, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  // FPS calculation
  fpsCount++;
  if (now - lastFpsTime >= 1000) {
    fpsEl.textContent = `${fpsCount} FPS`;
    fpsCount = 0;
    lastFpsTime = now;
  }

  const dt = isPlaying ? rawDt * simSpeed : 0;
  if (isPlaying) {
    simTime += dt;
    simtimeEl.textContent = formatTime(simTime);
  }

  // Update current lesson simulation
  if (currentLessonInstance && currentLessonInstance.update) {
    const res = currentLessonInstance.update(dt, simTime, currentParams, { appendSerial });
    if (res) {
      if (res.readouts) updateReadouts(res.readouts);
      if (res.plot) plotter.push(simTime, res.plot);
      if (res.serial) appendSerial(res.serial);
      if (res.phoneState) {
        const phoneBars = document.getElementById('phone-bars');
        if (phoneBars) {
          const bars = res.phoneState.bars;
          phoneBars.querySelectorAll('i').forEach((bar, bi) => {
            bar.classList.toggle('on', bi < bars);
          });
        }
      }
    }
  }

  // Update 3D scene & controls
  scene.update(rawDt);

  // Draw 2D Plotter if active
  if (!plotCanvas.hidden) {
    plotter.draw();
  }
}

// -------------------------------------------------------------
// Bootstrap
// -------------------------------------------------------------
function init() {
  setupEventListeners();
  renderPinsPane();
  renderSpecsPane();
  updateProgress();

  // Check URL Hash for shared state
  let initialIdx = 0;
  let sharedParams = null;
  if (window.location.hash.includes('state=')) {
    try {
      const raw = decodeURIComponent(window.location.hash.split('state=')[1]);
      const obj = JSON.parse(raw);
      if (obj.idx !== undefined && LESSONS[obj.idx]) {
        initialIdx = obj.idx;
        sharedParams = obj.params;
      }
    } catch (err) {
      console.warn('Invalid shared URL state', err);
    }
  }

  loadLesson(initialIdx, sharedParams);

  // Dismiss boot screen
  setTimeout(() => {
    bootEl.classList.add('out');
  }, 400);

  // Start main loop
  requestAnimationFrame(loop);
}

// Start app
init();
