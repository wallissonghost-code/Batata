export class VisualGameplayBot {
  constructor(game) {
    this.game = game;
    this.samples = [];
    this.cycles = 0;
    this.lastCycle = null;
  }

  sample() {
    const g = this.game;
    if (!g.running) return;
    const frame = g.dollFrameIndex();
    const maxFrame = Math.max(0, g.dollFrames.length - 1);
    let frameOk = true;

    if (g.cycle === 'walk') frameOk = frame === 0;
    if (g.cycle === 'watch') frameOk = frame === maxFrame;
    if (g.cycle === 'turn-front') frameOk = frame >= 0 && frame <= maxFrame;
    if (g.cycle === 'turn-back') frameOk = frame >= 0 && frame <= maxFrame;

    if (this.lastCycle && this.lastCycle !== g.cycle && g.cycle === 'walk') this.cycles++;
    this.lastCycle = g.cycle;
    this.samples.push({ cycle: g.cycle, frame, frameOk, alive: g.players.filter(p => p.alive && !p.done).length });
    if (this.samples.length > 240) this.samples.shift();
  }

  report() {
    const failures = this.samples.filter(s => !s.frameOk);
    return {
      ok: failures.length === 0,
      cycles: this.cycles,
      samples: this.samples.length,
      frameFailures: failures.length,
      alive: this.game.players.filter(p => p.alive && !p.done).length,
      eliminated: this.game.players.filter(p => !p.alive).length,
      finished: this.game.finishers.length
    };
  }
}
