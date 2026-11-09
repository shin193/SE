/* Skeletal animation with world-space foot contacts and two-bone inverse kinematics.
   SVG units; milliseconds. The silhouette never flips as a flat image. */
globalThis.MascotMotion=(()=>{
 const duration=5900,ground=151,clamp=n=>Math.max(0,Math.min(1,n));
 const ease=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10);};
 const mix=(a,b,t)=>a+(b-a)*t,point=(x,y)=>({x,y});
 const lerpPoint=(a,b,t)=>point(mix(a.x,b.x,t),mix(a.y,b.y,t));
 function ik(a,b,l1,l2,bend=1){
  const dx=b.x-a.x,dy=b.y-a.y,raw=Math.hypot(dx,dy),d=Math.max(.001,Math.min(raw,l1+l2-.001));
  const ux=dx/(raw||1),uy=dy/(raw||1),along=(l1*l1-l2*l2+d*d)/(2*d);
  const height=Math.sqrt(Math.max(0,l1*l1-along*along));
  return point(a.x+ux*along-uy*height*bend,a.y+uy*along+ux*height*bend);
 }
 function route(t){
  if(t<280)return {fraction:0,phase:'ready',walking:false,p:t/280,direction:1};
  if(t<1980)return {fraction:(t-280)/1700,phase:'outbound',walking:true,p:(t-280)/1700,direction:1};
  if(t<3430)return {fraction:1,phase:'greeting',walking:false,p:(t-1980)/1450,direction:1};
  if(t<3800)return {fraction:1,phase:'turning',walking:false,p:(t-3430)/370,direction:-1};
  if(t<5500)return {fraction:1-(t-3800)/1700,phase:'returning',walking:true,p:(t-3800)/1700,direction:-1};
  return {fraction:0,phase:'home',walking:false,p:clamp((t-5500)/400),direction:1};
 }
 // Alternate a swinging foot with an immutable planted ankle. A final gathering
 // step finishes both feet under the pelvis. Quintic lifts have zero contact speed.
 function walk(p,distance,direction){
  let count=Math.max(4,Math.ceil(distance/36)+2);if(count%2)count++;
  const ramp=.18;
  const glide=q=>{q=clamp(q);if(q<ramp)return .5*(q-ramp/Math.PI*Math.sin(Math.PI*q/ramp))/(1-ramp);if(q>1-ramp)return 1-glide(1-q);return (q-ramp/2)/(1-ramp);};
  const travel=q=>distance*glide(Math.min(1,q*count/(count-1)));
  const u=clamp(p)*count,index=Math.min(count-1,Math.floor(u)),f=clamp(u-index);
  const feet=[-12,12].map(offset=>({x:offset,y:ground,contact:true}));
  const start=direction===1?0:distance,world=q=>start+direction*travel(q);
  feet[0].x+=start;feet[1].x+=start;
  for(let step=0;step<index;step++)feet[step%2].x=world((step+1)/count)+(step%2===0?-12:12);
  const swing=index%2,from=feet[swing].x,to=world((index+1)/count)+(swing===0?-12:12);
  const s=ease((f-.10)/.80),height=12*Math.sin(Math.PI*s)**2;
  feet[swing]={x:mix(from,to,s),y:ground-height,contact:s===0||s===1};
  const x=world(clamp(p)),weight=Math.sin(Math.PI*s),support=swing===0?1:-1;
  return {x,feet,weight,support,step:index,swing,progress:s};
 }
 function arm(shoulder,hand,bend,wrist){return {shoulder,elbow:ik(shoulder,hand,20,21,bend),hand,wrist};}
 class Clock{
  constructor(){this.elapsed=duration;this.mode='login';this.lastMode=null;this.pending=null;this.reaction=null;this.previousReaction=-1;this.running=false;this.distance=0;this.targetDistance=0;this.scale=1;}
  request(mode){if(mode===this.lastMode)return;this.lastMode=mode;if(!['login','signup'].includes(mode)){this.pending=null;return;}if(this.running||this.reaction){this.pending=mode;return;}this.begin(mode);}
  begin(mode){this.mode=mode;this.elapsed=0;this.running=true;this.pending=null;this.distance=this.targetDistance;}
  setDistance(distance,scale=this.scale){this.scale=scale;this.targetDistance=Math.max(0,distance);if(!this.running&&!this.reaction)this.distance=this.targetDistance;}
  react(random=Math.random()){
   if(this.reaction)return false;
   const choices=[0,1,2].filter(n=>n!==this.previousReaction),type=choices[Math.min(choices.length-1,Math.floor(clamp(random)*choices.length))];
   this.previousReaction=type;this.reaction={type,elapsed:0,duration:1200};return true;
  }
  advance(dt){
   dt=Math.max(0,Math.min(dt,40));
   if(this.reaction){this.reaction.elapsed+=dt;if(this.reaction.elapsed>=this.reaction.duration)this.reaction=null;}
   else if(this.running){this.elapsed=Math.min(duration,this.elapsed+dt);if(this.elapsed===duration){this.running=false;this.distance=this.targetDistance;}}
   if(!this.running&&!this.reaction&&this.pending)this.begin(this.pending);
   return this.pose();
  }
  pose(){
   const r=route(this.elapsed),D=this.distance/this.scale;
   const gait=r.walking?walk(r.p,D,r.direction):null;
   const root=gait?gait.x:(r.phase==='greeting'||r.phase==='turning'?D:0);
   let feet=gait?gait.feet:[{x:root-12,y:ground,contact:true},{x:root+12,y:ground,contact:true}];
   let crouch=0,lift=0,lean=0,head=0,smile=.2,cheeks=.62;
   let facing=r.phase==='ready'?ease(r.p):r.walking?r.direction:r.phase==='greeting'?1-ease(r.p*5):r.phase==='turning'?-ease(r.p):-(1-ease(r.p));
   const torsoFacing=r.phase==='ready'?ease((r.p-.2)/.8):r.walking?r.direction:r.phase==='greeting'?1-ease((r.p-.08)*4):r.phase==='turning'?-ease((r.p-.18)/.82):-(1-ease((r.p-.12)/.88));
   const torsoWidth=1-.12*Math.abs(torsoFacing),headWidth=1-.08*Math.abs(facing);
   let sway=gait?gait.support*gait.weight*1.6:0;
   if(gait){lift=-1.8*gait.weight;crouch=.6*gait.weight;lean=r.direction*2.2*Math.sin(Math.PI*r.p);head=-lean*.45;}
   if(r.phase==='ready'){crouch=3*Math.sin(Math.PI*r.p);lean=2.2*Math.sin(Math.PI*r.p);}
   if(r.phase==='home'){crouch=1.6*Math.sin(Math.PI*r.p);head=-1.5*Math.sin(Math.PI*r.p);}
   const greet=r.phase==='greeting'?Math.sin(Math.PI*r.p)**2:0;
   let wave=greet,elbowWave=0,wristWave=0;
   if(this.mode==='signup'){elbowWave=Math.sin(r.p*Math.PI*8)*greet*5;wristWave=Math.sin(r.p*Math.PI*10-.6)*greet*19;head+=Math.sin(r.p*Math.PI*2)*greet*3;}
   else{wave=greet*.75;head+=Math.sin(Math.PI*clamp((r.p-.1)/.65))*greet*9;wristWave=Math.sin(r.p*Math.PI*4)*greet*9;}
   smile+=.6*greet;
   let reactionAmount=0,jump=0;
   if(this.reaction){
    const p=this.reaction.elapsed/1200;
    // Land the raised foot, prepare, act, recover, then restore the EXACT
    // suspended gait pose before releasing route time. Clicks cannot queue.
    reactionAmount=ease(p/.15)*(1-ease((p-.83)/.17));
    const floorFeet=feet.map(f=>({...f,y:ground,contact:true}));
    feet=feet.map((f,i)=>({...lerpPoint(f,floorFeet[i],reactionAmount),contact:f.contact||reactionAmount===1}));
    sway*=1-reactionAmount;lean*=1-reactionAmount;head*=1-reactionAmount;wave*=1-reactionAmount;
    if(this.reaction.type===0){
     const anticipation=3.8*Math.sin(Math.PI*clamp((p-.12)/.20))**2;
     jump=22*Math.sin(Math.PI*clamp((p-.32)/.30))**2;
     const landing=5*Math.sin(Math.PI*clamp((p-.62)/.22))**2;
     crouch=mix(crouch,anticipation+landing,reactionAmount);lift=mix(lift,-jump,reactionAmount);
     feet=feet.map((f,i)=>({...f,y:f.y-jump*.88-(i?1:0)*Math.sin(Math.PI*clamp((p-.32)/.30))**2,contact:jump<.001&&f.contact}));
     wave+=reactionAmount*.75;head-=4*reactionAmount;smile+=reactionAmount;
    }else if(this.reaction.type===1){
     lean+=Math.sin(p*Math.PI*3)*reactionAmount*8;head-=Math.sin(p*Math.PI*3-.35)*reactionAmount*6;
     crouch+=2*reactionAmount;wave+=reactionAmount*.5;wristWave+=Math.sin(p*Math.PI*6)*reactionAmount*15;smile+=reactionAmount*.8;
    }else{head+=9*reactionAmount;crouch+=2*reactionAmount;wave+=.78*reactionAmount;wristWave+=Math.sin(p*Math.PI*8)*reactionAmount*15;cheeks+=.35*reactionAmount;smile+=reactionAmount*.6;}
   }
   const hipY=112+lift+crouch,pelvis=point(80+sway,hipY),torso=point(pelvis.x,hipY-39);
   const leftShoulder=point(torso.x-30*torsoWidth,torso.y-9+Math.sin(lean*.1)),rightShoulder=point(torso.x+30*torsoWidth,torso.y-9-2*wave);
   const stride=gait?(feet[0].x-feet[1].x+24)*.23*(1-reactionAmount):0;
   const leftHand=point(leftShoulder.x-7-stride,leftShoulder.y+34-Math.abs(stride)*.14);
   const rightRest=point(rightShoulder.x+7+stride,rightShoulder.y+34-Math.abs(stride)*.14);
   const rightHello=point(rightShoulder.x+17+elbowWave,rightShoulder.y-27);
   const rightHand=lerpPoint(rightRest,rightHello,Math.min(1,wave*1.45));
   const legs=feet.map((f,i)=>{
    const hip=point(pelvis.x+(i===0?-13:13)*torsoWidth,hipY),ankle=point(f.x-root+80,f.y);
    return {hip,knee:lerpPoint(lerpPoint(ik(hip,ankle,28,30,1),ik(hip,ankle,28,30,-1),.5),ik(hip,ankle,28,30,facing<0?1:-1),Math.abs(facing)),ankle,contact:f.contact,worldX:f.x,worldY:f.y,toe:f.contact?0:(f.y-ground)*r.direction*.7};
   });
   return {x:root*this.scale,root,phase:r.phase,walking:r.walking,reaction:this.reaction?['jump','twist','shy'][this.reaction.type]:'none',active:this.running||Boolean(this.reaction),legs,pelvis,torso,torsoWidth,headWidth,bodyTilt:lean,headTilt:head,headX:facing*5-sway*.3,facing,leftArm:arm(leftShoulder,leftHand,1,-8+stride),rightArm:arm(rightShoulder,rightHand,-1,-12+wristWave),smile,cheeks,lift,crouch,jump};
  }
 }
 return {Clock,route,walk,ik,duration};
})();
