import React, { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { GoogleGenAI } from "@google/genai";
import {
  Brain,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Languages,
  Check,
  AlertCircle,
  Clock,
  Calendar,
  Gamepad2,
  Flower2,
  Bell,
  HeartHandshake,
} from "lucide-react";

export type AssistantLanguage = "en-IN" | "hi-IN" | "as-IN";

interface ChatMessage {
  id: string;
  sender: "user" | "sahara";
  text: string;
  timestamp: string;
  targetScreen?: string;
  actionLabel?: string;
}

interface SaharaAiAssistantProps {
  onNav: (screen: any) => void;
  onBack: () => void;
}

const LANGUAGE_CONFIG: Record<
  AssistantLanguage,
  {
    label: string;
    nativeLabel: string;
    flag: string;
    placeholder: string;
    listening: string;
    processing: string;
    cantHear: string;
    micDenied: string;
    speakBtn: string;
    stopBtn: string;
    suggestions: { label: string; prompt: string }[];
    welcome: (name: string) => string;
  }
> = {
  "en-IN": {
    label: "English",
    nativeLabel: "English",
    flag: "🇬🇧",
    placeholder: "Type a message or tap mic to speak...",
    listening: "Listening... speak now",
    processing: "Processing your voice...",
    cantHear: "I couldn't hear you clearly. Please try again.",
    micDenied: "Microphone access was denied. Please allow microphone permissions or type below.",
    speakBtn: "Read aloud",
    stopBtn: "Stop speaking",
    suggestions: [
      { label: "🎮 What game to play?", prompt: "What memory game should I play today?" },
      { label: "⏰ My reminders", prompt: "What are my reminders and medicines today?" },
      { label: "🌸 Memory Garden", prompt: "Tell me about my Memory Garden" },
      { label: "💛 How are you?", prompt: "How are you doing today?" },
    ],
    welcome: (name: string) =>
      `Hello ${name || "there"}! I am Sahara, your AI companion. I'm right here to assist you, remind you of your activities, or just share a friendly chat. You can speak to me or type anytime!`,
  },
  "hi-IN": {
    label: "Hindi",
    nativeLabel: "हिंदी",
    flag: "🇮🇳",
    placeholder: "संदेश लिखें या बोलने के लिए माइक दबाएं...",
    listening: "सुन रही हूँ... अब बोलिए",
    processing: "आपकी आवाज़ समझी जा रही है...",
    cantHear: "मुझे आपकी आवाज़ साफ़ सुनाई नहीं दी। कृपया फिर से कोशिश करें।",
    micDenied: "माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया नीचे लिखकर संदेश भेजें।",
    speakBtn: "सुनें",
    stopBtn: "रोकें",
    suggestions: [
      { label: "🎮 आज कौन सा खेल खेलूँ?", prompt: "आज मुझे कौन सा मेमोरी गेम खेलना चाहिए?" },
      { label: "⏰ मेरी दवाइयाँ कब हैं?", prompt: "आज की मेरी दवाइयाँ और काम क्या हैं?" },
      { label: "🌸 मेमोरी गार्डन", prompt: "मुझे मेमोरी गार्डन के बारे में बताएं" },
      { label: "💛 आप कैसी हैं?", prompt: "नमस्ते सहारा, आज आप कैसी हैं?" },
    ],
    welcome: (name: string) =>
      `नमस्ते ${name ? name + " जी" : "जी"}! मैं सहारा हूँ, आपकी अपनी AI साथी। आज मैं आपकी क्या मदद कर सकती हूँ? आप मुझसे बोलकर या लिखकर बात कर सकते हैं!`,
  },
  "as-IN": {
    label: "Assamese",
    nativeLabel: "অসমীয়া",
    flag: "🇮🇳",
    placeholder: "বাৰ্তা লিখক বা ক'বলৈ মাইক্ৰ'ফোন টিপক...",
    listening: "শুনি আছোঁ... এতিয়া কওক",
    processing: "আপোনাৰ কথা বুজিবলৈ চেষ্টা কৰি আছোঁ...",
    cantHear: "মই স্পষ্টকৈ শুনি নাপালোঁ। অনুগ্ৰহ কৰি আকৌ এবাৰ চেষ্টা কৰক।",
    micDenied: "মাইক্ৰ'ফোনৰ অনুমতি দিয়া হোৱা নাই। অনুগ্ৰহ কৰি তলত লিখক।",
    speakBtn: "শুনক",
    stopBtn: "বন্ধ কৰক",
    suggestions: [
      { label: "🎮 আজি কি খেলিম?", prompt: "আজি মই কি স্মৃতি খেল খেলিম?" },
      { label: "⏰ মোৰ ঔষধৰ সময় কি?", prompt: "আজি মোৰ কি কি কাম আৰু ঔষধ আছে?" },
      { label: "🌸 স্মৃতি বাগিচা", prompt: "স্মৃতি বাগিচাৰ বিষয়ে কওক" },
      { label: "💛 আপোনাৰ কেনে লাগিছে?", prompt: "নমস্কাৰ চাহাৰা, আপোনাৰ কেনে লাগিছে?" },
    ],
    welcome: (name: string) =>
      `নমস্কাৰ ${name ? name + " ডাঙৰীয়া" : ""}! মই চাহাৰা, আপোনাৰ AI সংগী। আজি আপোনাৰ সহায়ৰ বাবে মই সাজু আছোঁ। আপুনি মোৰ সৈতে কথা পাতিব পাৰে বা লিখিব পাৰে!`,
  },
};

export function SaharaAiAssistant({ onNav, onBack }: SaharaAiAssistantProps) {
  const [language, setLanguage] = useState<AssistantLanguage>("en-IN");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechStatusMessage, setSpeechStatusMessage] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>("Ravi");
  const [pendingReminders, setPendingReminders] = useState<string[]>([]);
  const [playedGames, setPlayedGames] = useState<string[]>([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentLangConfig = LANGUAGE_CONFIG[language];

  // Scroll smoothly to bottom of chat
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isListening, isProcessing, speechStatusMessage]);

  // Load patient context from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    let isMounted = true;

    const loadContext = async () => {
      try {
        // Patient profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && isMounted) {
          const data = userDoc.data();
          const name = data?.name || data?.fullName;
          if (name) setPatientName(name);
        } else {
          const pDoc = await getDoc(doc(db, "patients", user.uid));
          if (pDoc.exists() && isMounted) {
            const data = pDoc.data();
            const name = data?.name || data?.fullName;
            if (name) setPatientName(name);
          }
        }

        // Reminders
        const remSnap = await getDoc(doc(db, "patients", user.uid, "reminders", "today"));
        if (remSnap.exists() && isMounted) {
          const data = remSnap.data();
          const remList = Array.isArray(data.reminders) ? data.reminders : [];
          const doneList = Array.isArray(data.done) ? data.done : [];
          const pending = remList
            .map((item: any, idx: number) => ({
              label: item.label || item.title || "Reminder",
              time: item.time || "",
              done: Boolean(doneList[idx]),
            }))
            .filter((item: any) => !item.done)
            .map((item: any) => (item.time ? `${item.label} at ${item.time}` : item.label));
          setPendingReminders(pending);
        }

        // Games played today
        const gamesSnap = await getDocs(collection(db, "patients", user.uid, "gameResults"));
        if (!gamesSnap.empty && isMounted) {
          const todayKey = new Date().toLocaleDateString("en-CA");
          const played = new Set<string>();
          gamesSnap.docs.forEach((d) => {
            const gd = d.data();
            const completedAt = gd.completedAt?.toDate?.() || (gd.completedAt instanceof Date ? gd.completedAt : null);
            if (completedAt) {
              const dKey = new Date(completedAt).toLocaleDateString("en-CA");
              if (dKey === todayKey && gd.gameName) {
                played.add(String(gd.gameName));
              }
            }
          });
          setPlayedGames(Array.from(played));
        }
      } catch (err) {
        console.warn("Context load notice:", err);
      }
    };

    loadContext();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize greeting message
  useEffect(() => {
    const firstName = patientName.trim().split(" ")[0] || "Ravi";
    const initialMsg: ChatMessage = {
      id: "initial-welcome",
      sender: "sahara",
      text: currentLangConfig.welcome(firstName),
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    setMessages([initialMsg]);
  }, [language, patientName]);

  // Clean up speech recognition & synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      isRecognizingRef.current = false;
    };
  }, []);

  // Stop browser speech synthesis
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingMessageId(null);
  };

  // Speak a message aloud
  const speakMessage = (messageId: string, text: string) => {
    if (playingMessageId === messageId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.88; // Gentle, slower speed for elderly listeners
      utterance.pitch = 1.02; // Warm tone

      utterance.onstart = () => {
        setPlayingMessageId(messageId);
      };
      utterance.onend = () => {
        setPlayingMessageId(null);
      };
      utterance.onerror = () => {
        setPlayingMessageId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      setPlayingMessageId(null);
    }
  };

  // Helper to detect navigation intents so Sahara can provide a 1-tap jump button
  const detectNavigationAction = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("memory match")) {
      return { targetScreen: "memory-match", actionLabel: "Play Memory Match 🎮" };
    }
    if (lower.includes("picture recall")) {
      return { targetScreen: "picture-recall", actionLabel: "Play Picture Recall 🖼️" };
    }
    if (lower.includes("familiar place")) {
      return { targetScreen: "familiar-place", actionLabel: "Play Familiar Place 🏡" };
    }
    if (lower.includes("memory garden") || lower.includes("garden") || lower.includes("স্মৃতি বাগিচা") || lower.includes("मेमोरी गार्डन")) {
      return { targetScreen: "memory-garden", actionLabel: "Open Memory Garden 🌸" };
    }
    if (lower.includes("reminder") || lower.includes("medicine") || lower.includes("दवाइयाँ") || lower.includes("ঔষধ")) {
      return { targetScreen: "reminders", actionLabel: "View Today's Reminders ⏰" };
    }
    return undefined;
  };

    // Send message to Sahara.AI using Gemini
  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isProcessing) return;

    stopSpeaking();
    setSpeechStatusMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("Gemini API key is missing.");
      }

      const ai = new GoogleGenAI({
        apiKey,
      });

      const conversationHistory = messages
        .filter((m) => m.id !== "initial-welcome")
        .slice(-6)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          text: m.text,
        }));

      const languageName =
        language === "hi-IN"
          ? "Hindi"
          : language === "as-IN"
          ? "Assamese"
          : "English";

      const systemInstruction = `
You are Sahara.AI, a warm, patient and elderly-friendly AI companion
inside MemoryNest, an AI-based cognitive assistance platform for elderly
users.

Patient:
- Name: ${patientName}
- Current language: ${languageName}

Today's pending reminders:
${pendingReminders.length > 0
  ? pendingReminders.map((r) => `- ${r}`).join("\n")
  : "- No pending reminders"}

Games completed today:
${playedGames.length > 0
  ? playedGames.map((g) => `- ${g}`).join("\n")
  : "- No games completed yet"}

Current date:
${new Date().toLocaleDateString([], {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
})}

Current time:
${new Date().toLocaleTimeString([], {
  hour: "numeric",
  minute: "2-digit",
})}

Rules:
1. Speak simply and warmly.
2. Keep responses short, usually 1-4 sentences.
3. Be encouraging and respectful.
4. Help with reminders, games, daily routines and Memory Garden.
5. Encourage cognitive activities when appropriate.
6. Never diagnose dementia or another medical condition.
7. Never invent medicines, doses, appointments, doctors or medical results.
8. If the user asks for emergency medical help, tell them to contact
   their caregiver, local emergency services or a medical professional.
9. Answer in ${languageName}.
10. Never claim that you called a caregiver or emergency service.
`;

      const historyText =
        conversationHistory.length > 0
          ? conversationHistory
              .map(
                (m) =>
                  `${m.role === "user" ? "User" : "Sahara"}: ${m.text}`
              )
              .join("\n")
          : "No previous conversation.";

      const prompt = `
${systemInstruction}

Previous conversation:
${historyText}

User's new message:
${trimmed}

Respond as Sahara.AI.
`;

      let result;

try {
  result = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
  });
} catch (firstError) {
  console.warn("Primary Gemini model unavailable, trying fallback:", firstError);

  result = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });
}

      const replyText =
        result.text?.trim() ||
        "I am right here with you. How can I help you today?";

      const navAction = detectNavigationAction(
        `${trimmed} ${replyText}`
      );

      const aiMessage: ChatMessage = {
        id: `sahara-${Date.now()}`,
        sender: "sahara",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
        targetScreen: navAction?.targetScreen,
        actionLabel: navAction?.actionLabel,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Automatically read Sahara's response aloud
      setTimeout(() => {
        speakMessage(aiMessage.id, aiMessage.text);
      }, 150);
    } catch (err: any) {
      console.error("Sahara Gemini error:", err);

      const fallbackReply =
        language === "hi-IN"
          ? "मैं आपके साथ हूँ। कृपया थोड़ी देर बाद फिर से पूछें।"
          : language === "as-IN"
          ? "মই আপোনাৰ লগত আছোঁ। অলপ পিছত আকৌ সোধক।"
          : "I am right here with you. Please try again in a moment.";

      const errorMessage: ChatMessage = {
        id: `sahara-error-${Date.now()}`,
        sender: "sahara",
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  // Start speech recognition
  const startListening = () => {
    stopSpeaking();
    setSpeechStatusMessage(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechStatusMessage("Speech recognition is not supported in this browser. Please type below.");
      return;
    }

    if (isRecognizingRef.current) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      isRecognizingRef.current = false;
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = language;
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      let capturedText = "";

      recognition.onstart = () => {
        isRecognizingRef.current = true;
        setIsListening(true);
        setSpeechStatusMessage(currentLangConfig.listening);
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const result = event.results[0][0]?.transcript || "";
          capturedText = result.trim();
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event?.error);
        isRecognizingRef.current = false;
        setIsListening(false);

        if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
          setSpeechStatusMessage(currentLangConfig.micDenied);
        } else if (event?.error === "no-speech") {
          setSpeechStatusMessage(currentLangConfig.cantHear);
        } else if (event?.error !== "aborted") {
          setSpeechStatusMessage(currentLangConfig.cantHear);
        }
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        setIsListening(false);

        if (capturedText) {
          setSpeechStatusMessage(currentLangConfig.processing);
          sendMessage(capturedText);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error("Speech recognition start failed:", err);
      isRecognizingRef.current = false;
      setIsListening(false);
      if (err?.name === "NotAllowedError") {
        setSpeechStatusMessage(currentLangConfig.micDenied);
      } else {
        setSpeechStatusMessage(currentLangConfig.cantHear);
      }
    }
  };

  const cancelListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    isRecognizingRef.current = false;
    setIsListening(false);
    setSpeechStatusMessage(null);
  };

  const handleClearChat = () => {
    stopSpeaking();
    cancelListening();
    const firstName = patientName.trim().split(" ")[0] || "Ravi";
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "sahara",
        text: currentLangConfig.welcome(firstName),
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFB] relative overflow-hidden select-none">
      {/* ─── STATUS BAR ─── */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 text-xs font-semibold text-[#37474F]">
        <span>9:41</span>
        <div className="flex gap-1.5 items-center">
          <span>●●●</span>
          <span>WiFi</span>
          <span>🔋</span>
        </div>
      </div>

      {/* ─── HEADER BAR: DEEP TEAL WITH SAHARA BRANDING ─── */}
      <div className="bg-gradient-to-r from-[#2E7D73] to-[#1A5C54] px-4 pt-2 pb-3.5 rounded-b-[28px] shadow-md z-20">
        <div className="flex items-center justify-between gap-2">
          {/* Back Button & Logo Brand */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                stopSpeaking();
                cancelListening();
                onBack();
              }}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner">
                <Brain className="w-6 h-6 text-[#A8DADB]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-white text-lg font-black tracking-tight leading-none">
                    SAHARA.AI
                  </h1>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[#D9F4F1] text-xs font-medium mt-0.5">
                  "Your AI Companion"
                </p>
              </div>
            </div>
          </div>

          {/* Action Tools: Language Selector & Clear Chat */}
          <div className="flex items-center gap-1.5">
            {/* Language Selector Button */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all active:scale-95"
                title="Change Language"
              >
                <span>{currentLangConfig.flag}</span>
                <span className="max-w-[50px] truncate">{currentLangConfig.nativeLabel}</span>
              </button>

              {/* Language Selection Menu Dropdown */}
              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
                  <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Language
                  </p>
                  {(Object.keys(LANGUAGE_CONFIG) as AssistantLanguage[]).map((langKey) => {
                    const cfg = LANGUAGE_CONFIG[langKey];
                    const isSelected = language === langKey;
                    return (
                      <button
                        key={langKey}
                        onClick={() => {
                          setLanguage(langKey);
                          setShowLanguageDropdown(false);
                          stopSpeaking();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
                          isSelected ? "bg-[#D9F4F1] text-[#2E7D73] font-bold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{cfg.flag}</span>
                          <span>{cfg.nativeLabel}</span>
                          <span className="text-[10px] text-slate-400">({cfg.label})</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2E7D73]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Clear conversation */}
            <button
              onClick={handleClearChat}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── CHAT MESSAGES STREAM ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const isPlaying = playingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-fade-in`}
            >
              <div
                className={`flex gap-2 max-w-[88%] ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E7D73] to-[#1A5C54] flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-0.5">
                    <Brain className="w-4 h-4 text-[#D9F4F1]" />
                  </div>
                )}

                {/* Message Card */}
                <div
                  className={`rounded-2xl px-4 py-3 shadow-xs ${
                    isUser
                      ? "bg-[#2E7D73] text-white rounded-tr-xs"
                      : "bg-white border border-[#D9F4F1] text-[#2C3E50] rounded-tl-xs shadow-sm"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed font-normal whitespace-pre-wrap select-text">
                    {msg.text}
                  </p>

                  {/* Target Screen Action Button (e.g. Play Memory Match, View Reminders) */}
                  {msg.targetScreen && msg.actionLabel && (
                    <button
                      onClick={() => onNav(msg.targetScreen)}
                      className="mt-2.5 w-full py-2 px-3 rounded-xl bg-[#2E7D73] text-white text-xs font-bold shadow-xs hover:bg-[#25665E] active:scale-98 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{msg.actionLabel}</span>
                    </button>
                  )}

                  {/* Message Footer: Timestamp & Read Aloud control */}
                  <div
                    className={`flex items-center justify-between gap-3 mt-1.5 text-[11px] ${
                      isUser ? "text-teal-100" : "text-slate-400"
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <button
                        onClick={() => speakMessage(msg.id, msg.text)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                          isPlaying
                            ? "bg-rose-100 text-rose-700 animate-pulse"
                            : "hover:bg-slate-100 text-[#2E7D73]"
                        }`}
                        title={isPlaying ? currentLangConfig.stopBtn : currentLangConfig.speakBtn}
                      >
                        {isPlaying ? (
                          <>
                            <VolumeX className="w-3 h-3" />
                            <span>{currentLangConfig.stopBtn}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>{currentLangConfig.speakBtn}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Typing / Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-slate-500 animate-fade-in pl-1">
            <div className="w-7 h-7 rounded-full bg-[#D9F4F1] flex items-center justify-center text-[#2E7D73]">
              <Brain className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="bg-white border border-[#D9F4F1] rounded-2xl px-3.5 py-2.5 rounded-tl-xs flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#2E7D73] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#2E7D73] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#2E7D73] animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="text-xs font-semibold text-[#2E7D73] ml-1.5">{currentLangConfig.processing}</span>
            </div>
          </div>
        )}

        {/* Speech Error / Status Notice */}
        {speechStatusMessage && !isListening && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 flex items-start gap-2 text-xs font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{speechStatusMessage}</p>
            </div>
            <button
              onClick={() => setSpeechStatusMessage(null)}
              className="text-amber-500 hover:text-amber-800 text-sm font-bold ml-1"
            >
              ✕
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── QUICK SUGGESTION CHIPS (ONE-TAP CONVERSATIONS) ─── */}
      <div className="px-3 pt-1 pb-2 bg-transparent overflow-x-auto whitespace-nowrap flex gap-1.5 custom-scrollbar">
        {currentLangConfig.suggestions.map((sugg, i) => (
          <button
            key={i}
            onClick={() => sendMessage(sugg.prompt)}
            disabled={isProcessing || isListening}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-[#D9F4F1] text-[#2E7D73] text-xs font-bold border border-[#D9F4F1] shadow-xs active:scale-95 transition-all flex-shrink-0 disabled:opacity-50"
          >
            {sugg.label}
          </button>
        ))}
      </div>

      {/* ─── ACTIVE LISTENING OVERLAY CARD ─── */}
      {isListening && (
        <div className="px-4 pb-2">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-[#2E7D73] rounded-2xl p-3.5 flex items-center justify-between shadow-md animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping absolute" />
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 relative" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#2E7D73]">
                  {currentLangConfig.listening}
                </p>
                <p className="text-[11px] text-slate-500">
                  {language === "hi-IN"
                    ? "हिंदी में बोलिए"
                    : language === "as-IN"
                    ? "অসমীয়াত কওক"
                    : "Speak in English"}
                </p>
              </div>
            </div>

            <button
              onClick={cancelListening}
              className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── BOTTOM INPUT BAR: PROMINENT MIC & TEXT INPUT ─── */}
      <div className="bg-white border-t border-slate-200 px-3 py-2.5 shadow-lg z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputValue);
          }}
          className="flex items-center gap-2"
        >
          {/* PRIMARY INTERACTION: LARGE ELDERLY-FRIENDLY MIC BUTTON */}
          <button
            type="button"
            onClick={isListening ? cancelListening : startListening}
            disabled={isProcessing}
            className={`w-13 h-13 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-md active:scale-95 ${
              isListening
                ? "bg-rose-500 text-white scale-105 ring-4 ring-rose-200 animate-pulse"
                : "bg-[#2E7D73] hover:bg-[#25665E] text-white"
            } disabled:opacity-50`}
            aria-label={isListening ? "Stop listening" : "Tap to Speak"}
            title="Tap to speak"
          >
            {isListening ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* TEXT INPUT FALLBACK */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentLangConfig.placeholder}
              disabled={isListening || isProcessing}
              className="w-full bg-[#F8FAFB] border border-slate-300 focus:border-[#2E7D73] focus:bg-white rounded-full pl-4 pr-11 py-3 text-sm text-[#2C3E50] placeholder-slate-400 focus:outline-hidden transition-all disabled:opacity-60"
            />

            {/* SEND BUTTON */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isListening || isProcessing}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#2E7D73] disabled:bg-slate-200 text-white flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
