export const DOLL_FRAME_NAMES = Object.freeze([
  'Total costa',
  'comecando a virar 187KB',
  'Olhando de canto de rosto',
  'Frente total'
]);

const FRAME_PATHS = [
  './assets/Total costa.png',
  './assets/comecando a virar.png',
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
  if (turn <= 0) return 0;
  if (turn >= 1) return frameCount - 1;
  return Math.min(frameCount - 2, Math.max(1, Math.floor(turn * (frameCount - 1))));
}
