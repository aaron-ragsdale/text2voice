const {parentPort}=require('node:worker_threads');
const {performance}=require('node:perf_hooks');
let model,config,queue=Promise.resolve();
async function run(m){
 try{
  const start=performance.now();
  const dtype=m.device==='native-q4'?'q4':'q8';
  if(!model||config!==dtype){
   const {KokoroTTS}=await import('kokoro-js');
   model=null;config=null;
   model=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{device:'cpu',dtype,progress_callback:p=>parentPort.postMessage({progress:true,status:p.status,file:p.file,percent:p.progress})});
   config=dtype;
  }
  if(m.type==='load'){parentPort.postMessage({id:m.id,metrics:{loadMs:performance.now()-start}});return}
  const t=performance.now();
  const audio=await model.generate(m.text,{voice:m.voice});
  const bytes=await audio.toBlob().arrayBuffer();
  const elapsed=performance.now()-t;
  parentPort.postMessage({id:m.id,bytes,metrics:{firstMs:elapsed,generateMs:elapsed}},[bytes]);
 }catch(e){parentPort.postMessage({id:m.id,error:e.stack||String(e)})}
}
parentPort.on('message',m=>{queue=queue.then(()=>run(m))});
