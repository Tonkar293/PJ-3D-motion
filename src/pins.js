// ESP32 DevKit V1 (30-pin) pin map & metadata
export const LEFT = ['EN', '36', '39', '34', '35', '32', '33', '25', '26', '27', '14', '12', '13', 'GND', 'VIN'];
export const RIGHT = ['23', '22', '1', '3', '21', '19', '18', '5', '17', '16', '4', '2', '15', 'GND2', '3V3'];

export const OUTPUT_PINS = ['2', '4', '5', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '23', '25', '26', '27', '32', '33'];

const SPECIAL = { EN: 'EN', '36': 'VP', '39': 'VN', '1': 'TX0', '3': 'RX0', '17': 'TX2', '16': 'RX2', GND: 'GND', GND2: 'GND', VIN: 'VIN', '3V3': '3V3' };
const ADC1 = { 36: 0, 39: 3, 32: 4, 33: 5, 34: 6, 35: 7 };
const ADC2 = { 4: 0, 2: 2, 15: 3, 13: 4, 12: 5, 14: 6, 27: 7, 25: 8, 26: 9 };
const TOUCH = { 4: 0, 2: 2, 15: 3, 13: 4, 12: 5, 14: 6, 27: 7, 33: 8, 32: 9 };
const EXTRA = {
  21: ['I²C SDA'], 22: ['I²C SCL'], 23: ['VSPI MOSI'], 19: ['VSPI MISO'], 18: ['VSPI SCK'], 5: ['VSPI CS'],
  1: ['UART0 TX'], 3: ['UART0 RX'], 17: ['UART2 TX'], 16: ['UART2 RX'], 25: ['DAC1'], 26: ['DAC2'],
};
const NOTES = {
  EN: ['ขารีเซ็ต: ดึงเป็น LOW เพื่อรีสตาร์ทชิป (ต่อกับปุ่ม EN)'],
  VIN: ['รับไฟ 5V (จาก USB หรือภายนอก) เข้าเรกูเลเตอร์ 3.3V'],
  '3V3': ['ไฟ 3.3V จากเรกูเลเตอร์ AMS1117 จ่ายได้ราว 600 mA'],
  GND: ['กราวด์ร่วม — ทุกอุปกรณ์ต้องต่อ GND ร่วมกับบอร์ด'],
  GND2: ['กราวด์ร่วม — ทุกอุปกรณ์ต้องต่อ GND ร่วมกับบอร์ด'],
  '34': ['Input only — ไม่มี pull-up/pull-down ภายใน'], '35': ['Input only — ไม่มี pull-up/pull-down ภายใน'],
  '36': ['Input only — ไม่มี pull-up/pull-down ภายใน'], '39': ['Input only — ไม่มี pull-up/pull-down ภายใน'],
  '12': ['Strapping (MTDI): ถ้าเป็น HIGH ตอนบูต แฟลชจะใช้ไฟ 1.8V → บูตไม่ขึ้น'],
  '2': ['Strapping: ต้อง LOW/ลอยตอนเข้าโหมดอัปโหลด', 'ต่อกับ LED สีฟ้าบนบอร์ด'],
  '15': ['Strapping (MTDO): LOW ตอนบูต = ปิดข้อความบูตทาง UART'],
  '5': ['Strapping: กำหนด timing ของ SDIO ตอนบูต'],
  '1': ['ใช้กับ USB-Serial (อัปโหลด/Serial Monitor) — หลีกเลี่ยง'], '3': ['ใช้กับ USB-Serial (อัปโหลด/Serial Monitor) — หลีกเลี่ยง'],
};

export function labelOf(id) { return SPECIAL[id] || 'D' + id; }

export function pinInfo(id) {
  const n = Number(id);
  const gpio = Number.isNaN(n) ? null : n;
  const funcs = [];
  if (gpio !== null) {
    funcs.push({ t: 'GPIO' + gpio, k: '' });
    if (OUTPUT_PINS.includes(id)) funcs.push({ t: 'PWM', k: 'v' });
    if (gpio in ADC1) funcs.push({ t: 'ADC1_CH' + ADC1[gpio], k: '' });
    if (gpio in ADC2) funcs.push({ t: 'ADC2_CH' + ADC2[gpio], k: 'w' });
    if (gpio in TOUCH) funcs.push({ t: 'TOUCH' + TOUCH[gpio], k: 'v' });
    (EXTRA[gpio] || []).forEach(t => funcs.push({ t, k: 'v' }));
  } else funcs.push({ t: id.replace('2', '') === 'GND' ? 'GROUND' : 'POWER', k: 'w' });
  const notes = [...(NOTES[id] || [])];
  if (gpio in ADC2) notes.push('ADC2 ใช้ไม่ได้ขณะเปิด Wi-Fi — ถ้าต้องอ่านอนาล็อกพร้อม Wi-Fi ให้ใช้ ADC1 (GPIO32–39)');
  const kind = gpio === null ? 'power' : (['34', '35', '36', '39'].includes(id) ? 'input' : 'io');
  return { id, label: labelOf(id), gpio, funcs, notes, kind };
}

export const GROUPS = {
  none: [],
  ADC: [...Object.keys(ADC1), ...Object.keys(ADC2)],
  Touch: Object.keys(TOUCH),
  DAC: ['25', '26'],
  PWM: OUTPUT_PINS,
  I2C: ['21', '22'],
  SPI: ['23', '19', '18', '5'],
  UART: ['1', '3', '17', '16'],
  Strapping: ['2', '5', '12', '15'],
  InputOnly: ['34', '35', '36', '39'],
  Power: ['GND', 'GND2', 'VIN', '3V3', 'EN'],
};
export const ALL_PINS = [...LEFT, ...RIGHT];
