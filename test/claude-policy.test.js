import test from 'node:test';
import assert from 'node:assert/strict';
import { claudeArguments, parseClaudeOutput } from '../server/claude-policy.js';
test('Claude subscription analysis disables customizations, tools, hooks, MCP and persistence',()=>{
 const args=claudeArguments();for(const flag of ['--safe-mode','--restricted','--strict-mcp-config','--no-session-persistence','--disable-slash-commands','--no-chrome'])assert.ok(args.includes(flag));
 assert.equal(args[args.indexOf('--tools')+1],'');assert.equal(args[args.indexOf('--setting-sources')+1],'');assert.equal(args[args.indexOf('--max-turns')+1],'2');assert.equal(JSON.parse(args[args.indexOf('--settings')+1]).disableAllHooks,true);assert.deepEqual(JSON.parse(args[args.indexOf('--mcp-config')+1]),{mcpServers:{}});assert.equal(args.includes('--bare'),false);assert.equal(args.includes('--dangerously-skip-permissions'),false);
});
test('Claude accepts successful structured output only',()=>{
 const value={type:'result',subtype:'success',is_error:false,num_turns:1,structured_output:{version:1,items:[]}};
 assert.equal(parseClaudeOutput(JSON.stringify(value)).version,1);
 for(const bad of [{...value,is_error:true},{...value,subtype:'error_max_turns'},{...value,num_turns:3},{...value,structured_output:null}])assert.throws(()=>parseClaudeOutput(JSON.stringify(bad)));
 assert.throws(()=>parseClaudeOutput('not-json'));
});
