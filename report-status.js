/* Read-only report status. These display settings do not change any scheduler. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ReportStatus = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DEFAULT_CONFIG = Object.freeze({ hour: 9, minute: 0, graceMinutes: 60 });
  const DAY = 86400000, OFFSET = 8 * 3600000;
  const BOARDS = [['hot', '热点榜'], ['seeding', '种草榜'], ['entertainment', '娱乐榜'],
    ['society', '社会榜'], ['challenge', '挑战榜'], ['guangzhou', '广州榜']];
  const pad = value => String(value).padStart(2, '0');

  function parseTimestamp(value) {
    if (typeof value !== 'string') return null;
    const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/i);
    if (!m) return null;
    const [year, month, day, hour, minute, second] = [m[1], m[2], m[3], m[4], m[5], m[6] || '0'].map(Number);
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return null;
    const fraction = m[7] ? m[7].slice(0, 4).padEnd(4, '0') : '';
    const ms = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${pad(second)}${fraction}${m[8] || '+08:00'}`);
    return Number.isFinite(ms) ? ms : null;
  }

  function dayKey(ms) { return new Date(ms + OFFSET).toISOString().slice(0, 10); }

  function scheduleWindow(options = {}) {
    const config = { ...DEFAULT_CONFIG, ...options };
    for (const [key, max] of [['hour', 23], ['minute', 59], ['graceMinutes', 1440]]) {
      if (!Number.isInteger(config[key]) || config[key] < 0 || config[key] > max) throw new RangeError(`Invalid ${key}`);
    }
    const now = config.now instanceof Date ? config.now.getTime() : typeof config.now === 'string' ? parseTimestamp(config.now) : config.now ?? Date.now();
    if (!Number.isFinite(now)) throw new RangeError('Invalid now');
    const today = dayKey(now);
    const start = parseTimestamp(today + 'T00:00:00+08:00');
    const plannedAt = start + (config.hour * 60 + config.minute) * 60000;
    const todayDeadline = plannedAt + config.graceMinutes * 60000;
    const cycleOffset = Math.floor((now - todayDeadline) / DAY);
    const dueDeadline = todayDeadline + cycleOffset * DAY;
    const requiredDate = dayKey(start + cycleOffset * DAY);
    return { now, today, plannedAt, todayDeadline, dueDeadline, requiredDate,
      hour: config.hour, minute: config.minute, graceMinutes: config.graceMinutes,
      planText: `北京时间每天 ${pad(config.hour)}:${pad(config.minute)}，容许延迟 ${config.graceMinutes} 分钟` };
  }

  function state(validAt, complete, window, hasUndatedRecords = false) {
    const overdue = validAt === null && hasUndatedRecords ? null : validAt === null || dayKey(validAt) < window.requiredDate;
    return { validAt, complete, overdue, status: overdue ? 'overdue' : complete && validAt !== null ? 'normal' : 'incomplete',
      label: overdue ? '更新逾期' : complete && validAt !== null ? '正常' : '不完整',
      waitingForToday: validAt !== null && dayKey(validAt) < window.today && !overdue,
      window };
  }

  const formalLimit = (day, board) => [20, 50].includes(board?.rankLimit) ? board.rankLimit : [20, 50].includes(day?.rankLimit) ? day.rankLimit : 20;

  function entryRanks(entries, limit) {
    const source = Array.isArray(entries) ? entries : [];
    const counts = new Map();
    source.forEach(e => { const rank = e?.rank ?? e?.position; counts.set(rank, (counts.get(rank) || 0) + 1); });
    return source.filter(e => {
      const rank = e?.rank ?? e?.position, title = e?.title ?? e?.word, heat = e?.heat ?? e?.hot_value;
      return Number.isInteger(rank) && rank >= 1 && rank <= limit && counts.get(rank) === 1 &&
        typeof title === 'string' && title.trim() && Number.isInteger(heat) && heat >= 0;
    }).map(e => e.rank ?? e.position);
  }

  function inspectDay(day, now) {
    const date = typeof day?.date === 'string' ? day.date : '';
    const collectedAt = parseTimestamp(day?.collectedAt ?? day?.collected_at);
    const timeValid = collectedAt !== null && collectedAt <= now && dayKey(collectedAt) === date;
    const boards = Array.isArray(day?.boards) ? day.boards : [];
    const details = BOARDS.map(([id, name]) => {
      const matches = boards.filter(b => b?.id === id || (!b?.id && b?.name === name));
      if (matches.length !== 1) return { name, count: 0, expected: formalLimit(day), reason: matches.length ? '榜单记录重复' : '未取得榜单' };
      const b = matches[0], expected = formalLimit(day, b), updatedAt = parseTimestamp(b.updatedAt ?? b.active_time);
      if (updatedAt === null || updatedAt > now || dayKey(updatedAt) !== date) return { name, count: 0, expected, reason: '缺少当日有效榜单时间' };
      const ranks = entryRanks(b.entries, expected), count = ranks.length;
      const missingRanks = Array.from({ length: expected }, (_, i) => i + 1).filter(rank => !ranks.includes(rank));
      return { name, count, expected, missingRanks, reason: count === expected ? '' : `有效原排名 ${count}/${expected}，缺少原排名 ${missingRanks.join('、')}` };
    });
    const count = details.reduce((n, b) => n + b.count, 0);
    const fullBoards = details.filter(b => b.count === b.expected).length;
    const expected = details.reduce((n, b) => n + b.expected, 0);
    const limits = [...new Set(details.map(b => b.expected))];
    return { date, collectedAt, timeValid, count, expected, rankLimit: limits.length === 1 ? limits[0] : null, fullBoards, details,
      complete: fullBoards === 6 && !(Array.isArray(day?.warnings) && day.warnings.length) && timeValid,
      hasWarnings: Array.isArray(day?.warnings) && day.warnings.length > 0,
      supplement: day?.thirdPartySupplement || null };
  }

  function evaluateDouyin(archive, options = {}) {
    const window = scheduleWindow(options);
    const days = (Array.isArray(archive?.days) ? archive.days : [])
      .filter(d => typeof d?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && d.date <= window.today)
      .map(d => inspectDay(d, window.now)).sort((a, b) => b.date.localeCompare(a.date) || (b.collectedAt || 0) - (a.collectedAt || 0));
    const latest = days[0] || null;
    const lastValid = days.find(d => d.timeValid && d.count > 0);
    const result = state(lastValid?.collectedAt ?? null, latest?.complete || false, window, days.some(d => d.count > 0 && !d.timeValid));
    return { ...result, latest, count: latest?.count ?? 0, expected: latest?.expected ?? null, rankLimit: latest?.rankLimit ?? null, fullBoards: latest?.fullBoards ?? 0,
      coverageKnown: !!latest, coverageText: latest ? `本轮官方${latest.rankLimit ? '前' + latest.rankLimit + '名' : '按各榜收录范围'}：${latest.count}/${latest.expected} 条 · 完整榜 ${latest.fullBoards}/6` : '官方覆盖：暂无可读归档',
      gaps: latest ? latest.details.filter(b => b.reason).map(b => `${b.name}：${b.reason}`) : [],
      latestAttemptAt: latest?.timeValid ? latest.collectedAt : null,
      supplement: latest?.supplement?.sourceType === 'third_party' ? latest.supplement : null };
  }

  function parseCoverage(value) {
    const match = typeof value === 'string' && value.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
    if (!match) return null;
    const current = Number(match[1]), total = Number(match[2]);
    return current <= total ? { current, total, complete: current === total } : null;
  }

  function evaluateNews(metadata, ready, options = {}) {
    const window = scheduleWindow(options);
    const generatedAt = parseTimestamp(metadata?.generated_at);
    const latestGeneratedAt = generatedAt !== null && generatedAt <= window.now ? generatedAt : null;
    const hotlist = parseCoverage(metadata?.hotlist_coverage), rss = parseCoverage(metadata?.rss_coverage);
    const empty = !!(hotlist && rss && hotlist.current + rss.current === 0);
    const validAt = empty ? null : latestGeneratedAt;
    const matchingReady = !!(latestGeneratedAt !== null && ready && ready.date === dayKey(latestGeneratedAt));
    const partial = matchingReady && ready.status === 'partial';
    const complete = !!(hotlist?.complete && rss?.complete && hotlist.current + rss.current > 0 && !partial);
    const result = state(validAt, complete, window, !!metadata && latestGeneratedAt === null);
    return { ...result, latestGeneratedAt, empty, hotlist, rss, matchingReady, partial,
      coverageText: `热榜来源 ${hotlist ? hotlist.current + '/' + hotlist.total : '未记录'} · RSS ${rss ? rss.current + '/' + rss.total : '未记录'}`,
      readyMismatch: !!(ready && latestGeneratedAt !== null && !matchingReady),
      partialNote: partial ? String(ready.note || '').split(/[；;]/).filter(s => s.trim() && !/等待\s*automation-4\s*合并发布/.test(s)).join('；') : '' };
  }

  return { DEFAULT_CONFIG, parseTimestamp, dayKey, scheduleWindow, evaluateDouyin, evaluateNews };
});
