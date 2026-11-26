// Parse in an inert template: imported markup never enters the live page.
export async function extractArticle(html){
 if(html.length>20_000_000)throw Error('HTML exceeds the 20 MB import limit.');
 const template=document.createElement('template');template.innerHTML=html;
 const root=template.content;
 const title=root.querySelector('title')?.textContent||root.querySelector('h1')?.textContent||'Web article';
 for(const el of root.querySelectorAll('script,style,link,iframe,frame,object,embed,base,meta,form,button,input,select,textarea,nav,aside,footer,noscript,svg,video,audio,img,source,[hidden],[aria-hidden="true"],[role="navigation"],[role="banner"],[role="complementary"],[role="contentinfo"]'))el.remove();
 for(const el of root.querySelectorAll('*')){
  const hint=(el.id+' '+(el.getAttribute('class')||'')).toLowerCase();
  if(/(?:^|[\s_-])(?:advertisement|ads|ad-slot|cookie-banner|cookie-consent|newsletter|related-posts|social-share|comments|paywall-overlay|popup)(?:$|[\s_-])/.test(hint)){el.remove();continue}
  for(const attr of [...el.attributes])if(/^on/i.test(attr.name)||['src','srcset','style','poster','background','href','action','formaction','ping','data','xlink:href','is'].includes(attr.name.toLowerCase()))el.removeAttribute(attr.name);
 }
 const doc=document.implementation.createHTMLDocument(title);
 const body=root.querySelector('body')||root;
 doc.body.append(...[...body.childNodes].map(n=>doc.importNode(n,true)));
 let result=null,method='Readability';
 try{
  const {Readability}=await import('https://cdn.jsdelivr.net/npm/@mozilla/readability@0.6.0/+esm');
  result=new Readability(doc.cloneNode(true)).parse();
 }catch{method='local fallback'}
 let blocks=[],name=result?.title||title,byline=result?.byline||'';
 if(result?.content){
  const t=document.createElement('template');t.innerHTML=result.content;
  blocks=[...t.content.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,pre')].filter(n=>!n.querySelector('p,li,blockquote,pre')).map(n=>n.textContent.trim()).filter(Boolean);
  if(!blocks.length&&result.textContent)blocks=[result.textContent.trim()];
 }else{
  method='local fallback';
  const main=doc.querySelector('article')||doc.querySelector('main')||doc.querySelector('[role="main"]')||doc.body;
  blocks=[...main.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,pre')].filter(n=>!n.querySelector('p,li,blockquote,pre')).map(n=>n.textContent.trim()).filter(Boolean);
  if(!blocks.length)blocks=[main.textContent.trim()];
 }
 blocks=blocks.filter(t=>t&&t.toLowerCase()!==name.trim().toLowerCase()&&t.toLowerCase()!==byline.trim().toLowerCase());
 if(blocks.join(' ').length<80)throw Error('Not enough article text found. Try saving the rendered page or copying its article text.');
 return {title:name.trim(),byline,blocks:[name.trim(),byline,...blocks].filter(Boolean),method};
}
export async function fetchArticle(address,signal){
 const url=new URL(address);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Enter a public HTTP or HTTPS article URL.');
 const response=await fetch(url.href,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal});
 if(!response.ok)throw Error('Website returned HTTP '+response.status);
 if(!/html|xhtml/i.test(response.headers.get('content-type')||''))throw Error('This URL does not return an HTML article.');
 const length=Number(response.headers.get('content-length'));if(length>20_000_000)throw Error('Page exceeds the 20 MB limit.');
 return extractArticle(await response.text());
}
