import { byId as $, element } from './dom.js';
export function createLocalModelPicker({text,request}) {
  let revision=0;
  function reset() { revision++; $('local-model-list').replaceChildren(); $('local-model-list').disabled=true; $('local-model-status').textContent=''; }
  $('local-model-load').addEventListener('click',async()=>{
    const started=++revision,provider=$('api-provider').value,port=Number($('local-port').value);
    $('local-model-status').textContent=text('modelsLoading');
    const result=await request('models',provider,provider==='local-openai'?{port}:{});
    if(started!==revision || provider!==$('api-provider').value || (provider==='local-openai'&&port!==Number($('local-port').value)))return;
    const models=result?.models || [];
    const placeholder=element('option','',text('chooseInstalledModel'));placeholder.value='';
    $('local-model-list').replaceChildren(placeholder,...models.map(id=>{const option=element('option','',id);option.value=id;return option;}));
    $('local-model-list').disabled=!models.length;
    $('local-model-status').textContent=text(!result?'modelsFailed':models.length?'modelsFound':'modelsEmpty');
  });
  $('local-model-list').addEventListener('change',()=>{if($('local-model-list').value)$('api-model').value=$('local-model-list').value;});
  $('local-port').addEventListener('input',reset);
  return {reset};
}
