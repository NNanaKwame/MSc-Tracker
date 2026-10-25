const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..');
const html=fs.readFileSync(root+'/index.html','utf8'); const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n'); new vm.Script(scripts);
const dateCode=scripts.slice(scripts.indexOf('    function parseDeadline('),scripts.indexOf('    function deadlineLabel('));
const ctx=vm.createContext({Date});vm.runInContext(dateCode,ctx);
assert.equal(ctx.parseDeadline('Dec 2027'),null);assert.equal(ctx.parseDeadline('2027-02-30'),null);assert.equal(ctx.parseDeadline('2027-01-04').toISOString(),'2027-01-04T00:00:00.000Z');
const date=new Date('2027-01-04T12:30:00Z');assert.equal(ctx.daysUntil(date,new Date('2027-01-03T23:59:00Z')),1);assert.equal(date.getUTCHours(),12);
const data=JSON.parse(fs.readFileSync(root+'/data.json'));assert.equal(new Set(data.master.map(m=>m.university)).size,data.master.length);assert(data.master.every(m=>m.review));
const source=fs.readFileSync(root+'/api/sync.js','utf8').replace(/import .*?;\n/,'').replace('export default async function handler','async function handler');
let writes=0;class Redis {async hgetall(){return null} async hset(){writes++}}
const api=vm.createContext({Redis,process:{env:{ADMIN_SECRET:'test'}},console});vm.runInContext(source,api);
async function request(method,body){const res={setHeader(){},status(n){this.code=n;return this},json(v){this.body=v;return this}};await api.handler({method,body},res);return res;}
(async()=>{assert.equal((await request('POST',{type:'notes',key:'uni:EDISS',value:'a'})).code,401);assert.equal(writes,0);assert.equal((await request('POST',{type:'wrong',key:'uni:EDISS',value:'a',token:'test'})).code,400);assert.equal((await request('POST',{type:'status',key:'uni:EDISS',value:'Submitted',token:'test'})).code,200);assert.equal(writes,1);assert.equal((await request('DELETE')).code,405);assert.equal((await request('GET')).code,200);
const saveCode=scripts.slice(scripts.indexOf('    async function saveRemote('),scripts.indexOf('    /* ============================================================\n       TOAST'));
const save=vm.createContext({fetch:async()=>({ok:false,status:500}),adminToken:'test',remoteState:{statuses:{},notes:{}}});vm.runInContext(saveCode,save);await assert.rejects(save.setNotes('uni','EDISS','unsaved'));assert.equal(save.remoteState.notes['uni:EDISS'],undefined);
console.log('PASS: script syntax, dates, no date mutation, unique programmes, review coverage, API authorization/validation/methods, success persistence, failed-save state.');})();
