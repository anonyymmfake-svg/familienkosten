const $ = id => document.getElementById(id);
let token=sessionStorage.getItem('vocabulary-token')||'',words=[],version=0,dirty=false,canEdit=false,editing=null,queue=[],mistakes=[],index=0,correct=0,checked=false;
const message=text=>{$('message').textContent=text;};
async function api(path,method='GET',data){
  const res=await fetch((window.API_URL||'')+'/api/'+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},...(data?{body:JSON.stringify(data)}:{})});
  const result=await res.json();
  if(!res.ok)throw Error(result.error||'Verbindung fehlgeschlagen.');
  return result;
}
function changed(){dirty=true;$('save-state').textContent='Ungespeicherte Änderungen – bitte speichern.';render();}
function tab(name){for(const key of ['learn','words']){$(key+'-panel').hidden=key!==name;$('tab-'+key).classList.toggle('active',key===name);$('tab-'+key).setAttribute('aria-pressed',String(key===name));}}
function render(){
  $('word-count').textContent=words.length;$('empty-hint').hidden=words.length>0;$('start').disabled=!words.length;
  const previous=$('lesson').value;$('lesson').replaceChildren(new Option('Alle Lektionen',''));
  for(const group of [...new Set(words.map(w=>w.group).filter(Boolean))].sort())$('lesson').add(new Option(group,group));
  if([...$('lesson').options].some(o=>o.value===previous))$('lesson').value=previous;
  const query=$('search').value.toLocaleLowerCase('de');const visible=words.filter(w=>(w.de+' '+w.en+' '+w.group).toLocaleLowerCase('de').includes(query));
  $('word-list').replaceChildren();$('list-empty').hidden=!!visible.length;
  for(const word of visible){
    const row=document.createElement('div');row.className='word-row';
    for(const value of [word.de,word.en,word.group||'Ohne Lektion']){const el=document.createElement('span');el.textContent=value;row.append(el);}
    const actions=document.createElement('div');actions.className='row-actions';
    for(const [label,action] of [['Bearbeiten',()=>{editing=word.id;for(const key of ['de','en','group'])$(key).value=word[key];$('add').textContent='Übernehmen';$('cancel-edit').hidden=false;$('de').focus();}],['Löschen',()=>{if(confirm('„'+word.de+'“ löschen?')){words=words.filter(w=>w.id!==word.id);if(editing===word.id)resetForm();changed();}}]]){const button=document.createElement('button');button.textContent=label;button.disabled=!canEdit;button.onclick=action;actions.append(button);}row.append(actions);$('word-list').append(row);
  }
}
function resetForm(){editing=null;$('word-form').reset();$('add').textContent='Hinzufügen';$('cancel-edit').hidden=true;}
async function load(){const data=await api('vocabulary');words=data.words;version=data.version;canEdit=data.canEdit;dirty=false;resetForm();for(const id of ['de','en','group','add','save'])$(id).disabled=!canEdit;$('save-state').textContent=canEdit?'Mit dem Server synchronisiert.':'Lesezugriff – zum Bearbeiten mit dem Bearbeitungspasswort anmelden.';$('workspace').hidden=false;$('login-panel').hidden=true;$('logout').hidden=false;render();}
$('login-form').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const result=await api('login','POST',{password:$('password').value});token=result.token;sessionStorage.setItem('vocabulary-token',token);$('password').value='';await load();message('');}catch(e){message(e.message);}finally{button.disabled=false;}};
$('logout').onclick=async()=>{if(dirty&&!confirm('Ungespeicherte Änderungen verwerfen und abmelden?'))return;try{await api('logout','POST');}catch{}token='';sessionStorage.removeItem('vocabulary-token');words=[];queue=[];dirty=false;$('workspace').hidden=true;$('login-panel').hidden=false;$('logout').hidden=true;message('');};
$('tab-learn').onclick=()=>tab('learn');$('tab-words').onclick=()=>tab('words');$('search').oninput=render;
$('word-form').onsubmit=event=>{event.preventDefault();if(!canEdit)return;const word={id:editing||crypto.randomUUID(),de:$('de').value.trim(),en:$('en').value.trim(),group:$('group').value.trim()};if(!word.de||!word.en)return;if(editing)words=words.map(w=>w.id===editing?word:w);else words.push(word);resetForm();changed();$('de').focus();};
$('cancel-edit').onclick=resetForm;
$('save').onclick=async()=>{const button=$('save');button.disabled=true;const snapshot=JSON.stringify(words);try{const result=await api('vocabulary','PUT',{words:JSON.parse(snapshot),version});version=result.version;dirty=JSON.stringify(words)!==snapshot;$('save-state').textContent=dirty?'Weitere Änderungen vorhanden – erneut speichern.':'Gespeichert – auf deinen anderen Geräten verfügbar.';message('');}catch(e){message(e.message+' Deine Änderungen bleiben hier erhalten.');}finally{button.disabled=!canEdit;}};
$('reload').onclick=async()=>{if(dirty&&!confirm('Ungespeicherte Änderungen verwerfen und Serverstand laden?'))return;try{await load();message('Aktueller Stand geladen.');}catch(e){message(e.message);}};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({words},null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='wortweise-sicherung.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function shuffle(items){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function begin(items){queue=shuffle(items);index=0;correct=0;mistakes=[];$('setup').hidden=true;$('result').hidden=true;$('quiz').hidden=false;show();}
$('start').onclick=()=>{const selected=words.filter(w=>!$('lesson').value||w.group===$('lesson').value);if(!selected.length){message('Diese Lektion enthält keine Vokabeln.');return;}begin(selected.map(w=>({word:{...w},direction:$('direction').value==='mixed'?(Math.random()<.5?'de':'en'):$('direction').value})));};
function show(){checked=false;const item=queue[index];$('position').textContent='Wort '+(index+1)+' von '+queue.length;$('progress').max=queue.length;$('progress').value=index;$('prompt-label').textContent=item.direction==='de'?'ÜBERSETZE INS ENGLISCHE':'ÜBERSETZE INS DEUTSCHE';$('prompt').textContent=item.word[item.direction];$('answer').value='';$('answer').disabled=false;$('check').disabled=false;$('reveal').hidden=false;$('next').hidden=true;$('feedback').textContent='';$('answer').focus();}
const normalize=value=>value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de');
function check(reveal=false){if(checked)return;checked=true;const item=queue[index],solution=item.word[item.direction==='de'?'en':'de'];const success=!reveal&&solution.split(';').some(value=>normalize(value)===normalize($('answer').value));if(success)correct++;else mistakes.push(item);$('feedback').textContent=success?'Richtig! '+solution:(reveal?'Die Lösung: ':'Noch nicht ganz. Die Lösung: ')+solution;$('answer').disabled=true;$('check').disabled=true;$('reveal').hidden=true;$('next').hidden=false;$('next').focus();}
$('answer-form').onsubmit=event=>{event.preventDefault();check();};$('reveal').onclick=()=>check(true);
$('next').onclick=()=>{index++;if(index<queue.length)show();else{$('quiz').hidden=true;$('result').hidden=false;$('score').textContent=correct+' von '+queue.length+' richtig';$('result-text').textContent=mistakes.length?'Diese Wörter kannst du gleich noch einmal üben.':'Alle Wörter geschafft. Zeit für die nächste Runde!';$('retry').hidden=!mistakes.length;}};
$('retry').onclick=()=>begin(mistakes);function setup(){$('quiz').hidden=true;$('result').hidden=true;$('setup').hidden=false;}$('restart').onclick=setup;$('stop').onclick=setup;
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
if(token)load().catch(e=>message(e.message+' Melde dich gegebenenfalls erneut an.'));
