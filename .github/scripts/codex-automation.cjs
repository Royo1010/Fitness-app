// Runs only from main in the privileged workflow_run handler. Never execute PR code here.
const REPOSITORY = 'Royo1010/Fitness-app';
const ACTIONS_APP = 15368;
function protectedPath(filename) {
  return filename.startsWith('.github/') || /(^|\/)(AGENTS\.md|CODEOWNERS)$/.test(filename);
}
function trustedRun(run, repo, actorId, sha, branch) {
  return run.event === 'push' && run.conclusion === 'success' && run.status === 'completed' &&
    run.actor?.login === 'Royo1010' && (run.triggering_actor?.login ?? run.actor?.login) === 'Royo1010' &&
    String(run.actor?.id) === actorId && String(run.triggering_actor?.id ?? run.actor?.id) === actorId &&
    run.head_repository?.id === repo.id && run.repository?.id === repo.id &&
    run.head_sha === sha && run.head_branch === branch;
}
function protectedMain(rules) {
  return rules.some(r => r.type === 'pull_request') && rules.some(r => r.type === 'required_status_checks' &&
    r.parameters?.strict_required_status_checks_policy === true &&
    r.parameters.required_status_checks?.some(check => check.context === 'build' && check.integration_id === ACTIONS_APP));
}
async function run({github, context, core, env = process.env}) {
  const skip = message => { core.info(`Geen automatische wijziging: ${message}`); return message; };
  if (env.CODEX_AUTOMATION_ENABLED !== 'true') return skip('automatisering is niet geactiveerd');
  if (context.payload.repository?.full_name !== REPOSITORY || context.eventName !== 'workflow_run') return skip('verkeerde repository of gebeurtenis');
  const trigger = context.payload.workflow_run;
  if (!trigger || trigger.conclusion !== 'success' || !['push','pull_request'].includes(trigger.event)) return skip('geen geslaagde branch- of PR-controle');
  const actorId = env.CODEX_TRUSTED_ACTOR_ID;
  if (!/^[1-9]\d*$/.test(actorId || '') || !env.CODEX_APP_BOT) return skip('vertrouwde identiteit ontbreekt');
  const {owner,repo} = context.repo, args = {owner,repo};
  const {data: repository} = await github.rest.repos.get(args);
  if (repository.full_name !== REPOSITORY || repository.default_branch !== 'main') return skip('onverwachte standaardbranch');
  const {data: workflow} = await github.rest.actions.getWorkflow({...args,workflow_id:'deploy.yml'});
  if (trigger.workflow_id !== workflow.id || trigger.path !== '.github/workflows/deploy.yml') return skip('andere CI-workflow');
  const branch = trigger.head_branch, sha = trigger.head_sha;
  if (!branch?.startsWith('codex/') || branch === 'codex/' || trigger.head_repository?.id !== repository.id) return skip('geen eigen Codex-branch');
  const {data: current} = await github.rest.repos.getBranch({...args,branch});
  if (current.commit.sha !== sha) return skip('controle hoort bij een oudere commit');
  const {data: comparison} = await github.rest.repos.compareCommitsWithBasehead({...args,basehead:`main...${sha}`});
  const files = comparison.files || [];
  if (!files.length || files.length >= 300 || files.some(f => protectedPath(f.filename) || f.previous_filename && protectedPath(f.previous_filename))) return skip('lege, te grote of beschermde wijziging; handmatige beoordeling nodig');
  let pr;
  const pulls = await github.paginate(github.rest.pulls.list,{...args,state:'open',base:'main',head:`${owner}:${branch}`,per_page:100});
  if (pulls.length > 1) return skip('meer dan één PR voor deze branch');
  pr = pulls[0];
  if (trigger.event === 'push') {
    if (!trustedRun(trigger,repository,actorId,sha,branch)) return skip('push of herstart komt niet van het vertrouwde account');
    if (pr) return skip('PR bestaat al; wacht op de PR-controles');
    const result = await github.rest.pulls.create({...args,base:'main',head:branch,
      title:`Codex: ${branch.slice(6)}`,
      body:`Automatisch aangemaakt voor de vertrouwde Codex-branch.\n\nCommit: ${sha}\n\nUnit-, browser- en productiecontroles worden opnieuw uitgevoerd op deze PR. Samenvoegen gebeurt alleen bij geslaagde PR-controles en geldige main-beveiliging.`});
    core.info(`PR #${result.data.number} aangemaakt. De GitHub App activeert de normale PR-controles.`);
    return 'created';
  }
  if (!pr) return skip('geen open PR');
  const {data: fresh} = await github.rest.pulls.get({...args,pull_number:pr.number});
  pr = fresh;
  if (pr.user?.login !== env.CODEX_APP_BOT || pr.head.repo?.id !== repository.id || pr.base.repo?.id !== repository.id ||
      pr.head.ref !== branch || pr.base.ref !== 'main' || pr.head.sha !== sha || pr.draft || pr.state !== 'open') return skip('PR is niet door deze automatisering gemaakt of is veranderd');
  const related = trigger.pull_requests || [];
  if (!related.some(item => item.number === pr.number)) return skip('CI-run hoort niet bij deze PR');
  // Recheck push provenance for this exact SHA; a branch name or PR label is never sufficient.
  const runs = await github.paginate(github.rest.actions.listWorkflowRuns,{...args,workflow_id:workflow.id,event:'push',branch,head_sha:sha,per_page:100});
  runs.sort((a,b)=>b.id-a.id);
  if (!runs.length || !trustedRun(runs[0],repository,actorId,sha,branch)) return skip('actuele commit mist een geslaagde, vertrouwde pushcontrole');
  const {data: rules} = await github.rest.repos.getBranchRules({...args,branch:'main'});
  if (!protectedMain(rules)) return skip('main mist de verplichte PR-regel of strikte build-controle van GitHub Actions');
  if (!repository.allow_squash_merge || pr.mergeable !== true || pr.mergeable_state !== 'clean') return skip('conflict, achterlopende branch, andere vereiste of nog onbekende merge-status');
  // Exact-head merge, not an armed auto-merge that could later accept an untrusted push.
  // The App token triggers the normal push-to-main Pages workflow after merging.
  const {data: result} = await github.rest.pulls.merge({...args,pull_number:pr.number,sha,merge_method:'squash'});
  if (!result.merged) throw new Error('GitHub heeft samenvoegen geweigerd');
  core.info(`PR #${pr.number} samengevoegd als ${result.sha}; de bestaande Pages-workflow start via push op main.`);
  return 'merged';
}
module.exports = {run,protectedPath,trustedRun,protectedMain};
