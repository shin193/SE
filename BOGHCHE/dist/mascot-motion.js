/* Deterministic motion clock: reactions pause the route, never replace its position. */
globalThis.MascotMotion=(()=>{
 const duration=5350, clamp=n=>Math.max(0,Math.min(1,n));
 const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
 function route(t){
  if(t<200)return {fraction:0,walking:false,turn:-22*ease(t/200),phase:'ready',greet:0};
  if(t<1650)return {fraction:ease((t-200)/1450),walking:true,turn:-22,phase:'outbound',greet:0};
  if(t<3350)return {fraction:1,walking:false,turn:-22*(1-ease((t-1650)/250)),phase:'greeting',greet:t-1650};
  if(t<3600)return {fraction:1,walking:false,turn:180*ease((t-3350)/250),phase:'turning',greet:0};
  if(t<5050)return {fraction:1-ease((t-3600)/1450),walking:true,turn:180,phase:'returning',greet:0};
  return {fraction:0,walking:false,turn:180+180*ease((t-5050)/300),phase:'home',greet:0};
 }
 class Clock{
  constructor(){this.elapsed=duration;this.mode='login';this.lastMode=null;this.pending=null;this.reaction=null;this.previousReaction=-1;this.running=false;this.distance=0;this.targetDistance=0;}
  request(mode){
   if(mode===this.lastMode)return;this.lastMode=mode;
   if(!['login','signup'].includes(mode)){this.pending=null;return;}
   if(this.running||this.reaction){this.pending=mode;return;}
   this.begin(mode);
  }
  begin(mode){this.mode=mode;this.elapsed=0;this.running=true;this.pending=null;}
  setDistance(distance){this.targetDistance=Math.max(0,distance);if(!this.running&&!this.reaction)this.distance=this.targetDistance;}
  react(random=Math.random()){
   if(this.reaction)return false;
   const choices=[0,1,2].filter(n=>n!==this.previousReaction);const type=choices[Math.min(choices.length-1,Math.floor(clamp(random)*choices.length))];
   this.previousReaction=type;this.reaction={type,elapsed:0,duration:[780,900,960][type]};return true;
  }
  advance(dt){
   dt=Math.max(0,Math.min(dt,40));if(!this.reaction)this.distance+=(this.targetDistance-this.distance)*Math.min(1,dt/160);
   // Route time freezes during a reaction. Rapid clicks are ignored, with no queue.
   if(this.reaction){this.reaction.elapsed+=dt;if(this.reaction.elapsed>=this.reaction.duration)this.reaction=null;}
   else if(this.running){this.elapsed=Math.min(duration,this.elapsed+dt);if(this.elapsed===duration)this.running=false;}
   if(!this.running&&!this.reaction&&this.pending)this.begin(this.pending);
   return this.pose();
  }
  pose(){
   const r=route(this.elapsed),reaction=this.reaction;
   const p=reaction?clamp(reaction.elapsed/reaction.duration):0;
   const envelope=reaction?Math.sin(Math.PI*p)**2:0;
   const gait=r.walking?Math.sin(this.elapsed/95)*Math.sin(Math.PI*r.fraction):0;
   const fade=1-envelope;
   let leftLeg=25*gait*fade,rightLeg=-25*gait*fade,leftArm=-13*gait*fade,rightArm=65+13*gait*fade;
   let lift=r.walking?-Math.abs(gait)*2.4*fade:0,tilt=gait*1.8*fade,head=0,yaw=r.turn,cheeks=.6,smile=0;
   if(r.phase==='greeting'){
    const welcome=Math.sin(Math.PI*clamp(r.greet/1700));
    if(this.mode==='signup')rightArm=65+(Math.sin(r.greet/100)*15-73)*welcome*fade;
    else{head=Math.sin(Math.PI*clamp((r.greet-180)/650))*8*fade;rightArm=65-62*welcome*fade;}
   }
   if(reaction){
    smile=envelope;
    if(reaction.type===0){lift-=17*envelope;tilt-=4*Math.sin(2*Math.PI*p)*envelope;leftLeg-=10*envelope;rightLeg+=10*envelope;rightArm-=55*envelope;}
    if(reaction.type===1){tilt+=Math.sin(2*Math.PI*p)*18*envelope;yaw+=Math.sin(2*Math.PI*p)*45*envelope;leftArm-=20*envelope;rightArm+=15*envelope;}
    if(reaction.type===2){head+=12*envelope;rightArm=65*(1-envelope)+Math.sin(p*Math.PI*7)*12*envelope;cheeks+=.4*envelope;}
   }
   return {x:r.fraction*this.distance,leftLeg,rightLeg,leftArm,rightArm,lift,tilt,head,yaw,cheeks,smile,phase:r.phase,walking:r.walking,reaction:reaction?['jump','twist','shy'][reaction.type]:'none',active:this.running||Boolean(reaction),gaze:r.walking?1.3:0};
  }
 }
 return {Clock,route,duration};
})();
