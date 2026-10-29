// Multi-channel real-time plotter (stacked bands)
export class Plotter {
  constructor(canvas) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.win = 5; this.paused = false; this.colors = {};
    this.reset([]);
  }
  reset(channels) {
    this.ch = channels || []; this.data = {}; this.tNow = 0;
    this.ch.forEach(c => (this.data[c.k] = []));
  }
  push(t, obj) {
    if (this.paused) return;
    for (const k in obj) {
      const a = this.data[k]; if (!a) continue;
      const v = Number(obj[k]);
      a.push(t, v);
      if (a.length > 60000) a.splice(0, 20000);
    }
    if (t > this.tNow) this.tNow = t;
  }
  setTheme() {
    const cs = getComputedStyle(document.body);
    this.colors = { line: cs.getPropertyValue('--line').trim(), text: cs.getPropertyValue('--text-2').trim(), dim: cs.getPropertyValue('--text-3').trim() };
  }
  draw() {
    const c = this.c; if (c.hidden || !c.clientWidth) return;
    const dpr = Math.min(devicePixelRatio, 2);
    const W = c.clientWidth, H = c.clientHeight;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const g = this.g; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (!this.colors.line) this.setTheme();
    const n = this.ch.length; if (!n) return;
    const padL = 92, padR = 12, bandH = H / n;
    const t1 = this.tNow, t0 = t1 - this.win;
    const X = t => padL + ((t - t0) / this.win) * (W - padL - padR);
    // vertical grid
    g.strokeStyle = this.colors.line; g.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { const x = padL + i * (W - padL - padR) / 10; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    g.font = '10px JetBrains Mono, monospace';
    this.ch.forEach((ch, bi) => {
      const top = bi * bandH, pad = 8, h = bandH - pad * 2;
      const Y = v => top + pad + h - ((v - ch.min) / (ch.max - ch.min || 1)) * h;
      g.strokeStyle = this.colors.line; g.beginPath(); g.moveTo(0, top + bandH); g.lineTo(W, top + bandH); g.stroke();
      const a = this.data[ch.k];
      // binary search start
      let lo = 0, hi = a.length / 2 - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (a[m * 2] < t0) lo = m + 1; else hi = m; }
      const start = Math.max(0, lo - 1);
      g.strokeStyle = ch.color; g.lineWidth = 1.6; g.shadowColor = ch.color; g.shadowBlur = 6;
      g.beginPath();
      let prevY = null, last = null;
      for (let i = start; i < a.length / 2; i++) {
        const x = Math.max(padL, X(a[i * 2])), y = Y(Math.min(ch.max, Math.max(ch.min, a[i * 2 + 1])));
        if (prevY === null) g.moveTo(x, y);
        else if (ch.step) { g.lineTo(x, prevY); g.lineTo(x, y); }
        else g.lineTo(x, y);
        prevY = y; last = a[i * 2 + 1];
      }
      if (prevY !== null) g.lineTo(X(t1), prevY);
      g.stroke(); g.shadowBlur = 0;
      // labels
      g.fillStyle = ch.color; g.fillText(ch.label, 8, top + 16);
      g.fillStyle = this.colors.text;
      const val = last === null ? '—' : (ch.fmt ? ch.fmt(last) : (Math.abs(last) >= 100 ? last.toFixed(0) : last.toFixed(2)));
      g.font = '600 13px JetBrains Mono, monospace'; g.fillText(val, 8, top + 34); g.font = '10px JetBrains Mono, monospace';
      g.fillStyle = this.colors.dim; g.fillText(String(ch.max), padL - 30, top + pad + 8); g.fillText(String(ch.min), padL - 30, top + bandH - pad);
    });
    g.fillStyle = this.colors.dim;
    g.fillText(`${(this.win * 1000 / 10).toFixed(this.win < 1 ? 0 : 0)} ms/div`, W - 90, H - 6);
  }
}
