let content,selected=0,dirty=false;const $=id=>document.getElementById(id),say=s=>$('status').textContent=s;
const fields=[['name','Display name'],['role','Professional title'],['email','Public contact email'],['youtube','YouTube channel URL'],['github','GitHub username'],['languages','Languages'],['summary','Introduction'],['bio','About you']];
const field=(key,label,value,wide=false)=>`<label class="${wide?'wide':''}">${label}${wide?`<textarea data-key="${key}">${esc(value)}</textarea>`:`<input data-key="${key}" value="${esc(value)}" ${key==='email'?'type="email"':''}>`}</label>`;
function profile(){ $('profile').innerHTML=fields.map(([key,label])=>field(key,label,content.profile[key]||'',key==='summary'||key==='bio')).join('');$('profile').oninput=e=>{content.profile[e.target.dataset.key]=e.target.value;dirty=true;gitLink()};gitLink() }
function gitLink(){$('github-link').href=/^[a-zA-Z0-9-]+$/.test(content.profile.github||'')?`https://github.com/${content.profile.github}?tab=repositories`:'https://github.com/new'}
function render(){const p=content.projects[selected];$('projects').innerHTML=content.projects.map((x,i)=>`<option value="${i}" ${i===selected?'selected':''}>${esc(x.title)}</option>`).join('');if(!p){$('project-form').innerHTML='<p>Add your first project to begin.</p>';return}$('project-form').innerHTML=`<div class="form-grid">${field('title','Project title',p.title)}${field('category','Category',p.category)}${field('type','Project type / relationship',p.type)}${field('youtube','YouTube video URL',p.youtube)}${field('role','Your role',p.role,true)}${field('description','Project description',p.description,true)}<label>Cover colour<input data-key="color" type="color" value="${esc(p.color)}"></label><label>Cover image (JPG, PNG, WebP, GIF)<input id="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label></div>${p.cover?`<div class="asset-row"><img src="${mediaUrl(p.cover)}" alt="Cover"><button id="remove-cover">Remove cover</button></div>`:''}<h2>Film frames</h2><label>Add images (up to 8 MB each)<input id="frames" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"></label><div>${p.images.map((x,i)=>`<div class="asset-row"><img src="${mediaUrl(x.src)}" alt="Uploaded frame"><input aria-label="Frame ${i+1} caption" data-caption="${i}" value="${esc(x.caption)}"><button data-remove-image="${i}" aria-label="Remove frame ${i+1}">Remove</button></div>`).join('')}</div><h2>Audio tracks</h2><label>Add audio (MP3, WAV, OGG, M4A; up to 20 MB each)<input id="audio" type="file" multiple accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"></label>${p.audio.map((x,i)=>`<div class="asset-row"><input aria-label="Track ${i+1} title" data-track="${i}" value="${esc(x.title)}"><button data-remove-audio="${i}" aria-label="Remove track ${i+1}">Remove</button></div>`).join('')}<div class="toolbar"><button id="up" class="small-button">Move earlier</button><button id="down" class="small-button">Move later</button><button id="delete" class="small-button">Delete project</button></div>`;
$('project-form').oninput=e=>{if(e.target.dataset.key){p[e.target.dataset.key]=e.target.value;if(e.target.dataset.key==='title')$('projects').selectedOptions[0].textContent=p.title}if(e.target.dataset.caption!==undefined)p.images[+e.target.dataset.caption].caption=e.target.value;if(e.target.dataset.track!==undefined)p.audio[+e.target.dataset.track].title=e.target.value;dirty=true};
$('project-form').onclick=e=>{if(e.target.dataset.removeImage!==undefined){p.images.splice(+e.target.dataset.removeImage,1);dirty=true;render()}if(e.target.dataset.removeAudio!==undefined){p.audio.splice(+e.target.dataset.removeAudio,1);dirty=true;render()}};
$('cover').onchange=e=>upload(e.target.files,'cover');$('frames').onchange=e=>upload(e.target.files,'images');$('audio').onchange=e=>upload(e.target.files,'audio');if($('remove-cover'))$('remove-cover').onclick=()=>{p.cover='';dirty=true;render()};$('delete').onclick=()=>{if(confirm(`Delete “${p.title}” from this draft?`)){content.projects.splice(selected,1);selected=Math.max(0,selected-1);dirty=true;render()}};for(const [id,delta]of [['up',-1],['down',1]])$(id).onclick=()=>{const n=selected+delta;if(n<0||n>=content.projects.length)return;[content.projects[n],content.projects[selected]]=[content.projects[selected],content.projects[n]];selected=n;dirty=true;render()}}
async function upload(files,type){const p=content.projects[selected];try{for(const f of files){const isAudio=type==='audio';if(f.size>(isAudio?20:8)*1024*1024)throw Error(`${f.name} is too large.`);if(isAudio?!/\.(mp3|wav|ogg|m4a)$/i.test(f.name):!/^image\/(jpeg|png|webp|gif)$/.test(f.type))throw Error('Unsupported file type.');let src=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(Error('Could not read file.'));r.readAsDataURL(f)});if(isAudio&&!src.startsWith('data:audio/'))src=src.replace(/^data:[^;]+;/,'data:audio/mpeg;');if(type==='cover')p.cover=src;else p[type].push(type==='images'?{src,caption:f.name.replace(/\.[^.]+$/,'')}:{src,title:f.name.replace(/\.[^.]+$/,'')});dirty=true}say('Media added to draft. Save your draft or download a backup.')}catch(e){say(e.message)}render()}
async function save(){const d=await db();await new Promise((res,rej)=>{const t=d.transaction('draft','readwrite');t.objectStore('draft').put(content,'content');t.oncomplete=res;t.onerror=()=>rej(t.error)});d.close();dirty=false;say('Draft saved on this browser. Export to publish or back up.')}function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),20000)}
function validate(d){if(d.version!==1||!d.profile||!Array.isArray(d.projects)||!d.projects.every(p=>typeof p.id==='string'&&typeof p.title==='string'&&Array.isArray(p.images)&&Array.isArray(p.audio)))throw Error('This is not a valid portfolio backup.');if(new Set(d.projects.map(p=>p.id)).size!==d.projects.length)throw Error('Project IDs must be unique.');return d}
$('save').onclick=()=>save().catch(()=>say('Unable to save in this browser. Download a backup to keep your work.'));$('preview').onclick=async()=>{try{await save();location.href='index.html?preview=1'}catch{say('Unable to save preview. Please download a backup.')}};$('backup').onclick=async()=>{try{const copy=structuredClone(content);async function embed(src){if(!src||src.startsWith('data:'))return src;const r=await fetch(src);if(!r.ok)throw Error('Could not include a media file in the backup.');const b=await r.blob();return new Promise((res,rej)=>{const f=new FileReader();f.onload=()=>res(f.result);f.onerror=rej;f.readAsDataURL(b)})}for(const p of copy.projects){p.cover=await embed(p.cover);for(const x of [...p.images,...p.audio])x.src=await embed(x.src)}download(new Blob([JSON.stringify(copy,null,2)],{type:'application/json'}),'portfolio-backup.json');say('Portable backup downloaded, including your media.')}catch(e){say(e.message)}};$('import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const next=validate(JSON.parse(await f.text()));if(!confirm('Replace the current draft with this backup?'))return;content=next;selected=0;dirty=true;profile();render();say('Backup restored. Save draft to keep it on this browser.')}catch(e){say(e.message)}e.target.value=''};$('projects').onchange=e=>{selected=+e.target.value;render()};$('add').onclick=()=>{content.projects.push({id:'project-'+crypto.randomUUID(),title:'Untitled project',category:'Brand film',type:'Independent concept campaign',description:'',role:'',youtube:'',color:'#c4ef91',cover:'',images:[],audio:[]});selected=content.projects.length-1;dirty=true;render()};window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
function zip(entries){const enc=new TextEncoder(),parts=[],central=[];let offset=0;const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0};for(const [name,bytes]of entries){const n=enc.encode(name),sum=crc(bytes),head=new Uint8Array(30+n.length),v=new DataView(head.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,sum,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,n.length,true);head.set(n,30);parts.push(head,bytes);const c=new Uint8Array(46+n.length),cv=new DataView(c.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,sum,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,offset,true);c.set(n,46);central.push(c);offset+=head.length+bytes.length}const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,central.reduce((n,c)=>n+c.length,0),true);ev.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/zip'})}
// Stable project folders and content-based filenames keep references independent of order.
async function mediaDigest(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    b => b.toString(16).padStart(2, '0')).join('');
}
async function projectFolder(id) {
  if (/^[a-z0-9][a-z0-9-]{0,100}$/.test(id)) return id;
  // Never let an imported ID become an unsafe or ambiguous ZIP path.
  return 'id_' + await mediaDigest(new TextEncoder().encode(id));
}
const mediaExtensions = {
  'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif',
  'audio/mpeg':'mp3','audio/mp3':'mp3','audio/wav':'wav','audio/x-wav':'wav',
  'audio/wave':'wav','audio/vnd.wave':'wav','audio/ogg':'ogg',
  'application/ogg':'ogg','audio/mp4':'m4a','audio/x-m4a':'m4a'
};
function referencedMedia(data) {
  return new Set(data.projects.flatMap(p =>
    [p.cover, ...p.images.map(x => x.src), ...p.audio.map(x => x.src)].filter(Boolean)));
}
async function prepareProjectMedia(snapshot, published, updatesOnly) {
  const out = structuredClone(snapshot);
  const existing = published ? referencedMedia(published) : new Set();
  const entries = [], added = new Set(), cache = new Map(), folders = [];
  async function asset(src, folder) {
    if (!src) return '';
    if (!cache.has(src)) {
      const r = await fetch(src, {cache:'no-store'});
      if (!r.ok) throw Error('A media file is missing: ' + src.slice(0,160) + '. Restore your backup or replace the file in the editor.');
      const blob = await r.blob();
      const mime = blob.type.split(';')[0].toLowerCase();
      const ext = mediaExtensions[mime];
      if (!ext) throw Error('Unsupported media format (' + (mime || 'unknown') + '). Re-upload the image or audio in the editor.');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      cache.set(src, {bytes, ext, hash:await mediaDigest(bytes)});
    }
    const file = cache.get(src);
    const path = 'assets/' + folder + '/' + file.hash + '.' + file.ext;
    if (!added.has(path) && (!updatesOnly || !existing.has(path))) {
      entries.push([path, file.bytes]);
      added.add(path);
    }
    return path;
  }
  const usedFolders = new Set();
  for (const p of out.projects) {
    const folder = p.mediaFolder || await projectFolder(p.id);
    if (!/^[a-z0-9][a-z0-9_-]{0,100}$/.test(folder) || usedFolders.has(folder))
      throw Error('Project media folders must be safe and unique. Restore a valid backup.');
    usedFolders.add(folder);
    p.mediaFolder = folder;
    folders.push({title:p.title || '(Untitled project)', path:'assets/' + folder + '/'});
    p.cover = await asset(p.cover, folder);
    for (const x of p.images) x.src = await asset(x.src, folder);
    for (const x of p.audio) x.src = await asset(x.src, folder);
  }
  return {out, entries, folders};
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
    entries.push(...result.entries);
    entries.push(['content.json', enc.encode(JSON.stringify(result.out, null, 2))]);
    const instructions = [
      updatesOnly ? 'PORTFOLIO UPDATE' : 'COMPLETE PORTFOLIO',
      '',
      updatesOnly
        ? 'This ZIP contains content.json and only media whose stable paths are not in the published portfolio. Existing website code stays on GitHub.'
        : 'This ZIP contains the website code, content.json, and all referenced media.',
      '',
      '1. Extract this ZIP. Do not rename its media files or folders.',
      '2. Upload the assets folder at the repository root (beside index.html). If uploading inside the existing assets folder, upload its project subfolders instead.',
      '3. For multiple uploads, commit all assets first. Upload content.json LAST so every referenced file is available.',
      '4. Wait for GitHub Pages to publish and refresh the public website.',
      '',
      'FIRST EXPORT WITH PROJECT FOLDERS: upload every project folder included here once. Old assets/media-*.jpg files can remain; they are no longer used after the new content.json is published.',
      'LATER UPDATES: reordering projects, changing text, or deleting a frame needs only content.json. New/replaced media has a new stable filename and is included automatically.',
      'Exporting does not publish or erase your browser draft. An update ZIP may contain other unpublished changes in your current draft too.',
      'Do not restore an older backup when making later updates unless you intend to restore that older content.',
      'Keep a JSON backup or full website ZIP; an update ZIP alone is not a complete backup.',
      '',
      'PROJECT FOLDERS (stay the same even if project titles change):',
      ...result.folders.map(f => f.title + ' -> ' + f.path),
      '',
      'This instructions file does not need to be uploaded.'
    ].join('\n');
    entries.push(['UPLOAD-INSTRUCTIONS.txt', enc.encode(instructions)]);
    download(zip(entries), updatesOnly ? 'portfolio-update.zip' : 'portfolio-website.zip');
    say(updatesOnly
      ? 'Update downloaded: ' + result.entries.length + ' new media file(s) and content.json. Upload included assets first, then content.json. Details are in UPLOAD-INSTRUCTIONS.txt.'
      : 'Full website downloaded with project folders. Upload assets first, then content.json. Keep this ZIP as a complete backup.');
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
folderHelp.textContent = 'Project folders: media names now stay fixed when you move or add projects. Use Download update ZIP on your published website for new media and content.json only. The first export migrates all projects into folders, so upload every included folder once. Always upload assets before content.json. Keep the full website ZIP or a JSON backup for recovery.';
$('status').insertAdjacentElement('afterend', folderHelp);
(async()=>{try{content=await readDraft()||await fetch('content.json').then(r=>r.json());validate(content);profile();render();say('Ready to edit.')}catch{say('Could not open the editor. Open this website through a local server or GitHub Pages.')}})();
