import { applyRainEffect, initParticles } from './effect_rain.js';
import { exportFramesAsZip } from './utils.js';

const loopSecondsInput = document.getElementById('loopSeconds');
const fpsSelect = document.getElementById('fpsSelect');
const rainAmountInput = document.getElementById('rainAmount');          // ID変更
const rainAmountValue = document.getElementById('rainAmountValue');    // ID変更
const speedSelect = document.getElementById('speedSelect');
const startButton = document.getElementById('startButton');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playPreview');
const stopButton = document.getElementById('stopPreview');

let previewTimer = null;

const PREVIEW_W = 853;
const PREVIEW_H = 480;
const OUTPUT_W = 1920;
const OUTPUT_H = 1080;

// 雨量スライダー連動
rainAmountInput.addEventListener('input', () => {
  rainAmountValue.textContent = rainAmountInput.value;
  initPreview();
});

speedSelect.addEventListener('change', initPreview);

function getSpeedSettings(loopFrames) {
  const baseSpeed = parseInt(speedSelect.value);  // 80〜150くらいがおすすめ
  return { baseSpeed };
}

function drawPreview(frame, loopFrames, count) {
  ctx.fillStyle = '#000033';  // 夜っぽい背景（雨が映える！）
  ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

  ctx.save();
  ctx.scale(PREVIEW_W / OUTPUT_W, PREVIEW_H / OUTPUT_H);

  const { baseSpeed } = getSpeedSettings(loopFrames);
  applyRainEffect(ctx, OUTPUT_W, OUTPUT_H, frame, loopFrames, count, baseSpeed, {
    windPower: 50  // お好みで調整
  });

  ctx.restore();
}

function startPreview(fps, loopFrames, count) {
  if (previewTimer) clearInterval(previewTimer);
  let frame = 0;
  previewTimer = setInterval(() => {
    drawPreview(frame % loopFrames, loopFrames, count);
    frame++;
  }, 1000 / fps);

  playButton.disabled = true;
  stopButton.disabled = false;
}

function stopPreview() {
  clearInterval(previewTimer);
  previewTimer = null;
  playButton.disabled = false;
  stopButton.disabled = true;
}

function initPreview() {
  const fps = parseInt(fpsSelect.value);
  const sec = parseFloat(loopSecondsInput.value);
  const loopFrames = Math.round(sec * fps);
  const count = parseInt(rainAmountInput.value);

  const { baseSpeed } = getSpeedSettings(loopFrames);
  const naturalCycle = baseSpeed * loopFrames;
  const cyclePixels = Math.max(naturalCycle, OUTPUT_H * 3);

  initParticles(OUTPUT_W, count, cyclePixels);

  drawPreview(0, loopFrames, count);
  startPreview(fps, loopFrames, count);
}

// 生成ボタン
startButton.addEventListener('click', async () => {
  const fps = parseInt(fpsSelect.value);
  const sec = parseFloat(loopSecondsInput.value);
  const loopFrames = Math.round(sec * fps);
  const count = parseInt(rainAmountInput.value);

  const { baseSpeed } = getSpeedSettings(loopFrames);
  const cyclePixels = Math.max(baseSpeed * loopFrames, OUTPUT_H * 3);

  initParticles(OUTPUT_W, count, cyclePixels);

  startButton.disabled = true;
  startButton.textContent = '生成中…（0%）';

  const offscreen = new OffscreenCanvas(OUTPUT_W, OUTPUT_H);
  const offCtx = offscreen.getContext('2d');
  const frames = [];

  for (let i = 0; i < loopFrames; i++) {
    offCtx.fillStyle = '#000033';
    offCtx.fillRect(0, 0, OUTPUT_W, OUTPUT_H);

    applyRainEffect(offCtx, OUTPUT_W, OUTPUT_H, i, loopFrames, count, baseSpeed, {
      windPower: 50
    });

    const blob = await offscreen.convertToBlob({ type: 'image/png' });
    frames.push({ blob, index: i });

    const progress = Math.round((i + 1) / loopFrames * 100);
    startButton.textContent = `生成中…(${progress}%)`;
  }

  await exportFramesAsZip(frames, loopFrames, fps);

  startButton.disabled = false;
  startButton.textContent = '☔ 雨オーバーレイ連番を書き出す';
});

playButton.onclick = initPreview;
stopButton.onclick = stopPreview;
loopSecondsInput.onchange = initPreview;
fpsSelect.onchange = initPreview;

initPreview();