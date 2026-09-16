import { RoundNotGame as Game } from './round-not-game.js';
import { loadDollFrames, expectedDollFrame } from './doll-assets.js';
import { VisualGameplayBot } from '../test/visual-gameplay-bot.js';

const MAP_FINISH_LINE_Y = 0.426;
const DOLL_LINE_OFFSET = 0.105;
const PLAYER_RADIUS = 15;
const PLAYER_FINISH_DEPTH = 34;

export class RoundNotGame extends Game {
  constructor(...args) {
    super(...args);
    this.visualGameplayBot = new VisualGameplayBot(this);
    this.visualSampleClock = 0;
    this.mapProjection = null;
    this.watchAudit = { checks: 0, movers: 0, killedMovers: 0, stoppedSafe: 0, failures: [] };
    loadDollFrames().then(frames => { this.dollFrames = frames; this.draw(); }).catch(() => {});
  }
  async loadVisualAssets(){const image=new Image();image.onload=()=>{this.arenaImage=image;this.draw()};image.src='./FB798BF0-2248-4F8C-9F80-D88DDD6B05C0.png'}
  getMapProjection(width=this.w,height=this.h){const image=this.arenaImage;if(!image?.naturalWidth||!image?.naturalHeight)return null;const portrait=height>width*1.15,coverScale=Math.max(width/image.naturalWidth,height/image.naturalHeight),widthScale=width/image.naturalWidth,scale=portrait?Math.max(widthScale,coverScale*.72):coverScale,sourceWidth=Math.min(image.naturalWidth,width/scale),sourceHeight=Math.min(image.naturalHeight,height/scale),sourceX=(image.naturalWidth-sourceWidth)/2,sourceY=Math.max(0,(image.naturalHeight-sourceHeight)/2);return{scale,sourceWidth,sourceHeight,sourceX,sourceY}}
  drawArenaImage(ctx,width,height){const image=this.arenaImage,p=this.getMapProjection(width,height);if(!image||!p)return false;ctx.fillStyle='#030806';ctx.fillRect(0,0,width,height);const drawWidth=p.sourceWidth*p.scale,drawHeight=p.sourceHeight*p.scale,dx=(width-drawWidth)/2,dy=(height-drawHeight)/2;ctx.drawImage(image,p.sourceX,p.sourceY,p.sourceWidth,p.sourceHeight,dx,dy,drawWidth,drawHeight);this.mapProjection={...p,dx,dy};return true}
  finishLineY(){const image=this.arenaImage,p=this.mapProjection||this.getMapProjection();if(!image||!p)return this.h*.25;return(p.dy||0)+(image.naturalHeight*MAP_FINISH_LINE_Y-p.sourceY)*p.scale}
  finishTargetY(){return this.finishLineY()-PLAYER_FINISH_DEPTH}
  dollFrameIndex(){return expectedDollFrame(this.doll.turn,this.dollFrames.length)}
  draw(){const ctx=this.x,width=this.w,height=this.h;ctx.clearRect(0,0,width,height);if(!this.drawArenaImage(ctx,width,height)){ctx.fillStyle='#07110c';ctx.fillRect(0,0,width,height)}this.drawWatcher(ctx,width/2,this.finishLineY());[...this.players].sort((a,b)=>a.y-b.y).forEach(p=>this.drawPlayer(ctx,p))}
  drawWatcher(ctx,x,groundY){const image=this.dollFrames[this.dollFrameIndex()];if(!image)return super.drawWatcher(ctx,x,groundY);const targetHeight=Math.min(this.h*.19,132),targetWidth=targetHeight*image.naturalWidth/image.naturalHeight,visualGroundY=groundY-targetHeight*DOLL_LINE_OFFSET;ctx.drawImage(image,x-targetWidth/2,visualGroundY-targetHeight,targetWidth,targetHeight)}
  separatePlayers(){const active=this.players.filter(p=>p.alive&&!p.done),minDistance=PLAYER_RADIUS*2;for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=active[i],b=active[j];let dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);if(distance>=minDistance)continue;if(distance<.01){dx=(Math.random()-.5)||.1;dy=.2;distance=Math.hypot(dx,dy)}const overlap=(minDistance-distance)*.5,nx=dx/distance,ny=dy/distance;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;a.x=Math.max(PLAYER_RADIUS,Math.min(this.w-PLAYER_RADIUS,a.x));b.x=Math.max(PLAYER_RADIUS,Math.min(this.w-PLAYER_RADIUS,b.x))}}
  startWatchCycle(){super.startWatchCycle();for(const p of this.players){if(!p.alive||p.done)continue;p.wasMovingWhenWatched=p.freeze>0;p.watchAuditPending=true;this.watchAudit.checks++;if(p.wasMovingWhenWatched)this.watchAudit.movers++;else this.watchAudit.stoppedSafe++}}
  update(dt){if(!this.running)return;this.time-=dt;this.doll.update(dt);if(this.cycle==='walk'){this.walkLeft-=dt;if(this.walkLeft<=0)this.startTurnCycle()}else if(this.cycle==='turn-front'){if(this.doll.countdown<=0)this.startWatchCycle()}else if(this.cycle==='watch'){this.watchLeft-=dt;if(this.watchLeft<=0)this.startReturnCycle()}else if(this.cycle==='turn-back'&&this.doll.canWalk)this.startWalkCycle();const finishY=this.finishLineY();for(const p of this.players){if(!p.alive||p.done)continue;if(this.cycle==='walk'||this.cycle==='turn-front'){p.step+=dt*8;p.y-=p.speed*dt*(.75+Math.random()*.5)}else if(this.cycle==='watch'&&p.freeze>0){p.step+=dt*8;p.y-=p.speed*dt*.72;p.freeze-=dt;if(p.freeze<=0){p.alive=false;if(p.wasMovingWhenWatched)this.watchAudit.killedMovers++;else this.watchAudit.failures.push({user:p.user,reason:'stopped-player-killed'});p.watchAuditPending=false}}}this.separatePlayers();for(const p of this.players){if(!p.alive||p.done)continue;if(p.y<=finishY-PLAYER_FINISH_DEPTH){p.done=true;p.finishCrossY=p.y;this.finishers.push(p)}}if(this.time<=0||this.players.every(p=>!p.alive||p.done)){this.running=false;for(const p of this.players)if(!p.done)p.alive=false;this.stats();this.onFinish(this.finishers)}this.stats();this.visualSampleClock+=dt;if(this.visualSampleClock>=.1){this.visualSampleClock=0;this.visualGameplayBot.sample()}}
  getWatchAuditReport(){return{...this.watchAudit,ok:this.watchAudit.failures.length===0&&this.watchAudit.killedMovers<=this.watchAudit.movers}}
  getVisualTestReport(){return{...this.visualGameplayBot.report(),watchAudit:this.getWatchAuditReport(),finish:{lineY:this.finishLineY(),targetY:this.finishTargetY(),depth:PLAYER_FINISH_DEPTH,invalidFinishers:this.finishers.filter(p=>(p.finishCrossY??Infinity)>this.finishTargetY()).map(p=>p.user)}}}
}
