// FlowRetainer.jsx - Seamless Learning Resumption System (Fixed Timing)
// Helps users smoothly resume learning after any planned/unplanned interruption

import React, { useState, useEffect, useRef } from 'react';

// Interruption detection thresholds (FIXED: 20 minutes instead of 3)
const FLOW_CONFIG = {
  idle_detection_threshold: 1200000,       // 20 minutes of inactivity triggers detection
  short_break_threshold: 600000,           // 10 minutes = short break
  long_break_threshold: 1800000,           // 30 minutes = long break
  session_timeout: 7200000,                // 2 hours = session timeout
  
  // Context preservation levels
  context_preservation: {
    immediate: 5,     // Last 5 seconds of activity
    short_term: 30,   // Last 30 seconds for short breaks
    medium_term: 120, // Last 2 minutes for longer breaks
    long_term: 300    // Last 5 minutes for extended breaks
  }
};

// Break types and resumption strategies
const BREAK_TYPES = {
  micro: {
    duration: [0, 300000],           // 0-5 minutes
    name: 'Quick pause',
    resumption: 'immediate',
    context_needed: 'minimal'
  },
  short: {
    duration: [300000, 900000],      // 5-15 minutes
    name: 'Short break',
    resumption: 'gentle_reminder',
    context_needed: 'current_section'
  },
  medium: {
    duration: [900000, 1800000],     // 15-30 minutes
    name: 'Extended break',
    resumption: 'full_context',
    context_needed: 'lesson_progress'
  },
  long: {
    duration: [1800000, Infinity],   // 30+ minutes
    name: 'Long absence',
    resumption: 'fresh_start',
    context_needed: 'complete_recap'
  }
};

const FlowRetainer = ({
  currentLesson,
  currentSection,
  learningProgress,
  lastActivity,
  onResumeSession,
  onSessionTimeout,
  isActive = true
}) => {
  // State management
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakType, setBreakType] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [contextSnapshot, setContextSnapshot] = useState(null);
  
  // Activity tracking
  const [activityLog, setActivityLog] = useState([]);
  const [userReturn, setUserReturn] = useState(false);
  const [resumeContext, setResumeContext] = useState(null);
  
  // Refs
  const activityTimeoutRef = useRef(null);
  const visibilityTimeoutRef = useRef(null);
  const mouseActivityRef = useRef(null);
  const keyboardActivityRef = useRef(null);

  // Initialize activity tracking
  useEffect(() => {
    if (!isActive) return;

    const handleActivity = () => {
      const now = Date.now();
      setLastActiveTime(now);
      
      // If returning from break, trigger resume flow
      if (isOnBreak) {
        handleUserReturn(now);
      }
      
      // Reset idle detection timer
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      activityTimeoutRef.current = setTimeout(() => {
        handleIdleDetection();
      }, FLOW_CONFIG.idle_detection_threshold);
    };

    // Track various activity types
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handlePageHidden();
      } else {
        handlePageVisible();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial activity timeout
    activityTimeoutRef.current = setTimeout(() => {
      handleIdleDetection();
    }, FLOW_CONFIG.idle_detection_threshold);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [isActive, isOnBreak]);

  // Handle idle detection
  const handleIdleDetection = () => {
    if (isOnBreak) return; // Already detected
    
    const now = Date.now();
    setBreakStartTime(now);
    setIsOnBreak(true);
    
    // Capture current context before user leaves
    captureCurrentContext();
    
    // Start monitoring for return
    startReturnMonitoring();
  };

  // Handle page becoming hidden (tab switch, minimize, etc.)
  const handlePageHidden = () => {
    const now = Date.now();
    if (!isOnBreak) {
      setBreakStartTime(now);
      setIsOnBreak(true);
      captureCurrentContext();
    }
  };

  // Handle page becoming visible again
  const handlePageVisible = () => {
    if (isOnBreak) {
      handleUserReturn(Date.now());
    }
  };

  // Capture learning context before break
  const captureCurrentContext = () => {
    const context = {
      timestamp: Date.now(),
      lesson: {
        title: currentLesson?.title,
        section: currentSection?.title,
        progress: learningProgress?.percentage || 0,
        timeSpent: learningProgress?.timeSpent || 0
      },
      lastActivity: {
        type: getLastActivityType(),
        content: getLastContent(),
        position: getCurrentPosition()
      },
      recentProgress: getRecentProgress(),
      nextSteps: getNextSteps()
    };
    
    setContextSnapshot(context);
    
    // Log this break
    setActivityLog(prev => [...prev, {
      type: 'break_start',
      timestamp: Date.now(),
      context: context
    }].slice(-20)); // Keep last 20 activities
  };

  // Determine what user was last doing
  const getLastActivityType = () => {
    // This would integrate with other components to know what user was doing
    if (currentSection?.type === 'reading') return 'reading';
    if (currentSection?.type === 'interactive') return 'practicing';
    if (currentSection?.type === 'video') return 'watching';
    return 'learning';
  };

  // Get current content context
  const getLastContent = () => {
    return {
      sectionTitle: currentSection?.title || 'Unknown section',
      concept: currentSection?.mainConcept || 'Learning concept',
      lastSentence: currentSection?.lastReadSentence || '',
      keyTerms: currentSection?.keyTerms || []
    };
  };

  // Get user's position in content
  const getCurrentPosition = () => {
    return {
      scrollPosition: window.scrollY,
      sectionProgress: learningProgress?.sectionProgress || 0,
      totalProgress: learningProgress?.totalProgress || 0
    };
  };

  // Get recent learning progress
  const getRecentProgress = () => {
    const recent = activityLog.slice(-5).map(activity => ({
      type: activity.type,
      time: activity.timestamp,
      achievement: activity.achievement || null
    }));
    
    return recent;
  };

  // Determine next steps
  const getNextSteps = () => {
    if (!currentSection) return ['Continue learning'];
    
    const steps = [];
    if (currentSection.hasQuiz) steps.push('Complete practice quiz');
    if (currentSection.hasAudio) steps.push('Listen to pronunciation');
    if (currentSection.nextSection) steps.push(`Move to: ${currentSection.nextSection.title}`);
    
    return steps.length > 0 ? steps : ['Continue with current section'];
  };

  // Start monitoring for user return
  const startReturnMonitoring = () => {
    // We're already monitoring through activity events
    // This function could add additional monitoring if needed
  };

  // Handle user returning from break
  const handleUserReturn = (returnTime) => {
    if (!breakStartTime) return;
    
    const breakDuration = returnTime - breakStartTime;
    const breakTypeInfo = determineBreakType(breakDuration);
    
    setBreakType(breakTypeInfo);
    setUserReturn(true);
    
    // Generate appropriate resume context
    const resumeInfo = generateResumeContext(breakTypeInfo, breakDuration);
    setResumeContext(resumeInfo);
    
    // Show resume prompt based on break type
    if (breakTypeInfo.resumption !== 'immediate') {
      setShowResumePrompt(true);
    } else {
      // For micro breaks, just quietly resume
      completeResumption('silent');
    }
    
    // Log return
    setActivityLog(prev => [...prev, {
      type: 'break_end',
      timestamp: returnTime,
      duration: breakDuration,
      breakType: breakTypeInfo.name
    }]);
  };

  // Determine break type based on duration
  const determineBreakType = (duration) => {
    for (const [key, type] of Object.entries(BREAK_TYPES)) {
      if (duration >= type.duration[0] && duration < type.duration[1]) {
        return { ...type, key };
      }
    }
    return BREAK_TYPES.long; // Default to long break
  };

  // Generate context for resumption
  const generateResumeContext = (breakType, duration) => {
    if (!contextSnapshot) return null;
    
    const formatDuration = (ms) => {
      const minutes = Math.floor(ms / 60000);
      if (minutes < 1) return 'a moment';
      if (minutes === 1) return '1 minute';
      if (minutes < 60) return `${minutes} minutes`;
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return `${hours}h ${remainingMins}m`;
    };
    
    return {
      welcomeBack: `Welcome back! You were away for ${formatDuration(duration)}.`,
      lastActivity: generateActivitySummary(breakType),
      currentContext: generateCurrentContext(breakType),
      nextActions: generateNextActions(breakType),
      needsRefresh: breakType.key === 'long'
    };
  };

  // Generate activity summary
  const generateActivitySummary = (breakType) => {
    if (!contextSnapshot) return 'Continuing your learning session.';
    
    const { lesson, lastActivity } = contextSnapshot;
    
    switch (breakType.context_needed) {
      case 'minimal':
        return `You were ${lastActivity.type} in ${lesson.section}.`;
      
      case 'current_section':
        return `You were working on "${lesson.section}" in ${lesson.title}. Progress: ${Math.round(lesson.progress)}%`;
      
      case 'lesson_progress':
        return `You're ${Math.round(lesson.progress)}% through "${lesson.title}". Last activity: ${lastActivity.type} in "${lesson.section}".`;
      
      case 'complete_recap':
        return `Let's recap: You're studying "${lesson.title}" and were working on "${lesson.section}". You've completed ${Math.round(lesson.progress)}% so far.`;
      
      default:
        return 'Continuing where you left off.';
    }
  };

  // Generate current context reminder
  const generateCurrentContext = (breakType) => {
    if (!contextSnapshot?.lastActivity) return null;
    
    const { content } = contextSnapshot.lastActivity;
    
    if (breakType.context_needed === 'minimal') return null;
    
    return {
      concept: content.concept,
      keyTerms: content.keyTerms,
      lastContent: content.lastSentence
    };
  };

  // Generate next action suggestions
  const generateNextActions = (breakType) => {
    if (!contextSnapshot) return ['Continue learning'];
    
    const actions = [];
    
    if (breakType.key === 'long') {
      actions.push('Quick review of key concepts');
      actions.push('Resume from current section');
    } else if (breakType.key === 'medium') {
      actions.push('Review last concept');
      actions.push('Continue from where you left off');
    } else {
      actions.push('Continue learning');
    }
    
    return [...actions, ...contextSnapshot.nextSteps];
  };

  // Complete the resumption process
  const completeResumption = (resumeType) => {
    setIsOnBreak(false);
    setBreakStartTime(null);
    setUserReturn(false);
    setShowResumePrompt(false);
    setBreakType(null);
    
    // Restore user's position if needed
    if (contextSnapshot?.lastActivity?.position && resumeType !== 'fresh_start') {
      setTimeout(() => {
        window.scrollTo({
          top: contextSnapshot.lastActivity.position.scrollPosition,
          behavior: 'smooth'
        });
      }, 500);
    }
    
    // Notify parent component
    if (onResumeSession) {
      onResumeSession({
        breakDuration: Date.now() - (breakStartTime || Date.now()),
        breakType: breakType?.name || 'unknown',
        resumeType,
        contextRestored: resumeType !== 'fresh_start'
      });
    }
  };

  // Format time for display
  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  // Render resume prompt
  const renderResumePrompt = () => {
    if (!showResumePrompt || !resumeContext) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5000,
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '2px solid var(--border)',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          {/* Welcome Back Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              👋
            </div>
            <h2 style={{
              color: 'var(--harvard-crimson)',
              margin: '0 0 0.5rem 0',
              fontSize: '1.5rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {resumeContext.welcomeBack}
            </h2>
          </div>

          {/* Activity Summary */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius)',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: 'var(--dark-charcoal-grey)',
              fontSize: '1.1rem'
            }}>
              Where you left off:
            </h3>
            <p style={{
              margin: '0 0 1rem 0',
              color: 'var(--dark-charcoal-grey)',
              lineHeight: '1.5'
            }}>
              {resumeContext.lastActivity}
            </p>
            
            {resumeContext.currentContext && (
              <div>
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  color: 'var(--oxford-blue)',
                  fontSize: '0.95rem'
                }}>
                  Current concept:
                </h4>
                <p style={{
                  margin: '0',
                  color: 'var(--medium-grey)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic'
                }}>
                  {resumeContext.currentContext.concept}
                </p>
              </div>
            )}
          </div>

          {/* Next Actions */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: 'var(--dartmouth-green)',
              fontSize: '1.1rem'
            }}>
              Ready to continue?
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {resumeContext.nextActions.slice(0, 3).map((action, index) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  color: 'var(--dark-charcoal-grey)'
                }}>
                  • {action}
                </div>
              ))}
            </div>
          </div>

          {/* Resume Options */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => completeResumption('continue')}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--harvard-crimson)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: '"Times New Roman", Times, serif',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Continue Learning
            </button>
            
            {resumeContext.needsRefresh && (
              <button
                onClick={() => completeResumption('fresh_start')}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: 'var(--dartmouth-green)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                Quick Refresh
              </button>
            )}
            
            <button
              onClick={() => completeResumption('review')}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--oxford-blue)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              Review First
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render activity indicator (when not showing full prompt)
  const renderActivityIndicator = () => {
    if (showResumePrompt || !isActive) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '0.75rem 1.5rem',
        backgroundColor: isOnBreak ? 'var(--tsinghua-purple)' : 'var(--dartmouth-green)',
        color: 'var(--warm-white)',
        borderRadius: '25px',
        fontSize: '0.9rem',
        fontFamily: '"Times New Roman", Times, serif',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        opacity: isOnBreak ? 0.8 : 0.3,
        transition: 'opacity 0.3s ease'
      }}>
        {isOnBreak ? 
          `Away for ${formatTimeAgo(breakStartTime)}` : 
          'Learning in progress'
        }
      </div>
    );
  };

  if (!isActive) return null;

  return (
    <div className="flow-retainer">
      {renderResumePrompt()}
      {renderActivityIndicator()}
    </div>
  );
};

export default FlowRetainer;