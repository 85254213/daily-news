/* Read-only research hypotheses. Original TrendAnalytics records remain independent. */
(function(root){
 'use strict';
 const trends=typeof module!=='undefined'&&module.exports?require('./analytics.js'):root.TrendAnalytics;
 const categories={baking:'食品烘焙',food:'餐饮食品',gardening:'园艺种植',craft:'手工材料',cleaning:'家清收纳',other:'其他／待拆解'};
 const productRoles={finished:'成品',material:'原料',tool:'工具',mold:'模具',consumable:'耗材',accessory:'配件',packaging:'包装',bundle:'组合装'};
 const autoBoards=new Set(['hot','seeding','guangzhou']);
 const excluded=/演唱会|舞台|翻唱|歌词|歌单|BGM|电影|票房|定档|演员|电视剧|影集|配音|舞蹈|翻跳|摇$|事故|车祸|去世|逝世|死亡|中毒|召回|查获|诈骗|电诈|警方|曝光|海关|吃得太好了|餐馆|咖啡馆|茶花|茶汤|爆蛋|面包车|蛋糕裙|分蛋糕|新闻|股价|融资|地震|洪灾|火灾|枪击|战争|抢救|国足|战胜|赛事|执法|通报|发霉|霉变|过期|处罚|维权|致敏|过敏|纠纷|投诉|质量问题|不合格|劣质|假冒|伪劣|安全隐患|伤人/i;
 const commonGaps=['具体使用者与使用场景仍需原内容支持。','商品关系来自规则解释，不能据此确认购买需求。','等待后续有效快照，核对话题是否持续；页面刷新不触发新的采集。','同名记录按原规则展示，但是否为同一持续事件仍需原内容确认。'];
 const foodSpecs=['核对配料与规格、保存条件和保质期','涉及温控的原料需确认实际运输与保存条件'];
 const contactSpecs=['核对食品接触面材料与适用温度资料','核对尺寸、清洗方式及用途适配'];
 const packagingSpecs=['按成品核对内尺寸、承重与闭合方式','核对食品接触面材料、挤压保护和防漏条件'];
 const p=(key,name,productRole,keywords,relationReason,conditions,specs,questions=[])=>({key,name,productRole,keywords,relationReason,conditions,specs,questions});
 const recipes=[
  {match:/哑巴兔/,category:'food',scenario:'制作爆辣兔肉菜肴',audience:['研究该做法的家庭烹饪者','需要相关制作配套的人'],products:[p('rabbit','兔肉与辣椒调味组合','material',['兔肉切块 原料','干辣椒 花椒 调味'],'若原内容是兔肉做法，这些是可能涉及的食材。',['先确认是制作内容而非单纯探店'],foodSpecs,['原内容实际使用哪些部位、配料和辣度？']),p('pan','深口炒锅与分量秤','tool',['深口炒锅 防溅','厨房分量秤'],'支持翻炒与记录食材分量。',['以原内容加热方式和每份容量为前提'],contactSpecs),p('container','耐油带盖餐盒','packaging',['熟食餐盒 耐油 防漏'],'仅在携带或分装场景中提供承装用途。',['必须先确认有携带或分装场景'],packagingSpecs)]},
  {match:/大盘鱼/,category:'food',scenario:'制作或盛装大份鱼菜',audience:['制作多人份鱼菜的人','研究大份盛装方式的人'],products:[p('fish','鱼类与调味原料','material',['鱼类原料 规格','鱼菜 调味原料'],'鱼菜制作可能需要相应鱼类及调味。',['须先确认鱼种及蒸、煎、烤等实际做法'],foodSpecs),p('plate','大号鱼盘与适配蒸架','tool',['大号鱼盘','蒸鱼架 尺寸'],'大号盘用于盛装；蒸架仅适用于蒸制场景。',['仅原内容确认为蒸制时关联蒸架'],[...contactSpecs,'核对鱼盘外尺寸与蒸锅内径']),p('container','大尺寸防漏餐盒','packaging',['大号鱼盘 打包盒'],'有携带需求时用于盛装大份成品。',['先确认携带需求及成品尺寸'],packagingSpecs)]},
  {match:/香芋蒸排骨/,category:'food',scenario:'制作香芋蒸排骨',audience:['研究家常蒸菜的人'],products:[p('ingredients','香芋块与排骨原料','material',['香芋切块 原料','排骨切块'], '标题指向的蒸菜涉及香芋与排骨。',['具体切块及配料需核对原做法'],foodSpecs),p('steamer','蒸盘与隔水蒸架','tool',['蒸排骨 蒸盘','隔水蒸架'],'用于承装与隔水蒸制。',['先核对已有蒸具内径和食物分量'],contactSpecs),p('container','分格蒸菜餐盒','packaging',['蒸菜餐盒 防漏 分格'],'仅在携带或分装时需要。',['无携带场景时不必关联包装'],packagingSpecs)]},
  {match:/口蘑焗牛肉/,category:'food',scenario:'制作口蘑焗牛肉',audience:['研究焗菜做法的人'],products:[p('ingredients','口蘑与牛肉原料','material',['口蘑 规格','牛肉切片 原料'],'标题指向口蘑与牛肉的制作搭配。',['核对原内容中的肉类部位及切片厚度'],foodSpecs),p('pot','带盖焗锅与分量秤','tool',['焗锅 带盖','厨房分量秤'],'可能用于焗制及分量控制。',['先核对原视频加热方式；焗不一定使用烤箱'],[...contactSpecs,'核对炉具适配与每份容量']),p('container','防漏热食餐盒','packaging',['焗菜餐盒 防漏'],'仅在热食携带场景提供承装用途。',['先确认携带场景和温度条件'],packagingSpecs)]}
 ];
 const bakingSpecs=[['蛋挞','挞皮与挞液','蛋挞模具','蛋挞托与防压盒'],['面包','面粉与酵母','面包模具与烤盘','面包袋与纸托'],['蛋糕','蛋糕原料与奶油','蛋糕模具与裱花工具','蛋糕底托与防压盒'],['曲奇','低筋面粉与黄油','曲奇模具与烤盘','曲奇袋与分格盒'],['司康','低筋面粉与黄油','司康切模与烤盘','司康纸托与小盒'],['麻薯','麻薯粉与馅料','分量秤与烤盘','麻薯纸托与包装盒']];
 function classify(title){
  if(excluded.test(title))return null;
  const spec=bakingSpecs.find(x=>title.includes(x[0]));
  if(spec)return {category:'baking',scenario:'研究'+spec[0]+'的制作与成品保护',audience:['制作'+spec[0]+'的人','需要成品保护配套的人'],products:[p('ingredients',spec[1],'material',[spec[1]+' 烘焙 原料'],'与该类烘焙制作可能使用的原料有关。',['需先确认原内容是制作需求，而非只展示成品'],foodSpecs),p('mold',spec[2],spec[0]==='麻薯'?'tool':'mold',[spec[2]+' 尺寸'],'制作时可能用于成形、定量或承托。',['以实际配方、形状和加热方式为前提'],[...contactSpecs,'核对成品形状与烤箱内尺寸，观察脱模、断裂与受热情况']),p('packaging',spec[3],'packaging',[spec[3]+' 内尺寸'],'仅在携带或展示成品时提供保护。',['先确认成品保护场景，不据此推断购买需求'],packagingSpecs)]};
  const food=recipes.find(x=>x.match.test(title));if(food)return food;
  if(/育苗|播种/.test(title)&&/育苗|苗盘|基质|播种教程|播种方法|播种做法|播种记录|播种种植/.test(title))return {category:'gardening',scenario:'种子播种与育苗管理',audience:['进行播种育苗的种植者'],products:[p('substrate','育苗基质','material',['育苗基质 种类'],'育苗容器内可能需要适合该植物的基质。',['先确认植物种类与播种方式'],['核对基质组成、颗粒、保水与透气条件'],['是否适合该植物及当前生长阶段？']),p('tray','育苗盘','tool',['育苗盘 孔径 深度'],'用于分格承载育苗基质与幼苗。',['仅容器育苗场景适用'],['核对孔径、深度、排水孔、托盘尺寸及材料'],['根系空间与后续移栽方式是否匹配？']),p('label','植物标记标签','accessory',['育苗标签 可书写'],'用于区分品种和播种日期。',['存在多品种或记录需要时可选'],['核对标签尺寸、书写耐久性与户外条件'])]};
  if(/串珠/.test(title)&&/DIY|手工|教程|制作|自制|编织|做法|材料/i.test(title)&&!/成品|直接戴|现成|穿搭|开箱|购买|买的|买了|买到|买来/.test(title))return {category:'craft',scenario:'自行制作串珠饰品',audience:['自行制作串珠的人'],products:[p('beads','珠子与线材','material',['串珠 珠子 孔径','串珠线材 线径'],'自行串珠需要孔径匹配的珠子和线材。',['仅DIY制作需求；不能外推至购买成品饰品的人'],['核对珠孔内径、线径、材料及预期成品长度']),p('connector','连接件与扣件','accessory',['串珠连接件','饰品扣件 尺寸'],'部分结构需要连接或闭合配件。',['只在具体款式需要连接件时适用'],['核对孔径、开口方式、连接强度及皮肤接触材料']),p('pliers','串珠钳与剪线工具','tool',['串珠钳','剪线工具'],'在使用连接件或裁剪线材时提供操作工具。',['软线套穿等简单做法未必需要全部工具'],['按线材及连接件材质核对工具适用范围'])]};
  const flat=/平板拖把/.test(title)&&/清洁|拖地|替换|换布|安装|使用|教程|拖布/.test(title);
  const mop=/蒸汽拖把/.test(title)&&/清洁|替换|安装|使用|教程|清洁布/.test(title);
  const roller=/粘毛器|粘毛滚筒/.test(title)&&/清洁|替换|替芯|安装|使用|教程|粘毛/.test(title);
  if(flat||mop||roller){const kind=flat?'平板拖把':mop?'蒸汽拖把':'粘毛器';return {category:'cleaning',scenario:kind+'清洁与兼容替换件核对',audience:['正在使用该类清洁工具的人'],products:[p('tool',kind,'tool',[kind+' 型号'],'工具用于标题所指的清洁任务。',['先核对清洁表面、材质及工具适用范围'],[mop?'核对表面是否适合热蒸汽及设备使用条件':'核对清洁表面与工具适配条件']),p('replacement',roller?'兼容粘毛替芯':'兼容替换清洁布','consumable',[kind+(roller?' 替芯 尺寸':' 替换布 尺寸 接口')],'替换件只有在尺寸和连接方式一致时才能配合原工具使用。',['必须核对具体型号、接口及尺寸；同类清洁用品不代表兼容'],[roller?'核对替芯宽度、内径及滚筒固定方式':'核对布面长宽、固定方式与材质',mop?'另核对耐温条件与设备使用要求':'核对目标表面与清洁方法'],['原工具的确切型号是什么？','该替换件是否有明确的适配信息？'])]};}
  return null;
 }
 const timestamp=value=>{if(typeof value!=='string'||!value)return NaN;const s=value.replace(' ','T');return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(s)?s+'T00:00:00+08:00':/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)?s:s+'+08:00');};
 const candidateId=title=>'topic-'+encodeURIComponent(title);
 function titleFromId(id){try{return typeof id==='string'&&id.startsWith('topic-')?decodeURIComponent(id.slice(6)):'';}catch{return '';}}
 const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'?u.href:'';}catch{return '';}};
 const isBoardUrl=(url,sources)=>{if(/\/landings\/hotlist|\/aweme\/v1\/hot\/search\/list/.test(url))return true;try{const u=new URL(url);return [...sources].some(source=>{try{const b=new URL(source);return b.origin===u.origin&&b.pathname.replace(/\/$/,'')===u.pathname.replace(/\/$/,'');}catch{return false;}});}catch{return false;}};
 const before=(value,cutoff)=>Number.isFinite(timestamp(value))&&timestamp(value)<=cutoff;
 function preferencesFor(options,cutoff){const out=new Map();for(const x of options.preferences||[]){if(!x||!titleFromId(x.candidateId)||!before(x.addedAt||x.updatedAt,cutoff))continue;if(x.updatedAt&&!before(x.updatedAt,cutoff))continue;const old=out.get(x.candidateId);if(!old||timestamp(old.updatedAt||old.addedAt)<=timestamp(x.updatedAt||x.addedAt))out.set(x.candidateId,{candidateId:x.candidateId,followed:x.followed===true,ignored:x.ignored===true,addedAt:before(x.addedAt,cutoff)?x.addedAt:null,updatedAt:x.updatedAt||x.addedAt});}return out;}
 function themeFor(title,options,cutoff){return (options.themes||[]).filter(x=>x&&x.themeId&&x.label&&x.reason&&x.ruleVersion&&before(x.confirmedAt,cutoff)&&(!x.revokedAt||(Number.isFinite(timestamp(x.revokedAt))&&!before(x.revokedAt,cutoff)))&&x.aliases?.some(a=>a.title===title)).sort((a,b)=>timestamp(b.confirmedAt)-timestamp(a.confirmedAt)).map(x=>({themeId:x.themeId,label:x.label,variantId:x.aliases.find(a=>a.title===title).variantId||null,reason:x.reason,confirmedAt:x.confirmedAt,ruleVersion:x.ruleVersion}))[0]||null;}
 function makeProducts(plan,id){return (plan?.products||[]).map(x=>({productKey:id+':product:'+x.key,name:x.name,role:productRoles[x.productRole],productRole:x.productRole,keywords:[...x.keywords],checks:[...x.specs],relationReason:x.relationReason,conditions:[...x.conditions],specs:[...x.specs],evidenceStatus:'inference',questions:x.questions.length?[...x.questions]:['原内容是否明确涉及这一用途与规格？'],evidenceRefs:[]}));}
 function availableEvidence(items,targets,cutoff){const found=new Map(),ids=new Set();for(const e of items||[]){if(!e||!e.evidenceId||!e.dedupeKey||ids.has(e.evidenceId)||!['verified','retrieved'].includes(e.verificationStatus)||!['topic','scenario','product'].includes(e.targetType)||!targets.has(e.targetType+':'+e.targetId)||!e.summary||!e.sourceType||!before(e.observedAt,cutoff)||!before(e.recordedAt,cutoff)||timestamp(e.recordedAt)<timestamp(e.observedAt))continue;const url=e.sourceUrl?safeUrl(e.sourceUrl):'';if(e.sourceUrl&&!url)continue;const key=String(e.dedupeKey);if(found.has(key))continue;ids.add(e.evidenceId);found.set(key,{evidenceId:String(e.evidenceId),targetType:e.targetType,targetId:e.targetId,sourceType:String(e.sourceType),sourceUrl:url||null,summary:String(e.summary),observedAt:e.observedAt,recordedAt:e.recordedAt,dedupeKey:key,verificationStatus:e.verificationStatus});}return [...found.values()];}
 const examplePlan={category:'baking',scenario:'超长蛋挞制作、成形及成品保护',audience:['研究超长烘焙成形的人'],products:[p('ingredients','长条挞皮与挞液','material',['长条挞皮 烘焙','蛋挞液 原料'],'超长形态可能需要匹配的挞皮长度和挞液分量。',['先核对原做法与成品目标尺寸'],[...foodSpecs,'核对挞皮长宽厚度、每条挞液用量及保存条件']),p('mold','超长蛋挞模具','mold',['长条蛋挞模具 长宽高','超长蛋挞模具'],'为长条成品提供形状与承托。',['模具必须适配实际烤箱内腔及成品形状'],[...contactSpecs,'测量模具长宽高及烤箱内腔，确认可平放并预留操作空间','核对脱模后整条完整性与烤熟均匀度']),p('box','长条防压盒与底托','packaging',['长条蛋挞包装盒','长条烘焙防压盒 底托'],'若有携带或展示需求，可用于支撑和保护长条成品。',['需先确认成品保护场景'],[...packagingSpecs,'核对成品与盒内尺寸、底托承重及提拿运输后的断裂情况'])]};
 function makeExample(){const id='example-long-egg-tart';return {id,candidateId:id,title:'超长长长蛋挞',category:'baking',industry:categories.baking,section:'example',stage:'example',stageLabel:'用户历史示例',reason:'用户提供的历史例子，仅演示商品关系；不是当日榜单证据，也没有当前需求数据。',scenario:examplePlan.scenario,scenarioId:id+':scenario',audience:examplePlan.audience,products:makeProducts(examplePlan,id),signals:[],historicalSignals:[],facts:[],evidence:[],evidenceGaps:[{key:'historical-example',label:'独立历史示例',status:'not_applicable',detail:'不进入当日候选数、升温统计或首次收录判断。'}],recommendation:'仅作拆解示例',reasons:['未提供当日有效榜单记录。'],nextStep:'查看原做法，核对烤箱、模具、挞皮与包装的尺寸和用途是否匹配。',validation:['产品关系为用途推断；使用场景与具体需求仍待核实。','只读规格与用途核对，不包含经营信息填报。'],sources:[{title:'立高食品：蛋挞液产品目录',url:'https://www.ligaofoods.com/Product/index_569.html',note:'仅为原料品类参考，当前规格和使用条件仍需核对。'},{title:'de Buyer：细长挞圈',url:'https://www.debuyer-usa.com/products/perforated-oblong-tart-ring',note:'仅作形态参考；14.5厘米规格不等于适配超长蛋挞。'},{title:'长条点心包装盒形态参考',url:'https://www.rushcustomboxes.com/bakery-boxes/eclair-boxes/',note:'页面为厂商自述；材料、适用场景与规格尚未核验。'}]};}
 function build(archive,asOf,options={}){
  if(!trends?.build)throw new Error('TrendAnalytics must load before CommerceOpportunities');
  const dayEnd=timestamp(asOf+'T23:59:59.999+08:00');
  const supplied=options.knowledgeAt?timestamp(options.knowledgeAt):dayEnd;
  const cutoff=Math.min(dayEnd,Number.isFinite(supplied)?supplied:-Infinity);
  const input={days:(archive?.days||[]).filter(d=>d.date<=asOf&&before(d.collectedAt,cutoff)).map(d=>({...d,boards:(d.boards||[]).filter(b=>before(b.updatedAt,cutoff))}))};
  const result=trends.build(input,asOf,0),current=result.current?.date===asOf?result.current:null;
  const preferenceCutoff=options.preferenceAt?timestamp(options.preferenceAt):cutoff;
  const preferenceMap=preferencesFor(options,preferenceCutoff),byTitle=new Map();
  for(const r of result.records){if(typeof r.title!=='string'||!r.title.trim())continue;if(!byTitle.has(r.title))byTitle.set(r.title,[]);byTitle.get(r.title).push(r);}
  const scopeDates=input.days.map(d=>d.date).sort();
  const observationScope={from:scopeDates[0]||null,to:asOf,days:scopeDates.length,boards:[...new Set(input.days.flatMap(d=>d.boards.map(b=>b.id)))],knowledgeAt:Number.isFinite(cutoff)?new Date(cutoff).toISOString():null,label:scopeDates.length?`本系统可用归档 ${scopeDates[0]}—${asOf}（${scopeDates.length}份），只表示首次收录，不代表平台首次出现`:'本系统暂无可用归档，首次收录未知'};
  const candidates=new Map();
  for(const [title,records] of byTitle){
   const active=current?records.filter(r=>r.active&&r.latest.date===asOf):[];
   const allowed=active.filter(r=>autoBoards.has(r.boardId));
   const first=records.flatMap(r=>r.history).sort((a,b)=>timestamp(a.collectedAt)-timestamp(b.collectedAt))[0];
   const id=candidateId(title),pref=preferenceMap.get(id),plan=classify(title);
   const auto=!excluded.test(title)&&allowed.length>0&&(plan||allowed.some(r=>r.seed||r.sustained||r.spread)||first?.date===asOf);
   if(auto||(pref&&(pref.addedAt||pref.followed||pref.ignored)))candidates.set(title,{records,active,allowed,first,id,pref,plan:(allowed.length||(pref&&!active.length&&records.some(r=>autoBoards.has(r.boardId))))?plan:null,auto:Boolean(auto)});
  }
  for(const [id,pref] of preferenceMap){const title=titleFromId(id);if((pref.addedAt||pref.followed||pref.ignored)&&!candidates.has(title))candidates.set(title,{records:[],active:[],allowed:[],first:null,id,pref,plan:null,auto:false});}
  const cards=[];
  for(const [title,c] of candidates){
   const {records,active,first,id,pref,plan}=c,scenarioId=id+':scenario';
   const manualAdded=Boolean(pref?.addedAt),signals=c.allowed.length?c.allowed:(manualAdded?active:[]);
   const otherBoardSignals=active.filter(r=>!signals.includes(r));
   const rising=signals.some(s=>s.seed||s.sustained||s.spread),cooling=signals.length>0&&signals.every(s=>s.cooling),hasCurrentObservation=active.length>0;
   const stage=!hasCurrentObservation?'unobserved':rising?'rising':cooling?'cooling':'watch';
   const reasons=[...new Set(signals.flatMap(s=>[s.seed?'低位升温':null,s.sustained?'连续升温':null,s.spread?'跨榜扩散':null].filter(Boolean)))];
   const firstToday=first?.date===asOf;
   const sourceReasons=[...(rising?reasons:[]),...(firstToday?['本系统首次收录']:[]),...(manualAdded?['用户加入研究候选']:pref?.ignored?['本机标记不相关']:pref?.followed?['本机关注偏好']:[]),...(plan&&!rising&&!firstToday?['已有关联模板，等待更多证据']:[])];
   const products=makeProducts(plan,id),targets=new Set(['topic:'+id,'scenario:'+scenarioId,...products.map(p=>'product:'+p.productKey)]);
   const evidence=availableEvidence(options.evidence,targets,cutoff);
   for(const product of products)product.evidenceRefs=evidence.filter(e=>e.targetType==='product'&&e.targetId===product.productKey).map(e=>e.evidenceId);
   const boardUrls=new Set(records.flatMap(r=>r.history.map(h=>h.source)));
   const contentEvidence=evidence.filter(e=>e.targetType==='topic'&&e.targetId===id&&['original_content','video','article','public_content'].includes(e.sourceType)&&e.sourceUrl&&!isBoardUrl(e.sourceUrl,boardUrls));
   const originalContentUrl=contentEvidence[0]?.sourceUrl||null;
   const verified=evidence.filter(e=>e.verificationStatus==='verified');
   const facts=active.map(r=>({type:'board',summary:`${r.boardName}原第${r.latest.rank}名，官方热度${r.latest.heat}`,sourceUrl:r.latest.source,observedAt:r.latest.updatedAt,recordedAt:r.latest.collectedAt,targetType:'topic',targetId:id,recordRef:{date:r.latest.date,boardId:r.boardId,title:r.title,rank:r.latest.rank}}));
   facts.push(...verified.map(e=>({type:'public_evidence',summary:e.summary,sourceUrl:e.sourceUrl,observedAt:e.observedAt,recordedAt:e.recordedAt,targetType:e.targetType,targetId:e.targetId,evidenceId:e.evidenceId})));
   const hasComments=evidence.some(e=>e.sourceType==='comment'),hasLearning=evidence.some(e=>e.sourceType==='tutorial_request');
   const intentKinds=['purchase_intent','link_request','price_question','transaction'].filter(kind=>evidence.some(e=>e.sourceType===kind)),hasIntent=intentKinds.length>0;
   const intentLabels={purchase_intent:'明确购买意图',link_request:'求链接',price_question:'询问价格',transaction:'成交记录'};
   const gaps=[{key:'content',label:'原内容',status:originalContentUrl?'available':'unknown',detail:originalContentUrl?'已取得可追溯原内容链接；链接存在不等于商品需求已验证。':'暂无原内容链接；榜单来源页不等于内容核验完成。'},{key:'audience',label:'使用者与用途',status:verified.some(e=>e.targetType==='scenario')?'evidence_available':'unknown',detail:'模板中的使用者与用途是可能场景，需核对对应对象的内容证据。'},{key:'comments',label:'评论线索',status:hasComments?'evidence_available':'not_connected',detail:hasComments?'仅展示实际取得的评论证据；不推断人数。':'评论来源暂未接入；未知，不等于0条评论。'},{key:'learning',label:'学习／内容线索',status:hasLearning?'evidence_available':'unknown',detail:hasLearning?'已取得求教程线索，仅反映内容学习兴趣，不计入购买意图。':'暂无已取得的学习或内容请求证据。'},{key:'demand',label:'购买相关线索',status:hasIntent?'evidence_available':'unknown',detail:hasIntent?'已取得类别：'+intentKinds.map(k=>intentLabels[k]).join('、')+'；求链接、询问价格、明确购买意图与成交记录相互独立，不互相替代。':'暂无可核验购买意图证据；榜单热度或求教程不证明购买需求。'},...Object.entries(intentLabels).map(([key,label])=>({key,label,status:intentKinds.includes(key)?'evidence_available':'unknown',detail:intentKinds.includes(key)?'仅展示明确标为'+label+'的已取得证据，核验状态见原记录。':'暂无该类别的已取得证据，不能由其他类别推断。'})),{key:'products',label:'商品关系',status:products.length?'inference':'unknown',detail:products.length?'商品方向均为关联推断，证据只能支持其明确绑定的对象。':'暂无匹配模板，保留为待拆解候选，不生成商品。'},{key:'continuity',label:'后续观察',status:hasCurrentObservation?'available':'unknown',detail:hasCurrentObservation?'变化来自实际快照，不是实时增速。':'当日缺少有效观察，不视为热度回落。'}];
   const recommendation=!hasCurrentObservation?'证据不足':cooling?'暂不优先':!products.length?'证据不足':rising?'值得进一步研究':'继续观察';
   const recommendationReasons=!hasCurrentObservation?['所选日期没有有效同题记录，暂不判断趋势。']:cooling?['用于本卡判断的同题有效记录均满足既有回落条件。']:!products.length?['话题可以继续研究，但尚无明确商品关系。']:rising?[`命中${reasons.join('、')}，且有可解释的商品关系。`]:['已有相关线索，尚无满足规则的升温证据。'];
   recommendationReasons.push('购买需求尚未验证，研究优先级不代表商业结果。');
   const last=records.flatMap(r=>r.history).sort((a,b)=>timestamp(b.collectedAt)-timestamp(a.collectedAt))[0]||null;
   cards.push({id,candidateId:id,title,category:plan?.category||'other',industry:categories[plan?.category||'other'],stage,stageLabel:stage==='unobserved'?'缺少有效观察':rising?'有升温信号':cooling?'热度回落':'待核对',section:rising?'rising':'review',reason:sourceReasons.join('；')||'保留本机偏好，等待有效观察。',sourceReasons,candidateSource:manualAdded?(c.auto?'automatic_and_manual':'manual'):c.auto?'automatic':'local_preference',firstDate:first?.date||null,firstRecordedAt:first?.collectedAt||null,isFirstRecorded:firstToday,observationScope,scenario:plan?.scenario||'待核对原内容中的实际使用场景',scenarioId,audience:plan?.audience||[],products,signals,otherBoardSignals,historicalSignals:records,hasCurrentObservation,lastObservedAt:last?.collectedAt||null,lastObservedDate:last?.date||null,facts,evidence,evidenceGaps:gaps,originalContentUrl,recommendation,reasons:recommendationReasons,displayTheme:themeFor(title,options,cutoff),followed:pref?.followed||false,ignored:pref?.ignored||false,manualAdded,preference:pref||null,nextStep:!hasCurrentObservation?'查看历史记录与已有证据，等待后续有效快照。':!plan?'先查原内容，核对具体使用场景；没有明确关系时保持待拆解。':'查看原内容并逐项核对用途、规格与兼容条件，继续观察后续快照。',validation:[...commonGaps]});
  }
  const priority={rising:0,watch:1,unobserved:2,cooling:3};
  cards.sort((a,b)=>priority[a.stage]-priority[b.stage]||Math.min(...a.signals.map(s=>s.latest.rank),Infinity)-Math.min(...b.signals.map(s=>s.latest.rank),Infinity)||a.title.localeCompare(b.title,'zh-CN'));
  return {date:asOf,collectedAt:current?.collectedAt||null,cards,coverage:current?result.coverage:[],examples:[makeExample()],observationScope,knowledgeAt:observationScope.knowledgeAt,preferenceAt:Number.isFinite(preferenceCutoff)?new Date(preferenceCutoff).toISOString():null,sortExplanation:'先有升温信号，再待核对、缺少有效观察、回落；同阶段按原始最佳排名排序，不合计热度。'};
 }
 function exportText(card,model){
  const lines=[`商品研究清单｜${card.title}`,`观察日期：${model.date}`,card.stage==='example'?'用户历史示例，不代表当日热点':`榜单采集：${model.collectedAt||'无当日有效记录'}`,`阶段：${card.stageLabel}`,`研究建议：${card.recommendation||'继续观察'}`,...(card.reasons||[]),'',`场景（待核对）：${card.scenario}`,`可能使用者：${card.audience?.join('、')||'未知'}`,`首次收录：${card.firstRecordedAt||'未知／不适用'}`,card.observationScope?.label||'',`原内容：${card.originalContentUrl||'暂无原内容链接'}`,'','【为什么发现】'];
  for(const r of card.signals||[])lines.push(`${r.boardName} 原第${r.latest.rank}名，官方热度${r.latest.heat}；采集${r.latest.collectedAt}`,`榜单来源：${r.latest.source}`,r.baseline?`前次${r.baseline.date}热度变化${r.percent===null?'未知':r.percent.toFixed(1)+'%'}，原排名${r.baseline.rank}→${r.latest.rank}，实际间隔${r.interval.toFixed(1)}小时`:'缺少前一日同榜同题基准');
  for(const r of card.otherBoardSignals||[])lines.push(`其他榜单事实（不用于本卡阶段判定）：${r.boardName} 原第${r.latest.rank}名，官方热度${r.latest.heat}；采集${r.latest.collectedAt}`,`榜单来源：${r.latest.source}`);
  if(!card.signals?.length)lines.push(card.hasCurrentObservation?'有其他榜单事实，但没有用于本候选判断的当前记录。':'无当日有效榜单记录，不据此判断回落。');
  if(card.displayTheme)lines.push(`人工展示主题：${card.displayTheme.label}；变体：${card.displayTheme.variantId||'未指定'}；确认${card.displayTheme.confirmedAt}；规则${card.displayTheme.ruleVersion}`,`归组理由：${card.displayTheme.reason}；不同原始标题的信号仍保持独立。`);
  lines.push('','【可以研究什么商品】');
  if(!card.products.length)lines.push('待拆解：没有匹配模板。');
  for(const x of card.products)lines.push(`${x.role}：${x.name}（关联推断）`,`关联理由：${x.relationReason}`,`适用条件：${x.conditions.join('；')}`,`找品关键词：${x.keywords.join(' / ')}`,`规格核对：${x.specs.join('；')}`,`待核实：${x.questions.join('；')}`,`对应证据：${x.evidenceRefs.join('、')||'暂无'}`,'');
  lines.push('【需求依据与缺口】');
  for(const e of card.evidence||[])lines.push(`${e.verificationStatus==='verified'?'已核对':'已取得待核对'}｜${e.targetType}:${e.targetId}｜${e.sourceType}｜${e.summary}`,`来源：${e.sourceUrl||'暂无原链接'}；观察${e.observedAt}；取得${e.recordedAt}`);
  for(const g of card.evidenceGaps||[])lines.push(`${g.label}：${g.detail}`);
  for(const s of card.sources||[])lines.push(`形态参考：${s.title} ${s.url}；${s.note}`);
  lines.push('','【下一步核对】',card.nextStep,...(card.validation||[]),'','此清单仅记录公开线索、关系推断与核对点，不确认购买需求。');
  return lines.filter(x=>x!=='').join('\n');
 }
 const api={build,exportText,candidateId,categories,productRoles};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.CommerceOpportunities=api;
})(typeof globalThis!=='undefined'?globalThis:this);
