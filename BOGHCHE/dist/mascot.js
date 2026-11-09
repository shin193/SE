(()=>{
 const button=document.querySelector('#auth-mascot'),lane=document.querySelector('.mascot-lane');
 if(!button||!lane)return;
 const clock=new MascotMotion.Clock(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const parts={body:button.querySelector('.rig-torso'),head:button.querySelector('.rig-head'),face:button.querySelector('.rig-face'),legs:[...button.querySelectorAll('[data-leg]')],arms:[button.querySelector('.rig-left'),button.querySelector('.rig-right')],pupils:button.querySelectorAll('.spool-pupil'),cheeks:button.querySelectorAll('.spool-cheek'),mouth:button.querySelector('.spool-smile'),shadow:button.querySelector('.mascot-ground')};
 let raf=0,lastTime=null,origin=0,neutral;
 const fmt=n=>Number(n.toFixed(3)),pt=p=>fmt(p.x)+' '+fmt(p.y);
 function measure(){
  const box=lane.getBoundingClientRect();
  // Reserve the widest title even before it is selected. Switching forms
  // mid-step cannot move home or put the new title across an existing route.
  const available=Math.max(0,box.width-84-button.offsetWidth-14);
  origin=Math.max(0,available-82);
  const travel=Math.min(82,available);clock.setDistance(travel,button.offsetWidth/160);
  const idle=new MascotMotion.Clock();idle.setDistance(0,button.offsetWidth/160);neutral=idle.pose();wake();
 }
 function limbPath(a,b,c){return 'M'+pt(a)+'L'+pt(b)+'L'+pt(c);}
 function draw(p){
  const quiet=reduced.matches,q=quiet?neutral:p;if(!q)return;
  button.style.transform='translateX('+fmt(origin+(quiet?0:p.x))+'px)';
  parts.body.setAttribute('transform','translate('+fmt(q.torso.x-80)+' '+fmt(q.torso.y-73)+') rotate('+fmt(q.bodyTilt)+' 80 100) translate(80 0) scale('+fmt(q.torsoWidth)+' 1) translate(-80 0)');
  parts.head.setAttribute('transform','translate('+fmt(q.torso.x-80+q.headX*.35)+' '+fmt(q.torso.y-73)+') rotate('+fmt(q.headTilt)+' 80 72) translate(80 0) scale('+fmt(q.headWidth)+' 1) translate(-80 0)');
  parts.face.setAttribute('transform','translate('+fmt(q.headX)+' 0)');
  parts.legs.forEach((el,i)=>{
   const l=q.legs[i];el.querySelector('.leg-bone').setAttribute('d',limbPath(l.hip,l.knee,l.ankle));
   const knee=el.querySelector('.knee-stitch');knee.setAttribute('cx',fmt(l.knee.x));knee.setAttribute('cy',fmt(l.knee.y));
   el.querySelector('.shoe').setAttribute('transform','translate('+pt(l.ankle)+') rotate('+fmt(l.toe)+')');
   el.dataset.contact=String(l.contact);
  });
  parts.arms.forEach((el,i)=>{
   const a=i?q.rightArm:q.leftArm;el.querySelector('.arm-bone').setAttribute('d',limbPath(a.shoulder,a.elbow,a.hand));
   el.querySelector('.hand').setAttribute('transform','translate('+pt(a.hand)+') rotate('+fmt(a.wrist)+')');
  });
  parts.pupils.forEach(el=>el.setAttribute('transform','translate('+fmt(quiet?0:q.facing*1.2)+' 0)'));
  parts.cheeks.forEach(el=>el.style.opacity=String(p.cheeks));
  // Continuous facial change; no threshold switch between two drawings.
  const smile=Math.min(1,p.smile);parts.mouth.setAttribute('d','M71 85Q79 '+fmt(91+smile*6)+' 87 85');
  const shadowScale=quiet?1:1-p.jump/80;
  parts.shadow.style.transform='scaleX('+shadowScale+')';parts.shadow.style.opacity=String(.7-p.jump/60);
  button.dataset.phase=p.phase;button.dataset.reaction=p.reaction;button.dataset.walking=String(!quiet&&p.walking&&p.reaction==='none');
 }
 function frame(now){
  raf=0;if(document.hidden){lastTime=null;return;}
  const dt=lastTime===null?0:now-lastTime;lastTime=now;const pose=clock.advance(dt);draw(pose);
  if(pose.active)raf=requestAnimationFrame(frame);else lastTime=null;
 }
 function wake(){if(!raf&&!document.hidden){lastTime=null;raf=requestAnimationFrame(frame);}}
 function greet(mode){measure();clock.request(mode);wake();}
 window.addEventListener('boghche-greeting',event=>greet(event.detail));
 button.addEventListener('click',()=>{if(clock.react())wake();}); // Native mouse, touch, Enter and Space.
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastTime=null;}else wake();});
 reduced.addEventListener('change',()=>{draw(clock.pose());wake();});
 new ResizeObserver(measure).observe(document.querySelector('.form-heading'));
 document.fonts?.ready.then(measure);
 const initial=document.querySelector('.auth-shell').dataset.mode;if(initial)greet(initial);else{measure();draw(clock.pose());}
})();
