// One-time administration. Preserves all existing settings/rules; adds one named ruleset.
import {execFileSync} from 'node:child_process';
const repo='Royo1010/Fitness-app', prefix=`repos/${repo}`;
const options=Object.fromEntries(process.argv.slice(2).reduce((pairs,value,i,all)=>{if(i%2===0)pairs.push([value,all[i+1]]);return pairs;},[]));
const login=options['--trusted-login'], appId=options['--app-id'];
if(!login || !/^[1-9]\d*$/.test(appId||'')) throw new Error('Gebruik: node .github/scripts/setup-codex.mjs --trusted-login <GitHub-login van Codex-pusher> --app-id <GitHub App ID>');
if(login.toLowerCase()!=='royo1010') throw new Error('Dit beleid vertrouwt uitsluitend Royo1010; een andere identiteit vereist handmatige codebeoordeling.');
const gh=(...args)=>execFileSync('gh',args,{encoding:'utf8',stdio:['pipe','pipe','inherit']});
const api=route=>JSON.parse(gh('api',route)||'null');
// Structured JSON is passed through stdin, never interpolated into shell commands.
const write=(route,method,data)=>JSON.parse(execFileSync('gh',['api',route,'--method',method,'--input','-'],{input:JSON.stringify(data),encoding:'utf8',stdio:['pipe','pipe','inherit']})||'null');
const repository=api(prefix);
if(repository.default_branch!=='main'||repository.permissions?.admin!==true) throw new Error('Beheerrechten op de bestaande repository en default branch main zijn vereist.');
const actor=api(`users/${encodeURIComponent(login)}`);
if(actor.type!=='User') throw new Error('Kies het echte gebruikersaccount waarmee dit Codex-proces pusht; bots vereisen een expliciet aangepast vertrouwensbeleid.');
const secrets=JSON.parse(gh('secret','list','--repo',repo,'--json','name'));
if(!secrets.some(s=>s.name==='CODEX_APP_PRIVATE_KEY')) throw new Error('Stel CODEX_APP_PRIVATE_KEY eerst veilig in als GitHub repositorysecret. Geen sleutels in chat of bestanden opnemen.');
const desired={name:'Ritme Codex main checks',target:'branch',enforcement:'active',bypass_actors:[],conditions:{ref_name:{include:['refs/heads/main'],exclude:[]}},rules:[
 {type:'deletion'},{type:'non_fast_forward'},
 {type:'pull_request',parameters:{dismiss_stale_reviews_on_push:true,require_code_owner_review:false,require_last_push_approval:false,required_approving_review_count:0,required_review_thread_resolution:true}},
 {type:'required_status_checks',parameters:{strict_required_status_checks_policy:true,required_status_checks:[{context:'build',integration_id:15368}]}}
]};
const pages=JSON.parse(gh('api',`${prefix}/rulesets`,'--paginate','--slurp')).flat();
const managed=pages.filter(r=>r.name===desired.name);
if(managed.length>1) throw new Error('Dubbele beheerde ruleset; controleer instellingen handmatig.');
if(managed.length){
 const existing=api(`${prefix}/rulesets/${managed[0].id}`);
 const contains=(actual,expected)=>{
  if(Array.isArray(expected)) return Array.isArray(actual)&&actual.length===expected.length&&expected.every((item,i)=>contains(actual[i],item));
  if(expected&&typeof expected==='object') return actual&&Object.keys(expected).every(key=>contains(actual[key],expected[key]));
  return actual===expected;
 };
 existing.rules?.sort((a,b)=>a.type.localeCompare(b.type));desired.rules.sort((a,b)=>a.type.localeCompare(b.type));
 if(!contains(existing,desired)) throw new Error('Bestaande beheerde ruleset wijkt af; niets overschreven. Controleer de regels handmatig.');
}
// Disable first; any failure below leaves automation off.
gh('variable','set','CODEX_AUTOMATION_ENABLED','--repo',repo,'--body','false');
if(!managed.length) write(`${prefix}/rulesets`,'POST',desired);
if(!repository.allow_squash_merge) write(prefix,'PATCH',{allow_squash_merge:true});
gh('variable','set','CODEX_APP_ID','--repo',repo,'--body',appId);
gh('variable','set','CODEX_TRUSTED_ACTOR_ID','--repo',repo,'--body',String(actor.id));
gh('variable','set','CODEX_AUTOMATION_ENABLED','--repo',repo,'--body','true');
console.log(`Automatisering ingeschakeld voor ${actor.login} (ID ${actor.id}) op codex/*; bestaande strengere regels blijven van kracht.`);
