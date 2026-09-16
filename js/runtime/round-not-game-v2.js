import { RoundNotGame as Game } from './round-not-game.js';
import { loadDollFrames, expectedDollFrame } from './doll-assets.js';
import { VisualGameplayBot } from '../test/visual-gameplay-bot.js';

export class RoundNotGame extends Game {
  constructor(...args) {
    super(...args);
    this.visualGameplayBot = new VisualGameplayBot(this);
    this.visualSampleClock = 0;
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

  dollFrameIndex() {
    return expectedDollFrame(this.doll.turn, this.dollFrames.length);
  }

  update(dt) {
    super.update(dt);
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
