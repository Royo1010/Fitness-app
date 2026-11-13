const test=require('node:test');
const assert=require('node:assert/strict');
const {mkdtemp,writeFile,readFile,rm}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
async function fixture(){
 const dir=await mkdtemp(path.join(tmpdir(),'ritme-settings-')),stateFile=path.join(dir,'state.json');
 const initial={admin:true,secrets:['CODEX_APP_PRIVATE_KEY'],rulesets:[{id:1,name:'Existing user rules',rules:[{type:'deletion'}]}],variables:{},writes:[],repo:{allow_squash_merge:false,delete_branch_on_merge:false}};
 await writeFile(stateFile,JSON.stringify(initial));
 await writeFile(path.join(dir,'gh'),`#!/usr/bin/env node
const fs=require('node:fs'),file=process.env.RITME_TEST_GH_STATE,state=JSON.parse(fs.readFileSync(file)),args=process.argv.slice(2);let result;
if(args[0]==='api'){
 const route=args[1],method=args.includes('--method')?args[args.indexOf('--method')+1]:'GET';
 if(method==='GET'){
  if(route==='repos/Royo1010/Fitness-app')result={default_branch:'main',permissions:{admin:state.admin},...state.repo};
  else if(route.startsWith('users/'))result={id:42,login:'Royo1010',type:'User'};
  else if(route.endsWith('/rulesets'))result=[state.rulesets];
  else result=state.rulesets.find(r=>r.id===Number(route.split('/').at(-1)));
 }else{
  const input=JSON.parse(fs.readFileSync(0,'utf8'));state.writes.push({route,method,input});
  if(route.endsWith('/rulesets')){result={...input,id:2};state.rulesets.push(result);}else{Object.assign(state.repo,input);result=state.repo;}
 }
}else if(args[0]==='secret')result=state.secrets.map(name=>({name}));
else if(args[0]==='variable'){state.variables[args[2]]=args.at(-1);state.writes.push({variable:args[2],value:args.at(-1)});}
fs.writeFileSync(file,JSON.stringify(state));if(result!==undefined)process.stdout.write(JSON.stringify(result));
`,{mode:0o755});
 return {dir,initial,read:async()=>JSON.parse(await readFile(stateFile,'utf8')),write:state=>writeFile(stateFile,JSON.stringify(state)),run:()=>spawnSync(process.execPath,[path.join(__dirname,'setup-codex.mjs'),'--trusted-login','Royo1010','--app-id','123'],{env:{...process.env,PATH:dir+path.delimiter+process.env.PATH,RITME_TEST_GH_STATE:stateFile},encoding:'utf8'}),close:()=>rm(dir,{recursive:true,force:true})};
}
test('beheerconfiguratie is herhaalbaar en bewaart bestaande regels en overige instellingen',async()=>{
 const f=await fixture();try{
  let result=f.run();assert.equal(result.status,0,result.stderr);result=f.run();assert.equal(result.status,0,result.stderr);
  const state=await f.read();assert.equal(state.rulesets.length,2);assert.deepEqual(state.rulesets[0],f.initial.rulesets[0]);assert.equal(state.repo.delete_branch_on_merge,false);
  const managed=state.rulesets[1];assert.equal(managed.enforcement,'active');assert.deepEqual(managed.bypass_actors,[]);assert.equal(managed.rules.find(r=>r.type==='required_status_checks').parameters.strict_required_status_checks_policy,true);
  assert.equal(state.variables.CODEX_TRUSTED_ACTOR_ID,'42');assert.equal(state.variables.CODEX_APP_ID,'123');assert.equal(state.variables.CODEX_AUTOMATION_ENABLED,'true');
 }finally{await f.close();}
});
for(const [name,mutate] of [['geen beheerrechten',s=>s.admin=false],['geen App-secret',s=>s.secrets=[]]])test(`geen instellingen gewijzigd bij ${name}`,async()=>{
 const f=await fixture();try{const state=await f.read();mutate(state);await f.write(state);assert.notEqual(f.run().status,0);assert.deepEqual((await f.read()).writes,[]);}finally{await f.close();}
});
test('bestaande afwijkende ruleset wordt niet overschreven',async()=>{
 const f=await fixture();try{assert.equal(f.run().status,0);const state=await f.read();state.writes=[];state.rulesets[1].bypass_actors=[{actor_type:'Integration',actor_id:123,bypass_mode:'always'}];await f.write(state);assert.notEqual(f.run().status,0);assert.deepEqual((await f.read()).writes,[]);}finally{await f.close();}
});
