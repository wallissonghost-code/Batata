import { RoundNotGame as Game } from './round-not-game.js';
import { loadDollFrames, expectedDollFrame } from './doll-assets.js';
import { VisualGameplayBot } from '../test/visual-gameplay-bot.js';

// Finish line measured once in the source arena image.
// Keeping it in image-space makes the anchor survive cover/crop/zoom changes.
const MAP_FINISH_LINE_Y = 0.426;

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
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    return { scale, sourceWidth, sourceHeight, sourceX, sourceY };
  }

  drawArenaImage(ctx, width, height) {
    const image = this.arenaImage;
    const p = this.getMapProjection(width, height);
    if (!image || !p) return false;
    this.mapProjection = p;
    ctx.drawImage(image, p.sourceX, p.sourceY, p.sourceWidth, p.sourceHeight, 0, 0, width, height);
    return true;
  }

  finishLineY() {
    const image = this.arenaImage;
    const p = this.getMapProjection();
    if (!image || !p) return this.h * .25;
    const sourceLineY = image.naturalHeight * MAP_FINISH_LINE_Y;
    return (sourceLineY - p.sourceY) * p.scale;
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
    // groundY is the red line itself: the PNG bottom is planted on it.
    ctx.drawImage(image, x - targetWidth / 2, groundY - targetHeight, targetWidth, targetHeight);
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
