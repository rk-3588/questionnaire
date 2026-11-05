import { escapeHtml as escape } from "./html";
import {
  QUESTIONS,
  QUESTIONNAIRE_VERSION,
  applyRouting,
  currentRecord,
  normalizeSubmission,
  optionResponse,
  responseError,
  selectedValues,
  validateResponses,
  visibleQuestions,
  type CurrentInput,
  type CurrentSubmission,
  type Question,
  type Responses,
  type Submission,
} from "./questionnaire";
import { profileResponsesMarkup, profileSummaryMarkup } from "./survey-view";
export type { Submission } from "./questionnaire";

const API = (
  import.meta.env.VITE_SURVEY_API_URL || "https://query.linxiksp.cn/api/survey"
).replace(/\/$/, "");
const STORE = "rhine-survey-v2-records";
const DRAFT = "rhine-survey-v2-draft";
const readJSON = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
};
const saveJSON = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const normalizeList = (value: unknown): Submission[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const record = normalizeSubmission(item);
        return record ? [record] : [];
      })
    : [];
const uuid = () => `Q-${crypto.randomUUID()}`;

export function downloadSubmission(profile: Submission) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `questionnaire-${profile.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export class SurveyTerminal {
  private responses: Responses = {};
  private index = 0;
  private view: "intro" | "form" | "review" | "archive" | "profile" = "intro";
  private publicProfiles: Submission[] = [];
  private ownProfiles: Submission[] = [];
  private currentId = "";
  private viewedId = "";
  private unsynced = new Set<string>();
  private nickname = "";
  private publish = false;
  private eligible = false;
  private submitting = false;
  private remoteState: "loading" | "connected" | "offline" = "loading";
  private notice = "";

  constructor(
    private root: HTMLElement,
    private onTone: (tone: "tick" | "confirm") => void = () => {},
  ) {
    const stored = readJSON(STORE);
    if (object(stored)) {
      this.ownProfiles = normalizeList(stored.own);
      this.publicProfiles = normalizeList(stored.public);
      this.currentId =
        typeof stored.currentId === "string" ? stored.currentId : "";
      this.unsynced = new Set(
        Array.isArray(stored.unsynced)
          ? stored.unsynced.filter((id): id is string => typeof id === "string")
          : [],
      );
    } else {
      // Historical public cache is readable, but its first visitor is never
      // inferred to be this browser's owner.
      this.publicProfiles = normalizeList(readJSON("rhine-survey-submissions"));
    }
    const draft = readJSON(DRAFT);
    if (object(draft) && draft.version === QUESTIONNAIRE_VERSION) {
      this.nickname =
        typeof draft.nickname === "string" ? draft.nickname.slice(0, 24) : "";
      this.publish = draft.publish === true;
      this.eligible = draft.eligible === true;
      if (object(draft.responses)) {
        for (const question of QUESTIONS) {
          const response = draft.responses[question.id];
          if (object(response) && !responseError(question, response as never))
            this.responses[question.id] = response as never;
        }
        this.responses = applyRouting(this.responses);
      }
      this.index =
        typeof draft.index === "number"
          ? Math.max(
              0,
              Math.min(
                visibleQuestions(this.responses).length - 1,
                draft.index,
              ),
            )
          : 0;
    }
    this.root.addEventListener("click", (event) => this.click(event));
    this.root.addEventListener("change", (event) => this.change(event));
    this.root.addEventListener("input", (event) => this.input(event));
    this.root.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (
        event.key !== "Tab" ||
        this.root.getAttribute("aria-modal") !== "true"
      )
        return;
      const focusable = [
        ...this.root.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),summary",
        ),
      ].filter((element) => element.getClientRects().length);
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
    this.render();
    void this.loadRemote();
  }

  getCurrentProfile(): Submission | undefined {
    return this.ownProfiles.find((profile) => profile.id === this.currentId);
  }
  getProfiles(): Submission[] {
    const pool = new Map(
      this.publicProfiles.map((profile) => [profile.id, profile]),
    );
    // This browser may inspect its own unpublished submissions without making
    // them public or replacing another visitor's identity.
    for (const profile of this.ownProfiles) pool.set(profile.id, profile);
    return [...pool.values()].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  }
  getProfile(id: string): Submission | undefined {
    return this.getProfiles().find((profile) => profile.id === id);
  }
  hasDraft(): boolean {
    return Object.keys(this.responses).length > 0;
  }
  getConnectionState() {
    return this.remoteState;
  }
  show(view?: "intro" | "archive" | "resume") {
    if (view)
      this.view =
        view === "resume"
          ? this.eligible && this.hasDraft()
            ? "form"
            : "intro"
          : view;
    this.root.hidden = false;
    this.root.inert = false;
    this.root.parentElement?.classList.add("survey-active");
    this.root.classList.add("is-visible");
    this.render();
    this.focusHeading();
  }
  hide() {
    this.root.classList.remove("is-visible");
    this.root.parentElement?.classList.remove("survey-active");
    this.root.hidden = true;
    this.root.inert = true;
  }

  private persist() {
    if (
      !saveJSON(STORE, {
        own: this.ownProfiles,
        public: this.publicProfiles,
        currentId: this.currentId,
        unsynced: [...this.unsynced],
      })
    )
      this.notice = "浏览器存储空间不足，请导出自己的回答以保留副本。";
  }
  private saveDraft() {
    saveJSON(DRAFT, {
      version: QUESTIONNAIRE_VERSION,
      responses: this.responses,
      nickname: this.nickname,
      publish: this.publish,
      eligible: this.eligible,
      index: this.index,
    });
    this.root.dispatchEvent(
      new CustomEvent("survey:draft-updated", { bubbles: true }),
    );
  }
  private focusHeading() {
    requestAnimationFrame(() => {
      if (this.root.classList.contains("survey-embedded"))
        this.root.scrollIntoView({ block: "start", behavior: "instant" });
      this.root
        .querySelector<HTMLElement>("h1")
        ?.focus({ preventScroll: true });
    });
  }
  private changed() {
    this.root.dispatchEvent(
      new CustomEvent("survey:pool-updated", { bubbles: true }),
    );
  }
  private header(title: string) {
    return `<header class="survey-header"><div><span class="survey-kicker">大学生婚恋调查 · 问卷版本 ${QUESTIONNAIRE_VERSION}</span><h1 tabindex="-1">${title}</h1></div><button data-survey-action="archive" class="survey-link">提交与公开记录 ↗</button></header>`;
  }
  private status() {
    return `<p class="survey-status" role="status">${escape(this.notice || this.connectionMessage())}</p>`;
  }
  private connectionMessage() {
    return this.remoteState === "connected"
      ? "已连接问卷服务"
      : this.remoteState === "loading"
        ? "正在连接问卷服务"
        : "服务暂不可用，可继续本地填写";
  }

  private input(event: Event) {
    const field = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (field.dataset.surveyField === "nickname")
      this.nickname = field.value.slice(0, 24);
    if (field.dataset.surveyField === "text")
      this.responses.S2 = field.value.trim()
        ? { status: "answered", value: field.value.slice(0, 200) }
        : { status: "skipped" };
    if (field.dataset.surveyField === "other") {
      const question = visibleQuestions(this.responses)[this.index];
      const current = this.responses[question.id];
      if (current)
        this.responses[question.id] = {
          ...current,
          other: field.value.slice(0, 120),
        };
    }
    this.saveDraft();
    const count = this.root.querySelector("[data-text-count]");
    if (count && field.dataset.surveyField === "text")
      count.textContent = `${field.value.length} / 200`;
  }
  private change(event: Event) {
    const field = event.target as HTMLInputElement;
    if (field.dataset.surveyField === "eligible") this.eligible = field.checked;
    if (field.dataset.surveyField === "publish") this.publish = field.checked;
    if (field.dataset.responseValue) {
      const question = visibleQuestions(this.responses)[this.index];
      const previous = this.responses[question.id];
      let values = selectedValues(previous);
      const chosen = question.options!.find(
        (option) => option.value === field.dataset.responseValue,
      )!;
      if (question.kind === "single") values = [chosen.value];
      else if (!field.checked)
        values = values.filter((value) => value !== chosen.value);
      else if (chosen.exclusive) values = [chosen.value];
      else {
        values = values.filter(
          (value) =>
            !question.options!.find((option) => option.value === value)
              ?.exclusive,
        );
        if (
          question.incompatible?.some((group) => group.includes(chosen.value))
        )
          values = values.filter(
            (value) =>
              !question.incompatible!.some(
                (group) =>
                  group.includes(chosen.value) && group.includes(value),
              ),
          );
        values = [...values, chosen.value];
      }
      const next = values.length
        ? optionResponse(question, values, previous?.other)
        : undefined;
      const error = next && responseError(question, next);
      if (error) this.notice = error;
      else {
        if (next) this.responses[question.id] = next;
        else delete this.responses[question.id];
        this.responses = applyRouting(this.responses);
        this.notice = "";
        this.onTone("tick");
      }
      this.saveDraft();
      const top = this.root.scrollTop;
      this.render();
      this.root.scrollTop = top;
      this.root
        .querySelector<HTMLInputElement>(
          `[data-response-value="${chosen.value}"]`,
        )
        ?.focus({ preventScroll: true });
      return;
    }
    this.saveDraft();
    const start = this.root.querySelector<HTMLButtonElement>(
      '[data-survey-action="start"]',
    );
    if (start) start.disabled = !this.eligible;
  }
  private click(event: Event) {
    const button = (event.target as Element).closest<HTMLElement>(
      "[data-survey-action]",
    );
    if (!button || this.submitting) return;
    const action = button.dataset.surveyAction;
    this.notice = "";
    if (action === "start" && this.eligible) {
      this.view = "form";
      this.render();
      this.focusHeading();
    } else if (action === "next" || action === "skip")
      this.next(action === "skip");
    else if (action === "prev") {
      if (this.view === "review") {
        this.view = "form";
        this.index = visibleQuestions(this.responses).length - 1;
      } else if (this.index > 0) this.index--;
      else this.view = "intro";
      this.saveDraft();
      this.render();
      this.focusHeading();
    } else if (action === "archive") {
      this.view = "archive";
      this.render();
      this.focusHeading();
    } else if (action === "resume") {
      this.view =
        this.eligible && Object.keys(this.responses).length ? "form" : "intro";
      this.render();
      this.focusHeading();
    } else if (action === "reset") {
      this.responses = {};
      this.index = 0;
      this.publish = false;
      this.eligible = false;
      this.view = "intro";
      this.saveDraft();
      this.render();
      this.focusHeading();
    } else if (action === "select") {
      this.viewedId = button.dataset.id ?? "";
      this.view = "profile";
      this.render();
      this.focusHeading();
    } else if (action === "download") {
      const profile = this.getProfile(button.dataset.id ?? this.currentId);
      if (profile && this.ownProfiles.some((item) => item.id === profile.id))
        downloadSubmission(profile);
    } else if (action === "refresh") {
      void this.loadRemote();
    } else if (action === "submit") {
      void this.submit();
    } else if (action === "retry") {
      const profile = this.getCurrentProfile();
      if (profile?.schemaVersion === 2) void this.sync(profile);
    } else if (action === "system")
      this.root.dispatchEvent(
        new CustomEvent("survey:return-system", { bubbles: true }),
      );
  }
  private next(skip: boolean) {
    const questions = visibleQuestions(this.responses);
    const question = questions[this.index];
    if (skip && question.optional)
      this.responses[question.id] = { status: "skipped" };
    const error = responseError(question, this.responses[question.id]);
    if (error) {
      this.notice = error;
      this.render();
      return;
    }
    if (
      question.id === "B2" &&
      selectedValues(this.responses.B2).includes("not_enrolled")
    ) {
      this.notice = "本调查仅面向目前在高校就读的学生，可修改选择或返回首页。";
      this.render();
      return;
    }
    if (question.optional && !this.responses[question.id])
      this.responses[question.id] = { status: "skipped" };
    if (this.index === questions.length - 1) this.view = "review";
    else this.index++;
    this.saveDraft();
    this.render();
    this.root.scrollTop = 0;
    this.focusHeading();
  }
  private async submit() {
    if (!this.eligible) {
      this.notice = "请先确认你目前在高校就读，并了解本次调查的用途。";
      this.view = "intro";
      this.render();
      return;
    }
    this.responses = applyRouting(this.responses);
    const { responses, errors } = validateResponses(this.responses);
    if (!responses) {
      this.notice = Object.values(errors)[0];
      this.view = "form";
      this.index = Math.max(
        0,
        visibleQuestions(this.responses).findIndex(
          (question) => errors[question.id],
        ),
      );
      this.render();
      return;
    }
    const input: CurrentInput = {
      schemaVersion: 2,
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      label: this.nickname || `访客·${Math.floor(1000 + Math.random() * 9000)}`,
      responses,
      publication: { profile: this.publish },
    };
    const local = currentRecord(input, uuid(), new Date().toISOString());
    this.ownProfiles.unshift(local);
    this.currentId = local.id;
    this.unsynced.add(local.id);
    this.persist();
    this.changed();
    try {
      localStorage.removeItem(DRAFT);
    } catch {
      /* Export remains available. */
    }
    this.responses = {};
    this.index = 0;
    this.publish = false;
    this.root.dispatchEvent(
      new CustomEvent("survey:draft-updated", { bubbles: true }),
    );
    this.view = "archive";
    this.onTone("confirm");
    await this.sync(local);
  }
  private async sync(local: CurrentSubmission) {
    this.submitting = true;
    this.notice = "正在提交，浏览器中已保留副本。";
    this.render();
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
        signal: AbortSignal.timeout(15000),
      });
      const payload: unknown = await response.json();
      if (!response.ok)
        throw Error(
          response.status === 400
            ? "当前服务暂不支持这份问卷或回答格式，请更新服务后重试。"
            : "问卷服务暂不可用，请稍后重试。",
        );
      const saved = normalizeSubmission(payload);
      if (!saved || saved.schemaVersion !== 2)
        throw Error("服务返回格式不匹配，回答仍仅保存在本机。");
      this.ownProfiles = [
        saved,
        ...this.ownProfiles.filter(
          (profile) => profile.id !== local.id && profile.id !== saved.id,
        ),
      ];
      this.currentId = saved.id;
      this.unsynced.delete(local.id);
      this.remoteState = "connected";
      this.notice = saved.publication.profile
        ? "提交成功，选择题档案已公开；补充文字不公开。"
        : "提交成功，档案未公开，仅在本机展示自己的回答。";
      this.changed();
    } catch (error) {
      const message =
        error instanceof TypeError ||
        (error instanceof DOMException &&
          ["TimeoutError", "AbortError"].includes(error.name))
          ? "未能及时连接问卷服务。"
          : error instanceof Error
            ? error.message
            : "未能连接服务。";
      this.notice = `${message} 本机副本已保留，可重试或导出。`;
    } finally {
      this.submitting = false;
      this.persist();
      this.render();
      this.focusHeading();
    }
  }
  private async loadRemote() {
    this.remoteState = "loading";
    this.root.dispatchEvent(
      new CustomEvent("survey:connection-updated", { bubbles: true }),
    );
    try {
      const response = await fetch(API, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });
      if (!response.ok) throw Error("unavailable");
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw Error("invalid_response");
      const profiles = normalizeList(payload);
      if (payload.length && !profiles.length)
        throw Error("unsupported_records");
      this.publicProfiles = profiles;
      this.remoteState = "connected";
      this.persist();
      this.changed();
    } catch {
      this.remoteState = "offline";
    }
    this.root.dispatchEvent(
      new CustomEvent("survey:connection-updated", { bubbles: true }),
    );
    const status = this.root.querySelector(".survey-status");
    if (status && !this.notice) status.textContent = this.connectionMessage();
    if (this.view === "archive" || this.view === "profile") this.render();
  }
  private render() {
    this.root.setAttribute("aria-busy", String(this.submitting));
    this.root.dataset.view = this.view;
    this.root.dispatchEvent(
      new CustomEvent("survey:view-updated", {
        bubbles: true,
        detail: this.view,
      }),
    );
    if (this.view === "archive" || this.view === "profile") {
      this.renderArchive();
      return;
    }
    if (this.view === "intro") {
      this.root.innerHTML = `<div class="survey-shell">${this.header("大学生婚恋意愿调查")}<main class="question-card survey-intro"><span class="question-note">填写说明 · 自愿参与</span><h2>记录你现阶段的想法。</h2><p>面向高校在读学生，包含专科、本科、硕士和博士。问卷有 4 道基本情况、20 道主体题和 2 道选答；会按婚姻与伴侣状态自动跳题。你可以选择“不愿回答”，也可以暂停后继续。</p><p>回答用于本项目婚恋意愿调查，服务端保存匿名编号、提交时间、昵称和回答。不要求姓名、学号或联系方式。默认不公开个人回答；只有主动勾选公开时，昵称与选择题回答（含基本情况）才会出现在公开记录。“其他”补充文字与最后的开放回答始终不公开。</p><label class="survey-field">填写昵称（可留空）<input data-survey-field="nickname" class="survey-input" maxlength="24" value="${escape(this.nickname)}" autocomplete="off" placeholder="留空会生成访客名称"></label><label class="survey-check"><input type="checkbox" data-survey-field="eligible" ${this.eligible ? "checked" : ""}><span>我目前是高校在读学生，已了解上述用途，自愿参与。</span></label></main>${this.status()}<footer class="survey-footer"><button data-survey-action="system" class="survey-muted">← 返回首页</button><button data-survey-action="start" class="survey-submit" ${this.eligible ? "" : "disabled"}>${Object.keys(this.responses).length ? "继续填写" : "开始问卷"} →</button></footer></div>`;
      return;
    }
    if (this.view === "review") {
      const preview = currentRecord(
        {
          schemaVersion: 2,
          questionnaireVersion: QUESTIONNAIRE_VERSION,
          label: this.nickname || "匿名访客",
          responses: this.responses,
          publication: { profile: this.publish },
        },
        "预览",
        new Date().toISOString(),
      );
      this.root.innerHTML = `<div class="survey-shell">${this.header("确认你的回答")}<p class="survey-help">请展开各部分核对。需要调整时，可返回逐题修改。</p><div class="survey-review">${profileResponsesMarkup(preview)}</div><label class="survey-check"><input type="checkbox" data-survey-field="publish" ${this.publish ? "checked" : ""}><span>我愿意公开这份匿名档案的昵称与选择题回答（含基本情况）。所有补充文字仍不公开。<small>不勾选也可正常提交。</small></span></label>${this.status()}<footer class="survey-footer"><button data-survey-action="prev" class="survey-muted">← 返回修改</button><button data-survey-action="submit" class="survey-submit">提交问卷 →</button></footer></div>`;
      return;
    }
    const questions = visibleQuestions(this.responses);
    const question = questions[this.index];
    const response = this.responses[question.id];
    const values = selectedValues(response);
    const progress = Math.round((this.index / questions.length) * 100);
    const controls =
      question.kind === "text"
        ? `<label class="survey-field" for="survey-text">你的回答（选填）</label><textarea id="survey-text" data-survey-field="text" class="survey-input survey-textarea" maxlength="200">${escape(typeof response?.value === "string" ? response.value : "")}</textarea><small data-text-count>${typeof response?.value === "string" ? response.value.length : 0} / 200</small>`
        : `<div class="answer-grid" role="group" aria-labelledby="question-title">${question.options!.map((option, index) => `<label class="answer ${values.includes(option.value) ? "selected" : ""}"><input type="${question.kind === "multiple" ? "checkbox" : "radio"}" name="${question.id}" data-response-value="${option.value}" ${values.includes(option.value) ? "checked" : ""}><span class="answer-code">${String(index + 1).padStart(2, "0")}</span><span>${escape(option.label)}</span></label>`).join("")}</div>${values.includes("other") ? `<label class="survey-field">补充说明（选填，不公开）<input class="survey-input" data-survey-field="other" maxlength="120" value="${escape(response?.other ?? "")}"></label>` : ""}`;
    this.root.innerHTML = `<div class="survey-shell">${this.header(question.section)}<div class="survey-progress"><span>${question.id} · ${this.index + 1} / ${questions.length}${question.optional ? " · 选答" : ""}</span><i><b style="width:${progress}%"></b></i><span>${progress}%</span></div><main class="question-card"><span class="question-note">${question.kind === "multiple" ? (question.maxChoices ? `多选 · 最多 ${question.maxChoices} 项` : "多选 · 可选所有符合项") : question.kind === "text" ? "开放回答 · 不公开" : "单选"}</span><h2 id="question-title">${escape(question.title)}</h2>${question.help ? `<p class="survey-help">${escape(question.help)}</p>` : ""}${controls}</main>${this.status()}<footer class="survey-footer"><button data-survey-action="prev" class="survey-muted">← ${this.index ? "上一题" : "填写说明"}</button><div class="archive-actions">${question.optional ? '<button data-survey-action="skip" class="survey-muted">跳过此题</button>' : ""}<button data-survey-action="next" class="survey-submit">${this.index === questions.length - 1 ? "核对回答" : "下一题"} →</button></div></footer></div>`;
  }
  private renderArchive() {
    const current = this.getCurrentProfile();
    if (this.view === "profile") {
      const profile = this.getProfile(this.viewedId);
      if (profile) {
        const own = this.ownProfiles.some((item) => item.id === profile.id);
        this.root.innerHTML = `<div class="survey-shell">${this.header(escape(profile.label))}<p class="survey-help">${escape(profile.id)} · ${profile.schemaVersion === 2 ? "新版分项回答" : "旧版历史回答"}${own ? " · 我的提交" : " · 自愿公开的记录"}</p>${profileSummaryMarkup(profile)}${profileResponsesMarkup(profile)}<footer class="survey-footer"><button data-survey-action="archive" class="survey-muted">← 返回记录列表</button>${own ? `<button data-survey-action="download" data-id="${escape(profile.id)}" class="survey-submit">导出我的回答 ↓</button>` : ""}</footer></div>`;
        return;
      }
      this.view = "archive";
    }
    const others = this.getProfiles().filter(
      (profile) => profile.id !== current?.id,
    );
    this.root.innerHTML = `<div class="survey-shell archive-shell">${this.header("提交与公开记录")}<div class="archive-layout"><section class="identity-card"><span class="card-label">我的提交</span><h2>${escape(current?.label ?? "尚未提交")}</h2>${current ? `<p>${escape(current.id)}</p><p>${this.unsynced.has(current.id) ? "仅保存在本机，尚未提交到服务器。" : current.schemaVersion === 2 && !current.publication.profile ? "已提交，未公开个人回答。" : "已提交，可查看原始回答。"}</p>${profileSummaryMarkup(current)}<div class="archive-actions"><button data-survey-action="select" data-id="${escape(current.id)}" class="survey-link">查看回答 ↗</button><button data-survey-action="download" class="survey-link">导出 ↓</button>${this.unsynced.has(current.id) ? '<button data-survey-action="retry" class="survey-link">重试提交 ↻</button>' : ""}</div>` : "<p>填写并提交后，可在这里查看自己的回答。仅能在保留本机副本的浏览器中找回。</p>"}<button data-survey-action="resume" class="survey-submit">${this.hasDraft() ? "继续填写" : "填写问卷"} →</button>${this.hasDraft() ? '<button data-survey-action="reset" class="survey-muted">放弃草稿，重新填写</button>' : ""}</section><section class="survey-profile-list"><div class="list-heading"><span>可浏览的回答</span><small>${others.length} 份记录</small><button data-survey-action="refresh" class="survey-link">刷新 ↻</button></div><p class="survey-help">包含受访者自愿公开的回答与本机自己的其他提交。不同版本分别标注，点击可查看逐题回答。</p>${others.length ? others.map((profile) => `<button class="survey-profile-row" data-survey-action="select" data-id="${escape(profile.id)}"><span><b>${escape(profile.label)}</b><small>${escape(profile.id)}${this.ownProfiles.some((item) => item.id === profile.id) ? " · 我的提交" : " · 公开记录"}</small></span><span>${profile.schemaVersion === 2 ? "新版" : "旧版"} ↗</span></button>`).join("") : '<p class="survey-help">目前没有可浏览的记录。你可以先填写问卷，个人回答默认不公开。</p>'}</section></div>${this.status()}<footer class="survey-footer"><span>${this.submitting ? "正在提交…" : "按题保留原始回答"}</span><button data-survey-action="system" class="survey-muted" ${this.submitting ? "disabled" : ""}>← 返回首页</button></footer></div>`;
  }
}
