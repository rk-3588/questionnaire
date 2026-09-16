export type SurveyAnswer = 1 | 2 | 3 | 4 | 5;
export type SurveyGender = "♂" | "♀" | "不愿透露";

type Question = { id: string; text: string; note: string };
export type Submission = { id: string; createdAt: string; answers: SurveyAnswer[]; label: string; message: string; gender: SurveyGender };
const DIMENSIONS = [
  ["关系意愿", [0, 1, 2, 3, 6]], ["自主选择", [5, 13]], ["未来规划", [4, 8, 9]],
  ["现实压力", [10, 11]], ["风险意识", [14, 15]], ["责任协商", [16, 17, 18, 19]],
] as const;
const dimensionScores = (answers: SurveyAnswer[]) => DIMENSIONS.map(([, indexes]) => { const list = indexes as readonly number[]; return Math.round(list.reduce((sum, index) => sum + answers[index], 0) / list.length / 5 * 100); });
export const profileRadar = (answers: SurveyAnswer[]) => { const values = dimensionScores(answers); const points = (radius: number) => values.map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return `${100 + Math.cos(a) * radius},${100 + Math.sin(a) * radius}`; }).join(" "); const labels = DIMENSIONS.map(([name], i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return `<text x="${100 + Math.cos(a) * 78}" y="${104 + Math.sin(a) * 78}" text-anchor="middle">${name}</text>`; }).join(""); return `<svg class="radar-chart" viewBox="0 0 200 200" role="img" aria-label="六维婚恋画像"><polygon points="${points(62)}"/><polygon points="${points(42)}"/><polygon points="${points(22)}"/><polygon class="radar-value" points="${values.map((v, i) => { const a=-Math.PI/2+i*Math.PI/3; const r=62*v/100; return `${100+Math.cos(a)*r},${100+Math.sin(a)*r}`; }).join(" ")}"/>${labels}</svg>`; };

const QUESTIONS: Question[] = [
  { id: "love_now", text: "我愿意在大学期间建立一段稳定的恋爱关系。", note: "恋爱意愿 / RELATIONSHIP" },
  { id: "love_quality", text: "相比是否恋爱，我更看重关系中的尊重、平等和安全感。", note: "关系期待 / RELATIONSHIP" },
  { id: "love_time", text: "我愿意为经营亲密关系投入稳定的时间和精力。", note: "关系投入 / RELATIONSHIP" },
  { id: "marriage", text: "在合适的条件下，我愿意进入婚姻。", note: "婚姻意愿 / MARRIAGE" },
  { id: "marriage_delay", text: "在事业和经济基础稳定前，我倾向于推迟结婚。", note: "婚期考量 / MARRIAGE" },
  { id: "family_form", text: "我能够接受结婚、晚婚或不婚等不同生活选择。", note: "选择自主 / AUTONOMY" },
  { id: "children", text: "如果未来进入稳定婚姻，我有生育子女的意愿。", note: "生育意愿 / FAMILY" },
  { id: "child_number", text: "我对未来理想子女数量有比较明确的想法。", note: "生育规划 / FAMILY" },
  { id: "career", text: "学业和职业发展会显著影响我的婚恋时间安排。", note: "学业职业 / FUTURE" },
  { id: "job_pressure", text: "就业竞争和工作稳定性会降低我近期的婚恋意愿。", note: "就业压力 / FUTURE" },
  { id: "economy", text: "收入、消费和长期经济压力会影响我是否进入婚姻。", note: "经济条件 / MATERIAL" },
  { id: "housing", text: "住房和居住安排是我评估婚姻可行性的重要因素。", note: "住房条件 / MATERIAL" },
  { id: "family_expect", text: "父母或亲属的期待会影响我的婚恋选择。", note: "家庭影响 / FAMILY" },
  { id: "family_support", text: "如果家人不支持，我仍会坚持经过思考后的个人选择。", note: "家庭协商 / FAMILY" },
  { id: "network", text: "网络平台上的婚恋叙事会影响我对亲密关系的想象。", note: "网络环境 / MEDIA" },
  { id: "risk", text: "我会认真评估冷暴力、控制、背叛等亲密关系风险。", note: "风险认知 / SAFETY" },
  { id: "communication", text: "发生分歧时，我愿意通过平等沟通而不是单方面妥协来解决。", note: "沟通协商 / RESPONSIBILITY" },
  { id: "commitment", text: "做出恋爱或婚姻承诺后，我愿意承担相应的长期责任。", note: "承诺责任 / RESPONSIBILITY" },
  { id: "housework", text: "家务和照护责任应当由伴侣根据实际情况共同分担。", note: "家务分担 / RESPONSIBILITY" },
  { id: "parenting", text: "我愿意与伴侣平等讨论并共同承担未来的育儿责任。", note: "育儿责任 / RESPONSIBILITY" },
];

const DEMO: Submission[] = [
  { id: "Q-104", createdAt: "2026-09-12T10:12:00.000Z", answers: [4,5,3,4,5,3,4,3,5,2,2,2,3,4,4,5,5,4,3,4], label: "访客 104", message: "愿每个人都能诚实地面对自己的选择。", gender: "不愿透露" },
  { id: "Q-118", createdAt: "2026-09-13T16:48:00.000Z", answers: [2,3,5,2,3,4,2,2,3,5,4,4,4,2,3,4,2,3,4,2], label: "访客 118", message: "先成为自己，再走进关系。", gender: "不愿透露" },
  { id: "Q-127", createdAt: "2026-09-14T09:06:00.000Z", answers: [5,4,4,5,4,5,4,4,2,3,3,3,2,5,2,5,5,5,4,5], label: "访客 127", message: "好的关系需要两个人共同建设。", gender: "不愿透露" },
];

const STORE = "rhine-survey-submissions";
// The public site is hosted on Cloudflare Pages while the anonymous response
// service is reverse-proxied on the survey host.  Keep an environment override
// so a same-origin Function or a local deployment can replace this endpoint.
const surveyApi = (import.meta.env.VITE_SURVEY_API_URL || "https://query.linxiksp.cn/api/survey").replace(/\/$/, "");
const escape = (value: string) => value.replace(/[&<>\"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] ?? char));
const normalizeGender = (value: unknown): SurveyGender => value === "♂" || value === "♀" ? value : "不愿透露";
const normalizeSubmission = (value: unknown): Submission | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const item = value as Partial<Submission>;
  if (typeof item.id !== "string" || typeof item.createdAt !== "string" || typeof item.label !== "string" || typeof item.message !== "string" || !Array.isArray(item.answers) || item.answers.length !== QUESTIONS.length || !item.answers.every(answer => Number.isInteger(answer) && answer >= 1 && answer <= 5)) return undefined;
  return { id: item.id, createdAt: item.createdAt, answers: item.answers as SurveyAnswer[], label: item.label, message: item.message, gender: normalizeGender(item.gender) };
};
const read = (): Submission[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
    const items = Array.isArray(saved) ? saved.flatMap(item => { const normalized = normalizeSubmission(item); return normalized ? [normalized] : []; }) : [];
    return items.length ? items : DEMO;
  } catch { return DEMO; }
};
const write = (items: Submission[]) => { try { localStorage.setItem(STORE, JSON.stringify(items)); } catch {} };
const match = (a: SurveyAnswer[], b: SurveyAnswer[]) => {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;
  return Math.round(100 - a.slice(0, length).reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / (length * 4) * 100);
};

export class SurveyTerminal {
  private root: HTMLElement;
  private answers: Array<SurveyAnswer | undefined> = Array(QUESTIONS.length).fill(undefined);
  private index = 0;
  private submissions = read();
  private current?: Submission;
  private view: "form" | "archive" = "form";
  private stage: "identity" | "questions" | "message" = "identity";
  private remote = false;
  private nickname = "";
  private message = "";
  private gender: SurveyGender = "不愿透露";

  constructor(root: HTMLElement, private onTone: (tone: "tick" | "confirm") => void = () => {}) {
    this.root = root;
    this.current = this.submissions.find(item => item.label !== "访客 104" && item.label !== "访客 118" && item.label !== "访客 127");
    this.root.addEventListener("click", e => this.click(e));
    this.render();
    void this.loadRemote();
  }
  getCurrentProfile(): Submission | undefined { return this.current; }
  getProfiles(): Submission[] { return [...this.submissions]; }
  getProfile(id: string): Submission | undefined { return this.submissions.find(item => item.id === id); }

  show() { this.root.hidden = false; this.root.classList.add("is-visible"); this.render(); }
  hide() { this.root.classList.remove("is-visible"); this.root.hidden = true; }

  private click(event: Event) {
    const el = (event.target as Element).closest<HTMLElement>("[data-survey-action]");
    if (!el) return;
    const action = el.dataset.surveyAction;
    if (action === "start") { this.nickname = (this.root.querySelector<HTMLInputElement>("[data-survey-nickname]")?.value ?? "").trim().slice(0, 24) || `访客·${Math.floor(1000 + Math.random() * 9000)}`; this.gender = (this.root.querySelector<HTMLSelectElement>("[data-survey-gender]")?.value as SurveyGender) || "不愿透露"; this.stage = "questions"; this.view = "form"; this.render(); }
    if (action === "answer") { this.answers[this.index] = Number(el.dataset.value) as SurveyAnswer; this.onTone("tick"); this.render(); }
    if (action === "next" && this.answers[this.index]) { this.index = Math.min(QUESTIONS.length - 1, this.index + 1); this.render(); }
    if (action === "prev") { if (this.stage === "message") this.stage = "questions"; else this.index = Math.max(0, this.index - 1); this.render(); }
    if (action === "message" && this.answers.every(Boolean)) { this.stage = "message"; this.render(); }
    if (action === "submit" && this.answers.every(Boolean)) { this.message = (this.root.querySelector<HTMLTextAreaElement>("[data-survey-message]")?.value ?? "").trim().slice(0, 120); void this.submit(); this.onTone("confirm"); }
    if (action === "archive") { this.view = "archive"; this.render(); }
    if (action === "form") { this.view = "form"; this.render(); }
    if (action === "reset") { this.answers = Array(QUESTIONS.length).fill(undefined); this.index = 0; this.nickname = ""; this.message = ""; this.gender = "不愿透露"; this.current = undefined; this.stage = "identity"; this.view = "form"; this.render(); }
    if (action === "system") this.root.dispatchEvent(new CustomEvent("survey:return-system", { bubbles: true }));
  }

  private async submit() {
    const id = `Q-${Math.floor(100 + Math.random() * 899)}`;
    const label = this.nickname || `访客·${Math.floor(1000 + Math.random() * 9000)}`;
    this.current = { id, createdAt: new Date().toISOString(), answers: this.answers as SurveyAnswer[], label, message: this.message || "愿你在选择中保持诚实，也保留温柔。", gender: this.gender };
    this.submissions = [this.current, ...this.submissions.filter(item => item.id !== id)];
    write(this.submissions);
    try {
      const response = await fetch(surveyApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: this.current.answers, label: this.current.label, message: this.current.message, gender: this.current.gender }),
      });
      if (response.ok) {
        const saved = await response.json() as unknown;
        const normalized = normalizeSubmission(saved);
        if (normalized) {
          this.current = normalized;
          this.submissions = [normalized, ...this.submissions.filter(item => item.id !== normalized.id && item.id !== id)];
          write(this.submissions);
          this.remote = true;
        }
      }
    } catch { /* Keep the local archive when the API is unavailable. */ }
    this.root.dispatchEvent(new CustomEvent("survey:pool-updated", { bubbles: true }));
    this.view = "archive";
    this.render();
  }

  private async loadRemote() {
    try {
      const response = await fetch(surveyApi, { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const payload = await response.json() as unknown;
      const items = Array.isArray(payload) ? payload.flatMap(item => { const normalized = normalizeSubmission(item); return normalized ? [normalized] : []; }) : [];
      this.submissions = items;
      this.current = items.find(item => item.label !== "访客 104" && item.label !== "访客 118" && item.label !== "访客 127") ?? this.current;
      this.remote = true;
      this.root.dispatchEvent(new CustomEvent("survey:pool-updated", { bubbles: true }));
      if (this.view === "archive") this.render();
    } catch { /* Static/PWA deployments can continue with local storage. */ }
  }

  private render() {
    const current = this.current;
    if (!this.nickname && !this.current && this.view === "form" && this.index === 0 && !this.answers.some(Boolean)) {
      this.root.innerHTML = `<div class="survey-shell"><header class="survey-header"><div><span class="survey-kicker">RHINE LAB / QUESTIONNAIRE</span><h1>建立你的观察档案</h1></div></header><main class="question-card survey-intro"><span class="question-note">IDENTITY / NICKNAME</span><h2>先给这份档案一个称呼。</h2><p>可以使用昵称，也可以留空，让终端为你生成一个随机称呼。</p><input data-survey-nickname class="survey-input" maxlength="24" placeholder="例如：晚风、Rin、匿名旅人" autocomplete="nickname"><label class="gender-field"><span>GENDER / 性别</span><select data-survey-gender><option value="不愿透露">不愿透露</option><option value="♂">♂</option><option value="♀">♀</option></select></label><button data-survey-action="start" class="survey-submit">开始问卷 →</button></main></div>`;
      return;
    }
    const progress = Math.round((this.index + 1) / QUESTIONS.length * 100);
    if (this.view === "archive") {
      const others = this.submissions.filter(item => item.id !== current?.id);
      this.root.innerHTML = `<div class="survey-shell archive-shell">
        <header class="survey-header"><div><span class="survey-kicker">ARCHIVE TERMINAL / MATCH INDEX</span><h1>档案已归入终端</h1></div><button data-survey-action="form" class="survey-link">重新填写 ↻</button></header>
        <div class="archive-layout"><section class="identity-card"><span class="card-label">CURRENT PROFILE</span><strong>${escape(current?.label ?? "LOCAL")}</strong><p>${escape(current?.id ?? "LOCAL")} · 你的回答已被编码为匿名档案。</p>${current ? profileRadar(current.answers) : ""}<p class="profile-message">“${escape(current?.message ?? "愿你在选择中保持诚实，也保留温柔。")}"</p></section>
        <section class="match-list"><div class="list-heading"><span>OTHER VISITORS / 其他档案</span><small>${others.length} RECORDS</small></div><p class="profile-message">“${escape(current?.message ?? "愿你在选择中保持诚实，也保留温柔。")}"</p>${others.map(item => `<button class="match-row" data-survey-action="select" data-id="${escape(item.id)}"><span><b>${escape(item.id)}</b><small>${escape(item.label)}</small></span><strong>${current ? match(current.answers, item.answers) : "—"}%<small>MATCH</small></strong></button>`).join("")}</section></div>
        <footer class="survey-footer"><span>LOCAL INDEX · ${new Date().toLocaleDateString("zh-CN")}</span><div class="archive-actions"><button data-survey-action="reset" class="survey-muted">重新填写</button><button data-survey-action="system" class="survey-submit">回到 SYSTEM ↗</button></div></footer></div>`;
      return;
    }
    if (this.stage === "message") {
      this.root.innerHTML = `<div class="survey-shell"><header class="survey-header"><div><span class="survey-kicker">FINAL NOTE / 留言</span><h1>给档案留一句话</h1></div></header><main class="question-card survey-intro"><span class="question-note">MESSAGE / OPTIONAL</span><h2>想对其他人、自己，或婚恋本身说些什么？</h2><textarea data-survey-message class="survey-input survey-textarea" maxlength="120" placeholder="写下你愿意留下的一句话">${this.message}</textarea><p>这句话会和你的匿名档案一起展示。</p></main><footer class="survey-footer"><button data-survey-action="prev" class="survey-muted">← 返回最后一题</button><button data-survey-action="submit" class="survey-submit">封存档案 →</button></footer></div>`;
      return;
    }
    const q = QUESTIONS[this.index];
    const labels = ["完全不同意", "不太同意", "不确定", "比较同意", "非常同意"];
    this.root.innerHTML = `<div class="survey-shell"><header class="survey-header"><div><span class="survey-kicker">RHINE LAB / QUESTIONNAIRE</span><h1>建立你的观察档案</h1></div><button data-survey-action="archive" class="survey-link">档案索引 ↗</button></header>
      <div class="survey-progress"><span>QUESTION ${String(this.index + 1).padStart(2, "0")} / ${String(QUESTIONS.length).padStart(2, "0")}</span><i><b style="width:${progress}%"></b></i><span>${progress}%</span></div>
      <main class="question-card"><span class="question-note">${q.note}</span><h2>${q.text}</h2><div class="answer-grid">${labels.map((label, i) => `<button data-survey-action="answer" data-value="${i + 1}" class="answer ${this.answers[this.index] === i + 1 ? "selected" : ""}"><span>${String(i + 1).padStart(2, "0")}</span>${label}</button>`).join("")}</div></main>
      <footer class="survey-footer"><button data-survey-action="prev" class="survey-muted" ${this.index === 0 ? "disabled" : ""}>← 上一题</button>${this.index === QUESTIONS.length - 1 ? `<button data-survey-action="message" class="survey-submit" ${this.answers.every(Boolean) ? "" : "disabled"}>继续留言 →</button>` : `<button data-survey-action="next" class="survey-submit" ${this.answers[this.index] ? "" : "disabled"}>下一题 →</button>`}</footer></div>`;
  }
}
