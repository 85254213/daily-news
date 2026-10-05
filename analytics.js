/* Snapshot-based observations. These rules screen evidence; they do not predict virality. */
(function(root){
 'use strict';
 const dayMs=86400000;
 const stamp=value=>Date.parse(/[TZ]|[+-]\d\d:\d\d$/.test(value||'')?value:String(value).replace(' ','T')+'+08:00');
 const gap=(a,b)=>Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z');
 const valid=(d,b)=>Boolean(b?.updatedAt?.slice(0,10)===d.date&&b.entries?.length);
 const pool=b=>[...(b?.entries||[]),...(b?.watchEntries||[])];
 const key=(board,title)=>JSON.stringify([board,title]);
 function build(archive,asOf,limit=30){
  const days=archive.days.filter(d=>d.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date));
  const cutoff=limit?Date.parse(asOf+'T00:00:00Z')-(limit-1)*dayMs:-Infinity;
  const visible=days.filter(d=>Date.parse(d.date+'T00:00:00Z')>=cutoff);
  const current=days.at(-1),previous=days.at(-2),map=new Map();
  if(!current)return {days:[],records:[],seeds:[],current:null,previous:null,coverage:[]};
  for(const d of days)for(const b of d.boards){
   if(!valid(d,b))continue;
   for(const e of pool(b)){
    if(!Number.isInteger(e.rank)||e.rank<1||e.rank>50||!Number.isFinite(e.heat))continue;
    const k=key(b.id,e.title);
    if(!map.has(k))map.set(k,{key:k,title:e.title,boardId:b.id,boardName:b.name,history:[]});
    map.get(k).history.push({...e,date:d.date,collectedAt:d.collectedAt,updatedAt:b.updatedAt,source:b.source});
   }
  }
  const shared=current.boards.filter(b=>b.entries.length===20&&valid(current,b)&&previous?.boards.some(p=>p.id===b.id&&p.entries.length===20&&valid(previous,p))).map(b=>b.id);
  const counts=d=>{const out=new Map();for(const b of d?.boards||[])if(shared.includes(b.id))for(const e of b.entries){if(!out.has(e.title))out.set(e.title,new Set());out.get(e.title).add(b.id);}return out;};
  const prevCounts=counts(previous),curCounts=counts(current),hotTitles=new Set(current.boards.flatMap(b=>valid(current,b)?b.entries.map(e=>e.title):[]));
  const records=[];
  for(const record of map.values()){
   const history=record.history,selected=history.filter(e=>Date.parse(e.date+'T00:00:00Z')>=cutoff);
   if(!selected.length)continue;
   const latest=history.at(-1),active=latest.date===current.date;
   const baseline=active&&previous&&gap(previous.date,current.date)===dayMs?history.find(e=>e.date===previous.date):null;
   const delta=baseline?latest.heat-baseline.heat:null,percent=baseline&&baseline.heat>0?delta/baseline.heat*100:null;
   const rankGain=baseline?baseline.rank-latest.rank:null;
   const interval=baseline?(stamp(latest.collectedAt)-stamp(baseline.collectedAt))/3600000:null;
   let streak=active?1:0,index=history.length-1;
   while(streak&&index>0&&gap(history[index-1].date,history[index].date)===dayMs){streak++;index--;}
   const third=days.at(-3),thirdPoint=third&&history.find(e=>e.date===third.date);
   const sustained=Boolean(active&&baseline&&thirdPoint&&gap(third.date,previous.date)===dayMs&&latest.heat>baseline.heat&&baseline.heat>thirdPoint.heat);
   const seed=Boolean(active&&latest.rank>20&&!hotTitles.has(record.title)&&percent!==null&&percent>=10&&delta>=100000&&rankGain>=5);
   const spreadBefore=prevCounts.get(record.title)?.size||0,spreadNow=curCounts.get(record.title)?.size||0;
   const spread=Boolean(active&&latest.rank<=20&&previous&&gap(previous.date,current.date)===dayMs&&spreadBefore>0&&spreadNow>spreadBefore);
   const cooling=Boolean(active&&percent!==null&&percent<=-10&&rankGain<0);
   const status=!active?'未观察到':seed?'低位升温':sustained?'连续升温':spread?'跨榜扩散':cooling?'热度回落':!baseline?'待观察':percent>0?'有所回升':percent<0?'略有回落':'持平';
   records.push({...record,history:selected,latest,baseline,active,delta,percent,rankGain,interval,streak,sustained,seed,spread,cooling,status,
    first:history[0].date,last:latest.date,appearances:new Set(selected.map(e=>e.date)).size,
    peak:Math.max(...selected.map(e=>e.heat)),bestRank:Math.min(...selected.map(e=>e.rank)),spreadBefore,spreadNow});
  }
  const coverage=current.boards.map(b=>({id:b.id,name:b.name,valid:valid(current,b),count:valid(current,b)?pool(b).length:0,
    watchCount:valid(current,b)?(b.watchEntries||[]).length:0,available:Boolean(b.tracking?.available&&valid(current,b)),missing:b.tracking?.missingRanks||[]}));
  return {days:visible,records,current,previous,coverage,seeds:records.filter(r=>r.seed).sort((a,b)=>b.percent-a.percent)};
 }
 const api={build,pool,key,stamp};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.TrendAnalytics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
