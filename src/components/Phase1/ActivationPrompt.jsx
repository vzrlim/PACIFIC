// ActivationPrompt.jsx - Immediate AI Lesson Clarification Interface
// User-AI interface for instant questions about any aspect/detail of AI-prepared lessons
// Updates internal AI learning analytics storage (computer's own notes, not human-readable)

import React, { useState, useEffect, useRef } from 'react';

// Conversation monitoring thresholds
const SCOPE_MONITORING = {
  max_followup_depth: 3,        // Maximum sub-concept depth before warning
  max_concept_time: 1500,       // 25 minutes max per main concept (seconds)
  off_topic_threshold: 0.7,     // Similarity threshold for staying on topic
  time_warning_threshold: 0.8,  // Warn at 80% of allocated time
  
  // Keywords that indicate scope creep
  scope_creep_indicators: [
    'but what about', 'this reminds me', 'speaking of', 'by the way',
    'that makes me think', 'i also want to know', 'what if', 'how about'
  ],
  
  // Keywords that indicate confusion/need clarification
  confusion_indicators: [
    'confused', 'dont understand', 'what does', 'explain', 'clarify',
    'i dont get', 'not clear', 'can you explain', 'what means'
  ]
};

// User shortcoming categories for adaptive teaching
const SHORTCOMING_CATEGORIES = {
  vocabulary: {
    name: 'Vocabulary Gaps',
    indicators: ['what does X mean', 'dont know this word', 'new word'],
    adaptation: 'Include more vocabulary pre-teaching'
  },
  grammar: {
    name: 'Grammar Confusion',
    indicators: ['grammar', 'why is it', 'sentence structure', 'tense'],
    adaptation: 'Provide more grammar scaffolding'
  },
  cultural_context: {
    name: 'Cultural Context Missing',
    indicators: ['why do they', 'cultural', 'custom', 'tradition'],
    adaptation: 'Add more cultural background'
  },
  pronunciation: {
    name: 'Pronunciation Issues',
    indicators: ['how to say', 'pronounce', 'sounds like'],
    adaptation: 'Include pronunciation guides'
  },
  application: {
    name: 'Application Difficulty',
    indicators: ['how to use', 'when to use', 'example', 'practice'],
    adaptation: 'Provide more practical examples'
  }
};

const ActivationPrompt = ({
  currentConcept,
  allocatedTime = 1500, // seconds (25 minutes)
  onShortcomingDetected,
  onScopeCreepAlert,
  onTimeUpdate,
  onMoveToQA,
  onUpdateInternalLearningAnalytics, // Internal AI storage, NOT user profile
  userProfile = {},
  isVisible = true
}) => {
  // Chat State
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationDepth, setConversationDepth] = useState(0);
  
  // Monitoring State
  const [conceptStartTime, setConceptStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [scopeWarnings, setScopeWarnings] = useState(0);
  const [detectedShortcomings, setDetectedShortcomings] = useState({});
  
  // UI State
  const [showScopeAlert, setShowScopeAlert] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const chatInputRef = useRef(null);

  // Initialize concept timer when concept changes
  useEffect(() => {
    if (currentConcept) {
      setConceptStartTime(Date.now());
      setTimeSpent(0);
      setConversationDepth(0);
      setScopeWarnings(0);
      setMessages([{
        id: Date.now(),
        type: 'system',
        content: `Ready to answer questions about: ${currentConcept.title}`,
        timestamp: new Date()
      }]);
      
      // Start time tracking
      timeIntervalRef.current = setInterval(() => {
        setTimeSpent(prev => {
          const newTime = prev + 1;
          
          // Time warning at 80%
          if (newTime >= allocatedTime * SCOPE_MONITORING.time_warning_threshold && !showTimeWarning) {
            setShowTimeWarning(true);
          }
          
          // Time exceeded
          if (newTime >= allocatedTime) {
            handleTimeExceeded();
          }
          
          if (onTimeUpdate) {
            onTimeUpdate(newTime, allocatedTime);
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [currentConcept]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle user message submission
  const handleSubmitMessage = async () => {
    if (!currentInput.trim() || isTyping) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentInput.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const inputContent = currentInput.trim();
    setCurrentInput('');
    setIsTyping(true);
    
    // Analyze message for scope and shortcomings
    const analysis = analyzeUserMessage(inputContent);
    
    // Handle scope monitoring
    if (analysis.isScopeCreep) {
      handleScopeCreep(inputContent);
      return;
    }
    
    // Detect shortcomings
    if (analysis.shortcomings.length > 0) {
      handleShortcomingsDetected(analysis.shortcomings);
    }
    
    // Simulate AI response (replace with actual AI API call)
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputContent, analysis);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }]);
      
      setIsTyping(false);
      setConversationDepth(prev => prev + 1);
      
      // Check if conversation is getting too deep
      if (conversationDepth >= SCOPE_MONITORING.max_followup_depth) {
        handleDeepConversation();
      }
    }, 1000 + Math.random() * 2000); // Simulate AI thinking time
  };

  // Analyze user message for patterns
  const analyzeUserMessage = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Check for scope creep indicators
    const scopeCreepFound = SCOPE_MONITORING.scope_creep_indicators.some(indicator =>
      lowerMessage.includes(indicator)
    );
    
    // Check for confusion indicators
    const confusionFound = SCOPE_MONITORING.confusion_indicators.some(indicator =>
      lowerMessage.includes(indicator)
    );
    
    // Detect shortcoming categories
    const shortcomings = [];
    Object.entries(SHORTCOMING_CATEGORIES).forEach(([key, category]) => {
      const hasIndicator = category.indicators.some(indicator =>
        lowerMessage.includes(indicator)
      );
      if (hasIndicator) {
        shortcomings.push(key);
      }
    });
    
    // Check topic relevance (simplified - in real implementation, use semantic similarity)
    const isRelevant = checkTopicRelevance(message, currentConcept);
    
    return {
      isScopeCreep: scopeCreepFound || !isRelevant,
      isConfusion: confusionFound,
      shortcomings,
      relevanceScore: isRelevant ? 0.8 : 0.3
    };
  };

  // Simple topic relevance check (replace with semantic analysis)
  const checkTopicRelevance = (message, concept) => {
    if (!concept?.keywords) return true; // Default to relevant if no keywords
    
    const messageWords = message.toLowerCase().split(/\s+/);
    const conceptKeywords = concept.keywords.map(k => k.toLowerCase());
    
    const relevantWords = messageWords.filter(word =>
      conceptKeywords.some(keyword => 
        keyword.includes(word) || word.includes(keyword)
      )
    ).length;
    
    return relevantWords >= Math.min(2, conceptKeywords.length * 0.3);
  };

  // Handle scope creep detection
  const handleScopeCreep = (message) => {
    setScopeWarnings(prev => prev + 1);
    setShowScopeAlert(true);
    
    const alertMessage = {
      id: Date.now(),
      type: 'alert',
      content: `This question seems to be moving away from our main concept: "${currentConcept.title}". Would you like to save this for the Q&A section to keep our main lesson focused?`,
      timestamp: new Date(),
      actions: [
        {
          label: 'Move to Q&A',
          action: () => handleMoveToQA(message)
        },
        {
          label: 'Stay on Topic',
          action: () => setShowScopeAlert(false)
        }
      ]
    };
    
    setMessages(prev => [...prev, alertMessage]);
    setIsTyping(false);
    
    if (onScopeCreepAlert) {
      onScopeCreepAlert({
        message,
        warnings: scopeWarnings + 1,
        conceptTitle: currentConcept.title
      });
    }
  };

  // Handle deep conversation warning
  const handleDeepConversation = () => {
    const warningMessage = {
      id: Date.now(),
      type: 'warning',
      content: `We're diving quite deep into sub-concepts. To stay efficient and complete our lesson on time, consider moving detailed questions to the Q&A section.`,
      timestamp: new Date(),
      actions: [
        {
          label: 'Continue Here',
          action: () => {}
        },
        {
          label: 'Move to Q&A',
          action: () => handleMoveToQA('Deep discussion')
        }
      ]
    };
    
    setMessages(prev => [...prev, warningMessage]);
  };

  // Handle time exceeded
  const handleTimeExceeded = () => {
    const timeAlert = {
      id: Date.now(),
      type: 'time_alert',
      content: `Time allocated for this concept has been exceeded. Continuing may delay your overall learning schedule. Consider moving remaining questions to Q&A.`,
      timestamp: new Date(),
      actions: [
        {
          label: 'Wrap Up',
          action: () => handleWrapUp()
        },
        {
          label: 'Continue (+5 min)',
          action: () => extendTime(300)
        }
      ]
    };
    
    setMessages(prev => [...prev, timeAlert]);
  };

  // Handle shortcomings detection - Updates internal AI learning analytics storage
  const handleShortcomingsDetected = (shortcomingTypes) => {
    shortcomingTypes.forEach(type => {
      setDetectedShortcomings(prev => ({
        ...prev,
        [type]: (prev[type] || 0) + 1
      }));
    });
    
    // Update internal AI learning analytics (computer's own notes, not human-readable profile)
    if (onShortcomingDetected) {
      onShortcomingDetected({
        types: shortcomingTypes,
        cumulative: detectedShortcomings,
        adaptations: shortcomingTypes.map(type => SHORTCOMING_CATEGORIES[type].adaptation)
      });
    }
    
    // Also update the internal learning analytics storage
    if (onUpdateInternalLearningAnalytics) {
      onUpdateInternalLearningAnalytics({
        timestamp: new Date().toISOString(),
        concept: currentConcept.title,
        shortcomings: shortcomingTypes,
        context: 'activation_prompt_clarification'
      });
    }
  };

  // Generate AI response (placeholder - replace with actual AI API)
  const generateAIResponse = (userInput, analysis) => {
    // This would be replaced with actual AI API call
    if (analysis.isConfusion) {
      return `Let me clarify that for you. [AI would provide specific clarification about ${currentConcept.title}]`;
    }
    
    if (analysis.shortcomings.includes('vocabulary')) {
      return `I notice you're asking about vocabulary. Let me explain that term in the context of ${currentConcept.title}...`;
    }
    
    return `Great question about ${currentConcept.title}. [AI would provide contextual explanation]`;
  };

  // Handle moving conversation to Q&A
  const handleMoveToQA = (content) => {
    if (onMoveToQA) {
      onMoveToQA({
        content,
        conceptTitle: currentConcept.title,
        messages: messages.slice(-3) // Include recent context
      });
    }
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: 'Question moved to Q&A section. Let\'s continue with the main concept.',
      timestamp: new Date()
    }]);
    
    setConversationDepth(0);
    setShowScopeAlert(false);
  };

  // Handle wrapping up
  const handleWrapUp = () => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: 'Moving on to keep your learning schedule on track. Great questions!',
      timestamp: new Date()
    }]);
  };

  // Extend time allocation
  const extendTime = (additionalSeconds) => {
    // This would update the global time tracking
    setShowTimeWarning(false);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time progress
  const timeProgress = Math.min((timeSpent / allocatedTime) * 100, 100);

  if (!isVisible) return null;

  return (
    <div className="activation-prompt" style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      width: isMinimized ? '60px' : '400px',
      height: isMinimized ? '60px' : '500px',
      backgroundColor: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Times New Roman", Times, serif',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '2px solid var(--border)',
        backgroundColor: 'var(--harvard-crimson)',
        color: 'var(--warm-white)',
        borderTopLeftRadius: 'var(--radius)',
        borderTopRightRadius: 'var(--radius)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
            Quick Clarification
          </h4>
          {!isMinimized && (
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              {currentConcept?.title || 'No active concept'}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isMinimized && (
            <div style={{ fontSize: '0.8rem' }}>
              {formatTime(timeSpent)}/{formatTime(allocatedTime)}
            </div>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--warm-white)',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            {isMinimized ? '⬆' : '⬇'}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Time Progress Bar */}
          <div style={{
            height: '4px',
            backgroundColor: 'var(--muted)',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${timeProgress}%`,
              backgroundColor: timeProgress > 80 ? 'var(--harvard-crimson)' : 'var(--dartmouth-green)',
              transition: 'all 0.3s ease'
            }}></div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {messages.map(message => (
              <div key={message.id} style={{
                alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}>
                <div style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 
                    message.type === 'user' ? 'var(--harvard-crimson)' :
                    message.type === 'alert' ? 'var(--oxford-blue)' :
                    message.type === 'warning' ? 'var(--tsinghua-purple)' :
                    message.type === 'time_alert' ? 'var(--harvard-crimson)' :
                    'var(--muted)',
                  color: message.type === 'user' || message.type === 'alert' || message.type === 'warning' || message.type === 'time_alert' 
                    ? 'var(--warm-white)' 
                    : 'var(--dark-charcoal-grey)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  {message.content}
                  
                  {message.actions && (
                    <div style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'var(--warm-white)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{
                alignSelf: 'flex-start',
                maxWidth: '80%'
              }}>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  color: 'var(--medium-grey)'
                }}>
                  AI is thinking...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '1rem',
            borderTop: '2px solid var(--border)',
            backgroundColor: 'var(--muted)'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                ref={chatInputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitMessage()}
                placeholder="Ask about this concept..."
                disabled={isTyping}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '0.9rem'
                }}
              />
              <button
                onClick={handleSubmitMessage}
                disabled={!currentInput.trim() || isTyping}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: (!currentInput.trim() || isTyping) ? 'var(--medium-grey)' : 'var(--harvard-crimson)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: (!currentInput.trim() || isTyping) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Send
              </button>
            </div>
            
            {/* Quick Info */}
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--medium-grey)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Depth: {conversationDepth}/3</span>
              <span>Scope warnings: {scopeWarnings}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivationPrompt;