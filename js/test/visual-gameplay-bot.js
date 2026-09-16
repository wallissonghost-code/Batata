const EXPECTED_FORWARD = [0, 1, 2, 3, 4, 5];
const EXPECTED_BACKWARD = [5, 4, 3, 2, 1, 0];

export class VisualGameplayBot {
  constructor(game) {
    this.game = game;
    this.samples = [];
    this.cycles = 0;
    this.lastCycle = null;
    this.lastFrame = null;
    this.turnFrontFrames = [];
    this.turnBackFrames = [];
    this.sequenceFailures = [];
  }

  pushUnique(target, frame) {
    if (frame < 0) return;
    if (target[target.length - 1] !== frame) target.push(frame);
  }

  validateTransition(sequence, expected, name) {
    if (!sequence.length) return;
    const compact = sequence.filter((frame, index) => index === 0 || frame !== sequence[index - 1]);
    let cursor = 0;
    for (const frame of compact) {
      const next = expected.indexOf(frame, cursor);
      if (next === -1) {
        this.sequenceFailures.push({ transition: name, sequence: [...compact], expected: [...expected] });
        return;
      }
      cursor = next;
    }
  }

  sample() {
    const g = this.game;
    if (!g.running) return;
    const frame = g.dollFrameIndex();
    const maxFrame = Math.max(0, g.dollFrames.length - 1);
    let frameOk = true;

    if (g.cycle === 'walk') frameOk = frame === 0;
    else if (g.cycle === 'watch') frameOk = frame === maxFrame;
    else if (g.cycle === 'turn-front') {
      frameOk = frame >= 0 && frame <= maxFrame;
      this.pushUnique(this.turnFrontFrames, frame);
    } else if (g.cycle === 'turn-back') {
      frameOk = frame >= 0 && frame <= maxFrame;
      this.pushUnique(this.turnBackFrames, frame);
    }

    if (this.lastCycle !== g.cycle) {
      if (this.lastCycle === 'turn-front') {
        this.validateTransition(this.turnFrontFrames, EXPECTED_FORWARD, 'turn-front');
        this.turnFrontFrames = [];
      }
      if (this.lastCycle === 'turn-back') {
        this.validateTransition(this.turnBackFrames, EXPECTED_BACKWARD, 'turn-back');
        this.turnBackFrames = [];
      }
      if (this.lastCycle && g.cycle === 'walk') this.cycles++;
    }

    if (this.lastFrame !== null) {
      if (g.cycle === 'turn-front' && frame < this.lastFrame) frameOk = false;
      if (g.cycle === 'turn-back' && frame > this.lastFrame) frameOk = false;
    }

    this.lastCycle = g.cycle;
    this.lastFrame = frame;
    this.samples.push({
      cycle: g.cycle,
      frame,
      frameOk,
      alive: g.players.filter(p => p.alive && !p.done).length
    });
    if (this.samples.length > 600) this.samples.shift();
  }

  report() {
    const frameFailures = this.samples.filter(sample => !sample.frameOk);
    return {
      ok: frameFailures.length === 0 && this.sequenceFailures.length === 0,
      expected: {
        walk: 'Total costa',
        watch: 'Frente total',
        forward: ['Total costa', 'comecando a virar 187KB', 'Olhando de canto de rosto', 'Lateral', 'Comecando a virar 191KB', 'Frente total'],
        backward: ['Frente total', 'Comecando a virar 191KB', 'Lateral', 'Olhando de canto de rosto', 'comecando a virar 187KB', 'Total costa']
      },
      cycles: this.cycles,
      samples: this.samples.length,
      frameFailures: frameFailures.length,
      sequenceFailures: this.sequenceFailures.slice(-10),
      alive: this.game.players.filter(p => p.alive && !p.done).length,
      eliminated: this.game.players.filter(p => !p.alive).length,
      finished: this.game.finishers.length
    };
  }
}
