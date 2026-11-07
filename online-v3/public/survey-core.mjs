/** Shared V3 questionnaire contract. Generated from the reviewed V3 manuscript.
 * No personal identifiers, research-only notes or submitted data are embedded.
 */
export const SURVEY_VERSION = 'xindong-v3-20261106';
export const SCHEMA_VERSION = 3;
export const QUESTIONS = deepFreeze({
  "D01": {
    "id": "D01",
    "title": "你的性别是？",
    "hint": "后面的男方、女方均为假设角色，你也可以使用“伴侣”的通用表述。",
    "type": "single",
    "options": [
      {
        "value": "female",
        "label": "女"
      },
      {
        "value": "male",
        "label": "男"
      },
      {
        "value": "other",
        "label": "其他性别认同"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 1
  },
  "D02": {
    "id": "D02",
    "title": "你目前处于哪个学习阶段？",
    "hint": "本次调查面向高校在读学生。",
    "type": "single",
    "options": [
      {
        "value": "college",
        "label": "专科"
      },
      {
        "value": "undergrad",
        "label": "本科"
      },
      {
        "value": "graduate",
        "label": "研究生"
      },
      {
        "value": "other_enrolled",
        "label": "其他高校在读阶段"
      },
      {
        "value": "not_enrolled",
        "label": "目前不在高校就读"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 1
  },
  "D03": {
    "id": "D03",
    "title": "你目前的感情状态是？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "never",
        "label": "没有伴侣，也没有过恋爱经历"
      },
      {
        "value": "previous",
        "label": "没有伴侣，但有过恋爱经历"
      },
      {
        "value": "partner",
        "label": "有双方已确认关系的伴侣（包括配偶）"
      },
      {
        "value": "unclear",
        "label": "有交往对象，但关系尚未明确"
      },
      {
        "value": "other",
        "label": "其他状态"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 1
  },
  "D04": {
    "id": "D04",
    "title": "你目前的婚姻状况是？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "never",
        "label": "从未结婚（包括已订婚）"
      },
      {
        "value": "married",
        "label": "目前已婚"
      },
      {
        "value": "previous",
        "label": "目前离异或丧偶"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 1
  },
  "C01": {
    "id": "C01",
    "title": "总体而言，你现在想拥有一段稳定的亲密关系吗？",
    "hint": "包括恋爱或婚姻中的伴侣关系。已有伴侣者按一般想法回答，不是在评价当前伴侣。",
    "type": "single",
    "options": [
      {
        "value": "yes",
        "label": "想要"
      },
      {
        "value": "neutral",
        "label": "既不期待，也不排斥"
      },
      {
        "value": "no",
        "label": "不想要"
      },
      {
        "value": "unsure",
        "label": "还没想清楚",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 2
  },
  "U01": {
    "id": "U01",
    "title": "不限定时间，你目前愿意在未来结婚吗？",
    "hint": "离异或丧偶者可按再次结婚回答；目前已婚或题目不适用时，可选择“不适用”。",
    "type": "single",
    "options": [
      {
        "value": "yes",
        "label": "愿意"
      },
      {
        "value": "neutral",
        "label": "既不期待，也不排斥"
      },
      {
        "value": "no",
        "label": "不愿意"
      },
      {
        "value": "unsure",
        "label": "还没想清楚",
        "status": "unsure"
      },
      {
        "value": "not_applicable",
        "label": "不适用",
        "status": "not_applicable"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 2
  },
  "U02": {
    "id": "U02",
    "title": "关于结婚时间，你目前更接近哪种想法？",
    "hint": "按目前的想法回答，不是对未来的承诺。离异或丧偶者可按再次结婚回答。",
    "type": "single",
    "options": [
      {
        "value": "within_ten",
        "label": "希望在未来10年内结婚"
      },
      {
        "value": "after_ten",
        "label": "希望在10年以后结婚"
      },
      {
        "value": "no_timeline",
        "label": "希望结婚，但没有设定时间"
      },
      {
        "value": "no_plan",
        "label": "目前不打算结婚"
      },
      {
        "value": "unsure",
        "label": "还没想清楚是否结婚",
        "status": "unsure"
      },
      {
        "value": "not_applicable",
        "label": "不适用",
        "status": "not_applicable"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 2
  },
  "R01": {
    "id": "R01",
    "title": "今后，你是否希望生育孩子？",
    "hint": "不限定是否结婚，也不限定近期。已有孩子者按是否希望再生育回答。",
    "type": "single",
    "options": [
      {
        "value": "yes",
        "label": "希望"
      },
      {
        "value": "no",
        "label": "不希望"
      },
      {
        "value": "unsure",
        "label": "还没有决定",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 2
  },
  "R02": {
    "id": "R02",
    "title": "假设你和伴侣对今后是否生育存在分歧，其他方面相处良好，你首先更可能怎么做？",
    "hint": "这是一个假设情景，选择你首先更可能的回应。已有孩子者按再生育理解。",
    "type": "single",
    "options": [
      {
        "value": "discuss",
        "label": "先了解彼此原因，再讨论能否接受差异"
      },
      {
        "value": "adjust",
        "label": "愿意调整自己的想法，接受对方的选择"
      },
      {
        "value": "reconsider",
        "label": "认为难以协调，考虑结束关系"
      },
      {
        "value": "unsure",
        "label": "目前还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4,
    "variants": [
      {
        "title": "假设你希望今后生育孩子，但伴侣明确表示不想生育，其他方面相处良好，你首先更可能怎么做？"
      },
      {
        "title": "假设你不希望今后生育孩子，但伴侣明确表示想生育，其他方面相处良好，你首先更可能怎么做？"
      },
      {
        "title": "假设你和伴侣对今后是否生育存在分歧，其他方面相处良好，你首先更可能怎么做？"
      }
    ]
  },
  "R03": {
    "id": "R03",
    "title": "假设双方决定结婚，对于是否涉及彩礼，你目前更接近哪种想法？",
    "hint": "只谈你目前的想法，不要求采纳彩礼习俗。已婚者也按假设回答，不回忆过去实际金额。",
    "type": "single",
    "options": [
      {
        "value": "no_custom",
        "label": "倾向不涉及彩礼"
      },
      {
        "value": "negotiate",
        "label": "是否涉及及金额都由双方协商"
      },
      {
        "value": "unsure",
        "label": "还没有形成想法",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4,
    "variants": [
      {
        "title": "假设双方决定结婚，且你是彩礼收取方，你个人期望的现金彩礼总额是多少？",
        "options": [
          {
            "value": "amount_zero",
            "label": "0元"
          },
          {
            "value": "amount_to_50k",
            "label": "0元以上至5万元（含5万元）"
          },
          {
            "value": "amount_50k_to_150k",
            "label": "5万元以上至15万元（含15万元）"
          },
          {
            "value": "amount_over_150k",
            "label": "15万元以上"
          },
          {
            "value": "no_custom",
            "label": "不考虑采用彩礼安排"
          },
          {
            "value": "unsure",
            "label": "暂时无法估计",
            "status": "unsure"
          },
          {
            "value": "declined",
            "label": "不愿回答",
            "status": "declined"
          }
        ]
      },
      {
        "title": "假设双方决定结婚，且你是彩礼支付方，你预计最多能安排多少现金彩礼预算？",
        "options": [
          {
            "value": "amount_zero",
            "label": "0元"
          },
          {
            "value": "amount_to_50k",
            "label": "0元以上至5万元（含5万元）"
          },
          {
            "value": "amount_50k_to_150k",
            "label": "5万元以上至15万元（含15万元）"
          },
          {
            "value": "amount_over_150k",
            "label": "15万元以上"
          },
          {
            "value": "no_custom",
            "label": "不考虑采用彩礼安排"
          },
          {
            "value": "unsure",
            "label": "暂时无法估计",
            "status": "unsure"
          },
          {
            "value": "declined",
            "label": "不愿回答",
            "status": "declined"
          }
        ]
      },
      {
        "title": "假设双方决定结婚，对于是否涉及彩礼，你目前更接近哪种想法？",
        "options": [
          {
            "value": "no_custom",
            "label": "倾向不涉及彩礼"
          },
          {
            "value": "negotiate",
            "label": "是否涉及及金额都由双方协商"
          },
          {
            "value": "unsure",
            "label": "还没有形成想法",
            "status": "unsure"
          },
          {
            "value": "declined",
            "label": "不愿回答",
            "status": "declined"
          }
        ]
      }
    ]
  },
  "V01": {
    "id": "V01",
    "title": "假设你和伴侣在不同城市获得满意的工作机会，预计会异地几年，你更倾向于怎样安排？",
    "hint": "不预设必须由哪一方迁就，只问你优先考虑的安排。",
    "type": "single",
    "options": [
      {
        "value": "distance",
        "label": "保留各自机会，先尝试异地相处"
      },
      {
        "value": "same_city",
        "label": "优先争取同城，再协商由谁调整"
      },
      {
        "value": "reconsider",
        "label": "若长期无法同城，倾向结束关系"
      },
      {
        "value": "unsure",
        "label": "还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4,
    "variants": [
      {
        "title": "假设你和男方在不同城市获得满意的工作机会，预计会异地几年，你更倾向于怎样安排？"
      },
      {
        "title": "假设你和女方在不同城市获得满意的工作机会，预计会异地几年，你更倾向于怎样安排？"
      },
      {
        "title": "假设你和伴侣在不同城市获得满意的工作机会，预计会异地几年，你更倾向于怎样安排？"
      }
    ]
  },
  "V02": {
    "id": "V02",
    "title": "假设你们都想结婚，目前没有自有住房和私家车，但能负担租房和日常出行，你更倾向于？",
    "hint": "不暗示房车必须由男方提供。难以想象这种处境时，可以选择“难以代入”。",
    "type": "single",
    "options": [
      {
        "value": "rent",
        "label": "可以先租房结婚"
      },
      {
        "value": "home",
        "label": "希望先有自有住房，再结婚"
      },
      {
        "value": "home_and_car",
        "label": "希望房、车都具备后，再结婚"
      },
      {
        "value": "other",
        "label": "其他安排"
      },
      {
        "value": "unsure",
        "label": "暂时无法判断",
        "status": "unsure"
      },
      {
        "value": "cannot_imagine",
        "label": "难以代入",
        "status": "cannot_imagine"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4,
    "variants": [
      {
        "title": "假设你和男方都想结婚，男方暂时没有自有住房和私家车，但双方能负担租房和日常出行，你更倾向于？"
      },
      {
        "title": "假设你和女方都想结婚，你暂时没有自有住房和私家车，但双方能负担租房和日常出行，你更倾向于？"
      },
      {
        "title": "假设你们都想结婚，目前没有自有住房和私家车，但能负担租房和日常出行，你更倾向于？"
      }
    ]
  },
  "V04": {
    "id": "V04",
    "title": "假设你们都想育儿，但工作难以兼顾照料，你会先考虑哪种安排？",
    "hint": "实际可以组合多种办法，这里只问首先考虑的安排。也可以选择“难以代入”。",
    "type": "single",
    "options": [
      {
        "value": "lower_income",
        "label": "收入较低的一方先调整工作"
      },
      {
        "value": "both_adjust",
        "label": "双方分别调整一部分工作"
      },
      {
        "value": "outside_help",
        "label": "先考虑托育或亲属自愿协助"
      },
      {
        "value": "postpone",
        "label": "暂缓育儿计划，之后再讨论"
      },
      {
        "value": "cannot_imagine",
        "label": "难以代入",
        "status": "cannot_imagine"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4
  },
  "V05": {
    "id": "V05",
    "title": "假设你希望结婚，但交往对象明确不想结婚，其他方面相处良好，你首先更可能怎么做？",
    "hint": "这是独立的假设情景，无需与你现实中的婚姻态度一致。",
    "type": "single",
    "options": [
      {
        "value": "accept",
        "label": "接受可能不结婚，继续交往"
      },
      {
        "value": "discuss_later",
        "label": "继续交往，并约定以后再谈"
      },
      {
        "value": "reconsider",
        "label": "认为难以协调，考虑结束关系"
      },
      {
        "value": "unsure",
        "label": "还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4
  },
  "A01": {
    "id": "A01",
    "title": "过去3个月，你主动尝试过开始或确认一段恋爱关系吗？",
    "hint": "例如表达好感、提出进一步交往或讨论确认关系。近期分手者也按过去3个月的实际经历回答。",
    "type": "single",
    "options": [
      {
        "value": "yes",
        "label": "有"
      },
      {
        "value": "no",
        "label": "没有"
      },
      {
        "value": "not_applicable",
        "label": "这段时间一直有稳定伴侣，不适用",
        "status": "not_applicable"
      },
      {
        "value": "unsure",
        "label": "记不清",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "A03": {
    "id": "A03",
    "title": "哪些因素最影响你现在是否想恋爱？",
    "hint": "最多选2项，不分先后。因素可以让你更想或更不想恋爱。",
    "type": "multi",
    "options": [
      {
        "value": "suitable_person",
        "label": "有没有合适的人"
      },
      {
        "value": "companionship",
        "label": "对陪伴和情感交流的需要"
      },
      {
        "value": "resources",
        "label": "能够投入的时间、精力或开支"
      },
      {
        "value": "personal_space",
        "label": "个人空间与生活安排"
      },
      {
        "value": "other",
        "label": "其他因素"
      },
      {
        "value": "none",
        "label": "没有特别的影响因素",
        "exclusive": true
      },
      {
        "value": "unsure",
        "label": "说不清",
        "status": "unsure",
        "exclusive": true
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined",
        "exclusive": true
      }
    ],
    "section": 3,
    "max": 2
  },
  "A04": {
    "id": "A04",
    "title": "过去3个月，你和别人聊过自己想要怎样的亲密关系吗？",
    "hint": "可以是朋友、家人、交往对象或前伴侣。",
    "type": "single",
    "options": [
      {
        "value": "discussed",
        "label": "认真聊过"
      },
      {
        "value": "mentioned",
        "label": "只是简单提过"
      },
      {
        "value": "no",
        "label": "没有聊过"
      },
      {
        "value": "unsure",
        "label": "记不清",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "A05": {
    "id": "A05",
    "title": "假设你对一个人有好感，但几次交流后仍不清楚对方的心意，你会先怎么做？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "express",
        "label": "表达好感，询问是否愿意进一步了解"
      },
      {
        "value": "wait",
        "label": "继续接触一段时间，再决定"
      },
      {
        "value": "pause",
        "label": "暂时不再推进关系"
      },
      {
        "value": "intermediary",
        "label": "请共同认识的人帮忙了解"
      },
      {
        "value": "unsure",
        "label": "还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4
  },
  "A07": {
    "id": "A07",
    "title": "当你犹豫要不要开始一段关系时，最希望别人怎样帮助你？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "listen",
        "label": "先听我说，理解我的感受"
      },
      {
        "value": "clarify",
        "label": "帮我梳理自己的顾虑和期待"
      },
      {
        "value": "advise",
        "label": "给我具体的交往建议"
      },
      {
        "value": "none",
        "label": "暂时不需要别人帮助"
      },
      {
        "value": "unsure",
        "label": "还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 5
  },
  "B01": {
    "id": "B01",
    "title": "过去3个月，你和当前伴侣谈过将来是否想结婚吗？",
    "hint": "在一起不足3个月，按确认关系以来的经历回答。",
    "type": "single",
    "options": [
      {
        "value": "discussed",
        "label": "认真讨论过"
      },
      {
        "value": "mentioned",
        "label": "只是简单提过"
      },
      {
        "value": "no",
        "label": "没有讨论过"
      },
      {
        "value": "unsure",
        "label": "记不清",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "B03": {
    "id": "B03",
    "title": "讨论未来安排时，你表达不同意见有多容易？",
    "hint": "按过去3个月的经历回答；关系不足3个月按相处以来回答。",
    "type": "single",
    "options": [
      {
        "value": "easy",
        "label": "比较容易"
      },
      {
        "value": "neutral",
        "label": "既不容易，也不困难"
      },
      {
        "value": "difficult",
        "label": "比较困难"
      },
      {
        "value": "not_experienced",
        "label": "没有相关讨论或没有遇到分歧",
        "status": "not_experienced"
      },
      {
        "value": "unsure",
        "label": "说不清",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "B05": {
    "id": "B05",
    "title": "假设伴侣想把周末都用来相处，而你想留一些时间给自己，你会先怎么做？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "discuss",
        "label": "说出需要，一起商量安排"
      },
      {
        "value": "accommodate",
        "label": "先按对方的想法安排"
      },
      {
        "value": "withdraw",
        "label": "减少见面，暂时不解释原因"
      },
      {
        "value": "reconsider",
        "label": "重新考虑这段关系是否适合自己"
      },
      {
        "value": "unsure",
        "label": "还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4
  },
  "B06": {
    "id": "B06",
    "title": "你压力很大，伴侣马上给建议，但你更想先被倾听，你会先怎么回应？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "express",
        "label": "直接说明现在更需要倾听"
      },
      {
        "value": "listen",
        "label": "先听建议，不说明自己的期待"
      },
      {
        "value": "hint",
        "label": "用暗示表达自己的需要"
      },
      {
        "value": "other_support",
        "label": "转向其他人寻求支持"
      },
      {
        "value": "unsure",
        "label": "还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4
  },
  "B07": {
    "id": "B07",
    "title": "如果你们对未来安排反复谈不拢，什么最能让你愿意寻求外部帮助？",
    "hint": "只选最重要的一项。",
    "type": "single",
    "options": [
      {
        "value": "neutral_helper",
        "label": "帮助者不预先站队"
      },
      {
        "value": "mutual_willing",
        "label": "双方都愿意参与"
      },
      {
        "value": "privacy",
        "label": "谈话内容有保密安排"
      },
      {
        "value": "practical",
        "label": "能提供具体的沟通办法"
      },
      {
        "value": "none",
        "label": "暂不考虑外部帮助"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 5
  },
  "M01": {
    "id": "M01",
    "title": "过去3个月，你和配偶谈过接下来的共同生活安排吗？",
    "hint": "例如工作、居住或家庭安排。",
    "type": "single",
    "options": [
      {
        "value": "discussed",
        "label": "认真讨论过"
      },
      {
        "value": "mentioned",
        "label": "只是简单提过"
      },
      {
        "value": "no",
        "label": "没有讨论过"
      },
      {
        "value": "unsure",
        "label": "记不清",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "M02": {
    "id": "M02",
    "title": "你觉得目前的家务分担对你公平吗？",
    "hint": "没有共同生活或没有可评价分工时，可选“没有适用的分工情况”。",
    "type": "single",
    "options": [
      {
        "value": "fair",
        "label": "比较公平"
      },
      {
        "value": "mixed",
        "label": "公平与不公平的感受各半"
      },
      {
        "value": "unfair",
        "label": "比较不公平"
      },
      {
        "value": "not_applicable",
        "label": "没有适用的分工情况",
        "status": "not_applicable"
      },
      {
        "value": "unsure",
        "label": "说不清",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "M03": {
    "id": "M03",
    "title": "你觉得你们对未来生活的主要想法有多一致？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "agree",
        "label": "大体一致"
      },
      {
        "value": "mixed",
        "label": "有的相同，有的不同"
      },
      {
        "value": "disagree",
        "label": "大体不一致"
      },
      {
        "value": "not_experienced",
        "label": "还没有讨论",
        "status": "not_experienced"
      },
      {
        "value": "unsure",
        "label": "说不清",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "M04": {
    "id": "M04",
    "title": "假设你承担了更多家庭事务的计划和协调，配偶却觉得投入差不多，你会先怎么做？",
    "hint": "例如记住待办、安排采购、联系家庭事务，不仅指亲手做家务。",
    "type": "single",
    "options": [
      {
        "value": "discuss",
        "label": "说清各自承担的事，再商量分工"
      },
      {
        "value": "request",
        "label": "直接提出希望对方多承担一些"
      },
      {
        "value": "reduce",
        "label": "先减少自己的投入，观察情况"
      },
      {
        "value": "maintain",
        "label": "暂时维持现状，之后再谈"
      },
      {
        "value": "unsure",
        "label": "还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4
  },
  "M05": {
    "id": "M05",
    "title": "假设长辈反复建议尽快育儿，但你们还没决定，你会先怎么做？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "partner_first",
        "label": "先和配偶讨论双方想法"
      },
      {
        "value": "family_first",
        "label": "先向长辈说明自己的想法"
      },
      {
        "value": "postpone",
        "label": "暂缓回应，想清楚后再说"
      },
      {
        "value": "family_priority",
        "label": "优先考虑长辈的建议"
      },
      {
        "value": "unsure",
        "label": "还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4
  },
  "M06": {
    "id": "M06",
    "title": "如果你们双方压力都很大，你最希望外部帮助先做什么？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "listen",
        "label": "先听听双方的感受"
      },
      {
        "value": "prioritize",
        "label": "协助梳理事情的轻重缓急"
      },
      {
        "value": "practical",
        "label": "实际分担部分家务或照料"
      },
      {
        "value": "negotiate",
        "label": "帮助商量双方能接受的分工"
      },
      {
        "value": "none",
        "label": "暂时不需要外部帮助"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 5
  },
  "G01": {
    "id": "G01",
    "title": "你对自己想要怎样的亲密关系有多清楚？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "very_clear",
        "label": "很清楚"
      },
      {
        "value": "clear",
        "label": "比较清楚"
      },
      {
        "value": "mixed",
        "label": "有些清楚，有些不清楚"
      },
      {
        "value": "unclear",
        "label": "比较不清楚"
      },
      {
        "value": "very_unclear",
        "label": "很不清楚"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "G02": {
    "id": "G02",
    "title": "假设经济压力明显减轻，其他情况不变，你觉得自己的结婚意愿会怎样？",
    "hint": "已婚或没有相关经济压力时，可以选择“不适用”。",
    "type": "single",
    "options": [
      {
        "value": "more",
        "label": "更愿意结婚"
      },
      {
        "value": "same",
        "label": "基本不变"
      },
      {
        "value": "less",
        "label": "更不愿意结婚"
      },
      {
        "value": "unsure",
        "label": "判断不了",
        "status": "unsure"
      },
      {
        "value": "not_applicable",
        "label": "不适用",
        "status": "not_applicable"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4
  },
  "G04": {
    "id": "G04",
    "title": "你聊起婚恋困惑，对方马上告诉你应该怎么做，但你还没想清楚，你会先怎样回应？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "listen",
        "label": "请对方先听我说"
      },
      {
        "value": "reasons",
        "label": "请对方解释建议的理由"
      },
      {
        "value": "try",
        "label": "先试试对方的建议"
      },
      {
        "value": "pause",
        "label": "暂时不聊，自己再想想"
      },
      {
        "value": "unsure",
        "label": "还没想好",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 4
  },
  "G05": {
    "id": "G05",
    "title": "如果需要婚恋方面的帮助，什么最能让你愿意求助？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "privacy",
        "label": "个人信息和谈话受到保护"
      },
      {
        "value": "respect",
        "label": "自己的选择被尊重"
      },
      {
        "value": "practical",
        "label": "能获得具体可用的建议"
      },
      {
        "value": "accessible",
        "label": "获得帮助方便、费用可接受"
      },
      {
        "value": "none",
        "label": "目前不考虑求助"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 5
  },
  "H01": {
    "id": "H01",
    "title": "关于婚恋，你最希望获得哪些帮助？",
    "hint": "最多选2项，不分先后。选择“目前没有需求”或“不愿回答”时，不再同时选择其他选项。",
    "type": "multi",
    "options": [
      {
        "value": "meet",
        "label": "认识与发展关系的机会"
      },
      {
        "value": "communication",
        "label": "沟通与冲突处理方面的帮助"
      },
      {
        "value": "practical",
        "label": "就业、居住等现实支持"
      },
      {
        "value": "parenthood",
        "label": "生育、育儿与照料方面的信息或支持"
      },
      {
        "value": "other",
        "label": "其他帮助"
      },
      {
        "value": "none",
        "label": "目前没有需求",
        "exclusive": true
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined",
        "exclusive": true
      }
    ],
    "section": 5,
    "max": 2
  },
  "H02": {
    "id": "H02",
    "title": "想了解或讨论婚恋问题时，你最愿意先采用哪种方式？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "self_help",
        "label": "自己查找资料"
      },
      {
        "value": "close_others",
        "label": "和信任的亲友聊"
      },
      {
        "value": "group",
        "label": "参加课程或小组活动"
      },
      {
        "value": "individual",
        "label": "与辅导或咨询人员单独交流"
      },
      {
        "value": "none",
        "label": "目前不想了解或讨论"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 5
  },
  "O01": {
    "id": "O01",
    "title": "关于未来的亲密关系或家庭生活，还有什么想法是前面没问到的？",
    "hint": "可以补充前面选项没涵盖的想法，也可以留空。也欢迎分享你关于恋爱、结婚的看法和故事。请勿填写姓名或联系方式。",
    "type": "text",
    "options": [
      {
        "value": "write",
        "label": "愿意补充一句（选填，最多150字）"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 5,
    "maxLength": 150
  },
  "M07": {
    "id": "M07",
    "title": "在婚恋相关的重要决定中，家人的看法对你有多大影响？",
    "hint": "",
    "type": "single",
    "options": [
      {
        "value": "none",
        "label": "没有影响"
      },
      {
        "value": "small",
        "label": "影响较小"
      },
      {
        "value": "large",
        "label": "影响较大"
      },
      {
        "value": "very_large",
        "label": "影响很大"
      },
      {
        "value": "unsure",
        "label": "说不清",
        "status": "unsure"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "F01": {
    "id": "F01",
    "title": "目前，日常生活开支给你带来的经济压力有多大？",
    "hint": "按你自己的感受回答，无论开支由自己、家人或其他来源承担。",
    "type": "single",
    "options": [
      {
        "value": "none",
        "label": "没有压力"
      },
      {
        "value": "small",
        "label": "压力较小"
      },
      {
        "value": "medium",
        "label": "压力中等"
      },
      {
        "value": "large",
        "label": "压力较大"
      },
      {
        "value": "very_large",
        "label": "压力很大"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  },
  "F02": {
    "id": "F02",
    "title": "考虑自己未来是否结婚时，你最看重哪些因素？",
    "hint": "最多选2项。没有伴侣、不想结婚或尚未决定，也可按当前想法回答；离异或丧偶者按再婚考虑，已婚或不适用者可选“不适用”。",
    "type": "multi",
    "options": [
      {
        "value": "relationship",
        "label": "伴侣关系与婚后相处（如关系稳定、沟通和责任分担）"
      },
      {
        "value": "practical",
        "label": "经济、居住与工作安排"
      },
      {
        "value": "family",
        "label": "家人的看法与期待"
      },
      {
        "value": "other",
        "label": "其他因素"
      },
      {
        "value": "none",
        "label": "没有特别考虑的因素",
        "exclusive": true
      },
      {
        "value": "unsure",
        "label": "说不清",
        "status": "unsure",
        "exclusive": true
      },
      {
        "value": "not_applicable",
        "label": "不适用",
        "status": "not_applicable",
        "exclusive": true
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined",
        "exclusive": true
      }
    ],
    "section": 3,
    "max": 2
  },
  "F03": {
    "id": "F03",
    "title": "你感觉家人对你今后是否结婚，总体上更接近哪种态度？",
    "hint": "按你认为重要的家人对结婚这件事的总体看法回答，不问结婚时间。支持晚婚不等于不希望结婚；已婚或不适用时可选“不适用”。",
    "type": "single",
    "options": [
      {
        "value": "want",
        "label": "希望我结婚"
      },
      {
        "value": "neutral",
        "label": "对我结不结婚没有明显偏向"
      },
      {
        "value": "oppose",
        "label": "不希望我结婚"
      },
      {
        "value": "mixed",
        "label": "家人的意见不一致"
      },
      {
        "value": "unsure",
        "label": "不了解，或家人尚未表达",
        "status": "unsure"
      },
      {
        "value": "not_applicable",
        "label": "不适用",
        "status": "not_applicable"
      },
      {
        "value": "declined",
        "label": "不愿回答",
        "status": "declined"
      }
    ],
    "section": 3
  }
});
export const ROUTES = deepFreeze({
  "A": [
    "D01",
    "D02",
    "D03",
    "D04",
    "C01",
    "U01",
    "U02",
    "R01",
    "F02",
    "F01",
    "F03",
    "A01",
    "A03",
    "A04",
    "V01",
    "V02",
    "V04",
    "V05",
    "R02",
    "A05",
    "R03",
    "A07",
    "H01",
    "H02",
    "O01"
  ],
  "B": [
    "D01",
    "D02",
    "D03",
    "D04",
    "C01",
    "U01",
    "U02",
    "R01",
    "F02",
    "F01",
    "F03",
    "B01",
    "B03",
    "V01",
    "V02",
    "V04",
    "V05",
    "R02",
    "B05",
    "B06",
    "R03",
    "B07",
    "H01",
    "H02",
    "O01"
  ],
  "M": [
    "D01",
    "D02",
    "D03",
    "D04",
    "C01",
    "R01",
    "F01",
    "M07",
    "M01",
    "M02",
    "M03",
    "B03",
    "V01",
    "V02",
    "V04",
    "V05",
    "R02",
    "M04",
    "M05",
    "R03",
    "M06",
    "H01",
    "H02",
    "O01"
  ],
  "G": [
    "D01",
    "D02",
    "D03",
    "D04",
    "C01",
    "U01",
    "U02",
    "R01",
    "F02",
    "F01",
    "F03",
    "G01",
    "V01",
    "V02",
    "V04",
    "V05",
    "R02",
    "G02",
    "G04",
    "R03",
    "G05",
    "H01",
    "H02",
    "O01"
  ]
});
export const PRIMARY_CORE = Object.freeze(["C01", "U01", "U02", "F01", "F02", "F03"]);
export const SECTION_LABELS = Object.freeze(["关于你", "此刻的想法", "现实与期待", "如果是你", "需要的支持"]);

export const NEUTRAL_QUESTION_IDS = Object.freeze(['R02','R03','V01','V02']);
const SPECIAL_STATUSES = new Set(['declined','unsure','not_applicable','cannot_imagine','not_experienced']);
const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const valueOf = (answers,id) => plain(answers) && own(answers,id) && Array.isArray(answers[id]?.values) && answers[id].values.length === 1 ? answers[id].values[0] : undefined;
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function getEligibility(answers = {}) {
  const value = valueOf(answers,'D02');
  if (value === 'not_enrolled') return 'not_enrolled';
  return ['college','undergrad','graduate','other_enrolled'].includes(value) ? 'enrolled' : 'unknown';
}
export function getRoute(answers = {}) {
  const marriage = valueOf(answers,'D04');
  if (marriage === 'married') return 'M';
  if (!['never','previous'].includes(marriage)) return 'G';
  const relationship = valueOf(answers,'D03');
  if (relationship === 'partner') return 'B';
  if (['never','previous','unclear'].includes(relationship)) return 'A';
  return 'G';
}
export function getPath(answers = {}) {
  // Eligibility termination is enforced here as well as on the server.
  if (getEligibility(answers) === 'not_enrolled') return ['D01','D02'];
  return [...ROUTES[getRoute(answers)]];
}

export function resolveQuestion(id, answers = {}, neutralQuestions = []) {
  if (!own(QUESTIONS,id)) return undefined;
  const base = QUESTIONS[id];
  let question = {...base,variant:'base'};
  const sex = valueOf(answers,'D01');
  const role = Array.isArray(neutralQuestions) && neutralQuestions.includes(id) ? 'neutral' : ['female','male'].includes(sex) ? sex : 'neutral';
  if (id === 'R02') {
    const birth = valueOf(answers,'R01');
    const direction = birth === 'yes' ? 'self_yes' : birth === 'no' ? 'self_no' : 'unspecified';
    const index = direction === 'self_yes' ? 0 : direction === 'self_no' ? 1 : 2;
    const title = base.variants[index].title.replaceAll('伴侣',role === 'female' ? '男方' : role === 'male' ? '女方' : '伴侣');
    question = {...question,title,variant:`birth:${direction}:${role}`,role};
  } else if (['R03','V01','V02'].includes(id)) {
    const index = role === 'female' ? 0 : role === 'male' ? 1 : 2;
    const selected = base.variants[index];
    question = {...question,...selected,variant:`${id}:${role}`,role};
    if (id === 'R03' && role !== 'neutral') {
      question.hint = (role === 'female' ? '按你个人的期望回答，不代替家人表态。' : '假设不借债、不挤占基本生活开支，包括自己及家人自愿提供的合计预算。难以估计时可直接选择对应选项。') + '仅指现金彩礼，不含房车、首饰、婚礼、嫁妆及后续返还；这是假设，不是付款承诺。';
    }
  }
  return question;
}

export function questionFingerprint(id, answers = {}, neutralQuestions = []) {
  const q = resolveQuestion(id,answers,neutralQuestions);
  return q ? `${q.id}|${q.variant}` : '';
}

export function selectAnswer(question, previousValues = [], value) {
  const previous = Array.isArray(previousValues) ? previousValues : [];
  const option = question?.options.find(o => o.value === value);
  if (!option) return {values:[...previous],limit:false};
  if (question.type !== 'multi') return {values:[value],limit:false};
  if (previous.includes(value)) return {values:previous.filter(v => v !== value),limit:false};
  if (option.exclusive) return {values:[value],limit:false};
  const base = previous.filter(v => question.options.some(o => o.value === v && !o.exclusive));
  if (base.length >= question.max) return {values:[...previous],limit:true};
  return {values:[...base,value],limit:false};
}

function answerErrors(q, answer) {
  if (!plain(answer) || Object.keys(answer).some(k => !['values','text'].includes(k)) || !Array.isArray(answer.values)) return ['invalid_answer'];
  const values = answer.values;
  const errors = [];
  if (values.some(v => typeof v !== 'string' || !q.options.some(o => o.value === v))) errors.push('invalid_option');
  if (new Set(values).size !== values.length) errors.push('duplicate_options');
  if (values.length > (q.type === 'multi' ? q.max : 1)) errors.push('too_many_options');
  if (values.length > 1 && values.some(v => q.options.some(o => o.value === v && o.exclusive))) errors.push('exclusive_option_conflict');
  if (own(answer,'text')) {
    if (q.type !== 'text' || typeof answer.text !== 'string' || answer.text.length > q.maxLength || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(answer.text)) errors.push('invalid_text');
    if (!values.includes('write') && answer.text !== '') errors.push('text_without_write');
  }
  return errors;
}
function normalizeAnswer(q, answer) {
  const values = q.options.filter(o => answer.values.includes(o.value)).map(o => o.value);
  const normalized = {values};
  if (q.type === 'text' && values.includes('write')) normalized.text = (answer.text || '').trim();
  return normalized;
}

/** Removes values no longer applicable. For same-option/different-stem changes,
 * compare questionFingerprint before and after the edit and delete that answer.
 */
export function cleanAnswers(answers = {}, neutralQuestions = []) {
  const output = {};
  if (!plain(answers)) return output;
  for (const id of getPath(answers)) {
    if (!own(answers,id)) continue;
    const q = resolveQuestion(id,answers,neutralQuestions);
    if (!answerErrors(q,answers[id]).length && answers[id].values.length) output[id] = normalizeAnswer(q,answers[id]);
  }
  return output;
}

function recordQuestion(id, answers, skipped, neutralQuestions, path) {
  const q = resolveQuestion(id,answers,neutralQuestions);
  const base = {id,title:q.title,type:q.type,section:q.section,variant:q.variant,values:[],labels:[]};
  if (!path.includes(id)) return {...base,status:'not_shown'};
  if (skipped.includes(id)) return {...base,status:'skipped'};
  const answer = answers[id];
  if (!answer || !answer.values.length) return {...base,status:'unanswered'};
  const labels = answer.values.map(value => q.options.find(option => option.value === value).label);
  if (q.type === 'text' && answer.values.includes('write')) {
    const text = (answer.text || '').trim();
    return {...base,status:text ? 'answered' : 'unanswered',values:answer.values,labels,text};
  }
  const optionStatus = answer.values.length === 1 ? q.options.find(option => option.value === answer.values[0]).status : undefined;
  return {...base,status:SPECIAL_STATUSES.has(optionStatus) ? optionStatus : 'answered',values:answer.values,labels};
}

export function validateSubmission(payload) {
  const errors = [];
  if (!plain(payload)) return {ok:false,errors:['invalid_payload']};
  const allowed = ['schemaVersion','surveyVersion','submissionId','consent','answers','skipped','neutralQuestions','durationSeconds'];
  if (Object.keys(payload).some(key => !allowed.includes(key))) errors.push('unknown_payload_fields');
  if (payload.schemaVersion !== SCHEMA_VERSION || payload.surveyVersion !== SURVEY_VERSION) errors.push('unsupported_version');
  if (typeof payload.submissionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.submissionId)) errors.push('invalid_submission_id');
  if (payload.consent !== true) errors.push('consent_required');
  if (!plain(payload.answers)) errors.push('invalid_answers');
  if (own(payload,'durationSeconds') && (!Number.isSafeInteger(payload.durationSeconds) || payload.durationSeconds < 0 || payload.durationSeconds > 86400)) errors.push('invalid_duration');
  for (const key of ['skipped','neutralQuestions']) {
    const array = payload[key];
    if (!Array.isArray(array) || array.length > Object.keys(QUESTIONS).length || array.some(id => typeof id !== 'string') || new Set(array).size !== array.length) errors.push(`invalid_${key}`);
  }
  if (errors.length) return {ok:false,errors};
  const {answers,skipped,neutralQuestions} = payload;
  const path = getPath(answers);
  if (getEligibility(answers) === 'not_enrolled') errors.push('not_eligible');
  if (neutralQuestions.some(id => !NEUTRAL_QUESTION_IDS.includes(id) || !path.includes(id))) errors.push('invalid_neutralQuestions');
  if (skipped.some(id => !path.includes(id))) errors.push('invalid_skipped_path');
  if (skipped.some(id => own(answers,id))) errors.push('answer_skip_conflict');
  for (const [id,answer] of Object.entries(answers)) {
    if (!own(QUESTIONS,id)) { errors.push(`unknown_question:${id.slice(0,32)}`); continue; }
    if (!path.includes(id)) { errors.push(`question_outside_path:${id}`); continue; }
    const q = resolveQuestion(id,answers,neutralQuestions);
    errors.push(...answerErrors(q,answer).map(error => `${error}:${id}`));
  }
  if (errors.length) return {ok:false,errors};
  const normalized = cleanAnswers(answers,neutralQuestions);
  const orderedSkipped = path.filter(id => skipped.includes(id));
  const orderedNeutral = NEUTRAL_QUESTION_IDS.filter(id => neutralQuestions.includes(id));
  const data = {
    schemaVersion:SCHEMA_VERSION,surveyVersion:SURVEY_VERSION,submissionId:payload.submissionId.toLowerCase(),consent:true,
    answers:normalized,skipped:orderedSkipped,neutralQuestions:orderedNeutral,
    route:getRoute(normalized),eligibility:getEligibility(normalized),
    responses:Object.keys(QUESTIONS).map(id => recordQuestion(id,normalized,orderedSkipped,orderedNeutral,path))
  };
  if (own(payload,'durationSeconds')) data.durationSeconds = payload.durationSeconds;
  return {ok:true,data};
}
