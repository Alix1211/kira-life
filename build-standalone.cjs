const fs=require('node:fs'),path=require('node:path');
let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),count=0;
html=html.replace(/<script\b([^>]*\bdata-n="(\d+)"[^>]*)>\s*<\/script>/g,(m,attrs,id)=>{
 count++;return '<script'+attrs+'>'+fs.readFileSync(path.join(__dirname,'assets',id+'.bin')).toString('base64')+'</script>';
});
const loader="async function assetBytes(el){const r=await fetch('assets/'+el.dataset.n+'.bin');if(!r.ok)throw Error('Missing file: '+el.dataset.n);return r.arrayBuffer();}";
if(!html.includes(loader))throw Error('Asset loader missing');
html=html.replace(loader,"async function assetBytes(el){const raw=atob(el.textContent.trim()),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out.buffer;}");
let css=fs.readFileSync(path.join(__dirname,'simple-ui.css'),'utf8');
css=css.replace(/ui\/lavender-(panel|button|sheet|world-map)\.png/g,(name)=>'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,name)).toString('base64'));
html=html.replace('<link rel="stylesheet" href="simple-ui.css">','<style>'+css+'</style>');
const out=path.resolve(__dirname,'../deliverables/KIRA_LIFE_R23_1.html');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);
console.log(JSON.stringify({file:out,assets:count,bytes:fs.statSync(out).size}));
