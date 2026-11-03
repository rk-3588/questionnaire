import { escapeHtml } from "./html.ts";
import {
  QUESTIONS,
  LEGACY_LABELS,
  LEGACY_QUESTIONS,
  responseLabel,
  type Submission,
} from "./questionnaire.ts";

export function profileSummaryMarkup(profile: Submission): string {
  const entries =
    profile.schemaVersion === 2
      ? ["Q1", "Q2", "Q4", "Q8"].map((id) => {
          const question = QUESTIONS.find((item) => item.id === id)!;
          return {
            title: (
              {
                Q1: "关系意愿",
                Q2: "结婚意愿",
                Q4: "近期恋爱计划",
                Q8: "婚期安排",
              } as Record<string, string>
            )[id],
            value: responseLabel(question, profile.responses[id]),
          };
        })
      : [
          { title: "问卷版本", value: "旧版 20 题量表" },
          {
            title: "恋爱意愿（原题）",
            value: LEGACY_LABELS[profile.answers[0] - 1],
          },
          {
            title: "结婚意愿（原题）",
            value: LEGACY_LABELS[profile.answers[3] - 1],
          },
        ];
  return `<dl class="survey-summary">${entries.map((entry) => `<div><dt>${escapeHtml(entry.title)}</dt><dd>${escapeHtml(entry.value)}</dd></div>`).join("")}</dl>`;
}

export function profileResponsesMarkup(profile: Submission): string {
  if (profile.schemaVersion === 1)
    return `<p class="survey-help">这是旧版问卷，保留原题与原始回答，不与新版计算总分或匹配度。</p><dl class="survey-responses">${LEGACY_QUESTIONS.map((question, index) => `<div><dt><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(question)}</dt><dd>${LEGACY_LABELS[profile.answers[index] - 1]}</dd></div>`).join("")}</dl>`;
  return [...new Set(QUESTIONS.map((question) => question.section))]
    .map(
      (section) =>
        `<details class="survey-response-section" ${section === "基本情况" ? "open" : ""}><summary>${escapeHtml(section)}</summary><dl class="survey-responses">${QUESTIONS.filter(
          (question) => question.section === section,
        )
          .map(
            (question) =>
              `<div><dt><span>${question.id}</span>${escapeHtml(question.title)}</dt><dd>${escapeHtml(responseLabel(question, profile.responses[question.id]))}</dd></div>`,
          )
          .join("")}</dl></details>`,
    )
    .join("");
}
