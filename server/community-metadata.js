import { videoPattern } from '../public/config.js';

export function createCommunityMetadata({ request, now }) {
  const cache=new Map();
  return async videos => {
    const result=videos.map(video=>({...video}));
    const queue=result.slice(0,24).filter(video=>videoPattern.test(video.id)&&video.title===`YouTube · ${video.id}`);
    for(const [id,entry] of cache) if(now()-entry.at>=3600000)cache.delete(id);
    await Promise.all(Array.from({length:4},async()=>{
      while(queue.length){
        const video=queue.shift();
        if(!cache.has(video.id)){
          let fields={};
          try{
            const url=new URL('https://www.youtube.com/oembed');url.search=new URLSearchParams({url:`https://www.youtube.com/watch?v=${video.id}`,format:'json'}).toString();
            const data=await request(url.href,{maxBytes:16000,timeoutMs:3000});
            if(typeof data.title==='string'&&data.title.length<=500&&typeof data.author_name==='string'&&data.author_name.length<=250)fields={title:data.title,channelTitle:data.author_name};
          }catch{fields={};}
          if(cache.size>=512)cache.delete(cache.keys().next().value);
          cache.set(video.id,{at:now(),fields});
        }
        Object.assign(video,cache.get(video.id).fields);
      }
    }));
    return result;
  };
}
