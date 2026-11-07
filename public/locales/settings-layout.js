const entries={
  settingsSections:['Settings sections','أقسام الإعدادات','Einstellungsbereiche','Secciones de ajustes'],
  settingsUsage:['API usage','استهلاك API','API-Verbrauch','Uso de API'],
  settingsData:['Backups & data','النسخ والبيانات','Sicherung & Daten','Copias y datos'],
  settingsIntro:['Manage your YouTube connection, refresh schedule and personal data.','ظبّط ربط يوتيوب، مواعيد التحديث، وبياناتك.','Verwalte YouTube-Verbindung, Aktualisierung und persönliche Daten.','Gestiona YouTube, las actualizaciones y tus datos.'],
};
export const settingsLayoutMessages=Object.fromEntries(['en','ar','de','es'].map((language,index)=>[language,Object.fromEntries(Object.entries(entries).map(([key,values])=>[key,values[index]]))]));
