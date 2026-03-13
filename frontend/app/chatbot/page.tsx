"use client";

import { useState, useRef, useEffect } from "react";
import { chatbotQuery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Send, User, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatbotPage() {
  const [messages, setMessages] = useState<{role: 'user'|'bot', content: string}[]>([
    { role: 'bot', content: 'Hello! I am SmartCrop AI. How can I assist you with your farming today?' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Web Speech API
  const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    setLoading(true);

    const context = `Recommended Crop: ${localStorage.getItem("recommendedCrop") || "None"}.`;

    try {
      const resp = await chatbotQuery(userMsg, context, language);
      setMessages(prev => [...prev, { role: 'bot', content: resp.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I am having trouble connecting to my brain right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleListen = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.lang = language;
      recognition.start();
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Bot className="text-green-600" /> AI Assistant
        </h1>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md px-3 py-1.5 text-sm"
        >
          <option value="en-IN">English</option>
          <option value="hi-IN">Hindi (हिंदी)</option>
          <option value="te-IN">Telugu (తెలుగు)</option>
          <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
          <option value="ta-IN">Tamil (தமிழ்)</option>
        </select>
      </div>

      <Card className="flex-1 flex flex-col shadow-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 overflow-hidden">
        <CardContent className="flex-1 w-full p-6 overflow-y-auto flex flex-col gap-4">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-green-600 text-white'}`}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`px-5 py-3 rounded-2xl ${
                    m.role === 'user' 
                      ? 'bg-slate-800 text-white dark:bg-slate-700 rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm rounded-tl-sm'
                  }`}>
                    {/* Render markdown optionally or just text */}
                    <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{m.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 rounded-tl-sm flex gap-1 items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleListen}
              className={`flex-shrink-0 ${isListening ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Input 
              placeholder={isListening ? "Listening..." : "Ask your agriculture question..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading || isListening}
              className="flex-1 bg-slate-50 dark:bg-slate-900"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()} className="bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
