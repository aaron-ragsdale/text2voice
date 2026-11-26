// Geometry-based reading order and optional academic cleanup.
function lines(items){
 const rows=[];
 for(const t of items.filter(t=>t.str?.trim()).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4])){
  const x=t.transform[4],y=t.transform[5],h=Math.abs(t.height||t.transform[3]||10),end=x+(t.width||0);
  let r=rows.find(r=>Math.abs(r.y-y)<Math.max(2,h*.24)&&x<=r.end+Math.max(15,h*2)&&end>=r.x-Math.max(15,h*2));
  if(!r){r={x,y,end,h,parts:[]};rows.push(r)}
  r.x=Math.min(r.x,x);r.end=Math.max(r.end,end);r.parts.push({x,end,text:t.str});
 }
 return rows.map(r=>({...r,text:r.parts.sort((a,b)=>a.x-b.x).map(p=>p.text).join(' ').replace(/\s+/g,' ').trim()})).filter(r=>r.text);
}
function ordered(page,columns){
 let rows=page.rows.slice(), mid=page.width/2;
 if(!columns)return rows.sort((a,b)=>b.y-a.y||a.x-b.x);
 const left=rows.filter(r=>r.end<mid+8&&r.x<mid-30),right=rows.filter(r=>r.x>mid-8&&r.end>mid+30);
 if(left.length<4||right.length<4||Math.min(left.length,right.length)/Math.max(left.length,right.length)<.22)return rows.sort((a,b)=>b.y-a.y||a.x-b.x);
 const spanning=rows.filter(r=>!left.includes(r)&&!right.includes(r)).sort((a,b)=>b.y-a.y);
 let out=[],top=Infinity;
 for(const s of [...spanning,{y:-Infinity}]){
  for(const col of [left,right])out.push(...col.filter(r=>r.y<top&&r.y>=s.y).sort((a,b)=>b.y-a.y));
  if(s.y!==-Infinity)out.push(s);top=s.y;
 }
 return out;
}
const signature=t=>t.toLowerCase().replace(/\d+/g,'#').replace(/\s+/g,' ').trim();
const edge=(r,p)=>r.y>p.height*.90||r.y<p.height*.10;
export function makePage(items,width,height,number){return {items,width,height,number,rows:lines(items)}}
export function stripCitations(text){
 return text.replace(/\[\s*\d+(?:\s*[,;–—-]\s*\d+)*\s*\]/g,'')
 .replace(/\(([^()]*)\)/g,(all,inner)=>{
  // Only remove parentheticals that resemble author-year citations, not years alone or results.
  const parts=inner.split(';');
  return parts.every(p=>/^(?:(?:see(?: also)?|e\.g\.,?|cf\.)\s+)?[\p{Lu}][\p{L}'’.-]+(?:\s+(?:et al\.?|and|&|[\p{Lu}][\p{L}'’.-]+))*\s*,?\s+(?:19|20)\d{2}[a-z]?(?:\s*,\s*(?:p{1,2}\.\s*)?\d+(?:[-–]\d+)?)?$/u.test(p.trim()))?'':all;
 }).replace(/\s+([,.;:!?])/g,'$1').replace(/ {2,}/g,' ').trim();
}
export function cleanPages(pages,opt){
 const counts=new Map(),stats={headers:0,citations:0,references:0,captions:0,notes:0};
 for(const p of pages){const seen=new Set(p.rows.filter(r=>edge(r,p)).map(r=>signature(r.text)));for(const k of seen)counts.set(k,(counts.get(k)||0)+1)}
 let inRefs=false;
 const result=pages.map(p=>{
  let kept=[];
  for(const r of ordered(p,opt.columns)){
   let t=r.text.trim();
   if(opt.headers&&edge(r,p)&&(/^(?:page\s+)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i.test(t)||(counts.get(signature(t))||0)>=2)){stats.headers++;continue}
   if(opt.references&&/^(?:\d+\.?\s+)?(?:references|bibliography|works cited|literature cited)\s*$/i.test(t)){inRefs=true;stats.references++;continue}
   if(inRefs&&/^(?:appendix(?:\s+[A-Z0-9])?(?:\s*[:.]|\s*$)|supplementary (?:materials?|information))/i.test(t))inRefs=false;
   if(inRefs){stats.references++;continue}
   if(opt.captions&&/^(?:fig(?:ure)?\.?|table)\s+\d+[a-z]?\s*[:.]/i.test(t)){stats.captions++;continue}
   if(opt.notes&&r.y<p.height*.20&&/^(?:\d+|[*†‡])\s*[.)]?\s+\p{L}/u.test(t)&&r.h<9){stats.notes++;continue}
   kept.push(t);
  }
  let text=kept.join('\n').replace(/(\p{L})-\n(?=\p{Ll})/gu,'$1').replace(/\n/g,' ');
  if(opt.citations){const before=text; text=stripCitations(text);if(before!==text)stats.citations++}
  return {page:p.number,text};
 });
 return {pages:result,stats};
}
