import React, { useState } from 'react';
import { X, Bot, Send, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';

interface SocratesTutorModalProps {
  questionContent: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  onClose: () => void;
}

interface ChatMessage {
  sender: 'socrates' | 'student';
  text: string;
}

export const SocratesTutorModal: React.FC<SocratesTutorModalProps> = ({
  questionContent,
  userAnswer,
  correctAnswer,
  explanation,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'socrates',
      text: `Chào em! Thầy Socrates đây. Thầy thấy em vừa chọn phương án "${userAnswer}". Trước khi xem đáp án, em hãy nói cho thầy biết: Em dựa vào định lý hoặc dấu hiệu nào trong câu hỏi để chọn phương án này?`,
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    const studentText = inputVal.trim();
    setMessages((prev) => [...prev, { sender: 'student', text: studentText }]);
    setInputVal('');
    setIsTyping(true);

    // Mô phỏng phản biện biện chứng Socrates
    setTimeout(() => {
      let reply = '';
      if (studentText.toLowerCase().includes('không') || studentText.toLowerCase().includes('quên') || studentText.toLowerCase().includes('đoán')) {
        reply = 'Không sao cả! Mọi sai lầm đều là khởi đầu của trí tuệ. Em hãy nhìn lại điều kiện xác định của bài toán xem: ẩn số x có nằm dưới mẫu số hay dấu căn bậc hai không?';
      } else {
        reply = `Rất thú vị! Em đã nghĩ đến hướng đó. Nhưng nếu ta thử thay ngược giá trị vào phương trình ban đầu, vế trái và vế phải có thực sự bằng nhau không? Em hãy nhẩm thử xem!`;
      }
      setMessages((prev) => [...prev, { sender: 'socrates', text: reply }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl h-[85vh] max-h-[640px] flex flex-col rounded-3xl bg-slate-900 border border-violet-500/30 shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                Gia Sư Đối Thoại Biện Chứng Socrates AI <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[11px] text-slate-400">Dẫn dắt tự nhận thức — Không cho đáp án sẵn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung câu hỏi thu gọn */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 text-xs text-slate-300 max-h-24 overflow-y-auto">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Câu hỏi đang đối thoại:</span>
          <MathRenderer content={questionContent} />
        </div>

        {/* Khung chat đối thoại */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.sender === 'student' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                  m.sender === 'socrates' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-amber-300'
                }`}
              >
                {m.sender === 'socrates' ? '🏛️' : '🎓'}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'socrates'
                    ? 'bg-slate-800 border border-slate-700 text-slate-200'
                    : 'bg-violet-600 text-white font-medium'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              Thầy Socrates đang suy ngẫm câu trả lời của em...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Chia sẻ suy nghĩ của em với thầy Socrates..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!inputVal.trim()}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold transition shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

