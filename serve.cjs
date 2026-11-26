const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(name==='/')name='/index.html';
 if(!['/index.html','/simple-ui.css'].includes(name)&&!/^\/assets\/\d+\.bin$/.test(name)){res.writeHead(404).end();return;}
 const target=path.join(root,name);fs.stat(target,(err,stat)=>{
  if(err||!stat.isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});
  fs.createReadStream(target).pipe(res);
 });
}).listen(8080,'127.0.0.1',()=>console.log('Kira R20: http://127.0.0.1:8080'));
