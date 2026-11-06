import { AppError } from '../domain/errors.js';
import { parsePreferences, refreshSettings, REFRESH_INTERVALS } from '../domain/preferences.js';
import { number } from '../locale.js';
import { byId as $, selectOptions } from './dom.js';

export function createSettingsPanel({ text, readPreferences, readUsage, hiddenCount, readKey, remembersKey, saveKey, forgetKey, savePreferences, isBusy, bind, render, notify, refresh }) {
  function renderUsage() {
    const value = readUsage();
    $('usage-unavailable').hidden = Boolean(value);
    $('usage-totals').hidden = !value;
    if (!value) return;
    for (const [bucket, limit] of [['units', 10000], ['search', 100]]) {
      $(`usage-${bucket}`).textContent = text('usageNumbers', { used: number(readPreferences().language, value[bucket]), remaining: number(readPreferences().language, Math.max(0, limit - value[bucket])), limit: number(readPreferences().language, limit) });
      $(`usage-${bucket}-bar`).value = Math.min(limit, value[bucket]);
    }
    $('usage-day').textContent = text('usageDay', { day: value.day });
  }
  function renderRefreshDraft() {
    const manual = $('refresh-mode').value === 'manual';
    $('refresh-interval').disabled = manual;
    $('refresh-settings-help').textContent = text(manual ? 'refreshManualHelp' : 'refreshAutoHelp', {interval:text(`refreshInterval${$('refresh-interval').value}`)});
  }
  function renderRefreshSettings() {
    const settings = refreshSettings(readPreferences());
    $('refresh-mode').value = settings.mode;
    selectOptions($('refresh-interval'), REFRESH_INTERVALS.map(minutes=>[String(minutes),text(`refreshInterval${minutes}`)]), String(settings.minutes));
    $('refresh-settings-status').textContent = ''; $('refresh-settings-error').textContent = '';
    renderRefreshDraft();
  }
  function openSettings() {
    renderUsage(); renderRefreshSettings();
    $('restore-hidden').disabled = !hiddenCount();
    $('api-key').value = readKey(); $('settings-error').textContent = '';
    try { $('remember-key').checked = remembersKey(); } catch { $('remember-key').checked = false; }
    $('settings-dialog').showModal();
  }
  bind('settings-open', 'click', openSettings);
  bind('refresh-mode', 'change', () => { $('refresh-settings-status').textContent = ''; renderRefreshDraft(); });
  bind('refresh-interval', 'change', () => { $('refresh-settings-status').textContent = ''; renderRefreshDraft(); });
  bind('refresh-settings-form', 'submit', event => {
    event.preventDefault();
    const next = parsePreferences({...readPreferences(),refreshMode:$('refresh-mode').value,refreshMinutes:Number($('refresh-interval').value)});
    savePreferences(next);
    render(); renderRefreshSettings(); $('refresh-settings-status').textContent = text('refreshSettingsSaved');
  }, 'refresh-settings-error');
  bind('settings-form', 'submit', event => {
    event.preventDefault(); if (isBusy()) throw new AppError('busy');
    const nextKey = $('api-key').value.trim();
    saveKey(nextKey, $('remember-key').checked);
    $('settings-dialog').close(); notify('connectionReady'); render(); void refresh();
  }, 'settings-error');
  bind('forget-key', 'click', () => {
    if (isBusy()) throw new AppError('busy'); forgetKey(); $('api-key').value = ''; $('remember-key').checked = false; notify('keyRemoved'); render();
  }, 'settings-error');
  $('settings-dialog').addEventListener('close', () => { $('api-key').value = ''; });
  return { renderUsage, renderRefreshDraft, renderRefreshSettings, openSettings };
}
