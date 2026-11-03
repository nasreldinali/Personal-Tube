export function startupPlan(health) {
  if (health === null) return 'start';
  return health?.version === 1 && health.app === 'PersonalTube' && health.status === 'ready' ? 'reuse' : 'refuse';
}
