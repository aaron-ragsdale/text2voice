const mpBase='https://huggingface.co/litert-community/';
function wav(parts,rate){const n=parts.reduce((a,p)=>a+p.length,0),b=new ArrayBuffer(44+n*2),d=new DataView(b);for(const [i,t] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])for(let j=0;j<t.length;j++)d.setUint8(i+j,t.charCodeAt(j));d.setUint32(4,36+n*2,true);d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);d.setUint32(40,n*2,true);let i=44;for(const p of parts)for(const x of p){const v=Math.max(-1,Math.min(1,x));d.setInt16(i,v<0?v*32768:v*32767,true);i+=2}return new Blob([b],{type:'audio/wav'})}
let model=null,configuration=null,queue=Promise.resolve();
async function handle(m){
 try{
 const engine=m.engine||'kokoro', config=engine+'|'+m.device; const loadStart=performance.now();
 if(!model||configuration!==config){
 if(model?.close)await model.close();else if(model?.release)await model.release();
 model=null;configuration=null;
 if(engine.startsWith('mp-')){
 const {FilesetResolver,TextToSpeech}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@latest/+esm');
 const files=await FilesetResolver.forAudioTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@latest/wasm');
 const gpu=m.device==='webgpu';
 const path=engine==='mp-pocket'?'pocket-tts/resolve/main/pocket_tts_en_int8.litertlm':engine==='mp-phonon'?'phonon-31m-en/resolve/main/phonon_int8.litertlm':'Kokoro-82M/resolve/main/'+(gpu?'kokoro_int8_gpu_fp16.litertlm':'kokoro_int8_fp16.litertlm');
 postMessage({type:'progress',status:'Downloading and initializing MediaPipe model'});
 model=await TextToSpeech.createFromOptions(files,{baseOptions:{modelAssetPath:mpBase+path,delegate:gpu?'GPU':'CPU'},defaultVoiceId:m.voice,speakingRate:1});
 }else if(engine==='kitten'){
 const {KittenTTS}=await import('https://cdn.jsdelivr.net/npm/kitten-tts-js@0.1.2/+esm');
 model=await KittenTTS.from_pretrained('KittenML/kitten-tts-nano-0.8');
 }else{
 const {KokoroTTS}=await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm');
 model=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{device:m.device==='webgpu'?'webgpu':'wasm',dtype:m.device==='webgpu'?'fp32':m.device==='q4'?'q4':'q8',progress_callback:p=>postMessage({type:'progress',file:p.file,status:p.status,progress:p.progress})});
 }
 configuration=config;
 }
 if(m.type==='load'){postMessage({id:m.id,metrics:{loadMs:performance.now()-loadStart}});return}
 const t=performance.now();let blob,firstMs=null;
 if(engine.startsWith('mp-')){
 const stream=await model.synthesizeStream(m.text,{voiceId:m.voice},true);const parts=[];let rate=24000;
 for await(const chunk of stream){if(chunk.samples?.length){if(firstMs===null)firstMs=performance.now()-t;parts.push(new Float32Array(chunk.samples));rate=chunk.sampleRateHz||rate}}
 if(!parts.length)throw Error('MediaPipe returned no audio');blob=wav(parts,rate);
 }else{const audio=await model.generate(m.text,{voice:m.voice});blob=audio.toBlob();firstMs=performance.now()-t}
 postMessage({id:m.id,blob,metrics:{firstMs,generateMs:performance.now()-t}});
 }catch(e){postMessage({id:m.id,error:e.message||String(e)})}
}
self.onmessage=({data:m})=>{queue=queue.then(()=>handle(m))};
