import * as THREE from 'three';
import * as parts from './parts.js';

// 5 Bright, Vibrant & Cheerful Themes (ไม่มืด สว่าง สดใส มีชีวิตชีวา)
const PRESET_THEMES = [
  {
    id: 'vibrant-sunshine',
    name: 'Vibrant Sunshine',
    sub: 'สดใส สว่าง อบอุ่น แดดยามเช้า',
    bg: '#fcf8f2',
    boardPcb: 0x2563eb, // Vibrant Royal Blue PCB
    desk: 0xf5ede2,
    accent: '#ff6b4a',
    accent2: '#ff9f1c',
    text: '#0f172a',
    preview: ['#fcf8f2', '#ff6b4a', '#2563eb', '#ff9f1c']
  },
  {
    id: 'tropical-mint',
    name: 'Tropical Mint',
    sub: 'สดชื่น ท้องฟ้า มิ้นต์และทะเล',
    bg: '#f0fdfa',
    boardPcb: 0x0f766e, // Mint Emerald PCB
    desk: 0xe6f9f5,
    accent: '#06b6d4',
    accent2: '#10b981',
    text: '#0f172a',
    preview: ['#f0fdfa', '#06b6d4', '#0f766e', '#10b981']
  },
  {
    id: 'candy-pastel',
    name: 'Candy Pastel',
    sub: 'หวานสดใส พาสเทลลูกกวาด',
    bg: '#fdf4ff',
    boardPcb: 0x86198f, // Plum Purple PCB
    desk: 0xfae8ff,
    accent: '#ec4899',
    accent2: '#a855f7',
    text: '#18181b',
    preview: ['#fdf4ff', '#ec4899', '#86198f', '#a855f7']
  },
  {
    id: 'clean-day-sky',
    name: 'Clean Day Sky',
    sub: 'ขาวสะอาด ท้องฟ้าแจ่มใส สบายตา',
    bg: '#f0f9ff',
    boardPcb: 0x0284c7, // Sky Blue PCB
    desk: 0xe0f2fe,
    accent: '#0ea5e9',
    accent2: '#f59e0b',
    text: '#0f172a',
    preview: ['#f0f9ff', '#0ea5e9', '#0284c7', '#f59e0b']
  },
  {
    id: 'fresh-lemon',
    name: 'Fresh Lemon & Mint',
    sub: 'เขียวมะนาวสดชื่น ธรรมชาติ',
    bg: '#f7fee7',
    boardPcb: 0x4d7c0f, // Olive Green PCB
    desk: 0xecfccb,
    accent: '#84cc16',
    accent2: '#14b8a6',
    text: '#14532d',
    preview: ['#f7fee7', '#84cc16', '#4d7c0f', '#14b8a6']
  }
];

// Available Components to Add
const COMPONENT_CATALOG = [
  {
    id: 'led',
    name: 'LED (หลอดไฟเดี่ยว)',
    desc: 'ไฟสว่าง ปรับสีได้ ต่อตรงเข้ากับ GPIO',
    icon: '💡',
    defaultPin: '4',
    pins: ['2', '4', '12', '14', '18', '19', '21', '22', '23', '25', '26', '27', '32', '33']
  },
  {
    id: 'rgb',
    name: 'RGB LED (หลอด 3 สี)',
    desc: 'ผสมสีแสง Red, Green, Blue ผ่าน PWM',
    icon: '🌈',
    defaultPin: '25',
    pins: ['25', '26', '27']
  },
  {
    id: 'button',
    name: 'Push Button (ปุ่มกด)',
    desc: 'สวิตช์กดติดปล่อยดับ ต่อเข้ากับ GPIO อินพุต',
    icon: '🔘',
    defaultPin: '18',
    pins: ['4', '5', '18', '19', '21', '22', '23', '32', '33', '34', '35']
  },
  {
    id: 'buzzer',
    name: 'Buzzer (ลำโพงเตือน)',
    desc: 'สร้างเสียงโน้ตดนตรีและสัญญาณเตือนภัย',
    icon: '🔊',
    defaultPin: '19',
    pins: ['4', '18', '19', '21', '22', '23']
  },
  {
    id: 'servo',
    name: 'Servo SG90 (เซอร์โว)',
    desc: 'มอเตอร์หมุนปรับมุมองศา 0–180 องศา',
    icon: '⚙️',
    defaultPin: '13',
    pins: ['13', '14', '15', '27', '32', '33']
  },
  {
    id: 'hcsr04',
    name: 'HC-SR04 (วัดระยะ)',
    desc: 'อัลตร้าโซนิกตรวจจับวัตถุและระยะสะท้อน',
    icon: '🦇',
    defaultPin: '5',
    pins: ['5', '18', '19', '23']
  },
  {
    id: 'ldr',
    name: 'LDR (เซนเซอร์แสง)',
    desc: 'ตัวต้านทานแปรผันตามความเข้มแสง Lux',
    icon: '☀️',
    defaultPin: '34',
    pins: ['32', '33', '34', '35', '36', '39']
  },
  {
    id: 'oled',
    name: 'OLED 0.96" SSD1306',
    desc: 'หน้าจอดิจิทัล I2C แสดงข้อความและกราฟิก',
    icon: '📺',
    defaultPin: '21',
    pins: ['21', '22']
  }
];

class StudioAddon {
  constructor() {
    this.installed = [];
    this.currentTheme = PRESET_THEMES[0];
    this.watermark = localStorage.getItem('motionlab_watermark') || 'Panuwich';
    this.wireGroup = null;
    this.audioCtx = null;
    this.floorMarkMesh = null;
    this.initUI();
    this.hookIntoApp();
    this.updateWatermarks();
  }

  toast(msg) {
    let t = document.getElementById('addon-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'addon-toast';
      t.className = 'addon-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('is-show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('is-show'), 2400);
  }

  setWatermark(name) {
    if (!name || !name.trim()) return;
    this.watermark = name.trim();
    localStorage.setItem('motionlab_watermark', this.watermark);
    this.updateWatermarks();
    this.updateFloorMark(this.watermark);
    this.toast(`อัปเดตชื่อ Dev & ลายน้ำเป็น "${this.watermark}" เรียบร้อย! ✨`);
  }

  updateWatermarks() {
    const ids = ['brand-watermark', 'custom-watermark-side', 'custom-watermark-row', 'addon-watermark-name'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = this.watermark;
    });
  }

  initUI() {
    // 1. Top floating bar (New Modern Studio Menu)
    const bar = document.createElement('div');
    bar.className = 'addon-topbar';
    bar.innerHTML = `
      <button class="addon-btn" id="addon-btn-lessons" title="เลือกบทเรียน">
        📚 <span>บทเรียน</span>
      </button>
      <button class="addon-btn" id="addon-btn-theme" title="เลือกธีมสีสดใสและปรับแต่งบอร์ด">
        🎨 <span>โทนสีสดใส</span>
      </button>
      <button class="addon-btn primary" id="addon-btn-add" title="เพิ่มอุปกรณ์ลงบนบอร์ด 3D">
        ➕ <span>เพิ่มอุปกรณ์</span>
      </button>
      <button class="addon-btn" id="addon-btn-parts" title="ดูรายการอุปกรณ์ที่ติดตั้ง">
        📦 <span>อุปกรณ์</span> <span class="addon-badge" id="addon-count">0</span>
      </button>
      <button class="addon-btn" id="addon-btn-preview-loader" title="คลิกเพื่อดูหน้าโหลด MotionLab Studio อีกครั้ง">
        🎬 <span>ดูหน้าโหลด</span>
      </button>
      <button class="addon-btn addon-watermark-btn" id="addon-btn-watermark" title="คลิกเพื่อเปลี่ยนชื่อ Dev / ลายน้ำ">
        👨‍💻 <span id="addon-watermark-name">${this.watermark}</span> ✏️
      </button>
    `;
    const appEl = document.getElementById('app') || document.body;
    appEl.appendChild(bar);

    // 2. Modals container
    const modalBg = document.createElement('div');
    modalBg.className = 'addon-modal-bg';
    modalBg.id = 'addon-modal-bg';
    modalBg.innerHTML = `
      <div class="addon-modal" id="addon-modal">
        <div class="addon-modal-header">
          <h3 id="addon-modal-title">🎨 เลือกโทนสีสดใส</h3>
          <button class="addon-close-btn" id="addon-modal-close">&times;</button>
        </div>
        <div class="addon-modal-body" id="addon-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modalBg);

    // 3. Installed Components Drawer
    const drawer = document.createElement('div');
    drawer.className = 'active-parts-panel is-collapsed';
    drawer.id = 'addon-drawer';
    drawer.innerHTML = `
      <div class="app-head" id="addon-drawer-head">
        <h4>📦 อุปกรณ์ที่เพิ่มเข้ามา (<span id="addon-drawer-count">0</span>)</h4>
        <span style="font-size:12px; color:#ea580c; font-weight:600;">▼ ย่อ/ขยาย</span>
      </div>
      <div class="app-body" id="addon-installed-list">
        <p style="text-align:center; color:#64748b; font-size:12.5px; margin:16px 0;">
          ยังไม่มีอุปกรณ์ที่เพิ่มเข้ามา<br/>กดปุ่ม <b>"➕ เพิ่มอุปกรณ์"</b> เพื่อเริ่มเชื่อมต่อ
        </p>
      </div>
      <div style="padding: 10px 12px; border-top: 1.5px solid #f1f5f9; display:flex; gap:8px;">
        <button class="addon-btn primary" style="flex:1; justify-content:center; border-radius:12px;" id="addon-copy-code">
          📋 คัดลอกโค้ด Arduino
        </button>
      </div>
    `;
    document.body.appendChild(drawer);

    // Event listeners
    document.getElementById('addon-btn-lessons').addEventListener('click', () => {
      const lessonsSec = document.querySelector('.lessons');
      if (lessonsSec) {
        lessonsSec.scrollIntoView({ behavior: 'smooth' });
      }
    });

    document.getElementById('addon-btn-theme').addEventListener('click', () => this.openThemeModal());
    document.getElementById('addon-btn-add').addEventListener('click', () => this.openAddComponentModal());
    document.getElementById('addon-btn-watermark').addEventListener('click', () => this.openWatermarkModal());
    document.getElementById('addon-btn-preview-loader').addEventListener('click', () => this.showLoaderPreview());

    // Sidebar Dev credit click
    const sideCredit = document.querySelector('.credit-side');
    if (sideCredit) {
      sideCredit.addEventListener('click', (e) => {
        e.preventDefault();
        this.openWatermarkModal();
      });
    }

    document.getElementById('addon-btn-parts').addEventListener('click', () => {
      drawer.classList.toggle('is-collapsed');
    });
    document.getElementById('addon-drawer-head').addEventListener('click', () => {
      drawer.classList.toggle('is-collapsed');
    });

    document.getElementById('addon-modal-close').addEventListener('click', () => this.closeModal());
    modalBg.addEventListener('click', e => {
      if (e.target === modalBg) this.closeModal();
    });

    document.getElementById('addon-copy-code').addEventListener('click', () => this.copyGeneratedSketch());
  }

  closeModal() {
    document.getElementById('addon-modal-bg').classList.remove('is-open');
  }

  openWatermarkModal() {
    const title = document.getElementById('addon-modal-title');
    const body = document.getElementById('addon-modal-body');
    title.innerHTML = '👨‍💻 ตั้งชื่อ Dev & ลายน้ำบนพื้น 3D';

    body.innerHTML = `
      <div style="margin-bottom: 12px; font-size: 14px; color: #475569; line-height: 1.5;">
        พิมพ์ชื่อของคุณที่ต้องการให้แสดงในแถบด้านข้าง (Dev Name) และลายน้ำบนพื้น 3D:
      </div>
      <div class="watermark-input-box">
        <input type="text" id="watermark-text-input" value="${this.watermark}" placeholder="ใส่ชื่อของคุณ เช่น Panuwich" autocomplete="off" />
        <button id="btn-save-watermark">บันทึกชื่อ</button>
      </div>
      <div style="margin-top: 14px; padding: 12px; border-radius: 12px; background: #fff7ed; border: 1.5px solid #fdba74; font-size: 12.5px; color: #c2410c;">
        💡 ชื่อนี้จะปรากฏบน<b>พื้นฉาก 3D</b>, <b>แถบ Dev ด้านข้าง</b>, <b>หัวเว็บ</b> และ<b>โค้ด Arduino</b> โดยอัตโนมัติครับ
      </div>
    `;

    const input = document.getElementById('watermark-text-input');
    const saveBtn = document.getElementById('btn-save-watermark');

    saveBtn.addEventListener('click', () => {
      this.setWatermark(input.value);
      this.closeModal();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveBtn.click();
    });

    document.getElementById('addon-modal-bg').classList.add('is-open');
    setTimeout(() => input.focus(), 150);
  }

  showLoaderPreview() {
    let preview = document.getElementById('loader-preview-overlay');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'loader-preview-overlay';
      preview.className = 'loader is-preview';
      preview.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 40%,#ffffff 0%,#fffaf5 45%,#fed7aa 100%);transition:opacity 0.5s ease,visibility 0.5s;';
      preview.innerHTML = `
        <div class="loader-inner">
          <div class="loader-chip-container">
            <div class="loader-chip-ring"></div>
            <div class="loader-chip-ring ring-2"></div>
            <div class="loader-chip-badge">
              <svg viewBox="0 0 54 54" class="loader-chip-svg" aria-hidden="true">
                <rect x="11" y="11" width="32" height="32" rx="8" fill="#ff6b4a"/>
                <rect x="16" y="16" width="22" height="22" rx="4" fill="#ffffff" fill-opacity="0.18"/>
                <path d="M20 27h14M27 20v14" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
                <circle cx="27" cy="27" r="5" fill="#ff9f1c"/>
                <path d="M4 21h7M4 27h7M4 33h7M43 21h7M43 27h7M43 33h7M21 4v7M27 4v7M33 4v7M21 43v7M27 43v7M33 43v7" stroke="#ff9f1c" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
          <p class="loader-title">MotionLab <span>ESP32 Studio</span></p>
          <div class="loader-creator-tag">
            <span class="loader-creator-icon">⚡</span>
            <span class="loader-creator-label">CREATED &amp; ENGINEERED BY</span>
            <b class="loader-creator-name" id="preview-creator-name">${this.watermark}</b>
          </div>
          <div class="loader-track" aria-hidden="true">
            <span class="loader-fill" id="preview-loader-fill" style="transform-origin:left;transform:scaleX(0);transition:transform 0.5s ease;"></span>
            <span class="loader-shine"></span>
          </div>
          <p class="loader-step" id="preview-loader-step">INITIALIZING 3D MOTION STAGE...</p>
          <span class="loader-studio-sub">3D Interactive Electronics &amp; Microcontroller Studio</span>
          <button style="margin-top:22px;padding:7px 18px;border-radius:99px;border:1.5px solid #fdba74;background:#ffffff;font-size:12.5px;font-weight:700;color:#ea580c;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.06);" id="preview-loader-close">✕ ปิดหน้าตัวอย่าง</button>
        </div>
      `;
      document.body.appendChild(preview);
      document.getElementById('preview-loader-close').addEventListener('click', () => {
        preview.style.opacity = '0';
        preview.style.visibility = 'hidden';
      });
    }

    const nameEl = document.getElementById('preview-creator-name');
    if (nameEl) nameEl.textContent = this.watermark;

    const fill = document.getElementById('preview-loader-fill');
    const step = document.getElementById('preview-loader-step');
    preview.style.opacity = '1';
    preview.style.visibility = 'visible';
    preview.style.pointerEvents = 'auto';

    fill.style.transform = 'scaleX(0.12)';
    step.textContent = 'CONNECTING TO ESP32 VIRTUAL BOARD...';

    setTimeout(() => {
      fill.style.transform = 'scaleX(0.52)';
      step.textContent = 'WIRING PINS & SENSORS...';
    }, 500);

    setTimeout(() => {
      fill.style.transform = 'scaleX(0.88)';
      step.textContent = 'RENDERING 3D SHADERS & STUDIO LIGHTING...';
    }, 1200);

    setTimeout(() => {
      fill.style.transform = 'scaleX(1)';
      step.textContent = `MOTIONLAB STUDIO READY · BY ${this.watermark.toUpperCase()}`;
    }, 1900);

    setTimeout(() => {
      preview.style.opacity = '0';
      preview.style.visibility = 'hidden';
      preview.style.pointerEvents = 'none';
    }, 2800);
  }

  openThemeModal() {
    const title = document.getElementById('addon-modal-title');
    const body = document.getElementById('addon-modal-body');
    title.innerHTML = '🎨 เลือกโทนสีสดใส & มีชีวิตชีวา';
    
    let html = `
      <div style="margin-bottom: 14px; font-size: 13.5px; color: #475569;">
        เลือกโทนสีสว่างสดใส สบายตา ไม่มืด พร้อมปรับสีบอร์ด ESP32 3D ได้ทันที:
      </div>
      <div class="theme-grid">
        ${PRESET_THEMES.map(th => `
          <div class="theme-card ${this.currentTheme.id === th.id ? 'is-active' : ''}" data-theme-id="${th.id}">
            <div class="theme-preview-strip">
              ${th.preview.map(c => `<span style="background:${c};"></span>`).join('')}
            </div>
            <b>${th.name}</b>
            <small>${th.sub}</small>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 22px;">
        <h4 style="margin: 0 0 12px; font-size: 15px; font-weight:800; color: #ea580c;">🛠️ ปรับแต่งสีละเอียดตามใจชอบ</h4>
        <div class="color-picker-row">
          <span>สีแผงวงจร ESP32 (3D PCB Color)</span>
          <input type="color" id="picker-pcb" value="#${this.currentTheme.boardPcb.toString(16).padStart(6, '0')}">
        </div>
        <div class="color-picker-row">
          <span>สีพื้นหลัง & โต๊ะทำงาน (Bright Background)</span>
          <input type="color" id="picker-bg" value="${this.currentTheme.bg}">
        </div>
        <div class="color-picker-row">
          <span>สีเน้น / ปุ่มไฮไลท์ (Vibrant Accent)</span>
          <input type="color" id="picker-accent" value="${this.currentTheme.accent}">
        </div>
      </div>
    `;
    body.innerHTML = html;

    // Theme card clicks
    body.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const th = PRESET_THEMES.find(t => t.id === card.dataset.themeId);
        if (th) {
          this.applyTheme(th);
          this.openThemeModal();
        }
      });
    });

    // Custom color pickers
    const pPcb = document.getElementById('picker-pcb');
    const pBg = document.getElementById('picker-bg');
    const pAcc = document.getElementById('picker-accent');

    pPcb.addEventListener('input', e => {
      const hex = parseInt(e.target.value.replace('#', ''), 16);
      this.setBoardPcbColor(hex);
    });
    pBg.addEventListener('input', e => {
      this.setBackgroundColor(e.target.value);
    });
    pAcc.addEventListener('input', e => {
      document.documentElement.style.setProperty('--accent', e.target.value);
    });

    document.getElementById('addon-modal-bg').classList.add('is-open');
  }

  applyTheme(th) {
    this.currentTheme = th;
    document.documentElement.style.setProperty('--bg', th.bg);
    document.documentElement.style.setProperty('--accent', th.accent);
    document.documentElement.style.setProperty('--line', `color-mix(in srgb, ${th.accent} 25%, #cbd5e1)`);
    this.setBackgroundColor(th.bg);
    this.setBoardPcbColor(th.boardPcb);
    this.boostLighting();
    this.updateFloorMark(this.watermark);
    this.toast(`ปรับเป็นโทน "${th.name}" สดใสแล้ว! ☀️`);
  }

  setBackgroundColor(bgHex) {
    const stage = window.__app?.stage;
    if (stage && stage.scene) {
      stage.scene.background = new THREE.Color(bgHex);
      if (stage.scene.fog) stage.scene.fog.color.set(bgHex);
      stage.dirty = true;
    }
    const canvas = document.getElementById('board-canvas');
    if (canvas) canvas.style.background = bgHex;
    const scenery = document.getElementById('scenery');
    if (scenery) scenery.style.background = bgHex;
    document.body.style.backgroundColor = bgHex;
  }

  setBoardPcbColor(colorInt) {
    const stage = window.__app?.stage;
    if (stage && stage.board) {
      stage.board.traverse(child => {
        if (child.isMesh && child.material) {
          if (child.geometry?.type === 'BoxGeometry' && child.geometry.parameters?.height < 2.5) {
            child.material.color.setHex(colorInt);
            child.material.roughness = 0.45;
            child.material.needsUpdate = true;
          }
        }
      });
      stage.dirty = true;
    }
  }

  boostLighting() {
    const stage = window.__app?.stage;
    if (stage && stage.scene) {
      stage.scene.traverse(child => {
        if (child.isDirectionalLight) {
          child.intensity = 2.4;
          child.color.setHex(0xffffff);
        } else if (child.isHemisphereLight) {
          child.intensity = 1.35;
          child.color.setHex(0xfff7ed);
          child.groundColor.setHex(0xdde3ea);
        }
      });
      stage.dirty = true;
    }
  }

  // 3D Floor Mark with user's name (เปลี่ยน logo x เป็น logo dev < / > และชื่อ Panuwich)
  updateFloorMark(name) {
    const stage = window.__app?.stage;
    if (!stage || !stage.scene) return;

    const devName = name || 'Panuwich';

    // 1. If original stage.mark exists, update its canvas texture
    if (stage.mark && stage.mark.mesh) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const font = '700 84px "Barlow Semi Condensed", "IBM Plex Sans Thai", sans-serif';
      ctx.font = font;
      ctx.letterSpacing = '3px';
      const textWidth = ctx.measureText(devName).width;
      canvas.width = Math.ceil(159 + textWidth + 30);
      canvas.height = 140;

      // Draw DEV icon < / >
      ctx.fillStyle = '#ea580c';
      ctx.save();
      ctx.translate(20, 28);
      ctx.scale(84 / 24, 84 / 24);
      const devPath = new Path2D('M7.5 6L1.5 12l6 6 1.4-1.4L4.3 12l4.6-4.6zM14.5 4h-2.2l-4.8 16h2.2zM16.5 6l-1.4 1.4 4.6 4.6-4.6 4.6 1.4 1.4 6-6z');
      ctx.fill(devPath);
      ctx.restore();

      // Divider line
      ctx.fillRect(130, 24, 3.5, 92);

      // Dev Name text
      ctx.font = font;
      ctx.letterSpacing = '3px';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ea580c';
      ctx.fillText(devName, 159, 74);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;

      stage.mark.aspect = 140 / canvas.width;
      stage.mark.mesh.material.map = tex;
      stage.mark.mesh.material.needsUpdate = true;
      stage.mark.mesh.visible = true;
      stage.mark.shown = performance.now();
      stage.dirty = true;
    }

    // 2. Also ensure our dedicated flat floor watermark mesh exists at y = -3.94
    if (!this.floorMarkMesh) {
      const fCanvas = document.createElement('canvas');
      fCanvas.width = 512;
      fCanvas.height = 128;
      const fTex = new THREE.CanvasTexture(fCanvas);
      fTex.colorSpace = THREE.SRGBColorSpace;

      const mat = new THREE.MeshBasicMaterial({ map: fTex, transparent: true, opacity: 0.85, depthWrite: false });
      const geo = new THREE.PlaneGeometry(64, 16);
      this.floorMarkMesh = new THREE.Mesh(geo, mat);
      this.floorMarkMesh.rotation.x = -Math.PI / 2;
      this.floorMarkMesh.position.set(0, -3.92, 54);
      stage.scene.add(this.floorMarkMesh);
    }

    if (this.floorMarkMesh && this.floorMarkMesh.material.map) {
      const c = this.floorMarkMesh.material.map.image;
      const g = c.getContext('2d');
      g.clearRect(0, 0, 512, 128);
      g.fillStyle = '#ea580c';
      g.font = '800 36px "Space Grotesk", sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(`</> DEV: ${devName.toUpperCase()} · STUDIO`, 256, 64);
      this.floorMarkMesh.material.map.needsUpdate = true;
      stage.dirty = true;
    }
  }

  openAddComponentModal() {
    const title = document.getElementById('addon-modal-title');
    const body = document.getElementById('addon-modal-body');
    title.innerHTML = '➕ เลือกอุปกรณ์ที่ต้องการเพิ่มลงบอร์ด 3D';

    body.innerHTML = `
      <div style="margin-bottom: 14px; font-size: 13.5px; color: #475569;">
        คลิกเลือกอุปกรณ์อิเล็กทรอนิกส์ด้านล่างเพื่อเชื่อมต่อเข้ากับ ESP32 บนบอร์ด 3D:
      </div>
      <div class="parts-grid">
        ${COMPONENT_CATALOG.map(c => `
          <div class="part-item-card" data-comp-id="${c.id}">
            <div class="part-item-icon">${c.icon}</div>
            <b>${c.name}</b>
            <span>${c.desc}</span>
            <div style="margin-top:8px; font-size:11.5px; font-weight:700; color:#ea580c;">
              ต่อที่: <b>GPIO ${c.defaultPin}</b>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    body.querySelectorAll('.part-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const comp = COMPONENT_CATALOG.find(c => c.id === card.dataset.compId);
        if (comp) {
          this.addComponentToScene(comp);
          this.closeModal();
          document.getElementById('addon-drawer').classList.remove('is-collapsed');
        }
      });
    });

    document.getElementById('addon-modal-bg').classList.add('is-open');
  }

  addComponentToScene(comp) {
    const stage = window.__app?.stage;
    if (!stage || !stage.scene) {
      this.toast('รอโหลดบอร์ด 3D สักครู่...');
      return;
    }

    if (!this.wireGroup) {
      this.wireGroup = new THREE.Group();
      this.wireGroup.name = 'user-addon-group';
      stage.scene.add(this.wireGroup);
    }

    const id = `${comp.id}_${Date.now()}`;
    const offsetIndex = this.installed.length;
    // Calculate 3D placement next to breadboard
    const posX = -32 + (offsetIndex % 4) * 22;
    const posZ = 34 + Math.floor(offsetIndex / 4) * 20;

    let meshObj = null;
    let state = { isOn: false, val: 0 };

    switch (comp.id) {
      case 'led': {
        const colors = [0xff2d4a, 0x2dff7a, 0x2d8cff, 0xffc21a, 0xffffff];
        const col = colors[offsetIndex % colors.length];
        meshObj = parts.led(col);
        meshObj.position.set(posX, 0, posZ);
        break;
      }
      case 'rgb': {
        meshObj = parts.rgbLamp();
        meshObj.position.set(posX, 0, posZ);
        meshObj.scale.set(0.7, 0.7, 0.7);
        break;
      }
      case 'button': {
        meshObj = parts.button();
        meshObj.position.set(posX, 0, posZ);
        break;
      }
      case 'servo': {
        meshObj = parts.servo();
        meshObj.position.set(posX, 0, posZ);
        meshObj.scale.set(0.85, 0.85, 0.85);
        state.val = 90;
        meshObj.set(90);
        break;
      }
      case 'hcsr04': {
        meshObj = parts.hcsr04();
        meshObj.position.set(posX, 0, posZ);
        state.val = 30;
        break;
      }
      case 'ldr': {
        meshObj = parts.ldr();
        meshObj.position.set(posX, 0, posZ);
        break;
      }
      case 'oled': {
        meshObj = parts.display();
        meshObj.position.set(posX, 6, posZ);
        meshObj.set('ESP32', 'READY');
        break;
      }
      case 'buzzer': {
        meshObj = new THREE.Group();
        const bz = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 5, 24), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 }));
        bz.position.y = 2.5;
        const bzTop = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        bzTop.position.y = 5.2;
        meshObj.add(bz, bzTop);
        meshObj.position.set(posX, 0, posZ);
        break;
      }
      default: {
        meshObj = parts.led();
        meshObj.position.set(posX, 0, posZ);
      }
    }

    this.wireGroup.add(meshObj);

    // Create 3D jumper wire to ESP32 board
    const wire = this.createJumperWire(meshObj.position, new THREE.Vector3(0, 4, 10));
    this.wireGroup.add(wire);

    const instance = {
      id,
      comp,
      meshObj,
      wire,
      pin: comp.defaultPin,
      state
    };

    this.installed.push(instance);
    stage.dirty = true;
    this.updateInstalledListUI();
    this.toast(`เพิ่ม ${comp.name} สำเร็จ! ✨`);
  }

  createJumperWire(from, to) {
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 12;
    const curve = new THREE.CatmullRomCurve3([from.clone().add({x:0, y:1, z:0}), mid, to]);
    const geo = new THREE.TubeGeometry(curve, 32, 0.35, 6, false);
    const colors = [0xff6b4a, 0x0284c7, 0x10b981, 0xf59e0b, 0x8b5cf6];
    const col = colors[this.installed.length % colors.length];
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 });
    return new THREE.Mesh(geo, mat);
  }

  removeComponent(id) {
    const idx = this.installed.findIndex(i => i.id === id);
    if (idx !== -1) {
      const item = this.installed[idx];
      this.wireGroup.remove(item.meshObj);
      this.wireGroup.remove(item.wire);
      this.installed.splice(idx, 1);
      window.__app?.stage && (window.__app.stage.dirty = true);
      this.updateInstalledListUI();
      this.toast(`ลบ ${item.comp.name} เรียบร้อย 🗑️`);
    }
  }

  updateInstalledListUI() {
    const countEl = document.getElementById('addon-count');
    const drawerCount = document.getElementById('addon-drawer-count');
    const listEl = document.getElementById('addon-installed-list');

    countEl.textContent = this.installed.length;
    drawerCount.textContent = this.installed.length;

    if (this.installed.length === 0) {
      listEl.innerHTML = `
        <p style="text-align:center; color:#64748b; font-size:12.5px; margin:16px 0;">
          ยังไม่มีอุปกรณ์ที่เพิ่มเข้ามา<br/>กดปุ่ม <b>"➕ เพิ่มอุปกรณ์"</b> เพื่อเริ่มเชื่อมต่อ
        </p>
      `;
      return;
    }

    listEl.innerHTML = this.installed.map((item, idx) => `
      <div class="installed-card" data-inst-id="${item.id}">
        <div class="installed-card-top">
          <b>${item.comp.icon} ${item.comp.name}</b>
          <button class="del" title="ลบออก" data-del-id="${item.id}">&times;</button>
        </div>
        <div style="font-size:11.5px; color:#64748b; display:flex; justify-content:space-between; align-items:center;">
          <span>เชื่อมต่อขา: <b>GPIO ${item.pin}</b></span>
          <span style="color:#ea580c; font-weight:700;">สถานะ: ${item.state.isOn ? 'ON' : 'OFF'}</span>
        </div>
        <div class="installed-controls">
          ${item.comp.id === 'led' || item.comp.id === 'rgb' ? `
            <button class="btn-toggle" data-toggle-id="${item.id}">
              ${item.state.isOn ? '🔴 ปิดไฟ' : '🟢 เปิดไฟ (3.3V)'}
            </button>
          ` : ''}
          ${item.comp.id === 'button' ? `
            <button class="btn-press" data-press-id="${item.id}">🔘 กดปุ่มจำลอง</button>
          ` : ''}
          ${item.comp.id === 'servo' ? `
            <span style="font-size:10.5px; font-weight:600;">มุม:</span>
            <input type="range" class="servo-range" data-range-id="${item.id}" min="0" max="180" value="${item.state.val}">
            <b class="servo-val" style="font-size:11.5px; min-width:24px; color:#ea580c;">${item.state.val}°</b>
          ` : ''}
          ${item.comp.id === 'buzzer' ? `
            <button class="btn-beep" data-beep-id="${item.id}">🔊 ส่งเสียง Beep!</button>
          ` : ''}
          ${item.comp.id === 'hcsr04' ? `
            <span style="font-size:10.5px; font-weight:600;">ระยะ:</span>
            <input type="range" class="dist-range" data-range-id="${item.id}" min="2" max="150" value="${item.state.val}">
            <b class="dist-val" style="font-size:11.5px; min-width:32px; color:#ea580c;">${item.state.val}cm</b>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Bind item action buttons
    listEl.querySelectorAll('button.del').forEach(b => {
      b.addEventListener('click', () => this.removeComponent(b.dataset.delId));
    });

    listEl.querySelectorAll('button.btn-toggle').forEach(b => {
      b.addEventListener('click', () => {
        const item = this.installed.find(i => i.id === b.dataset.toggleId);
        if (item) {
          item.state.isOn = !item.state.isOn;
          if (item.meshObj.set) {
            item.meshObj.set(item.state.isOn ? 1 : 0);
          }
          window.__app?.stage && (window.__app.stage.dirty = true);
          this.updateInstalledListUI();
        }
      });
    });

    listEl.querySelectorAll('button.btn-beep').forEach(b => {
      b.addEventListener('click', () => {
        this.playBeepTone(880, 200);
        this.toast('Buzzer Beep! 🔊');
      });
    });

    listEl.querySelectorAll('.servo-range').forEach(r => {
      r.addEventListener('input', e => {
        const item = this.installed.find(i => i.id === r.dataset.rangeId);
        if (item) {
          const deg = Number(e.target.value);
          item.state.val = deg;
          item.meshObj.set && item.meshObj.set(deg);
          const valEl = r.parentNode.querySelector('.servo-val');
          if (valEl) valEl.textContent = `${deg}°`;
          window.__app?.stage && (window.__app.stage.dirty = true);
        }
      });
    });

    listEl.querySelectorAll('.dist-range').forEach(r => {
      r.addEventListener('input', e => {
        const item = this.installed.find(i => i.id === r.dataset.rangeId);
        if (item) {
          const dist = Number(e.target.value);
          item.state.val = dist;
          const valEl = r.parentNode.querySelector('.dist-val');
          if (valEl) valEl.textContent = `${dist}cm`;
        }
      });
    });
  }

  playBeepTone(freq, dur) {
    try {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur / 1000);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + dur / 1000);
    } catch (e) {
      console.warn('Audio not allowed yet', e);
    }
  }

  copyGeneratedSketch() {
    if (this.installed.length === 0) {
      this.toast('ยังไม่มีอุปกรณ์ กรุณาเพิ่มอุปกรณ์ก่อนครับ');
      return;
    }

    let setupLines = [];
    let loopLines = [];
    let defLines = [];

    this.installed.forEach((it, idx) => {
      const pinVar = `PIN_${it.comp.id.toUpperCase()}_${idx + 1}`;
      defLines.push(`const int ${pinVar} = ${it.pin}; // ${it.comp.name}`);

      if (it.comp.id === 'led' || it.comp.id === 'buzzer') {
        setupLines.push(`  pinMode(${pinVar}, OUTPUT);`);
        loopLines.push(`  digitalWrite(${pinVar}, HIGH); delay(500);`);
        loopLines.push(`  digitalWrite(${pinVar}, LOW); delay(500);`);
      } else if (it.comp.id === 'button') {
        setupLines.push(`  pinMode(${pinVar}, INPUT_PULLUP);`);
        loopLines.push(`  int btnState = digitalRead(${pinVar});`);
        loopLines.push(`  if (btnState == LOW) { Serial.println("Button Pressed!"); }`);
      } else if (it.comp.id === 'servo') {
        defLines.unshift(`#include <ESP32Servo.h>\nServo servo_${idx + 1};`);
        setupLines.push(`  servo_${idx + 1}.attach(${pinVar});`);
        loopLines.push(`  servo_${idx + 1}.write(90);`);
      }
    });

    const sketch = `/*
 * Auto-Generated ESP32 Sketch
 * MotionLab ESP32 Studio
 * Developer: ${this.watermark}
 * จำนวนอุปกรณ์ที่เชื่อมต่อ: ${this.installed.length} ชิ้น
 */

${defLines.join('\n')}

void setup() {
  Serial.begin(115200);
  Serial.println("MotionLab Studio - System Ready!");
  Serial.printf("Engineered by: %s\\n", "${this.watermark}");
${setupLines.join('\n')}
}

void loop() {
${loopLines.join('\n')}
}
`;

    navigator.clipboard.writeText(sketch).then(() => {
      this.toast('คัดลอกโค้ด Arduino สำหรับทุกอุปกรณ์แล้ว! 📋');
    });
  }

  hookIntoApp() {
    // Wait until window.__app is fully initialized
    const checkApp = setInterval(() => {
      if (window.__app && window.__app.stage) {
        clearInterval(checkApp);
        // Apply bright sunshine theme by default
        this.applyTheme(this.currentTheme);
        this.updateWatermarks();
        this.updateFloorMark(this.watermark);

        // Keep floor mark in sync
        const originalPlaceMark = window.__app.stage.placeMark?.bind(window.__app.stage);
        if (originalPlaceMark) {
          window.__app.stage.placeMark = () => {
            originalPlaceMark();
            this.updateFloorMark(this.watermark);
          };
        }
      }
    }, 400);
  }
}

// Auto-instantiate when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new StudioAddon());
} else {
  new StudioAddon();
}
