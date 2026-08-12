export type TickFn = (dt: number, elapsed: number) => void;

export class GameLoop {
  private raf = 0;
  private last = 0;
  private elapsed = 0;
  private running = false;
  private readonly onTick: TickFn;

  constructor(onTick: TickFn) {
    this.onTick = onTick;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const frame = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.elapsed += dt;
      this.onTick(dt, this.elapsed);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
