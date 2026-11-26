let model=null,configuration=null,queue=Promise.resolve();
async function handle(m){
 try{
 const engine=m.engine||'kokoro', config=engine+'|'+m.device;
 if(!model||configuration!==config){
 if(model?.release)await model.release();
 model=null;configuration=null;
 if(engine==='kitten'){
 const {KittenTTS}=await import('https://cdn.jsdelivr.net/npm/kitten-tts-js@0.1.2/+esm');
 model=await KittenTTS.from_pretrained('KittenML/kitten-tts-nano-0.8');
 }else{
 const {KokoroTTS}=await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm');
 model=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{device:m.device==='webgpu'?'webgpu':'wasm',dtype:m.device==='webgpu'?'fp32':m.device==='q4'?'q4':'q8',progress_callback:p=>postMessage({type:'progress',file:p.file,status:p.status,progress:p.progress})});
 }
 configuration=config;
 }
 if(m.type==='load'){postMessage({id:m.id});return}
 const audio=await model.generate(m.text,{voice:m.voice});
 postMessage({id:m.id,blob:audio.toBlob()});
 }catch(e){postMessage({id:m.id,error:e.message||String(e)})}
}
self.onmessage=({data:m})=>{queue=queue.then(()=>handle(m))};
