import {
  QUESTIONS,
  resolveQuestion,
  SECTION_LABELS,
} from "../public/survey-core.mjs";

const EXCLUDED = new Set([
  "declined",
  "not_applicable",
  "cannot_imagine",
  "skipped",
  "unanswered",
  "not_shown",
  "routed_not_applicable",
]);
const NON_MARRIED = new Set(["U01", "U02", "F02", "F03"]);
export const ROUTE_NAMES = {
  A: "暂无已确认伴侣",
  B: "有伴侣、目前非已婚",
  M: "目前已婚",
  G: "关系或婚姻状态未透露",
};
export const STUDY_NAMES = {
  college: "专科",
  undergrad: "本科",
  graduate: "研究生",
  other_enrolled: "其他高校在读阶段",
  unknown: "未透露",
};
export const GENDER_NAMES = {
  female: "女",
  male: "男",
  other: "其他性别认同",
  unknown: "未透露",
};
const value = (row, id) => row.answers?.[id]?.values?.[0];
const ratio = (count, total) =>
  total ? Math.round((count / total) * 1000) / 10 : null;
const knownNonMarried = (row) =>
  ["never", "previous"].includes(value(row, "D04"));
export const dayOf = (time) =>
  new Date(new Date(time).getTime() + 8 * 3600000).toISOString().slice(0, 10);
const invalidFilter = () =>
  Object.assign(Error("invalid_filter"), { status: 400 });

function validDay(text) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(text) &&
    Number.isFinite(Date.parse(text)) &&
    new Date(text).toISOString().slice(0, 10) === text
  );
}
export function parseFilters(url) {
  const result = Object.fromEntries(
    ["route", "eligibility", "study", "gender", "start", "end"].map((key) => [
      key,
      url.searchParams.get(key) || "",
    ]),
  );
  if (
    (result.route && !Object.hasOwn(ROUTE_NAMES, result.route)) ||
    (result.eligibility &&
      !["enrolled", "unknown"].includes(result.eligibility)) ||
    (result.study && !Object.hasOwn(STUDY_NAMES, result.study)) ||
    (result.gender && !Object.hasOwn(GENDER_NAMES, result.gender)) ||
    (result.start && !validDay(result.start)) ||
    (result.end && !validDay(result.end)) ||
    (result.start && result.end && result.start > result.end)
  )
    throw invalidFilter();
  return result;
}
const groupValue = (row, group) =>
  group === "route"
    ? row.route
    : group === "study"
      ? Object.hasOwn(STUDY_NAMES, value(row, "D02"))
        ? value(row, "D02")
        : "unknown"
      : Object.hasOwn(GENDER_NAMES, value(row, "D01"))
        ? value(row, "D01")
        : "unknown";
export function filterRecords(rows, filters) {
  return rows.filter(
    (row) =>
      (!filters.route || row.route === filters.route) &&
      (!filters.eligibility || row.eligibility === filters.eligibility) &&
      (!filters.study || groupValue(row, "study") === filters.study) &&
      (!filters.gender || groupValue(row, "gender") === filters.gender) &&
      (!filters.start || dayOf(row.createdAt) >= filters.start) &&
      (!filters.end || dayOf(row.createdAt) <= filters.end),
  );
}

function variantLabel(id, variant) {
  if (id === "R03")
    return variant.endsWith(":female")
      ? "收取方 · 个人期望"
      : variant.endsWith(":male")
        ? "支付方 · 预计预算"
        : "通用情景 · 安排偏好";
  if (id === "R02") {
    const direction = variant.includes(":self_yes:")
      ? "本人希望生育，伴侣不希望"
      : variant.includes(":self_no:")
        ? "本人不希望生育，伴侣希望"
        : "双方生育想法不同";
    return (
      direction +
      (variant.endsWith(":female")
        ? " · 对方称男方"
        : variant.endsWith(":male")
          ? " · 对方称女方"
          : " · 通用表述")
    );
  }
  return variant.endsWith(":female")
    ? "对方称男方的情景"
    : variant.endsWith(":male")
      ? "对方称女方的情景"
      : variant === "base"
        ? "共同题目"
        : "通用情景";
}
function newBucket(q) {
  return {
    variant: q.variant,
    label: variantLabel(q.id, q.variant),
    title: q.title,
    shown: 0,
    valid: 0,
    statuses: {},
    counts: q.options
      .filter((option) => !EXCLUDED.has(option.status))
      .map((option) => ({
        value: option.value,
        label: option.label,
        count: 0,
      })),
  };
}

export function questionSummary(rows, id) {
  const base = QUESTIONS[id];
  if (!base) throw invalidFilter();
  const buckets = new Map();
  const statuses = {};
  let notShown = 0,
    scopeExcluded = 0,
    textCount = 0;
  for (const row of rows) {
    const response = row.responses?.find((item) => item.id === id);
    if (
      !response ||
      ["not_shown", "routed_not_applicable"].includes(response.status)
    ) {
      notShown++;
      continue;
    }
    if (NON_MARRIED.has(id) && !knownNonMarried(row)) {
      scopeExcluded++;
      continue;
    }
    const question = resolveQuestion(id, row.answers, row.neutralQuestions);
    if (!buckets.has(question.variant))
      buckets.set(question.variant, newBucket(question));
    const bucket = buckets.get(question.variant);
    bucket.shown++;
    bucket.statuses[response.status] =
      (bucket.statuses[response.status] || 0) + 1;
    statuses[response.status] = (statuses[response.status] || 0) + 1;
    if (base.type === "text") {
      if (response.status === "answered" && response.text?.trim()) {
        textCount++;
        bucket.valid++;
      }
      continue;
    }
    if (EXCLUDED.has(response.status) || !response.values?.length) continue;
    const selected = new Set(response.values);
    if (!bucket.counts.some((option) => selected.has(option.value))) continue;
    bucket.valid++;
    for (const option of bucket.counts)
      if (selected.has(option.value)) option.count++;
  }
  if (!buckets.size) {
    const question = resolveQuestion(id, {}, ["R02", "R03", "V01", "V02"]);
    buckets.set(question.variant, newBucket(question));
  }
  const variants = [...buckets.values()].map((bucket) => ({
    ...bucket,
    counts: bucket.counts.map((option) => ({
      ...option,
      percent: ratio(option.count, bucket.valid),
    })),
  }));
  return {
    id,
    title: base.title,
    type: base.type,
    section: base.section,
    sectionName: SECTION_LABELS[base.section - 1],
    hasVariants: Boolean(base.variants),
    nonMarriedOnly: NON_MARRIED.has(id),
    notShown,
    scopeExcluded,
    textCount,
    shown: variants.reduce((n, bucket) => n + bucket.shown, 0),
    valid: variants.reduce((n, bucket) => n + bucket.valid, 0),
    statuses,
    variants,
  };
}

function composition(rows, group, labels) {
  return Object.entries(labels).map(([key, label]) => {
    const count = rows.filter((row) => groupValue(row, group) === key).length;
    return { key, label, count, percent: ratio(count, rows.length) };
  });
}

export function buildThemes(questions) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  function base(id) {
    const question = byId.get(id);
    return {
      questionId: id,
      valid: question.valid,
      note: question.nonMarriedOnly ? "明确目前非已婚者" : "本题有效选择人数",
    };
  }
  function share(id, label, values, invert = false) {
    const question = byId.get(id),
      counts = question.variants[0].counts;
    const selected = counts
      .filter((option) => values.includes(option.value))
      .reduce((sum, option) => sum + option.count, 0);
    const count = invert ? question.valid - selected : selected;
    return {
      ...base(id),
      kind: "share",
      label,
      count,
      percent: ratio(count, question.valid),
    };
  }
  function leaders(id, label) {
    const counts = byId.get(id).variants[0].counts;
    const count = Math.max(0, ...counts.map((option) => option.count));
    return {
      ...base(id),
      kind: "leaders",
      label,
      count,
      percent: ratio(count, byId.get(id).valid),
      choices: counts
        .filter((option) => count > 0 && option.count === count)
        .map(({ value, label }) => ({ value, label })),
    };
  }
  return [
    {
      id: "intention",
      title: "婚恋意愿",
      summary: leaders("U01", "未来结婚意愿"),
      metrics: [
        share("C01", "想拥有稳定亲密关系", ["yes"]),
        share("U01", "愿意未来结婚", ["yes"]),
        share("R01", "希望生育或再生育", ["yes"]),
      ],
      note: "三个指标各按本题有效人数计算。生育意愿包含已有子女者对再生育的想法。",
    },
    {
      id: "reality",
      title: "现实考虑",
      summary: leaders("F02", "考虑结婚时最看重的因素"),
      metrics: [
        share("F01", "日常开支压力较大或很大", ["large", "very_large"]),
        share("F02", "看重经济、居住与工作安排", ["practical"]),
        share("F03", "感到家人希望自己结婚", ["want"]),
      ],
      note: "较大压力合计“压力较大”和“压力很大”。结婚考虑为多选；家庭期待表示感知到的态度方向。",
    },
    {
      id: "support",
      title: "支持需求",
      summary: leaders("H01", "婚恋支持需求"),
      metrics: [
        share("H01", "选择至少一项支持需求", ["none"], true),
        share("H01", "目前没有需求", ["none"]),
        leaders("H02", "最常见的了解或交流选择"),
      ],
      note: "有需求人数按人去重，不累计多选次数；不含“目前没有需求”、拒答或未答。",
    },
  ];
}

export function buildCollection(rows, filters = {}, now = new Date()) {
  const end = filters.end || dayOf(now),
    endTime = Date.parse(end + "T12:00:00+08:00");
  const start = [dayOf(endTime - 29 * 86400000), filters.start || ""]
    .sort()
    .at(-1);
  const counts = new Map();
  let openingTotal = 0;
  for (const row of rows) {
    const day = dayOf(row.createdAt);
    if (day > end) continue;
    if (day < start) openingTotal++;
    else counts.set(day, (counts.get(day) || 0) + 1);
  }
  let cumulative = openingTotal;
  const days = [];
  for (let offset = 29; offset >= 0; offset--) {
    const day = dayOf(endTime - offset * 86400000);
    if (day < start) continue;
    const count = counts.get(day) || 0;
    cumulative += count;
    days.push({ day, count, cumulative });
  }
  return { start, end, openingTotal, totalThroughEnd: cumulative, days };
}

export function buildSummary(rows, filters = {}, now = new Date()) {
  const today = dayOf(now),
    byDay = new Map();
  const end = filters.end || today;
  const endTime = Date.parse(end + "T12:00:00+08:00");
  for (let i = 13; i >= 0; i--) byDay.set(dayOf(endTime - i * 86400000), 0);
  for (const row of rows) {
    const day = dayOf(row.createdAt);
    if (byDay.has(day)) byDay.set(day, byDay.get(day) + 1);
  }
  const durations = rows
    .map((row) => row.durationSeconds)
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 86400)
    .sort((a, b) => a - b);
  const middle = Math.floor(durations.length / 2);
  const median = durations.length
    ? Math.round(
        durations.length % 2
          ? durations[middle]
          : (durations[middle - 1] + durations[middle]) / 2,
      )
    : null;
  const questions = Object.keys(QUESTIONS).map((id) =>
    questionSummary(rows, id),
  );
  return {
    total: rows.length,
    eligible: rows.filter((row) => row.eligibility === "enrolled").length,
    unknown: rows.filter((row) => row.eligibility === "unknown").length,
    today: rows.filter((row) => dayOf(row.createdAt) === today).length,
    medianSeconds: median,
    durationCount: durations.length,
    textCount: questions.find((q) => q.id === "O01").textCount,
    latestAt: rows.reduce(
      (latest, row) =>
        !latest || row.createdAt > latest ? row.createdAt : latest,
      null,
    ),
    generatedAt: now.toISOString(),
    timezone: "Asia/Shanghai",
    trend: [...byDay].map(([day, count]) => ({ day, count })),
    composition: {
      route: composition(rows, "route", ROUTE_NAMES),
      study: composition(rows, "study", STUDY_NAMES),
      gender: composition(rows, "gender", GENDER_NAMES),
    },
    questionStats: questions,
    themes: buildThemes(questions),
    collection: buildCollection(rows, filters, now),
  };
}

export function buildComparison(rows, id, group) {
  if (
    !QUESTIONS[id] ||
    QUESTIONS[id].variants ||
    QUESTIONS[id].type === "text" ||
    !["study", "gender", "route"].includes(group)
  )
    throw invalidFilter();
  const labels =
    group === "study"
      ? STUDY_NAMES
      : group === "gender"
        ? GENDER_NAMES
        : ROUTE_NAMES;
  const columns = questionSummary([], id).variants[0].counts.map(
    ({ value, label }) => ({ value, label }),
  );
  return {
    id,
    group,
    title: QUESTIONS[id].title,
    columns,
    groups: Object.entries(labels).map(([key, label]) => {
      const selected = rows.filter((row) => groupValue(row, group) === key);
      const result = questionSummary(selected, id);
      return {
        key,
        label,
        total: selected.length,
        shown: result.shown,
        valid: result.valid,
        counts: result.variants[0].counts,
        scopeExcluded: result.scopeExcluded,
      };
    }),
  };
}
