'use strict';
const $=id=>document.getElementById(id);
const viewer=$('viewer');
let photos=[],index=0,timer=null,lastFocus=null;
const dayFormat=new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'});
const takenLabel=p=>p.taken?dateFormat.format(new Date(p.taken)):'date non renseignée';
const dateFormat=new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'});
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
function showPhoto(i){index=(i+photos.length)%photos.length;const p=photos[index];const img=$('full-photo');img.src=p.src;img.alt=p.caption||`Photo ${index+1} de Cadix`;$('counter').textContent=`${index+1} / ${photos.length}`;$('taken').textContent=takenLabel(p);$('taken').dateTime=p.taken||'';$('caption').textContent=p.caption||'';$('download').href=p.src;$('download').download=p.src.split('/').pop();history.replaceState(null,'','#'+encodeURIComponent(p.id));const preload=new Image();preload.src=photos[(index+1)%photos.length].src}
function openPhoto(i){if(!photos.length)return;lastFocus=document.activeElement;if(!viewer.open){viewer.showModal();document.body.classList.add('modal-open')}showPhoto(i);$('close').focus()}
function stop(){clearInterval(timer);timer=null;$('play').setAttribute('aria-label','Lancer le diaporama');$('play-path').setAttribute('d','m9 5 11 7-11 7Z')}
function play(){if(timer){stop();return}timer=setInterval(()=>showPhoto(index+1),4500);$('play').setAttribute('aria-label','Mettre le diaporama en pause');$('play-path').setAttribute('d','M8 5v14M16 5v14')}
function close(){stop();viewer.close()}
viewer.addEventListener('close',()=>{stop();document.body.classList.remove('modal-open');history.replaceState(null,'',location.pathname+location.search);lastFocus?.focus()});
$('close').addEventListener('click',close);$('next').addEventListener('click',()=>{stop();showPhoto(index+1)});$('previous').addEventListener('click',()=>{stop();showPhoto(index-1)});$('play').addEventListener('click',play);$('start').addEventListener('click',()=>{openPhoto(0);if(photos.length)play()});
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();stop();showPhoto(index+1)}else if(e.key==='ArrowLeft'){e.preventDefault();stop();showPhoto(index-1)}else if(e.code==='Space'&&e.target===viewer){e.preventDefault();play()}});
let touch=null;viewer.querySelector('.stage').addEventListener('touchstart',e=>{touch={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}},{passive:true});viewer.querySelector('.stage').addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)){stop();showPhoto(index+(dx<0?1:-1))}touch=null},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
const resizeObserver=new ResizeObserver(()=>fitJustifiedRows($('album')));
resizeObserver.observe($('album'));
fetch('album.json').then(r=>{if(!r.ok)throw Error('album');return r.json()}).then(render).catch(()=>{$('album').innerHTML='<p class="loading" role="alert">Impossible de charger l’album. <a href="">Réessayer</a></p>';$('start').disabled=true});
