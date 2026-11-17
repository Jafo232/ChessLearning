export type SoundCue = "move" | "win" | "loss" | "draw";

const scores: Record<SoundCue, [number, number, number][]> = {
  move: [[0, 395, .08]],
  win: [[0, 392, .17], [.14, 523.25, .18], [.29, 659.25, .23], [.50, 783.99, .55], [.51, 523.25, .5]],
  loss: [[0, 392, .25], [.22, 329.63, .26], [.45, 293.66, .24], [.68, 196, .58]],
  draw: [[0, 392, .32], [.35, 392, .44]],
};

export function playCue(ctx: AudioContext, cue: SoundCue) {
  const start = ctx.currentTime + .015;
  for (const [offset, hz, duration] of scores[cue]) {
    const at = start + offset, oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = cue === "loss" || cue === "move" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(hz, at);
    if (cue === "move") oscillator.frequency.exponentialRampToValueAtTime(130, at + duration);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(cue === "move" ? .075 : .16, at + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
