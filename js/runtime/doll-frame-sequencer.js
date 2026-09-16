export class DollFrameSequencer {
  constructor(frameCount = 6) {
    this.frameCount = frameCount;
    this.direction = 'idle';
    this.index = 0;
    this.elapsed = 0;
    this.stepDuration = 0.34;
  }

  setFrameCount(count) {
    if (Number.isInteger(count) && count > 0) this.frameCount = count;
    this.index = Math.min(this.index, this.frameCount - 1);
  }

  holdBack() {
    this.direction = 'idle';
    this.index = 0;
    this.elapsed = 0;
  }

  holdFront() {
    this.direction = 'idle';
    this.index = Math.max(0, this.frameCount - 1);
    this.elapsed = 0;
  }

  turnFront() {
    this.direction = 'forward';
    this.index = 0;
    this.elapsed = 0;
  }

  turnBack() {
    this.direction = 'backward';
    this.index = Math.max(0, this.frameCount - 1);
    this.elapsed = 0;
  }

  update(dt) {
    if (this.direction === 'idle' || this.frameCount <= 1) return;
    this.elapsed += Math.max(0, dt);
    if (this.elapsed < this.stepDuration) return;
    this.elapsed -= this.stepDuration;

    // Exactly one frame step per update: never skips or repeats a transition frame.
    if (this.direction === 'forward') {
      if (this.index < this.frameCount - 1) this.index += 1;
      if (this.index === this.frameCount - 1) this.direction = 'idle';
      return;
    }

    if (this.direction === 'backward') {
      if (this.index > 0) this.index -= 1;
      if (this.index === 0) this.direction = 'idle';
    }
  }

  get frame() { return this.index; }
  get atBack() { return this.index === 0 && this.direction === 'idle'; }
  get atFront() { return this.index === this.frameCount - 1 && this.direction === 'idle'; }
  get turning() { return this.direction !== 'idle'; }
}
