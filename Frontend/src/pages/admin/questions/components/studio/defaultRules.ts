import { QuestionParsingRule } from '@/services/parsing-rules.service';

export const DEFAULT_CLIENT_RULES: QuestionParsingRule[] = [
  {
    "ruleCode": "GENERAL_UNIVERSAL_INGESTION",
    "ruleName": "Quy Tắc Khảo Thí Phổ Quát Đa Ngôn Ngữ (General Universal Exam Ingestion)",
    "targetExamType": "GENERAL",
    "language": "all",
    "priority": 1,
    "isActive": true,
    "description": "Bộ quy tắc nhận diện và trích xuất chuẩn hóa quốc tế cho mọi cấu trúc đề thi đa cấp độ (Đề - Phần - Tiểu phần - Chỉ thị cụm câu - Câu - Ý), hỗ trợ đa ngôn ngữ (vi, en, fr, de, zh, ja, ko) và bóc tách bảng đáp án ma trận thông minh.",
    "anchorSpec": {
      "regexPattern": "^\\[?\\s*(?:(?:Câu(?:\\s+hỏi)?|Question|Item|Bài|Task|Exercise|Problem|Aufgabe|Exercice|Domanda|Pregunta)(?:\\s+(?:số|no\\.?|number))?|第|Q)\\s*#?(\\d+)(?:\\s*\\([^)]*\\))?(?:[\\.\\:\\-–—\\)]|\\s*[\\.\\:\\-–—\\)]|\\s*$)",
      "questionNumberGroupIndex": 1,
      "sectionMarkers": [
        "PHẦN I",
        "PART I",
        "PHẦN 1",
        "SECTION I",
        "PHẦN II",
        "PART II",
        "PHẦN 2",
        "SECTION II",
        "PHẦN III",
        "PART III",
        "PHẦN 3",
        "SECTION III",
        "PHẦN IV",
        "PART IV",
        "PHẦN 4",
        "SECTION IV",
        "TRẮC NGHIỆM",
        "TỰ LUẬN",
        "TRẢ LỜI NGẮN",
        "ĐÚNG SAI"
      ]
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true,
      "autoTerminateOnNextSection": true,
      "readingPassageStartRegex": "^\\[?\\s*(?:Tiểu\\s*phần\\s*[\\dIVX]+|Chỉ\\s*thị\\s*làm\\s*bài(?:\\s*\\d+)?|Read\\s+(?:the\\s+)?(?:following\\s+)?passage|Đọc\\s+đoạn\\s+văn\\s+sau|Đọc\\s+thông\\s*tin)",
      "readingPassageRangeRegex": "\\b(?:from|từ(?:\\s+câu(?:\\s+số)?)?)\\s*(\\d+)\\s*(?:to|đến(?:\\s+câu(?:\\s+số)?)?)\\s*(\\d+)\\b",
      "subSectionDirectivePatterns": [
        "^\\[?\\s*(?:Tiểu\\s*phần|Mục|Sub[\\-\\s]*section|Sub[\\-\\s]*part|Sous[\\-\\s]*partie|小节)\\s*(?:số\\s*|no\\.?\\s*)?([\\dIVX]+|[A-Z])\\b"
      ],
      "instructionDirectivePatterns": [
        "^\\[?\\s*(?:Chỉ\\s*thị(?:\\s*làm\\s*bài)?|Hướng\\s*dẫn\\s*làm\\s*bài|Directive|Instructions?|Consigne|指令)\\s*(?:\\d+)?\\b"
      ],
      "directiveQuestionTypeMap": {
        "MULTI_TRUE_FALSE": [
          "(?i)(?:chọn\\s+đúng\\s+hoặc\\s+sai|xét\\s+tính\\s+đúng\\s*[\\-\\/\\s]*sai|trong\\s+mỗi\\s+ý\\s+a\\s*[\\),]|trắc\\s+nghiệm\\s+đúng\\s*[\\-\\/\\s]*sai)",
          "(?i)(?:indicate\\s+whether\\s+each\\s+of\\s+the\\s+following\\s+statements?\\s+is\\s+true\\s+or\\s+false|mark\\s+true\\s+or\\s+false|true\\s*\\/\\s*false\\s+matrix|判断题)"
        ],
        "SHORT_ANSWER": [
          "(?i)(?:thí\\s+sinh\\s+trả\\s+lời\\s+ngắn|câu\\s+trắc\\s+nghiệm\\s+trả\\s+lời\\s+ngắn|điền\\s+(?:đáp\\s+số|kết\\s+quả|số\\s+thích\\s+hợp)|trả\\s+lời\\s+ngắn\\s+gọn)",
          "(?i)(?:write\\s+your\\s+(?:short\\s+)?answer|fill\\s+in\\s+the\\s+(?:blank|box)\\s+with\\s+a\\s+number|grid[\\-\\s]*in\\s+questions?|short\\s+answer\\s+questions?|填空题)"
        ],
        "ORDERING": [
          "(?i)(?:sắp\\s+xếp\\s+các\\s+(?:bước|câu|ý|sự\\s+kiện|giai\\s+đoạn)|sắp\\s+xếp\\s+theo\\s+thứ\\s+tự\\s*(?:tăng\\s+dần|giảm\\s+dần|đúng|logic|thời\\s+gian)?|xếp\\s+theo\\s+trình\\s+tự)",
          "(?i)(?:put\\s+the\\s+(?:sentences|steps|events)\\s+in\\s+(?:the\\s+)?correct\\s+order|arrange\\s+the\\s+following\\s+in\\s+(?:chronological|logical)\\s+order|order\\s+the\\s+steps|排序题)"
        ],
        "MATCHING": [
          "(?i)(?:ghép\\s+(?:nội\\s+dung\\s+)?cột\\s+A\\s+với\\s+cột\\s+B|nối\\s+mỗi\\s+ý\\s+ở\\s+cột|ghép\\s+đôi\\s+tương\\s+ứng|nối\\s+cặp\\s+tương\\s+ứng)",
          "(?i)(?:match\\s+each\\s+(?:item|heading|statement)\\s+in\\s+(?:column|list)\\s+A\\s+with|matching\\s+questions?|配对题|连线题)"
        ],
        "MULTI": [
          "(?i)(?:chọn\\s+(?:tất\\s+cả\\s+các|nhiều|các)\\s+(?:phương\\s+án|đáp\\s+án)\\s+đúng|có\\s+thể\\s+chọn\\s+nhiều\\s+hơn\\s+một\\s+(?:phương\\s+án|đáp\\s+án)|chọn\\s+từ\\s+2\\s+đáp\\s+án\\s+trở\\s+lên|trắc\\s+nghiệm\\s+nhiều\\s+đáp\\s+án)",
          "(?i)(?:select\\s+all\\s+that\\s+apply|choose\\s+(?:all\\s+correct\\s+answers|two\\s+or\\s+more\\s+options|multiple\\s+options)|multiple[\\-\\s]*response|多项选择|多选题)"
        ],
        "FILL_BLANK": [
          "(?i)(?:điền\\s+từ\\s+thích\\s+hợp\\s+vào\\s+chỗ\\s+trống|hoàn\\s+thành\\s+câu\\s+bằng\\s+cách\\s+điền\\s+vào\\s+ô\\s+trống)",
          "(?i)(?:fill\\s+in\\s+each\\s+blank\\s+with\\s+(?:one\\s+)?suitable\\s+word|complete\\s+the\\s+sentences?\\s+by\\s+filling\\s+in\\s+the\\s+blanks?|选词填空)"
        ],
        "ESSAY": [
          "(?i)(?:phần\\s+tự\\s+luận|trình\\s+bày\\s+lời\\s+giải\\s+chi\\s+tiết|viết\\s+bài\\s+luận|chứng\\s+minh\\s+rằng\\s+các\\s+mệnh\\s+đề\\s+sau|giải\\s+các\\s+bài\\s+toán\\s+tự\\s+luận)",
          "(?i)(?:write\\s+an\\s+essay|free[\\-\\s]*response\\s+questions?|show\\s+all\\s+your\\s+work\\s+and\\s+explain|解答题|论述题)"
        ],
        "SINGLE": [
          "(?i)(?:mỗi\\s+câu\\s+(?:hỏi\\s+)?(?:thí\\s+sinh\\s+)?chỉ\\s+chọn\\s+một\\s+phương\\s+án|chọn\\s+(?:một\\s+)?(?:phương\\s+án|đáp\\s+án)\\s+(?:trả\\s+lời\\s+)?đúng\\s*(?:nhất)?|khoanh\\s+tròn\\s+vào\\s+chữ\\s+cái\\s+đứng\\s+trước\\s+câu\\s+trả\\s+lời\\s+đúng)",
          "(?i)(?:mark\\s+the\\s+letter\\s+A\\s*,\\s*B\\s*,\\s*C\\s*(?:,?\\s*or\\s*D|,\\s*D\\s*,?\\s*or\\s*E)|choose\\s+the\\s+(?:best|correct)\\s+(?:answer|option)|for\\s+each\\s+question\\s*,\\s*choose\\s+only\\s+one|单项选择|单选题)"
        ]
      }
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^\\[?\\s*(?:Phương\\s*án(?:\\s*trả\\s*lời)?\\s*|Option\\s*)?(?:([A-H])|[(]([A-H])[)]|[【]([A-H])[】])[\\.\\:\\)\\s\\-]+(.*)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 4
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:ĐÁP\\s*ÁN|ANSWER|KEY|CHỌN|RÉPONSE|ANTWORT|答案)[\\.\\:\\s\\-]+([A-H0-9a-h\\,\\sĐSđsTFtf]+)",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^\\[?\\s*(?:Lời\\s*giải|Hướng\\s*dẫn(?:\\s*(?:giải|chấm))?|HD|Giải\\s*thích|Explanation|Rationale|Rubric|Marking\\s*Scheme|Solution|Explication|Lösung|解析)\\b",
      "criticalQuestionMarkerRegex": "(?:\\[\\s*ĐIỂM\\s*LIỆT\\s*\\]|⚠️|TỬ\\s*THẦN|\\bCRITICAL\\b|\\bFATAL\\b)",
      "criticalMarkers": [
        "(?:\\bDIEM[_\\s]*LIET\\b|\\bĐIỂM[_\\s]*LIỆT\\b|mất\\s*an\\s*toàn\\s*giao\\s*thông\\s*nghiêm\\s*trọng|bị\\s*nghiêm\\s*cấm|\\bnghiêm\\s*cấm\\b|nồng\\s*độ\\s*cồn|sử\\s*dụng\\s*ma\\s*túy|đua\\s*xe\\s*trái\\s*phép)",
        "(?:\\bFATAL\\b|\\bCRITICAL\\b|\\bMANDATORY\\b|\\bEMERGENCY\\b)"
      ],
      "scoreStrategy": "ALL_OR_NOTHING"
    }
  },
  {
    "ruleCode": "VN_STANDARD_MULTIPLE_CHOICE",
    "ruleName": "Trắc Nghiệm Đơn Tiêu Chuẩn (A/B/C/D/E)",
    "targetExamType": "GENERAL",
    "language": "vi",
    "priority": 10,
    "isActive": true,
    "description": "Nhận diện câu hỏi trắc nghiệm truyền thống 4-8 phương án A..H chuẩn Việt Nam.",
    "anchorSpec": {
      "regexPattern": "^\\[?\\s*(?:(?:Câu(?:\\s+hỏi)?|Question|Item|Bài)(?:\\s+(?:số|no\\.?|number))?|Q)\\s*#?(\\d+)",
      "questionNumberGroupIndex": 1,
      "sectionMarkers": [
        "PHẦN I",
        "PART I",
        "PHẦN 1",
        "TRẮC NGHIỆM"
      ]
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^\\[?\\s*(?:Phương\\s*án(?:\\s*trả\\s*lời)?\\s*|Option\\s*)?(?:([A-H])|[(]([A-H])[)])[\\.\\:\\)\\s\\-]+(.*)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 3
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:ĐÁP\\s*ÁN|ANSWER|KEY|CHỌN)[\\.\\:\\s\\-]+([A-H0-9a-h\\,\\s]+)",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^\\[?\\s*(?:Lời\\s*giải|Hướng\\s*dẫn(?:\\s*giải)?|HD|Giải\\s*thích|Explanation|Căn\\s*cứ)\\b",
      "criticalQuestionMarkerRegex": "(?:\\bĐIỂM\\s*LIỆT\\b|⚠️|TỬ\\s*THẦN)"
    }
  },
  {
    "ruleCode": "VN_GDPT_2025_TRUE_FALSE_MATRIX",
    "ruleName": "Trắc Nghiệm Đúng / Sai Đa Mệnh Đề (GDPT 2025)",
    "targetExamType": "GDPT_2025",
    "language": "vi",
    "priority": 20,
    "isActive": true,
    "description": "Nhận diện Phần II: Câu hỏi trắc nghiệm Đúng / Sai với 4 ý độc lập a, b, c, d chuẩn GDPT 2018 áp dụng từ 2025.",
    "anchorSpec": {
      "regexPattern": "^(?:Câu|Question)\\s*(\\d+)",
      "questionNumberGroupIndex": 1,
      "sectionMarkers": [
        "PHẦN II",
        "PART II",
        "PHẦN 2",
        "TRẮC NGHIỆM ĐÚNG SAI",
        "ĐÚNG SAI"
      ]
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "TRUE_FALSE",
      "optionRegexPattern": "^(?:([a-d])|[(]([a-d])[)])[\\.\\:\\)\\s\\-]+(.*)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 3,
      "trueFalseSubItemRegex": "^(?:([a-d])|[(]([a-d])[)])[\\.\\:\\)\\s\\-]+(.*)$"
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:ĐÁP\\s*ÁN|ANSWER|KEY)[\\.\\:\\s\\-]+([a-d\\:\\sĐSđsTFtf\\,\\;]+)",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:Lời\\s*giải|Hướng\\s*dẫn|HD|Giải\\s*thích)\\b"
    }
  },
  {
    "ruleCode": "VN_GDPT_2025_SHORT_ANSWER",
    "ruleName": "Trắc Nghiệm Trả Lời Ngắn / Điền Số (GDPT 2025)",
    "targetExamType": "GDPT_2025",
    "language": "vi",
    "priority": 30,
    "isActive": true,
    "description": "Nhận diện Phần III: Câu hỏi trắc nghiệm trả lời ngắn, thí sinh tự điền đáp số số học chuẩn GDPT 2025.",
    "anchorSpec": {
      "regexPattern": "^(?:Câu|Question)\\s*(\\d+)",
      "questionNumberGroupIndex": 1,
      "sectionMarkers": [
        "PHẦN III",
        "PART III",
        "PHẦN 3",
        "TRẢ LỜI NGẮN",
        "ĐIỀN ĐÁP SỐ"
      ]
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SHORT_ANSWER",
      "optionRegexPattern": "^(?:([A-D])|[(]([A-D])[)])[\\.\\:\\s\\-]+(.*)$"
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:ĐÁP\\s*ÁN|ANSWER|KEY|KẾT\\s*QUẢ)[\\.\\:\\s\\-]+([\\-\\+]?\\d+[\\,\\.]?\\d*)",
      "answerGroupIndex": 1
    }
  },
  {
    "ruleCode": "GPLX_NATIONAL_DRIVING_TEST",
    "ruleName": "Sát Hạch Lái Xe Quốc Gia (GPLX 600 Câu & Điểm Liệt)",
    "targetExamType": "GPLX",
    "language": "vi",
    "priority": 40,
    "isActive": true,
    "description": "Nhận diện đề thi giấy phép lái xe 600 câu, tự động phát hiện câu điểm liệt tử thần.",
    "anchorSpec": {
      "regexPattern": "^(?:Câu|Question)\\s*(\\d+)",
      "questionNumberGroupIndex": 1
    },
    "stimulusSpec": {
      "supportMathTypeWmf": false,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^(?:([1-4])|([A-D]))[\\.\\:\\s\\-]+(.*)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 3
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:ĐÁP\\s*ÁN|CHỌN)[\\.\\:\\s\\-]+([1-4A-D])",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:Giải\\s*thích|Khẩu\\s*quyết|Căn\\s*cứ|Mẹo)\\b",
      "criticalQuestionMarkerRegex": "(?:\\bĐIỂM\\s*LIỆT\\b|⚠️|TỬ\\s*THẦN)"
    }
  },
  {
    "ruleCode": "INTERNATIONAL_SAT_LOGIC",
    "ruleName": "Khảo Thí Quốc Tế SAT / GRE Logic (Format Không Dấu Chấm)",
    "targetExamType": "SAT",
    "language": "en",
    "priority": 50,
    "isActive": true,
    "description": "Nhận diện đề thi quốc tế định dạng Task #[0-9] và [Option] không cần dấu chấm.",
    "anchorSpec": {
      "regexPattern": "^(?:Task|Problem)\\s*#?(\\d+)",
      "questionNumberGroupIndex": 1
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^\\[([A-D])\\]\\s*(.*)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 2
    },
    "evaluationSpec": {
      "answerRegexPattern": "^\\[(?:Key|Truth|Answer)\\s*\\:\\s*([A-D])\\]",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^\\[(?:Rationale|Explanation)\\]"
    }
  },
  {
    "ruleCode": "CHINA_GAOKAO_STANDARD",
    "ruleName": "Cao Khảo Trung Quốc (Gaokao)",
    "targetExamType": "GAOKAO",
    "language": "zh",
    "priority": 60,
    "isActive": true,
    "description": "Nhận diện đề thi tuyển sinh đại học quốc gia Trung Quốc với 第X题 hoặc X.",
    "anchorSpec": {
      "regexPattern": "^(?:第\\s*([0-9一二三四五六七八九十]+)\\s*题|(\\d+)[\\.\\、\\:\\s\\-])",
      "questionNumberGroupIndex": 2
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^([A-Da-d])[\\.\\、\\)\\s]+(.+)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 2
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:答案|参考答案|正确答案)[\\s\\:：]+([A-Da-d])",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:解析|详解|解题思路)[\\s\\:：]"
    }
  },
  {
    "ruleCode": "KOREA_SUNEUNG_STANDARD",
    "ruleName": "Đại Học Tu Học Năng Lực Hàn Quốc (Suneung CSAT)",
    "targetExamType": "SUNEUNG",
    "language": "ko",
    "priority": 70,
    "isActive": true,
    "description": "Nhận diện đề thi đại học Hàn Quốc (Suneung CSAT) với phương án khoanh số tròn ①-⑤.",
    "anchorSpec": {
      "regexPattern": "^(?:문\\s*제\\s*(\\d+)|(\\d+)[\\.\\:\\s\\-])",
      "questionNumberGroupIndex": 2
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^([①②③④⑤]|\\([1-5]\\)|[1-5]\\.)\\s*(.+)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 2
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:정답|답|정\\s*답)[\\s\\:：]+([①②③④⑤1-5])",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:해설|풀이)[\\s\\:：]"
    }
  },
  {
    "ruleCode": "JAPAN_JCEE_STANDARD",
    "ruleName": "Kỳ Thi Tuyển Sinh ĐH Nhật Bản (JCEE)",
    "targetExamType": "JCEE",
    "language": "ja",
    "priority": 80,
    "isActive": true,
    "description": "Nhận diện đề thi Đại học Nhật Bản với 問X và 正解.",
    "anchorSpec": {
      "regexPattern": "^(?:第\\s*(\\d+)\\s*問|問\\s*(\\d+)[\\.\\:\\s\\-])",
      "questionNumberGroupIndex": 2
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^([①②③④⑤]|\\([1-5]\\)|[1-5]\\.)\\s*(.+)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 2
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:正解|解答)[\\s\\:：]+([①②③④⑤1-5\\(\\)]+)",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:解説|ヒント)[\\s\\:：]"
    }
  },
  {
    "ruleCode": "GERMANY_ABITUR_STANDARD",
    "ruleName": "Kỳ Thi Tú Tài Quốc Gia Đức (Abitur)",
    "targetExamType": "ABITUR",
    "language": "de",
    "priority": 82,
    "isActive": true,
    "description": "Nhận diện đề thi tốt nghiệp trung học Đức (Abitur) với Aufgabe / Frage và Lösung.",
    "anchorSpec": {
      "regexPattern": "^(?:Aufgabe|Frage)\\s+(\\d+)[\\.\\:\\s\\-]+",
      "questionNumberGroupIndex": 1
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^([A-Da-d])[\\.\\)\\s]+(.+)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 2
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:Lösung|Antwort|Richtige\\s+Antwort)[\\s:]+([A-Da-d])",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:Erklärung|Lösungsweg|Begründung)[\\s:]"
    }
  },
  {
    "ruleCode": "FRANCE_BACCALAUREAT_STANDARD",
    "ruleName": "Kỳ Thi Tú Tài Pháp (Baccalauréat BAC)",
    "targetExamType": "BACCALAUREAT",
    "language": "fr",
    "priority": 85,
    "isActive": true,
    "description": "Nhận diện đề thi tú tài Pháp với Question X và Réponse.",
    "anchorSpec": {
      "regexPattern": "^(?:Question|Exercice)\\s+(\\d+)[\\.\\:\\s\\-]+",
      "questionNumberGroupIndex": 1
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^([A-Da-d])[\\.\\)\\s]+(.+)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 2
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:Réponse|Réponse correcte|Answer)[\\s:]+([A-Da-d])",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:Explication|Justification|Correction)[\\s:]"
    }
  },
  {
    "ruleCode": "CAMBRIDGE_A_LEVELS_STANDARD",
    "ruleName": "Khảo Thí Cambridge Quốc Tế (Cambridge A/AS Levels & IGCSE)",
    "targetExamType": "CAMBRIDGE",
    "language": "en",
    "priority": 88,
    "isActive": true,
    "description": "Nhận diện đề thi Cambridge International với Question X và Mark scheme.",
    "anchorSpec": {
      "regexPattern": "^(?:Question|Problem)\\s*(\\d+)[\\.\\:\\s\\-]+",
      "questionNumberGroupIndex": 1
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^[(]?([a-d]|[A-D])[)][\\.\\s]+(.+)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 2
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:Answer|Mark scheme|Key)[\\s:]+[(]?([a-d]|[A-D])[)]?",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:Guidance|Examiner(?:'s)? Report|Note)[\\s:]"
    }
  },
  {
    "ruleCode": "INTERNATIONAL_IELTS_TOEFL",
    "ruleName": "Luyện Thi Quốc Tế IELTS / TOEFL Academic",
    "targetExamType": "IELTS",
    "language": "en",
    "priority": 90,
    "isActive": true,
    "description": "Nhận diện cấu trúc đề thi IELTS / TOEFL Academic Reading & Listening.",
    "anchorSpec": {
      "regexPattern": "^(?:Question|Q\\.?|Item)\\s+(\\d+)[-\\.:\\s]+",
      "questionNumberGroupIndex": 1
    },
    "stimulusSpec": {
      "supportMathTypeWmf": false,
      "supportVectorSvg": true,
      "extractInlineImages": true
    },
    "interactionSpec": {
      "defaultQuestionType": "SINGLE",
      "optionRegexPattern": "^([A-Da-d])[\\.\\)\\s]+(.+)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 2
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:Answer|Key|Correct Answer)[:\\s]+([A-Da-dTFNG]+)",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:Explanation|Rationale|Script)[:\\s]"
    }
  },
  {
    "ruleCode": "VN_HIERARCHICAL_STEPPED_ESSAY",
    "ruleName": "Tự Luận & Barem Điểm Đa Bước (THCS / THPT / Tuyển Sinh 10)",
    "targetExamType": "ESSAY",
    "language": "vi",
    "priority": 95,
    "isActive": true,
    "description": "Nhận diện câu hỏi Tự luận có barem điểm chia nhỏ từng bước (0.25đ, 0.5đ, 1.0đ) cho môn Toán, Vật lý, Hóa học, Tin học, Ngữ văn.",
    "anchorSpec": {
      "regexPattern": "^(?:Câu|Bài|Problem|Exercise|Aufgabe|Exercice)\\s*(\\d+)(?:[\\\\.\\\\:\\\\-–—\\\\)]|\\\\s*[\\\\.\\\\:\\\\-–—\\\\)]|\\\\s*$)",
      "questionNumberGroupIndex": 1,
      "sectionMarkers": [
        "TỰ LUẬN",
        "PHẦN TỰ LUẬN",
        "BÀI TẬP TỰ LUẬN",
        "ESSAY"
      ]
    },
    "stimulusSpec": {
      "supportMathTypeWmf": true,
      "supportVectorSvg": true,
      "extractInlineImages": true,
      "autoTerminateOnNextSection": true
    },
    "interactionSpec": {
      "defaultQuestionType": "ESSAY",
      "optionRegexPattern": "^(?:([a-d1-4])|[(]([a-d1-4])[)])[\\.\\:\\)\\s\\-]+(.*)$",
      "optionLabelGroupIndex": 1,
      "optionContentGroupIndex": 3
    },
    "evaluationSpec": {
      "answerRegexPattern": "^(?:ĐÁP\\s*ÁN|ANSWER|KEY|CHỌN)[\\.\\:\\s\\-]+([A-D0-9a-d\\,\\s]+)",
      "answerGroupIndex": 1,
      "explanationRegexPattern": "^(?:Lời\\s*giải|Hướng\\s*dẫn\\s*chấm|Biểu\\s*điểm|Đáp\\s*án|HD)\\b"
    }
  }
];
