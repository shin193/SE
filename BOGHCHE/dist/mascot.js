(()=>{
 const button=document.querySelector('#auth-mascot'),lane=document.querySelector('.mascot-lane');
 if(!button||!lane)return;
 const clock=new MascotMotion.Clock({seed:Date.now()}),reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const parts={body:button.querySelector('.rig-torso'),head:button.querySelector('.rig-head'),face:button.querySelector('.rig-face'),legs:[...button.querySelectorAll('[data-leg]')],arms:[button.querySelector('.rig-left'),button.querySelector('.rig-right')],eyes:[button.querySelector('.eye-left'),button.querySelector('.eye-right')],pupils:button.querySelectorAll('.spool-pupil'),cheeks:button.querySelectorAll('.spool-cheek'),brows:button.querySelector('.spool-brows'),lids:button.querySelector('.spool-lids'),mouth:button.querySelector('.spool-smile'),tongue:button.querySelector('.spool-tongue'),shadow:button.querySelector('.mascot-ground')};
 let raf=0,timer=0,lastTime=null,neutral,scale=1,lastPointer=null;
 const fmt=n=>Number(n.toFixed(3)),pt=p=>fmt(p.x)+' '+fmt(p.y);
 function measure(){
  const box=lane.getBoundingClientRect();scale=button.offsetWidth/160;
  clock.setLayout(Math.max(0,box.width-84-button.offsetWidth-14),scale);
  const idle=new MascotMotion.Clock();idle.setLayout(0,scale);neutral=idle.pose();wake();
 }
 function limbPath(a,b,c){return 'M'+pt(a)+'L'+pt(b)+'L'+pt(c);}
 function draw(p){
  const quiet=reduced.matches,q=quiet?neutral:p;if(!q)return;
  button.style.transform='translateX('+fmt(quiet?clock.home*scale:p.x)+'px)';
  parts.body.setAttribute('transform','translate('+fmt(q.torso.x-80)+' '+fmt(q.pelvis.y-106)+') rotate('+fmt(q.bodyTilt)+' 80 98) translate(80 0) scale('+fmt(q.torsoWidth)+' 1) translate(-80 0)');
  parts.head.setAttribute('transform','translate('+fmt(q.torso.x-80+q.headX*.35)+' '+fmt(q.pelvis.y-106)+') rotate('+fmt(q.headTilt)+' 80 70) translate(80 0) scale('+fmt(q.headWidth)+' 1) translate(-80 0)');
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
  const f=p.face,g=f.gaze;
  parts.eyes[0].setAttribute('transform','translate(66 70) scale(1 '+fmt(quiet?.95:Math.max(.04,f.eyeL))+')');
  parts.eyes[1].setAttribute('transform','translate(91 70) scale(1 '+fmt(quiet?.95:Math.max(.04,f.eyeR))+')');
  parts.pupils.forEach(el=>el.setAttribute('transform','translate('+fmt(quiet?0:g.x)+' '+fmt(quiet?0:g.y)+')'));
  parts.cheeks.forEach(el=>el.style.opacity=String(f.cheek));
  const yL=60+f.browL,yR=60+f.browR,eyeL=quiet?.95:f.eyeL,eyeR=quiet?.95:f.eyeR;
  parts.brows.setAttribute('d','M60 '+fmt(yL+f.angleL)+'Q66 '+fmt(yL-3)+' 72 '+fmt(yL-f.angleL)+'M85 '+fmt(yR-f.angleR)+'Q91 '+fmt(yR-3)+' 97 '+fmt(yR+f.angleR));
  parts.lids.setAttribute('d','M61 '+fmt(70-6*eyeL)+'Q66 '+fmt(68-6*eyeL)+' 71 '+fmt(70-6*eyeL)+'M86 '+fmt(70-6*eyeR)+'Q91 '+fmt(68-6*eyeR)+' 96 '+fmt(70-6*eyeR));
  const w=f.width,y=81,smile=f.smile,open=f.open;
  parts.mouth.setAttribute('d','M'+fmt(79-w)+' '+y+'Q79 '+fmt(y+smile*5)+' '+fmt(79+w)+' '+y+'Q79 '+fmt(y+smile*5+open*12)+' '+fmt(79-w)+' '+y+'Z');
  parts.tongue.setAttribute('d','M'+fmt(79-w*.48)+' '+fmt(y+smile*3+open*7)+'Q79 '+fmt(y+smile*3+open*10)+' '+fmt(79+w*.48)+' '+fmt(y+smile*3+open*7));parts.tongue.style.opacity=String(open*.7);
  parts.shadow.style.transform='scaleX('+(quiet?1:1-(p.jump+p.flight*4)/95)+')';parts.shadow.style.opacity=String(.62-(quiet?0:(p.jump+p.flight*4)/70));
  button.dataset.phase=p.phase;button.dataset.resumePhase=p.resumePhase;button.dataset.reaction=p.reaction;button.dataset.emotion=p.emotion;button.dataset.gait=p.cycleKind;button.dataset.walking=String(!quiet&&p.walking);
 }
 function frame(now){
  raf=0;if(document.hidden){lastTime=null;return;}
  const dt=lastTime===null?0:now-lastTime;lastTime=now;const pose=clock.advance(dt);draw(pose);
  if(pose.active)raf=requestAnimationFrame(frame);else timer=setTimeout(()=>{timer=0;raf=requestAnimationFrame(frame);},pose.sleepFor);
 }
 function wake(){clearTimeout(timer);timer=0;if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
 function greet(mode){measure();clock.request(mode);wake();}
 window.addEventListener('boghche-greeting',event=>greet(event.detail));
 // No pointer interception on the page: scroll/touch remains native.
 document.addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse'||!fine.matches||reduced.matches)return;
  const box=lane.getBoundingClientRect(),x=(event.clientX-box.left)/scale,y=(event.clientY-box.top)/scale,now=performance.now();
  const delta=lastPointer&&now-lastPointer.time<220?{x:x-lastPointer.x,y:y-lastPointer.y}:{x:0,y:0};
  lastPointer={x,y,time:now};clock.pointer(x,y,delta.x,delta.y);wake();
 },{passive:true});
 document.addEventListener('pointerout',event=>{if(!event.relatedTarget){clock.leave();lastPointer=null;wake();}},{passive:true});
 button.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'){clock.press(true);button.setPointerCapture?.(event.pointerId);wake();}});
 function release(){clock.press(false);wake();}
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);
 window.addEventListener('pointerup',()=>{if(clock.held)release();},{passive:true});
 button.addEventListener('click',()=>{clock.press(false);if(clock.react())wake();}); // Includes Enter/Space and touch taps.
 window.addEventListener('blur',()=>{clock.leave();clock.press(false);lastPointer=null;});
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);clearTimeout(timer);raf=0;timer=0;lastTime=null;if(!document.hidden)wake();});
 reduced.addEventListener('change',()=>{clock.leave();lastPointer=null;draw(clock.pose());wake();});
 new ResizeObserver(measure).observe(document.querySelector('.form-heading'));
 document.fonts?.ready.then(measure);
 const initial=document.querySelector('.auth-shell').dataset.mode;if(initial)greet(initial);else{measure();draw(clock.pose());}
})();
