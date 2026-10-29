const $ = id => document.getElementById(id);
const euro = cents => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(cents/100);
let state={people:[],rows:[],version:0}, token='', demo=false, dirty=false, busy=false;
const apiBase=(window.API_URL||'').replace(/\/$/,'');
function say(text){$('message').textContent=text;}
function changed(){dirty=true;$('saveStatus').textContent=demo?'Vorschau – Änderungen werden nicht gespeichert.':'Ungespeicherte Änderungen';}
function totals(){
  const sums=state.people.map(p=>state.rows.reduce((sum,r)=>sum+(r.amounts[p.id]||0),0));
  const total=sums.reduce((a,b)=>a+b,0);
  $('monthly').textContent=euro(total);$('yearly').textContent=euro(total*12);$('count').textContent=state.people.length+' Personen';
  document.querySelectorAll('[data-person-total]').forEach(el=>el.textContent=euro(sums[Number(el.dataset.personTotal)]||0));
  document.querySelectorAll('[data-row-total]').forEach(el=>el.textContent=euro(Object.values(state.rows[Number(el.dataset.rowTotal)].amounts).reduce((a,b)=>a+b,0)));
  const end=$('grandTotal');if(end)end.textContent=euro(total);
  const allocation=$('allocation');
  if(allocation){
    allocation.replaceChildren();
    if(!state.people.length){const hint=document.createElement('p');hint.className='allocation-empty';hint.textContent='Wer gehört dazu? Fügt oben eure erste Person hinzu. Sobald ihr Beträge eintragt, seht ihr hier die Verteilung.';allocation.append(hint);}
    state.people.forEach((person,i)=>{const row=document.createElement('div');row.className='allocation-row';row.style.setProperty('--person-color',['#7751df','#db8c5e','#8da856','#569eab','#c86f99'][i%5]);const name=document.createElement('span');name.className='allocation-name';name.textContent=person.name;const track=document.createElement('div');track.className='allocation-track';const fill=document.createElement('div');fill.className='allocation-fill';fill.style.width=(total?sums[i]/total*100:0)+'%';track.append(fill);const value=document.createElement('strong');value.textContent=euro(sums[i]);row.append(name,track,value);allocation.append(row);});
  }
}
function button(text,label,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.className='remove';b.setAttribute('aria-label',label);b.onclick=fn;return b;}
function cell(row,tag='td'){const el=document.createElement(tag);row.append(el);return el;}
function nameInput(value,label,onchange){const el=document.createElement('input');el.type='text';el.value=value;el.maxLength=label.startsWith('Name')?60:100;el.setAttribute('aria-label',label);el.onchange=()=>{const v=el.value.trim();if(!v){el.value=value;return;}onchange(v);changed();totals();};return el;}
function render(){
  const table=$('budget');table.replaceChildren();
  const head=table.createTHead().insertRow();cell(head,'th').textContent='Kostenart / Hobby';
  state.people.forEach((p,i)=>{const th=cell(head,'th');th.append(nameInput(p.name,'Name der Person '+(i+1),v=>p.name=v),button('×',p.name+' entfernen',()=>{if(!confirm('Person und zugehörige Beträge entfernen?'))return;state.people.splice(i,1);state.rows.forEach(r=>delete r.amounts[p.id]);changed();render();}));});
  cell(head,'th').textContent='Gesamt / Monat';cell(head,'th').textContent='';
  const body=table.createTBody();
  state.rows.forEach((r,i)=>{
    const tr=body.insertRow();cell(tr).append(nameInput(r.name,'Kostenart '+(i+1),v=>r.name=v));
    state.people.forEach(p=>{const td=cell(tr),input=document.createElement('input');input.type='number';input.min='0';input.max='1000000';input.step='0.01';input.value=((r.amounts[p.id]||0)/100).toFixed(2);input.setAttribute('aria-label',r.name+' für '+p.name+' in Euro');input.oninput=()=>{if(!input.validity.valid||input.value==='')return;const cents=Math.round(Number(input.value)*100);if(!Number.isSafeInteger(cents))return;r.amounts[p.id]=cents;changed();totals();};input.onblur=()=>{input.value=((r.amounts[p.id]||0)/100).toFixed(2);};td.append(input);});
    const sum=cell(tr);sum.dataset.rowTotal=i;
    cell(tr).append(button('×',r.name+' entfernen',()=>{if(!confirm('Diese Kostenart entfernen?'))return;state.rows.splice(i,1);changed();render();}));
  });
  if(!state.rows.length){const td=cell(body.insertRow());td.colSpan=state.people.length+3;td.textContent='Startet mit einer Person und eurer ersten Kostenart.';}
  const foot=table.createTFoot().insertRow();cell(foot).textContent='Monatliche Summe';state.people.forEach((p,i)=>{cell(foot).dataset.personTotal=i;});cell(foot).id='grandTotal';cell(foot);
  totals();
}
async function api(path,method='GET',data){
  const response=await fetch(apiBase+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});
  let result;try{result=await response.json();}catch{throw Error('Backend nicht erreichbar. Bitte zuerst die API-URL in config.js eintragen.');}
  if(!response.ok){if(response.status===401 && path!=='/api/login'){token='';$('workspace').hidden=true;$('login').hidden=false;$('logout').hidden=true;}throw Error(result.error||'Anfrage fehlgeschlagen.');}return result;
}
function open(){ $('login').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;$('save').disabled=demo;$('reload').disabled=demo;render(); }
$('loginForm').onsubmit=async event=>{event.preventDefault();say('');try{const result=await api('/api/login','POST',{password:$('password').value});token=result.token;$('password').value='';state=await api('/api/budget');demo=false;dirty=false;$('saveStatus').textContent='Aus MongoDB geladen';open();}catch(e){say(e.message);}};
$('demo').onclick=()=>{demo=true;state={people:[{id:'p1',name:'Person 1'},{id:'p2',name:'Person 2'},{id:'p3',name:'Person 3'}],rows:[{id:'r1',name:'Sportverein',amounts:{p1:2500,p2:1800,p3:1800}},{id:'r2',name:'Musikunterricht',amounts:{p2:6500}},{id:'r3',name:'Handyvertrag',amounts:{p1:1500,p2:999}},{id:'r4',name:'Freizeit & Hobbys',amounts:{p1:3500,p3:2000}}],version:0};say('Beispieldaten – keine Verbindung zu MongoDB.');open();$('saveStatus').textContent='Vorschau – Änderungen werden nicht gespeichert.';};
$('addPerson').onclick=()=>{if(state.people.length>=30)return say('Maximal 30 Personen.');state.people.push({id:crypto.randomUUID(),name:'Neue Person'});changed();render();};
$('addRow').onclick=()=>{if(state.rows.length>=300)return say('Maximal 300 Kostenarten.');state.rows.push({id:crypto.randomUUID(),name:'Neue Kostenart',amounts:{}});changed();render();};
$('save').onclick=async()=>{if(demo||busy)return;if(!document.querySelector('#budget').reportValidity?.()) {const invalid=document.querySelector('#budget input:invalid');if(invalid){invalid.reportValidity();return;}}busy=true;$('save').disabled=true;const snapshot=JSON.stringify(state);say('');try{const result=await api('/api/budget','PUT',JSON.parse(snapshot));const unchanged=JSON.stringify(state)===snapshot;state.version=result.version;dirty=!unchanged;$('saveStatus').textContent=unchanged?'In MongoDB gespeichert · '+new Date().toLocaleTimeString('de-DE'):'Weitere Änderungen noch nicht gespeichert';}catch(e){say(e.message);}finally{busy=false;$('save').disabled=false;}};
$('reload').onclick=async()=>{if(dirty&&!confirm('Ungespeicherte Änderungen verwerfen und gespeicherten Stand laden?'))return;try{state=await api('/api/budget');dirty=false;render();$('saveStatus').textContent='Aktueller Stand geladen';say('');}catch(e){say(e.message);}};
$('logout').onclick=async()=>{if(dirty&&!confirm('Abmelden und ungespeicherte Änderungen verwerfen?'))return;if(token)try{await api('/api/logout','POST',{});}catch{}token='';state={people:[],rows:[],version:0};dirty=false;demo=false;$('workspace').hidden=true;$('login').hidden=false;$('logout').hidden=true;$('budget').replaceChildren();say('');};
$('export').onclick=()=>{const safe=value=>'"'+String(value).replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';const rows=[['Kostenart',...state.people.map(p=>p.name)],...state.rows.map(r=>[r.name,...state.people.map(p=>((r.amounts[p.id]||0)/100).toFixed(2).replace('.',','))]),['Summe',...state.people.map(p=>(state.rows.reduce((s,r)=>s+(r.amounts[p.id]||0),0)/100).toFixed(2).replace('.',','))]];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(safe).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='familienkosten.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('beforeunload',event=>{if(dirty&&!demo){event.preventDefault();event.returnValue='';}});

if(!apiBase && location.hostname.endsWith('github.io')) { $('loginForm').hidden=true; $('login').querySelector('p').textContent='Die MongoDB-Anbindung wird noch eingerichtet. Bis dahin könnt ihr die Tabelle mit Beispieldaten ausprobieren.'; }
