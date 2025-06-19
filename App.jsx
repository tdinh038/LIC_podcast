import React, { useState, useRef, useEffect } from 'react';

// BACKEND_URL for sentiment analysis
const BACKEND_URL = 'https://licpodcast.onrender.com';

// Simplified themes with only essential properties
const THEMES = {
  MIDNIGHT: {
    name: 'Midnight Pulse',
    background: 'linear-gradient(135deg, #0F0F1E 0%, #1A1A3A 100%)',
    text: '#E0E0E0',
    highlight: '#7C4DFF',
    sentiments: {
      positive: 'rgba(0, 230, 118, 0.3)',
      neutral: 'rgba(255, 171, 64, 0.3)',
      negative: 'rgba(255, 82, 82, 0.3)',
      mixed: 'rgba(186, 104, 200, 0.3)'
    },
    panel: 'rgba(15, 15, 30, 0.8)',
    button: '#7C4DFF',
    buttonText: '#FFFFFF',
    buttonHover: '#9E7DFF',
    modal: 'rgba(26, 26, 58, 0.95)',
    input: '#2C2C4C',
    border: '#3F3F63',
    active: '#FFFFFF',
    inactive: 'rgba(143, 143, 158, 0.7)',
    isDark: true
  },
  EMBER: {
    name: 'Ember Glow',
    background: 'linear-gradient(135deg, #1F1F1F 0%, #2C1E1E 50%, #372222 100%)',
    text: '#F0E6E6',
    highlight: '#FF6E40',
    sentiments: {
      positive: 'rgba(102, 187, 106, 0.3)',
      neutral: 'rgba(255, 213, 79, 0.3)',
      negative: 'rgba(239, 83, 80, 0.3)',
      mixed: 'rgba(149, 117, 205, 0.3)'
    },
    panel: 'rgba(31, 31, 31, 0.85)',
    button: '#FF6E40',
    buttonText: '#1F1F1F',
    buttonHover: '#FF9E80',
    modal: 'rgba(47, 34, 34, 0.95)',
    input: '#3C2929',
    border: '#4D3636',
    active: '#F0E6E6',
    inactive: 'rgba(158, 140, 140, 0.7)',
    isDark: true
  },
  COASTAL: {
    name: 'Coastal Breeze',
    background: 'linear-gradient(135deg, #F5F7FA 0%, #E4EAF5 100%)',
    text: '#2C3E50',
    highlight: '#3498DB',
    sentiments: {
      positive: 'rgba(39, 174, 96, 0.25)',
      neutral: 'rgba(243, 156, 18, 0.25)',
      negative: 'rgba(231, 76, 60, 0.25)',
      mixed: 'rgba(142, 68, 173, 0.25)'
    },
    panel: 'rgba(245, 247, 250, 0.85)',
    button: '#3498DB',
    buttonText: '#FFFFFF',
    buttonHover: '#5DADE2',
    modal: 'rgba(228, 234, 245, 0.95)',
    input: '#FFFFFF',
    border: '#BDC3C7',
    active: '#2C3E50',
    inactive: 'rgba(149, 165, 166, 0.8)',
    isDark: false
  },
  SPRING: {
    name: 'Spring Blossom',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F9F3F9 100%)',
    text: '#4A4A4A',
    highlight: '#FF80AB',
    sentiments: {
      positive: 'rgba(76, 175, 80, 0.2)',
      neutral: 'rgba(255, 193, 7, 0.2)',
      negative: 'rgba(244, 67, 54, 0.2)',
      mixed: 'rgba(156, 39, 176, 0.2)'
    },
    panel: 'rgba(255, 255, 255, 0.9)',
    button: '#FF80AB',
    buttonText: '#FFFFFF',
    buttonHover: '#FF9EBD',
    modal: 'rgba(249, 243, 249, 0.95)',
    input: '#FFFFFF',
    border: '#E1E1E1',
    active: '#4A4A4A',
    inactive: 'rgba(158, 158, 158, 0.7)',
    isDark: false
  },
  NEUTRAL: {
    name: 'Neutral Canvas',
    background: 'linear-gradient(135deg, #F5F5F0 0%, #E8E6E1 100%)',
    text: '#3C3B37',
    highlight: '#8B7355',
    sentiments: {
      positive: 'rgba(76, 175, 80, 0.2)',
      neutral: 'rgba(255, 193, 7, 0.2)',
      negative: 'rgba(244, 67, 54, 0.2)',
      mixed: 'rgba(156, 39, 176, 0.2)'
    },
    panel: 'rgba(248, 246, 242, 0.9)',
    button: '#8B7355',
    buttonText: '#FFFFFF',
    buttonHover: '#A0845F',
    modal: 'rgba(232, 230, 225, 0.95)',
    input: '#FFFFFF',
    border: '#C4BFB6',
    active: '#3C3B37',
    inactive: 'rgba(124, 120, 112, 0.7)',
    isDark: false
  }
};

// Helper functions
const parseTime = (t) => {
  const [hh, mm, ss] = t.split(':').map(Number);
  return hh * 3600 + mm * 60 + ss;
};

const generateSpeakerColor = (speakerName) => {
  // Generate a consistent color based on speaker name
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  let hash = 0;
  for (let i = 0; i < speakerName.length; i++) {
    hash = speakerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const parseTranscript = (text) => {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const entries = [];
  let lastSpeaker = null; // Track the previous speaker

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\[(\d{2}:\d{2}:\d{2})\]\s+(.*)$/);
    if (match) {
      const [, time, content] = match;

      // Extract speaker information
      let speaker = null;
      let text = content;

      // Check for speaker patterns: "Speaker Name:", "Speaker 1:", "Name -", etc.
      const speakerPatterns = [
        /^([^:]+):\s*(.*)$/,           // "Speaker Name: text"
        /^([^-]+)\s*-\s*(.*)$/,       // "Speaker Name - text"
        /^(\[.*?\])\s*(.*)$/,         // "[Speaker Name] text"
        /^(Speaker\s+\d+)\s*[:-]\s*(.*)$/i  // "Speaker 1: text"
      ];

      for (const pattern of speakerPatterns) {
        const speakerMatch = content.match(pattern);
        if (speakerMatch) {
          speaker = speakerMatch[1].trim().replace(/[\[\]]/g, ''); // Remove brackets if present
          text = speakerMatch[2].trim();
          break;
        }
      }

      // If no speaker found, use the last speaker (continuation)
      if (!speaker && lastSpeaker) {
        speaker = lastSpeaker;
        text = content; // Use the full content as text
      }

      // Update lastSpeaker if we found a new speaker
      if (speaker) {
        lastSpeaker = speaker;
      }

      entries.push({
        start: parseTime(time),
        text: text,
        speaker: speaker
      });
    }
  }

  for (let i = 0; i < entries.length - 1; i++) {
    entries[i].end = entries[i + 1].start;
  }
  if (entries.length > 0) {
    entries[entries.length - 1].end = entries[entries.length - 1].start + 4;
  }

  return entries;
};

const spreadWordsWithTiming = (sentences, isDarkTheme) => {
  let wordIndex = 0;
  const result = [];
  const defaultColor = isDarkTheme ? '#FFFFFF' : '#2C3E50';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const words = sentence.text.trim().split(/\s+/);
    const duration = sentence.end - sentence.start;
    const step = duration / words.length;

    result.push(...words.map((word, j) => ({
      word,
      start: sentence.start + j * step,
      end: sentence.start + (j + 1) * step,
      color: defaultColor,
      size: '20px',
      sentenceIndex: i,
      wordIndex: wordIndex++,
      speaker: sentence.speaker,
      animation: {
        type: 'none',
        duration: 1.2,
        delay: 0,
        intensity: 'normal'
      },
      enhancement: {
        type: 'none', // 'none', 'link', 'image'
        url: '', // For links
        imageData: null, // For local image files (base64)
        title: ''
      }
    })));
  }

  return result;
};

// Main component
export default function App() {
  // Refs
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const sentenceRefs = useRef([]);

  // Player state
  const [audioUrl, setAudioUrl] = useState(null);
  const [wordData, setWordData] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [, setCurrentTime] = useState(0);
  const [mode, setMode] = useState('editor');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [autoScroll, setAutoScroll] = useState(true);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState(THEMES.MIDNIGHT);

  // Sentiment analysis states
  const [sentimentData, setSentimentData] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingSentimentIndex, setEditingSentimentIndex] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [serverWarmingUp, setServerWarmingUp] = useState(true);

  // Word editing state
  const [editingWordIndex, setEditingWordIndex] = useState(null);
  const [editedWordText, setEditedWordText] = useState('');

  // Animation editing state
  const [animationEditorOpen, setAnimationEditorOpen] = useState(false);
  const [editingWordAnimation, setEditingWordAnimation] = useState(null);
  const [tempAnimation, setTempAnimation] = useState({
    type: 'none',
    duration: 1.2,
    delay: 0,
    intensity: 'normal'
  });

  // Global animation effects
  const [globalAnimations, setGlobalAnimations] = useState({
    sentimentBackground: false
  });

  // Sentiment background tracking
  const [sentimentScore, setSentimentScore] = useState(0); // Target cumulative score
  const [displaySentimentScore, setDisplaySentimentScore] = useState(0); // Smoothly animated score
  const [sentimentIntensity, setSentimentIntensity] = useState(0.5); // How much it affects background (0-1) - default 50%

  // Audio analysis state
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [, setAudioData] = useState({
    volume: 0,
    frequency: new Array(8).fill(0),
    dominantFreq: 0
  });

  // Soundwave visualization
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [frequencyData, setFrequencyData] = useState(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // Speaker management state
  const [speakers, setSpeakers] = useState({});
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [newSpeakerPhoto, setNewSpeakerPhoto] = useState(null);

  // Word enhancement state (hyperlinks and images)
  const [editingWordEnhancement, setEditingWordEnhancement] = useState(null);
  const [enhancementType, setEnhancementType] = useState(null); // 'link' or 'image'
  const [enhancementUrl, setEnhancementUrl] = useState('');
  const [enhancementImage, setEnhancementImage] = useState(null); // For local image file
  const [imagePopupOpen, setImagePopupOpen] = useState(false);
  const [imagePopupSrc, setImagePopupSrc] = useState('');
  const [linkConfirmOpen, setLinkConfirmOpen] = useState(false);
  const [linkToOpen, setLinkToOpen] = useState('');

  // Enhancement slide-out panel state
  const [enhancementPanelOpen, setEnhancementPanelOpen] = useState(null); // sentenceIndex or null
  const [enhancementPanelSide, setEnhancementPanelSide] = useState('right'); // 'left' or 'right'

  // Group words by sentence
  const groupedBySentence = wordData.reduce((acc, word) => {
    if (!acc[word.sentenceIndex]) acc[word.sentenceIndex] = [];
    acc[word.sentenceIndex].push(word);
    return acc;
  }, []);

  // Load saved theme from localStorage on initial render
  useEffect(() => {
    try {
      const savedThemeName = localStorage.getItem('selectedTheme');
      if (savedThemeName) {
        const theme = Object.values(THEMES).find(t => t.name === savedThemeName);
        if (theme) setCurrentTheme(theme);
      }
    } catch (error) {
      console.warn("Couldn't access localStorage. Using default theme.", error);
    }
  }, []);

  // Warm up the server on app startup
  useEffect(() => {
    const warmUpServer = async () => {
      try {
        console.log('Warming up server...');
        const response = await fetch(`${BACKEND_URL}/`, {
          method: 'GET',
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (response.ok) {
          console.log('Server is ready!');
        } else {
          console.log('Server responded but may still be warming up');
        }
      } catch (error) {
        console.log('Server warming up (this is normal on first load):', error.message);
      } finally {
        setServerWarmingUp(false);
      }
    };

    warmUpServer();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    try {
      localStorage.setItem('selectedTheme', currentTheme.name);

      // Update word colors based on theme change
      if (wordData.length > 0) {
        const wordColor = currentTheme.isDark ? '#FFFFFF' : '#2C3E50';

        setWordData(prev => prev.map(word => ({
          ...word,
          color: wordColor
        })));
      }
    } catch (error) {
      console.warn("Couldn't access localStorage. Theme preference won't be saved.", error);
    }
  }, [currentTheme, wordData.length]);

  // Reset sentiment tracking when sentiment background is enabled
  useEffect(() => {
    if (globalAnimations.sentimentBackground) {
      setSentimentScore(0);
      setDisplaySentimentScore(0);
      console.log('Sentiment background enabled - resetting score to 0');
    }
  }, [globalAnimations.sentimentBackground]);

  // Smooth animation between sentiment score changes
  useEffect(() => {
    if (!globalAnimations.sentimentBackground) return;

    const animationDuration = 3000; // 3 seconds for smooth transition
    const startTime = Date.now();
    const startScore = displaySentimentScore;
    const targetScore = sentimentScore;
    const scoreDiff = targetScore - startScore;

    if (Math.abs(scoreDiff) < 0.01) return; // Skip if no meaningful change

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Use easeInOutCubic for smooth animation
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentScore = startScore + (scoreDiff * easeProgress);
      setDisplaySentimentScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplaySentimentScore(targetScore); // Ensure we end exactly at target
      }
    };

    requestAnimationFrame(animate);
  }, [sentimentScore, globalAnimations.sentimentBackground]);

  // Create and inject animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      
      /* Word Animation Keyframes */
      @keyframes wordFadeIn { 
        from { opacity: 0; } 
        to { opacity: 1; } 
      }
      @keyframes wordBounce { 
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); } 
        40%, 43% { transform: translate3d(0,-8px,0); } 
        70% { transform: translate3d(0,-4px,0); } 
      }
      @keyframes wordPulse { 
        0% { transform: scale(1); } 
        50% { transform: scale(1.1); } 
        100% { transform: scale(1); } 
      }
      @keyframes wordGlow { 
        0%, 100% { text-shadow: 0 0 5px currentColor; } 
        50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor; } 
      }
      @keyframes wordSlideUp { 
        from { transform: translateY(20px); opacity: 0; } 
        to { transform: translateY(0); opacity: 1; } 
      }
      @keyframes wordTypewriter { 
        from { width: 0; } 
        to { width: 100%; } 
      }
      @keyframes wordShake { 
        0%, 100% { transform: translateX(0); } 
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); } 
        20%, 40%, 60%, 80% { transform: translateX(2px); } 
      }
      
      /* Positive Emotional Animation Keyframes */
      @keyframes wordJoy { 
        0% { transform: translateY(0) scale(1); filter: brightness(1); }
        25% { transform: translateY(-15px) scale(1.15) rotate(5deg); filter: brightness(1.3) saturate(1.5); }
        50% { transform: translateY(-10px) scale(1.1) rotate(-3deg); filter: brightness(1.2) saturate(1.3); }
        75% { transform: translateY(-5px) scale(1.05) rotate(2deg); filter: brightness(1.1) saturate(1.2); }
        100% { transform: translateY(0) scale(1) rotate(0deg); filter: brightness(1); }
      }
      @keyframes wordHappiness { 
        0% { transform: scale(1); color: currentColor; text-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
        50% { transform: scale(1.2) rotate(10deg); color: gold; text-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
        100% { transform: scale(1) rotate(0deg); color: currentColor; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
      }
      @keyframes wordExcitement { 
        0%, 100% { transform: translateY(0) scale(1); }
        20% { transform: translateY(-8px) scale(1.1) rotate(5deg); }
        40% { transform: translateY(-12px) scale(1.15) rotate(-5deg); }
        60% { transform: translateY(-8px) scale(1.1) rotate(3deg); }
        80% { transform: translateY(-4px) scale(1.05) rotate(-2deg); }
      }
      @keyframes wordLove { 
        0% { transform: scale(1); color: currentColor; text-shadow: 0 0 5px rgba(255, 105, 180, 0.4); }
        25% { transform: scale(1.1); color: hotpink; text-shadow: 0 0 15px rgba(255, 105, 180, 0.7); }
        50% { transform: scale(1.15) rotate(5deg); color: deeppink; text-shadow: 0 0 20px rgba(255, 105, 180, 0.9); }
        75% { transform: scale(1.1) rotate(-3deg); color: hotpink; text-shadow: 0 0 15px rgba(255, 105, 180, 0.7); }
        100% { transform: scale(1) rotate(0deg); color: currentColor; text-shadow: 0 0 10px rgba(255, 105, 180, 0.5); }
      }
      @keyframes wordGratitude { 
        0% { transform: translateY(0) scale(1); filter: brightness(1); }
        50% { transform: translateY(-5px) scale(1.05); filter: brightness(1.2) sepia(0.3); }
        100% { transform: translateY(0) scale(1); filter: brightness(1.1) sepia(0.1); }
      }
      @keyframes wordHope { 
        0% { transform: translateY(0) scale(1); opacity: 0.8; text-shadow: 0 0 5px rgba(255, 223, 0, 0.4); }
        50% { transform: translateY(-8px) scale(1.08); opacity: 1; text-shadow: 0 0 25px rgba(255, 223, 0, 0.8); }
        100% { transform: translateY(-2px) scale(1.02); opacity: 1; text-shadow: 0 0 15px rgba(255, 223, 0, 0.6); }
      }
      @keyframes wordPride { 
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.1) rotate(2deg); filter: brightness(1.2); }
        50% { transform: scale(1.15) rotate(-1deg); filter: brightness(1.3); }
        75% { transform: scale(1.1) rotate(1deg); filter: brightness(1.2); }
        100% { transform: scale(1.05) rotate(0deg); filter: brightness(1.1); }
      }
      @keyframes wordRelief { 
        0% { transform: scale(1.2) rotate(5deg); opacity: 0.8; }
        50% { transform: scale(1.05) rotate(-2deg); opacity: 0.95; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }

      /* Negative Emotional Animation Keyframes */
      @keyframes wordSadness { 
        0% { transform: translateY(0) scale(1); opacity: 1; filter: saturate(0.7) brightness(0.9); }
        50% { transform: translateY(8px) scale(0.95) rotate(-2deg); opacity: 0.7; filter: saturate(0.4) brightness(0.7); }
        100% { transform: translateY(4px) scale(0.97) rotate(-1deg); opacity: 0.8; filter: saturate(0.5) brightness(0.8); }
      }
      @keyframes wordAnger { 
        0%, 100% { transform: translateX(0) scale(1) rotate(0deg); filter: hue-rotate(0deg) brightness(1); }
        10% { transform: translateX(-5px) scale(1.05) rotate(-2deg); filter: hue-rotate(15deg) brightness(1.2); }
        20% { transform: translateX(5px) scale(1.08) rotate(2deg); filter: hue-rotate(-15deg) brightness(1.3); }
        30% { transform: translateX(-4px) scale(1.06) rotate(-1deg); filter: hue-rotate(10deg) brightness(1.25); }
        40% { transform: translateX(4px) scale(1.07) rotate(1deg); filter: hue-rotate(-10deg) brightness(1.3); }
        50% { transform: translateX(-3px) scale(1.05) rotate(0deg); filter: hue-rotate(5deg) brightness(1.2); }
      }
      @keyframes wordFear { 
        0%, 100% { transform: translateX(0) scale(1) rotate(0deg); opacity: 1; }
        10% { transform: translateX(-3px) scale(0.98) rotate(-1deg); opacity: 0.9; }
        20% { transform: translateX(3px) scale(0.95) rotate(1deg); opacity: 0.85; }
        30% { transform: translateX(-4px) scale(0.93) rotate(-2deg); opacity: 0.8; }
        40% { transform: translateX(4px) scale(0.95) rotate(2deg); opacity: 0.85; }
        50% { transform: translateX(-3px) scale(0.97) rotate(-1deg); opacity: 0.9; }
        60% { transform: translateX(3px) scale(0.98) rotate(1deg); opacity: 0.95; }
        70% { transform: translateX(-2px) scale(0.99) rotate(0deg); opacity: 0.98; }
        80% { transform: translateX(2px) scale(0.98) rotate(0deg); opacity: 0.95; }
        90% { transform: translateX(-1px) scale(0.99) rotate(0deg); opacity: 0.98; }
      }
      @keyframes wordDisgust { 
        0% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
        25% { transform: scale(0.9) rotate(-5deg); filter: hue-rotate(60deg) saturate(0.5); }
        50% { transform: scale(0.85) rotate(-8deg); filter: hue-rotate(90deg) saturate(0.3); }
        75% { transform: scale(0.9) rotate(-5deg); filter: hue-rotate(60deg) saturate(0.5); }
        100% { transform: scale(0.95) rotate(-2deg); filter: hue-rotate(30deg) saturate(0.7); }
      }
      @keyframes wordEnvy { 
        0% { transform: scale(1); color: currentColor; filter: hue-rotate(0deg); }
        50% { transform: scale(1.05) rotate(3deg); color: darkgreen; filter: hue-rotate(120deg) saturate(1.5); }
        100% { transform: scale(1.02) rotate(1deg); color: currentColor; filter: hue-rotate(60deg) saturate(1.2); }
      }
      @keyframes wordShame { 
        0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
        50% { transform: translateY(5px) scale(0.9) rotate(-3deg); opacity: 0.6; filter: blur(1px); }
        100% { transform: translateY(3px) scale(0.95) rotate(-1deg); opacity: 0.8; filter: blur(0.5px); }
      }
      @keyframes wordGuilt { 
        0% { transform: scale(1) rotate(0deg); opacity: 1; }
        25% { transform: scale(0.95) rotate(-2deg); opacity: 0.8; filter: brightness(0.8); }
        50% { transform: scale(0.9) rotate(-4deg); opacity: 0.6; filter: brightness(0.6); }
        75% { transform: scale(0.95) rotate(-2deg); opacity: 0.8; filter: brightness(0.8); }
        100% { transform: scale(0.97) rotate(-1deg); opacity: 0.9; filter: brightness(0.9); }
      }
      @keyframes wordAnxiety { 
        0%, 100% { transform: translateX(0) translateY(0) scale(1); }
        10% { transform: translateX(-2px) translateY(-1px) scale(0.98); }
        20% { transform: translateX(2px) translateY(1px) scale(1.02); }
        30% { transform: translateX(-1px) translateY(-2px) scale(0.99); }
        40% { transform: translateX(1px) translateY(2px) scale(1.01); }
        50% { transform: translateX(-2px) translateY(1px) scale(0.98); }
        60% { transform: translateX(2px) translateY(-1px) scale(1.02); }
        70% { transform: translateX(-1px) translateY(2px) scale(0.99); }
        80% { transform: translateX(1px) translateY(-2px) scale(1.01); }
        90% { transform: translateX(-1px) translateY(1px) scale(0.99); }
      }

      /* Misc Animation Keyframes */
      @keyframes wordSurprise { 
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.3) rotate(5deg); filter: brightness(1.3); }
        50% { transform: scale(1.25) rotate(-3deg); filter: brightness(1.2); }
        75% { transform: scale(1.15) rotate(2deg); filter: brightness(1.15); }
        100% { transform: scale(1.1) rotate(0deg); filter: brightness(1.1); }
      }
      @keyframes wordConfusion { 
        0%, 100% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(5deg) scale(1.05); }
        50% { transform: rotate(-8deg) scale(0.95); }
        75% { transform: rotate(3deg) scale(1.02); }
      }
      @keyframes wordCuriosity { 
        0% { transform: translateY(0) rotate(0deg) scale(1); }
        25% { transform: translateY(-3px) rotate(2deg) scale(1.05); }
        50% { transform: translateY(-5px) rotate(-1deg) scale(1.08); }
        75% { transform: translateY(-3px) rotate(1deg) scale(1.05); }
        100% { transform: translateY(-2px) rotate(0deg) scale(1.02); }
      }
      @keyframes wordDetermination { 
        0% { transform: scale(1) rotate(0deg); font-weight: normal; }
        50% { transform: scale(1.1) rotate(1deg); font-weight: bolder; filter: brightness(1.2); }
        100% { transform: scale(1.05) rotate(0deg); font-weight: bold; filter: brightness(1.1); }
      }
      @keyframes wordMystery { 
        0% { transform: scale(1); opacity: 1; filter: blur(0px); }
        50% { transform: scale(1.02); opacity: 0.7; filter: blur(1px); text-shadow: 0 0 10px currentColor; }
        100% { transform: scale(1.01); opacity: 0.9; filter: blur(0.5px); text-shadow: 0 0 5px currentColor; }
      }
      
      /* Animation Classes */
      .word-animate-fadeIn { animation: wordFadeIn var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-bounce { animation: wordBounce var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-pulse { animation: wordPulse var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-glow { animation: wordGlow var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-slideUp { animation: wordSlideUp var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-typewriter { 
        animation: wordTypewriter var(--duration, 1.2s) steps(20) var(--delay, 0s) both;
        overflow: hidden;
        white-space: nowrap;
        display: inline-block;
      }
      .word-animate-shake { animation: wordShake var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      
      /* Positive Emotional Animation Classes */
      .word-animate-joy { animation: wordJoy var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-happiness { animation: wordHappiness var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-excitement { animation: wordExcitement var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-love { animation: wordLove var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-gratitude { animation: wordGratitude var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-hope { animation: wordHope var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-pride { animation: wordPride var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-relief { animation: wordRelief var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      
      /* Negative Emotional Animation Classes */
      .word-animate-sadness { animation: wordSadness var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-anger { animation: wordAnger var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-fear { animation: wordFear var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-disgust { animation: wordDisgust var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-envy { animation: wordEnvy var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-shame { animation: wordShame var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-guilt { animation: wordGuilt var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-anxiety { animation: wordAnxiety var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      
      /* Misc Animation Classes */
      .word-animate-surprise { animation: wordSurprise var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-confusion { animation: wordConfusion var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-curiosity { animation: wordCuriosity var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-determination { animation: wordDetermination var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      .word-animate-mystery { animation: wordMystery var(--duration, 1.2s) ease-out var(--delay, 0s) both; }
      
      /* Preview animation trigger */
      .word-preview-animation {
        animation-play-state: running !important;
      }
      
      /* Positive sentiment background pulse animation */
      @keyframes positiveBackgroundPulse {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.02); }
      }
      
      .positive-sentiment-background {
        animation: positiveBackgroundPulse 4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Word and audio time tracking
  useEffect(() => {
    let lastScrolledSentence = -1; // Track last scrolled sentence to prevent excessive scrolling

    const interval = setInterval(() => {
      const time = audioRef.current?.currentTime;
      if (time == null || wordData.length === 0) return;

      setCurrentTime(time);
      const index = wordData.findIndex(w => time >= w.start && time < w.end);
      setHighlightIndex(index);

      // Update sentiment score based on current sentence (cumulative approach)
      if (index !== -1 && globalAnimations.sentimentBackground && Object.keys(sentimentData).length > 0) {
        const currentWord = wordData[index];
        const sentenceIndex = currentWord.sentenceIndex;

        // Calculate cumulative score from sentence 0 up to current sentence
        let cumulativeScore = 0;
        for (let i = 0; i <= sentenceIndex; i++) {
          const sentimentInfo = sentimentData[i];
          if (sentimentInfo && sentimentInfo.sentiment) {
            if (sentimentInfo.sentiment === 'positive') {
              cumulativeScore += 1;
            } else if (sentimentInfo.sentiment === 'negative') {
              cumulativeScore -= 1;
            }
            // Neutral and mixed don't change the score
          }
        }

        // Update score if it changed
        setSentimentScore(prev => {
          if (prev !== cumulativeScore) {
            console.log('Updating cumulative sentiment score:', {
              sentenceIndex,
              oldScore: prev,
              newScore: cumulativeScore
            });
            return cumulativeScore;
          }
          return prev;
        });
      }

      if (index !== -1 && autoScroll && mode === 'player') {
        const sentenceIndex = wordData[index].sentenceIndex;

        // Only scroll if we've moved to a different sentence
        if (sentenceIndex !== lastScrolledSentence) {
          const el = sentenceRefs.current[sentenceIndex];

          if (el && containerRef.current) {
            lastScrolledSentence = sentenceIndex;

            // Use requestAnimationFrame to ensure DOM is updated
            requestAnimationFrame(() => {
              try {
                el.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'nearest'
                });
                console.log('Scrolled to sentence:', sentenceIndex);
              } catch (error) {
                console.warn('Scroll error:', error);
                // Fallback: try scrolling the container directly
                if (containerRef.current) {
                  const containerRect = containerRef.current.getBoundingClientRect();
                  const elRect = el.getBoundingClientRect();
                  const scrollTop = containerRef.current.scrollTop;
                  const targetScrollTop = scrollTop + (elRect.top - containerRect.top) - (containerRect.height / 2);

                  containerRef.current.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                  });
                }
              }
            });
          } else {
            console.warn('Autoscroll: Missing element or container', {
              hasElement: !!el,
              hasContainer: !!containerRef.current,
              sentenceIndex
            });
          }
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [wordData, autoScroll, globalAnimations.sentimentBackground, sentimentData, mode]);

  // Handle canvas dimensions for soundwave
  useEffect(() => {
    const handleResize = () => {
      setCanvasDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Set initial dimensions
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Cleanup when switching out of player mode
  useEffect(() => {
    if (mode !== 'player') {
      // Stop soundwave animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [mode]);

  // Start audio analysis when audio starts playing
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      console.log('Audio playing, sentiment tracking enabled:', globalAnimations.sentimentBackground);

      // Setup audio analysis for soundwave if in player mode
      if (!audioContext && mode === 'player') {
        setupAudioAnalysisForSoundwave();
      }

      // Start soundwave animation if in player mode
      if (mode === 'player' && analyser && frequencyData) {
        animateSoundwave();
      }
    };

    const handlePause = () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.suspend();
      }

      // Stop soundwave animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const handleResume = () => {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Restart soundwave animation if in player mode
      if (mode === 'player' && analyser && frequencyData && !animationFrameRef.current) {
        animateSoundwave();
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handleResume);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handleResume);
    };
  }, [audioRef.current, globalAnimations, audioContext]);

  // Audio analysis loop
  useEffect(() => {
    if (!analyser || !audioContext) return;

    let animationFrame;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (audioContext.state !== 'running') return;

      analyser.getByteFrequencyData(dataArray);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const volume = Math.sqrt(sum / bufferLength) / 255;

      // Get frequency data (simplified to 8 bands)
      const frequencyBands = [];
      const bandSize = Math.floor(bufferLength / 8);
      for (let i = 0; i < 8; i++) {
        let bandSum = 0;
        for (let j = i * bandSize; j < (i + 1) * bandSize; j++) {
          bandSum += dataArray[j];
        }
        frequencyBands.push(bandSum / bandSize / 255);
      }

      // Find dominant frequency
      const maxIndex = dataArray.indexOf(Math.max(...dataArray));
      const dominantFreq = (maxIndex / bufferLength) * (audioContext.sampleRate / 2);

      setAudioData({
        volume: volume,
        frequency: frequencyBands,
        dominantFreq: dominantFreq
      });

      // Debug logging (remove this later)
      if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
        console.log('Audio data:', { volume, frequencyBands, dominantFreq });
      }

      animationFrame = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [analyser, audioContext]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [audioContext]);

  // File handling functions
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioUrl(URL.createObjectURL(file));
      // Reset audio context when new audio is loaded
      if (audioContext) {
        audioContext.close();
        setAudioContext(null);
        setAnalyser(null);
      }
    }
  };

  // Setup audio analysis for soundwave
  const setupAudioAnalysisForSoundwave = async () => {
    if (!audioRef.current || audioContext) return;

    try {
      console.log('Setting up audio analysis for soundwave...');
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaElementSource(audioRef.current);
      const analyzer = context.createAnalyser();

      analyzer.fftSize = 256; // Higher resolution for soundwave
      analyzer.smoothingTimeConstant = 0.85;

      source.connect(analyzer);
      analyzer.connect(context.destination);

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setAudioContext(context);
      setAnalyser(analyzer);
      setFrequencyData(dataArray);

      console.log('Audio analysis setup complete for soundwave');
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  };

  // Soundwave animation function
  const animateSoundwave = () => {
    if (!analyser || !frequencyData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Get frequency data
    analyser.getByteFrequencyData(frequencyData);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate bar width
    const barCount = 64; // Reduced for better performance
    const barWidth = width / barCount;

    // Draw soundwave bars
    for (let i = 0; i < barCount; i++) {
      const barHeight = (frequencyData[i] / 255) * height * 0.8; // 80% of height max
      const x = i * barWidth;
      const y = height - barHeight;

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, `rgba(124, 77, 255, 0.3)`); // Start with theme highlight
      gradient.addColorStop(0.5, `rgba(124, 77, 255, 0.6)`);
      gradient.addColorStop(1, `rgba(124, 77, 255, 0.8)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }

    animationFrameRef.current = requestAnimationFrame(animateSoundwave);
  };

  const handleTranscriptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const parsed = parseTranscript(text);
    const wordList = spreadWordsWithTiming(parsed, currentTheme.isDark);

    // Discover unique speakers
    const discoveredSpeakers = {};
    parsed.forEach(entry => {
      if (entry.speaker && !discoveredSpeakers[entry.speaker]) {
        discoveredSpeakers[entry.speaker] = {
          name: entry.speaker,
          displayName: entry.speaker,
          photo: null,
          color: generateSpeakerColor(entry.speaker)
        };
      }
    });

    setWordData(wordList);
    setSentimentData({});
    setSpeakers(prev => ({ ...prev, ...discoveredSpeakers }));
  };

  // Word editing functions
  const updateWord = (index, changes) => {
    setWordData(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...changes };
      return copy;
    });
  };

  const handleWordEditSubmit = (e) => {
    e.preventDefault();
    if (editingWordIndex !== null && editedWordText.trim()) {
      updateWord(editingWordIndex, { word: editedWordText.trim() });
      setEditingWordIndex(null);
      setEditedWordText('');
    }
  };

  // Sentiment analysis functions
  const analyzeSentiment = async () => {
    if (wordData.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const sentences = Object.values(groupedBySentence).map(words => ({
        sentenceIndex: words[0].sentenceIndex,
        text: words.map(w => w.word).join(' ')
      }));

      const response = await fetch(`${BACKEND_URL}/api/analyze-sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Server responded with status: ${response.status}. ${errorData.error || ''}`);
      }

      const data = await response.json();

      // Process results
      const sentimentMap = {};
      data.documents.forEach(doc => {
        const sentenceIndex = parseInt(doc.id);
        sentimentMap[sentenceIndex] = {
          sentiment: doc.sentiment,
          scores: doc.confidenceScores
        };
      });

      setSentimentData(sentimentMap);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      setAnalysisError(error.message || 'Failed to analyze sentiment');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentenceIndex) => {
    if (!sentimentData[sentenceIndex]) return 'transparent';
    const sentiment = sentimentData[sentenceIndex].sentiment;
    return currentTheme.sentiments[sentiment] || 'transparent';
  };

  const getSentimentEmoji = (sentiment) => {
    const emojis = { positive: '😊', neutral: '😐', negative: '😞', mixed: '😕' };
    return emojis[sentiment] || '';
  };

  const updateSentiment = (sentenceIndex, sentiment) => {
    setSentimentData(prev => ({
      ...prev,
      [sentenceIndex]: {
        sentiment,
        scores: {
          positive: sentiment === 'positive' ? 1 : 0,
          neutral: sentiment === 'neutral' ? 1 : 0,
          negative: sentiment === 'negative' ? 1 : 0,
          mixed: sentiment === 'mixed' ? 1 : 0
        }
      }
    }));
    setEditingSentimentIndex(null);
  };

  // Animation editing functions
  const openAnimationEditor = (wordIndex) => {
    const word = wordData[wordIndex];
    if (word) {
      setEditingWordAnimation(wordIndex);
      setTempAnimation({ ...word.animation });
      setAnimationEditorOpen(true);
    }
  };

  const saveAnimation = () => {
    if (editingWordAnimation !== null) {
      updateWord(editingWordAnimation, { animation: { ...tempAnimation } });
      setAnimationEditorOpen(false);
      setEditingWordAnimation(null);
    }
  };

  const cancelAnimationEdit = () => {
    setAnimationEditorOpen(false);
    setEditingWordAnimation(null);
    setTempAnimation({
      type: 'none',
      duration: 1.2,
      delay: 0,
      intensity: 'normal'
    });
  };

  const previewAnimation = () => {
    if (editingWordAnimation === null || tempAnimation.type === 'none') return;

    // Find the word element in the editor and trigger animation
    const wordElements = document.querySelectorAll(`[data-word-index="${editingWordAnimation}"]`);
    wordElements.forEach(element => {
      // Remove any existing animation classes
      element.className = element.className.replace(/word-animate-\w+/g, '');

      // Set CSS custom properties for duration and delay
      element.style.setProperty('--duration', `${tempAnimation.duration}s`);
      element.style.setProperty('--delay', `${tempAnimation.delay}s`);

      // Add the animation class
      const animationClass = `word-animate-${tempAnimation.type}`;
      element.classList.add(animationClass);

      // Remove the animation class after it completes to allow re-triggering
      const totalDuration = (tempAnimation.duration + tempAnimation.delay) * 1000;
      setTimeout(() => {
        element.classList.remove(animationClass);
      }, totalDuration);
    });
  };

  // Speaker management functions
  const handleSpeakerPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewSpeakerPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enhancement image upload function
  const handleEnhancementImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEnhancementImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSpeaker = () => {
    if (!editingSpeaker) return;

    setSpeakers(prev => ({
      ...prev,
      [editingSpeaker]: {
        ...prev[editingSpeaker],
        displayName: newSpeakerName || prev[editingSpeaker].name,
        photo: newSpeakerPhoto || prev[editingSpeaker].photo
      }
    }));

    closeSpeakerModal();
  };

  const openSpeakerModal = (speakerName) => {
    const speaker = speakers[speakerName];
    if (speaker) {
      setEditingSpeaker(speakerName);
      setNewSpeakerName(speaker.displayName);
      setNewSpeakerPhoto(speaker.photo);
      setSpeakerModalOpen(true);
    }
  };

  const closeSpeakerModal = () => {
    setSpeakerModalOpen(false);
    setEditingSpeaker(null);
    setNewSpeakerName('');
    setNewSpeakerPhoto(null);
  };

  // UI Components
  const ThemeSwitcher = () => (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      justifyContent: 'center',
      marginTop: '10px',
      padding: '10px',
      borderRadius: '8px',
      background: currentTheme.panel
    }}>
      {Object.values(THEMES).map(theme => (
        <button
          key={theme.name}
          onClick={() => setCurrentTheme(theme)}
          style={{
            padding: '8px 12px',
            background: theme.button,
            color: theme.buttonText,
            border: theme.name === currentTheme.name ? `2px solid ${theme.text}` : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: theme.name === currentTheme.name ? 'bold' : 'normal'
          }}
        >
          {theme.name}
        </button>
      ))}
    </div>
  );

  const renderHeader = () => (
    <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 100 }}>
      <button
        onClick={() => setMode(mode === 'editor' ? 'player' : 'editor')}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          background: currentTheme.button,
          color: currentTheme.buttonText,
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = currentTheme.buttonHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = currentTheme.button;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {mode === 'editor' ? 'Switch to Player View' : 'Back to Editor'}
      </button>
    </div>
  );

  const renderEditorControls = () => (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '15px',
      borderRadius: '8px',
      background: currentTheme.panel,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginTop: '15px',
      animation: 'fadeIn 0.5s ease'
    }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        color: currentTheme.text,
        background: currentTheme.input,
        padding: '6px 10px',
        borderRadius: '4px',
        border: `1px solid ${currentTheme.border}`
      }}>
        Font:
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          style={{
            marginLeft: '5px',
            padding: '2px 5px',
            background: currentTheme.input,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px'
          }}
        >
          <option value="sans-serif">Sans-serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
          <option value="Georgia">Georgia</option>
          <option value="Arial">Arial</option>
          <option value="Courier New">Courier New</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>
      </label>

      <label style={{
        display: 'flex',
        alignItems: 'center',
        color: currentTheme.text,
        background: currentTheme.input,
        padding: '6px 10px',
        borderRadius: '4px',
        border: `1px solid ${currentTheme.border}`
      }}>
        <input
          type="checkbox"
          checked={autoScroll}
          onChange={(e) => setAutoScroll(e.target.checked)}
          style={{ marginRight: '5px' }}
        />
        Auto Scroll (keeps current sentence visible)
      </label>

      {/* Global Animation Effects */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '10px',
        background: currentTheme.input,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: '6px'
      }}>
        <label style={{ color: currentTheme.text, fontWeight: 'bold', fontSize: '14px' }}>
          Sentiment Effects
        </label>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          color: currentTheme.text,
          fontSize: '13px'
        }}>
          <input
            type="checkbox"
            checked={globalAnimations.sentimentBackground}
            onChange={(e) => setGlobalAnimations(prev => ({ ...prev, sentimentBackground: e.target.checked }))}
            style={{ marginRight: '8px' }}
          />
          🌈 Sentiment Background (background changes with emotional tone)
        </label>

        {globalAnimations.sentimentBackground && (
          <div style={{
            fontSize: '12px',
            opacity: 0.8,
            color: currentTheme.text,
            padding: '8px',
            background: currentTheme.modal,
            borderRadius: '4px',
            marginTop: '8px'
          }}>
            <div>Current Score: <strong>{displaySentimentScore.toFixed(1)}</strong> (Target: {sentimentScore.toFixed(1)})</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              Debug: Highlighted word #{highlightIndex}, Sentence #{wordData[highlightIndex]?.sentenceIndex}
            </div>

            <div style={{ marginTop: '8px' }}>
              <label style={{ color: currentTheme.text, display: 'block', marginBottom: '5px', fontSize: '11px' }}>
                Effect Intensity: {(sentimentIntensity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={sentimentIntensity}
                onChange={(e) => setSentimentIntensity(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              Positive moments brighten • Negative moments darken
            </div>
          </div>
        )}
      </div>

      {/* Server Status Indicator */}
      {serverWarmingUp && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: currentTheme.input,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: '6px',
          color: currentTheme.text,
          fontSize: '14px'
        }}>
          <span className="spinner" style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            border: `2px solid ${currentTheme.text}40`,
            borderRadius: '50%',
            borderTopColor: currentTheme.text,
            animation: 'spin 1s linear infinite'
          }}></span>
          Warming up server...
        </div>
      )}

      {/* Sentiment Analysis Button */}
      {wordData.length > 0 && (
        <button
          onClick={analyzeSentiment}
          disabled={isAnalyzing}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: isAnalyzing ? `${currentTheme.button}80` : currentTheme.button,
            color: currentTheme.buttonText,
            border: 'none',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isAnalyzing) {
              e.currentTarget.style.background = currentTheme.buttonHover;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isAnalyzing ? `${currentTheme.button}80` : currentTheme.button;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner" style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: `2px solid ${currentTheme.buttonText}40`,
                borderRadius: '50%',
                borderTopColor: currentTheme.buttonText,
                animation: 'spin 1s linear infinite'
              }}></span>
              Analyzing...
            </>
          ) : (
            'Analyze Sentiment'
          )}
        </button>
      )}
    </div>
  );

  // Modals
  const renderSentimentEditingModal = () => {
    if (editingSentimentIndex === null) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{
          background: currentTheme.modal,
          padding: '20px',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ marginTop: 0, color: currentTheme.text }}>Edit Sentiment</h3>

          <p style={{ color: currentTheme.text, marginBottom: '20px' }}>
            {groupedBySentence[editingSentimentIndex]?.map(w => w.word).join(' ')}
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center'
          }}>
            {['positive', 'neutral', 'negative', 'mixed'].map(sentiment => (
              <button
                key={sentiment}
                onClick={() => updateSentiment(editingSentimentIndex, sentiment)}
                style={{
                  padding: '10px 15px',
                  background: currentTheme.sentiments[sentiment],
                  border: `2px solid ${currentTheme.highlight}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: currentTheme.text,
                  fontWeight: 'bold',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {getSentimentEmoji(sentiment)} {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => setEditingSentimentIndex(null)}
              style={{
                padding: '8px 16px',
                background: currentTheme.button,
                color: currentTheme.buttonText,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = currentTheme.buttonHover}
              onMouseLeave={e => e.currentTarget.style.background = currentTheme.button}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWordEditingModal = () => {
    if (editingWordIndex === null) return null;

    const wordToEdit = wordData[editingWordIndex];
    if (!wordToEdit) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{
          background: currentTheme.modal,
          padding: '20px',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ marginTop: 0, color: currentTheme.text }}>Edit Word</h3>

          <form onSubmit={handleWordEditSubmit}>
            <input
              type="text"
              value={editedWordText}
              onChange={e => setEditedWordText(e.target.value)}
              placeholder={wordToEdit.word}
              autoFocus
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.input,
                color: currentTheme.text,
                fontSize: '16px',
                marginBottom: '15px'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setEditingWordIndex(null);
                  setEditedWordText('');
                }}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flexGrow: 1,
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: currentTheme.button,
                  color: currentTheme.buttonText,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flexGrow: 1,
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = currentTheme.buttonHover}
                onMouseLeave={e => e.currentTarget.style.background = currentTheme.button}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderAnimationEditorModal = () => {
    if (!animationEditorOpen || editingWordAnimation === null) return null;

    const wordToAnimate = wordData[editingWordAnimation];
    if (!wordToAnimate) return null;

    const positiveAnimations = [
      { value: 'joy', label: '😊 Joy', description: 'Dramatic upward bounce with bright colors' },
      { value: 'happiness', label: '😄 Happiness', description: 'Golden glow with spinning excitement' },
      { value: 'excitement', label: '🎉 Excitement', description: 'Energetic bouncing with rotations' },
      { value: 'love', label: '💕 Love', description: 'Pink/red glow with growing heart effect' },
      { value: 'gratitude', label: '🙏 Gratitude', description: 'Warm sepia glow with gentle lift' },
      { value: 'hope', label: '🌅 Hope', description: 'Bright yellow glow with upward float' },
      { value: 'pride', label: '🦾 Pride', description: 'Bold scaling with brightness increase' },
      { value: 'relief', label: '😌 Relief', description: 'Settling motion from tension to calm' }
    ];

    const negativeAnimations = [
      { value: 'sadness', label: '😢 Sadness', description: 'Downward drift with dimming colors' },
      { value: 'anger', label: '😡 Anger', description: 'Aggressive shaking with red hue shift' },
      { value: 'fear', label: '😨 Fear', description: 'Trembling with opacity changes' },
      { value: 'disgust', label: '🤢 Disgust', description: 'Shrinking with green hue shift' },
      { value: 'envy', label: '😒 Envy', description: 'Green tint with subtle scaling' },
      { value: 'shame', label: '😳 Shame', description: 'Shrinking with blur and fade' },
      { value: 'guilt', label: '😰 Guilt', description: 'Darkening with downward rotation' },
      { value: 'anxiety', label: '😟 Anxiety', description: 'Jittery multi-directional movement' }
    ];

    const miscAnimations = [
      { value: 'none', label: 'None', description: 'No animation' },
      { value: 'surprise', label: '😲 Surprise', description: 'Sudden large scaling with brightness' },
      { value: 'confusion', label: '😕 Confusion', description: 'Tilting rotations back and forth' },
      { value: 'curiosity', label: '🤔 Curiosity', description: 'Inquisitive upward movement with slight tilt' },
      { value: 'determination', label: '💪 Determination', description: 'Bold scaling with weight increase' },
      { value: 'mystery', label: '🔮 Mystery', description: 'Ethereal blur with shadow effects' }
    ];

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{
          background: currentTheme.modal,
          padding: '25px',
          width: '400px',
          maxWidth: '40vw',
          boxShadow: '-5px 0 25px rgba(0,0,0,0.3)',
          overflowY: 'auto',
          borderTopLeftRadius: '12px',
          borderBottomLeftRadius: '12px'
        }}>
          <h3 style={{ marginTop: 0, color: currentTheme.text, marginBottom: '20px' }}>
            Animate: "{wordToAnimate.word}"
          </h3>

          {/* Animation Type Selection */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: currentTheme.text, display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
                🌟 Positive Emotions
              </label>
              <select
                value={positiveAnimations.some(a => a.value === tempAnimation.type) ? tempAnimation.type : ''}
                onChange={(e) => e.target.value && setTempAnimation(prev => ({ ...prev, type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.input,
                  color: currentTheme.text,
                  fontSize: '14px'
                }}
              >
                <option value="">Select positive emotion...</option>
                {positiveAnimations.map(({ value, label, description }) => (
                  <option key={value} value={value}>
                    {label} - {description}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: currentTheme.text, display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
                🌪️ Negative Emotions
              </label>
              <select
                value={negativeAnimations.some(a => a.value === tempAnimation.type) ? tempAnimation.type : ''}
                onChange={(e) => e.target.value && setTempAnimation(prev => ({ ...prev, type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.input,
                  color: currentTheme.text,
                  fontSize: '14px'
                }}
              >
                <option value="">Select negative emotion...</option>
                {negativeAnimations.map(({ value, label, description }) => (
                  <option key={value} value={value}>
                    {label} - {description}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: currentTheme.text, display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
                🎭 Misc Effects
              </label>
              <select
                value={miscAnimations.some(a => a.value === tempAnimation.type) ? tempAnimation.type : ''}
                onChange={(e) => setTempAnimation(prev => ({ ...prev, type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.input,
                  color: currentTheme.text,
                  fontSize: '14px'
                }}
              >
                <option value="">Select misc effect...</option>
                {miscAnimations.map(({ value, label, description }) => (
                  <option key={value} value={value}>
                    {label} - {description}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Selection Display */}
            {tempAnimation.type && tempAnimation.type !== 'none' && (
              <div style={{
                padding: '12px',
                background: currentTheme.highlight + '20',
                border: `1px solid ${currentTheme.highlight}`,
                borderRadius: '8px',
                marginTop: '15px'
              }}>
                <div style={{ color: currentTheme.text, fontWeight: 'bold', marginBottom: '5px' }}>
                  Selected: {
                    [...positiveAnimations, ...negativeAnimations, ...miscAnimations]
                      .find(a => a.value === tempAnimation.type)?.label || tempAnimation.type
                  }
                </div>
                <div style={{ color: currentTheme.text, opacity: 0.8, fontSize: '12px' }}>
                  {[...positiveAnimations, ...negativeAnimations, ...miscAnimations]
                    .find(a => a.value === tempAnimation.type)?.description}
                </div>
              </div>
            )}
          </div>

          {/* Animation Controls */}
          {tempAnimation.type !== 'none' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label style={{ color: currentTheme.text, display: 'block', marginBottom: '5px' }}>
                    Duration: {tempAnimation.duration}s
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="3.0"
                    step="0.1"
                    value={tempAnimation.duration}
                    onChange={(e) => setTempAnimation(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ color: currentTheme.text, display: 'block', marginBottom: '5px' }}>
                    Delay: {tempAnimation.delay}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.1"
                    value={tempAnimation.delay}
                    onChange={(e) => setTempAnimation(prev => ({ ...prev, delay: parseFloat(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={cancelAnimationEdit}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>

            {tempAnimation.type !== 'none' && (
              <button
                onClick={previewAnimation}
                style={{
                  padding: '10px 16px',
                  background: currentTheme.input,
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = currentTheme.border}
                onMouseLeave={e => e.currentTarget.style.background = currentTheme.input}
              >
                Preview
              </button>
            )}

            <button
              onClick={saveAnimation}
              style={{
                padding: '10px 16px',
                background: currentTheme.button,
                color: currentTheme.buttonText,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = currentTheme.buttonHover}
              onMouseLeave={e => e.currentTarget.style.background = currentTheme.button}
            >
              Save Animation
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEnhancementEditorModal = () => {
    if (editingWordEnhancement === null) return null;

    const wordToEnhance = wordData[editingWordEnhancement];
    if (!wordToEnhance) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{
          background: currentTheme.modal,
          padding: '25px',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ marginTop: 0, color: currentTheme.text, marginBottom: '20px' }}>
            Enhance: "{wordToEnhance.word}"
          </h3>

          {/* Enhancement Type Selection */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', justifyContent: 'center' }}>
            <button
              onClick={() => setEnhancementType('link')}
              style={{
                padding: '15px 25px',
                background: enhancementType === 'link' ? currentTheme.highlight : 'transparent',
                color: enhancementType === 'link' ? 'white' : currentTheme.text,
                border: `2px solid ${currentTheme.highlight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                minWidth: '120px'
              }}
            >
              <span style={{ fontSize: '24px' }}>🔗</span>
              <span style={{ fontWeight: 'bold' }}>Hyperlink</span>
            </button>

            <button
              onClick={() => setEnhancementType('image')}
              style={{
                padding: '15px 25px',
                background: enhancementType === 'image' ? currentTheme.highlight : 'transparent',
                color: enhancementType === 'image' ? 'white' : currentTheme.text,
                border: `2px solid ${currentTheme.highlight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                minWidth: '120px'
              }}
            >
              <span style={{ fontSize: '24px' }}>🖼️</span>
              <span style={{ fontWeight: 'bold' }}>Image</span>
            </button>
          </div>

          {/* Input Section */}
          {enhancementType === 'link' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: currentTheme.text, display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Link URL:
              </label>
              <input
                type="url"
                value={enhancementUrl}
                onChange={(e) => setEnhancementUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.input,
                  color: currentTheme.text,
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          {enhancementType === 'image' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: currentTheme.text, display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Upload Image:
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* Image Preview */}
                {enhancementImage && (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    background: `url(${enhancementImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: `2px solid ${currentTheme.border}`
                  }}></div>
                )}

                {/* Upload Button */}
                <div style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '12px 20px',
                  background: currentTheme.button,
                  color: currentTheme.buttonText,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'background 0.2s ease'
                }}>
                  {enhancementImage ? 'Change Image' : 'Choose Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEnhancementImageUpload}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                {/* Remove Image Button */}
                {enhancementImage && (
                  <button
                    onClick={() => setEnhancementImage(null)}
                    style={{
                      padding: '10px 15px',
                      background: 'transparent',
                      color: currentTheme.text,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button
              onClick={() => {
                setEditingWordEnhancement(null);
                setEnhancementType(null);
                setEnhancementUrl('');
                setEnhancementImage(null);
              }}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>

            <button
              onClick={() => {
                if (enhancementType) {
                  // Update the word with enhancement
                  const enhancementData = enhancementType === 'link'
                    ? { type: enhancementType, url: enhancementUrl, imageData: null, title: '' }
                    : { type: enhancementType, url: '', imageData: enhancementImage, title: '' };

                  setWordData(prev => prev.map(w =>
                    w.wordIndex === editingWordEnhancement
                      ? { ...w, enhancement: enhancementData }
                      : w
                  ));
                } else {
                  // Remove enhancement
                  setWordData(prev => prev.map(w =>
                    w.wordIndex === editingWordEnhancement
                      ? { ...w, enhancement: { type: 'none', url: '', imageData: null, title: '' } }
                      : w
                  ));
                }
                setEditingWordEnhancement(null);
                setEnhancementType(null);
                setEnhancementUrl('');
                setEnhancementImage(null);
              }}
              disabled={enhancementType && (
                (enhancementType === 'link' && !enhancementUrl.trim()) ||
                (enhancementType === 'image' && !enhancementImage)
              )}
              style={{
                padding: '10px 16px',
                background: (enhancementType && (
                  (enhancementType === 'link' && !enhancementUrl.trim()) ||
                  (enhancementType === 'image' && !enhancementImage)
                )) ? currentTheme.border : currentTheme.button,
                color: currentTheme.buttonText,
                border: 'none',
                borderRadius: '6px',
                cursor: (enhancementType && (
                  (enhancementType === 'link' && !enhancementUrl.trim()) ||
                  (enhancementType === 'image' && !enhancementImage)
                )) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={e => {
                const isDisabled = enhancementType && (
                  (enhancementType === 'link' && !enhancementUrl.trim()) ||
                  (enhancementType === 'image' && !enhancementImage)
                );
                if (!isDisabled) {
                  e.currentTarget.style.background = currentTheme.buttonHover;
                }
              }}
              onMouseLeave={e => {
                const isDisabled = enhancementType && (
                  (enhancementType === 'link' && !enhancementUrl.trim()) ||
                  (enhancementType === 'image' && !enhancementImage)
                );
                if (!isDisabled) {
                  e.currentTarget.style.background = currentTheme.button;
                }
              }}
            >
              {enhancementType ? 'Save Enhancement' : 'Remove Enhancement'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSpeakerModal = () => {
    if (!speakerModalOpen || !editingSpeaker) return null;

    const speaker = speakers[editingSpeaker];
    if (!speaker) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{
          background: currentTheme.modal,
          padding: '30px',
          borderRadius: '15px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ marginTop: 0, color: currentTheme.text, marginBottom: '25px', textAlign: 'center' }}>
            Edit Speaker: {speaker.name}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Display Name */}
            <div>
              <label style={{ color: currentTheme.text, display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Display Name
              </label>
              <input
                type="text"
                value={newSpeakerName}
                onChange={(e) => setNewSpeakerName(e.target.value)}
                placeholder={speaker.name}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.input,
                  color: currentTheme.text,
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label style={{ color: currentTheme.text, display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Profile Photo
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* Current/New Photo Preview */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: newSpeakerPhoto ? `url(${newSpeakerPhoto})` : speaker.color,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '24px',
                  border: `3px solid ${currentTheme.border}`
                }}>
                  {!newSpeakerPhoto && speaker.displayName.charAt(0).toUpperCase()}
                </div>

                {/* Upload Button */}
                <div style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '10px 20px',
                  background: currentTheme.button,
                  color: currentTheme.buttonText,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'background 0.2s ease'
                }}>
                  Choose Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSpeakerPhotoUpload}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                {/* Remove Photo Button */}
                {newSpeakerPhoto && (
                  <button
                    onClick={() => setNewSpeakerPhoto(null)}
                    style={{
                      padding: '10px 15px',
                      background: 'transparent',
                      color: currentTheme.text,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '30px' }}>
            <button
              onClick={closeSpeakerModal}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                flexGrow: 1,
                transition: 'background 0.2s ease',
                fontSize: '16px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>

            <button
              onClick={saveSpeaker}
              style={{
                padding: '12px 24px',
                background: currentTheme.button,
                color: currentTheme.buttonText,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                flexGrow: 1,
                transition: 'background 0.2s ease',
                fontSize: '16px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = currentTheme.buttonHover}
              onMouseLeave={e => e.currentTarget.style.background = currentTheme.button}
            >
              Save Speaker
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Calculate background with natural color progression
  const calculatedBackground = globalAnimations.sentimentBackground
    ? (() => {
      const score = displaySentimentScore;
      const intensity = sentimentIntensity;

      // Natural color progression system
      if (Math.abs(score) < 0.1) {
        // Neutral state - soft warm neutral
        const neutralColor = 'rgba(245, 245, 240, 0.6)'; // Warm light gray
        return `linear-gradient(135deg, ${neutralColor} 0%, rgba(240, 238, 230, 0.4) 100%), ${currentTheme.background}`;
      }

      if (score > 0) {
        // Positive progression: neutral → yellow-green → forest green
        const progress = Math.min(Math.abs(score) / 6, 1); // Normalize over 6 points for gentler transition
        const adjustedProgress = progress * intensity;

        // Color journey: warm neutral → yellow-green → forest green
        let r, g, b;

        if (adjustedProgress < 0.5) {
          // First half: neutral → yellow-green
          const t = adjustedProgress * 2; // 0 to 1
          r = Math.round(245 - (95 * t));   // 245 → 150 (warm to yellow-green)
          g = Math.round(245 - (15 * t));   // 245 → 230 (maintain brightness)
          b = Math.round(240 - (140 * t));  // 240 → 100 (reduce blue)
        } else {
          // Second half: yellow-green → forest green
          const t = (adjustedProgress - 0.5) * 2; // 0 to 1
          r = Math.round(150 - (70 * t));   // 150 → 80 (deeper)
          g = Math.round(230 - (50 * t));   // 230 → 180 (richer green)
          b = Math.round(100 - (20 * t));   // 100 → 80 (deeper)
        }

        const overlayOpacity = 0.3 + (adjustedProgress * 0.4);
        const overlayColor = `rgba(${r}, ${g}, ${b}, ${overlayOpacity})`;
        const gradientEnd = `rgba(${r - 10}, ${g + 5}, ${b - 5}, ${overlayOpacity * 0.8})`;

        return `linear-gradient(135deg, ${overlayColor} 0%, ${gradientEnd} 100%), ${currentTheme.background}`;
      } else {
        // Negative progression: neutral → orange → cooler red
        const progress = Math.min(Math.abs(score) / 6, 1); // Normalize over 6 points
        const adjustedProgress = progress * intensity;

        // Color journey: warm neutral → orange → cooler, more unsettling red
        let r, g, b;

        if (adjustedProgress < 0.5) {
          // First half: neutral → orange
          const t = adjustedProgress * 2; // 0 to 1
          r = Math.round(245 + (10 * t));   // 245 → 255 (increase warmth)
          g = Math.round(245 - (90 * t));   // 245 → 155 (toward orange)
          b = Math.round(240 - (160 * t));  // 240 → 80 (reduce blue significantly)
        } else {
          // Second half: orange → cooler, more negative red
          const t = (adjustedProgress - 0.5) * 2; // 0 to 1
          r = Math.round(255 - (25 * t));   // 255 → 230 (slightly less saturated)
          g = Math.round(155 - (105 * t));  // 155 → 50 (much less yellow/orange)
          b = Math.round(80 - (20 * t));    // 80 → 60 (keep some coolness)
        }

        const overlayOpacity = 0.25 + (adjustedProgress * 0.4);
        const overlayColor = `rgba(${r}, ${g}, ${b}, ${overlayOpacity})`;
        const gradientEnd = `rgba(${Math.max(r - 15, 200)}, ${Math.max(g - 15, 35)}, ${Math.max(b - 10, 45)}, ${overlayOpacity * 0.8})`;

        return `linear-gradient(135deg, ${overlayColor} 0%, ${gradientEnd} 100%), ${currentTheme.background}`;
      }
    })()
    : currentTheme.background;

  // Debug logging for background changes (less frequent)
  if (globalAnimations.sentimentBackground && Math.abs(displaySentimentScore - sentimentScore) < 0.1) {
    console.log('Background calculation:', {
      targetScore: sentimentScore,
      displayScore: displaySentimentScore.toFixed(2),
      sentimentIntensity,
      opacity: displaySentimentScore > 0
        ? Math.min(displaySentimentScore * 0.1, 0.8) * sentimentIntensity
        : Math.min(Math.abs(displaySentimentScore) * 0.1, 0.8) * sentimentIntensity,
      background: calculatedBackground
    });
  }

  // Main render
  return (
    <div
      className={globalAnimations.sentimentBackground && displaySentimentScore > 2 ? 'positive-sentiment-background' : ''}
      style={{
        background: calculatedBackground,
        color: currentTheme.text,
        fontFamily,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background 1.0s ease, color 0.5s ease'
      }}
    >
      {/* Soundwave background canvas - only in player mode */}
      {mode === 'player' && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            opacity: 0.4,
            pointerEvents: 'none'
          }}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
        />
      )}

      {renderHeader()}
      {mode === 'editor' && <ThemeSwitcher />}

      {/* Error message */}
      {analysisError && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(200, 30, 30, 0.9)',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          color: 'white',
          maxWidth: '80%',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <p style={{ margin: 0 }}>{analysisError}</p>
          <button
            onClick={() => setAnalysisError(null)}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Render modals */}
      {renderSentimentEditingModal()}
      {renderWordEditingModal()}
      {renderAnimationEditorModal()}
      {renderEnhancementEditorModal()}
      {renderSpeakerModal()}

      {/* Image Popup Modal */}
      {imagePopupOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          animation: 'fadeIn 0.3s ease'
        }}
          onClick={() => setImagePopupOpen(false)}
        >
          <div style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            position: 'relative'
          }}>
            <img
              src={imagePopupSrc}
              alt="Enhanced content"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{
              display: 'none',
              color: 'white',
              textAlign: 'center',
              padding: '40px',
              fontSize: '18px'
            }}>
              Failed to load image
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImagePopupOpen(false);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Enhancement Slide-out Panel */}
      {enhancementPanelOpen !== null && mode === 'player' && Object.keys(speakers).length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            [enhancementPanelSide]: enhancementPanelOpen !== null ? '0' : '-400px',
            width: '350px',
            background: currentTheme.modal,
            boxShadow: enhancementPanelSide === 'right' ? '-5px 0 25px rgba(0,0,0,0.3)' : '5px 0 25px rgba(0,0,0,0.3)',
            zIndex: 1000,
            transition: 'right 0.3s ease, left 0.3s ease',
            overflow: 'hidden'
          }}
        >
          {/* Panel Header */}
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${currentTheme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              color: currentTheme.text,
              fontSize: '18px'
            }}>
              Enhancements
            </h3>
            <button
              onClick={() => setEnhancementPanelOpen(null)}
              style={{
                background: 'none',
                border: 'none',
                color: currentTheme.text,
                fontSize: '20px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Panel Content */}
          <div style={{
            padding: '20px',
            height: 'calc(100vh - 80px)',
            overflowY: 'auto'
          }}>
            {enhancementPanelOpen !== null && groupedBySentence[enhancementPanelOpen] &&
              groupedBySentence[enhancementPanelOpen].map((word, wordIdx) => {
                if (word.enhancement?.type === 'none' ||
                  !(
                    (word.enhancement.type === 'link' && word.enhancement.url) ||
                    (word.enhancement.type === 'image' && word.enhancement.imageData)
                  )) {
                  return null;
                }

                return (
                  <div key={wordIdx} style={{
                    marginBottom: '20px',
                    padding: '15px',
                    background: currentTheme.input,
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`
                  }}>
                    {/* Word Reference */}
                    <div style={{
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: currentTheme.text,
                      opacity: 0.7
                    }}>
                      Word: <strong>"{word.word}"</strong>
                    </div>

                    {word.enhancement.type === 'image' && word.enhancement.imageData && (
                      <div>
                        <div style={{
                          marginBottom: '8px',
                          fontSize: '16px',
                          color: currentTheme.text,
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🖼️ Image
                        </div>
                        <img
                          src={word.enhancement.imageData}
                          alt={`Enhancement for "${word.word}"`}
                          style={{
                            width: '100%',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: `2px solid ${currentTheme.border}`,
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease'
                          }}
                          onClick={() => {
                            setImagePopupSrc(word.enhancement.imageData);
                            setImagePopupOpen(true);
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div style={{
                          display: 'none',
                          width: '100%',
                          height: '200px',
                          backgroundColor: currentTheme.border,
                          borderRadius: '8px',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: currentTheme.text,
                          fontSize: '14px',
                          textAlign: 'center'
                        }}>
                          Failed to load image
                        </div>
                        <div style={{
                          marginTop: '8px',
                          fontSize: '12px',
                          color: currentTheme.text,
                          opacity: 0.7,
                          textAlign: 'center'
                        }}>
                          Click to view full size
                        </div>
                      </div>
                    )}

                    {word.enhancement.type === 'link' && word.enhancement.url && (
                      <div>
                        <div style={{
                          marginBottom: '8px',
                          fontSize: '16px',
                          color: currentTheme.text,
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🔗 Link
                        </div>
                        <div
                          onClick={() => {
                            setLinkToOpen(word.enhancement.url);
                            setLinkConfirmOpen(true);
                          }}
                          style={{
                            padding: '12px',
                            background: currentTheme.highlight + '15',
                            border: `1px solid ${currentTheme.highlight}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = currentTheme.highlight + '25';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = currentTheme.highlight + '15';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{
                            color: currentTheme.text,
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            fontSize: '14px'
                          }}>
                            {word.enhancement.url.length > 30
                              ? word.enhancement.url.substring(0, 30) + '...'
                              : word.enhancement.url}
                          </div>
                          <div style={{
                            color: currentTheme.text,
                            opacity: 0.7,
                            fontSize: '12px'
                          }}>
                            Click to open external link
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }).filter(Boolean)
            }

            {enhancementPanelOpen !== null && groupedBySentence[enhancementPanelOpen] &&
              !groupedBySentence[enhancementPanelOpen].some(word =>
                word.enhancement?.type !== 'none' && (
                  (word.enhancement.type === 'link' && word.enhancement.url) ||
                  (word.enhancement.type === 'image' && word.enhancement.imageData)
                )
              ) && (
                <div style={{
                  textAlign: 'center',
                  color: currentTheme.text,
                  opacity: 0.7,
                  padding: '40px 20px'
                }}>
                  No enhancements found for this message.
                </div>
              )}
          </div>
        </div>
      )}

      {/* Click outside to close panel */}
      {enhancementPanelOpen !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999
          }}
          onClick={() => setEnhancementPanelOpen(null)}
        />
      )}

      {/* Link Confirmation Modal */}
      {linkConfirmOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: currentTheme.modal,
            padding: '25px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: currentTheme.text, marginBottom: '15px' }}>
              Open External Link?
            </h3>
            <p style={{ color: currentTheme.text, marginBottom: '20px', wordBreak: 'break-all' }}>
              {linkToOpen}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button
                onClick={() => setLinkConfirmOpen(false)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  flexGrow: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.open(linkToOpen, '_blank', 'noopener,noreferrer');
                  setLinkConfirmOpen(false);
                }}
                style={{
                  padding: '10px 16px',
                  background: currentTheme.button,
                  color: currentTheme.buttonText,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  flexGrow: 1
                }}
              >
                Open Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: wordData.length === 0 ? 'center' : 'flex-start',
          padding: mode === 'editor'
            ? (audioUrl ? '60px 5vw 380px 5vw' : '60px 5vw 300px 5vw')
            : '60px 20px 170px 20px',
          scrollBehavior: 'smooth'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: mode === 'editor' ? 'left' : 'center',
            display: mode === 'editor' ? 'flex' : 'block',
            gap: mode === 'editor' ? '20px' : '0'
          }}
        >
          {/* Instructions Panel - Only in Editor Mode */}
          {mode === 'editor' && Object.entries(groupedBySentence).length > 0 && (
            <div style={{
              width: '250px',
              flexShrink: 0,
              background: currentTheme.panel,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${currentTheme.border}`,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              alignSelf: 'flex-start',
              position: 'sticky',
              top: '80px'
            }}>
              <h3 style={{
                margin: '0 0 15px 0',
                color: currentTheme.text,
                fontSize: '16px',
                textAlign: 'center'
              }}>
                Instructions
              </h3>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '14px',
                color: currentTheme.text,
                lineHeight: '1.4'
              }}>
                <div style={{
                  padding: '10px',
                  background: currentTheme.input,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', color: currentTheme.highlight }}>
                    🖱️ Left Click
                  </div>
                  <div>Add hyperlink or image enhancement to word</div>
                </div>

                <div style={{
                  padding: '10px',
                  background: currentTheme.input,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', color: currentTheme.highlight }}>
                    🖱️ Right Click
                  </div>
                  <div>Add animation effect to word</div>
                </div>

                <div style={{
                  padding: '10px',
                  background: currentTheme.input,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', color: currentTheme.highlight }}>
                    🎭 Sentiment
                  </div>
                  <div>Click highlighted sentences to edit sentiment</div>
                </div>

                <div style={{
                  padding: '10px',
                  background: currentTheme.input,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', color: currentTheme.highlight }}>
                    👤 Speakers
                  </div>
                  <div>Click speaker avatars to edit profiles</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div style={{
            flex: mode === 'editor' && Object.entries(groupedBySentence).length > 0 ? '1' : 'none',
            width: mode === 'editor' && Object.entries(groupedBySentence).length > 0 ? 'auto' : '100%'
          }}>
            {Object.entries(groupedBySentence).length === 0 ? (
              <div style={{
                padding: '40px 20px',
                opacity: 0.7,
                textAlign: 'center',
                background: currentTheme.panel,
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                animation: 'fadeIn 0.5s ease'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎵</div>
                {mode === 'editor' ?
                  'Upload a transcript file to begin editing' :
                  'Switch to editor mode to upload a transcript'}
              </div>
            ) : mode === 'player' && Object.keys(speakers).length > 0 ? (
              // Conversation-style layout for player mode with speakers
              (() => {
                // Create individual dialogue boxes for each sentence/timestamp
                let speakerChangeIndex = 0; // Track speaker changes for alternating layout
                let lastSpeaker = null;

                return Object.entries(groupedBySentence).map(([i, sentenceWords]) => {
                  if (!sentenceWords || sentenceWords.length === 0) return null;

                  const sentenceIndex = parseInt(i);
                  const speaker = speakers[sentenceWords[0].speaker];
                  const speakerName = sentenceWords[0].speaker;
                  const isCurrentSentence = sentenceWords.some(w => w.wordIndex === highlightIndex);

                  // Check if speaker changed to determine alternating alignment
                  if (speakerName !== lastSpeaker) {
                    speakerChangeIndex++;
                    lastSpeaker = speakerName;
                  }

                  // Determine if this should be left (even index) or right (odd index) aligned
                  const isRightAligned = speakerChangeIndex % 2 === 0;

                  return (
                    <div
                      key={sentenceIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        marginBottom: '1rem',
                        opacity: isCurrentSentence ? 1 : 0.4,
                        transition: 'opacity 0.3s ease',
                        filter: !isCurrentSentence ? 'blur(1px)' : 'none',
                        justifyContent: isRightAligned ? 'flex-end' : 'flex-start',
                        paddingLeft: isRightAligned ? '60px' : '0',
                        paddingRight: isRightAligned ? '0' : '60px'
                      }}
                    >
                      {/* Speaker Avatar with Name - Left side */}
                      {!isRightAligned && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {/* Speaker Name */}
                          <div style={{
                            color: speaker?.color || currentTheme.highlight,
                            fontWeight: 'bold',
                            fontSize: '12px',
                            textAlign: 'center',
                            maxWidth: '60px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {speaker?.displayName || speakerName || 'Unknown'}
                          </div>

                          {/* Avatar */}
                          <div style={{
                            minWidth: '50px',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: speaker?.photo ? `url(${speaker.photo})` : (speaker?.color || '#888'),
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            border: `3px solid ${isCurrentSentence ? currentTheme.highlight : currentTheme.border}`,
                            boxShadow: isCurrentSentence ? `0 0 20px ${currentTheme.highlight}40` : 'none',
                            transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                          }}>
                            {!speaker?.photo && (speaker?.displayName || speakerName || 'U').charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}

                      {/* Speech Bubble */}
                      <div style={{
                        maxWidth: '70%',
                        background: currentTheme.panel,
                        borderRadius: '18px',
                        padding: '12px 16px',
                        position: 'relative',
                        border: `2px solid ${isCurrentSentence ? currentTheme.highlight : currentTheme.border}`,
                        boxShadow: isCurrentSentence ? `0 8px 25px ${currentTheme.highlight}20` : '0 4px 15px rgba(0,0,0,0.1)',
                        transform: isCurrentSentence ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.3s ease'
                      }}>
                        {/* Speech bubble pointer */}
                        <div style={{
                          position: 'absolute',
                          [isRightAligned ? 'right' : 'left']: '-8px',
                          top: '15px',
                          width: 0,
                          height: 0,
                          borderTop: `8px solid transparent`,
                          borderBottom: `8px solid transparent`,
                          [isRightAligned ? 'borderLeft' : 'borderRight']: `8px solid ${currentTheme.panel}`,
                          filter: `drop-shadow(${isRightAligned ? '2px' : '-2px'} 0px 0px ${isCurrentSentence ? currentTheme.highlight : currentTheme.border})`
                        }}></div>


                        {/* Single Sentence Content */}
                        <div
                          ref={(el) => {
                            sentenceRefs.current[sentenceIndex] = el;
                          }}
                          style={{
                            lineHeight: '1.5',
                            fontSize: '12px',
                            textAlign: 'left'
                          }}
                        >
                          {sentenceWords.map((word, j) => {
                            const isActive = word.wordIndex <= highlightIndex;
                            const shouldAnimate = word.animation?.type !== 'none' && isActive;
                            const animationClass = shouldAnimate ? `word-animate-${word.animation.type}` : '';

                            let dynamicStyle = {
                              fontSize: word.size,
                              color: isActive ? currentTheme.active : currentTheme.inactive,
                              fontWeight: isActive ? 'bold' : 'normal',
                              margin: '0 2px',
                              display: 'inline-block',
                              transition: word.animation?.type === 'none' ? 'color 0.05s ease, font-weight 0.05s ease' : 'none',
                              '--duration': shouldAnimate ? `${word.animation.duration}s` : '1.2s',
                              '--delay': shouldAnimate ? `${word.animation.delay}s` : '0s'
                            };

                            return (
                              <span key={j}>
                                <span
                                  className={animationClass}
                                  style={dynamicStyle}
                                >
                                  {word.word}{j < sentenceWords.length - 1 ? ' ' : ''}
                                </span>
                              </span>
                            );
                          })}

                        </div>

                        {/* Enhancement Arrow - only show if there are enhancements */}
                        {sentenceWords.some(word =>
                          word.enhancement?.type !== 'none' && (
                            (word.enhancement.type === 'link' && word.enhancement.url) ||
                            (word.enhancement.type === 'image' && word.enhancement.imageData)
                          )
                        ) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEnhancementPanelOpen(enhancementPanelOpen === sentenceIndex ? null : sentenceIndex);
                                setEnhancementPanelSide(isRightAligned ? 'left' : 'right');
                              }}
                              style={{
                                position: 'absolute',
                                [isRightAligned ? 'left' : 'right']: '-12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: currentTheme.highlight,
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s ease',
                                zIndex: 10
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-50%) scale(1.1)';
                                e.target.style.background = currentTheme.buttonHover;
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(-50%) scale(1)';
                                e.target.style.background = currentTheme.highlight;
                              }}
                              title="View enhancements"
                            >
                              {enhancementPanelOpen === sentenceIndex ? '✕' : (isRightAligned ? '◀' : '▶')}
                            </button>
                          )}
                      </div>

                      {/* Speaker Avatar with Name - Right side */}
                      {isRightAligned && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {/* Speaker Name */}
                          <div style={{
                            color: speaker?.color || currentTheme.highlight,
                            fontWeight: 'bold',
                            fontSize: '12px',
                            textAlign: 'center',
                            maxWidth: '60px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {speaker?.displayName || speakerName || 'Unknown'}
                          </div>

                          {/* Avatar */}
                          <div style={{
                            minWidth: '50px',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: speaker?.photo ? `url(${speaker.photo})` : (speaker?.color || '#888'),
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            border: `3px solid ${isCurrentSentence ? currentTheme.highlight : currentTheme.border}`,
                            boxShadow: isCurrentSentence ? `0 0 20px ${currentTheme.highlight}40` : 'none',
                            transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                          }}>
                            {!speaker?.photo && (speaker?.displayName || speakerName || 'U').charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }).filter(Boolean); // Filter out null entries
              })()
            ) : (
              // Standard layout for editor mode or player mode without speakers
              Object.entries(groupedBySentence).map(([i, sentenceWords]) => {
                if (!sentenceWords || sentenceWords.length === 0) return null;

                const sentenceIndex = parseInt(i);
                const isCurrentSentence = sentenceWords.some(w => w.wordIndex === highlightIndex);
                const sentimentInfo = sentimentData[sentenceIndex];
                const hasSentiment = !!sentimentInfo;

                return (
                  <div
                    key={sentenceIndex}
                    ref={(el) => sentenceRefs.current[sentenceIndex] = el}
                    onClick={() => {
                      if (mode === 'editor' && hasSentiment) {
                        setEditingSentimentIndex(sentenceIndex);
                      }
                    }}
                    style={{
                      marginBottom: '1.5rem',
                      lineHeight: '1.5',
                      opacity: mode === 'player' ? (isCurrentSentence ? 1 : 0.5) : 1,
                      transition: 'opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease',
                      textAlign: 'center',
                      display: 'block',
                      position: 'relative',
                      filter: mode === 'player' && !isCurrentSentence ? 'blur(1px)' : 'none',
                      transform: mode === 'player' && isCurrentSentence ? 'scale(1.05)' : 'scale(1)',
                      background: mode === 'editor' ? getSentimentColor(sentenceIndex) : 'transparent',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: mode === 'editor' && hasSentiment ? 'pointer' : 'default'
                    }}
                  >
                    {/* Speaker indicator for editor mode */}
                    {mode === 'editor' && sentenceWords[0]?.speaker && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '-12px',
                        background: speakers[sentenceWords[0].speaker]?.color || currentTheme.highlight,
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        border: `2px solid ${currentTheme.panel}`,
                        cursor: 'pointer',
                        zIndex: 6,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (speakers[sentenceWords[0].speaker]) {
                            openSpeakerModal(sentenceWords[0].speaker);
                          }
                        }}
                        title={`Speaker: ${speakers[sentenceWords[0].speaker]?.displayName || sentenceWords[0].speaker}`}
                      >
                        {speakers[sentenceWords[0].speaker]?.photo ? (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: `url(${speakers[sentenceWords[0].speaker].photo})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}></div>
                        ) : (
                          (speakers[sentenceWords[0].speaker]?.displayName || sentenceWords[0].speaker || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                    )}

                    {/* Sentiment indicator for editor mode */}
                    {mode === 'editor' && hasSentiment && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        background: currentTheme.panel,
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSentimentIndex(sentenceIndex);
                        }}
                      >
                        {getSentimentEmoji(sentimentInfo.sentiment)}
                      </div>
                    )}

                    {mode === 'player' ? (
                      <div style={{ display: 'inline-block', textAlign: 'center' }}>
                        {sentenceWords.map((word, j) => {
                          const isActive = word.wordIndex <= highlightIndex;
                          const shouldAnimate = word.animation?.type !== 'none' && isActive;
                          const animationClass = shouldAnimate ? `word-animate-${word.animation.type}` : '';

                          // Apply global audio effects
                          let dynamicStyle = {
                            fontSize: word.size,
                            color: isActive ? currentTheme.active : currentTheme.inactive,
                            fontWeight: isActive ? 'bold' : 'normal',
                            margin: '0 2px',
                            display: 'inline-block',
                            transition: word.animation?.type === 'none' ? 'color 0.05s ease, font-weight 0.05s ease' : 'none',
                            '--duration': shouldAnimate ? `${word.animation.duration}s` : '1.2s',
                            '--delay': shouldAnimate ? `${word.animation.delay}s` : '0s'
                          };

                          // No audio effects needed anymore - sentiment background handles global mood

                          return (
                            <span
                              key={j}
                              className={animationClass}
                              style={dynamicStyle}
                            >
                              {word.word}{j < sentenceWords.length - 1 ? ' ' : ''}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      // Editor mode with word-by-word editing
                      <div style={{ display: 'block', textAlign: 'left', width: '100%' }}>
                        {sentenceWords.map((w) => (
                          <span
                            key={w.wordIndex}
                            data-word-index={w.wordIndex}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (mode === 'editor') {
                                openAnimationEditor(w.wordIndex);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (mode === 'editor') {
                                setEditingWordEnhancement(w.wordIndex);
                                setEnhancementType(w.enhancement?.type !== 'none' ? w.enhancement.type : null);
                                setEnhancementUrl(w.enhancement?.url || '');
                                setEnhancementImage(w.enhancement?.imageData || null);
                              }
                            }}
                            style={{
                              fontSize: w.size,
                              color: w.color,
                              fontWeight: w.wordIndex === highlightIndex ? 'bold' : 'normal',
                              margin: '0 4px',
                              padding: '2px',
                              cursor: 'pointer',
                              display: 'inline-block',
                              transition: 'color 0.1s ease, font-weight 0.1s ease',
                              textDecoration: mode === 'editor' ? 'underline dotted' : 'none',
                              textDecorationColor: mode === 'editor' ? 'rgba(255,255,255,0.3)' : 'none',
                              background: w.animation?.type !== 'none' ? currentTheme.highlight + '20' :
                                w.enhancement?.type !== 'none' && (
                                  (w.enhancement.type === 'link' && w.enhancement.url) ||
                                  (w.enhancement.type === 'image' && w.enhancement.imageData)
                                ) ? (w.enhancement.type === 'image' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(0, 123, 255, 0.3)') : 'transparent',
                              borderRadius: (w.animation?.type !== 'none' ||
                                (w.enhancement?.type !== 'none' && (
                                  (w.enhancement.type === 'link' && w.enhancement.url) ||
                                  (w.enhancement.type === 'image' && w.enhancement.imageData)
                                ))) ? '3px' : '0',
                              border: w.enhancement?.type !== 'none' && (
                                (w.enhancement.type === 'link' && w.enhancement.url) ||
                                (w.enhancement.type === 'image' && w.enhancement.imageData)
                              ) ? (w.enhancement.type === 'image' ? '1px solid rgba(255, 193, 7, 0.6)' : '1px solid rgba(0, 123, 255, 0.6)') : 'none'
                            }}
                            title={mode === 'editor' ?
                              (w.enhancement?.type !== 'none' && (
                                (w.enhancement.type === 'link' && w.enhancement.url) ||
                                (w.enhancement.type === 'image' && w.enhancement.imageData)
                              ) ?
                                `Enhanced: ${w.enhancement.type} | Left click: Edit | Right click: Add animation` :
                                'Left click: Add link/image | Right click: Add animation'
                              ) : ''}
                          >
                            {w.word}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>


      {/* Editor Controls Panel */}
      {mode === 'editor' && (
        <div
          style={{
            position: 'fixed',
            bottom: audioUrl ? '80px' : '20px',
            left: 0,
            right: 0,
            background: currentTheme.panel,
            borderTop: `1px solid ${currentTheme.border}`,
            padding: '15px',
            zIndex: 89
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '20px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Upload Column */}
            <div style={{
              background: currentTheme.input,
              borderRadius: '8px',
              padding: '12px',
              border: `1px solid ${currentTheme.border}`
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                color: currentTheme.text,
                textAlign: 'center',
                fontSize: '16px'
              }}>
                Upload
              </h3>

              {/* Upload Audio */}
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '8px 12px',
                background: currentTheme.button,
                color: currentTheme.buttonText,
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                marginBottom: '8px',
                fontSize: '17px'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = currentTheme.buttonHover}
                onMouseLeave={(e) => e.currentTarget.style.background = currentTheme.button}
              >
                📁 Audio File
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Upload Transcript */}
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '8px 12px',
                background: currentTheme.button,
                color: currentTheme.buttonText,
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                marginBottom: '12px',
                fontSize: '17px'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = currentTheme.buttonHover}
                onMouseLeave={(e) => e.currentTarget.style.background = currentTheme.button}
              >
                📄 Transcript
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleTranscriptUpload}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Settings */}
              <div style={{ borderTop: `1px solid ${currentTheme.border}`, paddingTop: '10px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{
                    color: currentTheme.text,
                    display: 'block',
                    marginBottom: '4px',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    Font
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px',
                      borderRadius: '4px',
                      border: `1px solid ${currentTheme.border}`,
                      background: currentTheme.modal,
                      color: currentTheme.text,
                      fontSize: '15px'
                    }}
                  >
                    <option value="sans-serif">Sans-serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Times New Roman">Times New Roman</option>
                  </select>
                </div>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: currentTheme.text,
                  gap: '6px',
                  fontSize: '16px'
                }}>
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                  Auto Scroll
                </label>
              </div>
            </div>

            {/* Speakers Column */}
            <div style={{
              background: currentTheme.input,
              borderRadius: '8px',
              padding: '15px',
              border: `1px solid ${currentTheme.border}`
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                color: currentTheme.text,
                textAlign: 'center',
                fontSize: '16px'
              }}>
                Speakers ({Object.keys(speakers).length})
              </h3>

              {Object.keys(speakers).length > 0 ? (
                <>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {Object.entries(speakers).map(([speakerName, speaker]) => (
                      <div
                        key={speakerName}
                        onClick={() => openSpeakerModal(speakerName)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px',
                          background: currentTheme.modal,
                          border: `1px solid ${currentTheme.border}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = currentTheme.highlight + '20'}
                        onMouseLeave={e => e.currentTarget.style.background = currentTheme.modal}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: speaker.photo ? `url(${speaker.photo})` : speaker.color,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          border: `1px solid ${currentTheme.border}`
                        }}>
                          {!speaker.photo && speaker.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: currentTheme.text, fontWeight: 'bold', fontSize: '17px' }}>
                          {speaker.displayName}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: '15px',
                    opacity: 0.8,
                    color: currentTheme.text,
                    marginTop: '8px'
                  }}>
                    Click to edit profiles
                  </div>
                </>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: currentTheme.text,
                  opacity: 0.7,
                  fontStyle: 'italic',
                  fontSize: '17px'
                }}>
                  Upload transcript to see speakers
                </div>
              )}
            </div>

            {/* Sentiment Column */}
            <div style={{
              background: currentTheme.input,
              borderRadius: '8px',
              padding: '15px',
              border: `1px solid ${currentTheme.border}`
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                color: currentTheme.text,
                textAlign: 'center',
                fontSize: '16px'
              }}>
                Sentiment
              </h3>

              {/* Server Status */}
              {serverWarmingUp && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '10px',
                  padding: '6px',
                  background: currentTheme.modal,
                  borderRadius: '4px',
                  color: currentTheme.text,
                  fontSize: '16px'
                }}>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${currentTheme.text}40`,
                    borderRadius: '50%',
                    borderTopColor: currentTheme.text,
                    animation: 'spin 1s linear infinite'
                  }}></span>
                  Warming up server...
                </div>
              )}

              {/* Analyze Button */}
              {wordData.length > 0 && (
                <button
                  onClick={analyzeSentiment}
                  disabled={isAnalyzing}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    background: isAnalyzing ? `${currentTheme.button}80` : currentTheme.button,
                    color: currentTheme.buttonText,
                    border: 'none',
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'background 0.2s ease',
                    fontSize: '17px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnalyzing) e.currentTarget.style.background = currentTheme.buttonHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isAnalyzing ? `${currentTheme.button}80` : currentTheme.button;
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="spinner" style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        border: `2px solid ${currentTheme.buttonText}40`,
                        borderRadius: '50%',
                        borderTopColor: currentTheme.buttonText,
                        animation: 'spin 1s linear infinite'
                      }}></span>
                      Analyzing...
                    </>
                  ) : (
                    '🎭 Analyze'
                  )}
                </button>
              )}

              {/* Sentiment Background Effects */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: currentTheme.text,
                  fontSize: '16px',
                  gap: '6px'
                }}>
                  <input
                    type="checkbox"
                    checked={globalAnimations.sentimentBackground}
                    onChange={(e) => setGlobalAnimations(prev => ({ ...prev, sentimentBackground: e.target.checked }))}
                  />
                  🌈 Background Effects
                </label>

                {globalAnimations.sentimentBackground && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px',
                    background: currentTheme.modal,
                    borderRadius: '4px',
                    fontSize: '15px'
                  }}>
                    <div style={{ color: currentTheme.text, marginBottom: '6px' }}>
                      Intensity: {(sentimentIntensity * 100).toFixed(0)}%
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={sentimentIntensity}
                      onChange={(e) => setSentimentIntensity(parseFloat(e.target.value))}
                      style={{ width: '100%', height: '16px' }}
                    />
                  </div>
                )}
              </div>

              {/* Sentiment Legend */}
              {Object.keys(sentimentData).length > 0 ? (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px'
                  }}>
                    {Object.entries(currentTheme.sentiments).map(([sentiment, color]) => (
                      <div key={sentiment} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px',
                        borderRadius: '3px',
                        fontSize: '15px'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          background: color,
                          borderRadius: '2px'
                        }}></span>
                        <span style={{ color: currentTheme.text }}>
                          {getSentimentEmoji(sentiment)} {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: currentTheme.text,
                  opacity: 0.7,
                  fontStyle: 'italic',
                  fontSize: '16px'
                }}>
                  Run analysis to see data
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: currentTheme.panel,
            borderTop: `1px solid ${currentTheme.border}`,
            padding: '15px',
            zIndex: 100
          }}
        >
          <audio
            ref={audioRef}
            controls
            src={audioUrl}
            style={{
              width: '100%',
              maxWidth: '600px',
              margin: '0 auto',
              display: 'block',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </div>
  );
}