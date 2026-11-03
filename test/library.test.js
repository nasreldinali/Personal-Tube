import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBackupFile } from '../public/domain/library.js';

test('backup file envelope accepts bounded JSON files and refuses other names or sizes', () => {
  assert.equal(validateBackupFile({ name: 'personal-backup.json', size: 42 }), true);
  assert.equal(validateBackupFile({ name: 'BACKUP.JSON', size: 2000000 }), true);
  for (const file of [null, { name: 'backup.html', size: 42 }, { name: 'backup.json', size: 2000001 }, { name: 'backup.json', size: -1 }, { name: 'backup.json', size: NaN }, { name: ['backup.json'], size: 42 }]) {
    assert.throws(() => validateBackupFile(file), { code: 'invalidBackup' });
  }
});
