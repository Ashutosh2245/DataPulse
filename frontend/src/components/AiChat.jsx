import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AiChat = ({ datasetId, filename }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `👋 **Namaste & Welcome!** I am your **AI Data Intelligence Assistant** for **${filename}**.\n\nYou can ask me questions about your dataset via **Text or Voice 🎙️** in **English or Hindi/Hinglish** (e.g., averages, maximums, outliers, row counts, correlations).`,
      speechText: `Welcome! I am your AI Data Assistant for ${filename}. Ask me anything about your dataset using text or voice.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-US'); // 'en-US' or 'hi-IN'
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [datasetId, speechLang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Choose appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matchVoice = voices.find(v => v.lang.startsWith(speechLang.split('-')[0]));
      if (matchVoice) {
        utterance.voice = matchVoice;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = speechLang;
          recognitionRef.current.start();
        }
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const handleSend = async (questionText) => {
    const query = questionText || input;
    if (!query || !query.trim() || loading) return;

    const userMessage = { role: 'user', text: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(`/datasets/${datasetId}/ask`, { question: query.trim() });
      const aiMessage = {
        role: 'assistant',
        text: res.data.answer,
        speechText: res.data.speech_text
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (autoSpeak && res.data.speech_text) {
        speakText(res.data.speech_text);
      }
    } catch (err) {
      const errText = err.response?.data?.details || err.response?.data?.error || 'Failed to process question.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **Processing Notice:** ${errText}`,
          speechText: 'Sorry, I could not process your question.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const quickPrompts = [
    { label: '📊 Dataset Summary', query: 'Summarize this dataset and list columns' },
    { label: '🔝 Highest Value (Sabse Jyada)', query: 'What is the highest value in this dataset?' },
    { label: '📐 Average / Ausat', query: 'What is the average value?' },
    { label: '⚠️ Outliers & Anomalies', query: 'Are there any outliers in numeric features?' },
    { label: '🧹 Missing / Null Check', query: 'How many missing or null values are there?' },
    { label: '🔗 Strongest Correlation', query: 'What is the strongest correlation between columns?' },
    { label: '🔢 Kitne Rows Hai?', query: 'How many total rows and columns?' }
  ];

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '640px' }}>
      
      {/* Header with Voice and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
            🤖
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              AI Data Talk Assistant
              <span className="badge badge-completed" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>Active</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real-time voice & natural language intelligence engine</p>
          </div>
        </div>

        {/* Voice Setting Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Mic Language Selector */}
          <select
            value={speechLang}
            onChange={(e) => setSpeechLang(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            title="Speech input language"
          >
            <option value="en-US">🎙️ English (US)</option>
            <option value="hi-IN">🎙️ Hindi / Hinglish (IN)</option>
          </select>

          {/* Auto-Voice Checkbox */}
          <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#cbd5e1' }}>
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              style={{ accentColor: '#3b82f6' }}
            />
            <span>🔊 Voice Output</span>
          </label>

          {/* Stop Audio Button */}
          <button
            onClick={stopSpeaking}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
            title="Stop audio playback"
          >
            ⏹️ Silence
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            className="btn btn-secondary"
            style={{
              padding: '0.28rem 0.65rem',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              borderRadius: '9999px',
              backgroundColor: '#1e293b',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
            onClick={() => handleSend(p.query)}
            disabled={loading}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '0.8rem 1.1rem',
                  borderRadius: isUser ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem',
                  backgroundColor: isUser ? '#2563eb' : '#1e293b',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  boxShadow: 'var(--shadow-sm)',
                  whiteSpace: 'pre-wrap',
                  border: isUser ? 'none' : '1px solid var(--border)'
                }}
              >
                {m.text}
              </div>

              {/* Action Buttons for AI message */}
              {!isUser && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', paddingLeft: '0.25rem' }}>
                  {m.speechText && (
                    <button
                      onClick={() => speakText(m.speechText)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0'
                      }}
                    >
                      🔊 Listen
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(m.text, idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedIdx === idx ? '#10b981' : '#94a3b8',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0'
                    }}
                  >
                    {copiedIdx === idx ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: '#1e293b', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            <span className="spinner" style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Analyzing dataset metrics in real-time...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Listening Wave Indicator */}
      {isListening && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '0.6rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#f87171',
          fontSize: '0.825rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
            <span>Listening in <strong>{speechLang === 'hi-IN' ? 'Hindi/Hinglish' : 'English'}</strong>... Speak your question now!</span>
          </div>
          <button
            onClick={toggleListening}
            className="btn btn-danger"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
          >
            Done Speaking
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}
      >
        <button
          type="button"
          onClick={toggleListening}
          className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
          style={{
            padding: '0.6rem 0.85rem',
            fontSize: '1.15rem',
            boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
          }}
          title={speechSupported ? `Click to speak (${speechLang})` : 'Speech recognition not supported in this browser'}
        >
          {isListening ? '⏹️' : '🎙️'}
        </button>

        <input
          type="text"
          className="input-field"
          placeholder={speechLang === 'hi-IN' ? "Puchhein: 'Sabse jyada salary kiski hai?' ya 'Average age kitna hai?'" : "Ask anything: 'What is the average?', 'Show highest value', etc..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ flex: 1 }}
        />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !input.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 1rem' }}
        >
          <span>Send</span>
          <span>➔</span>
        </button>
      </form>
    </div>
  );
};

export default AiChat;
