const fs=require('node:fs'),path=require('node:path');
let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),count=0;
html=html.replace(/<script\b([^>]*\bdata-n="(\d+)"[^>]*)>\s*<\/script>/g,(m,attrs,id)=>{
 count++;return '<script'+attrs+'>'+fs.readFileSync(path.join(__dirname,'assets',id+'.bin')).toString('base64')+'</script>';
});
const loader="async function assetBytes(el){const r=await fetch('assets/'+el.dataset.n+'.bin');if(!r.ok)throw Error('Missing file: '+el.dataset.n);return r.arrayBuffer();}";
if(!html.includes(loader))throw Error('Asset loader missing');
html=html.replace(loader,"async function assetBytes(el){const raw=atob(el.textContent.trim()),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out.buffer;}");
let css=fs.readFileSync(path.join(__dirname,'simple-ui.css'),'utf8');
// Large image data inside CSS custom properties can be discarded by the engine.
// Keep PNG bytes in inert script nodes, then use short Blob URLs in CSS.
const art=['panel','button','sheet','world-map'].map(name=>'<script id="kira-ui-'+name+'" type="application/octet-stream">'+fs.readFileSync(path.join(__dirname,'ui/lavender-'+name+'.png')).toString('base64')+'</script>').join('\n');
html=html.replace('<script type="module">',()=>art+'\n<script type="module">');
html=html.replace('<link rel="stylesheet" href="simple-ui.css">','<style>'+css+'</style>');
const out=path.resolve(__dirname,'../deliverables/KIRA_LIFE_R23_2.html');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);
console.log(JSON.stringify({file:out,assets:count,bytes:fs.statSync(out).size}));
