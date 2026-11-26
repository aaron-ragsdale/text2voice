const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('text2voiceDesktop',Object.freeze({
 fetchArticle:url=>ipcRenderer.invoke('article',url),
 awake:on=>ipcRenderer.invoke('awake',on),
 finished:()=>ipcRenderer.invoke('finished'),
 openSource:url=>ipcRenderer.invoke('open-source',url)
}));
