import { RoundNotGame as Game } from './round-not-game.js';
import { loadDollFrames, expectedDollFrame } from './doll-assets.js';
import { VisualGameplayBot } from '../test/visual-gameplay-bot.js';

const MAP_FINISH_LINE_Y = 0.426;
const DOLL_LINE_OFFSET = 0.018;

export class RoundNotGame extends Game {
  constructor(...args) {
    super(...args);
    this.visualGameplayBot = new VisualGameplayBot(this);
    this.visualSampleClock = 0;
    this.mapProjection = null;
    loadDollFrames().then(frames => {
      this.dollFrames = frames;
      this.draw();
    }).catch(() => {});
  }

  async loadVisualAssets() {
    const image = new Image();
    image.onload = () => { this.arenaImage = image; this.draw(); };
    image.src = './FB798BF0-2248-4F8C-9F80-D88DDD6B05C0.png';
  }

  getMapProjection(width = this.w, height = this.h) {
    const image = this.arenaImage;
    if (!image?.naturalWidth || !image?.naturalHeight) return null;

    // Desktop keeps cover. Portrait/mobile uses a controlled contain-like camera
    // so the arena side structures remain visible instead of being aggressively cropped.
    const portrait = height > width * 1.15;
    const coverScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const widthScale = width / image.naturalWidth;
    const scale = portrait ? Math.max(widthScale, coverScale * .72) : coverScale;
    const sourceWidth = Math.min(image.naturalWidth, width / scale);
    const sourceHeight = Math.min(image.naturalHeight, height / scale);
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = Math.max(0, (image.naturalHeight - sourceHeight) / 2);
    return { scale, sourceWidth, sourceHeight, sourceX, sourceY };
  }

  drawArenaImage(ctx, width, height) {
    const image = this.arenaImage;
    const p = this.getMapProjection(width, height);
    if (!image || !p) return false;
    this.mapProjection = p;
    ctx.fillStyle = '#030806';
    ctx.fillRect(0, 0, width, height);
    const drawWidth = p.sourceWidth * p.scale;
    const drawHeight = p.sourceHeight * p.scale;
    const dx = (width - drawWidth) / 2;
    const dy = (height - drawHeight) / 2;
    ctx.drawImage(image, p.sourceX, p.sourceY, p.sourceWidth, p.sourceHeight, dx, dy, drawWidth, drawHeight);
    this.mapProjection = { ...p, dx, dy };
    return true;
  }

  finishLineY() {
    const image = this.arenaImage;
    const p = this.mapProjection || this.getMapProjection();
    if (!image || !p) return this.h * .25;
    const sourceLineY = image.naturalHeight * MAP_FINISH_LINE_Y;
    return (p.dy || 0) + (sourceLineY - p.sourceY) * p.scale;
  }

  dollFrameIndex() {
    return expectedDollFrame(this.doll.turn, this.dollFrames.length);
  }

  draw() {
    const ctx = this.x, width = this.w, height = this.h;
    ctx.clearRect(0, 0, width, height);
    if (!this.drawArenaImage(ctx, width, height)) {
      ctx.fillStyle = '#07110c';
      ctx.fillRect(0, 0, width, height);
    }
    const finishY = this.finishLineY();
    this.drawWatcher(ctx, width / 2, finishY);
    [...this.players].sort((a, b) => a.y - b.y).forEach(player => this.drawPlayer(ctx, player));
  }

  drawWatcher(ctx, x, groundY) {
    const image = this.dollFrames[this.dollFrameIndex()];
    if (!image) return super.drawWatcher(ctx, x, groundY);
    const targetHeight = Math.min(this.h * .19, 132);
    const targetWidth = targetHeight * image.naturalWidth / image.naturalHeight;
    // Tiny upward visual correction: the line remains the gameplay finish anchor.
    const visualGroundY = groundY - targetHeight * DOLL_LINE_OFFSET;
    ctx.drawImage(image, x - targetWidth / 2, visualGroundY - targetHeight, targetWidth, targetHeight);
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

    const finishY = this.finishLineY();
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
      if (p.y <= finishY) {
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

    this.visualSampleClock += dt;
    if (this.visualSampleClock >= .1) {
      this.visualSampleClock = 0;
      this.visualGameplayBot.sample();
    }
  }

  getVisualTestReport() {
    return this.visualGameplayBot.report();
  }
}
