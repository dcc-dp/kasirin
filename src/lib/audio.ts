/**
 * Audio Synthesizer Beep untuk Kasir POS
 * Berbasis Web Audio API (Zero Latency, Murni Peramban, Tanpa File Audio Eksternal)
 */

export function playPosBeep(type: "scan" | "success" | "error" = "scan") {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "scan") {
      // Beep scanner barcode tajam & singkat (1800Hz, 80ms)
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // Note A6
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "success") {
      // Nada pembayaran sukses (dua nada naik)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.09); // E6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "error") {
      // Nada peringatan stok habis / kesalahan (rendah buzz)
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Abaikan jika browser memblokir audio autoplay sebelum interaksi pengguna
  }
}
