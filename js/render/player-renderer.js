export function drawPlayer(ctx, player, canvasHeight, phase) {
  const scale = .72 + .38 * (player.y / canvasHeight);
  const moving = phase === 'green' && player.alive && !player.done;

  ctx.save();
  ctx.globalAlpha = player.alive ? 1 : .3;
  ctx.translate(player.x, player.y);
  ctx.scale(scale, scale);
  ctx.translate(0, moving ? Math.sin(player.step) * 1.7 : 0);

  ctx.fillStyle = player.alive ? '#078c81' : '#59615c';
  ctx.fillRect(-7, -7, 14, 18);
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, 10);
  ctx.lineTo(-7, 22 + (moving ? Math.sin(player.step) * 3 : 0));
  ctx.moveTo(3, 10);
  ctx.lineTo(7, 22 - (moving ? Math.sin(player.step) * 3 : 0));
  ctx.stroke();

  ctx.fillStyle = '#242925';
  ctx.beginPath();
  ctx.arc(0, -16, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.font = '800 10px system-ui';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#07100b';
  ctx.strokeText(player.user, 0, -31);
  ctx.fillStyle = '#fff';
  ctx.fillText(player.user, 0, -31);

  ctx.font = '900 10px system-ui';
  ctx.strokeText(String(player.id), 0, 5);
  ctx.fillStyle = '#fff';
  ctx.fillText(String(player.id), 0, 5);
  ctx.restore();
}
