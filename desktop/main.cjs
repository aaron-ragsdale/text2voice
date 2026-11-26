const {app,BrowserWindow,ipcMain,protocol,net,powerSaveBlocker,Notification,shell}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
protocol.registerSchemesAsPrivileged([{scheme:'studio',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true,codeCache:true}}]);
let win,blocker;
const {Worker}=require('node:worker_threads');
let nativeWorker,nativeSeq=0;const pending=new Map();
function nativeVoice(m){
 if(!m||!['load','generate'].includes(m.type)||!['native-q8','native-q4'].includes(m.device)||typeof m.voice!=='string'||!/^[a-z]{2}_[a-z]+$/.test(m.voice)||typeof m.text!=='string'||m.text.length>10000)throw Error('Invalid native voice request');
 if(!nativeWorker){const w=new Worker(path.join(__dirname,'native-voice.cjs'));nativeWorker=w;
 const fail=e=>{if(nativeWorker!==w)return;nativeWorker=null;for(const p of pending.values())p.reject(Error(String(e)));pending.clear();};
 w.on('error',fail);w.on('exit',code=>fail('Native voice worker exited: '+code));
 w.on('message',m=>{if(m.progress){win?.webContents.send('native-progress',m);return}const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(Error(m.error)):p.resolve(m)});}
 return new Promise((resolve,reject)=>{const id=++nativeSeq;pending.set(id,{resolve,reject});nativeWorker.postMessage({...m,id})});
}

const root=path.resolve(__dirname,'..');
function trusted(e){if(e.sender!==win?.webContents||e.senderFrame?.url!=='studio://app/index.html')throw Error('Untrusted sender')}
function awake(on){if(on&&blocker===undefined)blocker=powerSaveBlocker.start('prevent-app-suspension');if(!on&&blocker!==undefined){powerSaveBlocker.stop(blocker);blocker=undefined}}
function urlOf(s){const u=new URL(s);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Use a public HTTP(S) URL');return u}
async function article(s){let u=urlOf(s);const signal=AbortSignal.timeout(25000);for(let i=0;i<6;i++){const r=await fetch(u,{signal,redirect:'manual',headers:{Accept:'text/html,application/xhtml+xml'}});if([301,302,303,307,308].includes(r.status)){const loc=r.headers.get('location');await r.body?.cancel();if(!loc)throw Error('Invalid redirect');u=urlOf(new URL(loc,u).href);continue}if(!r.ok){await r.body?.cancel();throw Error('Website returned HTTP '+r.status)}if(!/html|xhtml/i.test(r.headers.get('content-type')||'')){await r.body?.cancel();throw Error('Not an HTML article')}const chunks=[];let n=0;for await(const c of r.body){n+=c.length;if(n>20000000)throw Error('Article exceeds 20 MB');chunks.push(Buffer.from(c))}return Buffer.concat(chunks).toString('utf8')}throw Error('Too many redirects')}
app.whenReady().then(()=>{
 protocol.handle('studio',async req=>{const u=new URL(req.url);const allowed=['/index.html','/academic.js','/article.js','/voice-worker.js'];if(u.hostname!=='app'||!allowed.includes(u.pathname))return new Response('Not found',{status:404});return net.fetch(pathToFileURL(path.join(root,u.pathname.slice(1))).href)});
 ipcMain.handle('native-voice',(e,m)=>{trusted(e);return nativeVoice(m)});
 ipcMain.handle('article',async(e,s)=>{trusted(e);return article(s)});
 ipcMain.handle('awake',(e,on)=>{trusted(e);awake(Boolean(on))});
 ipcMain.handle('finished',e=>{trusted(e);if(Notification.isSupported())new Notification({title:'Text2Voice',body:'Audio generation finished.'}).show()});
 ipcMain.handle('open-source',(e,s)=>{trusted(e);return shell.openExternal(urlOf(s).href)});
 win=new BrowserWindow({width:1250,height:900,minWidth:700,minHeight:500,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(e,u)=>{if(u!=='studio://app/index.html')e.preventDefault()});
 win.webContents.on('render-process-gone',()=>awake(false));
 win.on('closed',()=>{awake(false);win=null;app.quit()});
 win.loadURL('studio://app/index.html');
});
app.on('before-quit',()=>{awake(false);nativeWorker?.terminate()});
