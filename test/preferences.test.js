import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePreferences, preferenceAttributes, refreshSettings, automaticRefreshDue } from '../public/domain/preferences.js';
import { messages, t, number, dateLabel, areaName } from '../public/locale.js';

test('preferences default to English and automatic theme; reject unsupported versions and values', () => {
  assert.deepEqual(parsePreferences(null), { version: 1, language: 'en', theme: 'auto' });
  assert.throws(() => parsePreferences({ version: 2, language: 'en', theme: 'dark' }));
  assert.throws(() => parsePreferences({ version: 1, language: 'xx', theme: 'dark' }));
  assert.throws(() => parsePreferences({ version: 1, language: 'en', theme: 'invalid' }));
});
test('Arabic and English apply correct direction; automatic theme removes override', () => {
  assert.deepEqual(preferenceAttributes({ version: 1, language: 'ar', theme: 'light' }), { lang: 'ar', dir: 'rtl', theme: 'light' });
  assert.deepEqual(preferenceAttributes({ version: 1, language: 'en', theme: 'auto' }), { lang: 'en', dir: 'ltr', theme: null });
});
test('message catalogs have complete parity and matching template fields', () => {
  assert.deepEqual(Object.keys(messages.ar).sort(), Object.keys(messages.en).sort());
  for (const key of Object.keys(messages.en)) {
    assert.ok(messages.ar[key].trim());
    assert.deepEqual(messages.ar[key].match(/\{\w+\}/g)?.sort() || [], messages.en[key].match(/\{\w+\}/g)?.sort() || [], key);
  }
  assert.throws(() => t('en', 'missing-key'));
  assert.equal(number('ar', 123), '١٢٣');
  assert.equal(number('en', 123), '123');
  assert.notEqual(areaName('ar', 'software', 'Software'), 'Software');
});
test('video refresh preferences validate modes and bounded intervals without changing legacy defaults',()=>{
 const base={version:1,language:'en',theme:'auto'};
 assert.deepEqual(parsePreferences({...base,refreshMode:'manual',refreshMinutes:360}),{...base,refreshMode:'manual',refreshMinutes:360});
 for(const refreshMode of ['off',true,null])assert.throws(()=>parsePreferences({...base,refreshMode}));
 for(const refreshMinutes of [0,1,-15,31,Infinity,'60',null])assert.throws(()=>parsePreferences({...base,refreshMinutes}));
 for(const refreshMinutes of [15,30,60,180,360,720,1440])assert.equal(parsePreferences({...base,refreshMode:'auto',refreshMinutes}).refreshMinutes,refreshMinutes);
});

test('automatic attempt scheduling honors manual mode, selected boundaries and legacy defaults',()=>{
 assert.deepEqual(refreshSettings(),{mode:'auto',minutes:30,intervalMs:1800000});
 for(const last of [null,0,100])assert.equal(automaticRefreshDue({refreshMode:'manual'},last,999999999),false);
 assert.equal(automaticRefreshDue({},null,0),true);
 const prefs={refreshMinutes:60};
 assert.equal(automaticRefreshDue(prefs,100,3600099),false);
 assert.equal(automaticRefreshDue(prefs,100,3600100),true);
 assert.equal(automaticRefreshDue({refreshMinutes:15},100,900100),true);
 assert.equal(automaticRefreshDue(prefs,200,100),false);
});
test('automatic refresh does not start while the page is hidden',()=>{
 assert.equal(automaticRefreshDue({},null,0,false),false);
 assert.equal(automaticRefreshDue({refreshMinutes:15},0,900000,false),false);
 assert.equal(automaticRefreshDue({},null,0,true),true);
});

test('German and Spanish preferences persist and format numbers and dates in the selected locale',()=>{
 for(const language of ['de','es']) {
  const value={version:1,language,theme:'dark'};
  assert.deepEqual(parsePreferences(JSON.parse(JSON.stringify(value))),value);
  assert.deepEqual(preferenceAttributes(value),{lang:language,dir:'ltr',theme:'dark'});
  assert.deepEqual(Object.keys(messages[language]).sort(),Object.keys(messages.en).sort());
  for(const key of Object.keys(messages.en)) {
   assert.ok(messages[language][key].trim());
   assert.deepEqual(messages[language][key].match(/\{\w+\}/g)?.sort()||[],messages.en[key].match(/\{\w+\}/g)?.sort()||[],`${language}/${key}`);
  }
  assert.equal(number(language,12345.6),new Intl.NumberFormat(language).format(12345.6));
  assert.equal(dateLabel(language,'2026-11-06T12:00:00Z'),new Intl.DateTimeFormat(language,{day:'numeric',month:'short',year:'numeric'}).format(new Date('2026-11-06T12:00:00Z')));
 }
});
