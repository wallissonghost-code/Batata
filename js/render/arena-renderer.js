export class ArenaRenderer {
  constructor(imagePath) {
    this.image = new Image();
    this.ready = false;
    this.image.onload = () => { this.ready = true; };
    this.image.src = imagePath;
  }

  draw(ctx, width, height) {
    if (!this.ready || !this.image.naturalWidth) {
      ctx.fillStyle = '#07110c';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const iw = this.image.naturalWidth;
    const ih = this.image.naturalHeight;
    const scale = Math.max(width / iw, height / ih);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (iw - sourceWidth) / 2;
    const sourceY = (ih - sourceHeight) / 2;

    ctx.drawImage(
      this.image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, width, height
    );
  }
}
