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
 document.querySelector('.cover').src=photos[0]?.src||'';
 $('album').replaceChildren(fragment);fitJustifiedRows($('album'));$('total').textContent=`${photos.length} photos`;
 const id=decodeURIComponent(location.hash.slice(1));const found=photos.findIndex(p=>p.id===id);if(found>=0)openPhoto(found);
}
function setInfoVisible(visible){viewer.classList.toggle('is-info-visible',visible);$('photo-info').setAttribute('aria-hidden',String(!visible))}
function toggleImmersive(){const immersive=viewer.classList.toggle('is-immersive');setInfoVisible(!immersive)}
function resetZoom(){const img=$('full-photo');img.style.setProperty('--photo-scale',1);img.style.setProperty('--photo-x','0px');img.style.setProperty('--photo-y','0px')}
function fitPhoto(){fullPhoto.classList.add('zoom-settle');resetZoom();fullPhoto.addEventListener('transitionend',()=>fullPhoto.classList.remove('zoom-settle'),{once:true})}
function showPhoto(i){index=(i+photos.length)%photos.length;const p=photos[index],previous=photos[(index-1+photos.length)%photos.length],next=photos[(index+1)%photos.length],img=$('full-photo');resetZoom();setInfoVisible(false);img.src=p.src;img.alt=p.caption||`Photo ${index+1} de Cadix`;$('previous-photo').src=previous.src;$('previous-photo').alt='';$('next-photo').src=next.src;$('next-photo').alt='';$('counter').textContent=`${index+1} / ${photos.length}`;$('taken').textContent=takenLabel(p);$('taken').dateTime=p.taken||'';$('caption').textContent=p.caption||'';$('download').href=p.src;$('download').download=p.src.split('/').pop();history.replaceState(null,'','#'+encodeURIComponent(p.id));for(const adjacent of [$('previous-photo'),$('next-photo')])adjacent.decode().catch(()=>{})}
let isSliding=false;
function settleTrack(x,onDone){const track=$('photo-track');track.style.transition='transform .28s cubic-bezier(.2,.7,.2,1)';track.style.setProperty('--swipe-x',`${x}px`);track.addEventListener('transitionend',()=>{track.style.transition='none';onDone?.();track.style.setProperty('--swipe-x','0px');requestAnimationFrame(()=>{track.style.transition=''})},{once:true})}
function changePhoto(direction){if(isSliding)return;stop();isSliding=true;const width=viewer.querySelector('.stage').clientWidth;settleTrack(-direction*width,()=>{showPhoto(index+direction);isSliding=false})}
function openPhoto(i){if(!photos.length)return;lastFocus=document.activeElement;if(!viewer.open){viewer.showModal();document.body.classList.add('modal-open')}showPhoto(i)}
function stop(){clearInterval(timer);timer=null;$('play').setAttribute('aria-label','Lancer le diaporama');$('play-path').setAttribute('d','m9 5 11 7-11 7Z')}
function play(){if(timer){stop();return}timer=setInterval(()=>changePhoto(1),4500);$('play').setAttribute('aria-label','Mettre le diaporama en pause');$('play-path').setAttribute('d','M8 5v14M16 5v14')}
function close(){stop();viewer.close()}
viewer.addEventListener('close',()=>{stop();viewer.classList.remove('is-immersive');setInfoVisible(false);document.body.classList.remove('modal-open');history.replaceState(null,'',location.pathname+location.search);lastFocus?.focus()});
$('close').addEventListener('click',close);$('next').addEventListener('click',()=>changePhoto(1));$('previous').addEventListener('click',()=>changePhoto(-1));$('play').addEventListener('click',play);$('start').addEventListener('click',()=>{openPhoto(0);if(photos.length)play()});
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();changePhoto(1)}else if(e.key==='ArrowLeft'){e.preventDefault();changePhoto(-1)}else if(e.code==='Space'&&e.target===viewer){e.preventDefault();play()}});
const fullPhoto=$('full-photo');let gesture=null,ignoreClickUntil=0;
const distance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
const scale=()=>Number.parseFloat(fullPhoto.style.getPropertyValue('--photo-scale'))||1;
const position=name=>Number.parseFloat(fullPhoto.style.getPropertyValue(name))||0;
const transform=(zoom,x,y)=>{fullPhoto.style.setProperty('--photo-scale',zoom);fullPhoto.style.setProperty('--photo-x',`${x}px`);fullPhoto.style.setProperty('--photo-y',`${y}px`)};
function startPinch(touches){const zoom=scale(),x=position('--photo-x'),y=position('--photo-y'),rect=fullPhoto.getBoundingClientRect(),midX=(touches[0].clientX+touches[1].clientX)/2,midY=(touches[0].clientY+touches[1].clientY)/2,centerX=rect.left+rect.width/2-x,centerY=rect.top+rect.height/2-y;return{type:'pinch',distance:distance(touches),scale:zoom,centerX,centerY,pointX:(midX-centerX-x)/zoom,pointY:(midY-centerY-y)/zoom}}
viewer.querySelector('.stage').addEventListener('click',e=>{if(e.target.closest('button,a')||Date.now()<ignoreClickUntil)return;toggleImmersive()});
fullPhoto.addEventListener('touchstart',e=>{if(isSliding)return;clearTimeout(wheelTimer);const track=$('photo-track');track.style.transition='none';track.style.setProperty('--swipe-x','0px');if(e.touches.length===2){gesture=startPinch(e.touches);return}const t=e.touches[0];gesture={type:scale()>1?'pan':'swipe',x:t.clientX,y:t.clientY,baseX:position('--photo-x'),baseY:position('--photo-y'),time:Date.now()}},{passive:true});
fullPhoto.addEventListener('touchmove',e=>{if(!gesture)return;e.preventDefault();if(e.touches.length===2){if(gesture.type!=='pinch')gesture=startPinch(e.touches);const zoom=Math.min(4,Math.max(1,gesture.scale*distance(e.touches)/gesture.distance)),midX=(e.touches[0].clientX+e.touches[1].clientX)/2,midY=(e.touches[0].clientY+e.touches[1].clientY)/2,limitX=fullPhoto.clientWidth*(zoom-1)/2,limitY=fullPhoto.clientHeight*(zoom-1)/2,x=Math.max(-limitX,Math.min(limitX,midX-gesture.centerX-gesture.pointX*zoom)),y=Math.max(-limitY,Math.min(limitY,midY-gesture.centerY-gesture.pointY*zoom));transform(zoom,x,y);return}const t=e.touches[0];if(gesture.type==='swipe'){$('photo-track').style.setProperty('--swipe-x',`${t.clientX-gesture.x}px`);return}if(gesture.type==='pan'){const zoom=scale(),limitX=fullPhoto.clientWidth*(zoom-1)/2,limitY=fullPhoto.clientHeight*(zoom-1)/2;transform(zoom,Math.max(-limitX,Math.min(limitX,gesture.baseX+t.clientX-gesture.x)),Math.max(-limitY,Math.min(limitY,gesture.baseY+t.clientY-gesture.y))) }},{passive:false});
fullPhoto.addEventListener('touchend',e=>{if(e.touches.length)return;if(!gesture)return;const ended=gesture;gesture=null;ignoreClickUntil=Date.now()+450;if(ended.type==='pinch'){if(scale()<1.06)fitPhoto();return}const t=e.changedTouches[0],dx=t.clientX-ended.x,dy=t.clientY-ended.y;if(ended.type==='swipe'&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)){changePhoto(dx<0?1:-1);return}if(ended.type==='swipe')settleTrack(0);if(ended.type==='swipe'&&Math.abs(dx)<12&&Math.abs(dy)<12&&Date.now()-ended.time<350)toggleImmersive()},{passive:true});
let wheelOffset=0,wheelTimer=null;
viewer.querySelector('.stage').addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||scale()>1||isSliding)return;e.preventDefault();const track=$('photo-track');if(!wheelTimer){track.style.transition='none';track.style.setProperty('--swipe-x','0px')}const width=viewer.querySelector('.stage').clientWidth;wheelOffset=Math.max(-width*.85,Math.min(width*.85,wheelOffset-e.deltaX));track.style.setProperty('--swipe-x',`${wheelOffset}px`);clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{if(Math.abs(wheelOffset)>55)changePhoto(wheelOffset<0?1:-1);else settleTrack(0);wheelOffset=0;wheelTimer=null},90)},{passive:false});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
const resizeObserver=new ResizeObserver(()=>fitJustifiedRows($('album')));
resizeObserver.observe($('album'));
fetch('album.json').then(r=>{if(!r.ok)throw Error('album');return r.json()}).then(render).catch(()=>{$('album').innerHTML='<p class="loading" role="alert">Impossible de charger l’album. <a href="">Réessayer</a></p>';$('start').disabled=true});
