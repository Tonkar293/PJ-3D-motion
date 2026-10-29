// Lessons definition for VoltLab ESP32 Studio
import * as parts from './parts.js';

export const LESSONS = [
  // ==========================================
  // Lesson 1: Blink
  // ==========================================
  {
    id: 'blink',
    num: '01',
    title: 'LED Blink (GPIO Digital Output)',
    sub: 'ควบคุมไฟกระพริบ และคำนวณกฎของโอห์ม',
    icon: `<svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>`,
    pins: ['4', 'GND', '2'],
    schematic: [
      { from: 'ESP32 D4', to: 'Resistor 220Ω', type: 'pin' },
      { from: 'Resistor', to: 'LED Anode (+)', type: '' },
      { from: 'LED Cathode (-)', to: 'GND', type: 'gnd' },
      { from: 'Onboard LED', to: 'ESP32 D2 (ภายในบอร์ด)', type: 'pin' }
    ],
    info: {
      lead: 'การกระพริบไฟ LED เป็นก้าวแรกของการเขียนโปรแกรมฮาร์ดแวร์ ในบทนี้คุณจะได้ทดลองส่งลอจิก HIGH (3.3V) และ LOW (0V) ออกจากขา GPIO4 พร้อมสังเกตพฤติกรรมของวงจรและกระแสไฟฟ้า',
      bullets: [
        'ESP32 ทำงานที่ระดับแรงดันลอจิก <b>3.3V</b> (ห้ามต่อ 5V เข้าขา GPIO ตรงๆ)',
        'ขา GPIO จ่ายกระแสสูงสุดแนะนำไม่เกิน <b>12 mA</b> ต่อขา (Absolute Max 40 mA)',
        'คำนวณกระแสด้วยกฎของโอห์ม: <code>I = (Vcc - Vf) / R</code>',
        'ขา <b>GPIO2</b> ต่ออยู่กับ LED สีฟ้าบนบอร์ด DevKit V1 โดยตรง'
      ],
      quiz: {
        q: 'ทำไมเราต้องต่อตัวต้านทานอนุกรมกับหลอด LED?',
        opts: [
          { t: 'เพื่อจำกัดกระแสไม่ให้เกินพิกัดของ LED และชิป ESP32', right: true },
          { t: 'เพื่อเพิ่มแรงดันให้หลอดสว่างขึ้นเป็นสองเท่า', right: false },
          { t: 'เพื่อแปลงสัญญาณดิจิทัลให้กลายเป็นสัญญาณอนาล็อก', right: false }
        ]
      }
    },
    defaultParams: {
      pin: '4',
      onTime: 1000,
      offTime: 1000,
      color: 'red',
      resistor: 220,
      syncBuiltin: true
    },
    paramSchema: [
      { key: 'pin', label: 'ขา GPIO Output', type: 'select', options: [{ v: '4', l: 'GPIO4 (ต่อ LED นอก)' }, { v: '2', l: 'GPIO2 (LED บนบอร์ด)' }, { v: '18', l: 'GPIO18' }, { v: '23', l: 'GPIO23' }] },
      { key: 'onTime', label: 'เวลาติด (On Time)', type: 'range', min: 50, max: 3000, step: 50, unit: 'ms' },
      { key: 'offTime', label: 'เวลาดับ (Off Time)', type: 'range', min: 50, max: 3000, step: 50, unit: 'ms' },
      { key: 'color', label: 'สีของ LED', type: 'select', options: Object.entries(parts.LED_COLORS).map(([k, v]) => ({ v: k, l: v.name })) },
      { key: 'resistor', label: 'ค่าตัวต้านทาน', type: 'select', options: [{ v: 100, l: '100 Ω (สว่างมาก)' }, { v: 220, l: '220 Ω (มาตรฐาน 3.3V)' }, { v: 330, l: '330 Ω' }, { v: 1000, l: '1 kΩ (ประหยัดไฟ)' }, { v: 4700, l: '4.7 kΩ (หรี่มาก)' }] },
      { key: 'syncBuiltin', label: 'กระพริบ LED บนบอร์ด (GPIO2)', type: 'toggle' }
    ],
    setup(scene, p) {
      const g = scene.newLessonGroup();
      const colInfo = parts.LED_COLORS[p.color] || parts.LED_COLORS.red;
      const ledComp = parts.led(colInfo.hex);
      ledComp.position.set(-18, 0, 22);
      g.add(ledComp);

      const resComp = parts.resistor(Number(p.resistor));
      resComp.position.set(-18, 0, 10);
      g.add(resComp);

      // Wires
      const pPin = scene.pinPos(p.pin);
      const pGnd = scene.pinPos('GND');
      const w1 = scene.addWire(g, pPin, resComp.position.clone().add({ x: 0, y: 1.2, z: -2.5 }), 0x39e6ff, { lift: 6 });
      const w2 = scene.addWire(g, resComp.position.clone().add({ x: 0, y: 1.2, z: 2.5 }), ledComp.position.clone().add({ x: -0.6, y: 1.5, z: 0 }), 0x39e6ff, { lift: 3 });
      const w3 = scene.addWire(g, ledComp.position.clone().add({ x: 0.6, y: 1.5, z: 0 }), pGnd, 0x5a6578, { lift: 5 });

      return {
        update(dt, t, params, app) {
          const T = (Number(params.onTime) + Number(params.offTime)) / 1000;
          const cycle = (t % T);
          const isOn = cycle < (Number(params.onTime) / 1000);
          const col = parts.LED_COLORS[params.color] || parts.LED_COLORS.red;
          const R = Number(params.resistor);
          const Vf = col.vf;
          const I_mA = isOn ? Math.max(0, ((3.3 - Vf) / R) * 1000) : 0;
          const level = isOn ? 1 : 0;

          ledComp.setColor(col.hex);
          ledComp.set(level);
          resComp.set(R);

          scene.setPinLevel(params.pin, level);
          if (params.syncBuiltin) {
            scene.setPinLevel('2', level);
          }
          w1.setActive(level);
          w2.setActive(level);
          w3.setActive(level);

          return {
            readouts: [
              { label: 'สถานะลอจิก', val: isOn ? 'HIGH (1)' : 'LOW (0)', cls: isOn ? 'ok' : '' },
              { label: 'แรงดันขาออก', val: isOn ? '3.30 V' : '0.00 V', cls: isOn ? 'acc' : '' },
              { label: 'กระแสไฟ LED (I)', val: `${I_mA.toFixed(1)} mA`, cls: I_mA > 20 ? 'warn' : 'ok' },
              { label: 'ความถี่กระพริบ', val: `${(1 / T).toFixed(2)} Hz`, cls: '' }
            ],
            plot: {
              V_pin: isOn ? 3.3 : 0,
              I_mA: I_mA
            },
            serial: isOn && (t - dt) % T >= Number(params.onTime) / 1000 ? `[${t.toFixed(2)}s] GPIO${params.pin} -> HIGH (I = ${I_mA.toFixed(1)} mA)` : (!isOn && cycle < dt ? `[${t.toFixed(2)}s] GPIO${params.pin} -> LOW` : null)
          };
        }
      };
    },
    plotChannels: [
      { k: 'V_pin', label: 'แรงดันขาออก (V)', min: 0, max: 3.5, color: '#39e6ff', step: true, fmt: v => v.toFixed(1) + ' V' },
      { k: 'I_mA', label: 'กระแสไหล (mA)', min: 0, max: 25, color: '#ffc21a', step: true, fmt: v => v.toFixed(1) + ' mA' }
    ],
    getCode(p) {
      return `/*
 * VoltLab Studio: Lesson 01 - LED Blink
 * ESP32 DevKit V1 (30-pin)
 */

const int LED_PIN = ${p.pin};
const int ON_TIME = ${p.onTime};   // ms
const int OFF_TIME = ${p.offTime}; // ms

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("System Ready: LED Blink Initialized");
}

void loop() {
  // เปิดไฟ LED
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED State: ON");
  delay(ON_TIME);

  // ปิดไฟ LED
  digitalWrite(LED_PIN, LOW);
  Serial.println("LED State: OFF");
  delay(OFF_TIME);
}
`;
    }
  },

  // ==========================================
  // Lesson 2: Button & Debounce
  // ==========================================
  {
    id: 'button',
    num: '02',
    title: 'Button & Debounce (Input / Interrupt)',
    sub: 'อ่านค่าปุ่มกด จัดการการสั่นสะเทือน และใช้ Interrupt',
    icon: `<svg viewBox="0 0 24 24"><rect x="6" y="9" width="12" height="12" rx="2"/><path d="M10 5h4v4h-4zM9 21v2M15 21v2"/></svg>`,
    pins: ['4', 'GND', '2'],
    schematic: [
      { from: 'ESP32 D4', to: 'Button Pin 1', type: 'pin' },
      { from: 'Button Pin 2', to: 'GND', type: 'gnd' },
      { from: 'Onboard LED', to: 'ESP32 D2 (แสดงผลสถานะ)', type: 'pin' }
    ],
    info: {
      lead: 'ปุ่มกดแบบกลไกจะมีการเด้งของหน้าสัมผัส (Bouncing) ก่อให้เกิดสัญญาณรบกวนความถี่สูง ซึ่ง ESP32 เร็วพอที่จะนับการกดผิดพลาดได้นับสิบครั้งในเสี้ยววินาที',
      bullets: [
        'ใช้ <code>INPUT_PULLUP</code> เพื่อใช้ตัวต้านทานดึงไฟสูงภายในชิป (ไม่ต้องต่อ R ภายนอก)',
        'เมื่อกดปุ่ม ขาจะถูกดึงลง GND ลอจิกจะเปลี่ยนจาก <b>HIGH (1)</b> เป็น <b>LOW (0)</b>',
        'การแก้ไข Bouncing ทำได้ทั้งทางฮาร์ดแวร์ (C-Filter) และซอฟต์แวร์ (Debounce logic)',
        'การใช้ <code>attachInterrupt</code> เหมาะกับงานที่ต้องการตอบสนองทันทีโดยไม่ต้องรอ loop()'
      ],
      quiz: {
        q: 'เมื่อกำหนด pinMode(4, INPUT_PULLUP) ขณะที่ยังไม่กดปุ่ม ขา 4 จะอ่านค่าได้อะไร?',
        opts: [
          { t: 'HIGH (1) เพราะตัวต้านทานภายในต่อดึงไฟ 3.3V ไว้', right: true },
          { t: 'LOW (0) เพราะยังไม่มีการกดสวิตช์', right: false },
          { t: 'ค่าลอยตัว (Floating) ไม่สามารถระบุแน่นอนได้', right: false }
        ]
      }
    },
    defaultParams: {
      mode: 'toggle',
      useInterrupt: true,
      debounceMs: 50,
      noiseBounce: true
    },
    paramSchema: [
      { key: 'mode', label: 'โหมดการทำงาน', type: 'select', options: [{ v: 'toggle', l: 'Toggle (กดสลับเปิด/ปิด)' }, { v: 'momentary', l: 'Momentary (กดติด ปล่อยดับ)' }] },
      { key: 'useInterrupt', label: 'ใช้ฮาร์ดแวร์ Interrupt', type: 'toggle' },
      { key: 'debounceMs', label: 'Debounce Time', type: 'range', min: 0, max: 200, step: 5, unit: 'ms' },
      { key: 'noiseBounce', label: 'จำลองการสั่นหน้าสัมผัส (Bounce Noise)', type: 'toggle' }
    ],
    setup(scene, p) {
      const g = scene.newLessonGroup();
      const btn = parts.button();
      btn.position.set(-18, 0, 20);
      g.add(btn);

      const p4 = scene.pinPos('4');
      const pGnd = scene.pinPos('GND');
      const w1 = scene.addWire(g, p4, btn.position.clone().add({ x: -2.6, y: 0.5, z: 0 }), 0x39e6ff, { lift: 6 });
      const w2 = scene.addWire(g, btn.position.clone().add({ x: 2.6, y: 0.5, z: 0 }), pGnd, 0x5a6578, { lift: 6 });

      let isPhysicalDown = false;
      let lastPressTime = -1;
      let lastDebounceTime = 0;
      let outputState = false;
      let pressCount = 0;
      let rawHistory = 1;

      // Clickable tactile switch in 3D
      btn.cap.userData.onDown = () => { isPhysicalDown = true; };
      btn.cap.userData.onUp = () => { isPhysicalDown = false; };
      scene.addClickable(btn.cap);

      return {
        isPressed: () => isPhysicalDown,
        setPressed: v => { isPhysicalDown = v; },
        update(dt, t, params) {
          btn.set(isPhysicalDown);

          let rawPin = isPhysicalDown ? 0 : 1;
          // Contact bounce simulation
          if (params.noiseBounce && isPhysicalDown && (t - lastPressTime < 0.015)) {
            rawPin = Math.random() > 0.45 ? 1 : 0;
          }

          if (isPhysicalDown && lastPressTime < 0) {
            lastPressTime = t;
          } else if (!isPhysicalDown) {
            lastPressTime = -1;
          }

          // Debounce filter logic
          let debouncedPin = rawPin;
          if (t - lastDebounceTime > Number(params.debounceMs) / 1000) {
            if (rawPin !== rawHistory) {
              lastDebounceTime = t;
              rawHistory = rawPin;
              if (rawPin === 0) { // Pressed (Active Low)
                pressCount++;
                if (params.mode === 'toggle') {
                  outputState = !outputState;
                }
              }
            }
          }

          if (params.mode === 'momentary') {
            outputState = (rawHistory === 0);
          }

          const ledLevel = outputState ? 1 : 0;
          scene.setPinLevel('2', ledLevel);
          scene.setPinLevel('4', rawPin === 0 ? 0.8 : 0);
          w1.setActive(rawPin === 0 ? 1 : 0);
          w2.setActive(rawPin === 0 ? 1 : 0);

          return {
            readouts: [
              { label: 'ขา GPIO4 (ดิบ)', val: rawPin === 0 ? 'LOW (0)' : 'HIGH (1)', cls: rawPin === 0 ? 'warn' : '' },
              { label: 'สถานะหลังกรอง', val: rawHistory === 0 ? 'กดอยู่ (LOW)' : 'ปล่อย (HIGH)', cls: rawHistory === 0 ? 'ok' : '' },
              { label: 'LED (GPIO2)', val: outputState ? 'ON' : 'OFF', cls: outputState ? 'ok' : '' },
              { label: 'จำนวนครั้งที่นับได้', val: `${pressCount} ครั้ง`, cls: 'acc' }
            ],
            plot: {
              Raw_Switch: rawPin === 1 ? 3.3 : 0,
              Debounced: rawHistory === 1 ? 3.3 : 0,
              LED_State: outputState ? 3.3 : 0
            }
          };
        }
      };
    },
    plotChannels: [
      { k: 'Raw_Switch', label: 'ปุ่มกดดิบ (Raw Input)', min: 0, max: 3.5, color: '#ff5470', step: true, fmt: v => (v > 1 ? 'HIGH' : 'LOW') },
      { k: 'Debounced', label: 'สัญญาณกรอง (Debounced)', min: 0, max: 3.5, color: '#ffc24b', step: true, fmt: v => (v > 1 ? 'HIGH' : 'LOW') },
      { k: 'LED_State', label: 'สถานะ LED (Output)', min: 0, max: 3.5, color: '#3dffa8', step: true, fmt: v => (v > 1 ? 'ON' : 'OFF') }
    ],
    customUI: (container, lessonInstance) => {
      const row = document.createElement('div');
      row.className = 'act-row';
      const b = document.createElement('button');
      b.className = 'act';
      b.innerHTML = '🔘 กดปุ่มค้างตรงนี้ (หรือคลิกที่ปุ่มใน 3D)';
      b.addEventListener('pointerdown', () => { lessonInstance.setPressed(true); b.classList.add('down'); });
      window.addEventListener('pointerup', () => { lessonInstance.setPressed(false); b.classList.remove('down'); });
      row.appendChild(b);
      container.appendChild(row);
    },
    getCode(p) {
      return `/*
 * VoltLab Studio: Lesson 02 - Button & Debounce
 * Input mode: INPUT_PULLUP
 */

const int BUTTON_PIN = 4;
const int LED_PIN = 2;
const int DEBOUNCE_DELAY = ${p.debounceMs}; // ms

volatile bool ledState = false;
${p.useInterrupt ? `
// ฟังก์ชัน ISR สำหรับ Interrupt
void IRAM_ATTR handleButton() {
  static unsigned long lastInterruptTime = 0;
  unsigned long interruptTime = millis();
  if (interruptTime - lastInterruptTime > DEBOUNCE_DELAY) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
  }
  lastInterruptTime = interruptTime;
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), handleButton, FALLING);
  Serial.println("Interrupt Attached on GPIO4");
}

void loop() {
  // ซีพียูว่างสำหรับทำงานอื่นๆ
}
` : `
int lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  int reading = digitalRead(BUTTON_PIN);
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    if (reading == LOW && lastButtonState == HIGH) {
      ${p.mode === 'toggle' ? 'ledState = !ledState;' : 'ledState = true;'}
      digitalWrite(LED_PIN, ledState);
      Serial.println("Button Pressed!");
    } ${p.mode === 'momentary' ? 'else if (reading == HIGH) { ledState = false; digitalWrite(LED_PIN, LOW); }' : ''}
  }
  lastButtonState = reading;
}
`}
`;
    }
  },

  // ==========================================
  // Lesson 3: PWM Dimming & Fading
  // ==========================================
  {
    id: 'pwm',
    num: '03',
    title: 'PWM LED Fading (LEDC Peripheral)',
    sub: 'ควบคุมความสว่างหลอดไฟด้วยฮาร์ดแวร์ LEDC ความละเอียดสูง',
    icon: `<svg viewBox="0 0 24 24"><path d="M2 18h4V6h4v12h4V6h4v12h4"/></svg>`,
    pins: ['4', 'GND'],
    schematic: [
      { from: 'ESP32 D4 (PWM)', to: 'Resistor 220Ω', type: 'pin' },
      { from: 'Resistor', to: 'LED Anode (+)', type: '' },
      { from: 'LED Cathode (-)', to: 'GND', type: 'gnd' }
    ],
    info: {
      lead: 'ESP32 ไม่มีคำสั่ง analogWrite แบบดั้งเดิม แต่มีโมดูล LEDC (LED Controller) ฮาร์ดแวร์เฉพาะ 16 ช่อง สามารถสร้างคลื่นความถี่สูงตั้งแต่ 10Hz ถึง 40MHz ปรับความสว่างได้อย่างราบรื่น',
      bullets: [
        'ESP32 Arduino Core v3 ใช้คำสั่งใหม่: <code>ledcAttach(pin, freq, resolution)</code>',
        'Resolution 8-bit ปรับได้ 256 ระดับ (0–255), 10-bit ได้ 1,024 ระดับ',
        'ค่าเฉลี่ยแรงดันขาออก: <code>V_avg = 3.3V × (Duty / MaxCount)</code>',
        'สายตามนุษย์ตอบสนองความสว่างแบบ Non-linear (Exponential) จึงนิยมทำ Gamma Correction'
      ],
      quiz: {
        q: 'หากตั้งค่าความละเอียดเป็น 10-bit ค่า Duty Cycle สูงสุดคือเท่าใด?',
        opts: [
          { t: '1,023 (เพราะ 2^10 - 1 = 1023)', right: true },
          { t: '255 (เท่ากับ Arduino Uno)', right: false },
          { t: '4,095 (เท่ากับ 12-bit)', right: false }
        ]
      }
    },
    defaultParams: {
      mode: 'breathe',
      freq: 5000,
      resolution: 8,
      manualDuty: 128,
      speed: 1.0,
      gamma: true
    },
    paramSchema: [
      { key: 'mode', label: 'โหมดจำลอง', type: 'select', options: [{ v: 'breathe', l: 'หายใจอัตโนมัติ (Breathe Sine)' }, { v: 'manual', l: 'ปรับความสว่างเอง (Manual)' }] },
      { key: 'freq', label: 'ความถี่ PWM (Frequency)', type: 'select', options: [{ v: 1000, l: '1 kHz (ความถี่มาตรฐาน)' }, { v: 5000, l: '5 kHz (ไม่มีเสียงจี่)' }, { v: 20000, l: '20 kHz (อัลตร้าโซนิก)' }] },
      { key: 'resolution', label: 'Resolution (บิต)', type: 'select', options: [{ v: 8, l: '8-bit (0–255)' }, { v: 10, l: '10-bit (0–1023)' }, { v: 12, l: '12-bit (0–4095)' }] },
      { key: 'manualDuty', label: 'Duty Cycle ปรับเอง', type: 'range', min: 0, max: 255, step: 1, unit: '' },
      { key: 'speed', label: 'ความเร็วการหายใจ', type: 'range', min: 0.2, max: 3.0, step: 0.1, unit: 'Hz' },
      { key: 'gamma', label: 'CIE 1931 Gamma Correction', type: 'toggle' }
    ],
    setup(scene, p) {
      const g = scene.newLessonGroup();
      const ledComp = parts.led(0x39e6ff);
      ledComp.position.set(-18, 0, 22);
      g.add(ledComp);

      const resComp = parts.resistor(220);
      resComp.position.set(-18, 0, 10);
      g.add(resComp);

      const p4 = scene.pinPos('4');
      const pGnd = scene.pinPos('GND');
      const w1 = scene.addWire(g, p4, resComp.position.clone().add({ x: 0, y: 1.2, z: -2.5 }), 0x39e6ff, { lift: 6 });
      const w2 = scene.addWire(g, resComp.position.clone().add({ x: 0, y: 1.2, z: 2.5 }), ledComp.position.clone().add({ x: -0.6, y: 1.5, z: 0 }), 0x39e6ff, { lift: 3 });
      const w3 = scene.addWire(g, ledComp.position.clone().add({ x: 0.6, y: 1.5, z: 0 }), pGnd, 0x5a6578, { lift: 5 });

      return {
        update(dt, t, params) {
          const resBits = Number(params.resolution);
          const maxCount = (1 << resBits) - 1;

          let normDuty = 0;
          if (params.mode === 'breathe') {
            normDuty = (Math.sin(t * Math.PI * 2 * Number(params.speed)) + 1) / 2;
          } else {
            normDuty = Math.min(1, Math.max(0, Number(params.manualDuty) / 255));
          }

          const perceived = params.gamma ? Math.pow(normDuty, 2.2) : normDuty;
          const rawDuty = Math.round(normDuty * maxCount);
          const vAvg = normDuty * 3.3;

          ledComp.set(perceived);
          scene.setPinLevel('4', perceived);
          w1.setActive(normDuty);
          w2.setActive(normDuty);
          w3.setActive(normDuty);

          // Simulated high-frequency PWM carrier
          const carrier = (Math.sin(t * 120) > (1 - normDuty * 2)) ? 3.3 : 0;

          return {
            readouts: [
              { label: 'Duty Cycle', val: `${(normDuty * 100).toFixed(1)} %`, cls: 'acc' },
              { label: 'Duty ค่าดิจิทัล', val: `${rawDuty} / ${maxCount}`, cls: '' },
              { label: 'แรงดันเฉลี่ย (Vavg)', val: `${vAvg.toFixed(2)} V`, cls: 'ok' },
              { label: 'ความสว่างที่สายตารับรู้', val: `${(perceived * 100).toFixed(0)} %`, cls: '' }
            ],
            plot: {
              V_avg: vAvg,
              PWM_Wave: normDuty > 0.99 ? 3.3 : (normDuty < 0.01 ? 0 : carrier)
            }
          };
        }
      };
    },
    plotChannels: [
      { k: 'V_avg', label: 'แรงดันเฉลี่ย V_avg (V)', min: 0, max: 3.5, color: '#39e6ff', step: false, fmt: v => v.toFixed(2) + ' V' },
      { k: 'PWM_Wave', label: 'สัญญาณพัลส์ PWM (V)', min: 0, max: 3.5, color: '#a77bff', step: true, fmt: v => v.toFixed(1) + ' V' }
    ],
    getCode(p) {
      const maxCount = (1 << Number(p.resolution)) - 1;
      return `/*
 * VoltLab Studio: Lesson 03 - LEDC PWM Fading
 * ESP32 Core v3 LED Controller API
 */

const int LED_PIN = 4;
const int PWM_FREQ = ${p.freq};       // ${p.freq} Hz
const int PWM_RES = ${p.resolution};         // ${p.resolution}-bit (0–${maxCount})

void setup() {
  Serial.begin(115200);
  // ตั้งค่าและผูกขาเข้ากับ LEDC channel อัตโนมัติ
  ledcAttach(LED_PIN, PWM_FREQ, PWM_RES);
  Serial.println("LEDC Attached on GPIO4");
}

void loop() {
  ${p.mode === 'breathe' ? `
  // หรี่ไฟสว่างขึ้น
  for (int duty = 0; duty <= ${maxCount}; duty += 5) {
    ledcWrite(LED_PIN, duty);
    delay(10);
  }
  // หรี่ไฟดับลง
  for (int duty = ${maxCount}; duty >= 0; duty -= 5) {
    ledcWrite(LED_PIN, duty);
    delay(10);
  }
` : `
  int targetDuty = ${Math.round((Number(p.manualDuty) / 255) * maxCount)};
  ledcWrite(LED_PIN, targetDuty);
  Serial.printf("Current Duty: %d\\n", targetDuty);
  delay(100);
`}
}
`;
    }
  },

  // ==========================================
  // Lesson 4: RGB Color Mixer
  // ==========================================
  {
    id: 'rgb',
    num: '04',
    title: 'RGB LED Color Mixer (3x PWM)',
    sub: 'ผสมเฉดสีแสงกว่า 16 ล้านสีด้วย LEDC 3 ช่องสัญญาณ',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/><circle cx="12" cy="8" r="2"/><circle cx="8" cy="14" r="2"/><circle cx="16" cy="14" r="2"/></svg>`,
    pins: ['25', '26', '27', 'GND'],
    schematic: [
      { from: 'ESP32 D25 (Red)', to: 'RGB Lamp (Red Anode)', type: 'pin' },
      { from: 'ESP32 D26 (Green)', to: 'RGB Lamp (Green Anode)', type: 'pin' },
      { from: 'ESP32 D27 (Blue)', to: 'RGB Lamp (Blue Anode)', type: 'pin' },
      { from: 'RGB Cathode', to: 'GND', type: 'gnd' }
    ],
    info: {
      lead: 'หลอดไฟ RGB ประกอบด้วยชิป LED 3 สี (แดง, เขียว, น้ำเงิน) บรรจุอยู่ในตัวถังเดียวกัน การผสมแสงสีใช้วิธีควบคุมอัตราส่วน Duty Cycle ของแต่ละสี',
      bullets: [
        'ใช้ GPIO25 (DAC1/LEDC), GPIO26 (DAC2/LEDC) และ GPIO27',
        'แบบ Common Cathode (ต่อขาลบร่วมเข้า GND) จ่ายไฟ HIGH หลอดจะติด',
        'การคำนวณโค้ดสี HEX เช่น <code>#FF6B00</code> = แดง 255, เขียว 107, น้ำเงิน 0',
        'โหมด Rainbow ใช้โมเดลสีแบบ HSV (Hue, Saturation, Value) แปลงเป็น RGB'
      ],
      quiz: {
        q: 'หากต้องการให้หลอด RGB เปล่งแสงเป็น "สีเหลือง" จะต้องเปิดช่องสีใดบ้าง?',
        opts: [
          { t: 'สีแดง + สีเขียว (R + G)', right: true },
          { t: 'สีแดง + สีน้ำเงิน (R + B)', right: false },
          { t: 'สีเขียว + สีน้ำเงิน (G + B)', right: false }
        ]
      }
    },
    defaultParams: {
      mode: 'picker',
      hexColor: '#39e6ff',
      rainbowSpeed: 0.5,
      rVal: 57,
      gVal: 230,
      bVal: 255
    },
    paramSchema: [
      { key: 'mode', label: 'โหมดแสง', type: 'select', options: [{ v: 'picker', l: 'เลือกสีเอง (Color Picker)' }, { v: 'rainbow', l: 'หมุนวงล้อสีรุ้ง (Rainbow Cycle)' }] },
      { key: 'hexColor', label: 'เฉดสี (Color)', type: 'color' },
      { key: 'rainbowSpeed', label: 'ความเร็วหมุนสีรุ้ง', type: 'range', min: 0.1, max: 2.0, step: 0.1, unit: 'Hz' }
    ],
    setup(scene, p) {
      const g = scene.newLessonGroup();
      const lamp = parts.rgbLamp();
      lamp.position.set(-18, 0, 18);
      g.add(lamp);

      const p25 = scene.pinPos('25');
      const p26 = scene.pinPos('26');
      const p27 = scene.pinPos('27');
      const pGnd = scene.pinPos('GND');

      const wR = scene.addWire(g, p25, lamp.position.clone().add({ x: -2, y: 1, z: 0 }), 0xff2d4a, { lift: 7 });
      const wG = scene.addWire(g, p26, lamp.position.clone().add({ x: 0, y: 1, z: -2 }), 0x2dff7a, { lift: 6 });
      const wB = scene.addWire(g, p27, lamp.position.clone().add({ x: 2, y: 1, z: 0 }), 0x2d8cff, { lift: 5 });
      const wGnd = scene.addWire(g, lamp.position.clone().add({ x: 0, y: 1, z: 2 }), pGnd, 0x5a6578, { lift: 7 });

      // HSV to RGB helper
      function hsv2rgb(h, s, v) {
        let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        return [f(5), f(3), f(1)];
      }

      return {
        update(dt, t, params) {
          let r = 0, gg = 0, b = 0;
          if (params.mode === 'rainbow') {
            const hue = (t * Number(params.rainbowSpeed) * 360) % 360;
            [r, gg, b] = hsv2rgb(hue, 1, 1);
          } else {
            const hex = (params.hexColor || '#39e6ff').replace('#', '');
            r = parseInt(hex.slice(0, 2), 16) / 255;
            gg = parseInt(hex.slice(2, 4), 16) / 255;
            b = parseInt(hex.slice(4, 6), 16) / 255;
          }

          lamp.set(r, gg, b);
          scene.setPinLevel('25', r);
          scene.setPinLevel('26', gg);
          scene.setPinLevel('27', b);

          wR.setActive(r);
          wG.setActive(gg);
          wB.setActive(b);
          wGnd.setActive(Math.max(r, gg, b));

          const r8 = Math.round(r * 255);
          const g8 = Math.round(gg * 255);
          const b8 = Math.round(b * 255);
          const currentHex = `#${((1 << 24) + (r8 << 16) + (g8 << 8) + b8).toString(16).slice(1).toUpperCase()}`;

          return {
            readouts: [
              { label: 'รหัสสีปัจจุบัน (HEX)', val: currentHex, cls: 'acc' },
              { label: 'Duty แดง (R)', val: `${(r * 100).toFixed(0)} % (${r8})`, cls: '' },
              { label: 'Duty เขียว (G)', val: `${(gg * 100).toFixed(0)} % (${g8})`, cls: '' },
              { label: 'Duty น้ำเงิน (B)', val: `${(b * 100).toFixed(0)} % (${b8})`, cls: '' }
            ],
            plot: {
              Red_PWM: r * 100,
              Green_PWM: gg * 100,
              Blue_PWM: b * 100
            }
          };
        }
      };
    },
    plotChannels: [
      { k: 'Red_PWM', label: 'Red Channel (%)', min: 0, max: 100, color: '#ff2d4a', step: false, fmt: v => v.toFixed(0) + '%' },
      { k: 'Green_PWM', label: 'Green Channel (%)', min: 0, max: 100, color: '#2dff7a', step: false, fmt: v => v.toFixed(0) + '%' },
      { k: 'Blue_PWM', label: 'Blue Channel (%)', min: 0, max: 100, color: '#2d8cff', step: false, fmt: v => v.toFixed(0) + '%' }
    ],
    getCode(p) {
      return `/*
 * VoltLab Studio: Lesson 04 - RGB LED Color Mixer
 * ควบคุมแม่สี 3 ช่องสัญญาณด้วย ESP32 LEDC
 */

const int PIN_RED = 25;
const int PIN_GREEN = 26;
const int PIN_BLUE = 27;

const int PWM_FREQ = 5000;
const int PWM_RES = 8; // 8-bit (0–255)

void setup() {
  Serial.begin(115200);
  ledcAttach(PIN_RED, PWM_FREQ, PWM_RES);
  ledcAttach(PIN_GREEN, PWM_FREQ, PWM_RES);
  ledcAttach(PIN_BLUE, PWM_FREQ, PWM_RES);
  Serial.println("RGB Channels Initialized");
}

void setColor(uint8_t r, uint8_t g, uint8_t b) {
  ledcWrite(PIN_RED, r);
  ledcWrite(PIN_GREEN, g);
  ledcWrite(PIN_BLUE, b);
}

void loop() {
  ${p.mode === 'picker' ? `
  // ตั้งค่าสีตามที่เลือกใน VoltLab
  setColor(${p.rVal || 57}, ${p.gVal || 230}, ${p.bVal || 255});
  delay(100);
` : `
  // ตัวอย่างไล่สีแดง -> เขียว -> น้ำเงิน
  setColor(255, 0, 0); delay(1000);
  setColor(0, 255, 0); delay(1000);
  setColor(0, 0, 255); delay(1000);
`}
}
`;
    }
  },

  // ==========================================
  // Lesson 5: ADC & LDR Light Sensor
  // ==========================================
  {
    id: 'adc',
    num: '05',
    title: 'LDR & ADC 12-bit (Analog Input)',
    sub: 'อ่านค่าแรงดันอนาล็อก 0–4095 ด้วยวงจรแบ่งแรงดัน (Voltage Divider)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
    pins: ['34', '3V3', 'GND'],
    schematic: [
      { from: 'ESP32 3V3', to: 'LDR Pin 1', type: 'pwr' },
      { from: 'LDR Pin 2', to: 'ESP32 D34 (ADC1_CH6)', type: 'pin' },
      { from: 'ESP32 D34', to: 'Resistor 10kΩ', type: 'pin' },
      { from: 'Resistor 10kΩ', to: 'GND', type: 'gnd' }
    ],
    info: {
      lead: 'ESP32 มีตัวแปลงสัญญาณอนาล็อกเป็นดิจิทัล (ADC) ความละเอียดสูงถึง 12-bit (0–4095) ซึ่งละเอียดกว่า Arduino Uno (10-bit: 0–1023) ถึง 4 เท่า',
      bullets: [
        'ขา <b>GPIO34, 35, 36, 39</b> เป็นขา Input-Only ที่ต่อตรงกับ ADC1 ภายในชิป',
        'ข้อควรระวัง: <b>ADC2</b> จะใช้งานไม่ได้เมื่อเปิด Wi-Fi ดังนั้นควรใช้ขาใน <b>ADC1</b> เสมอ',
        'วงจรแบ่งแรงดัน: <code>V_out = 3.3V × (R_fixed / (R_ldr + R_fixed))</code>',
        'LDR ยิ่งโดนแสงมาก ค่าความต้านทาน R_ldr ยิ่งลดลง ส่งผลให้แรงดัน V_out สูงขึ้น'
      ],
      quiz: {
        q: 'หากแรงดันที่อ่านได้คือ 1.65V (ครึ่งหนึ่งของ 3.3V) ค่า ADC 12-bit จะได้ประมาณเท่าใด?',
        opts: [
          { t: 'ประมาณ 2,047 (ครึ่งหนึ่งของ 4095)', right: true },
          { t: 'ประมาณ 511 (ครึ่งหนึ่งของ 1023)', right: false },
          { t: 'ประมาณ 127', right: false }
        ]
      }
    },
    defaultParams: {
      lux: 500,
      rFixed: 10000,
      attenuation: '11dB',
      noiseSim: true
    },
    paramSchema: [
      { key: 'lux', label: 'ความเข้มแสง (Lux)', type: 'range', min: 5, max: 2000, step: 25, unit: 'lux' },
      { key: 'rFixed', label: 'ตัวต้านทาน Pull-down', type: 'select', options: [{ v: 4700, l: '4.7 kΩ' }, { v: 10000, l: '10 kΩ (แนะนำ)' }, { v: 47000, l: '47 kΩ' }] },
      { key: 'attenuation', label: 'ADC Attenuation (ช่วงแรงดัน)', type: 'select', options: [{ v: '11dB', l: '11 dB (0 – 3.3V)' }, { v: '6dB', l: '6 dB (0 – 2.2V)' }, { v: '2.5dB', l: '2.5 dB (0 – 1.5V)' }] },
      { key: 'noiseSim', label: 'จำลอง Thermal Noise ของ ADC', type: 'toggle' }
    ],
    setup(scene, p) {
      const g = scene.newLessonGroup();
      const ldrComp = parts.ldr();
      ldrComp.position.set(-18, 0, 18);
      g.add(ldrComp);

      const lampComp = parts.lamp();
      lampComp.position.set(-18, 28, 18);
      g.add(lampComp);

      const resComp = parts.resistor(Number(p.rFixed));
      resComp.position.set(-18, 0, 7);
      g.add(resComp);

      const p34 = scene.pinPos('34');
      const p3v3 = scene.pinPos('3V3');
      const pGnd = scene.pinPos('GND');

      const wPwr = scene.addWire(g, p3v3, ldrComp.position.clone().add({ x: -0.8, y: 1.5, z: 0 }), 0xff2d4a, { lift: 6 });
      const wMid = scene.addWire(g, ldrComp.position.clone().add({ x: 0.8, y: 1.5, z: 0 }), resComp.position.clone().add({ x: 0, y: 1.2, z: 2.5 }), 0x39e6ff, { lift: 4 });
      const wAdc = scene.addWire(g, resComp.position.clone().add({ x: 0, y: 1.2, z: 2.5 }), p34, 0x39e6ff, { lift: 6 });
      const wGnd = scene.addWire(g, resComp.position.clone().add({ x: 0, y: 1.2, z: -2.5 }), pGnd, 0x5a6578, { lift: 6 });

      return {
        update(dt, t, params) {
          const lux = Number(params.lux);
          const normLux = Math.min(1, Math.max(0, lux / 2000));
          lampComp.set(normLux);

          // LDR resistance curve: R = 500 / (lux^0.7) kOhm
          const rLdr = Math.max(200, (500000 / Math.pow(Math.max(1, lux), 0.75)));
          const rFixed = Number(params.rFixed);
          let vOut = 3.3 * (rFixed / (rLdr + rFixed));

          // Thermal noise
          if (params.noiseSim) {
            vOut += (Math.random() - 0.5) * 0.035;
            vOut = Math.min(3.3, Math.max(0, vOut));
          }

          const rawAdc = Math.round((vOut / 3.3) * 4095);

          scene.setPinLevel('34', vOut / 3.3);
          wPwr.setActive(1);
          wMid.setActive(vOut / 3.3);
          wAdc.setActive(vOut / 3.3);
          wGnd.setActive(vOut / 3.3);

          let lightEnv = 'ปกติ (Indoor)';
          if (lux < 50) lightEnv = 'มืดสลัว (Night/Dim)';
          else if (lux > 1200) lightEnv = 'สว่างจ้า (Outdoor/Sun)';

          return {
            readouts: [
              { label: 'ค่า ADC ดิบ (12-bit)', val: `${rawAdc} / 4095`, cls: 'acc' },
              { label: 'แรงดัน V_out', val: `${vOut.toFixed(2)} V`, cls: 'ok' },
              { label: 'ความต้านทาน LDR', val: rLdr >= 1000 ? `${(rLdr / 1000).toFixed(1)} kΩ` : `${rLdr.toFixed(0)} Ω`, cls: '' },
              { label: 'สภาพแวดล้อมแสง', val: lightEnv, cls: '' }
            ],
            plot: {
              V_adc: vOut,
              Lux: lux / 20
            }
          };
        }
      };
    },
    plotChannels: [
      { k: 'V_adc', label: 'แรงดันอินพุต ADC (V)', min: 0, max: 3.5, color: '#39e6ff', step: false, fmt: v => v.toFixed(2) + ' V' },
      { k: 'Lux', label: 'ความเข้มแสง (x20 Lux)', min: 0, max: 100, color: '#ffc21a', step: false, fmt: v => (v * 20).toFixed(0) + ' lx' }
    ],
    getCode(p) {
      return `/*
 * VoltLab Studio: Lesson 05 - LDR & ADC 12-bit
 * ESP32 ADC1 (GPIO34 - Input Only)
 */

const int LDR_PIN = 34; // ADC1_CH6

void setup() {
  Serial.begin(115200);
  // ตั้งค่า ADC Attenuation เป็น 11dB เพื่ออ่านแรงดันเต็มสเกล 0–3.3V
  analogSetPinAttenuation(LDR_PIN, ADC_11db);
  analogReadResolution(12); // 12-bit (0–4095)
  Serial.println("ADC Setup Completed on GPIO34");
}

void loop() {
  int rawValue = analogRead(LDR_PIN);
  float voltage = (rawValue / 4095.0) * 3.3;

  Serial.printf("Raw ADC: %4d | Voltage: %.2f V\\n", rawValue, voltage);
  delay(200);
}
`;
    }
  },

  // ==========================================
  // Lesson 6: Ultrasonic HC-SR04 & OLED
  // ==========================================
  {
    id: 'ultrasonic',
    num: '06',
    title: 'HC-SR04 Ultrasonic & OLED Display',
    sub: 'วัดระยะทางด้วยคลื่นเสียงสะท้อน และแสดงผลบนจอ OLED SSD1306',
    icon: `<svg viewBox="0 0 24 24"><path d="M3 12h1m4-6a9 9 0 0 1 0 12m4-10a5 5 0 0 1 0 8m4-6a1 1 0 0 1 0 4"/><rect x="18" y="6" width="3" height="12" rx="1"/></svg>`,
    pins: ['5', '18', '21', '22', '3V3', 'GND'],
    schematic: [
      { from: 'ESP32 D5 (Trig)', to: 'HC-SR04P TRIG', type: 'pin' },
      { from: 'ESP32 D18 (Echo)', to: 'HC-SR04P ECHO', type: 'pin' },
      { from: 'ESP32 D21 (SDA)', to: 'OLED SDA', type: 'pin' },
      { from: 'ESP32 D22 (SCL)', to: 'OLED SCL', type: 'pin' },
      { from: 'ESP32 3V3 / GND', to: 'VCC & GND ร่วม', type: 'pwr' }
    ],
    info: {
      lead: 'เซนเซอร์อัลตร้าโซนิกทำงานโดยการยิงคลื่นเสียงความถี่ 40 kHz ผ่าน Trigger แล้วจับเวลารอคลื่นสะท้อนกลับมาที่ Echo คำนวณเป็นระยะทางด้วยความเร็วเสียงในอากาศ',
      bullets: [
        'เลือกรุ่น <b>HC-SR04P</b> ที่รองรับไฟ 3.3V สำหรับ ESP32 โดยตรง',
        'สูตรความเร็วเสียง: <code>v = 331.3 + 0.606 × T(°C)</code> (ที่ 25°C v ≈ 346.5 m/s)',
        'สูตรคำนวณระยะ: <code>ระยะทาง (cm) = (เวลาไมโครวินาที × 0.03465) / 2</code>',
        'จอ OLED เชื่อมต่อผ่าน I²C บัส ขา <b>GPIO21 (SDA)</b> และ <b>GPIO22 (SCL)</b>'
      ],
      quiz: {
        q: 'ทำไมในสูตรคำนวณระยะทางถึงต้องหารด้วย 2?',
        opts: [
          { t: 'เพราะคลื่นเสียงต้องเดินทางไปกระทบวัตถุและสะท้อนกลับมา (ระยะทางไป-กลับ)', right: true },
          { t: 'เพราะเซนเซอร์มีกระบอกส่งและกระบอกรับ 2 กระบอก', right: false },
          { t: 'เพื่อแปลงหน่วยจากนิ้วให้กลายเป็นเซนติเมตร', right: false }
        ]
      }
    },
    defaultParams: {
      distance: 35,
      tempC: 25,
      sampleRate: 5
    },
    paramSchema: [
      { key: 'distance', label: 'ระยะห่างวัตถุเป้าหมาย', type: 'range', min: 3, max: 200, step: 1, unit: 'cm' },
      { key: 'tempC', label: 'อุณหภูมิอากาศ (°C)', type: 'range', min: 0, max: 50, step: 1, unit: '°C' },
      { key: 'sampleRate', label: 'ความถี่การวัด (Sample Rate)', type: 'select', options: [{ v: 2, l: '2 Hz' }, { v: 5, l: '5 Hz' }, { v: 10, l: '10 Hz' }] }
    ],
    setup(scene, p) {
      const g = scene.newLessonGroup();
      const sensor = parts.hcsr04();
      sensor.position.set(-20, 0, 16);
      sensor.rotation.y = -Math.PI / 2;
      g.add(sensor);

      const target = parts.target();
      target.position.set(20, 0, 16);
      g.add(target);

      const oled = parts.display();
      oled.position.set(-5, 8, -26);
      oled.rotation.x = 0.25;
      g.add(oled);

      const p5 = scene.pinPos('5');
      const p18 = scene.pinPos('18');
      const p21 = scene.pinPos('21');
      const p22 = scene.pinPos('22');

      const wTrig = scene.addWire(g, p5, sensor.position.clone().add({ x: 0, y: 2, z: -4 }), 0xff8a3d, { lift: 5 });
      const wEcho = scene.addWire(g, p18, sensor.position.clone().add({ x: 0, y: 2, z: 4 }), 0x39e6ff, { lift: 5 });
      const wSda = scene.addWire(g, p21, oled.position.clone().add({ x: -4, y: -2, z: 0 }), 0xa77bff, { lift: 8 });
      const wScl = scene.addWire(g, p22, oled.position.clone().add({ x: -2, y: -2, z: 0 }), 0x3dffa8, { lift: 9 });

      return {
        update(dt, t, params) {
          const dist = Number(params.distance);
          // Position target object in 3D: dist 2..200 cm maps to x -5..75
          const targetX = -10 + (dist / 200) * 85;
          target.position.x = targetX;

          const speedOfSound = 331.3 + 0.606 * Number(params.tempC);
          const speedCmUs = (speedOfSound * 100) / 1000000;
          const timeUs = (dist * 2) / speedCmUs;

          oled.set(`${dist.toFixed(0)} cm`, `TEMP: ${params.tempC}C | ECHO`, dist / 150);

          scene.setPinLevel('5', 0.2);
          scene.setPinLevel('18', 0.8);
          wTrig.setActive(0.4);
          wEcho.setActive(0.9);
          wSda.setActive(0.6);
          wScl.setActive(0.6);

          return {
            readouts: [
              { label: 'ระยะทางที่วัดได้', val: `${dist.toFixed(1)} cm`, cls: 'acc' },
              { label: 'เวลาคลื่นสะท้อน', val: `${timeUs.toFixed(0)} µs`, cls: '' },
              { label: 'ความเร็วเสียง (v)', val: `${speedOfSound.toFixed(1)} m/s`, cls: 'ok' },
              { label: 'สถานะการตรวจจับ', val: dist < 10 ? 'ใกล้มาก (ALERT!)' : 'ปกติ', cls: dist < 10 ? 'bad' : 'ok' }
            ],
            plot: {
              Distance_cm: dist,
              Echo_Time_us: timeUs / 100
            }
          };
        }
      };
    },
    plotChannels: [
      { k: 'Distance_cm', label: 'ระยะทาง (cm)', min: 0, max: 200, color: '#39e6ff', step: false, fmt: v => v.toFixed(1) + ' cm' },
      { k: 'Echo_Time_us', label: 'เวลา Echo (x100 µs)', min: 0, max: 120, color: '#ff8a3d', step: false, fmt: v => (v * 100).toFixed(0) + ' µs' }
    ],
    getCode(p) {
      return `/*
 * VoltLab Studio: Lesson 06 - HC-SR04 Ultrasonic & OLED
 * Trig: GPIO5, Echo: GPIO18, SDA: GPIO21, SCL: GPIO22
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
  }
  display.clearDisplay();
  display.setTextColor(WHITE);
}

void loop() {
  // ยิงพัลส์ Trigger 10 ไมโครวินาที
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // วัดเวลาพัลส์สะท้อนกลับจาก Echo
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // timeout 30ms
  float distanceCm = (duration * 0.0343) / 2.0;

  // แสดงผลบนจอ OLED
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("ESP32 DISTANCE");
  display.setTextSize(3);
  display.setCursor(0, 24);
  display.printf("%.0f cm", distanceCm);
  display.display();

  Serial.printf("Distance: %.1f cm\\n", distanceCm);
  delay(150);
}
`;
    }
  },

  // ==========================================
  // Lesson 7: Servo Motor SG90
  // ==========================================
  {
    id: 'servo',
    num: '07',
    title: 'Servo Motor SG90 (0–180° Motion)',
    sub: 'ควบคุมองศาการหมุนของเซอร์โวมอเตอร์ด้วยพัลส์ PWM 50Hz',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M14.5 9.5l4-4M5.5 18.5l4-4"/></svg>`,
    pins: ['13', 'VIN', 'GND'],
    schematic: [
      { from: 'ESP32 D13 (PWM)', to: 'Servo PWM (ส้ม/เหลือง)', type: 'pin' },
      { from: 'ESP32 VIN (5V)', to: 'Servo VCC (แดง)', type: 'pwr' },
      { from: 'ESP32 GND', to: 'Servo GND (น้ำตาล/ดำ)', type: 'gnd' }
    ],
    info: {
      lead: 'เซอร์โวมอเตอร์ SG90 ถูกควบคุมด้วยสัญญาณพัลส์ความถี่ 50 Hz (คาบเวลา 20 ms) โดยความกว้างของพัลส์ (Pulse Width) จะเป็นตัวกำหนดมุมหมุนตั้งแต่ 0 ถึง 180 องศา',
      bullets: [
        'มุม 0° ใช้พัลส์กว้างประมาณ <b>500 µs (0.5 ms)</b>',
        'มุม 90° ใช้พัลส์กว้าง <b>1,500 µs (1.5 ms)</b>',
        'มุม 180° ใช้พัลส์กว้างประมาณ <b>2,400 µs (2.4 ms)</b>',
        'แนะนำให้ต่อไฟเลี้ยง Servo จากขา VIN หรือแหล่งจ่ายภายนอก ป้องกันไฟกระชากเข้าบอร์ด'
      ],
      quiz: {
        q: 'สัญญาณควบคุมเซอร์โวมาตรฐานมีความถี่กี่ Hz?',
        opts: [
          { t: '50 Hz (คาบเวลา 20 มิลลิวินาที)', right: true },
          { t: '5,000 Hz (เท่ากับ LEDC)', right: false },
          { t: '16 MHz (ความถี่สัญญาณนาฬิกา)', right: false }
        ]
      }
    },
    defaultParams: {
      mode: 'manual',
      targetAngle: 90,
      sweepSpeed: 90,
      minPulse: 500,
      maxPulse: 2400
    },
    paramSchema: [
      { key: 'mode', label: 'โหมดควบคุม', type: 'select', options: [{ v: 'manual', l: 'ปรับมุมเอง (Manual Slider)' }, { v: 'sweep', l: 'กวาดซ้าย-ขวาอัตโนมัติ (Auto Sweep)' }] },
      { key: 'targetAngle', label: 'มุมเป้าหมาย (0–180°)', type: 'range', min: 0, max: 180, step: 1, unit: '°' },
      { key: 'sweepSpeed', label: 'ความเร็วกวาด', type: 'range', min: 30, max: 240, step: 10, unit: '°/s' }
    ],
    setup(scene, p) {
      const g = scene.newLessonGroup();
      const servoComp = parts.servo();
      servoComp.position.set(-18, 0, 18);
      g.add(servoComp);

      const p13 = scene.pinPos('13');
      const pVin = scene.pinPos('VIN');
      const pGnd = scene.pinPos('GND');

      const wSig = scene.addWire(g, p13, servoComp.position.clone().add({ x: -4, y: 2, z: 0 }), 0xff8a3d, { lift: 6 });
      const wPwr = scene.addWire(g, pVin, servoComp.position.clone().add({ x: 0, y: 2, z: 0 }), 0xff2d4a, { lift: 7 });
      const wGnd = scene.addWire(g, pGnd, servoComp.position.clone().add({ x: 4, y: 2, z: 0 }), 0x5a6578, { lift: 6 });

      let currentAngle = Number(p.targetAngle);

      return {
        setAngle(a) {
          currentAngle = Math.max(0, Math.min(180, a));
        },
        update(dt, t, params) {
          let target = Number(params.targetAngle);
          if (params.mode === 'sweep') {
            const cycle = (Math.sin(t * (Number(params.sweepSpeed) / 180) * Math.PI) + 1) / 2;
            target = cycle * 180;
          }

          // Smooth mechanical servo speed interpolation
          currentAngle += (target - currentAngle) * Math.min(1, dt * 15);
          servoComp.set(currentAngle);

          const minP = Number(params.minPulse);
          const maxP = Number(params.maxPulse);
          const pulseUs = minP + (currentAngle / 180) * (maxP - minP);
          const dutyPercent = (pulseUs / 20000) * 100;

          scene.setPinLevel('13', dutyPercent / 12);
          wSig.setActive(0.8);
          wPwr.setActive(1);
          wGnd.setActive(1);

          return {
            readouts: [
              { label: 'มุมปัจจุบัน (Angle)', val: `${currentAngle.toFixed(1)}°`, cls: 'acc' },
              { label: 'ความกว้างพัลส์', val: `${pulseUs.toFixed(0)} µs`, cls: 'ok' },
              { label: 'Duty Cycle @ 50Hz', val: `${dutyPercent.toFixed(2)} %`, cls: '' },
              { label: 'เป้าหมาย (Target)', val: `${target.toFixed(0)}°`, cls: '' }
            ],
            plot: {
              Current_Angle: currentAngle,
              Pulse_Width_us: pulseUs / 20
            }
          };
        }
      };
    },
    plotChannels: [
      { k: 'Current_Angle', label: 'มุมปัจจุบัน (°)', min: 0, max: 180, color: '#39e6ff', step: false, fmt: v => v.toFixed(0) + '°' },
      { k: 'Pulse_Width_us', label: 'ความกว้างพัลส์ (x20 µs)', min: 20, max: 130, color: '#ff6bb5', step: false, fmt: v => (v * 20).toFixed(0) + ' µs' }
    ],
    onSerialInput(text, instance, updateParam) {
      const num = parseFloat(text.trim());
      if (!Number.isNaN(num) && num >= 0 && num <= 180) {
        updateParam('targetAngle', num);
        instance.setAngle(num);
        return `[Serial ↵] ตั้งมุมเซอร์โวเป็น: ${num}°`;
      }
      return `[Serial ?] กรุณาพิมพ์ตัวเลขมุมระหว่าง 0 ถึง 180 (เช่น 90)`;
    },
    getCode(p) {
      return `/*
 * VoltLab Studio: Lesson 07 - Servo Motor SG90
 * ควบคุมด้วย ESP32Servo Library หรือ native LEDC
 */

#include <ESP32Servo.h>

const int SERVO_PIN = 13;
Servo myServo;

void setup() {
  Serial.begin(115200);
  ESP32PWM::allocateTimer(0);
  myServo.setPeriodHertz(50); // 50 Hz
  myServo.attach(SERVO_PIN, ${p.minPulse}, ${p.maxPulse}); // 500us - 2400us
  Serial.println("Servo Ready: Listening to Serial for Angle (0-180)...");
}

void loop() {
  ${p.mode === 'sweep' ? `
  // กวาดจาก 0 ไป 180 องศา
  for (int pos = 0; pos <= 180; pos += 2) {
    myServo.write(pos);
    delay(15);
  }
  // กวาดจาก 180 กลับมา 0 องศา
  for (int pos = 180; pos >= 0; pos -= 2) {
    myServo.write(pos);
    delay(15);
  }
` : `
  if (Serial.available()) {
    int angle = Serial.parseInt();
    if (angle >= 0 && angle <= 180) {
      myServo.write(angle);
      Serial.printf("Moved to: %d deg\\n", angle);
    }
  }
  // ค่าเริ่มต้นที่กำหนด
  myServo.write(${p.targetAngle});
  delay(50);
`}
}
`;
    }
  },

  // ==========================================
  // Lesson 8: Wi-Fi Web Server & IoT
  // ==========================================
  {
    id: 'wifi',
    num: '08',
    title: 'Wi-Fi Web Server (IoT Remote Control)',
    sub: 'สร้างเว็บเซิร์ฟเวอร์ควบคุมอุปกรณ์ผ่านสมาร์ทโฟนแบบเรียลไทม์',
    icon: `<svg viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>`,
    pins: ['2', 'VIN', 'GND'],
    schematic: [
      { from: 'Wi-Fi RF (2.4GHz)', to: 'Wi-Fi Access Point / Router', type: 'pin' },
      { from: 'Smartphone', to: 'ESP32 Web Server (HTTP)', type: '' },
      { from: 'ESP32 D2', to: 'Onboard LED (ควบคุมผ่านเว็บ)', type: 'pin' }
    ],
    info: {
      lead: 'ESP32 มีหน่วยรับส่งสัญญาณวิทยุ 2.4 GHz รองรับทั้ง Wi-Fi 802.11 b/g/n และ Bluetooth สามารถทำหน้าที่เป็นทั้งเครื่องลูกข่าย (Station) และตัวกระจายสัญญาณ (SoftAP)',
      bullets: [
        'ใช้ไลบรารีมาตรฐาน <code>#include &lt;WiFi.h&gt;</code> และ <code>&lt;WebServer.h&gt;</code>',
        'เปิดเซิร์ฟเวอร์พอร์ต 80 ส่งโค้ด HTML/CSS กลับไปยังเว็บเบราว์เซอร์ของโทรศัพท์',
        'จับคู่ URL เส้นทาง เช่น <code>server.on("/toggle", handleToggle);</code>',
        'ค่าความแรงสัญญาณ RSSI ยิ่งติดลบมาก (เช่น -85 dBm) สัญญาณยิ่งอ่อนลงตามระยะทางและสิ่งกีดขวาง'
      ],
      quiz: {
        q: 'ค่า RSSI ของสัญญาณ Wi-Fi ข้อใดถือว่ามีความแรงและเสถียรที่สุด?',
        opts: [
          { t: '-45 dBm (ค่าติดลบน้อยที่สุด แสดงว่าสัญญาณแรงมาก)', right: true },
          { t: '-85 dBm', right: false },
          { t: '-105 dBm (เกือบหลุดการเชื่อมต่อ)', right: false }
        ]
      }
    },
    defaultParams: {
      mode: 'AP',
      distance: 3,
      wallObstacle: 'none',
      ledState: false
    },
    paramSchema: [
      { key: 'mode', label: 'โหมด Wi-Fi', type: 'select', options: [{ v: 'AP', l: 'Access Point (ESP32 ปล่อยสัญญาณเอง)' }, { v: 'STA', l: 'Station (ต่อเข้ากับ Wi-Fi Router บ้าน)' }] },
      { key: 'distance', label: 'ระยะห่างระหว่างมือถือกับ ESP32', type: 'range', min: 1, max: 25, step: 1, unit: 'm' },
      { key: 'wallObstacle', label: 'สิ่งกีดขวางสัญญาณ', type: 'select', options: [{ v: 'none', l: 'โล่ง (ไม่มีสิ่งกีดขวาง)' }, { v: 'wood', l: 'ผนังไม้ / กระจก (-5 dBm)' }, { v: 'concrete', l: 'ผนังคอนกรีตเสริมเหล็ก (-15 dBm)' }] }
    ],
    setup(scene, p) {
      const g = scene.newLessonGroup();
      const rtr = parts.router();
      rtr.position.set(-25, 0, 18);
      g.add(rtr);

      const ph = parts.phone();
      ph.position.set(22, 0, 18);
      g.add(ph);

      const wallComp = parts.wall();
      wallComp.position.set(0, 0, 18);
      wallComp.visible = p.wallObstacle !== 'none';
      g.add(wallComp);

      let ledOn = false;
      let requestCount = 0;

      // Phone interaction in 3D
      ph.userData.onDown = () => {
        ledOn = !ledOn;
        requestCount++;
      };
      scene.addClickable(ph);

      return {
        getLedState: () => ledOn,
        toggleLed: () => {
          ledOn = !ledOn;
          requestCount++;
          return ledOn;
        },
        update(dt, t, params) {
          rtr.blink(t);
          wallComp.visible = params.wallObstacle !== 'none';

          const dist = Number(params.distance);
          // 3D positioning
          ph.position.x = 5 + (dist / 25) * 40;

          // RSSI Path Loss calculation (Log-distance model)
          let wallAtten = 0;
          if (params.wallObstacle === 'wood') wallAtten = 6;
          else if (params.wallObstacle === 'concrete') wallAtten = 18;

          const rssi = Math.round(-38 - 20 * Math.log10(dist) - wallAtten + (Math.sin(t * 2) * 1.5));
          const bars = rssi > -55 ? 4 : (rssi > -68 ? 3 : (rssi > -80 ? 2 : 1));

          ph.draw(ledOn, `${rssi} dBm · ${params.mode === 'AP' ? '192.168.4.1' : '192.168.1.105'}`);

          scene.setPinLevel('2', ledOn ? 1 : 0);

          let quality = 'ดีเยี่ยม (Excellent)';
          if (rssi < -80) quality = 'อ่อนมาก (Weak / Slow)';
          else if (rssi < -70) quality = 'ปานกลาง (Fair)';

          return {
            readouts: [
              { label: 'สถานะหลอดไฟ LED', val: ledOn ? 'ON (เปิด)' : 'OFF (ปิด)', cls: ledOn ? 'ok' : '' },
              { label: 'ความแรงสัญญาณ RSSI', val: `${rssi} dBm`, cls: rssi > -65 ? 'ok' : (rssi < -80 ? 'bad' : 'warn') },
              { label: 'คุณภาพสัญญาณ', val: quality, cls: '' },
              { label: 'HTTP Requests', val: `${requestCount} ครั้ง`, cls: 'acc' }
            ],
            plot: {
              RSSI_dBm: Math.max(-100, rssi),
              HTTP_Traffic: requestCount % 10
            },
            phoneState: { ledOn, rssi, bars, ip: params.mode === 'AP' ? '192.168.4.1' : '192.168.1.105' }
          };
        }
      };
    },
    plotChannels: [
      { k: 'RSSI_dBm', label: 'ความแรงสัญญาณ Wi-Fi (dBm)', min: -100, max: -30, color: '#3dffa8', step: false, fmt: v => v.toFixed(0) + ' dBm' },
      { k: 'HTTP_Traffic', label: 'HTTP Requests Traffic', min: 0, max: 10, color: '#39e6ff', step: true, fmt: v => v.toFixed(0) }
    ],
    customUI: (container, lessonInstance) => {
      const card = document.createElement('div');
      card.className = 'phone-mock';
      card.innerHTML = `
        <div class="pm-screen">
          <div class="pm-top">
            <span class="pm-ip">192.168.4.1</span>
            <div class="pm-bars" id="phone-bars">
              <i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i>
            </div>
          </div>
          <div class="pm-url">http://192.168.4.1/</div>
          <div class="pm-bulb" id="phone-bulb"></div>
          <div class="pm-state" id="phone-state">หลอดไฟ: OFF</div>
          <button class="pm-btn" id="phone-toggle-btn">กดเพื่อสลับไฟ LED (TOGGLE)</button>
          <div class="pm-log mono" id="phone-log">GET / HTTP/1.1 200 OK<br/>Server: ESP32 WebServer</div>
        </div>
      `;
      container.appendChild(card);

      const btn = card.querySelector('#phone-toggle-btn');
      const bulb = card.querySelector('#phone-bulb');
      const stateTx = card.querySelector('#phone-state');
      const log = card.querySelector('#phone-log');

      btn.addEventListener('click', () => {
        const newState = lessonInstance.toggleLed();
        bulb.classList.toggle('on', newState);
        stateTx.innerText = `หลอดไฟ: ${newState ? 'ON (เปิดอยู่)' : 'OFF (ปิด)'}`;
        log.innerHTML = `GET /toggle HTTP/1.1 200 OK<br/><span class="ok">LED State changed to: ${newState ? 'HIGH' : 'LOW'}</span>`;
      });
    },
    getCode(p) {
      return `/*
 * VoltLab Studio: Lesson 08 - Wi-Fi Web Server
 * ESP32 WebServer (AP / Station Mode)
 */

#include <WiFi.h>
#include <WebServer.h>

const int LED_PIN = 2;
WebServer server(80);
bool ledState = false;

// โค้ด HTML ของหน้าเว็บ
const char HTML_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ESP32 Web Server</title>
  <style>
    body { font-family: sans-serif; text-align: center; background: #0a0f1d; color: #fff; padding-top: 50px; }
    .btn { background: #39e6ff; color: #000; border: none; padding: 15px 32px; font-size: 18px; font-weight: bold; border-radius: 12px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>ESP32 IoT Controller</h1>
  <p><a href="/toggle"><button class="btn">สลับสถานะหลอดไฟ (TOGGLE)</button></a></p>
</body>
</html>
)rawliteral";

void handleRoot() {
  server.send(200, "text/html", HTML_PAGE);
}

void handleToggle() {
  ledState = !ledState;
  digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  server.sendHeader("Location", "/");
  server.send(303);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);

  ${p.mode === 'AP' ? `
  // ตั้งค่าเป็นโหมด Access Point ปล่อย Wi-Fi เอง
  WiFi.softAP("ESP32-VoltLab", "12345678");
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);
` : `
  // ตั้งค่าเชื่อมต่อไปยัง Router ที่บ้าน
  WiFi.begin("YOUR_SSID", "YOUR_PASSWORD");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected. IP: ");
  Serial.println(WiFi.localIP());
`}

  server.on("/", handleRoot);
  server.on("/toggle", handleToggle);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}
`;
    }
  }
];
