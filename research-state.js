/* Local research preferences and manually confirmed display aliases. No business ledger. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ResearchState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEYS = Object.freeze({
    preferences: 'douyin.research.preferences.v1',
    themes: 'douyin.research.themes.v1',
    evidence: 'douyin.research.evidence.v1'
  });
  const LIMITS = Object.freeze({characters: 524288, preferences: 2000, themes: 1000, evidence: 1000, aliases: 50});
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  function exact(value, allowed, required = allowed) {
    return object(value) && Object.keys(value).every(key => allowed.includes(key)) && required.every(key => Object.prototype.hasOwnProperty.call(value, key));
  }
  function timestamp(value) {
    return typeof value === 'string' && value.length <= 40 && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  }
  function candidateId(title) {
    if (!text(title, 500)) throw new TypeError('原始标题为空或过长');
    return 'topic-' + encodeURIComponent(title);
  }
  function validCandidateId(id) {
    if (typeof id !== 'string' || id.length > 6000 || !id.startsWith('topic-')) return false;
    try { return candidateId(decodeURIComponent(id.slice(6))) === id; } catch (_) { return false; }
  }
  function preference(value) {
    const keys = ['candidateId', 'followed', 'ignored', 'addedAt', 'updatedAt'];
    if (!exact(value, keys) || !validCandidateId(value.candidateId) || typeof value.followed !== 'boolean' || typeof value.ignored !== 'boolean' || !timestamp(value.updatedAt) || (value.addedAt !== null && (!timestamp(value.addedAt) || Date.parse(value.addedAt) > Date.parse(value.updatedAt))) || (value.followed && !value.addedAt)) throw new Error('关注偏好格式不合法');
    return {candidateId:value.candidateId, followed:value.followed, ignored:value.ignored, addedAt:value.addedAt, updatedAt:value.updatedAt};
  }
  function themeInput(value) {
    if (!exact(value, ['themeId', 'label', 'aliases', 'reason', 'ruleVersion']) || !text(value.themeId, 160) || !text(value.label, 160) || !text(value.reason, 1000) || !text(value.ruleVersion, 80) || !Array.isArray(value.aliases) || value.aliases.length < 1 || value.aliases.length > LIMITS.aliases) throw new Error('请提供主题、原始标题、归组理由与规则版本');
    const titles = new Set();
    const aliases = value.aliases.map(alias => {
      if (!exact(alias, ['title', 'variantId'], ['title']) || !text(alias.title, 500) || (alias.variantId !== undefined && !text(alias.variantId, 160)) || titles.has(alias.title)) throw new Error('别名原始标题重复或变体格式不合法');
      candidateId(alias.title);
      titles.add(alias.title);
      return alias.variantId === undefined ? {title:alias.title} : {title:alias.title, variantId:alias.variantId};
    });
    return {themeId:value.themeId, label:value.label, aliases, reason:value.reason, ruleVersion:value.ruleVersion};
  }
  function theme(value) {
    const keys = ['themeId', 'label', 'aliases', 'reason', 'ruleVersion', 'confirmedAt', 'revokedAt'];
    if (!exact(value, keys) || !timestamp(value.confirmedAt) || (value.revokedAt !== null && (!timestamp(value.revokedAt) || Date.parse(value.revokedAt) < Date.parse(value.confirmedAt)))) throw new Error('别名审计时间不合法');
    const input = themeInput({themeId:value.themeId, label:value.label, aliases:value.aliases, reason:value.reason, ruleVersion:value.ruleVersion});
    return {...input, confirmedAt:value.confirmedAt, revokedAt:value.revokedAt};
  }
  function evidence(value) {
    const keys = ['evidenceId', 'targetType', 'targetId', 'sourceType', 'sourceUrl', 'summary', 'observedAt', 'recordedAt', 'dedupeKey', 'verificationStatus'];
    if (!exact(value, keys) || !text(value.evidenceId, 200) || !['topic', 'scenario', 'product'].includes(value.targetType) || !text(value.targetId, 6000) || !text(value.sourceType, 80) || !text(value.summary, 2000) || !text(value.dedupeKey, 500) || !['verified', 'retrieved', 'unverified', 'unavailable', 'not_connected'].includes(value.verificationStatus) || !timestamp(value.observedAt) || !timestamp(value.recordedAt) || Date.parse(value.observedAt) > Date.parse(value.recordedAt)) throw new Error('证据字段或取得时间不合法');
    if (value.sourceUrl !== null && value.sourceUrl !== '') {
      if (!text(value.sourceUrl, 2048)) throw new Error('证据来源链接不合法');
      let url;
      try { url = new URL(value.sourceUrl); } catch (_) { throw new Error('证据来源链接不合法'); }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('证据来源链接不合法');
    }
    return {evidenceId:value.evidenceId, targetType:value.targetType, targetId:value.targetId, sourceType:value.sourceType, sourceUrl:value.sourceUrl, summary:value.summary, observedAt:value.observedAt, recordedAt:value.recordedAt, dedupeKey:value.dedupeKey, verificationStatus:value.verificationStatus};
  }
  function checkThemeHistory(records) {
    const intervals = new Map();
    for (const record of records) {
      for (const key of ['theme:' + record.themeId, ...record.aliases.map(alias => 'title:' + alias.title)]) {
        if (!intervals.has(key)) intervals.set(key, []);
        intervals.get(key).push([Date.parse(record.confirmedAt), record.revokedAt === null ? Infinity : Date.parse(record.revokedAt)]);
      }
    }
    for (const ranges of intervals.values()) {
      ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      for (let i = 1; i < ranges.length; i++) if (ranges[i][0] < ranges[i - 1][1]) throw new Error('别名确认历史存在重叠');
    }
  }
  function validateItems(kind, items) {
    if (!Array.isArray(items) || items.length > LIMITS[kind]) throw new Error('本机记录数量超出范围');
    const validators = {preferences:preference, themes:theme, evidence};
    const records = items.map(validators[kind]);
    if (kind === 'themes') checkThemeHistory(records);
    else {
      const seen = new Set();
      for (const record of records) {
        const id = kind === 'preferences' ? record.candidateId : record.evidenceId;
        if (seen.has(id)) throw new Error('本机记录标识重复');
        seen.add(id);
      }
    }
    return records;
  }
  function create(storage, now) {
    let store = storage;
    if (store === undefined) {
      try { store = globalThis.localStorage; } catch (_) { store = null; }
    }
    const clock = typeof now === 'function' ? now : () => new Date();
    function load(kind) {
      try {
        if (!store || typeof store.getItem !== 'function') throw new Error('浏览器未允许本机存储');
        const raw = store.getItem(KEYS[kind]);
        if (raw === null) return {items:[], raw:null, error:null};
        if (typeof raw !== 'string' || raw.length > LIMITS.characters) throw new Error('本机数据过长，未读取或覆盖');
        const parsed = JSON.parse(raw);
        if (!exact(parsed, ['version', 'items']) || parsed.version !== 1) throw new Error('本机数据版本或字段不受支持');
        return {items:validateItems(kind, parsed.items), raw, error:null};
      } catch (error) {
        return {items:[], raw:null, error:`${kind}：本机数据无法读取；原数据未改动。${error instanceof SyntaxError ? '内容已损坏' : error.message || '存储访问失败'}`};
      }
    }
    function read() {
      const result = {}, errors = [];
      for (const kind of Object.keys(KEYS)) {
        const loaded = load(kind);
        result[kind] = loaded.items;
        if (loaded.error) errors.push(loaded.error);
      }
      return {...result, error:errors.length ? errors.join('；') : null};
    }
    function realTime(notBefore) {
      const value = new Date(clock());
      if (!Number.isFinite(value.getTime())) throw new Error('本机当前时间无效');
      if (notBefore && value.getTime() < Date.parse(notBefore)) throw new Error('本机时间早于已有审计记录，未保存');
      return value.toISOString();
    }
    function save(kind, loaded, items) {
      try {
        validateItems(kind, items);
        const raw = JSON.stringify({version:1, items});
        if (raw.length > LIMITS.characters) throw new Error('本机记录已达到容量上限');
        if (!store || typeof store.setItem !== 'function' || store.getItem(KEYS[kind]) !== loaded.raw) throw new Error('本机数据已变化或无法写入，请重新读取');
        store.setItem(KEYS[kind], raw);
        if (store.getItem(KEYS[kind]) !== raw) throw new Error('无法确认保存结果，请重新读取');
        return {ok:true, error:null, changed:true};
      } catch (error) {
        return {ok:false, error:`本机保存失败：${error.message || '存储不可用或容量不足'}`};
      }
    }
    function setPreference(id, action) {
      if (!validCandidateId(id) || !['add', 'follow', 'unfollow', 'ignore', 'restore'].includes(action)) return {ok:false, error:'候选标识或操作不合法'};
      const loaded = load('preferences');
      if (loaded.error) return {ok:false, error:loaded.error};
      const prior = loaded.items.find(item => item.candidateId === id);
      if (!prior && ['unfollow', 'restore'].includes(action)) return {ok:true, error:null, changed:false, preference:null};
      const next = prior ? {...prior} : {candidateId:id, followed:false, ignored:false, addedAt:null, updatedAt:null};
      if (action === 'follow') next.followed = true;
      if (action === 'unfollow') next.followed = false;
      if (['add', 'follow', 'restore'].includes(action)) next.ignored = false;
      if (action === 'ignore') next.ignored = true;
      const needsAddedAt = ['add', 'follow'].includes(action) && next.addedAt === null;
      if (prior && !needsAddedAt && next.followed === prior.followed && next.ignored === prior.ignored) return {ok:true, error:null, changed:false, preference:prior};
      try {
        next.updatedAt = realTime(prior?.updatedAt);
        if (needsAddedAt) next.addedAt = next.updatedAt;
      } catch (error) { return {ok:false, error:error.message}; }
      const result = save('preferences', loaded, [...loaded.items.filter(item => item.candidateId !== id), next]);
      return result.ok ? {...result, preference:next} : result;
    }
    function confirmTheme(input) {
      let value;
      try { value = themeInput(input); } catch (error) { return {ok:false, error:error.message}; }
      const loaded = load('themes');
      if (loaded.error) return {ok:false, error:loaded.error};
      const active = loaded.items.filter(item => item.revokedAt === null);
      const prior = active.find(item => item.themeId === value.themeId);
      const titles = new Set(value.aliases.map(alias => alias.title));
      if (active.some(item => item.themeId !== value.themeId && item.aliases.some(alias => titles.has(alias.title)))) return {ok:false, error:'原始标题已由其他主题确认；请先撤销或保留分开'};
      if (prior && JSON.stringify(themeInput({themeId:prior.themeId, label:prior.label, aliases:prior.aliases, reason:prior.reason, ruleVersion:prior.ruleVersion})) === JSON.stringify(value)) return {ok:true, error:null, changed:false, theme:prior};
      let confirmedAt;
      try {
        const latest = loaded.items.flatMap(item => [item.confirmedAt, item.revokedAt]).filter(Boolean).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1);
        confirmedAt = realTime(latest);
      } catch (error) { return {ok:false, error:error.message}; }
      const record = {...value, confirmedAt, revokedAt:null};
      const history = loaded.items.map(item => item.themeId === value.themeId && item.revokedAt === null ? {...item, revokedAt:confirmedAt} : item);
      const result = save('themes', loaded, [...history, record]);
      return result.ok ? {...result, theme:record} : result;
    }
    function revokeTheme(themeId) {
      if (!text(themeId, 160)) return {ok:false, error:'主题标识不合法'};
      const loaded = load('themes');
      if (loaded.error) return {ok:false, error:loaded.error};
      const prior = loaded.items.find(item => item.themeId === themeId && item.revokedAt === null);
      if (!prior) return {ok:true, error:null, changed:false, theme:null};
      let revokedAt;
      try { revokedAt = realTime(prior.confirmedAt); } catch (error) { return {ok:false, error:error.message}; }
      const record = {...prior, revokedAt};
      const result = save('themes', loaded, loaded.items.map(item => item === prior ? record : item));
      return result.ok ? {...result, theme:record} : result;
    }
    return Object.freeze({read, setPreference, confirmTheme, revokeTheme});
  }
  return Object.freeze({create, candidateId, KEYS, LIMITS});
});
