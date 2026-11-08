(()=>{
 const button=document.querySelector('#auth-mascot'),lane=document.querySelector('.mascot-lane');
 if(!button||!lane)return;
 const clock=new MascotMotion.Clock(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const parts={pose:button.querySelector('.mascot-pose'),body:button.querySelector('.spool-character'),leftLeg:button.querySelector('.spool-leg-left'),rightLeg:button.querySelector('.spool-leg-right'),leftArm:button.querySelector('.spool-left-arm'),rightArm:button.querySelector('.spool-wave'),head:button.querySelector('.spool-head'),pupils:button.querySelectorAll('.spool-pupil'),cheeks:button.querySelectorAll('.spool-cheek'),mouth:button.querySelector('.spool-smile')};
 let raf=0,lastTime=null;
 function measure(){const title=document.querySelector('#auth-title').getBoundingClientRect(),box=lane.getBoundingClientRect();clock.setDistance(Math.max(0,title.left-box.left-button.offsetWidth-12));wake();}
 function draw(p){
  const quiet=reduced.matches;
  button.style.transform=`translateX(${quiet?0:p.x}px)`;
  parts.pose.style.transform=quiet?'none':`translateY(${p.lift}px) rotate(${p.tilt}deg)`;
  parts.body.style.transform=quiet?'none':`perspective(450px) rotateY(${p.yaw}deg)`;
  parts.leftLeg.style.transform=`rotate(${quiet?0:p.leftLeg}deg)`;parts.rightLeg.style.transform=`rotate(${quiet?0:p.rightLeg}deg)`;
  parts.leftArm.style.transform=`rotate(${quiet?0:p.leftArm}deg)`;parts.rightArm.style.transform=`rotate(${quiet?0:p.rightArm}deg)`;
  parts.head.style.transform=`rotate(${quiet?0:p.head}deg)`;
  parts.pupils.forEach(el=>el.style.transform=`translateX(${quiet?0:p.gaze}px)`);
  parts.cheeks.forEach(el=>el.style.opacity=String(p.cheeks));
  parts.mouth.setAttribute('d',p.smile>.25?'M64 80Q72 92 81 80':'M65 81Q72 88 80 81');
  button.dataset.phase=p.phase;button.dataset.reaction=p.reaction;button.dataset.walking=String(!quiet&&p.walking&&p.reaction==='none');
 }
 function frame(now){
  raf=0;if(document.hidden){lastTime=null;return;}
  const dt=lastTime===null?0:now-lastTime;lastTime=now;const pose=clock.advance(dt);draw(pose);
  if(pose.active)raf=requestAnimationFrame(frame);else lastTime=null;
 }
 function wake(){if(!raf&&!document.hidden){lastTime=null;raf=requestAnimationFrame(frame);}}
 function greet(mode){clock.request(mode);measure();wake();}
 window.addEventListener('boghche-greeting',event=>greet(event.detail));
 button.addEventListener('click',()=>{if(clock.react())wake();}); // Native button: mouse, touch, Enter and Space; no duplicate pointer handlers.
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastTime=null;}else wake();});
 reduced.addEventListener('change',()=>{draw(clock.pose());wake();});
 new ResizeObserver(measure).observe(document.querySelector('.form-heading'));
 document.fonts?.ready.then(measure);
 const initial=document.querySelector('.auth-shell').dataset.mode;if(initial)greet(initial);else{measure();draw(clock.pose());}
})();
