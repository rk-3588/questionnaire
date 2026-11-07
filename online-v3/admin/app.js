const $ = (id) => document.getElementById(id);
const routeNames = {
  A: "暂无已确认伴侣",
  B: "有伴侣、目前非已婚",
  M: "目前已婚",
  G: "关系或婚姻状态未透露",
};
const statusNames = {
  answered: "已回答",
  declined: "不愿回答",
  unsure: "尚未确定",
  not_applicable: "不适用",
  cannot_imagine: "难以代入",
  not_experienced: "没有相关经历",
  skipped: "主动跳过",
  unanswered: "未作答",
  not_shown: "按分支未展示",
  routed_not_applicable: "按分支未展示",
};
const excluded = new Set([
  "declined",
  "not_applicable",
  "cannot_imagine",
  "skipped",
  "unanswered",
]);
const shortTitles = {
  C01: "稳定亲密关系意愿",
  U01: "未来结婚意愿",
  U02: "结婚时间安排",
  R01: "生育或再生育意愿",
  F01: "日常开支压力",
  F02: "考虑结婚时最看重什么",
  F03: "感知到的家庭结婚期待",
  H01: "希望获得哪些支持",
  H02: "倾向怎样了解或讨论婚恋问题",
};
const errorNames = {
  invalid_credentials: "密码不正确，请重新输入。",
  too_many_attempts: "尝试次数较多，请稍后再试。",
  admin_not_configured: "管理员尚未配置，请联系服务器负责人完成设置。",
  password_length: "密码需要 12—128 个字符。",
  already_configured: "管理员已设置，请刷新后登录。",
  same_origin_required: "请求来源不匹配，请从后台地址重新打开。",
  csrf_required: "登录状态已变化，请退出后重新登录。",
  invalid_filter: "请检查筛选条件和起止日期。",
  invalid_pagination: "页码不正确，请重新筛选。",
  service_unavailable: "暂时未能读取数据，请稍后重试。",
  setup_local_only: "首次设置仅支持本机操作。",
};
let csrf = "",
  setup = false,
  authenticated = false,
  summaryData = null;
let applied = new URLSearchParams("eligibility=enrolled"),
  page = 1,
  pages = 1,
  loadSeq = 0,
  comparisonSeq = 0;
const number = (n) => new Intl.NumberFormat("zh-CN").format(n);
const percent = (value) =>
  value === null || value === undefined ? "—" : `${value.toFixed(1)}%`;
const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour12: false,
      })
    : "暂无";
const duration = (seconds) =>
  seconds === null || seconds === undefined || seconds <= 0
    ? "—"
    : seconds < 60
      ? `${seconds} 秒`
      : `${Math.floor(seconds / 60)} 分${seconds % 60 ? ` ${seconds % 60} 秒` : ""}`;
function el(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function enableExports(enabled) {
  for (const format of ["csv", "json"])
    $("export-" + format).disabled = !enabled;
}

function showLogin() {
  authenticated = false;
  csrf = "";
  summaryData = null;
  loadSeq++;
  comparisonSeq++;
  $("dashboard").hidden = true;
  $("logout").hidden = true;
  $("auth").hidden = false;
  $("detail").close();
  $("next-question").disabled = true;
  $("question-position").textContent = "";
  for (const id of [
    "stats",
    "overview-charts",
    "question-chart",
    "comparison-table",
    "records",
    "detail-body",
    "detail-meta",
  ])
    $(id).replaceChildren();
  enableExports(false);
}
async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json", "X-CSRF-Token": csrf }
        : {}),
      ...options.headers,
    },
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error("服务返回内容不完整，请稍后刷新。");
  }
  if (!response.ok) {
    if (response.status === 401 && path !== "/api/admin/login") {
      showLogin();
      $("auth-error").textContent = "登录已过期，请重新登录。";
    }
    throw Error(errorNames[data.error] || "请求未完成，请稍后重试。");
  }
  return data;
}
async function session() {
  try {
    const data = await api("/api/admin/session");
    if (data.authenticated) {
      csrf = data.csrfToken;
      authenticated = true;
      $("auth").hidden = true;
      $("dashboard").hidden = false;
      $("logout").hidden = false;
      await load(applied, 1);
      return;
    }
    showLogin();
    setup = data.setupRequired && data.setupAllowed;
    $("auth-title").textContent = setup ? "开启研究工作台。" : "欢迎回来。";
    $("auth-description").textContent = setup
      ? "首次使用，请设置管理员密码。"
      : data.setupRequired
        ? "请先在服务器运行 npm run setup-admin 完成管理员设置。"
        : "登录后查看问卷统计与回答记录。";
    $("auth-form").hidden = data.setupRequired && !data.setupAllowed;
    $("confirm-wrap").hidden = !setup;
    $("confirm").required = setup;
    $("password").autocomplete = setup ? "new-password" : "current-password";
  } catch (error) {
    showLogin();
    $("auth-error").textContent = error.message;
  } finally {
    $("session-loading").hidden = true;
  }
}

function formParams() {
  const params = new URLSearchParams();
  for (const [key, value] of new FormData($("filters")))
    if (value) params.set(key, value);
  return params;
}
function filterCaption(params) {
  const parts = [
    params.get("eligibility") === "enrolled"
      ? "已确认高校在读"
      : params.get("eligibility") === "unknown"
        ? "在读资格未透露"
        : "全部提交（含资格未透露）",
  ];
  for (const key of ["route", "study", "gender"])
    if (params.get(key))
      parts.push(
        $(key).querySelector(`option[value="${params.get(key)}"]`)
          ?.textContent || "已筛选",
      );
  if (params.get("start") || params.get("end"))
    parts.push(
      `${params.get("start") || "不限开始日期"} 至 ${params.get("end") || "不限结束日期"}`,
    );
  return parts.join(" · ");
}
async function load(params = applied, targetPage = page) {
  const seq = ++loadSeq,
    listParams = new URLSearchParams(params);
  listParams.set("page", targetPage);
  listParams.set("limit", 25);
  $("dashboard-error").textContent = "";
  $("refresh").disabled = true;
  $("refresh").textContent = "正在刷新…";
  $("filter-caption").textContent = "正在读取所选范围…";
  try {
    const [summary, list] = await Promise.all([
      api("/api/admin/summary?" + params),
      api("/api/admin/responses?" + listParams),
    ]);
    if (seq !== loadSeq || !authenticated) return;
    applied = new URLSearchParams(params);
    page = targetPage;
    pages = list.pages;
    summaryData = summary;
    if (page > pages) {
      await load(applied, pages);
      return;
    }
    $("filter-caption").textContent = "当前范围：" + filterCaption(applied);
    $("updated-at").textContent = "更新于 " + dateTime(summary.generatedAt);
    renderStats();
    renderOverview();
    renderQuestionOptions();
    renderQuestion();
    renderRecords(list);
    enableExports(true);
  } catch (error) {
    if (seq !== loadSeq) return;
    $("dashboard-error").textContent =
      error.message + (summaryData ? " 仍显示上次成功读取的筛选结果。" : "");
    $("filter-caption").textContent = summaryData
      ? "当前范围：" + filterCaption(applied)
      : "尚未读取到统计数据。";
  } finally {
    if (seq === loadSeq) {
      $("refresh").disabled = false;
      $("refresh").textContent = "刷新数据 ↻";
    }
  }
}
function renderStats() {
  const d = summaryData;
  const items = [
    [
      "提交答卷",
      number(d.total),
      `高校在读 ${number(d.eligible)} · 资格未透露 ${number(d.unknown)}`,
    ],
    ["今日提交", number(d.today), "北京时间 · 当前筛选范围"],
    [
      "填写用时中位数",
      duration(d.medianSeconds),
      `${number(d.durationCount)} 份记录了正数用时`,
    ],
    ["补充留言", number(d.textCount), "有文字补充的答卷 · 仅供授权查看"],
  ];
  $("stats").replaceChildren(
    ...items.map(([title, value, note]) => {
      const card = el("div", undefined, "stat");
      card.append(el("span", title), el("strong", value), el("small", note));
      return card;
    }),
  );
}
function bar(label, count, value) {
  const row = el("div", undefined, "bar-row"),
    caption = el("div", undefined, "bar-label");
  caption.append(
    el("span", label),
    el("span", `${number(count)} 人 · ${percent(value)}`, "bar-count"),
  );
  const track = el("div", undefined, "bar-track"),
    fill = el("div", undefined, "bar-fill");
  track.setAttribute("aria-hidden", "true");
  fill.style.width = `${Math.max(0, Math.min(100, value || 0))}%`;
  track.append(fill);
  row.append(caption, track);
  return row;
}
function questionCard(q, variant = q.variants[0], overview = false) {
  const card = el("article", undefined, "panel chart-card");
  card.dataset.question = q.id;
  const heading = el("div", undefined, "chart-head");
  heading.append(el("h2", overview ? shortTitles[q.id] || q.title : q.title));
  if (overview) {
    const b = el("button", "查看详情 ↗", "quiet");
    b.type = "button";
    b.addEventListener("click", () => {
      $("question-select").value = q.id;
      renderQuestion();
      switchTab("analysis");
      $("question-select").focus();
    });
    heading.append(b);
  }
  card.append(heading);
  const meta = el("div", undefined, "chart-meta");
  meta.append(
    el(
      "span",
      `${q.type === "text" ? "有文字回答" : "有效选择"} ${number(variant.valid)} 人 / 可回答 ${number(variant.shown)} 人`,
    ),
  );
  if (q.type === "multi") meta.append(el("span", "多选", "type-tag"));
  card.append(meta);
  if (q.hasVariants) card.append(el("p", variant.title, "chart-subtitle"));
  if (q.type === "text")
    card.append(
      el("p", "补充文字保留在单份回答中，请切换“回答记录”查看。", "no-values"),
    );
  else {
    if (!variant.valid)
      card.append(el("p", "当前范围暂无有效选择。", "no-values"));
    for (const option of variant.counts)
      card.append(bar(option.label, option.count, option.percent));
  }
  const states = el("div", undefined, "chart-states");
  for (const [state, count] of Object.entries(variant.statuses))
    if (excluded.has(state) && count)
      states.append(
        el("span", `${statusNames[state] || state} ${number(count)}`),
      );
  if (q.notShown)
    states.append(el("span", `按分支未展示 ${number(q.notShown)}`));
  if (q.scopeExcluded)
    states.append(
      el("span", `婚姻状况未明确，另列 ${number(q.scopeExcluded)}`),
    );
  if (states.childNodes.length) card.append(states);
  const notes = [];
  if (q.nonMarriedOnly) notes.push("统计明确目前非已婚者。");
  if (q.type === "multi")
    notes.push("按选择该项的人数计算，百分比之和可超过 100%。");
  if (q.id === "R01") notes.push("包含已有子女者对再生育的想法。");
  if (q.id === "R03") notes.push("个人期望、预计预算和通用安排偏好分别统计。");
  if (notes.length) card.append(el("p", notes.join(""), "chart-footnote"));
  return card;
}
function trendCard() {
  const card = el("article", undefined, "panel chart-card");
  card.append(
    el("h3", "提交趋势"),
    el(
      "p",
      `${summaryData.trend[0].day} 至 ${summaryData.trend.at(-1).day} · 点击某天查看当日记录`,
      "chart-subtitle",
    ),
  );
  const chart = el("div", undefined, "trend"),
    maximum = Math.max(1, ...summaryData.trend.map((d) => d.count));
  for (const day of summaryData.trend) {
    const column = el("button", undefined, "trend-day");
    column.type = "button";
    column.setAttribute(
      "aria-label",
      `${day.day}，${day.count} 份提交，查看当日记录`,
    );
    column.title = `${day.day} · ${day.count} 份`;
    column.append(
      el("span", day.count ? number(day.count) : "", "trend-count"),
    );
    const track = el("span", undefined, "trend-track"),
      fill = el("span", undefined, "trend-column");
    fill.style.height = `${(day.count / maximum) * 100}%`;
    track.append(fill);
    column.append(
      track,
      el("span", day.day.slice(5).replace("-", "/"), "trend-label"),
    );
    column.addEventListener("click", () => {
      $("start").value = day.day;
      $("end").value = day.day;
      $("more-filters").open = true;
      void load(formParams(), 1);
      switchTab("records");
    });
    chart.append(column);
  }
  card.append(chart);
  return card;
}
function renderOverview() {
  const charts = $("overview-charts");
  charts.replaceChildren();
  $("empty-overview").hidden = summaryData.total > 0;
  if (!summaryData.total) return;
  const byId = (id) => summaryData.questionStats.find((q) => q.id === id);
  for (const id of ["C01", "U01", "R01", "U02"])
    charts.append(questionCard(byId(id), undefined, true));
  charts.append(trendCard());
  const composition = el("article", undefined, "panel chart-card");
  composition.append(
    el("h3", "受访者关系状态"),
    el(
      "p",
      `以当前筛选范围的 ${number(summaryData.total)} 份答卷为分母`,
      "chart-subtitle",
    ),
  );
  for (const group of summaryData.composition.route)
    composition.append(bar(group.label, group.count, group.percent));
  charts.append(composition);
  for (const id of ["F02", "H01", "F01", "F03", "H02"])
    charts.append(questionCard(byId(id), undefined, true));
}
function renderQuestionOptions() {
  const previous = $("question-select").value,
    sections = new Map();
  $("question-select").replaceChildren();
  for (const q of summaryData.questionStats) {
    if (!sections.has(q.section)) {
      const group = document.createElement("optgroup");
      group.label = q.sectionName;
      sections.set(q.section, group);
    }
    const option = document.createElement("option");
    option.value = q.id;
    option.textContent = q.title;
    sections.get(q.section).append(option);
  }
  for (const [, group] of [...sections].sort((a, b) => a[0] - b[0]))
    $("question-select").append(group);
  $("question-select").value = summaryData.questionStats.some(
    (q) => q.id === previous,
  )
    ? previous
    : "U01";
}
function renderQuestion(keepVariant = false) {
  if (!summaryData) return;
  const select = $("question-select");
  const q = summaryData.questionStats.find((q) => q.id === select.value);
  $("question-position").textContent =
    `第 ${select.selectedIndex + 1} / ${select.options.length} 题 · ${q.sectionName}`;
  $("next-question").disabled =
    select.selectedIndex >= select.options.length - 1;
  $("next-question").title = $("next-question").disabled
    ? "已是最后一题"
    : `下一题：${select.options[select.selectedIndex + 1].textContent}`;
  const previous = keepVariant ? $("variant-select").value : "";
  $("variant-select").replaceChildren(
    ...q.variants.map((variant) => {
      const option = el("option", variant.label);
      option.value = variant.variant;
      return option;
    }),
  );
  if (q.variants.some((v) => v.variant === previous))
    $("variant-select").value = previous;
  $("variant-wrap").hidden = !q.hasVariants;
  const variant =
    q.variants.find((v) => v.variant === $("variant-select").value) ||
    q.variants[0];
  $("question-chart").replaceChildren(questionCard(q, variant));
  void renderComparison(q);
}
async function renderComparison(q) {
  const seq = ++comparisonSeq;
  $("comparison-table").replaceChildren();
  $("group-select").disabled = q.hasVariants || q.type === "text";
  if (q.hasVariants || q.type === "text") {
    $("comparison-note").textContent =
      q.type === "text"
        ? "开放题保留原文，不按文字内容推断群体特征。"
        : "这道题含不同情景，请在上方分别查看各情景的原题与分布。";
    return;
  }
  $("comparison-note").textContent = "正在读取分组数据…";
  const params = new URLSearchParams(applied);
  params.set("question", q.id);
  params.set("group", $("group-select").value);
  try {
    const data = await api("/api/admin/comparison?" + params);
    if (seq !== comparisonSeq || !authenticated) return;
    const table = document.createElement("table"),
      head = document.createElement("thead"),
      headRow = document.createElement("tr");
    for (const label of [
      "群体 / 有效选择人数",
      ...data.columns.map((c) => c.label),
    ]) {
      const th = el("th", label);
      th.scope = "col";
      headRow.append(th);
    }
    head.append(headRow);
    table.append(head);
    const body = document.createElement("tbody");
    for (const group of data.groups) {
      const row = document.createElement("tr"),
        label = el("th", group.label);
      label.scope = "row";
      label.append(el("small", `n = ${number(group.valid)}`));
      row.append(label);
      for (const count of group.counts) {
        const cell = el("td", percent(count.percent));
        cell.append(el("small", `${number(count.count)} 人`));
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body);
    $("comparison-table").replaceChildren(table);
    $("comparison-note").textContent =
      "每组按本题有效选择人数计算；无有效选择时显示“—”。" +
      (q.type === "multi" ? "多选比例之和可超过 100%。" : "") +
      (q.nonMarriedOnly ? "仅统计明确目前非已婚者。" : "");
  } catch (error) {
    if (seq === comparisonSeq) $("comparison-note").textContent = error.message;
  }
}
function switchTab(tab) {
  for (const button of document.querySelectorAll("[data-tab]")) {
    const selected = button.dataset.tab === tab;
    button.setAttribute("aria-selected", selected);
    button.tabIndex = selected ? 0 : -1;
    $("panel-" + button.dataset.tab).hidden = !selected;
  }
}
function renderRecords(list) {
  $("result-count").textContent = `${number(list.total)} 份`;
  $("empty-records").hidden = Boolean(list.items.length);
  $("records").replaceChildren(
    ...list.items.map((record) => {
      const row = document.createElement("tr");
      row.append(
        el("td", dateTime(record.createdAt)),
        el("td", routeNames[record.route] || "未透露"),
        el("td", record.eligibility === "enrolled" ? "高校在读" : "资格未透露"),
        el("td", duration(record.durationSeconds)),
      );
      const cell = document.createElement("td"),
        button = el("button", "查看 ↗", "quiet");
      button.type = "button";
      button.addEventListener("click", () => void detail(record.receipt));
      cell.append(button);
      row.append(cell);
      return row;
    }),
  );
  $("page-label").textContent = `${page} / ${pages}`;
  $("prev").disabled = page <= 1;
  $("next").disabled = page >= pages;
}
async function detail(receipt) {
  try {
    const record = await api(
      "/api/admin/responses/" + encodeURIComponent(receipt),
    );
    if (!authenticated) return;
    $("detail-meta").textContent =
      `${dateTime(record.createdAt)} · ${routeNames[record.route]} · ${record.eligibility === "enrolled" ? "高校在读" : "资格未透露"} · ${record.receipt}`;
    const groups = new Map();
    for (const response of record.responses) {
      if (["not_shown", "routed_not_applicable"].includes(response.status))
        continue;
      if (!groups.has(response.section)) {
        const section = el("details", undefined, "detail-section");
        section.open = response.section === 1;
        section.append(
          el(
            "summary",
            summaryData.questionStats.find((q) => q.id === response.id)
              ?.sectionName || "回答",
          ),
        );
        groups.set(response.section, section);
      }
      const item = el("article", undefined, "detail-answer");
      item.append(
        el("h3", response.title),
        el("p", response.label || statusNames[response.status] || "未作答"),
      );
      item.append(
        el("p", statusNames[response.status] || response.status, "muted"),
      );
      groups.get(response.section).append(item);
    }
    $("detail-body").replaceChildren(
      ...[...groups].sort((a, b) => a[0] - b[0]).map(([, group]) => group),
    );
    $("detail").showModal();
  } catch (error) {
    $("dashboard-error").textContent = error.message;
  }
}

$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("auth-error").textContent = "";
  const password = $("password").value;
  if (setup && password !== $("confirm").value) {
    $("auth-error").textContent = "两次输入的密码不同。";
    return;
  }
  $("auth-submit").disabled = true;
  try {
    if (setup)
      await api("/api/admin/setup", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    $("password").value = "";
    $("confirm").value = "";
    await session();
  } catch (error) {
    $("auth-error").textContent = error.message;
  } finally {
    $("auth-submit").disabled = false;
  }
});
$("logout").addEventListener("click", async () => {
  try {
    await api("/api/admin/logout", { method: "POST", body: "{}" });
    showLogin();
    await session();
  } catch (error) {
    $("dashboard-error").textContent = error.message;
  }
});
$("filters").addEventListener("submit", (event) => {
  event.preventDefault();
  void load(formParams(), 1);
});
$("filters").addEventListener("change", () => {
  $("filter-caption").textContent =
    "筛选条件已更改，点击“应用筛选”后更新图表。";
});
$("reset").addEventListener("click", () => {
  HTMLFormElement.prototype.reset.call($("filters"));
  void load(formParams(), 1);
});
$("refresh").addEventListener("click", () => void load());
$("prev").addEventListener("click", () => {
  if (page > 1) void load(applied, page - 1);
});
$("next").addEventListener("click", () => {
  if (page < pages) void load(applied, page + 1);
});
$("question-select").addEventListener("change", () => renderQuestion());
$("next-question").addEventListener("click", () => {
  if (!summaryData || $("next-question").disabled) return;
  $("question-select").selectedIndex++;
  renderQuestion();
});
$("variant-select").addEventListener("change", () => renderQuestion(true));
$("group-select").addEventListener("change", () => {
  if (summaryData)
    void renderComparison(
      summaryData.questionStats.find(
        (q) => q.id === $("question-select").value,
      ),
    );
});
for (const button of document.querySelectorAll("[data-tab]")) {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...document.querySelectorAll("[data-tab]")],
      index = buttons.indexOf(button);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) %
            buttons.length;
    switchTab(buttons[next].dataset.tab);
    buttons[next].focus();
  });
}
for (const format of ["csv", "json"])
  $("export-" + format).addEventListener("click", () => {
    if (!summaryData || !authenticated) return;
    const params = new URLSearchParams(applied);
    params.set("format", format);
    const link = document.createElement("a");
    link.href = "/api/admin/export?" + params;
    link.download = "";
    document.body.append(link);
    link.click();
    link.remove();
  });
$("close-detail").addEventListener("click", () => $("detail").close());
enableExports(false);
void session();
