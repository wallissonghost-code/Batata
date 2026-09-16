export class DollController {
  constructor() {
    this.turn = 0;
    this.mode = 'back';
    this.countdown = 5;
    this.redHold = 0;
  }

  beginWalk() {
    this.mode = 'back';
    this.turn = 0;
    this.countdown = 5;
  }

  beginStopCountdown() {
    this.mode = 'countdown';
    this.countdown = 5;
  }

  beginWatch(seconds) {
    this.mode = 'watch';
    this.turn = 1;
    this.redHold = seconds;
  }

  beginReturn() {
    this.mode = 'return';
  }

  update(dt) {
    if (this.mode === 'countdown') {
      this.countdown = Math.max(0, this.countdown - dt);
      if (this.countdown <= 3) {
        const progress = Math.min(1, (3 - this.countdown) / 2);
        this.turn = progress * progress * (3 - 2 * progress);
      }
      return;
    }
    if (this.mode === 'return') {
      this.turn = Math.max(0, this.turn - dt * .55);
      if (this.turn === 0) this.mode = 'back';
    }
  }

  get canWalk() { return this.mode === 'back'; }
  get watching() { return this.mode === 'watch'; }
}
