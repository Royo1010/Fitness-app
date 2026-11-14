const test = require('node:test');
const assert = require('node:assert/strict');
const {run, protectedMain, protectedPath, trustedRun} = require('./codex-automation.cjs');
const rules = [{type:'pull_request'},{type:'required_status_checks',parameters:{strict_required_status_checks_policy:true,required_status_checks:[{context:'build',integration_id:15368}]}}];
function fixture(event='pull_request') {
  const repo={id:11,full_name:'Royo1010/Fitness-app',default_branch:'main',allow_squash_merge:true};
  const push={id:500,status:'completed',event:'push',conclusion:'success',actor:{id:42,login:'Royo1010'},triggering_actor:{id:42,login:'Royo1010'},head_repository:repo,repository:repo,head_branch:'codex/example',head_sha:'abc',workflow_id:7,path:'.github/workflows/deploy.yml'};
  const trigger={...push,event,pull_requests:[{number:10}]};
  const pr={number:10,user:{login:'ritme-publisher[bot]'},head:{sha:'abc',ref:'codex/example',repo},base:{ref:'main',repo},draft:false,state:'open',mergeable:true,mergeable_state:'clean'};
  const calls=[];
  const f={enabled:'true',repo,push,trigger,pr,rules:structuredClone(rules),files:[{filename:'fitnessapp/dist/app.mjs'}],current:'abc',pulls:event==='push'?[]:[pr],runs:[push],calls};
  const response=value=>Promise.resolve({data:value});
  const github={rest:{repos:{get:()=>response(repo),getBranch:()=>response({commit:{sha:f.current}}),compareCommitsWithBasehead:()=>response({files:f.files}),getBranchRules:()=>response(f.rules)},actions:{getWorkflow:()=>response({id:7}),listWorkflowRuns:()=>{}},pulls:{list:()=>{},get:()=>response(pr),create:args=>{calls.push(['create',args]);return response({number:10});},merge:args=>{calls.push(['merge',args]);return f.mergeError ? Promise.reject(f.mergeError) : response({merged:true,sha:'merged'});}}},paginate:method=>Promise.resolve(method===github.rest.pulls.list?f.pulls:f.runs)};
  f.execute=()=>run({github,context:{eventName:'workflow_run',repo:{owner:'Royo1010',repo:'Fitness-app'},payload:{repository:repo,workflow_run:trigger}},core:{info:()=>{}},env:{CODEX_AUTOMATION_ENABLED:f.enabled,CODEX_TRUSTED_ACTOR_ID:'42',CODEX_APP_BOT:'ritme-publisher[bot]'}});
  return f;
}
test('vertrouwde geslaagde push maakt uitsluitend een PR; geslaagde PR merge exact geteste SHA',async()=>{
 const push=fixture('push');assert.equal(await push.execute(),'created');assert.equal(push.calls[0][1].base,'main');assert.equal(push.calls.some(c=>c[0]==='merge'),false);
 const pr=fixture();assert.equal(await pr.execute(),'merged');assert.equal(pr.calls[0][1].sha,'abc');assert.equal(pr.calls[0][1].merge_method,'squash');
});
for(const [name,change] of [
 ['uitgeschakelde automatisering',f=>f.enabled='false'],
 ['andere branch-namespace',f=>f.trigger.head_branch='feature/example'],
 ['workflow_dispatch veroorzaakt geen vervolglus',f=>f.trigger.event='workflow_dispatch'],
 ['gewijzigde variabele kan ander account niet vertrouwen',f=>f.push.actor={id:42,login:'other-account'}],
 ['onvertrouwde pusher',f=>f.push.actor={id:99}],
 ['herstart door ander account',f=>f.push.triggering_actor={id:99}],
 ['geen succesvolle pushcontrole',f=>f.push.conclusion='failure'],
 ['verouderde controle',f=>f.current='new-sha'],
 ['fork',f=>f.pr.head.repo={id:99}],
 ['andere PR-auteur',f=>f.pr.user.login='someone'],
 ['draft',f=>f.pr.draft=true],
 ['verkeerde PR-run',f=>f.trigger.pull_requests=[{number:99}]],
 ['andere workflow',f=>f.trigger.workflow_id=99],
 ['geen herkomstbewijs',f=>f.runs=[]],
 ['beschermde workflow',f=>f.files=[{filename:'.github/workflows/deploy.yml'}]],
 ['hernoemde workflow',f=>f.files=[{filename:'harmless.txt',previous_filename:'.github/scripts/code.cjs'}]],
 ['te grote diff',f=>f.files=Array.from({length:300},()=>({filename:'app.js'}))],
 ['main zonder verplichte PR',f=>f.rules=f.rules.filter(r=>r.type!=='pull_request')],
 ['main zonder strikte controles',f=>f.rules[1].parameters.strict_required_status_checks_policy=false],
 ['verkeerde checknaam',f=>f.rules[1].parameters.required_status_checks[0].context='fake'],
 ['check van verkeerde app',f=>f.rules[1].parameters.required_status_checks[0].integration_id=99],
 ['conflict',f=>{f.pr.mergeable=false;f.pr.mergeable_state='dirty';}],
 ['onbekende status',f=>f.pr.mergeable=null],
 ['andere vereiste blokkeert',f=>f.pr.mergeable_state='blocked'],
 ['oudere basis',f=>f.pr.mergeable_state='behind'],
 ['mislukte PR',f=>f.trigger.conclusion='failure'],
 ['publicatie op main',f=>f.trigger.head_branch='main']
]) test(`geen merge bij ${name}`,async()=>{const f=fixture();change(f);await f.execute();assert.equal(f.calls.length,0);});
test('nieuwe push tijdens merge wordt niet met een geforceerde tweede poging geaccepteerd',async()=>{const f=fixture();f.mergeError=new Error('409 head changed');await assert.rejects(f.execute(),/head changed/);assert.equal(f.calls.length,1);assert.equal(f.calls[0][1].sha,'abc');});
test('PR wordt niet gedupliceerd en handmatige PR wordt niet overgenomen',async()=>{const f=fixture('push');f.pulls=[f.pr];await f.execute();assert.equal(f.calls.length,0);});
test('vertrouwensgrens gebruikt actor-ID, pushherkomst en expliciete main-beveiliging',()=>{
 assert.ok(protectedMain(rules));assert.equal(protectedMain([]),false);
 assert.ok(protectedPath('AGENTS.md'));assert.ok(protectedPath('folder/CODEOWNERS'));assert.equal(protectedPath('fitnessapp/dist/app.mjs'),false);
 const f=fixture();assert.ok(trustedRun(f.push,f.repo,'42','abc','codex/example'));
});

test('onvertrouwde branchpush maakt ook geen PR',async()=>{const f=fixture('push');f.trigger.actor={id:99};await f.execute();assert.equal(f.calls.length,0);});
