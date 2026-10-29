// Tiny Arduino C++ highlighter → array of HTML lines
const KW = /\b(void|int|const|unsigned|long|float|double|bool|if|else|for|while|return|true|false|static|uint8_t|uint16_t|uint32_t|char|auto|HIGH|LOW|OUTPUT|INPUT|INPUT_PULLUP|INPUT_PULLDOWN|RISING|FALLING|CHANGE|break)\b/;
const FN = /\b(pinMode|digitalWrite|digitalRead|analogRead|analogReadResolution|analogSetPinAttenuation|delay|millis|micros|Serial|ledcAttach|ledcWrite|WiFi|server|pulseIn|delayMicroseconds|attachInterrupt|map|constrain|setup|loop|IPAddress|WebServer|Servo|abs|sin|pow|round|min|max)\b/;
const RX = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(#\s*\w+)|(\b\d+(?:\.\d+)?[fFuUlL]?\b)|(\b[A-Za-z_]\w*\b)/g;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlightLine(line) {
  let out = '', last = 0;
  line.replace(RX, (m, c, s, pp, n, w, idx) => {
    out += esc(line.slice(last, idx));
    last = idx + m.length;
    if (c) out += `<span class="tk-c">${esc(c)}</span>`;
    else if (s) out += `<span class="tk-s">${esc(s)}</span>`;
    else if (pp) out += `<span class="tk-p">${esc(pp)}</span>`;
    else if (n) out += `<span class="tk-n">${n}</span>`;
    else if (KW.test(w)) out += `<span class="tk-k">${w}</span>`;
    else if (FN.test(w)) out += `<span class="tk-f">${w}</span>`;
    else out += w;
    return m;
  });
  return out + esc(line.slice(last));
}
