/** Shared by the browser, Node service and Pages Function. No browser APIs. */
export const QUESTIONNAIRE_VERSION = "2026-11-03";
export const RESPONSE_STATUSES = [
  "answered",
  "skipped",
  "not_applicable",
  "unsure",
  "declined",
] as const;
export type ResponseStatus = (typeof RESPONSE_STATUSES)[number];
export type QuestionResponse = {
  status: ResponseStatus;
  value?: string | string[];
  other?: string;
  reason?: string;
};
export type Responses = Record<string, QuestionResponse>;
export type Option = {
  value: string;
  label: string;
  status?: ResponseStatus;
  exclusive?: boolean;
  other?: boolean;
};
export type Question = {
  id: string;
  section: string;
  title: string;
  help?: string;
  kind: "single" | "multiple" | "text";
  options?: Option[];
  optional?: boolean;
  maxChoices?: number;
  maxLength?: number;
  incompatible?: string[][];
};
const choices = (items: [string, string][]): Option[] =>
  items.map(([value, label]) => ({ value, label }));
const unsure = (label = "目前还没想清楚"): Option => ({
  value: "unsure",
  label,
  status: "unsure",
  exclusive: true,
});
const declined: Option = {
  value: "declined",
  label: "不愿回答",
  status: "declined",
  exclusive: true,
};
const other: Option = {
  value: "other",
  label: "其他（可补充说明）",
  other: true,
};
const na = (value: string, label: string): Option => ({
  value,
  label,
  status: "not_applicable",
  exclusive: true,
});
const neutralAttitude = (): Option[] => [
  ...choices([
    ["very_unwilling", "非常不愿意"],
    ["unwilling", "比较不愿意"],
    ["neutral", "既不向往，也不排斥"],
    ["willing", "比较愿意"],
    ["very_willing", "非常愿意"],
  ]),
  unsure(),
  declined,
];
const none = (label: string): Option => ({
  value: "none",
  label,
  exclusive: true,
});
const scenarioHelp =
  "以下为假设情景，不要求与你的实际经历一致。请选择最接近现阶段想法的一项；难以代入时可以选择“目前还无法判断”。";

export const QUESTIONS: Question[] = [
  {
    id: "B1",
    section: "基本情况",
    title: "你如何描述自己的性别？",
    kind: "single",
    optional: true,
    options: [
      ...choices([
        ["male", "男"],
        ["female", "女"],
        ["another", "其他性别认同"],
      ]),
      { ...declined, label: "不愿透露" },
    ],
  },
  {
    id: "B2",
    section: "基本情况",
    title: "你目前处于哪个学习阶段？",
    kind: "single",
    help: "本调查面向目前在高校就读的学生，包括专科、本科、硕士和博士研究生。",
    options: choices([
      ["college_1", "专科一年级"],
      ["college_2", "专科二年级"],
      ["college_3", "专科三年级及以上"],
      ["undergrad_1", "本科一年级"],
      ["undergrad_2", "本科二年级"],
      ["undergrad_3", "本科三年级"],
      ["undergrad_4", "本科四年级及以上"],
      ["masters", "硕士研究生"],
      ["doctorate", "博士研究生"],
      ["other_enrolled", "其他高校在读阶段"],
      ["not_enrolled", "目前不在高校就读"],
    ]).concat(declined),
  },
  {
    id: "B3",
    section: "基本情况",
    title: "以下哪项最接近你目前的恋爱或伴侣关系状态？",
    kind: "single",
    help: "“稳定伴侣”指双方已确认关系的伴侣，包括配偶，不限定交往时长。",
    options: [
      ...choices([
        ["never", "目前没有伴侣，也没有过恋爱经历"],
        ["single_experienced", "目前没有伴侣，但有过恋爱经历"],
        ["partnered", "目前有双方确认关系的稳定伴侣（包括配偶）"],
        ["unclear", "目前有交往对象，但关系状态尚未明确"],
        ["other", "其他状态"],
      ]),
      declined,
    ],
  },
  {
    id: "B4",
    section: "基本情况",
    title: "你目前的婚姻状况是？",
    kind: "single",
    help: "用于区分题目适用范围。已婚同学会跳过针对本人未来结婚安排的问题，仍可回答关系意愿和假设情景。",
    options: [
      ...choices([
        ["never_married", "未婚（包括已订婚）"],
        ["married", "已婚"],
        ["divorced", "离异"],
        ["widowed", "丧偶"],
      ]),
      declined,
    ],
  },
  {
    id: "Q1",
    section: "意愿与实际行动",
    title: "目前你对处于一段稳定亲密关系中的意愿是怎样的？",
    kind: "single",
    help: "包括恋爱或婚姻中的伴侣关系。已有伴侣的同学也可作答；本题不要求评价当前伴侣。",
    options: neutralAttitude(),
  },
  {
    id: "Q2",
    section: "意愿与实际行动",
    title: "不限定具体时间，你目前对未来结婚的意愿是怎样的？",
    kind: "single",
    help: "离异或丧偶的同学可按未来再次结婚的意愿回答。",
    options: neutralAttitude(),
  },
  {
    id: "Q3",
    section: "意愿与实际行动",
    title: "过去 3 个月，你是否主动采取过开始一段恋爱关系的行动？",
    kind: "single",
    help: "例如主动认识有好感的人、表达好感，或发出以进一步交往为目的的见面邀请。不包括已有伴侣之间的日常联系。最近 3 个月刚进入或结束关系的同学，仍按实际经历回答。",
    options: [
      ...choices([
        ["yes", "有"],
        ["no", "没有"],
      ]),
      na("partner_all_period", "过去 3 个月一直有稳定伴侣，不适用"),
      declined,
    ],
  },
  {
    id: "Q4",
    section: "意愿与实际行动",
    title: "未来 3 个月，你是否打算主动尝试开始一段稳定的恋爱关系？",
    kind: "single",
    options: [
      ...choices([
        ["definitely_not", "明确不打算"],
        ["probably_not", "比较不打算"],
      ]),
      unsure("还没有决定"),
      ...choices([
        ["probably", "比较打算"],
        ["definitely", "明确打算"],
      ]),
      na("current_partner", "目前有稳定伴侣，不适用"),
      declined,
    ],
  },
  {
    id: "Q5",
    section: "现实考虑与外部影响",
    title: "哪些因素最影响你目前的恋爱或伴侣关系意愿？",
    kind: "multiple",
    maxChoices: 3,
    help: "最多选 3 项，不分先后。只选最相关的因素，不要求判断影响方向。",
    options: [
      ...choices([
        ["suitable_person", "是否遇到合适的人"],
        ["companionship", "对陪伴或情感交流的需要"],
        ["time", "学业或工作占用的时间"],
        ["cost", "日常交往的经济开支"],
        ["distance", "毕业去向或可能出现的异地"],
        ["personal_space", "对个人空间的需要"],
        ["experience", "自己过去的相处经历"],
        ["family", "家人的看法"],
        ["single_life", "更倾向于保持单身的生活方式"],
      ]),
      other,
      none("暂时没有特别影响我的因素"),
      unsure("说不清"),
      declined,
    ],
  },
  {
    id: "Q6",
    section: "现实考虑与外部影响",
    title: "以下哪些因素最影响你目前对未来结婚的考虑？",
    kind: "multiple",
    maxChoices: 3,
    help: "最多选 3 项，不分先后。它们可以让你更愿意，也可以让你更不愿意结婚。",
    options: [
      ...choices([
        ["companionship", "是否希望有长期共同生活的伴侣"],
        ["shared_future", "是否遇到愿意共同规划未来的人"],
        ["income", "收入及其稳定程度"],
        ["employment", "就业和工作稳定程度"],
        ["housing", "住房相关支出"],
        ["wedding", "婚礼等结婚相关支出"],
        ["location", "双方的毕业去向或居住城市"],
        ["family", "家人对结婚的期待"],
        ["housework", "对婚后家务分工的预期"],
        ["parenting", "对未来是否育儿的考虑"],
        ["lasting", "对关系能否长期维持的判断"],
        ["non_marriage", "更希望保留不进入婚姻的生活安排"],
      ]),
      other,
      none("暂时没有特别影响我的因素"),
      unsure("说不清"),
      declined,
    ],
  },
  {
    id: "Q7",
    section: "现实考虑与外部影响",
    title: "在双方都愿意结婚的前提下，你认为还必须先具备哪些条件？",
    kind: "multiple",
    help: "可选所有符合项。“必须自有住房”和“租房也可以”不能同时选择。",
    incompatible: [["owned_home", "rental_acceptable"]],
    options: [
      ...choices([
        ["income", "双方有相对稳定的收入来源"],
        ["owned_home", "必须拥有自有住房，租房不能满足这一条件"],
        [
          "rental_acceptable",
          "不要求自有住房，但须有双方接受的居住安排，租房也可以",
        ],
        ["parents", "双方父母都表示支持"],
        ["children_discussed", "双方已讨论过是否育儿"],
        ["division_discussed", "双方已讨论过日常家庭分工"],
      ]),
      other,
      none("没有其他预先设定的必要条件"),
      na("not_considering", "我目前不考虑结婚，不适用"),
      unsure(),
      declined,
    ],
  },
  {
    id: "Q8",
    section: "现实考虑与外部影响",
    title: "关于未来结婚的时间，你目前更接近哪种想法？",
    kind: "single",
    options: [
      ...choices([
        ["within_5_years", "希望在未来 5 年内结婚"],
        ["after_5_years", "希望在 5 年以后结婚"],
        ["no_schedule", "希望结婚，但没有设定具体时间"],
        ["not_marry", "目前倾向未来不结婚"],
      ]),
      unsure("目前还没想清楚是否结婚"),
      declined,
    ],
  },
  {
    id: "Q9",
    section: "现实考虑与外部影响",
    title: "过去 3 个月，家人主动询问你什么时候结婚，大约有多少次？",
    kind: "single",
    help: "同一次谈话中多次提及，按 1 次计。这里只记录次数，不预设这些询问是否带来压力。",
    options: [
      ...choices([
        ["zero", "没有"],
        ["one", "1 次"],
        ["two_three", "2—3 次"],
        ["four_plus", "4 次及以上"],
      ]),
      unsure("记不清"),
      na("no_family_contact", "过去 3 个月没有与家人联系，不适用"),
      declined,
    ],
  },
  {
    id: "Q10",
    section: "现实考虑与外部影响",
    title:
      "过去 3 个月，你感觉婚姻相关网络内容对自己结婚意愿的总体影响更接近哪一项？",
    kind: "single",
    options: [
      ...choices([
        ["much_more", "让我明显更愿意结婚"],
        ["slightly_more", "让我稍微更愿意结婚"],
        ["unchanged", "我没有感觉到明显影响"],
        ["slightly_less", "让我稍微更不愿意结婚"],
        ["much_less", "让我明显更不愿意结婚"],
        ["mixed", "不同内容影响不同，难以判断总体方向"],
      ]),
      na("no_exposure", "这段时间没有接触过相关内容"),
      unsure("说不清"),
      declined,
    ],
  },
  {
    id: "Q11",
    section: "具体情景中的选择",
    title:
      "毕业后，你和伴侣分别在不同城市获得了自己满意的工作机会。你会优先考虑怎样安排？",
    kind: "single",
    help: scenarioHelp,
    options: [
      ...choices([
        ["try_distance", "先保留各自机会，尝试异地相处，并约定重新评估的时间"],
        ["same_city", "优先在同一城市生活，再协商工作机会如何调整"],
        ["end_if_long_term", "如果长期无法同城生活，倾向结束关系"],
        ["defer", "暂缓作出安排，等更多实际情况明确后再决定"],
      ]),
      other,
      unsure("目前还无法判断"),
      declined,
    ],
  },
  {
    id: "Q12",
    section: "具体情景中的选择",
    title:
      "假设你和伴侣都愿意结婚，但目前暂时买不起住房，能够负担租房生活。你会优先考虑怎样安排？",
    kind: "single",
    help: scenarioHelp,
    options: [
      ...choices([
        ["rent_and_marry", "先租房结婚，以后再考虑买房"],
        ["wait_to_buy", "先不结婚，等具备购房条件后再推进"],
        ["decide_later", "暂不确定婚期，先进一步讨论双方能够接受的居住安排"],
      ]),
      other,
      unsure("目前还无法判断"),
      declined,
    ],
  },
  {
    id: "Q13",
    section: "具体情景中的选择",
    title:
      "因为你回复消息较慢，伴侣提出查看你的聊天记录。你首先更可能怎样回应？",
    kind: "single",
    help: scenarioHelp,
    options: [
      ...choices([
        ["allow", "同意对方查看"],
        ["decline_and_discuss", "拒绝查看，并说明情况、讨论联系方式"],
        ["mutual_access", "提出双方都可以查看彼此的聊天记录"],
        ["pause", "先暂停讨论，等平静后再决定"],
        ["end_relationship", "明确表示无法接受，提出结束关系"],
      ]),
      other,
      unsure("目前还无法判断"),
      declined,
    ],
  },
  {
    id: "Q14",
    section: "具体情景中的选择",
    title:
      "假设你和伴侣决定未来共同育儿，而工作安排难以兼顾照料。你会优先考虑哪一种安排？",
    kind: "single",
    help: `${scenarioHelp} 现实中可以组合多种方式；这里只问你首先会考虑哪种。`,
    options: [
      ...choices([
        [
          "lower_income_adjusts",
          "收入较低的一方先调整工作，另一方承担更多经济支出",
        ],
        ["both_adjust", "双方轮流或分别调整部分工作安排"],
        ["external_support", "先寻找托育或亲属帮助，尽量保留双方工作安排"],
        ["defer", "暂不设定方案，到时再根据实际情况决定"],
      ]),
      na("not_parenting", "我目前不考虑育儿，难以代入这一情景"),
      other,
      unsure("目前还无法判断"),
      declined,
    ],
  },
  {
    id: "Q15",
    section: "沟通与意愿形成",
    title: "过去 3 个月，你与伴侣讨论过双方未来是否想结婚吗？",
    kind: "single",
    help: "目前已经分手，但过去 3 个月有过伴侣的同学也可作答。如果有多段关系，请按最近一段回答。这里只问讨论程度，不要求你已清楚对方的想法。",
    options: [
      ...choices([
        ["detailed", "详细讨论过"],
        ["brief", "简单提及过"],
        ["never_discussed", "没有讨论过"],
      ]),
      na("no_partner_in_period", "过去 3 个月没有恋爱关系，不适用"),
      declined,
    ],
  },
  {
    id: "Q16",
    section: "沟通与意愿形成",
    title: "家人对你选择结婚或不结婚的态度，会在多大程度上影响你的决定？",
    kind: "single",
    help: "这里问家人对是否结婚的态度，不是对某一位伴侣的认可程度。",
    options: [
      ...choices([
        ["none", "没有影响"],
        ["small", "影响较小"],
        ["moderate", "影响一般"],
        ["large", "影响较大"],
        ["very_large", "影响很大"],
      ]),
      unsure("目前无法判断"),
      declined,
    ],
  },
  {
    id: "Q17",
    section: "沟通与意愿形成",
    title:
      "假设你希望未来结婚，但伴侣明确表示不希望结婚，其他方面相处良好。你会优先考虑怎样处理？",
    kind: "single",
    help: scenarioHelp,
    options: [
      ...choices([
        ["accept", "继续交往，接受关系可能不走向婚姻"],
        ["discuss_later", "继续交往一段时间，并约定之后再讨论"],
        ["end", "认为这是重要分歧，倾向结束关系"],
        ["avoid", "暂时回避这个问题，之后再考虑"],
      ]),
      other,
      na("cannot_relate", "这一设定与我的想法差异较大，难以代入"),
      unsure("目前还无法判断"),
      declined,
    ],
  },
  {
    id: "Q18",
    section: "沟通与意愿形成",
    title:
      "假设你目前的经济压力明显减轻，其他情况不变，你认为自己的结婚意愿可能怎样变化？",
    kind: "single",
    options: [
      ...choices([
        ["much_higher", "明显提高"],
        ["slightly_higher", "略有提高"],
        ["unchanged", "基本不变"],
        ["slightly_lower", "略有降低"],
        ["much_lower", "明显降低"],
      ]),
      na("no_pressure", "我目前没有明显的经济压力，不适用"),
      unsure("目前无法判断"),
      declined,
    ],
  },
  {
    id: "Q19",
    section: "支持需求",
    title: "如果学校或社会能提供相关支持，你目前最希望获得哪些方面的帮助？",
    kind: "multiple",
    maxChoices: 3,
    help: "最多选 3 项，不分先后。",
    options: [
      ...choices([
        ["meet_people", "更多自然认识、交流的机会"],
        ["communication", "如何表达需求、处理关系中的分歧"],
        ["boundaries", "如何识别并处理关系中的控制或边界问题"],
        ["career", "就业与职业规划方面的支持"],
        ["housing", "可负担的居住安排及相关信息"],
        ["family", "如何与家人讨论恋爱或结婚安排"],
        ["division", "对婚后家务、照料和育儿分工的了解"],
      ]),
      other,
      none("目前没有这方面的需求"),
      unsure("说不清"),
      declined,
    ],
  },
  {
    id: "Q20",
    section: "支持需求",
    title: "如果希望了解或讨论婚恋问题，你最愿意优先采用哪一种方式？",
    kind: "single",
    options: [
      ...choices([
        ["self_help", "自己阅读文章、观看视频或使用匿名自助材料"],
        ["friends", "与信任的朋友私下交流"],
        ["family", "与家人交流"],
        ["peers", "参加小规模的同伴讨论或活动"],
        ["courses", "参加相关课程或讲座"],
        ["professional", "与学校咨询、辅导或其他专业支持人员单独交流"],
      ]),
      other,
      none("目前不希望通过这些方式了解或讨论"),
      unsure("说不清"),
      declined,
    ],
  },
  {
    id: "S1",
    section: "选答",
    title: "请暂不考虑是否结婚这一条件，你目前对未来养育子女的意愿是怎样的？",
    kind: "single",
    optional: true,
    options: neutralAttitude(),
  },
  {
    id: "S2",
    section: "选答",
    title: "你想过怎样的生活？",
    kind: "text",
    optional: true,
    maxLength: 200,
    help: "可以谈恋爱或婚姻在理想生活中的位置、具体支持需求，或对问卷的建议。最多 200 字；本题和其他补充文字仅用于调查，不公开到档案索引。",
  },
];

export const LEGACY_QUESTIONS = [
  "我愿意在大学期间建立一段稳定的恋爱关系。",
  "相比是否恋爱，我更看重关系中的尊重、平等和安全感。",
  "我愿意为经营亲密关系投入稳定的时间和精力。",
  "在合适的条件下，我愿意进入婚姻。",
  "在事业和经济基础稳定前，我倾向于推迟结婚。",
  "我能够接受结婚、晚婚或不婚等不同生活选择。",
  "如果未来进入稳定婚姻，我有生育子女的意愿。",
  "我对未来理想子女数量有比较明确的想法。",
  "学业和职业发展会显著影响我的婚恋时间安排。",
  "就业竞争和工作稳定性会降低我近期的婚恋意愿。",
  "收入、消费和长期经济压力会影响我是否进入婚姻。",
  "住房和居住安排是我评估婚姻可行性的重要因素。",
  "父母或亲属的期待会影响我的婚恋选择。",
  "如果家人不支持，我仍会坚持经过思考后的个人选择。",
  "网络平台上的婚恋叙事会影响我对亲密关系的想象。",
  "我会认真评估冷暴力、控制、背叛等亲密关系风险。",
  "发生分歧时，我愿意通过平等沟通而不是单方面妥协来解决。",
  "做出恋爱或婚姻承诺后，我愿意承担相应的长期责任。",
  "家务和照护责任应当由伴侣根据实际情况共同分担。",
  "我愿意与伴侣平等讨论并共同承担未来的育儿责任。",
];
export const LEGACY_LABELS = [
  "完全不同意",
  "不太同意",
  "不确定",
  "比较同意",
  "非常同意",
];
export type SurveyGender = "男" | "女" | "其他性别认同" | "不愿透露" | "未作答";
type SubmissionBase = {
  id: string;
  createdAt: string;
  label: string;
  message: string;
  gender: SurveyGender;
};
export type LegacySubmission = SubmissionBase & {
  schemaVersion: 1;
  questionnaireVersion: "legacy-20";
  answers: number[];
};
export type CurrentSubmission = SubmissionBase & {
  schemaVersion: 2;
  questionnaireVersion: string;
  responses: Responses;
  publication: { profile: boolean };
};
export type Submission = LegacySubmission | CurrentSubmission;
export type CurrentInput = {
  schemaVersion: 2;
  questionnaireVersion: string;
  label: string;
  responses: Responses;
  publication: { profile: boolean };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
export const selectedValues = (response?: QuestionResponse): string[] =>
  typeof response?.value === "string"
    ? [response.value]
    : Array.isArray(response?.value)
      ? response.value.filter(
          (value): value is string => typeof value === "string",
        )
      : [];
export const optionResponse = (
  question: Question,
  values: string[],
  otherText?: string,
): QuestionResponse => {
  const selectedOptions =
    question.options?.filter((option) => values.includes(option.value)) ?? [];
  return {
    status:
      selectedOptions.length === 1
        ? (selectedOptions[0].status ?? "answered")
        : "answered",
    value: question.kind === "multiple" ? values : values[0],
    ...(otherText?.trim() && values.includes("other")
      ? { other: otherText.trim().slice(0, 120) }
      : {}),
  };
};

const marriedOnlySkips = new Set([
  "Q2",
  "Q6",
  "Q7",
  "Q8",
  "Q9",
  "Q10",
  "Q15",
  "Q16",
  "Q18",
]);
export function automaticResponse(
  id: string,
  responses: Responses,
): QuestionResponse | undefined {
  const married = selectedValues(responses.B4).includes("married");
  if (married && (marriedOnlySkips.has(id) || id === "Q4"))
    return { status: "not_applicable", reason: "currently_married" };
  if (id === "Q4" && selectedValues(responses.B3).includes("partnered"))
    return { status: "not_applicable", reason: "current_partner" };
}
export function applyRouting(responses: Responses): Responses {
  const next = { ...responses };
  for (const question of QUESTIONS) {
    const automatic = automaticResponse(question.id, next);
    if (automatic) next[question.id] = automatic;
    else if (
      ["currently_married", "current_partner"].includes(
        next[question.id]?.reason ?? "",
      )
    )
      delete next[question.id];
  }
  return next;
}
export const visibleQuestions = (responses: Responses): Question[] =>
  QUESTIONS.filter((question) => !automaticResponse(question.id, responses));

export function responseError(
  question: Question,
  response?: QuestionResponse,
): string | undefined {
  if (response === undefined)
    return question.optional
      ? undefined
      : "请选择一项后继续，或选择“不愿回答”。";
  if (!isObject(response)) return "回答格式无效。";
  if (!RESPONSE_STATUSES.includes(response.status)) return "回答状态无效。";
  if (response.status === "skipped")
    return question.optional &&
      response.value === undefined &&
      response.other === undefined &&
      (!response.reason || response.reason === "not_public")
      ? undefined
      : "这道题不能以空白回答提交。";
  if (response.reason) return "回答包含无效的跳题原因。";
  if (question.kind === "text")
    return response.status === "answered" &&
      typeof response.value === "string" &&
      Boolean(response.value.trim()) &&
      response.value.length <= (question.maxLength ?? 200) &&
      response.other === undefined
      ? undefined
      : "请检查文字长度。";
  const values = selectedValues(response);
  if (
    !values.length ||
    new Set(values).size !== values.length ||
    (question.kind === "single"
      ? typeof response.value !== "string"
      : !Array.isArray(response.value) ||
        response.value.some((value) => typeof value !== "string"))
  )
    return "选项格式无效。";
  const selectedOptions = values.map((value) =>
    question.options?.find((option) => option.value === value),
  );
  if (selectedOptions.some((option) => !option)) return "回答包含未知选项。";
  if (question.maxChoices && values.length > question.maxChoices)
    return `最多选择 ${question.maxChoices} 项。`;
  if (values.length > 1 && selectedOptions.some((option) => option?.exclusive))
    return "“没有”“说不清”“不适用”“不愿回答”需单独选择。";
  if (
    question.incompatible?.some(
      (group) => group.filter((value) => values.includes(value)).length > 1,
    )
  )
    return "“必须自有住房”和“租房也可以”不能同时选择。";
  const expectedStatus =
    selectedOptions.length === 1
      ? (selectedOptions[0]?.status ?? "answered")
      : "answered";
  if (response.status !== expectedStatus) return "回答状态与选项不一致。";
  if (
    response.other !== undefined &&
    (typeof response.other !== "string" ||
      response.other.length > 120 ||
      !values.includes("other"))
  )
    return "请检查其他选项的补充文字。";
}
export function validateResponses(value: unknown): {
  responses?: Responses;
  errors: Record<string, string>;
} {
  if (!isObject(value)) return { errors: { form: "缺少按题号保存的回答。" } };
  const responses = value as Responses;
  const errors: Record<string, string> = {};
  if (
    Object.keys(responses).some(
      (id) => !QUESTIONS.some((question) => question.id === id),
    )
  )
    errors.form = "包含未知题号。";
  if (selectedValues(responses.B2).includes("not_enrolled"))
    errors.B2 = "本调查仅面向目前在高校就读的学生。";
  for (const question of QUESTIONS) {
    const response = responses[question.id];
    const automatic = automaticResponse(question.id, responses);
    if (automatic) {
      if (
        !response ||
        response.status !== automatic.status ||
        response.reason !== automatic.reason ||
        response.value !== undefined ||
        response.other !== undefined
      )
        errors[question.id] = "请按当前基本情况更新跳题。";
    } else {
      const error = responseError(question, response);
      if (error) errors[question.id] = error;
    }
  }
  return Object.keys(errors).length
    ? { errors }
    : {
        responses: Object.fromEntries(
          QUESTIONS.map((question) => {
            const response = responses[question.id] ?? { status: "skipped" };
            return [
              question.id,
              {
                status: response.status,
                ...(response.value !== undefined
                  ? {
                      value:
                        question.kind === "text" &&
                        typeof response.value === "string"
                          ? response.value.trim()
                          : response.value,
                    }
                  : {}),
                ...(response.reason ? { reason: response.reason } : {}),
                ...(response.other?.trim()
                  ? { other: response.other.trim() }
                  : {}),
              },
            ];
          }),
        ),
        errors,
      };
}
export function parseCurrentInput(value: unknown): {
  input?: CurrentInput;
  errors: Record<string, string>;
} {
  if (
    !isObject(value) ||
    value.schemaVersion !== 2 ||
    value.questionnaireVersion !== QUESTIONNAIRE_VERSION
  )
    return { errors: { version: "问卷版本不受支持，请更新页面后重试。" } };
  const { responses, errors } = validateResponses(value.responses);
  if (
    !isObject(value.publication) ||
    typeof value.publication.profile !== "boolean"
  )
    errors.publication = "请选择是否公开选择题档案。";
  if (!responses || Object.keys(errors).length) return { errors };
  return {
    input: {
      schemaVersion: 2,
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      label:
        typeof value.label === "string" ? value.label.trim().slice(0, 24) : "",
      responses,
      publication: {
        profile: (value.publication as { profile: boolean }).profile,
      },
    },
    errors,
  };
}
export function genderFromResponses(responses: Responses): SurveyGender {
  return (
    (
      {
        male: "男",
        female: "女",
        another: "其他性别认同",
        declined: "不愿透露",
      } as Record<string, SurveyGender>
    )[selectedValues(responses.B1)[0]] ?? "未作答"
  );
}
export function currentRecord(
  input: CurrentInput,
  id: string,
  createdAt: string,
): CurrentSubmission {
  return {
    ...input,
    id,
    createdAt,
    label: input.label || "匿名访客",
    gender: genderFromResponses(input.responses),
    message:
      typeof input.responses.S2?.value === "string"
        ? input.responses.S2.value
        : "",
  };
}
export const validLegacyAnswers = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.length === 20 &&
  value.every(
    (answer) => Number.isInteger(answer) && answer >= 1 && answer <= 5,
  );
export function normalizeSubmission(value: unknown): Submission | undefined {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    typeof value.label !== "string"
  )
    return;
  if (value.schemaVersion === 2) {
    const { input } = parseCurrentInput(value);
    if (input) return currentRecord(input, value.id, value.createdAt);
    return;
  }
  if (value.schemaVersion !== undefined && value.schemaVersion !== 1) return;
  if (!validLegacyAnswers(value.answers)) return;
  const gender: SurveyGender =
    value.gender === "♂" || value.gender === "男"
      ? "男"
      : value.gender === "♀" || value.gender === "女"
        ? "女"
        : "不愿透露";
  return {
    schemaVersion: 1,
    questionnaireVersion: "legacy-20",
    id: value.id,
    createdAt: value.createdAt,
    answers: [...value.answers],
    label: value.label,
    gender,
    message: typeof value.message === "string" ? value.message : "",
  };
}
/** Public v2 archives expose choices only, never free text. Legacy visibility is unchanged. */
export function publicSubmission(record: Submission): Submission | undefined {
  if (record.schemaVersion === 1) return record;
  if (!record.publication.profile) return;
  const responses: Responses = Object.fromEntries(
    Object.entries(record.responses).map(([id, response]) => [
      id,
      id === "S2"
        ? { status: "skipped", reason: "not_public" }
        : {
            status: response.status,
            ...(response.value !== undefined ? { value: response.value } : {}),
            ...(response.reason ? { reason: response.reason } : {}),
          },
    ]),
  );
  return { ...record, message: "", responses };
}
export function responseLabel(
  question: Question,
  response?: QuestionResponse,
): string {
  if (!response) return "未作答";
  if (response.reason === "not_public") return "补充文字不公开";
  if (response.reason === "currently_married")
    return "已婚，本题不适用（自动跳过）";
  if (response.reason === "current_partner")
    return "目前有稳定伴侣，本题不适用（自动跳过）";
  if (response.status === "skipped") return "已跳过";
  if (question.kind === "text")
    return typeof response.value === "string" ? response.value : "未填写";
  return (
    selectedValues(response)
      .map(
        (value) =>
          question.options?.find((option) => option.value === value)?.label ??
          "未知选项",
      )
      .join("；") + (response.other ? `：${response.other}` : "")
  );
}
