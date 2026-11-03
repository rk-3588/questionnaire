import { writeFile } from "node:fs/promises";
import { QUESTIONS, QUESTIONNAIRE_VERSION } from "../src/questionnaire.ts";

const lines = [
  "# 大学生婚恋意愿调查问卷修订稿",
  "",
  `版本：${QUESTIONNAIRE_VERSION}（schemaVersion: 2）`,
  "",
  "调查对象为目前在高校就读的学生，包括专科、本科、硕士和博士，不以未婚为限。共 4 道基本情况、20 道主体题、2 道选答；实际题数按适用范围变化。",
  "",
  "## 卷首说明",
  "",
  "本问卷记录你现阶段的婚恋想法、经历和支持需求，回答用于本项目的婚恋意愿调查。参与自愿；可选择不愿回答，选答题可以跳过。昵称可留空，不收集姓名、学号或联系方式。请勿在补充文字中填写自己或他人的身份信息。",
  "",
  "服务端保存匿名档案编号、提交时间、昵称与逐题回答。个人档案默认不公开；提交前可自愿勾选公开昵称和选择题回答（包含基本情况）。所有“其他”补充说明与 S2 开放回答均不公开。未公开的回答仅保存在调查数据及填答者自己的浏览器副本中。",
  "",
  "本问卷不计算总分、六维评分或匹配百分比。各题选择不代表成熟程度或正确答案。",
  "",
  "开始前确认：我目前是高校在读学生，已了解上述用途，自愿参与。",
  "",
];
let section = "";
for (const question of QUESTIONS) {
  if (question.section !== section) {
    section = question.section;
    lines.push(`## ${section}`, "");
  }
  lines.push(`### ${question.id} ${question.title}`, "");
  lines.push(
    `题型：${question.kind === "multiple" ? "多选" : question.kind === "text" ? "开放题" : "单选"}${question.optional ? "，选答、允许跳过" : ""}${question.maxChoices ? `，最多选 ${question.maxChoices} 项、不分先后` : ""}${question.maxLength ? `，最多 ${question.maxLength} 字` : ""}。`,
    "",
  );
  if (question.help) lines.push(question.help, "");
  if (question.options) {
    for (let index = 0; index < question.options.length; index++)
      lines.push(
        `- ${String.fromCharCode(65 + index)}. ${question.options[index].label}`,
      );
    lines.push("");
    const exclusive = question.options.filter((option) => option.exclusive);
    if (question.kind === "multiple" && exclusive.length)
      lines.push(
        `互斥规则：${exclusive.map((option) => `“${option.label}”`).join("、")}均须单独选择。`,
        "",
      );
  }
}
lines.push(
  "## 跳题与记录规则",
  "",
  "- B2 选择目前不在高校就读：不能继续提交；允许返回修改或退出。",
  "- B4 选择已婚：Q2、Q4、Q6、Q7、Q8、Q9、Q10、Q15、Q16、Q18 自动记录为已婚不适用。其他情景题仍按假设作答。",
  "- B3 选择有稳定伴侣且尚未因已婚跳题：Q4 自动记录为已有伴侣不适用。",
  "- Q3、Q15 不能因为当前单身而跳过，仍需依据过去三个月的经历作答；已婚分支的 Q15 例外。",
  "- 修改前面的基本情况后重新计算适用范围，失效的自动跳题状态会清除；需要回答的题目重新作答。",
  "- Q7 的必须自有住房与租房可接受互斥。多选题的无特别因素、没有需求、说不清、不适用、不愿回答等排他选项均单独选择。",
  "- 跳过、不适用、未想清楚、不愿回答与实质回答分别存储，不映射为 0 分或中间分。",
  "- Q10、Q18 描述自我报告的影响或假设变化，不作为已识别的因果效应。",
  "- 旧版二十题按 schemaVersion: 1 保留原题和原始回答，不与新版拼接为同一份量表。",
  "",
  "本文件由 `npm run export:questionnaire` 根据 `src/questionnaire.ts` 导出，与网页及服务端共用同一份题目定义。",
  "",
);
await writeFile(
  new URL("../docs/大学生婚恋意愿调查问卷_修订建议稿.md", import.meta.url),
  lines.join("\n"),
);
console.log(
  `Exported questionnaire ${QUESTIONNAIRE_VERSION}: ${QUESTIONS.length} questions.`,
);
