let particles = [];

export function initParticles(width, count, cyclePixels) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      phase: Math.random() * cyclePixels,
      // 雨用のパラメータ追加
      speed: 80 + Math.random() * 120,     // 速さ（px/フレーム）
      length: 8 + Math.random() * 50,      // 雨粒の長さ
      thickness: 0.8 + Math.random() * 0.5, // 太さ
      angleOffset: (Math.random() - 0.5) * 0.2  // 風の傾き（ランダム）
    });
  }
}

export function applyRainEffect(
  ctx,
  width,
  height,
  frameIndex,
  loopFrames,
  particleCount,
  baseSpeed = 100,        // 平均速度（snowのppfに相当）
  options = {}
) {
  const speed = baseSpeed;

  const naturalCycle = speed * loopFrames;
  const minSafeCycle = height * 3;
  const cyclePixels = Math.max(naturalCycle, minSafeCycle);

  // 風の揺れ（雨全体の傾き + 個別の揺れ）
  const windFreq = options.windFreq ?? 0.02;
  const windStrength = options.windStrength ?? 30;
  const globalWind = Math.sin(frameIndex * 0.008) * windStrength; // ゆっくり風が変わる

  // 雨の色（少し透明にすると雰囲気◎）
  ctx.strokeStyle = options.color ?? 'rgba(180, 210, 255, 0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowColor = 'rgba(100, 180, 255, 0.6)';
  ctx.lineCap = 'round';

  for (const p of particles) {
    const progressed = (p.phase + frameIndex * p.speed) % cyclePixels;
    let y = progressed - height;  // 上から降ってくる

    if (y < -height * 2 || y > height * 2) continue;

    // 風による傾き（グローバル風 + 個別オフセット + 微揺れ）
    const windSwing = globalWind + 
                      Math.sin(frameIndex * windFreq + p.phase * 0.01) * 15;
    const x = p.x + windSwing + p.angleOffset * y;  // 遠くに行くほど傾く（遠近感！）

    const thickness = p.thickness * (0.8 + Math.sin(frameIndex * 0.2 + p.phase * 0.02) * 0.2);

    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + p.angleOffset * p.length * 2, y + p.length); // 少し斜めに
    ctx.stroke();
  }
}