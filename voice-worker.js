let model=null,device=null,queue=Promise.resolve();
async function handle(m){
 try{
 if(!model||device!==m.device){
 const {KokoroTTS}=await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm');
 model=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{device:m.device,dtype:m.device==='webgpu'?'fp32':'q8',progress_callback:p=>postMessage({type:'progress',file:p.file,status:p.status,progress:p.progress})});
 device=m.device;
 }
 if(m.type==='load'){postMessage({id:m.id});return}
 const audio=await model.generate(m.text,{voice:m.voice});
 const blob=audio.toBlob();
 postMessage({id:m.id,blob});
 }catch(e){postMessage({id:m.id,error:e.message||String(e)})}
}
self.onmessage=({data:m})=>{queue=queue.then(()=>handle(m))};
