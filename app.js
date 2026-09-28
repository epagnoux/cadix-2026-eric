'use strict';
const $=id=>document.getElementById(id);
const viewer=$('viewer');
let photos=[],index=0,timer=null,lastFocus=null;
const dayFormat=new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'});
const takenLabel=p=>p.taken?dateFormat.format(new Date(p.taken)):'date non renseignée';
const dateFormat=new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'});
function tile(photo){
 const button=document.createElement('button');button.className='tile';button.style.setProperty('--ratio',photo.width/photo.height);
 button.setAttribute('aria-label',`Ouvrir la photo ${photo.index+1}, prise le ${takenLabel(photo)}`);
 const img=document.createElement('img');img.src=photo.src;img.alt=photo.caption||`Cadix, ${takenLabel(photo)}`;img.width=photo.width;img.height=photo.height;img.loading=photo.index<3?'eager':'lazy';img.decoding='async';button.append(img);button.addEventListener('click',()=>openPhoto(photo.index));return button;
}
function addMosaic(container,items,kind){if(!items.length)return;const size=kind==='route'?'':` ${['','one','two','three','four','five','six'][items.length]}`;const grid=document.createElement('div');grid.className=`mosaic${size} ${kind||''}`;items.forEach(p=>grid.append(tile(p)));container.append(grid)}
function addJustified(container, items, counts){
 const gallery=document.createElement('div');gallery.className='justified-gallery';let start=0;
 for(const count of counts){
  const row=document.createElement('div');row.className='justified-row';
  items.slice(start,start+count).forEach(photo=>row.append(tile(photo)));start+=count;gallery.append(row);
 }
 if(start<items.length){const row=document.createElement('div');row.className='justified-row';items.slice(start).forEach(photo=>row.append(tile(photo)));gallery.append(row)}
 container.append(gallery);
}
function fitJustifiedRows(scope=document){
 scope.querySelectorAll('.justified-row').forEach(row=>{
  const tiles=[...row.children], styles=getComputedStyle(row), gap=parseFloat(styles.columnGap)||0;
  const ratio=tiles.reduce((sum,tile)=>sum+parseFloat(tile.style.getPropertyValue('--ratio')),0);
  if(ratio) row.style.height=`${(row.clientWidth-gap*(tiles.length-1))/ratio}px`;
 });
}
function render(data){
 const fragment=document.createDocumentFragment();
 for(const group of data.groups){
  const section=document.createElement('section');section.className='publication';
  const info=document.createElement('div');info.className='publication-info';
  const label=document.createElement('p');label.textContent=group.title||`${group.contributor} · ${group.photos.length} photo${group.photos.length>1?'s':''}`;
  const time=document.createElement('time');time.textContent=group.note||'Cadix 2026';info.append(label,time);
  const container=document.createElement('div');container.className='photos';
  const items=group.photos.map(p=>{const photo={...p,index:photos.length};photos.push(photo);return photo});
  if(group.layout==='justified'){addJustified(container,items,group.rows||[items.length])}
  else if(items.length===1){addMosaic(container,items,'single')}
  else{let pending=[];const flush=()=>{while(pending.length){addMosaic(container,pending.splice(0,6))}};for(const photo of items){if(photo.width/photo.height>2.5){flush();addMosaic(container,[photo],'panorama')}else pending.push(photo)}flush()}
  section.append(info,container);fragment.append(section);
 }
 document.querySelector('.cover').src=photos[0]?.src||'';const makeSlide=(photo,i)=>{const img=document.createElement('img');img.className='photo-slide';img.src=photo.src;img.alt=photo.caption||`Photo ${i+1} de Cadix`;img.loading='eager';img.decoding='async';return img};photoTrack.replaceChildren(makeSlide(photos[photos.length-1],photos.length-1),...photos.map(makeSlide),makeSlide(photos[0],0));
 $('album').replaceChildren(fragment);fitJustifiedRows($('album'));$('total').textContent=`${photos.length} photos`;
 const id=decodeURIComponent(location.hash.slice(1));const found=photos.findIndex(p=>p.id===id);if(found>=0)openPhoto(found);
}
function setInfoVisible(visible){viewer.classList.toggle('is-info-visible',visible);$('photo-info').setAttribute('aria-hidden',String(!visible))}
function toggleImmersive(){const immersive=viewer.classList.toggle('is-immersive');setInfoVisible(!immersive)}
function resetZoom(){if(!fullPhoto)return;fullPhoto.style.setProperty('--photo-scale',1);fullPhoto.style.setProperty('--photo-x','0px');fullPhoto.style.setProperty('--photo-y','0px')}
function fitPhoto(){fullPhoto.classList.add('zoom-settle');resetZoom();fullPhoto.addEventListener('transitionend',()=>fullPhoto.classList.remove('zoom-settle'),{once:true})}
function updateDetails(p){$('counter').textContent=`${index+1} / ${photos.length}`;$('taken').textContent=takenLabel(p);$('taken').dateTime=p.taken||'';$('caption').textContent=p.caption||'';$('download').href=p.src;$('download').download=p.src.split('/').pop();history.replaceState(null,'','#'+encodeURIComponent(p.id))}
function activatePhoto(i){index=(i+photos.length)%photos.length;fullPhoto?.classList.remove('is-active');fullPhoto=photoTrack.children[index+1];fullPhoto.classList.add('is-active');updateDetails(photos[index])}
function showPhoto(i){activatePhoto(i);resetZoom();setInfoVisible(false);requestAnimationFrame(()=>{photoTrack.scrollLeft=(index+1)*photoTrack.clientWidth})}
let programmaticScroll=false;
function changePhoto(direction){stop();const wrapsForward=direction>0&&index===photos.length-1,wrapsBack=direction<0&&index===0,target=wrapsForward?photos.length+1:wrapsBack?0:index+direction+1;programmaticScroll=true;photoTrack.scrollTo({left:target*photoTrack.clientWidth,behavior:'smooth'});setTimeout(()=>{programmaticScroll=false},350)}
function openPhoto(i){if(!photos.length)return;lastFocus=document.activeElement;if(!viewer.open){viewer.showModal();document.body.classList.add('modal-open')}showPhoto(i)}
function stop(){clearInterval(timer);timer=null;$('play').setAttribute('aria-label','Lancer le diaporama');$('play-path').setAttribute('d','m9 5 11 7-11 7Z')}
function play(){if(timer){stop();return}timer=setInterval(()=>changePhoto(1),4500);$('play').setAttribute('aria-label','Mettre le diaporama en pause');$('play-path').setAttribute('d','M8 5v14M16 5v14')}
function close(){stop();viewer.close()}
viewer.addEventListener('close',()=>{stop();viewer.classList.remove('is-immersive');setInfoVisible(false);document.body.classList.remove('modal-open');history.replaceState(null,'',location.pathname+location.search);lastFocus?.focus()});
$('close').addEventListener('click',close);$('next').addEventListener('click',()=>changePhoto(1));$('previous').addEventListener('click',()=>changePhoto(-1));$('play').addEventListener('click',play);$('start').addEventListener('click',()=>{openPhoto(0);if(photos.length)play()});
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();changePhoto(1)}else if(e.key==='ArrowLeft'){e.preventDefault();changePhoto(-1)}else if(e.code==='Space'&&e.target===viewer){e.preventDefault();play()}});
let fullPhoto=null;const photoTrack=$('photo-track');let gesture=null,ignoreClickUntil=0,scrollTimer=null,stageClickTimer=null,touchStart=null,lastTap=null,pointerStart=null,pointerTap=null;
const distance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
const scale=()=>Number.parseFloat(fullPhoto.style.getPropertyValue('--photo-scale'))||1;
const position=name=>Number.parseFloat(fullPhoto.style.getPropertyValue(name))||0;
const transform=(zoom,x,y)=>{fullPhoto.style.setProperty('--photo-scale',zoom);fullPhoto.style.setProperty('--photo-x',`${x}px`);fullPhoto.style.setProperty('--photo-y',`${y}px`)};
function zoomAt(clientX,clientY,zoom){const current=scale(),x=position('--photo-x'),y=position('--photo-y'),rect=fullPhoto.getBoundingClientRect(),centerX=rect.left+rect.width/2-x,centerY=rect.top+rect.height/2-y,pointX=(clientX-centerX-x)/current,pointY=(clientY-centerY-y)/current,limitX=fullPhoto.clientWidth*(zoom-1)/2,limitY=fullPhoto.clientHeight*(zoom-1)/2;transform(zoom,Math.max(-limitX,Math.min(limitX,clientX-centerX-pointX*zoom)),Math.max(-limitY,Math.min(limitY,clientY-centerY-pointY*zoom)))}
function startPinch(touches){const zoom=scale(),x=position('--photo-x'),y=position('--photo-y'),rect=fullPhoto.getBoundingClientRect(),midX=(touches[0].clientX+touches[1].clientX)/2,midY=(touches[0].clientY+touches[1].clientY)/2,centerX=rect.left+rect.width/2-x,centerY=rect.top+rect.height/2-y;return{type:'pinch',distance:distance(touches),scale:zoom,centerX,centerY,pointX:(midX-centerX-x)/zoom,pointY:(midY-centerY-y)/zoom}}
viewer.querySelector('.stage').addEventListener('click',e=>{if(e.target.closest('button,a')||Date.now()<ignoreClickUntil)return;clearTimeout(stageClickTimer);stageClickTimer=setTimeout(toggleImmersive,550)});
photoTrack.addEventListener('dblclick',e=>{if(e.target.closest('.photo-slide')){clearTimeout(stageClickTimer);e.preventDefault();fitPhoto()}},{passive:false});
photoTrack.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')pointerStart={x:e.clientX,y:e.clientY,time:Date.now()}},{passive:true});
photoTrack.addEventListener('pointermove',e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>28)pointerStart=null},{passive:true});
photoTrack.addEventListener('pointerup',e=>{if(e.pointerType!=='touch'||!pointerStart)return;const now=Date.now(),tap=pointerStart;pointerStart=null;if(now-tap.time>300)return;if(pointerTap&&now-pointerTap.time<450&&Math.hypot(tap.x-pointerTap.x,tap.y-pointerTap.y)<42){clearTimeout(stageClickTimer);pointerTap=null;lastTap=null;gesture=null;ignoreClickUntil=now+500;fitPhoto();return}pointerTap={x:tap.x,y:tap.y,time:now};setTimeout(()=>{if(pointerTap?.time===now)pointerTap=null},480)},{passive:true});
photoTrack.addEventListener('scroll',()=>{clearTimeout(scrollTimer);const rawIndex=Math.round(photoTrack.scrollLeft/photoTrack.clientWidth),nextIndex=rawIndex===0?photos.length-1:rawIndex===photos.length+1?0:rawIndex-1;if(nextIndex!==index){activatePhoto(nextIndex);resetZoom();setInfoVisible(false)}scrollTimer=setTimeout(()=>{if(rawIndex===0)photoTrack.scrollLeft=photos.length*photoTrack.clientWidth;else if(rawIndex===photos.length+1)photoTrack.scrollLeft=photoTrack.clientWidth;programmaticScroll=false},80)},{passive:true});
function interruptScroll(){if(!programmaticScroll)return;photoTrack.scrollLeft=photoTrack.scrollLeft;programmaticScroll=false}
photoTrack.addEventListener('wheel',e=>{interruptScroll();if(!e.ctrlKey)return;e.preventDefault();zoomAt(e.clientX,e.clientY,Math.min(4,Math.max(1,scale()*Math.exp(-e.deltaY*.01))))},{passive:false});
let macPinch=null;
document.addEventListener('gesturestart',e=>{if(!viewer.open||!fullPhoto)return;e.preventDefault();interruptScroll();macPinch={scale:scale(),x:e.clientX,y:e.clientY}},{passive:false});
document.addEventListener('gesturechange',e=>{if(!macPinch)return;e.preventDefault();zoomAt(e.clientX,e.clientY,Math.min(4,Math.max(1,macPinch.scale*e.scale)) )},{passive:false});
document.addEventListener('gestureend',e=>{if(!macPinch)return;e.preventDefault();macPinch=null;if(scale()<1.06)fitPhoto()},{passive:false});
photoTrack.addEventListener('touchstart',e=>{interruptScroll();const target=e.target.closest('.photo-slide');if(target)fullPhoto=target;if(e.touches.length===1){const t=e.touches[0];touchStart={x:t.clientX,y:t.clientY,time:Date.now()};if(lastTap)clearTimeout(stageClickTimer)}if(e.touches.length===2){gesture=startPinch(e.touches);return}if(scale()>1){const t=e.touches[0];gesture={type:'pan',x:t.clientX,y:t.clientY,baseX:position('--photo-x'),baseY:position('--photo-y')}}},{passive:true});
photoTrack.addEventListener('touchmove',e=>{if(touchStart&&e.touches[0]&&Math.hypot(e.touches[0].clientX-touchStart.x,e.touches[0].clientY-touchStart.y)>14)touchStart=null;if(!gesture)return;e.preventDefault();if(e.touches.length===2){if(gesture.type!=='pinch')gesture=startPinch(e.touches);const zoom=Math.min(4,Math.max(1,gesture.scale*distance(e.touches)/gesture.distance)),midX=(e.touches[0].clientX+e.touches[1].clientX)/2,midY=(e.touches[0].clientY+e.touches[1].clientY)/2,limitX=fullPhoto.clientWidth*(zoom-1)/2,limitY=fullPhoto.clientHeight*(zoom-1)/2,x=Math.max(-limitX,Math.min(limitX,midX-gesture.centerX-gesture.pointX*zoom)),y=Math.max(-limitY,Math.min(limitY,midY-gesture.centerY-gesture.pointY*zoom));transform(zoom,x,y);return}const t=e.touches[0],zoom=scale(),limitX=fullPhoto.clientWidth*(zoom-1)/2,limitY=fullPhoto.clientHeight*(zoom-1)/2;transform(zoom,Math.max(-limitX,Math.min(limitX,gesture.baseX+t.clientX-gesture.x)),Math.max(-limitY,Math.min(limitY,gesture.baseY+t.clientY-gesture.y)))},{passive:false});
photoTrack.addEventListener('touchend',e=>{if(e.touches.length)return;const now=Date.now(),tap=touchStart;touchStart=null;if(tap&&now-tap.time<280){if(lastTap&&now-lastTap.time<360&&Math.hypot(tap.x-lastTap.x,tap.y-lastTap.y)<32){clearTimeout(stageClickTimer);lastTap=null;gesture=null;ignoreClickUntil=now+450;fitPhoto();return}lastTap={x:tap.x,y:tap.y,time:now};setTimeout(()=>{if(lastTap?.time===now)lastTap=null},380)}if(!gesture)return;const ended=gesture;gesture=null;ignoreClickUntil=now+450;if(ended.type==='pinch'&&scale()<1.06)fitPhoto()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
const resizeObserver=new ResizeObserver(()=>fitJustifiedRows($('album')));
resizeObserver.observe($('album'));
fetch('album.json').then(r=>{if(!r.ok)throw Error('album');return r.json()}).then(render).catch(()=>{$('album').innerHTML='<p class="loading" role="alert">Impossible de charger l’album. <a href="">Réessayer</a></p>';$('start').disabled=true});
