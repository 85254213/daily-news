'use strict';
const TrackingView=(()=>{
 const filters={board:'all',signal:'current',sort:'change',range:30,page:1};
 let model=null,detail={title:'',board:'',metric:'heat'};
 const signed=n=>n===null?'—':(n>0?'+':'')+n.toFixed(1)+'%';
 const tone=n=>n===null?'muted':n>0?'positive':n<0?'negative':'muted';
 const short=d=>d.slice(5).replace('-','/');
 const options=(items,value)=>items.map(([v,label])=>`<option value="${v}" ${String(value)===String(v)?'selected':''}>${label}</option>`).join('');
 function refresh(){state.trendWindow=filters.range;model=TrendAnalytics.build(archive,state.date,filters.range);return model;}
 function badge(r){return `<span class="signal-badge ${r.seed?'seed':r.sustained?'rising':r.cooling?'falling':''}">${r.status}</span>`;}
 function topicButton(r){return `<button class="topic-button" data-topic="${esc(r.title)}" data-topic-board="${r.boardId}">${esc(r.title)}</button>`;}
 function selected(records){return records.filter(r=>(filters.board==='all'||r.boardId===filters.board)&&r.title.toLowerCase().includes(state.trendQuery.toLowerCase()));}
 function render(){
  const m=refresh(),watch=m.coverage.reduce((n,b)=>n+b.watchCount,0),count=m.coverage.reduce((n,b)=>n+b.count,0);
  const hours=m.previous?(TrendAnalytics.stamp(m.current.collectedAt)-TrendAnalytics.stamp(m.previous.collectedAt))/3600000:null;
  const boards=[...new Map(m.records.map(r=>[r.boardId,r.boardName])).entries()];
  $('#app').innerHTML=`<div class="tracking-layout"><section class="tracking-intro"><div><h2>先看变化，再判断选题</h2><p>截至 ${m.current.date} ${collected(m.current)} · ${m.days.length} 份归档 · ${hours===null?'尚无前次快照':`距前次采集 ${hours.toFixed(1)} 小时`}</p></div><label>观察窗口 <select id="tracking-range">${options([[7,'近7天'],[30,'近30天'],[0,'全部归档']],filters.range)}</select></label></section>
  <section class="panel radar-panel"><div class="panel-title"><div><h2>热点的小苗头</h2><p>从第21—50名中，找名次和热度一起增长的话题</p></div><span class="signal-badge seed">${m.seeds.length} 条线索</span></div><div id="seed-results"></div><div class="radar-context"><span>当前观测 ${count} 条 · 其中榜单后段 ${watch} 条</span><span>规则筛选，不代表一定会成为热点</span></div><details class="tracking-method"><summary>怎么看信号与数据覆盖</summary><p>低位升温：当前位于原榜21—50名，且未在其他已采集榜单前20名；同榜同标题较前一日快照上升至少5名，热度增长至少10%且至少10万。未达到条件时不补造线索。</p><p>连续升温：连续3天有效观测、两段热度均增长。跨榜扩散：同名标题在双方都有完整前20名的共同榜单中，覆盖榜数增加。上次未观察到或只有一次记录时，不计算涨幅。</p><p>采集时间不一致，变化是两次快照的差异，不是日内增速或爆火概率。标题完全匹配，不自动合并改名话题；跨榜热度不相加。未记录或过期的数据不参与信号判断。</p><ul>${m.coverage.map(b=>`<li>${esc(b.name)}：${b.count} 条有效排名；${!b.available?'未取得21—50名观察数据':b.missing.length?`后段缺少原排名 ${b.missing.join('、')}`:'21—50名齐全'}</li>`).join('')}</ul><p>每日正式日报仍为六榜前20名；后段数据仅用于观察。9月28日仅保留前20名，后段观察从9月29日开始。</p></details></section>
  <section class="panel tracking-table-panel"><div class="panel-title"><div><h2>话题走势明细</h2><p>同一个话题、同一张榜单，逐次比较</p></div><span class="mini-label" id="tracking-count"></span></div><div class="tracking-tools"><label class="searchbox">${icon('search')}<span class="sr-only">搜索追踪话题</span><input id="trend-search" placeholder="搜索话题标题…" value="${esc(state.trendQuery)}"></label><label>榜单<select id="tracking-board">${options([['all','全部榜单'],...boards],filters.board)}</select></label><label>信号<select id="tracking-signal">${options([['current','本次观察到'],['seed','低位升温'],['sustained','连续升温'],['spread','跨榜扩散'],['new','上次未观察到'],['cooling','热度回落'],['all','全部历史']],filters.signal)}</select></label><label>排序<select id="tracking-sort">${options([['change','热度涨幅'],['rank','名次上升'],['streak','连续出现'],['heat','最近热度']],filters.sort)}</select></label></div><div id="trend-results"></div><div class="tracking-pagination"><span id="tracking-page-label"></span><div><button class="secondary-button" id="tracking-prev">上一页</button><button class="secondary-button" id="tracking-next">下一页</button></div></div><p class="panel-footnote">每行对应一个标题在一张榜单上的记录。点击标题可看热度、排名曲线及每次采集的原值。</p></section>
  <details class="panel overview-trend"><summary>各榜前20名的平均热度趋势</summary><div class="trend-chart">${trendChart()}<div class="legend">${trendBoards().map(b=>`<span style="--board-color:${color(b.id)}"><i class="board-dot"></i>${b.name}</span>`).join('')}</div></div><p class="panel-footnote">只比较原榜前20名平均热度；缺日断线，不补零。与苗头观察的21—50名分开统计。</p></details></div>`;
  rows();
 }
 function rows(reset=false){
  if(!model)return;
  if(reset)filters.page=1;
  const seeds=selected(model.seeds);
  $('#seed-results').innerHTML=seeds.length?`<div class="seed-grid">${seeds.slice(0,6).map(r=>`<article class="seed-card"><div class="seed-kicker"><span>${esc(r.boardName)} · 第${r.latest.rank}名</span><span class="signal-badge seed">低位升温</span></div>${topicButton(r)}<div class="seed-values"><strong>+${r.percent.toFixed(1)}%<small>热度变化</small></strong><span>上升 <b>${r.rankGain}</b> 名<small>${r.baseline.rank} → ${r.latest.rank}</small></span></div><p>较 ${short(r.baseline.date)} 快照 · 热度 +${wan(r.delta)}</p><button class="text-action" data-topic="${esc(r.title)}" data-topic-board="${r.boardId}">查看历次走势</button></article>`).join('')}</div>`:`<div class="empty-state seed-empty"><strong>${model.seeds.length?'当前筛选没有匹配线索':'本次没有达到条件的低位升温线索'}</strong>${model.coverage.some(b=>b.available)?'仍可在明细中观察连续出现、回升或新进入观察范围的话题。':'这份历史快照没有榜单后段数据，不能判断低位苗头。'}</div>`;
  const selectors={current:r=>r.active,seed:r=>r.seed,sustained:r=>r.sustained,spread:r=>r.spread,new:r=>r.active&&!r.baseline,cooling:r=>r.cooling,all:()=>true};
  let results=selected(model.records).filter(selectors[filters.signal]);
  const score=r=>filters.sort==='rank'?(r.rankGain??-Infinity):filters.sort==='streak'?r.streak:filters.sort==='heat'?r.latest.heat:(r.percent??-Infinity);
  results.sort((a,b)=>(Number(b.active)-Number(a.active))||(score(b)-score(a))||b.latest.heat-a.latest.heat);
  const pages=Math.max(1,Math.ceil(results.length/20));filters.page=Math.min(filters.page,pages);
  const rows=results.slice((filters.page-1)*20,filters.page*20);
  $('#tracking-count').textContent=`${results.length} 条同榜记录`;
  $('#trend-results').innerHTML=rows.length?`<div class="tracking-table-scroll"><table class="tracking-table"><thead><tr><th>话题 / 信号</th><th>榜单 / 最近排名</th><th>最近热度</th><th>较前次快照</th><th>出现情况</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${topicButton(r)}<div class="tracking-tags">${badge(r)}${r.spread?`<span class="signal-badge">前20覆盖 ${r.spreadBefore} → ${r.spreadNow} 榜</span>`:''}</div></td><td>${esc(r.boardName)}<strong>第 ${r.latest.rank} 名</strong><small>${short(r.last)} 观测</small></td><td class="number">${fmt(r.latest.heat)}<small>窗口峰值 ${wan(r.peak)}</small></td><td><strong class="${tone(r.percent)}">${signed(r.percent)}</strong><small>${r.baseline?`${r.rankGain>0?'上升':r.rankGain<0?'下降':'持平'}${r.rankGain===0?'':` ${Math.abs(r.rankGain)} 名`} · 间隔 ${r.interval.toFixed(1)}h`:r.active?'缺少同题前次基准':'本次未观察到'}</small></td><td>连续 ${r.streak} 天<small>窗口出现 ${r.appearances} 天</small><small>首次观测 ${short(r.first)}</small></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state"><strong>没有符合筛选的话题</strong>试试其他信号或较短的关键词。</div>';
  $('#tracking-page-label').textContent=`第 ${filters.page} / ${pages} 页 · 每页20条`;
  $('#tracking-prev').disabled=filters.page===1;$('#tracking-next').disabled=filters.page===pages;
 }
 function chart(record,metric){
  const days=model.days,points=new Map(record.history.map(e=>[e.date,e]));
  const width=Math.min(700,Math.max(220,innerWidth-88)),height=230,left=58,right=28,top=20,bottom=40;
  const times=days.map(d=>TrendAnalytics.stamp(d.collectedAt)),span=Math.max(times.at(-1)-times[0],1);
  const x=i=>days.length===1?width/2:left+(times[i]-times[0])/span*(width-left-right);
  const max=metric==='rank'?50:Math.max(1,...record.history.map(e=>e.heat))*1.1;
  const y=v=>metric==='rank'?top+(v-1)/49*(height-top-bottom):height-bottom-v/max*(height-top-bottom);
  let svg=`<svg class="topic-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(record.title)}在${esc(record.boardName)}的${metric==='rank'?'原榜排名（1名在上方）':'官方热度'}历史，缺失不补零">`;
  const levels=metric==='rank'?[1,10,20,30,40,50]:[0,max/2,max];
  for(const v of levels)svg+=`<line x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}" class="gridline"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end">${metric==='rank'?v:Math.round(v/10000)+'万'}</text>`;
  let path='',prev=null;
  days.forEach((d,i)=>{const e=points.get(d.date);if(!e){prev=null;return;}const joined=prev!==null&&Date.parse(d.date+'T00:00:00Z')-Date.parse(days[prev].date+'T00:00:00Z')===86400000;path+=`${joined?'L':'M'}${x(i)},${y(e[metric])} `;prev=i;});
  svg+=`<path d="${path}" class="line"/>`;
  const tickCount=Math.max(2,Math.floor((width-left-right)/65));
  days.forEach((d,i)=>{const e=points.get(d.date);if(e)svg+=`<circle cx="${x(i)}" cy="${y(e[metric])}" r="4" class="point"><title>${d.date} ${collected(d)} · 第${e.rank}名 · 热度${fmt(e.heat)}</title></circle>`;if(days.length<=tickCount||i===0||i===days.length-1||(i%Math.ceil(days.length/tickCount)===0&&i<days.length-2))svg+=`<text x="${x(i)}" y="${height-10}" text-anchor="middle">${short(d.date)}</text>`;});
  return svg+'</svg>';
 }
 function open(title,board){
  refresh();const records=model.records.filter(r=>r.title===title);if(!records.length)return;
  const r=records.find(r=>r.boardId===board)||records.find(r=>r.boardId===state.board)||records[0];
  detail={title,board:r.boardId,metric:'heat'};detailRender();
  if(!$('#topic-dialog').open)$('#topic-dialog').showModal();
 }
 function detailRender(){
  const records=model.records.filter(r=>r.title===detail.title),r=records.find(r=>r.boardId===detail.board);
  $('#topic-title').textContent=detail.title;
  $('#topic-content').innerHTML=`<div class="detail-controls"><label>查看榜单<select id="detail-board">${options(records.map(r=>[r.boardId,r.boardName]),detail.board)}</select></label><div class="metric-switch" aria-label="图表指标"><button data-metric="heat" aria-pressed="${detail.metric==='heat'}">热度</button><button data-metric="rank" aria-pressed="${detail.metric==='rank'}">排名</button></div></div><div class="detail-metrics"><div><small>最近原排名</small><strong>${r.latest.rank}</strong></div><div><small>较前次热度</small><strong class="${tone(r.percent)}">${signed(r.percent)}</strong></div><div><small>连续观测</small><strong>${r.streak}<small> 天</small></strong></div><div><small>窗口最高热度</small><strong>${wan(r.peak)}</strong></div></div><p class="detail-note">${badge(r)} · 首次观测 ${r.first} · 最近观测 ${r.last}${r.interval!==null?` · 本次比较间隔 ${r.interval.toFixed(1)} 小时`:''}</p>${chart(r,detail.metric)}<p class="detail-note">${detail.metric==='rank'?'纵轴上方为第1名。':'热度从零刻度展示。'}横轴按实际采集时间间隔；缺失日期断线，不代表热度为零。</p><div class="detail-history"><table><thead><tr><th>采集时间（北京）</th><th>原排名</th><th>热度值</th><th>来源</th></tr></thead><tbody>${[...r.history].reverse().map(e=>`<tr><td>${e.date}<small>${e.collectedAt.slice(11,19)}</small></td><td>${e.rank}</td><td>${fmt(e.heat)}</td><td><a href="${esc(e.source)}" target="_blank" rel="noopener noreferrer">官方榜单</a><small>更新 ${e.updatedAt.slice(11,19)}</small></td></tr>`).join('')}</tbody></table></div><p class="notice">只关联完全相同标题。首次观测不是平台首次发布；只有一次记录时无法判断涨速。信号用于选题观察，不是爆火预测。</p>`;
 }
 document.addEventListener('change',e=>{
  const fields={'tracking-board':'board','tracking-signal':'signal','tracking-sort':'sort','tracking-range':'range'};
  if(fields[e.target.id]){filters[fields[e.target.id]]=e.target.id==='tracking-range'?Number(e.target.value):e.target.value;filters.page=1;e.target.id==='tracking-range'?render():rows();}
  if(e.target.id==='detail-board'){detail.board=e.target.value;detailRender();}
 });
 document.addEventListener('click',e=>{
  if(e.target.closest('#tracking-prev')){filters.page--;rows();}
  if(e.target.closest('#tracking-next')){filters.page++;rows();}
  const metric=e.target.closest('[data-metric]');if(metric){detail.metric=metric.dataset.metric;detailRender();}
 });
 let detailWidth=innerWidth;
 window.addEventListener('resize',()=>{if(detailWidth!==innerWidth){detailWidth=innerWidth;if($('#topic-dialog').open&&model)detailRender();}});
 return {render,rows,open};
})();
