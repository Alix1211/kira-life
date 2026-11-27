const fs=require('fs');
const file=__dirname+'/index.html';let html=fs.readFileSync(file,'utf8');
const start='/* R20 UPDATE BEGIN */',end='/* R20 UPDATE END */';
const old=html.indexOf(start);if(old>=0){const last=html.indexOf(end,old);if(last<0)throw Error('R20 end marker missing');html=html.slice(0,old)+html.slice(last+end.length);}
const needle="main().catch(error=>{status.textContent='공방을 불러오지 못했습니다.';console.error(error);});";
if(!html.includes(needle))throw Error('Boot marker missing');
const extra=['r22-mailbox.js','r23-travel.js'].filter(f=>fs.existsSync(__dirname+'/'+f)).map(f=>'\n'+fs.readFileSync(__dirname+'/'+f,'utf8')).join('');
html=html.replace(needle,start+'\n'+fs.readFileSync(__dirname+'/r20-update.js','utf8')+extra+'\n'+end+'\n'+needle);
if(!html.includes('href="simple-ui.css"'))html=html.replace('</head>','<link rel="stylesheet" href="simple-ui.css"></head>');
fs.writeFileSync(file,html);
console.log('R20 source embedded.');
