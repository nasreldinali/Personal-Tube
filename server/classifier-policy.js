export const supportedCodexVersion = 'codex-cli 0.155.1';
export const disabledClassifierFeatures = ['shell_tool', 'unified_exec', 'shell_snapshot', 'code_mode', 'code_mode_host', 'computer_use', 'browser_use', 'browser_use_external', 'browser_use_full_cdp_access', 'in_app_browser', 'apps', 'plugins', 'remote_plugin', 'multi_agent', 'multi_agent_v2', 'hooks', 'memories', 'image_generation', 'view_image', 'workspace_dependencies', 'skill_search', 'skill_mcp_dependency_install', 'goals', 'sleep_tool', 'tool_suggest', 'in_app_local_automation', 'auth_elicitation', 'request_permissions_tool'];
export const classificationSchema = {
  type: 'object', additionalProperties: false, required: ['version','items'],
  properties: {
    version: { type: 'integer', enum: [1] },
    items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['key','stance','quote'], properties: { key: { type: 'string' }, stance: { type: 'string', enum: ['rec','strong_rec','reference','critical','joke'] }, quote: { type: 'string' } } } },
  },
};
export function classifierArguments(scratch, schema) {
  return ['exec', '--ignore-user-config', '--ignore-rules', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'read-only', '--json', '--color', 'never', '--cd', scratch, '--output-schema', schema, ...disabledClassifierFeatures.flatMap(name => ['--disable',name]), '--enable', 'skip_host_skill_discovery', '-c', 'suppress_unstable_features_warning=true', '-c', 'web_search="disabled"', '-c', 'approval_policy="never"', '-c', 'forced_login_method="chatgpt"', '-c', 'cli_auth_credentials_store="file"', '-c', 'project_doc_max_bytes=0', '-c', 'mcp_servers={}', '-c', 'model_reasoning_effort="low"', '-'];
}
