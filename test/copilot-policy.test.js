import test from 'node:test';
import assert from 'node:assert/strict';
import { copilotEnvironment, copilotSession, subscriptionAuth, supportedCopilotVersion } from '../server/copilot-policy.js';

test('Copilot keeps only OS environment and a dedicated profile, never inherited tokens or BYOK',()=>{
  const env=copilotEnvironment({PATH:'/bin',HOME:'/home/test',GITHUB_TOKEN:'private',GH_TOKEN:'private',COPILOT_GITHUB_TOKEN:'private',OPENAI_API_KEY:'private',NODE_OPTIONS:'unsafe',COPILOT_HOME:'/other'},'/profile');
  assert.deepEqual(env,{PATH:'/bin',HOME:'/home/test',COPILOT_HOME:'/profile'});
  assert.equal(supportedCopilotVersion,'GitHub Copilot CLI 1.0.107.');
});
test('Copilot refuses token, API, gh fallback and foreign-host authentication',()=>{
  assert.equal(subscriptionAuth({isAuthenticated:true,authType:'user',host:'https://github.com'}),true);
  assert.equal(subscriptionAuth({isAuthenticated:true,authType:'user',host:'github.com'}),true);
  for(const authType of ['api-key','env','gh-cli','token',undefined]) assert.equal(subscriptionAuth({isAuthenticated:true,authType,host:'https://github.com'}),false);
  assert.equal(subscriptionAuth({isAuthenticated:true,authType:'user',host:'https://elsewhere.example'}),false);
  assert.equal(subscriptionAuth({isAuthenticated:false,authType:'user',host:'https://github.com'}),false);
});
test('Copilot sessions expose no tools, config discovery, hooks, memory or custom providers',()=>{
  const config=copilotSession('/scratch');
  assert.deepEqual(config.availableTools,[]);assert.deepEqual(config.providers,[]);assert.deepEqual(config.models,[]);
  assert.equal(config.model,'claude-haiku-4.5');assert.equal(config.workingDirectory,'/scratch');
  for(const key of ['enableConfigDiscovery','enableSkills','enableFileHooks','enableHostGitOperations','enableSessionStore','organizationCustomInstructions','enableOnDemandInstructionDiscovery','refreshCustomInstructions','hooks','requestUserInput','enableSessionTelemetry']) assert.equal(config[key],false,key);
  assert.deepEqual(config.mcpServers,{});assert.deepEqual(config.customAgents,[]);assert.equal(config.requestPermission,true);
  assert.equal(config.autopilot.continuationEnabled,false);assert.equal(config.autopilot.maxContinues,0);assert.equal(config.sessionLimits.maxAiCredits,1);assert.equal(config.infiniteSessions.enabled,false);assert.equal(config.memory.enabled,false);
});
