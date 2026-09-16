import { RoundNotGame as BaseGame } from '../game.js';
import { DollController } from './doll-controller.js';
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
    this.doll = new DollController();
    this.cycle = 'walk';
    this.walkLeft = 5;
    this.watchLeft = 2.5;
    this.loadVisualAssets();
  }

  async loadVisualAssets() {
    const [arena, doll] = await Promise.allSettled([loadImage(MAP_URL), loadDollFrames()]);
    if (arena.status === 'fulfilled') this.arenaImage = arena.value;
    if (doll.status === 'fulfilled') this.dollFrames = doll.value;
    this.draw();
  }

  start() {
    this.running = true;
    this.time = this.duration;
    this.last = performance.now();
    this.startWalkCycle();
    requestAnimationFrame(t => this.loop(t));
  }

  startWalkCycle() {
    this.cycle = 'walk';
    this.phase = 'green';
    this.walkLeft = 5;
    this.doll.beginWalk();
    this.onPhase('green');
  }

  startTurnCycle() {
    this.cycle = 'turn-front';
    this.phase = 'green';
    this.doll.beginStopCountdown();
  }

  startWatchCycle() {
    this.cycle = 'watch';
    this.phase = 'red';
    this.watchLeft = 2.2 + Math.random() * 2.2;
    this.doll.beginWatch(this.watchLeft);
    for (const p of this.players) {
      if (!p.alive || p.done) continue;
      p.freeze = Math.random() < .22 ? .25 + Math.random() * .7 : 0;
    }
    this.onPhase('red');
  }

  startReturnCycle() {
    this.cycle = 'turn-back';
    this.phase = 'red';
    this.doll.beginReturn();
  }

  update(dt) {
    if (!this.running) return;
    this.time -= dt;
    this.doll.update(dt);

    if (this.cycle === 'walk') {
      this.walkLeft -= dt;
      if (this.walkLeft <= 0) this.startTurnCycle();
    } else if (this.cycle === 'turn-front') {
      if (this.doll.countdown <= 0) this.startWatchCycle();
    } else if (this.cycle === 'watch') {
      this.watchLeft -= dt;
      if (this.watchLeft <= 0) this.startReturnCycle();
    } else if (this.cycle === 'turn-back' && this.doll.canWalk) {
      this.startWalkCycle();
    }

    for (const p of this.players) {
      if (!p.alive || p.done) continue;
      if (this.cycle === 'walk' || this.cycle === 'turn-front') {
        p.step += dt * 8;
        p.y -= p.speed * dt * (.75 + Math.random() * .5);
      } else if (this.cycle === 'watch' && p.freeze > 0) {
        p.step += dt * 8;
        p.y -= p.speed * dt * .72;
        p.freeze -= dt;
        if (p.freeze <= 0) p.alive = false;
      }
      if (p.y < this.h * .25) {
        p.done = true;
        this.finishers.push(p);
      }
    }

    if (this.time <= 0 || this.players.every(p => !p.alive || p.done)) {
      this.running = false;
      for (const p of this.players) if (!p.done) p.alive = false;
      this.stats();
      this.onFinish(this.finishers);
    }
    this.stats();
  }

  drawArenaImage(ctx, width, height) {
    const image = this.arenaImage;
    if (!image) return false;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sw = width / scale, sh = height / scale;
    ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, 0, 0, width, height);
    return true;
  }

  draw() {
    const ctx = this.x, width = this.w, height = this.h;
    ctx.clearRect(0, 0, width, height);
    if (!this.drawArenaImage(ctx, width, height)) {
      ctx.fillStyle = '#07110c';
      ctx.fillRect(0, 0, width, height);
    }
    this.drawWatcher(ctx, width / 2, height * .235);
    [...this.players].sort((a, b) => a.y - b.y).forEach(player => this.drawPlayer(ctx, player));
  }

  dollFrameIndex() {
    const count = this.dollFrames.length;
    if (!count) return -1;
    return Math.min(count - 1, Math.round(this.doll.turn * (count - 1)));
  }

  drawWatcher(ctx, x, groundY) {
    const image = this.dollFrames[this.dollFrameIndex()];
    if (!image) return super.drawWatcher(ctx, x, groundY);
    const targetHeight = Math.min(this.h * .19, 132);
    const targetWidth = targetHeight * image.naturalWidth / image.naturalHeight;
    ctx.drawImage(image, x - targetWidth / 2, groundY - targetHeight, targetWidth, targetHeight);
  }
}
