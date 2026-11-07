import { startupPlan } from './start-plan.mjs';

export async function launchDesktop({ probe, start, wait, open }) {
  const decision = startupPlan(await probe());
  if (decision === 'refuse') throw new Error('Port 4173 is occupied by another service or an unsupported version. Close that service and try again.');
  if (decision === 'reuse') { await open(); return; }
  const server = start();
  let ready = false;
  try {
    for (let attempt = 0; attempt < 40; attempt++) {
      await wait();
      const status = startupPlan(await probe());
      if (status === 'reuse') { ready = true; break; }
      if (status === 'refuse') throw new Error('Port 4173 is occupied by another service.');
      if (server.failure?.()) throw new Error('PersonalTube could not start. Check that Node.js and the project are still installed.');
    }
    if (!ready) throw new Error('PersonalTube did not become ready. Check that the project and Node.js are still installed, then try again.');
  } catch (error) {
    server.stop();
    throw error;
  }
  server.release();
  await open();
}
