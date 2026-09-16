import { RoundNotGame as BaseGame } from '../game.js';
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

const MAP_URL = './FB798BF0-2248-4F8C-9F80-D88DDD6B05C0.png';
const DOLL_ZIP_URL = './assets/recorte-split.zip';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function loadDollFrames() {
  const response = await fetch(DOLL_ZIP_URL, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`doll zip: ${response.status}`);
  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const files = Object.values(zip.files)
    .filter(file => !file.dir && /\.(png|webp|jpe?g)$/i.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const frames = [];
  for (const file of files) {
    const blob = await file.async('blob');
    const url = URL.createObjectURL(blob);
    try { frames.push(await loadImage(url)); }
    finally { URL.revokeObjectURL(url); }
  }
  return frames;
}

export class RoundNotGame extends BaseGame {
  constructor(...args) {
    super(...args);
    this.arenaImage = null;
    this.dollFrames = [];
    this.dollTurn = 0;
    this.dollTarget = 0;
    this.lastDollTime = performance.now();
    this.loadVisualAssets();
  }

  async loadVisualAssets() {
    const [arena, doll] = await Promise.allSettled([loadImage(MAP_URL), loadDollFrames()]);
    if (arena.status === 'fulfilled') this.arenaImage = arena.value;
    if (doll.status === 'fulfilled') this.dollFrames = doll.value;
    this.draw();
  }

  switchPhase() {
    super.switchPhase();
    this.dollTarget = this.phase === 'red' ? 1 : 0;
  }

  update(dt) {
    super.update(dt);
    const speed = 2.8;
    if (this.dollTurn < this.dollTarget) this.dollTurn = Math.min(this.dollTarget, this.dollTurn + dt * speed);
    else if (this.dollTurn > this.dollTarget) this.dollTurn = Math.max(this.dollTarget, this.dollTurn - dt * speed);
  }

  drawArenaImage(ctx, width, height) {
    const image = this.arenaImage;
    if (!image) return false;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sw = width / scale;
    const sh = height / scale;
    ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, 0, 0, width, height);
    return true;
  }

  draw() {
    const ctx = this.x, width = this.w, height = this.h;
    ctx.clearRect(0, 0, width, height);
    if (!this.drawArenaImage(ctx, width, height)) {
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#153d28');
      bg.addColorStop(.25, '#33543b');
      bg.addColorStop(1, '#77715b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }
    this.drawWatcher(ctx, width / 2, height * .13);
    [...this.players].sort((a, b) => a.y - b.y).forEach(player => this.drawPlayer(ctx, player));
  }

  dollFrameIndex() {
    const count = this.dollFrames.length;
    if (!count) return -1;
    return Math.min(count - 1, Math.round(this.dollTurn * (count - 1)));
  }

  drawWatcher(ctx, x, y) {
    const image = this.dollFrames[this.dollFrameIndex()];
    if (!image) return super.drawWatcher(ctx, x, y);
    const targetHeight = Math.min(this.h * .22, 150);
    const targetWidth = targetHeight * image.naturalWidth / image.naturalHeight;
    ctx.save();
    ctx.translate(x, y + targetHeight * .25);
    ctx.drawImage(image, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
    ctx.restore();
  }
}
