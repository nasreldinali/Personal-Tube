import test from 'node:test';
import assert from 'node:assert/strict';
import { classifierArguments } from '../server/classifier-policy.js';
import { parseClassifierEvents, createCodexClassifier } from '../server/codex-classifier.js';

test('classifier invocation cannot select tools, hooks, execution or a user supplied model', () => {
  const args = classifierArguments('/scratch', '/scratch/schema.json');
  assert.ok(args.includes('--ignore-user-config'));
  assert.ok(args.includes('read-only'));
  for (const tool of ['shell_tool','apps','plugins','computer_use','multi_agent','hooks','code_mode_host','view_image']) assert.ok(args.some((arg,i) => arg === '--disable' && args[i+1] === tool));
  assert.ok(args.includes('web_search="disabled"'));
  assert.ok(args.includes('mcp_servers={}'));
  assert.ok(args.includes('forced_login_method="chatgpt"'));
  assert.ok(args.includes('cli_auth_credentials_store="file"'));
  assert.equal(args.includes('--dangerously-bypass-approvals-and-sandbox'),false);
});
test('classifier accepts final structured text only, rejects tool events and missing completion', () => {
  const message = JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"version":1,"items":[]}' } });
  assert.equal(parseClassifierEvents(`${message}\n{"type":"turn.completed"}\n`).version,1);
  assert.throws(() => parseClassifierEvents(`${message}\n`));
  assert.throws(() => parseClassifierEvents('{"type":"item.started","item":{"type":"command_execution"}}\n'));
});
test('Arabic quotes survive UTF-8 characters split across process output chunks', () => {
  const output=Buffer.from(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:JSON.stringify({version:1,items:[{quote:'أنصح بمشاهدة هذا الشرح'}]})}})+'\n{"type":"turn.completed"}\n');
  const split=output.indexOf(Buffer.from('أنصح'))+1;
  assert.equal(parseClassifierEvents([output.subarray(0,split),output.subarray(split)]).items[0].quote,'أنصح بمشاهدة هذا الشرح');
});
test('YouTube classifier bounds expand only for the explicit fixed mode', async () => {
  const classify=createCodexClassifier({executable:process.execPath,environment:{}});
  const row={videoIds:['abcdefghijk'],title:'Fixture',text:'Useful explanation'};
  await assert.rejects(classify(Array(25).fill(row)),{code:'invalidCommunityEvidence'});
  await assert.rejects(classify(Array(161).fill(row),'youtube'),{code:'invalidCommunityEvidence'});
  await assert.rejects(classify([row],'unknown'),{code:'invalidCommunityEvidence'});
  await assert.rejects(classify(Array(25).fill(row),'youtube'),{code:'classifierVersion'});
});
