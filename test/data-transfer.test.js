import test from 'node:test';
import assert from 'node:assert/strict';
import { createDataTransfer } from '../public/ui/data-transfer.js';
import { setupDocumentFixture, NOW } from './fixtures.js';

test('backup export checks availability and revokes its download URL', () => {
  const f=setupDocumentFixture();const previous={document:globalThis.document,setTimeout:globalThis.setTimeout,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
  let available=false,blocked=false,blob,revoked,scheduled,clicked=false;
  globalThis.document={...f.document,createElement:()=>({click(){clicked=true;}})};
  globalThis.setTimeout=(callback,delay)=>{assert.equal(delay,1000);scheduled=callback;};URL.createObjectURL=value=>{blob=value;return 'blob:fixture';};URL.revokeObjectURL=value=>{revoked=value;};
  try {
    const panel=createDataTransfer({hasStore:()=>available,isStorageBlocked:()=>blocked,isBusy:()=>false,exportData:timestamp=>({version:2,now:timestamp}),now:()=>NOW,bind(){}});
    assert.throws(()=>panel.exportBackup(),error=>error.code==='storageRead');available=true;panel.exportBackup();assert.equal(clicked,true);assert.equal(blob.type,'application/json');assert.equal(revoked,undefined);scheduled();assert.equal(revoked,'blob:fixture');
    blocked=true;assert.throws(()=>panel.exportBackup(),error=>error.code==='storageRead');
  } finally {globalThis.document=previous.document;globalThis.setTimeout=previous.setTimeout;URL.createObjectURL=previous.create;URL.revokeObjectURL=previous.revoke;}
});
