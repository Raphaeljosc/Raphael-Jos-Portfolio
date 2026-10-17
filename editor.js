let content,selected=0,dirty=false;const $=id=>document.getElementById(id),say=s=>$('status').textContent=s;
const fields=[['name','Display name'],['role','Professional title'],['email','Public contact email'],['youtube','YouTube channel URL'],['github','GitHub username'],['languages','Languages'],['summary','Introduction'],['bio','About you']];
const field=(key,label,value,wide=false)=>`<label class="${wide?'wide':''}">${label}${wide?`<textarea data-key="${key}">${esc(value)}</textarea>`:`<input data-key="${key}" value="${esc(value)}" ${key==='email'?'type="email"':''}>`}</label>`;
function profile(){ $('profile').innerHTML=fields.map(([key,label])=>field(key,label,content.profile[key]||'',key==='summary'||key==='bio')).join('');$('profile').oninput=e=>{content.profile[e.target.dataset.key]=e.target.value;dirty=true;gitLink()};gitLink() }
function gitLink(){$('github-link').href=/^[a-zA-Z0-9-]+$/.test(content.profile.github||'')?`https://github.com/${content.profile.github}?tab=repositories`:'https://github.com/new'}
function render(){const p=content.projects[selected];$('projects').innerHTML=content.projects.map((x,i)=>`<option value="${i}" ${i===selected?'selected':''}>${esc(x.title)}</option>`).join('');if(!p){$('project-form').innerHTML='<p>Add your first project to begin.</p>';return}$('project-form').innerHTML=`<div class="form-grid">${field('title','Project title',p.title)}${field('category','Category',p.category)}${field('type','Project type / relationship',p.type)}${field('youtube','YouTube video URL',p.youtube)}${field('role','Your role',p.role,true)}${field('description','Project description',p.description,true)}<label>Cover colour<input data-key="color" type="color" value="${esc(p.color)}"></label><label>Cover image (JPG, PNG, WebP, GIF)<input id="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label></div>${p.cover?`<div class="asset-row"><img src="${mediaUrl(p.cover)}" alt="Cover"><button id="remove-cover">Remove cover</button></div>`:''}<h2>Film frames</h2><label>Add images (up to 8 MB each)<input id="frames" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"></label><div>${p.images.map((x,i)=>`<div class="asset-row"><img src="${mediaUrl(x.src)}" alt="Uploaded frame"><input aria-label="Frame ${i+1} caption" data-caption="${i}" value="${esc(x.caption)}"><button data-remove-image="${i}" aria-label="Remove frame ${i+1}">Remove</button></div>`).join('')}</div><h2>Audio tracks</h2><label>Add audio (MP3, WAV, OGG, M4A; up to 20 MB each)<input id="audio" type="file" multiple accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"></label>${p.audio.map((x,i)=>`<div class="asset-row"><input aria-label="Track ${i+1} title" data-track="${i}" value="${esc(x.title)}"><button data-remove-audio="${i}" aria-label="Remove track ${i+1}">Remove</button></div>`).join('')}<div class="toolbar"><button id="up" class="small-button">Move earlier</button><button id="down" class="small-button">Move later</button><button id="delete" class="small-button">Delete project</button></div>`;
$('project-form').oninput=e=>{if(e.target.dataset.key){p[e.target.dataset.key]=e.target.value;if(e.target.dataset.key==='title')$('projects').selectedOptions[0].textContent=p.title}if(e.target.dataset.caption!==undefined)p.images[+e.target.dataset.caption].caption=e.target.value;if(e.target.dataset.track!==undefined)p.audio[+e.target.dataset.track].title=e.target.value;dirty=true};
$('project-form').onclick=e=>{if(e.target.dataset.removeImage!==undefined){p.images.splice(+e.target.dataset.removeImage,1);dirty=true;render()}if(e.target.dataset.removeAudio!==undefined){p.audio.splice(+e.target.dataset.removeAudio,1);dirty=true;render()}};
$('cover').onchange=e=>upload(e.target.files,'cover');$('frames').onchange=e=>upload(e.target.files,'images');$('audio').onchange=e=>upload(e.target.files,'audio');if($('remove-cover'))$('remove-cover').onclick=()=>{p.cover='';dirty=true;render()};$('delete').onclick=()=>{if(confirm(`Delete “${p.title}” from this draft?`)){content.projects.splice(selected,1);selected=Math.max(0,selected-1);dirty=true;render()}};for(const [id,delta]of [['up',-1],['down',1]])$(id).onclick=()=>{const n=selected+delta;if(n<0||n>=content.projects.length)return;[content.projects[n],content.projects[selected]]=[content.projects[selected],content.projects[n]];selected=n;dirty=true;render()}}
async function upload(files,type){const p=content.projects[selected];try{for(const f of files){const isAudio=type==='audio';if(f.size>(isAudio?20:8)*1024*1024)throw Error(`${f.name} is too large.`);if(isAudio?!/\.(mp3|wav|ogg|m4a)$/i.test(f.name):!/^image\/(jpeg|png|webp|gif)$/.test(f.type))throw Error('Unsupported file type.');let src=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(Error('Could not read file.'));r.readAsDataURL(f)});if(isAudio&&!src.startsWith('data:audio/'))src=src.replace(/^data:[^;]+;/,'data:audio/mpeg;');if(type==='cover'){p.cover=src;p.coverFilename=f.name}else p[type].push(type==='images'?{src,filename:f.name,caption:f.name.replace(/\.[^.]+$/,'')}:{src,filename:f.name,title:f.name.replace(/\.[^.]+$/,'')});dirty=true}say('Media added to draft. Save your draft or download a backup.')}catch(e){say(e.message)}render()}
async function save(){const d=await db();await new Promise((res,rej)=>{const t=d.transaction('draft','readwrite');t.objectStore('draft').put(content,'content');t.oncomplete=res;t.onerror=()=>rej(t.error)});d.close();dirty=false;say('Draft saved on this browser. Export to publish or back up.')}function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),20000)}
function validate(d){if(d.version!==1||!d.profile||!Array.isArray(d.projects)||!d.projects.every(p=>typeof p.id==='string'&&typeof p.title==='string'&&Array.isArray(p.images)&&Array.isArray(p.audio)))throw Error('This is not a valid portfolio backup.');if(new Set(d.projects.map(p=>p.id)).size!==d.projects.length)throw Error('Project IDs must be unique.');return d}
$('save').onclick=()=>save().catch(()=>say('Unable to save in this browser. Download a backup to keep your work.'));$('preview').onclick=async()=>{try{await save();location.href='index.html?preview=1'}catch{say('Unable to save preview. Please download a backup.')}};$('backup').onclick=async()=>{try{const copy=structuredClone(content);async function embed(src){if(!src||src.startsWith('data:'))return src;const r=await fetch(src);if(!r.ok)throw Error('Could not include a media file in the backup.');const b=await r.blob();return new Promise((res,rej)=>{const f=new FileReader();f.onload=()=>res(f.result);f.onerror=rej;f.readAsDataURL(b)})}for(const p of copy.projects){p.cover=await embed(p.cover);for(const x of [...p.images,...p.audio])x.src=await embed(x.src)}download(new Blob([JSON.stringify(copy,null,2)],{type:'application/json'}),'portfolio-backup.json');say('Portable backup downloaded, including your media.')}catch(e){say(e.message)}};$('import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const next=validate(JSON.parse(await f.text()));if(!confirm('Replace the current draft with this backup?'))return;content=next;selected=0;dirty=true;profile();render();say('Backup restored. Save draft to keep it on this browser.')}catch(e){say(e.message)}e.target.value=''};$('projects').onchange=e=>{selected=+e.target.value;render()};$('add').onclick=()=>{content.projects.push({id:'project-'+crypto.randomUUID(),title:'Untitled project',category:'Brand film',type:'Independent concept campaign',description:'',role:'',youtube:'',color:'#c4ef91',cover:'',images:[],audio:[]});selected=content.projects.length-1;dirty=true;render()};window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
function zip(entries){const enc=new TextEncoder(),parts=[],central=[];let offset=0;const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0};for(const [name,bytes]of entries){const n=enc.encode(name),sum=crc(bytes),head=new Uint8Array(30+n.length),v=new DataView(head.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,sum,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,n.length,true);head.set(n,30);parts.push(head,bytes);const c=new Uint8Array(46+n.length),cv=new DataView(c.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,sum,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,offset,true);c.set(n,46);central.push(c);offset+=head.length+bytes.length}const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,central.reduce((n,c)=>n+c.length,0),true);ev.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/zip'})}
// Fingerprints are used only for checking bytes, never as visible folder/file names.
async function mediaDigest(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    b => b.toString(16).padStart(2, '0')).join('');
}
const mediaExtensions = {
  'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif',
  'audio/mpeg':'mp3','audio/mp3':'mp3','audio/wav':'wav','audio/x-wav':'wav',
  'audio/wave':'wav','audio/vnd.wave':'wav','audio/ogg':'ogg',
  'application/ogg':'ogg','audio/mp4':'m4a','audio/x-m4a':'m4a'
};
function folderSlug(title) {
  return String(title || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80) || 'project';
}
function readableFolder(folder) {
  return typeof folder === 'string' && /^[a-z0-9][a-z0-9_-]{0,100}$/.test(folder)
    && !/^project-[a-f0-9]{8}-/i.test(folder) && !/^id_[a-f0-9]+$/i.test(folder)
    && !/^[a-f0-9]{32,}$/i.test(folder);
}
function readableBasename(src) {
  if (!src || src.startsWith('data:')) return '';
  const value=src.split('/').pop();
  return /^(?:[a-f0-9]{32,}|media-\d+)\.[a-z0-9]+$/i.test(value) ? '' : value;
}
function readableFilename(name, extension) {
  let base=String(name || 'media').normalize('NFC').split(/[\\/]/).pop();
  base=base.replace(/\.(?:jpe?g|png|webp|gif|mp3|wav|ogg|m4a)$/i,'');
  base=base.replace(/[<>:"|?*#%\u0000-\u001f\u007f]/g,'-').replace(/\s+/g,'-')
    .replace(/^[. -]+|[. -]+$/g,'').slice(0,100) || 'media';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(base)) base='file-'+base;
  return base+'.'+extension;
}
function safeStoredFilename(name) {
  return typeof name==='string' && name.length<=160 && !/[\\/<>:"|?*#%\s\u0000-\u001f]/.test(name)
    && !/^\./.test(name) && /\.(jpg|jpeg|png|webp|gif|mp3|wav|ogg|m4a)$/i.test(name)
    && !/^(?:[a-f0-9]{32,}|media-\d+)\./i.test(name);
}
function mediaSlots(p) {
  return [
    {src:p.cover, name:p.coverFilename || readableBasename(p.cover) || 'cover', kind:'cover', index:0},
    ...p.images.map((x,i)=>({src:x.src,name:x.filename || readableBasename(x.src) || x.caption || 'frame-'+String(i+1).padStart(2,'0'),kind:'images',index:i})),
    ...p.audio.map((x,i)=>({src:x.src,name:x.filename || readableBasename(x.src) || x.title || 'audio-'+String(i+1).padStart(2,'0'),kind:'audio',index:i}))
  ].filter(x=>x.src);
}
function referencedMedia(data) {
  return new Set(data.projects.flatMap(p=>mediaSlots(p).map(x=>x.src)));
}
async function prepareProjectMedia(snapshot, published, updatesOnly) {
  const out=structuredClone(snapshot), entries=[],folders=[],cache=new Map();
  const publishedById=new Map((published?.projects || []).map(p=>[p.id,p]));
  const existing=published ? referencedMedia(published) : new Set();
  const reservedFolders=new Map(), assigned=new Map();
  const sorted=[...out.projects].sort((a,b)=>a.id.localeCompare(b.id));
  // Reserve established names before creating names for inserted projects.
  for(const p of sorted) {
    const old=publishedById.get(p.id);
    const preferred=readableFolder(old?.mediaFolder) ? old.mediaFolder : readableFolder(p.mediaFolder) ? p.mediaFolder : '';
    if(preferred) {
      if(reservedFolders.has(preferred)) throw Error('Two projects use the folder '+preferred+'. Give the new project a distinct folder name.');
      reservedFolders.set(preferred,p.id); assigned.set(p.id,preferred);
    }
  }
  for(const p of sorted) if(!assigned.has(p.id)) {
    const base=folderSlug(p.title); let name=base, n=2;
    while(reservedFolders.has(name)) name=base+'-'+n++;
    reservedFolders.set(name,p.id); assigned.set(p.id,name);
  }
  async function readMedia(src) {
    if(cache.has(src)) return cache.get(src);
    const response=await fetch(src,{cache:'no-store'});
    if(!response.ok) throw Error('Missing media: '+src.slice(0,180)+'. Load the published portfolio or restore your latest complete backup.');
    const blob=await response.blob(), ext=mediaExtensions[blob.type.split(';')[0].toLowerCase()];
    if(!ext) throw Error('Unsupported or missing media: '+src.slice(0,180));
    const bytes=new Uint8Array(await blob.arrayBuffer());
    const file={bytes,ext,hash:await mediaDigest(bytes)}; cache.set(src,file); return file;
  }
  const metadata=[];
  for(const p of out.projects) {
    const folder=assigned.get(p.id), old=publishedById.get(p.id);
    const names=Object.create(null), owners=new Map(), emitted=new Set();
    function reserve(hash,name) {
      if(!/^[a-f0-9]{64}$/.test(hash) || !safeStoredFilename(name)) return;
      const key=name.toLowerCase();
      if(owners.has(key) && owners.get(key)!==hash) return;
      if(names[hash]) return;
      owners.set(key,hash); names[hash]=name;
    }
    // Keep historical names so a replacement cannot overwrite an older image.
    for(const source of [old,p]) for(const [hash,name] of Object.entries(source?.mediaFiles || {})) reserve(hash,name);
    // Verify filenames already on the site against their bytes, including older metadata-free exports.
    if(old && old.mediaFolder===folder) for(const slot of mediaSlots(old)) {
      const name=readableBasename(slot.src);
      if(!safeStoredFilename(name)) continue;
      const response=await fetch(slot.src,{cache:'no-store'});
      if(!response.ok) continue; // The current draft may supply the missing file for repair.
      const blob=await response.blob(), ext=mediaExtensions[blob.type.split(';')[0].toLowerCase()];
      if(!ext) continue;
      const bytes=new Uint8Array(await blob.arrayBuffer()),hash=await mediaDigest(bytes);
      cache.set(slot.src,{bytes,ext,hash});
      const prior=owners.get(name.toLowerCase());
      if(prior && prior!==hash && names[prior]===name) delete names[prior];
      owners.set(name.toLowerCase(),hash);
      if(!names[hash]) names[hash]=name;
    }
    for(const slot of mediaSlots(p)) {
      const file=await readMedia(slot.src);
      let name=names[file.hash];
      if(!name) {
        const requested=readableFilename(slot.name,file.ext);
        const dot=requested.lastIndexOf('.'), base=requested.slice(0,dot), ext=requested.slice(dot);
        name=requested; let n=2;
        while(owners.has(name.toLowerCase()) && owners.get(name.toLowerCase())!==file.hash) name=base+'-'+(n++)+ext;
        reserve(file.hash,name);
      }
      const target='assets/'+folder+'/'+name;
      let same=false;
      if(updatesOnly && existing.has(target)) {
        try { same=(await readMedia(target)).hash===file.hash; } catch { same=false; }
      }
      if(!emitted.has(target) && (!updatesOnly || !same)) {entries.push([target,file.bytes]);emitted.add(target);}
      if(slot.kind==='cover') {p.cover=target;p.coverFilename=name;}
      else {p[slot.kind][slot.index].src=target;p[slot.kind][slot.index].filename=name;}
    }
    p.mediaFolder=folder;p.mediaFiles=names;p.namingVersion=2;
    metadata.push({id:p.id,mediaFolder:folder,mediaFiles:structuredClone(names),namingVersion:2});
    folders.push({title:p.title,path:'assets/'+folder+'/'});
  }
  return {out,entries,folders,metadata};
}

async function exportPortfolio(updatesOnly) {
  const buttons = [$('export'), $('export-update')].filter(Boolean);
  buttons.forEach(b => b.disabled = true);
  say(updatesOnly ? 'Comparing this draft with the published portfolio…' : 'Preparing your complete website…');
  try {
    const snapshot = validate(structuredClone(content));
    if (snapshot.projects.some(p => p.youtube && !youtubeId(p.youtube)))
      throw Error('Check your video links. Use a YouTube watch, Shorts, share, or embed URL.');
    if (snapshot.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(snapshot.profile.email))
      throw Error('Please enter a valid contact email.');
    if (!crypto.subtle) throw Error('Open the editor on your HTTPS website or localhost to export.');
    let published = null;
    if (updatesOnly) {
      if (location.protocol !== 'https:') throw Error('Open the editor on your published HTTPS website to download an update ZIP.');
      const r = await fetch('content.json', {cache:'no-store'});
      if (!r.ok) throw Error('Could not read the published portfolio. Try again, or download the full website ZIP.');
      published = validate(await r.json());
    }
    const enc = new TextEncoder(), entries = [];
    if (!updatesOnly) {
      for (const f of ['index.html','editor.html','style.css','app.js','editor.js','assets/favicon.svg','README.md']) {
        const r = await fetch(f, {cache:'no-store'});
        if (!r.ok) throw Error('Could not read ' + f + '.');
        entries.push([f, new Uint8Array(await r.arrayBuffer())]);
      }
      entries.push(['.nojekyll', new Uint8Array(0)]);
    }
    const result = await prepareProjectMedia(snapshot, published, updatesOnly);
    // Save only naming metadata onto the current draft; do not replace its media with unpublished URLs.
    for (const info of result.metadata) {
      const current=content.projects.find(p=>p.id===info.id);
      if(current) Object.assign(current,info);
    }
    await save();
    entries.push(...result.entries);
    entries.push(['content.json', enc.encode(JSON.stringify(result.out, null, 2))]);
    const instructions = [
      updatesOnly ? 'PORTFOLIO UPDATE' : 'COMPLETE PORTFOLIO',
      '',
      updatesOnly
        ? 'This ZIP contains content.json and new, changed, or missing media only. Folder names use project titles. Files use readable upload names. Existing website code stays on GitHub.'
        : 'This ZIP contains the website code, content.json, and all referenced media.',
      '',
      '1. Extract this ZIP. Do not rename its media files or folders.',
      '2. Upload the assets folder at the repository root (beside index.html). If uploading inside the existing assets folder, upload its project subfolders instead.',
      '3. For multiple uploads, commit all assets first. Upload content.json LAST so every referenced file is available.',
      '4. Wait for GitHub Pages to publish and refresh the public website.',
      '',
      'FIRST EXPORT WITH READABLE NAMES: upload every included file once. Existing hashed files and ID folders can remain during the transition.',
      'LATER UPDATES: reordering projects, changing text, or deleting a frame needs only content.json. New/replaced media has a new stable filename and is included automatically.',
      'Exporting does not publish or erase your browser draft. An update ZIP may contain other unpublished changes in your current draft too.',
      'Do not restore an older backup when making later updates unless you intend to restore that older content.',
      'Keep a JSON backup or full website ZIP; an update ZIP alone is not a complete backup.',
      '',
      'PROJECT FOLDERS (named from titles when created; later title edits keep existing folder names stable):',
      ...result.folders.map(f => f.title + ' -> ' + f.path),
      '',
      'This instructions file does not need to be uploaded.'
    ].join('\n');
    entries.push(['UPLOAD-INSTRUCTIONS.txt', enc.encode(instructions)]);
    download(zip(entries), updatesOnly ? 'portfolio-update.zip' : 'portfolio-website.zip');
    say(updatesOnly
      ? 'Update downloaded: ' + result.entries.length + ' new or repaired media file(s) and content.json. Upload included assets first, then content.json. Details are in UPLOAD-INSTRUCTIONS.txt.'
      : 'Full website downloaded with readable project folders and filenames. Upload assets first, then content.json. Keep this ZIP as a complete backup.');
  } catch (e) {
    say(e.message);
  } finally {
    buttons.forEach(b => b.disabled = false);
  }
}
$('export').onclick = () => exportPortfolio(false);
const updateButton = document.createElement('button');
updateButton.id = 'export-update';
updateButton.className = 'button';
updateButton.textContent = 'Download update ZIP';
updateButton.onclick = () => exportPortfolio(true);
$('export').insertAdjacentElement('afterend', updateButton);
const folderHelp = document.createElement('p');
folderHelp.className = 'notice';
folderHelp.textContent = 'Readable media names: new folders use the project title. Uploaded files keep readable names (spaces become hyphens); duplicate or replaced names receive -2, -3, etc. Existing folders stay stable when you reorder projects. Export saves these names in your browser draft. Upload assets first, then content.json. If this browser has an older draft, use Load published portfolio before starting new work.';
$('status').insertAdjacentElement('afterend', folderHelp);
const loadPublishedButton=document.createElement('button');
loadPublishedButton.id='load-published';
loadPublishedButton.className='button secondary';
loadPublishedButton.textContent='Load published portfolio';
loadPublishedButton.onclick=async()=>{
  if(!confirm('Replace this browser draft with the published portfolio? Download a backup first if you have unpublished edits.'))return;
  try {
    const r=await fetch('content.json',{cache:'no-store'});
    if(!r.ok)throw Error('Could not load the published portfolio.');
    const fresh=validate(await r.json());
    content=fresh;selected=0;profile();render();await save();
    say('Published portfolio loaded and saved in this browser.');
  } catch(e){say(e.message)}
};
$('export-update').insertAdjacentElement('afterend',loadPublishedButton);

(async()=>{try{content=await readDraft()||await fetch('content.json').then(r=>r.json());validate(content);profile();render();say('Ready to edit.')}catch{say('Could not open the editor. Open this website through a local server or GitHub Pages.')}})();
