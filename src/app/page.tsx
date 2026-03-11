'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  User, 
  Loader2,
  RefreshCcw,
  Heart,
  Shield,
  AlertCircle,
  Thermometer,
  Zap,
  MapPin,
  Baby,
  Globe,
  Play,
  Pause,
  Moon,
  Sun
} from 'lucide-react';
import Image from 'next/image';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

// Real Elhadji audio clips
const elhadjiAudioClips = {
  intro: '/audio/intro.wav',
  prevention: '/audio/prevention.wav',
  impact: '/audio/impact.wav'
};

// Translations
const translations = {
  fr: {
    title: "Elhadji Diop",
    subtitle: "Acteur Communautaire",
    subtitle2: "Fondateur AISM Thienaba",
    newBtn: "Nouveau",
    greeting: "Bonjour ! 👋",
    intro: "Je suis Elhadji Diop",
    description: "Conseiller en prévention du paludisme au Sénégal.",
    askMe: "Posez-moi vos questions.",
    storyTitle: "Mon histoire :",
    storyText: "Dans les années 90, Thienaba a enregistré 3459 cas d'accès palustre. Ma fille Ami Diop, 12 ans, en faisait partie. Sa perte m'a engagé à créer l'AISM.",
    questionsLabel: "Questions sur le paludisme :",
    placeholder: "Posez votre question...",
    sendBtn: "Envoyer",
    loading: "Réflexion...",
    error: "Désolé, une erreur est survenue. Veuillez réessayer.",
    footer: "AISM Thienaba • Prévention du Paludisme au Sénégal 🇸🇳",
    listenIntro: "Écouter Elhadji",
    listenPrevention: "Prévention",
    listenImpact: "Impact AISM",
    questions: [
      "Quels sont les symptômes du paludisme?",
      "Comment prévenir le paludisme?",
      "Que faire en cas de fièvre?",
      "Où consulter près de chez moi?",
      "Paludisme et femmes enceintes",
      "Paludisme chez les enfants"
    ]
  },
  wo: {
    title: "Elhadji Diop",
    subtitle: "Jëwriñ Mboolo",
    subtitle2: "Boroom AISM Thienaba",
    newBtn: "Bees",
    greeting: "Jàmm nga am ! 👋",
    intro: "Man maa di Elhadji Diop",
    description: "Man maa di jëfandikukat ci aar ak xeex sibiru ci Senegaal..",
    askMe: "Laajal ma loo bëgg xam.",
    storyTitle: "Samay dëkk :",
    storyText: "Ci atum 1990 yi, Thienaba amoon na 3459 nit ñu amoon paludisme. Sama doom ju jigéen Ami Diop, mi amoon 12 at, paludisme moo ko jël. Loolu moo ma tax ma sos AISM ngir xeex paludisme.",
    questionsLabel: "Laaj yu jëm ci paludisme :",
    placeholder: "Bindal sa laaj...",
    sendBtn: "Yónne",
    loading: "Di xalaat...",
    error: "Baaxul, am na njumte. Jéemaatal.",
    footer: "AISM Thienaba • Xeex sibiru ci Senegaal 🇸🇳",
    listenIntro: "Dégg Elhadji",
    listenPrevention: "Waññeeku",
    listenImpact: "Jumtukaay AISM",
    questions: [
      "Làn mooy mandarga yu Sibiru ?",
      "Nan lañu man a aar ci Sibiru ?",
      "Làn nga wara def bi nga amé tàngoor yaram ?",
      "Fan laa man a dem faju ?",
      "Sibiru ak jigéen ñu ëmb",
      "Sibiru ak xale yi"
    ]
  }
};

// Icons for questions
const questionIcons = [Thermometer, Shield, Zap, MapPin, Heart, Baby];
const questionColors = [
  { color: "text-red-500", bgColor: "bg-red-50", bgColorDark: "dark:bg-red-950/30", borderColor: "hover:border-red-300 dark:hover:border-red-700" },
  { color: "text-green-500", bgColor: "bg-green-50", bgColorDark: "dark:bg-green-950/30", borderColor: "hover:border-green-300 dark:hover:border-green-700" },
  { color: "text-yellow-500", bgColor: "bg-yellow-50", bgColorDark: "dark:bg-yellow-950/30", borderColor: "hover:border-yellow-300 dark:hover:border-yellow-700" },
  { color: "text-blue-500", bgColor: "bg-blue-50", bgColorDark: "dark:bg-blue-950/30", borderColor: "hover:border-blue-300 dark:hover:border-blue-700" },
  { color: "text-pink-500", bgColor: "bg-pink-50", bgColorDark: "dark:bg-pink-950/30", borderColor: "hover:border-pink-300 dark:hover:border-pink-700" },
  { color: "text-purple-500", bgColor: "bg-purple-50", bgColorDark: "dark:bg-purple-950/30", borderColor: "hover:border-purple-300 dark:hover:border-purple-700" }
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<'fr' | 'wo'>('fr');
  const [darkMode, setDarkMode] = useState(false);
  const [playingClip, setPlayingClip] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('aism-dark-mode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aism-dark-mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Play real Elhadji audio clip
  const playElhadjiClip = (clipKey: 'intro' | 'prevention' | 'impact') => {
    if (playingClip === clipKey && audioRef.current) {
      audioRef.current.pause();
      setPlayingClip(null);
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(elhadjiAudioClips[clipKey]);
    audioRef.current = audio;
    setPlayingClip(clipKey);
    
    audio.onended = () => {
      setPlayingClip(null);
    };
    
    audio.onerror = () => {
      setPlayingClip(null);
    };
    
    audio.play();
  };

  // Toggle language
  const toggleLanguage = () => {
    const newLang = lang === 'fr' ? 'wo' : 'fr';
    setLang(newLang);
    setMessages([]);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleNewConversation = async () => {
    try {
      await fetch(`/api/chat?sessionId=${sessionId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
    setMessages([]);
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: messageText.trim(),
          lang
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur de communication');
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: t.error,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-green-600 dark:bg-green-800 shadow-lg sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white overflow-hidden shadow-md bg-white flex-shrink-0">
                <Image 
                  src="/logo-aism.jpg" 
                  alt="AISM Logo" 
                  width={48} 
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="text-white min-w-0">
                <h1 className="font-bold text-base sm:text-lg truncate">{t.title}</h1>
                <span className="text-green-100 text-xs block truncate">{t.subtitle}</span>
                <span className="text-green-200 text-xs font-medium hidden sm:block">{t.subtitle2}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Dark Mode Toggle */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleDarkMode}
                className="border-white bg-white/10 text-white hover:bg-white/20 hover:text-white px-2 sm:px-3"
                title={darkMode ? "Mode clair" : "Mode sombre"}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              {/* Language Toggle */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleLanguage}
                className="gap-1 border-white bg-white/10 text-white hover:bg-white/20 hover:text-white font-medium px-2 sm:px-3"
              >
                <Globe className="w-4 h-4" />
                <span className="font-bold text-sm">{lang === 'fr' ? 'WO' : 'FR'}</span>
              </Button>
              {/* New Conversation */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNewConversation}
                className="gap-1 sm:gap-2 border-white bg-white/10 text-white hover:bg-white/20 hover:text-white font-medium px-2 sm:px-3"
              >
                <RefreshCcw className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">{t.newBtn}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col">
        
        {/* Welcome Section */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6">
            <div className="text-center space-y-4 sm:space-y-5 max-w-xl px-2">
              {/* Photo Elhadji */}
              <div className="relative inline-block">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-green-500 dark:border-green-600 overflow-hidden shadow-xl mx-auto bg-white">
                  <Image 
                    src="/elhadji.jpg" 
                    alt="Elhadji Diop" 
                    width={256} 
                    height={256}
                    quality={100}
                    className="object-cover w-full h-full object-top"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-9 sm:h-9 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-green-100 overflow-hidden">
                  <Image src="/logo-aism.jpg" alt="AISM" width={36} height={36} quality={100} className="rounded-full object-cover" />
                </div>
              </div>
              
              {/* Title */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t.greeting}</h2>
                <p className="text-base sm:text-lg text-green-600 dark:text-green-400 font-semibold mt-1">{t.intro}</p>
              </div>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                <strong>{t.description}</strong>
                <br />
                {t.askMe}
              </p>

              {/* Elhadji Voice Buttons */}
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => playElhadjiClip('intro')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    playingClip === 'intro' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                  }`}
                >
                  {playingClip === 'intro' ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  🎙️ {t.listenIntro}
                </button>
                <button
                  onClick={() => playElhadjiClip('prevention')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    playingClip === 'prevention' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                  }`}
                >
                  {playingClip === 'prevention' ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  💚 {t.listenPrevention}
                </button>
                <button
                  onClick={() => playElhadjiClip('impact')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    playingClip === 'impact' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                  }`}
                >
                  {playingClip === 'impact' ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  📊 {t.listenImpact}
                </button>
              </div>

              {/* Story Card */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 text-left transition-colors">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    <strong className="text-red-700 dark:text-red-400">{t.storyTitle}</strong> {t.storyText}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested Questions - 6 Buttons with Icons */}
            <div className="mt-6 sm:mt-8 w-full max-w-2xl px-1">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 text-center font-medium">
                {t.questionsLabel}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {t.questions.map((question, index) => {
                  const IconComponent = questionIcons[index];
                  const colorClass = questionColors[index];
                  return (
                    <button
                      key={index}
                      onClick={() => sendMessage(question)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-1.5 sm:gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-700 dark:text-gray-200 font-medium shadow-sm hover:shadow-md ${colorClass.borderColor} ${colorClass.bgColor} ${colorClass.bgColorDark} transition-all duration-200 group disabled:opacity-50`}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${colorClass.bgColor} ${colorClass.bgColorDark} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass.color}`} />
                      </div>
                      <span className="text-[10px] sm:text-xs leading-tight">{question}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <ScrollArea className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 transition-colors">
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-green-600' 
                        : message.role === 'error'
                        ? 'bg-red-100 dark:bg-red-900'
                        : 'border-2 border-green-200 dark:border-green-700 bg-white dark:bg-gray-700'
                    }`}>
                      {message.role === 'user' 
                        ? <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        : message.role === 'error'
                        ? <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400" />
                        : <Image src="/elhadji.jpg" alt="Elhadji" width={80} height={80} quality={100} className="object-cover w-full h-full object-top" />
                      }
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 transition-colors ${
                      message.role === 'user' 
                        ? 'bg-green-600 text-white' 
                        : message.role === 'error'
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                    }`}>
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 ${
                        message.role === 'user' 
                          ? 'text-green-200' 
                          : message.role === 'error'
                          ? 'text-red-400 dark:text-red-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-green-200 dark:border-green-700 overflow-hidden bg-white dark:bg-gray-700">
                      <Image src="/elhadji.jpg" alt="Elhadji" width={80} height={80} quality={100} className="object-cover w-full h-full object-top" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-green-600 dark:text-green-400" />
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.loading}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </main>

      {/* Input Form */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] transition-colors">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 h-12 sm:h-14 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200 text-sm sm:text-base px-3 sm:px-4 bg-gray-50 dark:bg-gray-700 transition-colors"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="lg"
              className="h-12 sm:h-14 px-4 sm:px-8 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 shadow-md hover:shadow-lg transition-all text-sm sm:text-base font-semibold"
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="ml-1.5 sm:ml-2 hidden sm:inline">{t.sendBtn}</span>
            </Button>
          </form>
          <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 text-center mt-2 sm:mt-3">
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
