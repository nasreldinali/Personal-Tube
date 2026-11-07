export const supportedCopilotVersion = 'GitHub Copilot CLI 1.0.107.';
export const copilotProtocol = 3;
export function copilotEnvironment(environment, profile) {
  return {...Object.fromEntries(['PATH','HOME','USER','TMPDIR'].filter(key=>environment[key]).map(key=>[key,environment[key]])),COPILOT_HOME:profile};
}
export function subscriptionAuth(value) {
  return value?.isAuthenticated === true && value.authType === 'user' && ['https://github.com','github.com'].includes(value.host);
}
export const copilotArguments = ['--headless','--stdio','--no-auto-update','--disable-client-telemetry','--no-custom-instructions','--disable-builtin-mcps','--no-ask-user','--no-bash-env','--no-experimental','--log-level','none','--sync-session=off'];
export function copilotSession(directory) {
  return {
    clientName:'PersonalTube',model:'claude-haiku-4.5',allowedModels:['claude-haiku-4.5'],providers:[],models:[],
    tools:[],availableTools:[],excludedTools:[],toolFilterPrecedence:'excluded',mcpServers:{},customAgents:[],customAgentsLocalOnly:true,
    workingDirectory:directory,trustWorkingDirectory:false,additionalDirectories:[],streaming:false,
    requestPermission:true,requestUserInput:false,requestElicitation:false,hooks:false,
    enableConfigDiscovery:false,refreshCustomInstructions:false,organizationCustomInstructions:false,
    enableOnDemandInstructionDiscovery:false,enableFileHooks:false,enableHostGitOperations:false,enableSessionStore:false,
    enableSkills:false,skillDirectories:[],agentDirectories:[],hookDirectories:[],pluginDirectories:[],instructionDirectories:[],
    enableSessionTelemetry:false,enableCitations:false,enableFileChangeTracking:false,
    sessionLimits:{maxAiCredits:1},infiniteSessions:{enabled:false},memory:{enabled:false},autopilot:{continuationEnabled:false,maxContinues:0},interactiveUser:false,
  };
}
