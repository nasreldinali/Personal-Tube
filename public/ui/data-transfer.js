import { AppError } from '../domain/errors.js';
import { parseBackup, validateBackupFile } from '../domain/library.js';
import { byId as $, element } from './dom.js';

export function createDataTransfer({ hasStore, isStorageBlocked, isBusy, exportData, importData, reloadImportedData, clearPersonalData, clearCommunity, now, bind, askConfirmation, applyPreferences, notify }) {
  function exportBackup() {
    if (!hasStore() || isStorageBlocked()) throw new AppError('storageRead');
    const blob = new Blob([JSON.stringify(exportData(now()), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = element('a'); link.href = url; link.download = 'personaltube-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importBackup() {
    const file = $('import-data').files[0]; $('import-data').value = '';
    if (!file) return;
    if (isBusy()) throw new AppError('busy');
    validateBackupFile(file);
    const content = await file.text();
    try { parseBackup(JSON.parse(content)); } catch { throw new AppError('invalidBackup'); }
    askConfirmation('confirmImport', () => {
      if (isBusy()) throw new AppError('busy');
      importData(content, now());
      reloadImportedData();
      applyPreferences(); notify('imported');
    });
  }
  function confirmClearData() {
    if (isBusy()) throw new AppError('busy');
    askConfirmation('confirmClear', async () => {
      if (isBusy()) throw new AppError('busy');
      if (!hasStore()) throw new AppError('storageWrite');
      await clearCommunity();
      clearPersonalData();
      $('api-key').value = ''; $('remember-key').checked = false; applyPreferences(); notify('cleared');
    });
  }
  bind('export-data', 'click', exportBackup, 'settings-error');
  bind('import-data', 'change', importBackup, 'settings-error');
  bind('clear-data', 'click', confirmClearData, 'settings-error');
  return { exportBackup, importBackup, confirmClearData };
}
