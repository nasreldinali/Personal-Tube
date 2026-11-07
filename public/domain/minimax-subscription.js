import { AppError } from './errors.js';

export const minimaxModel = 'MiniMax-M3.1-Flash';
export function validateMiniMaxSubscription(value) {
  if (!value || Object.keys(value).sort().join(',') !== 'confirmSubscription,key,provider' || value.provider !== 'minimax') throw new AppError('invalidSetup');
  if (typeof value.key !== 'string' || value.key.length > 2048 || !/^sk-cp-[A-Za-z0-9_-]+$/.test(value.key)) throw new AppError('minimaxSubscriptionKeyRequired');
  if (value.confirmSubscription !== true) throw new AppError('minimaxSubscriptionConsent');
  return { provider:'minimax',key:value.key,confirmSubscription:true };
}
