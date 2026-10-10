'use strict';
const OpportunitiesView=(()=>{
 let model=null;
 const filters={category:'all',stage:'all'};
 const signed=n=>n===null?'无可比基准':`${n>0?'+':''}${n.toFixed(1)}%`;
 const categoryName={baking:'烘焙',food:'餐饮食品',other:'其他'};
 function evidence(r){
  const interval=r.interval===null?'':` · 采样间隔 ${r.interval.toFixed(1)} 小时`;
  return `<li><div><strong>${esc(r.boardName)} · 原第 ${r.latest.rank} 名</strong><span>热度 ${fmt(r.latest.heat)}</span></div><p>${r.baseline?`较 ${esc(r.baseline.date)}：热度 ${signed(r.percent)} · 原排名 ${r.baseline.rank} → ${r.latest.rank}${interval}`:'前一日缺少同榜同题记录，暂不能判断升温'} · ${esc(r.status)}</p><p>首次收录 ${esc(r.first)} · 连续观测 ${r.streak} 天</p><button class="text-action" data-topic="${esc(r.title)}" data-topic-board="${esc(r.boardId)}">查看排名与热度轨迹</button> · <a href="${esc(r.latest.source)}" target="_blank" rel="noopener noreferrer">官方榜单</a></li>`;
 }
 function card(c,example=false){return `<article class="panel opportunity-card ${example?'opportunity-example':''}"><div class="opportunity-card-head"><div class="opportunity-kicker"><span>${esc(categoryName[c.category]||'食品选品')}</span><span class="signal-badge ${c.stage==='rising'?'seed':c.stage==='cooling'?'falling':''}">${esc(c.stageLabel)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.reason)}</p></div>
 ${example?'<p class="opportunity-example-note">这是你提供的历史示例，用来展示选品拆解；没有今日上榜或增长证据，不计入当日机会数量。</p>':`<details class="opportunity-evidence"><summary>榜单证据与变化 · ${c.signals.length} 份同题记录</summary><ul>${c.signals.map(evidence).join('')}</ul></details>`}
 <div class="opportunity-products">${c.products.map((p,i)=>`<section><p class="opportunity-role"><span>0${i+1}</span>${esc(p.role)}</p><h4>${esc(p.name)}</h4><p class="opportunity-keywords">询货关键词：${p.keywords.map(esc).join(' / ')}</p><ul>${p.checks.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></section>`).join('')}</div>
 ${c.sources?.length?`<details class="opportunity-evidence"><summary>产品形态参考 · 不代表已核验的供货推荐</summary><ul>${c.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><p>${esc(s.note||'')}</p></li>`).join('')}</ul></details>`:''}
 <div class="opportunity-action"><strong>下一步</strong><p>${esc(c.nextStep)}</p><details><summary>下单前还要核实什么</summary><ul>${c.validation.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>商品方向是用途推理；供货、成交、成本和毛利尚未验证。</p></details><button class="secondary-button" data-opportunity-export="${esc(c.id)}">下载询价与试卖清单</button></div></article>`;}
 function render(){
  model=CommerceOpportunities.build(archive,state.date);
  const rising=model.cards.filter(c=>c.stage==='rising').length;
  $('#app').innerHTML=`<div class="opportunities-layout"><section class="opportunity-intro"><p class="opportunity-eyebrow">商家选品 / 从话题走到具体商品</p><h2>看见趋势，也看见生意的配套需求。</h2><p>先发现能延伸到原料、模具、工具和包装的线索，再验证买家是否愿意付钱。</p><div class="opportunity-stats"><span><strong>${model.cards.length}</strong> 条可拆解线索</span><span><strong>${rising}</strong> 条有连续或扩散信号</span><span>依据 ${esc(model.date)} ${esc(model.collectedAt?.slice(11,19)||'')} 的榜单快照</span></div></section>
  <div class="opportunity-workflow"><span><b>1</b>找具体需求</span><span><b>2</b>拆配套商品</span><span><b>3</b>询样与试做</span><span><b>4</b>小单测成交</span></div>
  <section aria-label="筛选商品机会" class="opportunity-filters"><label>经营方向<select id="opportunity-category"><option value="all">食品与烘焙</option><option value="baking">只看烘焙</option><option value="food">餐饮食品</option></select></label><label>信号<select id="opportunity-stage"><option value="all">全部线索</option><option value="rising">有升温或扩散证据</option><option value="watch">仍待观察</option><option value="cooling">热度回落</option></select></label><span id="opportunity-result-count"></span></section>
  <div id="opportunity-results"></div>
  <section class="opportunity-case"><div class="opportunity-section-title"><h2>把一个热点拆成一组商品</h2><p>独立示例 · 与每日榜单分开</p></div>${model.examples.map(c=>card(c,true)).join('')}</section>
  <details class="panel opportunity-method"><summary>这些机会怎样判断，哪些还不知道</summary><p>先筛出能对应具体食品或制作方式的话题。电影、歌名、事故和含义不明的词，不直接套用商品建议。当前优先覆盖烘焙与餐饮食品；没有合适线索时允许为空。</p><p>“有升温或扩散证据”沿用热词追踪中的低位升温、连续三天升温、跨榜扩散规则。单次上榜不是刚开始流行，反复出现也不等于增长。每张卡片保留原排名、热度、实际采样间隔和官方来源；不同榜单热度不相加。</p><p>这是选品研究清单，不是销量榜。买家人群、订单量、竞争程度、供应商报价、利润与交期都需进一步核实。已有热度不保证未来销量，先询样、试做和小单验证。</p><p>历史日期只使用当日及以前的快照。每天采集一次，可能错过短时热点；榜外需求与改名话题未必被捕捉。</p><ul>${model.coverage.map(b=>`<li>${esc(b.name)}：${b.count} 条观测；${!b.available?'后段覆盖未知':b.missing.length?'后段缺第 '+b.missing.join('、')+' 名':'第21—50名齐全'}</li>`).join('')}</ul></details></div>`;
  $('#opportunity-category').value=filters.category;$('#opportunity-stage').value=filters.stage;rows();
 }
 function rows(){
  const cards=model.cards.filter(c=>(filters.category==='all'||c.category===filters.category)&&(filters.stage==='all'||c.stage===filters.stage));
  $('#opportunity-result-count').textContent=`当前 ${cards.length} 条`;
  $('#opportunity-results').innerHTML=cards.length?cards.map(c=>card(c)).join(''):`<div class="panel empty-state"><strong>这份快照没有符合筛选条件的商品线索</strong>不把不相关热点硬转成商品。可以切换经营方向，或查看下方超长蛋挞示例。</div>`;
 }
 function exportCard(id){
  const c=[...model.cards,...model.examples].find(x=>x.id===id);if(!c)return;
  const lines=[`商品机会研究清单｜${c.title}`,`分析依据日期：${model.date}`,c.stage==='example'?'用户历史示例，不代表当日热点':`榜单采集：${model.collectedAt}`,`阶段：${c.stageLabel}`,c.reason,'','【原始榜单证据】'];
  for(const r of c.signals)lines.push(`${r.boardName} 第${r.latest.rank}名，热度${r.latest.heat}；${r.latest.source}`,r.baseline?`较${r.baseline.date}热度${signed(r.percent)}，原排名${r.baseline.rank}→${r.latest.rank}，采样间隔${r.interval.toFixed(1)}小时`:'缺少前次基准');
  lines.push('','【询货方向】');for(const p of c.products)lines.push(`${p.role}：${p.name}`,`搜索词：${p.keywords.join(' / ')}`,...p.checks.map(t=>'□ '+t),'');
  lines.push('【询价时填写】','供应商与联系人：','规格 / 材料 / 尺寸：','样品费 / 最小起订量 / 梯度报价：','运费 / 包装费 / 预计交期 / 售后条件：','所需材料与检测文件核验：','','【试卖时填写】','目标买家与使用场景：','样品实际试做结果：','测试售价 / 单件总成本 / 破损或退货成本：','真实询单数 / 付款订单数 / 退款数：','复盘日期 / 继续或停止条件：','',`下一步：${c.nextStep}`,...c.validation.map(t=>'□ '+t),'','商品方向为用途推理；供应商、销量、利润均未核验。');
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`商品机会-${model.date}-${c.title.replace(/[\\/:*?"<>|]/g,'_')}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 document.addEventListener('change',e=>{if(e.target.id==='opportunity-category'){filters.category=e.target.value;rows();}if(e.target.id==='opportunity-stage'){filters.stage=e.target.value;rows();}});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-opportunity-export]');if(b)exportCard(b.dataset.opportunityExport);});
 return {render};
})();
