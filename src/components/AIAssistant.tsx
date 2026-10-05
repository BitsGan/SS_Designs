import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CanvasSnapshot, AIActionCommand } from '../types';
import { Sparkles, X, Send, Bot, User, Trash2, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface AIAssistantProps {
  canvasSnapshot: CanvasSnapshot;
  onExecuteAction: (action: AIActionCommand) => void;
}

const QUICK_CHIPS = [
  { label: '🏠 Floor plan guide', prompt: 'How do I start drafting a balanced architectural floor plan?' },
  { label: '🔍 Analyse design', prompt: 'Please analyse my current canvas design, check room dimensions, flow, and provide architectural critique.' },
  { label: '⚡ Auto-build 3BHK Villa', prompt: 'Add a complete 3-bedroom modern apartment floor plan with living room, kitchen, and bathroom for me.' },
  { label: '🛏 Master Suite tips', prompt: 'What are the standard dimensions and best design practices for master bedrooms and en-suites?' },
  { label: '🕶 Switch to 3D View', prompt: 'Switch the view to 3D holographic mode to inspect room elevations.' },
  { label: '✋ Gesture controls guide', prompt: 'Explain all the hand gesture controls available in SS Design Studio.' },
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ canvasSnapshot, onExecuteAction }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastActionNotification, setLastActionNotification] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'msg_welcome',
          role: 'assistant',
          content: `### ✦ Hello! I'm ARIA\n\nYour AI architectural design assistant. I can see your canvas has **${canvasSnapshot.elementCount} element(s)** with **${canvasSnapshot.rooms.length} registered room(s)**.\n\nI can analyze spatial flow, verify standard clearances, suggest layout improvements, and execute drafting actions directly onto your canvas.\n\n*Try asking a question below or click a quick prompt to start!*`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [canvasSnapshot.elementCount, canvasSnapshot.rooms.length]);

  const triggerAction = (action: AIActionCommand, label?: string) => {
    sound.playSuccess();
    onExecuteAction(action);
    const actionDesc = label || action.label || (action.type === 'loadTemplate' ? 'Loaded template floor plan' : action.type === 'setMode' ? `Switched to ${action.mode} view` : `Executed ${action.type}`);
    setLastActionNotification(`✦ Applied: ${actionDesc}`);
    setTimeout(() => setLastActionNotification(null), 3500);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal.trim();
    if (!text || isTyping) return;

    if (!textToSend) setInputVal('');

    sound.playClick();

    const userMsg: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          canvasState: canvasSnapshot,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const rawText = data.text || "I've analyzed your layout. Let me know what specific changes you'd like to make.";

      // Check and execute action blocks
      const actionMatch = rawText.match(/```action\n([\s\S]*?)```/);
      const cleanText = rawText.replace(/```action[\s\S]*?```/g, '').trim();

      if (actionMatch) {
        const actionLines = actionMatch[1].trim().split('\n').filter((l: string) => l.trim());
        actionLines.forEach((line: string) => {
          try {
            const action: AIActionCommand = JSON.parse(line);
            triggerAction(action);
          } catch (e) {
            console.warn('Action parse error:', e);
          }
        });
      }

      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: cleanText || rawText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `**Design Connection Error:** Could not connect to AI reasoning service. Please check your network or try again shortly.\n\n_${err.message}_`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    sound.playDelete();
    setMessages([
      {
        id: 'msg_welcome_' + Date.now(),
        role: 'assistant',
        content: `### ✦ ARIA Assistant Ready\n\nChat history cleared. Canvas currently contains **${canvasSnapshot.elementCount} elements**. How can I assist your drafting next?`,
        timestamp: Date.now(),
      },
    ]);
  };

  const renderFormattedMessage = (content: string) => {
    let formatted = content
      .replace(/^### (.*$)/gim, '<div class="font-bold text-indigo-300 text-xs mt-1 mb-1 border-b border-indigo-500/20 pb-0.5">$1</div>')
      .replace(/^## (.*$)/gim, '<div class="font-bold text-indigo-200 text-sm mt-1 mb-1">$1</div>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-200 font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
      .replace(/^\s*-\s+(.*$)/gim, '<div class="flex items-start gap-1.5 my-0.5"><span class="text-indigo-400 font-bold">•</span><span>$1</span></div>')
      .replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div class="flex items-start gap-1.5 my-0.5"><span class="text-indigo-400 font-mono text-[10px] font-bold">$1.</span><span>$2</span></div>')
      .replace(/\n/g, '<br />');

    // Parse interactive action buttons [▶ Button Label](action_json)
    formatted = formatted.replace(/\[▶ (.*?)\]\((.*?)\)/g, (_, label, actionStr) => {
      return `<button class="inline-flex items-center gap-1 my-1 mr-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-950 to-purple-950 hover:from-indigo-900 hover:to-purple-900 border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 text-[10px] font-mono cursor-pointer transition-all shadow-sm active:scale-95" data-action='${actionStr}'>▶ ${label}</button>`;
    });

    return formatted;
  };

  const handleMessageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('button[data-action]');
    if (btn) {
      const actionStr = btn.getAttribute('data-action');
      const labelText = btn.textContent?.replace(/^▶\s*/, '') || undefined;
      if (actionStr) {
        try {
          const action = JSON.parse(actionStr);
          triggerAction(action, labelText);
        } catch (err) {
          console.warn('Action click parse error:', err);
        }
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5 select-none">
      {/* Toast notification for actions executed on canvas */}
      {lastActionNotification && (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/50 rounded-xl text-[11px] font-dm-mono text-indigo-200 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
          <span>{lastActionNotification}</span>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-[#0a0c1a]/95 border border-indigo-500/40 rounded-2xl flex flex-col shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="h-12 px-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-[#4fc3f7]/10 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-indigo-100" />
              </div>
              <div>
                <div className="font-bebas text-base tracking-[1.5px] text-indigo-200 leading-none">
                  ARIA · AI ARCHITECT
                </div>
                <div className="text-[9px] font-dm-mono text-[#10b981] flex items-center gap-1 leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Online · Generative CAD
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear chat history"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Question Chips */}
          <div className="flex gap-1.5 p-2 overflow-x-auto custom-scrollbar border-b border-indigo-500/15 shrink-0 bg-indigo-950/20">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isTyping}
                className="px-2.5 py-1 rounded-full text-[10px] font-dm-mono bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div
            onClick={handleMessageClick}
            className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 text-xs font-dm-sans text-slate-200"
          >
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 items-start ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                      isAi
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm'
                        : 'bg-[#4fc3f7]/20 border border-[#4fc3f7]/40 text-[#4fc3f7]'
                    }`}
                  >
                    {isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl leading-relaxed text-[11.5px] ${
                      isAi
                        ? 'bg-indigo-950/40 border border-indigo-500/25 text-indigo-100 rounded-tl-sm'
                        : 'bg-[#4fc3f7]/10 border border-[#4fc3f7]/25 text-[#bae6fd] rounded-tr-sm'
                    }`}
                    dangerouslySetInnerHTML={{ __html: renderFormattedMessage(msg.content) }}
                  />
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-indigo-950/40 border border-indigo-500/25 px-3 py-2 rounded-xl flex items-center gap-1.5">
                  <span className="text-[10px] font-dm-mono text-indigo-300 mr-1">ARIA is reasoning</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-2.5 bg-indigo-950/30 border-t border-indigo-500/20 flex gap-2 shrink-0">
            <textarea
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask ARIA about room flow, clearances, auto-drafting…"
              className="flex-1 bg-indigo-950/40 border border-indigo-500/25 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none font-dm-sans max-h-20"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isTyping || !inputVal.trim()}
              className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 disabled:opacity-40 flex items-center justify-center text-white shrink-0 cursor-pointer transition-all self-end active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Trigger Floating Action Button */}
      <button
        onClick={() => {
          sound.playClick();
          setIsOpen(!isOpen);
        }}
        className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-[#4fc3f7] p-0.5 shadow-2xl hover:scale-105 transition-transform cursor-pointer relative animate-ai-pulse group"
        title="ARIA AI Architectural Assistant"
      >
        <div className="w-full h-full bg-[#0a0c1a]/30 rounded-full flex items-center justify-center text-white">
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
          )}
        </div>
        <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10b981] border-2 border-[#0d1117] animate-pulse" />
      </button>
    </div>
  );
};

