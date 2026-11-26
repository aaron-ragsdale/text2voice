const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('text2voiceDesktop',Object.freeze({
 nativeVoice:m=>ipcRenderer.invoke('native-voice',m),
 onNativeProgress:fn=>ipcRenderer.on('native-progress',(_e,m)=>fn(m)),
 fetchArticle:url=>ipcRenderer.invoke('article',url),
 awake:on=>ipcRenderer.invoke('awake',on),
 finished:()=>ipcRenderer.invoke('finished'),
 openSource:url=>ipcRenderer.invoke('open-source',url)
}));
