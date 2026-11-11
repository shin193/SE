/* BOGHCHE spool rig: one behaviour controller, independent walk/run foot planners,
   world-space contact anchors, near-straight standing legs and blended expressions. */
globalThis.MascotMotion=(()=>{
 const ground=151,upper=23.5,lower=23.5;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const ease=p=>{p=clamp(p);return p*p*p*(p*(p*6-15)+10);};
 const point=(x,y)=>({x,y}),blend=(a,b,t)=>point(mix(a.x,b.x,t),mix(a.y,b.y,t));
 const approach=(a,b,amount)=>a+clamp(b-a,-amount,amount);
 function ik(a,b,l1,l2,bend=1){
  const dx=b.x-a.x,dy=b.y-a.y,raw=Math.hypot(dx,dy),d=clamp(raw,.001,l1+l2-.001),ux=dx/(raw||1),uy=dy/(raw||1);
  const h=(l1*l1-l2*l2+d*d)/(2*d),s=Math.sqrt(Math.max(0,l1*l1-h*h));
  return point(a.x+ux*h-uy*s*bend,a.y+uy*h+ux*s*bend);
 }
 const offsets=[-9,9];
 class Gait{
  constructor(x=0){this.feet=offsets.map(o=>({x:x+o,y:ground,contact:true}));this.step=null;this.next=0;this.phase=0;this.kind='walk';}
  settled(x){return !this.step&&this.feet.every((f,i)=>Math.abs(f.x-x-offsets[i])<.6&&f.y===ground);}
  advance(dt,x,v,goal,kind){
   const seconds=dt/1000,moving=Math.abs(v)>2.5,dir=Math.sign(v)||Math.sign(goal-x)||1;
   if(!this.step){
    let which=this.next;
    if(!moving){const errors=this.feet.map((f,i)=>Math.abs(f.x-x-offsets[i])+Math.abs(f.y-ground));which=errors[0]>=errors[1]?0:1;if(errors[which]<.6)return;}
    const duration=moving?(kind==='run'?190:235):180;
    let destination=x+offsets[which];
    if(moving){const horizon=duration/1000,max=kind==='run'?152:106,accel=kind==='run'?590:430;const accelerating=Math.min(horizon,Math.max(0,(max-Math.abs(v))/accel));
     const forecast=dir*(Math.abs(v)*horizon+.5*accel*accelerating**2+accel*accelerating*(horizon-accelerating)+6);destination=x+offsets[which]+clamp(forecast,-31,31);destination=dir>0?Math.min(destination,goal+offsets[which]+4):Math.max(destination,goal+offsets[which]-4);}
    this.step={which,from:{...this.feet[which]},to:destination,elapsed:0,duration,kind:moving?kind:'gather',support:1-which};
    this.next=1-which;
   }
   const s=this.step;s.elapsed=Math.min(s.duration,s.elapsed+dt);const u=s.elapsed/s.duration;
   const swing=this.feet[s.which],support=this.feet[s.support];
   this.kind=s.kind;this.phase=u;
   if(s.kind==='run'){
    // Run has its own ballistic flight window (.56-.78), a folded recovery leg,
    // longer aerial reach and arm drive. It is not accelerated walking.
    const p=ease(u/.78);swing.x=mix(s.from.x,s.to,p);swing.y=mix(s.from.y,ground,p)-23*Math.sin(Math.PI*clamp(u/.78))**2;swing.contact=u>=.78;
    if(u>.56){support.y=ground-15*ease((u-.56)/.44);support.contact=false;}
    else{support.y=ground;support.contact=true;}
   }else{
    const p=ease(u);swing.x=mix(s.from.x,s.to,p);swing.y=mix(s.from.y,ground,p)-(s.kind==='gather'?4:9)*Math.sin(Math.PI*p)**2;swing.contact=u===1;
    support.y=ground;support.contact=true;
   }
   if(u===1){swing.x=s.to;swing.y=ground;swing.contact=true;this.step=null;}
  }
 }
 const expressions={
  calm:{eyeL:.93,eyeR:.93,browL:0,browR:0,angleL:0,angleR:0,smile:0,open:.025,width:7,head:0},
  curious:{eyeL:1.07,eyeR:.91,browL:-2.2,browR:-.4,angleL:-.8,angleR:.5,smile:-.08,open:.19,width:4.8,head:-3},
  happy:{eyeL:.82,eyeR:.82,browL:-1.8,browR:-1.8,angleL:0,angleR:0,smile:.72,open:.13,width:9,head:2},
  surprised:{eyeL:1.22,eyeR:1.22,browL:-4,browR:-4,angleL:0,angleR:0,smile:-.32,open:.47,width:4.3,head:-2},
  mischief:{eyeL:.77,eyeR:.94,browL:-2.3,browR:.8,angleL:-1.8,angleR:1,smile:.16,open:.06,width:7.2,head:3}
 };
 class Clock{
  constructor({seed=713}={}){
   this.time=0;this.state='idle';this.elapsed=0;this.x=0;this.v=0;this.goal=0;this.max=0;this.home=0;this.title=0;this.scale=1;this.initialized=false;
   this.mode='login';this.lastMode=null;this.pending=null;this.gait=new Gait();this.facing=0;this.bodyFacing=0;this.runMix=0;
   this.reaction=null;this.previousReaction=-1;this.held=false;this.pointerData=null;this.wasNear=false;this.farSince=0;this.lastConsumed=-1;
   this.escapeDirection=1;this.bounces=0;this.candidate=0;this.candidateSince=0;this.lastTurn=-1000;this.cooldown=0;this.serial=0;
   this.face={...expressions.calm};this.gaze=point(0,0);this.gazeTarget=point(0,0);this.emotion='calm';this.randomState=seed>>>0;this.blinkAt=2700+this.random()*1700;this.blinkStart=-1000;
  }
  random(){this.randomState=(1664525*this.randomState+1013904223)>>>0;return this.randomState/4294967296;}
  setLayout(maxPixels,scale=1){
   const oldMax=this.max,oldScale=this.scale;
   this.scale=scale;this.max=Math.max(0,maxPixels/scale);this.title=this.max;this.home=Math.max(0,this.max-82/scale);
   if(this.initialized&&(Math.abs(oldMax-this.max)>.01||Math.abs(oldScale-scale)>.001)){
    // Responsive reflow carries the complete skeleton and its foot anchors
    // together, preserving the current step while fitting the new lane.
    const next=this.state==='idle'?this.home:clamp(oldMax?this.x/oldMax*this.max:0,0,this.max),shift=next-this.x;
    this.x=next;this.goal=clamp(this.goal+shift,0,this.max);this.gait.feet.forEach(f=>f.x+=shift);
    if(this.gait.step){this.gait.step.from.x+=shift;this.gait.step.to+=shift;}
    this.pointerData=null;
   }
   if(!this.initialized){this.x=this.home;this.goal=this.x;this.gait=new Gait(this.x);this.initialized=true;}
   if(this.state==='walk-title')this.goal=this.title;
   else if(['walk-home','return-home'].includes(this.state))this.goal=this.home;
   else this.goal=clamp(this.goal,0,this.max);
  }
  setDistance(distance,scale=1){this.setLayout(distance,scale);}
  transition(state){this.state=state;this.elapsed=0;}
  request(mode){
   if(mode===this.lastMode)return;this.lastMode=mode;
   if(!['login','signup'].includes(mode)){this.pending=null;if(this.state!=='idle'){this.goal=this.home;this.transition('return-home');}return;}
   if(this.state!=='idle'||this.reaction||this.held){this.pending=mode;return;}
   this.begin(mode);
  }
  begin(mode){this.mode=mode;this.pending=null;this.goal=this.x;this.transition('anticipate');}
  pointer(x,y,dx=0,dy=0){this.pointerData={x,y,dx,dy,serial:++this.serial};}
  leave(){this.pointerData=null;}
  press(held){this.held=held;if(!held)this.cooldown=this.time+900;}
  react(random=this.random()){
   if(this.reaction)return false;
   const choices=[0,1,2].filter(n=>n!==this.previousReaction),type=choices[Math.min(choices.length-1,Math.floor(clamp(random)*choices.length))];
   this.previousReaction=type;this.reaction={type,elapsed:0,duration:1120};this.cooldown=this.time+1800;return true;
  }
  proximity(){
   const p=this.pointerData;if(!p)return {near:false,curious:false,direction:this.escapeDirection,approaching:false};
   const dx=p.x-(this.x+80),dy=p.y-76,radius=Math.hypot(dx/102,dy/86);
   let direction=Math.abs(dx)>16?-Math.sign(dx):Math.abs(p.dx)>.5?-Math.sign(p.dx):this.escapeDirection;
   return {near:radius<1.12,curious:radius<1.85,direction,approaching:Math.hypot(p.dx,p.dy)>1.1,serial:p.serial};
  }
  notice(info){
   this.lastConsumed=info.serial;this.bounces=0;this.escapeDirection=info.direction;this.goal=this.x;this.candidate=0;this.transition('notice');
  }
  flee(dir){
   this.escapeDirection=dir;this.lastTurn=this.time;
   if(this.max<8){this.goal=this.x;this.cooldown=this.time+1600;this.transition('calm');return;}
   const available=dir>0?this.max-this.x:this.x;
   if(available<8){this.goal=this.x;this.transition('edge-turn');return;}
   this.goal=clamp(this.x+dir*100,0,this.max);this.transition('run');
  }
  advance(rawDt){
   const real=clamp(rawDt,0,6000),dt=Math.min(real,32),sec=dt/1000;this.time+=real;
   const info=this.proximity();
   if(!info.near){if(this.wasNear)this.farSince=this.time;}else this.farSince=this.time;
   if(!this.reaction&&!this.held){
    this.elapsed+=dt;
    const canNotice=!['notice','run','edge-turn'].includes(this.state)&&this.time>this.cooldown;
    if(canNotice&&info.near&&info.serial!==this.lastConsumed&&(!this.wasNear||info.approaching))this.notice(info);
    if(this.state==='anticipate'&&this.elapsed>180){this.goal=this.title;this.transition('walk-title');}
    if(this.state==='notice'&&this.elapsed>360){if(info.near)this.flee(info.direction);else{this.goal=this.home;this.transition('return-home');}}
    if(this.state==='run'){
     if(info.near&&info.serial!==this.lastConsumed&&info.direction!==this.escapeDirection&&this.time-this.lastTurn>480){
      if(this.candidate!==info.direction){this.candidate=info.direction;this.candidateSince=this.time;}
      if(this.time-this.candidateSince>170){this.lastConsumed=info.serial;this.flee(this.candidate);this.candidate=0;}
     }else this.candidate=0;
     if(!info.near&&this.time-this.farSince>450){this.goal=this.home;this.transition('return-home');}
    }
    if(this.state==='edge-turn'&&this.elapsed>290){this.bounces++;this.flee(-this.escapeDirection);this.cooldown=this.time+1100;}
    if(this.state==='greet'&&this.elapsed>1180){this.goal=this.x;this.transition('turn-home');}
    if(this.state==='turn-home'&&this.elapsed>240){this.goal=this.home;this.transition('walk-home');}
    if(this.state==='settle'&&this.elapsed>160){this.transition('idle');this.cooldown=Math.max(this.cooldown,this.time+700);}
    if(this.state==='calm'&&!info.near&&this.time-this.farSince>550){this.goal=this.home;this.transition('return-home');}
    const moving=['walk-title','walk-home','return-home','run'].includes(this.state);
    const delta=this.goal-this.x,run=this.state==='run',maxSpeed=run?152:106,accel=run?590:430,brake=run?660:540;
    let desired=moving?Math.sign(delta)*Math.min(maxSpeed,Math.sqrt(2*brake*Math.abs(delta))):0;
    // Brake before reversing: the planted foot and current swing finish naturally.
    if(this.v*desired<0&&Math.abs(this.v)>7)desired=0;
    this.v=approach(this.v,desired,(Math.abs(desired)<Math.abs(this.v)?brake:accel)*sec);
    const next=this.x+this.v*sec;
    if(moving&&Math.sign(delta)!==Math.sign(this.goal-next)){this.x=this.goal;this.v=0;}else this.x=next;
    this.gait.advance(dt,this.x,this.v,this.goal,run?'run':'walk');
    const arrived=Math.abs(this.x-this.goal)<.4&&Math.abs(this.v)<1&&this.gait.settled(this.x);
    if(arrived){
     if(this.state==='walk-title')this.transition('greet');
     else if(['walk-home','return-home'].includes(this.state))this.transition('settle');
     else if(this.state==='run'){
      if((this.x<2||this.x>this.max-2)&&this.bounces<1){this.goal=this.x;this.transition('edge-turn');}
      else{this.cooldown=this.time+1000;this.goal=this.x;this.transition('calm');}
     }
    }
    if(this.state==='idle'&&this.pending)this.begin(this.pending);
   }
   if(this.reaction){this.reaction.elapsed+=dt;if(this.reaction.elapsed>=this.reaction.duration)this.reaction=null;}
   this.wasNear=info.near;
   const runTarget=this.gait.kind==='run'&&!!this.gait.step?1:0;this.runMix=mix(this.runMix,runTarget,1-Math.exp(-dt/140));
   let direction=Math.abs(this.v)>5?Math.sign(this.v):this.state==='notice'?info.direction:this.state==='edge-turn'?-this.escapeDirection:this.state==='anticipate'||this.state==='walk-title'?1:['turn-home','walk-home','return-home'].includes(this.state)?Math.sign(this.home-this.x)||-1:0;
   if(this.state==='greet'||this.state==='idle'||this.state==='calm')direction=0;
   this.facing=mix(this.facing,direction,1-Math.exp(-dt/105));this.bodyFacing=mix(this.bodyFacing,this.facing,1-Math.exp(-dt/160));
   let emotion=this.state==='notice'?'surprised':['run','edge-turn','calm'].includes(this.state)?'mischief':this.state==='greet'&&this.elapsed>160&&this.elapsed<820?'happy':info.curious?'curious':'calm';
   if(this.reaction)emotion=this.reaction.elapsed<160?'surprised':this.reaction.type===1?'mischief':'happy';
   this.emotion=emotion;const target=expressions[emotion],factor=1-Math.exp(-dt/110);
   for(const key in target)this.face[key]=mix(this.face[key],target[key],factor);
   const p=this.pointerData,gaze=p&&info.curious?point(clamp((p.x-this.x-80)/35,-2.8,2.8),clamp((p.y-75)/45,-1.7,1.7)):point(this.facing*1.2,0);
   this.gazeTarget=gaze;this.gaze=blend(this.gaze,gaze,1-Math.exp(-dt/80));
   if(this.time>=this.blinkAt){this.blinkStart=this.time;this.blinkAt=this.time+2400+this.random()*3000;}
   return this.pose();
  }
  pose(){
   let feet=this.gait.feet.map(f=>({...f})),wave=0,head=this.face.head,tilt=this.facing*(Math.abs(this.v)/106)*(3+this.runMix*5),crouch=0,jump=0;
   const swing=this.gait.step,cycle=this.gait.phase;
   const flight=this.runMix>0.1&&feet.every(f=>!f.contact)?Math.sin(Math.PI*clamp((cycle-.56)/.22)):0;
   if(this.state==='greet'){
    const p=clamp(this.elapsed/1180);
    const nod=Math.sin(Math.PI*clamp((p-.16)/.58))**2;
    wave=this.mode==='signup'?.68*Math.sin(Math.PI*clamp((p-.20)/.52))**2:0;
    head+=nod*(this.mode==='login'?8:4);
   }
   if(this.state==='anticipate'){const e=Math.sin(Math.PI*clamp(this.elapsed/180));tilt+=1.5*e;crouch=e*.8;}
   let wrist=0;
   if(this.reaction){
    const p=this.reaction.elapsed/1120,e=ease(p/.16)*(1-ease((p-.82)/.18));
    feet=feet.map(f=>({...f,y:mix(f.y,ground,e),contact:f.contact||e===1}));tilt*=1-e;
    if(this.reaction.type===0){
     crouch+=3.4*Math.sin(Math.PI*clamp((p-.10)/.20))**2;
     jump=19*Math.sin(Math.PI*clamp((p-.31)/.31))**2;
     crouch+=4.2*Math.sin(Math.PI*clamp((p-.62)/.22))**2;
     feet=feet.map(f=>({...f,y:f.y-jump*1.1,contact:jump<.001&&f.contact}));head-=3*e;
    }else if(this.reaction.type===1){tilt+=Math.sin(p*Math.PI*3)*e*5;head-=Math.sin(p*Math.PI*3-.3)*e*5;wave+=.24*e;wrist=5*e;}
    else{head+=7*e;wave+=.36*e;wrist=8*e;}
   }
   const side=this.bodyFacing,hipWidth=9*(1-.18*Math.abs(side)),sway=swing?(swing.which===0?1:-1)*Math.sin(cycle*Math.PI)*.8:0;
   let height=46.6-this.runMix*3.6;
   // Supporting legs are almost straight at mid-stance. Only lower the pelvis
   // enough for actual reach, rather than forcing permanent deep knee flexion.
   feet.forEach((f,i)=>{const dx=f.x-this.x-(i===0?-hipWidth:hipWidth)-sway;const available=Math.sqrt(Math.max(1,46.7**2-dx*dx))+(ground-f.y);height=Math.min(height,available);});
   let hipY=ground-height+crouch-jump-flight*4.2;
   feet.forEach((f,i)=>{const dx=f.x-this.x-(i===0?-hipWidth:hipWidth)-sway;hipY=Math.max(hipY,f.y-Math.sqrt(Math.max(1,46.7**2-dx*dx)));});
   const pelvis=point(80+sway,hipY);
   const torso=point(pelvis.x,hipY-34);
   const legs=feet.map((f,i)=>{
    const hip=point(pelvis.x+(i===0?-hipWidth:hipWidth),hipY),ankle=point(f.x-this.x+80,f.y);
    const front=blend(ik(hip,ankle,upper,lower,1),ik(hip,ankle,upper,lower,-1),.5),profile=ik(hip,ankle,upper,lower,this.facing<0?1:-1);
    return {hip,knee:blend(front,profile,Math.abs(this.facing)),ankle,contact:f.contact,worldX:f.x,worldY:f.y,toe:f.contact?0:clamp((ground-f.y)*this.facing*.6,-12,12)};
   });
   const stride=(feet[0].x-feet[1].x+18)*.27;
   const shoulderY=hipY-45,leftShoulder=point(pelvis.x-27,shoulderY+.3*tilt),rightShoulder=point(pelvis.x+27,shoulderY-.3*tilt-wave*2);
   const drive=1+this.runMix*.45;
   const leftHand=point(leftShoulder.x-6-stride*drive,leftShoulder.y+29-this.runMix*8-Math.abs(stride)*.12);
   const rightRest=point(rightShoulder.x+6+stride*drive,rightShoulder.y+29-this.runMix*8-Math.abs(stride)*.12);
   const greet=Math.min(1,wave*1.5),rightHand=blend(rightRest,point(rightShoulder.x+18,rightShoulder.y-22),greet);
   const arm=(s,h,b,w)=>({shoulder:s,elbow:ik(s,h,18,20,b),hand:h,wrist:w});
   const blinkTime=this.time-this.blinkStart,blink=blinkTime>=0&&blinkTime<170?1-Math.sin(Math.PI*clamp(blinkTime/170))**2:1;
   const face={...this.face,eyeL:this.face.eyeL*blink,eyeR:this.face.eyeR*blink,gaze:{...this.gaze}};
   const faceSettling=Object.keys(expressions[this.emotion]).some(k=>Math.abs(this.face[k]-expressions[this.emotion][k])>.005);
   const gazeSettling=Math.hypot(this.gaze.x-this.gazeTarget.x,this.gaze.y-this.gazeTarget.y)>.03;
   const active=(this.state!=='idle'&&(this.state!=='calm'||!this.proximity().near))||!!this.reaction||this.held||!!this.gait.step||faceSettling||gazeSettling||Math.abs(this.facing)>.005||Math.abs(this.bodyFacing)>.005||this.runMix>.005||(blinkTime>=0&&blinkTime<190);
   return {x:this.x*this.scale,root:this.x,v:this.v,phase:this.reaction?'react':this.state,resumePhase:this.state,reaction:this.reaction?['jump','twist','shy'][this.reaction.type]:'none',emotion:this.emotion,active,sleepFor:clamp(this.blinkAt-this.time,60,5500),legs,pelvis,torso,torsoWidth:1-.10*Math.abs(side),headWidth:1-.06*Math.abs(this.facing),bodyTilt:tilt,headTilt:head,headX:this.facing*3,face,facing:this.facing,runMix:this.runMix,flight,walking:Math.abs(this.v)>2,cycleKind:this.gait.kind,leftArm:arm(leftShoulder,leftHand,1,-8+stride),rightArm:arm(rightShoulder,rightHand,-1,-12+wrist+wave*12),jump,crouch,feet,held:this.held};
  }
 }
 return {Clock,Gait,ik,expressions,ground,upper,lower};
})();
