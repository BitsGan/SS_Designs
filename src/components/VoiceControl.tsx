import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';
import { AppMode, RoomType, ToolType } from '../types';

interface VoiceControlProps {
  isActive: boolean;
  onToggle: () => void;
  onExecuteVoiceCommand: (cmd: {
    action: string;
    roomType?: RoomType;
    tool?: ToolType;
    mode?: AppMode;
    prompt?: string;
  }) => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
  isActive,
  onToggle,
  onExecuteVoiceCommand,
}) => {
  const [transcript, setTranscript] = useState<string>('');
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Speech Recognition browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      if (isActive) {
        try {
          recognition.start();
        } catch (e) {
          // ignore restart errors
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript.toLowerCase().trim();
      setTranscript(text);

      if (event.results[current].isFinal) {
        processCommand(text);
      }
    };

    recognitionRef.current = recognition;

    if (isActive) {
      try {
        recognition.start();
        sound.playSuccess();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
    };
  }, [isActive]);

  const processCommand = (phrase: string) => {
    let feedback = '';

    if (phrase.includes('bedroom')) {
      onExecuteVoiceCommand({ action: 'addRoom', roomType: 'bedroom' });
      feedback = 'Drafting Bedroom';
    } else if (phrase.includes('living room') || phrase.includes('living')) {
      onExecuteVoiceCommand({ action: 'addRoom', roomType: 'living' });
      feedback = 'Drafting Living Room';
    } else if (phrase.includes('kitchen')) {
      onExecuteVoiceCommand({ action: 'addRoom', roomType: 'kitchen' });
      feedback = 'Drafting Kitchen';
    } else if (phrase.includes('bathroom') || phrase.includes('bath')) {
      onExecuteVoiceCommand({ action: 'addRoom', roomType: 'bathroom' });
      feedback = 'Drafting Bathroom';
    } else if (phrase.includes('pool') || phrase.includes('swimming')) {
      onExecuteVoiceCommand({ action: 'addRoom', roomType: 'pool' });
      feedback = 'Adding Swimming Pool';
    } else if (phrase.includes('garage') || phrase.includes('parking')) {
      onExecuteVoiceCommand({ action: 'addRoom', roomType: 'garage' });
      feedback = 'Drafting Garage';
    } else if (phrase.includes('3d') || phrase.includes('hologram')) {
      onExecuteVoiceCommand({ action: 'setMode', mode: '3d' });
      feedback = 'Switched to 3D Holographic View';
    } else if (phrase.includes('walkthrough') || phrase.includes('walk')) {
      onExecuteVoiceCommand({ action: 'startWalkthrough' });
      feedback = 'Initiating First-Person Walkthrough';
    } else if (phrase.includes('blueprint') || phrase.includes('2d')) {
      onExecuteVoiceCommand({ action: 'setMode', mode: 'blueprint' });
      feedback = 'Switched to 2D Blueprint View';
    } else if (phrase.includes('realistic')) {
      onExecuteVoiceCommand({ action: 'setMode', mode: 'realistic' });
      feedback = 'Switched to Realistic Render View';
    } else if (phrase.includes('door')) {
      onExecuteVoiceCommand({ action: 'setTool', tool: 'door' });
      feedback = 'Selected Door Tool';
    } else if (phrase.includes('window')) {
      onExecuteVoiceCommand({ action: 'setTool', tool: 'window' });
      feedback = 'Selected Window Tool';
    } else if (phrase.includes('wall')) {
      onExecuteVoiceCommand({ action: 'setTool', tool: 'wall' });
      feedback = 'Selected Wall Tool';
    } else if (phrase.includes('undo')) {
      onExecuteVoiceCommand({ action: 'undo' });
      feedback = 'Undid Last Action';
    } else if (phrase.includes('clear')) {
      onExecuteVoiceCommand({ action: 'clear' });
      feedback = 'Canvas Cleared';
    } else if (phrase.includes('analyze') || phrase.includes('audit')) {
      onExecuteVoiceCommand({ action: 'openAnalysis' });
      feedback = 'Opening Architectural Audit';
    } else if (phrase.includes('cost') || phrase.includes('estimate') || phrase.includes('boq')) {
      onExecuteVoiceCommand({ action: 'openBOQ' });
      feedback = 'Opening BOQ & Cost Estimation';
    } else if (phrase.includes('furnish') || phrase.includes('furniture')) {
      onExecuteVoiceCommand({ action: 'autoFurnish' });
      feedback = 'Smart Auto-Furnishing Floor Plan';
    } else if (phrase.includes('generate') || phrase.includes('villa') || phrase.includes('create house')) {
      onExecuteVoiceCommand({ action: 'openGenerator', prompt: phrase });
      feedback = 'Opening AI Generative Floorplan Engine';
    }

    if (feedback) {
      sound.playSuccess();
      setLastActionFeedback(`🎙 Command: "${feedback}"`);
      setTimeout(() => setLastActionFeedback(null), 3500);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-3 select-none">
      <div className="flex items-center gap-3 px-4 py-2 bg-[#0a0f1d]/95 border border-purple-500/50 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="relative flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-400 flex items-center justify-center text-purple-300">
            <Mic className="w-4 h-4 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-dm-mono font-bold text-purple-300 uppercase tracking-wider">
              Voice Architecture Assistant
            </span>
            <span className="text-[9px] font-dm-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Live Listening
            </span>
          </div>
          <div className="text-[11px] font-dm-sans text-slate-300 max-w-xs truncate">
            {transcript ? `"${transcript}"` : 'Say "Add living room", "Switch to 3D", "Auto furnish"...'}
          </div>
        </div>

        <button
          onClick={onToggle}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer ml-1"
          title="Deactivate Voice Control"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {lastActionFeedback && (
        <div className="px-3 py-1.5 bg-gradient-to-r from-purple-950 to-slate-900 border border-purple-500/40 rounded-xl text-[11px] font-dm-mono text-purple-200 shadow-xl flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{lastActionFeedback}</span>
        </div>
      )}
    </div>
  );
};
