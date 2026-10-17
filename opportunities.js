'use strict';
const OpportunitiesView = (() => {
  const categories = {food:'食品',baking:'烘焙',gardening:'园艺种植',craft:'手工材料',cleaning:'家清收纳',other:'其他 / 待拆解'};
  const evidenceTypes={board:'榜单记录',original_content:'原内容',video:'视频',article:'文章',public_content:'公开内容',comment:'评论',tutorial_request:'求教程',link_request:'求链接',price_question:'询问价格',purchase_intent:'购买意图',transaction:'实际成交记录'};
  const roles = {finished:'成品',material:'原料',tool:'工具',mold:'模具',consumable:'耗材',accessory:'配件',packaging:'包装',bundle:'组合装'};
  const filters = {category:'all',role:'all',stage:'all',evidence:'all',preference:'all',query:'',page:1};
  let noticeTimer;
  let model = null, store = null, local = {preferences:[],themes:[],evidence:[]}, message = '', failure = false;
  const signed = n => n == null ? '无可比基准' : `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
  const candidateId = title => 'topic-' + encodeURIComponent(title);
  function getStore() {
    if (!store) {
      let storage;
      try { storage = window.localStorage; } catch (_) { storage = null; }
      store = ResearchState.create(storage);
    }
    return store;
  }
  function load() {
    try { local = getStore().read(); }
    catch (_) { local = {preferences:[],themes:[],evidence:[],error:'本机偏好无法读取，保存前请检查浏览器存储权限。'}; }
    if (local.error) { message = local.error; failure = true; }
    return local;
  }
  function notify(text, isError = false) {
    message = text; failure = isError;
    const modalError=document.querySelector('#research-add-dialog[open] #research-add-error');
    if(modalError&&isError){modalError.hidden=false;modalError.textContent=text;}
    let box = document.getElementById('research-notice');
    if (!box) { box = document.createElement('div'); box.id = 'research-notice'; document.body.append(box); }
    box.className = 'research-notice' + (isError ? ' error' : '');
    box.setAttribute('role', isError ? 'alert' : 'status'); box.hidden=false;
    box.innerHTML = `<span>${esc(text)}</span><button type="button" aria-label="关闭提示" id="research-notice-close">×</button>`;
    clearTimeout(noticeTimer);if(!isError)noticeTimer=setTimeout(()=>{box.hidden=true;message='';},9000);
  }
  function link(url, label) {
    try { if (new URL(url).protocol !== 'https:') return esc(label) + '（无可用链接）'; }
    catch (_) { return esc(label) + '（暂无链接）'; }
    return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  }
  function select(id, label, items, value) {
    return `<label>${esc(label)}<select id="${id}">${items.map(([v,t])=>`<option value="${v}" ${v===value?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  }
  function evidence(r) {
    return `<li><strong>${esc(r.boardName)} · 原第 ${r.latest.rank} 名 · 热度 ${fmt(r.latest.heat)}</strong><p>实际采集 ${esc(r.latest.collectedAt || r.latest.date)} · 榜单更新 ${esc(r.latest.updatedAt || '未知')}</p><p>${r.baseline ? `较 ${esc(r.baseline.date)}：热度 ${signed(r.percent)} · 原排名 ${r.baseline.rank} → ${r.latest.rank} · 采样间隔 ${Number(r.interval).toFixed(1)} 小时` : '前一自然日缺少同榜同题有效记录，不能计算涨幅'} · ${esc(r.status)}</p><button class="text-action" data-topic="${esc(r.title)}" data-topic-board="${esc(r.boardId)}">查看原始轨迹</button> · ${link(r.latest.source,'榜单来源')}</li>`;
  }
  function products(c) {
    if (!c.products.length) return '<p class="research-pending">待拆解：尚无适用的商品模板。保留这条线索，不自动补出商品。</p>';
    return `<div class="opportunity-products">${c.products.map((p,i)=>`<section><p class="opportunity-role"><span>${String(i+1).padStart(2,'0')}</span>${esc(p.role || roles[p.productRole] || '关联商品')} · 关联推断</p><h4>${esc(p.name)}</h4><p>${esc(p.relationReason || '由场景模板提出，具体用途需要核对。')}</p><p class="research-small">适用条件：${esc((p.conditions || []).join('；') || '尚待核对')}</p><p class="research-small">关键规格：${esc((p.specs || []).join('；') || '暂无可核验规格')}</p><p class="opportunity-keywords">找品关键词：${(p.keywords || []).map(esc).join(' / ')}</p><ul>${[...(p.checks || []),...(p.questions || [])].filter((x,i,a)=>a.indexOf(x)===i).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="research-small">${(c.evidence || []).some(e=>e.targetType==='product'&&e.targetId===p.productKey&&['purchase_intent','link_request','price_question','transaction'].includes(e.sourceType))?'已取得绑定本商品的需求线索，请在下方分别核对线索类别和来源；单条线索不代表普遍需求。':'暂无绑定本商品的可核验购买意图证据。话题上榜不证明该配套有人购买。'}</p></section>`).join('')}</div>`;
  }
  function card(c, example = false) {
    const signals = c.signals || [], history = c.historicalSignals || [];
    const theme = c.displayTheme;
    return `<article class="panel opportunity-card" data-candidate-card="${esc(c.id)}"><div class="opportunity-card-head"><div class="opportunity-kicker"><span>${esc(categories[c.category] || c.category || '待拆解')}</span><span class="signal-badge ${c.stage==='rising'?'seed':c.stage==='cooling'?'falling':''}">${esc(c.stageLabel || '待核对')}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.reason)}</p>${theme?`<div class="research-theme">展示主题：${esc(theme.label)}${theme.variantId?' · 变体 '+esc(theme.variantId):''}<small>理由：${esc(theme.reason)} · 确认 ${esc(theme.confirmedAt)} · 规则 ${esc(theme.ruleVersion)}。原始标题和信号保持独立。</small></div>`:''}${!example?`<p class="research-small">${c.manualAdded?'当前本机候选加入时间 '+esc(c.preference?.addedAt || c.preference?.updatedAt || '未知')+'；不代表当时已知。<br>':''}本系统首次收录 ${esc(c.firstDate || '未知')} · 观察范围 ${esc(typeof c.observationScope==='string'?c.observationScope:c.observationScope?.label || '截至所选日期的可用归档')}。不是全网首发；同名不保证是同一持续事件。</p><div class="research-actions"><button class="secondary-button" data-research-action="${c.followed?'unfollow':'follow'}" data-candidate-id="${esc(c.id)}">${c.followed?'取消关注':'关注'}</button><button class="secondary-button" data-research-action="${c.ignored?'restore':'ignore'}" data-candidate-id="${esc(c.id)}">${c.ignored?'恢复相关':'不相关'}</button><button class="text-action" data-theme-title="${esc(c.title)}">设置展示别名</button></div>`:''}</div>
      ${example?'<p class="opportunity-example-note">用户历史示例，不代表今天热点，不计入候选数量。</p>':''}
      <section class="research-block"><h4>为什么发现</h4><p>${esc(c.recommendation || '继续观察')}：${esc((c.reasons || [c.reason]).map(x=>x.replace(/[。；]$/,'')).join('；'))}</p>${!example&&!c.hasCurrentObservation?'<p class="research-unknown">本次缺少有效观察，无法判断继续升温或回落。</p>':''}<details class="opportunity-evidence"><summary>已验证事实 · ${signals.length} 份当期原始榜单记录</summary><ul>${signals.map(evidence).join('') || '<li>暂无当期有效榜单事实。</li>'}</ul>${c.otherBoardSignals?.length?`<details><summary>其他榜单事实（不驱动自动商品推荐）</summary><ul>${c.otherBoardSignals.map(evidence).join('')}</ul></details>`:''}${!signals.length&&history.length?`<details><summary>最近已知历史记录（不是当期值）</summary><ul>${history.map(evidence).join('')}</ul></details>`:''}</details></section>
      <section class="research-block"><h4>可以研究什么商品</h4><p>场景假设：${esc(c.scenario || '待核对原内容后确定')}<br>可能使用者：${esc((c.audience || []).join('、') || '未知')}（未经需求验证）</p></section>${products(c)}
      <section class="research-block"><h4>需求依据是什么</h4><p>榜单事实只支持话题的榜单表现。商品关系为推断，购买需求尚未验证。</p><ul class="research-gaps">${(c.evidenceGaps || []).map(g=>`<li><strong>${esc(g.label || g.key)}</strong>：${esc(g.detail || g.status)}</li>`).join('')}</ul><p>${c.originalContentUrl?link(c.originalContentUrl,'原内容链接'):'暂无原内容链接'}</p><p class="research-small">暂无原内容链接时，不把榜单来源当成视频内容已核验。评论与购买意图未接入时为未知，不表示0人想买。</p>${c.evidence?.length?`<details class="opportunity-evidence"><summary>已取得的补充证据（按支持对象分开）</summary><ul>${c.evidence.map(e=>`<li><strong>${esc(e.verificationStatus==='verified'?'已核对公开内容':'已取得待核对')}</strong> · ${esc(evidenceTypes[e.sourceType] || e.sourceType)} · 支持 ${{topic:'话题',scenario:'使用场景',product:'具体商品'}[e.targetType] || esc(e.targetType)} / ${esc(e.targetId)}<p>${esc(e.summary)}</p><p>${link(e.sourceUrl,'证据来源')} · 观察 ${esc(e.observedAt)} · 取得 ${esc(e.recordedAt)}</p></li>`).join('')}</ul></details>`:''}</section>
      ${c.sources?.length?`<details class="opportunity-evidence"><summary>历史品类参考</summary><ul>${c.sources.map(s=>`<li>${link(s.url,s.title)}<p>${esc(s.note || '')}</p></li>`).join('')}</ul></details>`:''}
      <div class="opportunity-action"><strong>下一步核对什么</strong><p>${esc(c.nextStep || '查看原内容、核对用途与规格，并关注后续有效快照。')}</p><details><summary>规格与用途核对点</summary><ul>${(c.validation || []).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details><button class="secondary-button" data-opportunity-export="${esc(c.id)}">下载商品研究清单</button></div></article>`;
  }
  function themePanel() {
    return `<details class="panel opportunity-method" id="theme-config"><summary>人工确认展示别名 · 可撤销</summary><p>只整理展示关系，原始标题、不同变体、各榜热度与涨幅分别保留。含义不清的词请保持分开。此处列出当前本机配置及审计时间；历史卡片只使用当时已确认的版本，不会改写公开归档。</p><form id="theme-form" class="research-form"><label>主题名称<input name="label" required maxlength="100" placeholder="例如：长条蛋挞制作"></label><label>原始标题与变体（每行一个，选填竖线后变体）<textarea name="aliases" required rows="3" placeholder="归档里的完整标题 | 尺寸或用途变体"></textarea></label><label>已核对的归组理由<textarea name="reason" required rows="2" maxlength="600"></textarea></label><p>确认时间采用实际操作时间；历史日期不读取后来确认的关系。这里只做展示归组，没有确认原内容的模糊关系请勿提交。</p><button class="secondary-button" type="submit">确认展示别名</button></form><ul class="research-theme-list">${(local.themes || []).map(t=>`<li><strong>${esc(t.label)}</strong> · ${esc(t.confirmedAt)} · ${esc(t.ruleVersion)}<p>${esc(t.reason)}</p><p>${(t.aliases || []).map(a=>esc(a.title)+(a.variantId?'（'+esc(a.variantId)+'）':'')).join(' / ')}</p>${t.revokedAt?`<span>已撤销 ${esc(t.revokedAt)}</span>`:`<button class="text-action" data-revoke-theme="${esc(t.themeId)}">撤销此归组</button>`}</li>`).join('') || '<li>暂无人工确认的别名配置。</li>'}</ul></details>`;
  }
  function render() {
    load(); model = CommerceOpportunities.build(archive,state.date,{...local,preferenceAt:new Date().toISOString()});
    const rising = model.cards.filter(c=>c.section==='rising'&&!c.ignored).length;
    $('#app').innerHTML = `<div class="opportunities-layout"><section class="opportunity-intro"><p class="opportunity-eyebrow">跨行业商品研究</p><h2>找到线索，看清关联与证据。</h2><p>先看话题为什么值得关注，再核对可能相关的商品。食品、园艺、手工、家清为试点；其他行业可手动加入，待拆解。</p><div class="opportunity-stats"><span><strong>${model.cards.filter(c=>!c.ignored).length}</strong> 条研究候选</span><span><strong>${rising}</strong> 条有升温信号（低位／连续／扩散）</span><span>所选快照 ${esc(model.date)} ${esc(model.collectedAt?.slice(11,19) || '无有效采集')}</span></div></section><p class="research-privacy">关注与不相关标记是当前本机偏好；切换历史日期时，事实、证据和别名仍受该日边界限制。本机偏好无账号和云同步。刷新只读取已发布归档，不触发采集或站外通知。</p>
      <section class="opportunity-filters" aria-label="筛选研究候选">${select('opportunity-category','行业',[['all','全部行业'],...Object.entries(categories)],filters.category)}${select('opportunity-role','商品角色',[['all','全部角色'],...Object.entries(roles)],filters.role)}${select('opportunity-stage','信号',[['all','全部候选'],['rising','已有升温信号'],['review','首次收录 / 待核对'],['cooling','热度回落']],filters.stage)}${select('opportunity-evidence','证据',[['all','全部证据状态'],['content','已有补充证据'],['unknown','暂无购买相关线索']],filters.evidence)}${select('opportunity-preference','关注',[['all','全部相关候选'],['followed','已关注'],['manual','手动加入'],['ignored','不相关 / 可恢复']],filters.preference)}<label>搜索<input id="opportunity-search" value="${esc(filters.query)}" placeholder="搜索标题或商品方向"></label></section><p id="opportunity-result-count" class="research-small"></p><div id="opportunity-results"></div><div class="research-pagination"><button class="secondary-button" id="opportunity-prev">上一页</button><span id="opportunity-page"></span><button class="secondary-button" id="opportunity-next">下一页</button></div>
      ${themePanel()}<details class="panel opportunity-method"><summary>已有规则与覆盖边界</summary><p>自动候选仅使用有效热点、种草和广州榜。其他榜可核对后手动加入，默认待拆解。低位升温、连续升温、跨榜扩散复用原算法，不跨标题拼涨幅，也不把热度相加。</p><p>首次收录来自截至所选日期的全部可用归档，不等于相邻日新上榜，更不等于全网首次出现。没有模板允许为空。${esc(model.sortExplanation)}没有综合分或爆火概率。</p><p>事实、商品关系推断和缺失证据分别展示。未接入销量、评论或买家意图，不生成对应人数或经营结论。</p><ul>${model.coverage.map(b=>`<li>${esc(b.name)}：${b.count} 条有效观测；${!b.available?'后段未知':b.missing.length?'后段缺原排名 '+b.missing.join('、'):'21—50名齐全'}</li>`).join('')}</ul></details><details class="opportunity-case"><summary>历史示例 · 超长蛋挞（不计当日候选）</summary>${model.examples.map(c=>card(c,true)).join('')}</details></div>`;
    rows(); if (message) notify(message,failure);
  }
  function rows(reset = false) {
    if (!model) return; if (reset) filters.page = 1;
    const q = filters.query.toLowerCase();
    const cards = model.cards.filter(c => (filters.category==='all'||c.category===filters.category) && (filters.role==='all'||c.products.some(p=>p.productRole===filters.role)) && (filters.stage==='all'||(filters.stage==='cooling'?c.stage==='cooling':c.section===filters.stage)) && (filters.evidence==='all'||(filters.evidence==='content'?(c.evidence || []).length>0:c.evidenceGaps?.some(g=>g.key==='demand'&&g.status==='unknown'))) && (filters.preference==='ignored'?c.ignored:!c.ignored&&(filters.preference==='all'||(filters.preference==='followed'?c.followed:c.manualAdded))) && (!q||[c.title,...c.products.map(p=>p.name)].some(t=>t.toLowerCase().includes(q))));
    const pages = Math.max(1,Math.ceil(cards.length/12)); filters.page = Math.min(filters.page,pages);
    const shown = cards.slice((filters.page-1)*12,filters.page*12);
    $('#opportunity-result-count').textContent = `匹配 ${cards.length} 条 · 每页12条 · ${model.sortExplanation}`;
    $('#opportunity-results').innerHTML = cards.length ? [['rising','已有升温信号','以下原始记录实际命中已有规则，购买需求仍未验证。'],['review','首次收录 / 待核对','首次收录、规则待观察或人工加入，不能直接视作正在升温。']].map(([section,title,subtitle])=>`<section class="research-section" aria-label="${title}"><h2>${title}</h2><p>${subtitle}</p>${shown.filter(c=>c.section===section).map(c=>card(c)).join('')||'<p class="research-empty">本页暂无此分区候选。</p>'}</section>`).join('') : '<div class="panel empty-state"><strong>没有匹配的研究候选</strong>可从每日榜单或热词追踪中加入线索；不相关列表中可恢复误标。</div>';
    $('#opportunity-page').textContent = `第 ${filters.page} / ${pages} 页`;
    $('#opportunity-prev').disabled = filters.page===1; $('#opportunity-next').disabled = filters.page===pages;
  }
  function mutate(action,id) {
    let result;
    try { result = getStore().setPreference(id,action); } catch (e) { result = {ok:false,error:e.message}; }
    if (!result.ok) { notify(result.error || '保存失败，未更新偏好。',true); return false; }
    message = {follow:'已关注；后续变化依据新的有效归档显示。',unfollow:'已取消关注。',ignore:'已标记不相关，可在“不相关 / 可恢复”列表恢复。',restore:'已恢复相关。',add:'已加入研究候选，未取得的需求证据仍为未知。'}[action]; failure = false;
    if (state.view==='opportunities') render(); else notify(message);
    return true;
  }
  function add(title,board) {
    const allowed = ['hot','seeding','guangzhou'].includes(board);
    let dialog = document.getElementById('research-add-dialog');
    if (!dialog) { dialog=document.createElement('dialog'); dialog.id='research-add-dialog'; document.body.append(dialog); }
    dialog.innerHTML=`<form id="research-add-form"><h2>加入研究候选</h2><p>${esc(title)}</p><p>${allowed?'保留原始榜单记录。未匹配行业模板时显示待拆解。':'此榜不用于自动商品推荐。请先核对原话题，确认它适合研究；加入后仍为待拆解，不能把人工选择当购买需求证据。'}</p>${!allowed?'<label class="research-check"><input type="checkbox" name="reviewed" required>我已核对原话题，确认作为研究线索加入</label>':''}<p id="research-add-error" role="alert" hidden></p><input type="hidden" name="candidateId" value="${esc(candidateId(title))}"><div class="research-actions"><button type="submit" class="primary-button">加入候选</button><button type="button" class="secondary-button" id="research-add-cancel">取消</button></div></form>`;
    dialog.showModal();
  }
  function exportCard(id) {
    const c = [...model.cards,...model.examples].find(x=>x.id===id); if (!c) return;
    const text = CommerceOpportunities.exportText(c,model);
    const url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const a = document.createElement('a'); a.href=url; a.download=`商品研究-${model.date}-${c.title.replace(/[\\/:*?"<>|]/g,'_')}.txt`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  document.addEventListener('change', e => {
    const names={'opportunity-category':'category','opportunity-role':'role','opportunity-stage':'stage','opportunity-evidence':'evidence','opportunity-preference':'preference'};
    if(names[e.target.id]) { filters[names[e.target.id]]=e.target.value; rows(true); }
  });
  document.addEventListener('input',e=>{if(e.target.id==='opportunity-search'){filters.query=e.target.value;rows(true);}});
  document.addEventListener('click', e => {
    if(e.target.closest('#research-notice-close')){$('#research-notice').hidden=true;message='';}
    const addButton=e.target.closest('[data-research-add]');if(addButton)add(addButton.dataset.researchAdd,addButton.dataset.researchBoard);
    const action=e.target.closest('[data-research-action]');if(action)mutate(action.dataset.researchAction,action.dataset.candidateId);
    const exp=e.target.closest('[data-opportunity-export]');if(exp)exportCard(exp.dataset.opportunityExport);
    if(e.target.closest('#opportunity-prev')){filters.page--;rows();}if(e.target.closest('#opportunity-next')){filters.page++;rows();}
    if(e.target.closest('#research-add-cancel'))$('#research-add-dialog').close();
    const theme=e.target.closest('[data-theme-title]');if(theme){$('#theme-config').open=true;const form=$('#theme-form');form.elements.aliases.value=theme.dataset.themeTitle;form.scrollIntoView({block:'center'});form.elements.label.focus();}
    const revoke=e.target.closest('[data-revoke-theme]');if(revoke){const r=getStore().revokeTheme(revoke.dataset.revokeTheme);notify(r.ok?'已撤销展示归组；原始记录保持不变。':r.error,!r.ok);if(r.ok)render();}
  });
  document.addEventListener('submit',e=>{
    if(e.target.id==='research-add-form') { e.preventDefault();const form=e.target;if(mutate('add',form.elements.candidateId.value)){$('#research-add-dialog').close();if($('#topic-dialog')?.open)$('#topic-dialog').close();state.date=archive.days.at(-1).date;state.view='opportunities';filters.preference='manual';filters.category='all';filters.role='all';filters.evidence='all';filters.stage='all';filters.query='';filters.page=1;history.replaceState(null,'','#opportunities');window.dispatchEvent(new HashChangeEvent('hashchange'));} }
    if(e.target.id==='theme-form') {
      e.preventDefault();const form=e.target;
      const aliases=form.elements.aliases.value.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>{const [title,variantId]=x.split('|').map(s=>s.trim());return {title,...(variantId?{variantId}:{})};});
      const known=new Set(archive.days.flatMap(d=>d.boards.flatMap(b=>[...b.entries,...(b.watchEntries || [])].map(x=>x.title))));
      if(aliases.some(a=>!known.has(a.title))){notify('保存失败：请使用归档中的完整原始标题；未核对的变体保持分开。',true);return;}
      const r=getStore().confirmTheme({themeId:'theme-'+Date.now(),label:form.elements.label.value.trim(),aliases,reason:form.elements.reason.value.trim(),ruleVersion:'manual-v1'});
      notify(r.ok?'已记录展示别名与真实确认时间。历史回放不会提前使用。':r.error,!r.ok);if(r.ok)render();
    }
  });
  return {render,rows,add,exportCard};
})();
