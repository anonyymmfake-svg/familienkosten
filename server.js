import http from 'node:http';
import {randomBytes, timingSafeEqual, createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {MongoClient} from 'mongodb';
import {validate} from './validation.js';

const {MONGODB_URI,FAMILY_PASSWORD,ALLOWED_ORIGIN} = process.env;
if (!MONGODB_URI || !FAMILY_PASSWORD || FAMILY_PASSWORD.length < 16 || !ALLOWED_ORIGIN) throw Error('MONGODB_URI, FAMILY_PASSWORD (mindestens 16 Zeichen) und ALLOWED_ORIGIN setzen.');
const client = new MongoClient(MONGODB_URI,{serverSelectionTimeoutMS:10000});
await client.connect();
const collection = client.db(process.env.MONGODB_DB || 'familienkosten').collection('budgets');
await collection.updateOne({_id:'family'},{$setOnInsert:{people:[],rows:[],version:0}},{upsert:true});
const sessions = new Map(), attempts = new Map();
setInterval(()=>{ const now=Date.now(); for(const [k,v] of sessions) if(v<now) sessions.delete(k); for(const [k,v] of attempts) if(v.until<now) attempts.delete(k); },60000).unref();
const digest = s => createHash('sha256').update(s).digest();
async function body(req) { let result=''; for await (const chunk of req) { result+=chunk; if(Buffer.byteLength(result)>200000) throw Error('Anfrage zu groß.'); } return JSON.parse(result); }
const server = http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
  if(origin && origin!==ALLOWED_ORIGIN) {res.writeHead(403).end();return;}
  if(origin) {res.setHeader('Access-Control-Allow-Origin',origin); res.setHeader('Vary','Origin');}
  res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  if(req.method==='OPTIONS') {res.writeHead(204).end();return;}
  try {
    if(req.url==='/api/login' && req.method==='POST') {
      const ip=req.socket.remoteAddress, now=Date.now();
      let attempt=attempts.get(ip); if(!attempt || attempt.until<now) {attempt={count:0,until:now+900000}; attempts.set(ip,attempt);}
      if(++attempt.count>20) return send(429,{error:'Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.'});
      const {password}=await body(req);
      if(typeof password!=='string' || !timingSafeEqual(digest(password),digest(FAMILY_PASSWORD))) return send(401,{error:'Passwort stimmt nicht.'});
      const token=randomBytes(32).toString('hex'); sessions.set(token,now+28800000); return send(200,{token});
    }
    if(req.url?.startsWith('/api/')) {
      const token=(req.headers.authorization||'').replace(/^Bearer /,'');
      if((sessions.get(token)||0)<Date.now()) return send(401,{error:'Bitte erneut anmelden.'});
      if(req.url==='/api/logout' && req.method==='POST') {sessions.delete(token);return send(200,{ok:true});}
      if(req.url==='/api/budget' && req.method==='GET') {const {_id,...data}=await collection.findOne({_id:'family'});return send(200,data);}
      if(req.url==='/api/budget' && req.method==='PUT') {
        const input=await body(req); const data=validate(input);
        if(!Number.isSafeInteger(input.version)||input.version<0) return send(400,{error:'Ungültige Version.'});
        const result=await collection.updateOne({_id:'family',version:input.version},{$set:{...data,updatedAt:new Date().toISOString()},$inc:{version:1}});
        if(!result.matchedCount) return send(409,{error:'Die Tabelle wurde auf einem anderen Gerät geändert. Lade den aktuellen Stand, bevor du weiter speicherst.'});
        return send(200,{version:input.version+1});
      }
      return send(404,{error:'Nicht gefunden.'});
    }
    const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css','/config.js':'config.js'};
    const file=files[req.url]; if(!file || req.method!=='GET') return send(404,{error:'Nicht gefunden.'});
    res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self' https:; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8'});res.end(await readFile(new URL('./public/'+file,import.meta.url)));
  } catch(e) { if(e instanceof SyntaxError || /Ungültig|Anfrage/.test(e.message)) send(400,{error:e.message}); else send(503,{error:'Speicher momentan nicht erreichbar. Bitte erneut versuchen.'}); }
});
server.listen(process.env.PORT||3000,'0.0.0.0');
process.on('SIGTERM',()=>server.close(async()=>{await client.close();process.exit(0);}));
