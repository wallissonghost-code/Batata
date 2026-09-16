const FRAME_PATHS = [
  './assets/Total costa.png',
  './assets/comecando a virar.png',
  './assets/Comecando a virar.png',
  './assets/Lateral.png',
  './assets/Olhando de canto de rosto .png',
  './assets/Frente total.png'
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`asset: ${src}`));
    image.src = encodeURI(src);
  });
}

export async function loadDollFrames() {
  return Promise.all(FRAME_PATHS.map(loadImage));
}

export function expectedDollFrame(turn, frameCount) {
  if (!frameCount) return -1;
  return Math.min(frameCount - 1, Math.max(0, Math.round(turn * (frameCount - 1))));
}
