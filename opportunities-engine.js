/* Product hypotheses from dated observations; never sales or sourcing evidence. */
(function(root){
 'use strict';
 const trends=typeof module!=='undefined'&&module.exports?require('./analytics.js'):root.TrendAnalytics;
 const product=(name,role,keywords,checks)=>({name,role,keywords,checks});
 const excluded=/演唱会|舞台|翻唱|歌词|歌单|BGM|电影|票房|定档|演员|电视剧|影集|配音|舞蹈|翻跳|摇$|事故|车祸|去世|逝世|死亡|中毒|召回|查获|诈骗|电诈|警方|曝光|海关|吃得太好了|餐馆|咖啡馆|茶花|茶汤|爆蛋|面包车|蛋糕裙|分蛋糕|新闻|股价|融资/i;
 const sources=new Set(['hot','seeding','guangzhou']);
 const commonValidation=['先查看原话题内容，确认关注的是食物本身及制作方式。','分别询样并记录规格、起订量、到货时间、退换条件；货源尚未验证。','先做小批试做和真实询单，记录成本与反馈，再决定是否补货；榜单热度不等于购买需求。'];
 const cold=['核对配料、规格、保存条件与保质期','询样确认运输温度、到货状态和实际损耗'];
 const contact=['向供应商索取适用食品接触及使用温度的材料资料','询样核对尺寸、清洗方式和使用寿命'];
 const pack=['按试做成品核对内尺寸、承重和闭合方式','询样测试运输挤压、渗漏及食品接触面材料'];
 const next='各选少量原料、器具与包装样品，完成试做和包装测试；收集真实询单后再决定进货。';
 const recipes=[
  {match:/哑巴兔/,label:'爆辣兔肉',products:[product('兔肉与辣椒调味组合','原料',['兔肉切块 原料','干辣椒 花椒 调味'],cold),product('分量秤与防溅炒锅','器具',['厨房分量秤','深口炒锅 防溅'],contact),product('耐油带盖餐盒','包装',['熟食餐盒 耐油 防漏'],pack)]},
  {match:/大盘鱼/,label:'大份鱼菜',products:[product('鱼类与腌料组合','原料',['鱼类原料 规格','蒸鱼调味料'],cold),product('大号鱼盘与适配蒸架','器具',['大号鱼盘','蒸鱼架 尺寸'],[...contact,'测量鱼盘外尺寸与蒸锅内径，试装确认空间']),product('大尺寸防漏餐盒','包装',['大号鱼盘 打包盒'],pack)]},
  {match:/香芋蒸排骨/,label:'香芋蒸排骨',products:[product('香芋块与排骨原料','原料',['香芋切块 原料','排骨切块 冷链'],cold),product('蒸盘与隔水蒸架','器具',['蒸排骨 蒸盘','隔水蒸架'],contact),product('分格蒸菜餐盒','包装',['蒸菜餐盒 防漏 分格'],pack)]},
  {match:/口蘑焗牛肉/,label:'口蘑焗牛肉',products:[product('口蘑与牛肉原料','原料',['口蘑 鲜品 规格','牛肉切片 原料'],cold),product('带盖焗锅与分量秤','器具',['焗锅 带盖','厨房分量秤'],[...contact,'先核对原视频加热方式；焗不一定使用烤箱，再确认炉具适配性和每份容量']),product('防漏热食餐盒','包装',['焗菜餐盒 防漏'],pack)]}
 ];
 const bakingSpecs=[
  {match:/蛋挞/,label:'蛋挞',ingredient:'挞皮与挞液',tool:'蛋挞模具',pack:'蛋挞托与防压盒'},
  {match:/面包/,label:'面包',ingredient:'面粉与酵母',tool:'面包模具与烤盘',pack:'面包袋与纸托'},
  {match:/蛋糕/,label:'蛋糕',ingredient:'蛋糕预拌粉与奶油',tool:'蛋糕模具与裱花工具',pack:'蛋糕底托与防压盒'},
  {match:/曲奇/,label:'曲奇',ingredient:'低筋面粉与黄油',tool:'曲奇模具与烤盘',pack:'曲奇袋与分格盒'},
  {match:/司康/,label:'司康',ingredient:'低筋面粉与黄油',tool:'司康切模与烤盘',pack:'司康纸托与小盒'},
  {match:/麻薯/,label:'麻薯',ingredient:'麻薯粉与馅料',tool:'分量秤与烤盘',pack:'麻薯纸托与包装盒'}
 ];
 function classify(title){
  if(excluded.test(title))return null;
  const spec=bakingSpecs.find(x=>x.match.test(title));
  if(spec)return {category:'baking',label:spec.label,products:[product(spec.ingredient,'原料',[spec.ingredient+' 烘焙 原料'],cold),product(spec.tool,'器具',[spec.tool+' 尺寸'],[...contact,'按原视频成品形状及烤箱内尺寸询样，实测脱模与成品完整率']),product(spec.pack,'包装',[spec.pack+' 内尺寸'],pack)]};
  const recipe=recipes.find(x=>x.match.test(title));
  return recipe?{...recipe,category:'food'}:null;
 }
 const example={id:'example-long-egg-tart',title:'超长长长蛋挞',category:'baking',stage:'example',stageLabel:'用户历史示例',reason:'来自用户提供的历史例子，用于演示选品拆解；不是今日热榜证据，也没有据此确认当前销量或热度。',products:[product('长条挞皮与挞液','原料',['长条挞皮 烘焙','蛋挞液 原料'],[...cold,'核对挞皮长宽厚度、每条挞液用量及冷链条件']),product('超长蛋挞模具','器具',['长条蛋挞模具 长宽高','超长蛋挞模具'],[...contact,'测量模具长宽高及烤箱内腔，确认可平放并预留操作空间','少量试做，记录脱模后整条断裂率和烤熟均匀度']),product('长条防压盒与底托','包装',['长条蛋挞包装盒','长条烘焙防压盒 底托'],[...pack,'核对成品与盒内尺寸、底托承重，测试提拿和运输后的断裂率'])],nextStep:'先量烤箱，再询挞皮、模具及盒子样品；完成整条试做和运输测试后，用小批询单验证需求。',validation:[...commonValidation,'示例不参与当前机会数、趋势排序或涨幅计算。'],signals:[],sources:[{title:'立高食品：蛋挞液产品目录',url:'https://www.ligaofoods.com/Product/index_569.html',note:'官方产品目录，仅证明存在相关原料品类；当前供货、规格与冷链条件仍须询样核验。'},{title:'de Buyer：细长挞圈',url:'https://www.debuyer-usa.com/products/perforated-oblong-tart-ring',note:'官方器具页面，仅作形态参考；页面所示14.5厘米规格不等于适配超长蛋挞，须按实际烤箱与成品尺寸核验。'},{title:'Rush Custom Boxes：长条点心包装盒',url:'https://www.rushcustomboxes.com/bakery-boxes/eclair-boxes/',note:'厂商自述的长盒定制页；资质、供货与食品接触材料均未核验，不构成供应商推荐。'}]};
 function build(archive,asOf){
  if(!trends?.build)throw new Error('TrendAnalytics must load before CommerceOpportunities');
  const result=trends.build(archive,asOf);
  if(!result.current||result.current.date!==asOf)return {date:asOf,collectedAt:null,cards:[],coverage:[],examples:[example]};
  const groups=new Map();
  for(const r of result.records){
   if(!r.active||r.latest.date!==asOf||!sources.has(r.boardId)||typeof r.title!=='string'||!r.title.trim())continue;
   const plan=classify(r.title);if(!plan)continue;
   if(!groups.has(r.title))groups.set(r.title,{plan,signals:[]});
   groups.get(r.title).signals.push(r);
  }
  const cards=[...groups].map(([title,{plan,signals}])=>{
   const rising=signals.some(s=>s.seed||s.sustained||s.spread);
   const cooling=signals.every(s=>s.cooling);
   const stage=rising?'rising':cooling?'cooling':'watch';
   const reasons=[...new Set(signals.flatMap(s=>[s.seed?'低位升温':null,s.sustained?'连续升温':null,s.spread?'跨榜扩散':null].filter(Boolean)))];
   const reason=rising?'快照中观察到'+reasons.join('、')+'，可先验证相关商品需求。':cooling?'同题有效记录均出现热度回落，先复核需求，不据此扩大进货。':'当前有该食物话题的榜单记录，尚未满足升温规则；仅作为待验证选品线索。';
   return {id:'topic-'+encodeURIComponent(title),title,category:plan.category,stage,stageLabel:rising?'升温观察':cooling?'热度回落':'待验证',reason,products:plan.products,nextStep:cooling?'先查看话题是否已转冷，复核现有询单与库存，再决定是否询样。':next,validation:[...commonValidation,'同题跨榜分别展示原始热度，不合计为总热度；仅比较实际采样快照。'],signals};
  });
  const priority={rising:0,watch:1,cooling:2};
  cards.sort((a,b)=>priority[a.stage]-priority[b.stage]||Math.min(...a.signals.map(s=>s.latest.rank))-Math.min(...b.signals.map(s=>s.latest.rank))||a.title.localeCompare(b.title,'zh-CN'));
  return {date:result.current.date,collectedAt:result.current.collectedAt,cards,coverage:result.coverage,examples:[example]};
 }
 const api={build};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.CommerceOpportunities=api;
})(typeof globalThis!=='undefined'?globalThis:this);
