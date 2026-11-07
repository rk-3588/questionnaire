// Isolated test data only. These records are never installed on the live server.
import { randomUUID } from "node:crypto";
import {
  SCHEMA_VERSION,
  SURVEY_VERSION,
  getPath,
  resolveQuestion,
  validateSubmission,
} from "../public/survey-core.mjs";

export function fixture(options = {}) {
  const values = {
    D01: "female",
    D02: "undergrad",
    D03: "never",
    D04: "never",
    C01: "yes",
    U01: "yes",
    U02: "no_timeline",
    R01: "yes",
    F02: ["relationship", "practical"],
    H01: ["meet", "communication"],
    ...options.answers,
  };
  const answers = {};
  for (const [id, value] of Object.entries(values)) {
    if (value !== undefined)
      answers[id] =
        typeof value === "object" && !Array.isArray(value)
          ? value
          : { values: Array.isArray(value) ? value : [value] };
  }
  const path = getPath(answers),
    skipped = options.skipped || [],
    neutralQuestions = options.neutralQuestions || [];
  for (const id of Object.keys(answers))
    if (!path.includes(id) || skipped.includes(id)) delete answers[id];
  if (options.complete)
    for (const id of path) {
      if (answers[id] || skipped.includes(id)) continue;
      const question = resolveQuestion(id, answers, neutralQuestions);
      if (question.type !== "text")
        answers[id] = { values: [question.options[0].value] };
    }
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    surveyVersion: SURVEY_VERSION,
    submissionId: randomUUID(),
    consent: true,
    answers,
    skipped,
    neutralQuestions,
    durationSeconds: options.durationSeconds ?? 180,
  };
  const result = validateSubmission(payload);
  if (!result.ok) throw Error("Invalid fixture: " + result.errors.join(", "));
  return {
    payload,
    row: {
      ...result.data,
      receipt: "S-" + randomUUID(),
      createdAt: options.createdAt || "2026-11-06T04:00:00.000Z",
      payloadHash: "private-hash",
    },
  };
}

export function browserFixtures() {
  const rows = [];
  for (let index = 0; index < 32; index++)
    rows.push(
      fixture({
        complete: true,
        createdAt: `2026-11-${String((index % 7) + 1).padStart(2, "0")}T04:00:00.000Z`,
        durationSeconds: 120 + index * 10,
        answers: {
          D01: index % 3 === 0 ? "male" : index % 3 === 1 ? "female" : "other",
          D02: index === 31 ? "declined" : index % 2 ? "graduate" : "undergrad",
          D03: index % 4 === 0 ? "partner" : "never",
          D04:
            index % 8 === 0
              ? "married"
              : index % 7 === 0
                ? "declined"
                : "never",
          U01: index % 2 ? "unsure" : "yes",
          R01: index % 2 ? "no" : "yes",
          O01:
            index === 31
              ? {
                  values: ["write"],
                  text: '<img src=x onerror="window.__xss=1"> =SUM(A1)',
                }
              : undefined,
        },
      }).row,
    );
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
