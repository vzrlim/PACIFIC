// AntiProcrastinationTool.jsx - Gentle Productivity Monitoring System
// Monitors time spent vs estimates and provides helpful nudges for learning efficiency

import React, { useState, useEffect, useRef } from 'react';

// Alert thresholds and timing
const MONITORING_CONFIG = {
  // Time thresholds (multipliers of estimated time)
  gentle_nudge_threshold: 1.3,     // 130% of estimated time
  attention_alert_threshold: 1.8,  // 180% of estimated time
  break_suggestion_threshold: 2.5, // 250% of estimated time
  
  // Alert intervals (prevent spam)
  min_alert_interval: 300000,      // 5 minutes between alerts (milliseconds)
  nudge_interval: 180000,          // 3 minutes between gentle nudges
  
  // Break recommendations
  suggested_break_duration: 600,   // 10 minutes
  max_continuous_time: 3600,       // 1 hour max before suggesting break
  
  // Progress tracking
  productivity_score_window: 7,    // Days to calculate average productivity
};

// Alert types with different approaches
const ALERT_TYPES = {
  gentle_nudge: {
    title: 'Gentle Reminder',
    icon: '⏰',
    color: 'var(--dartmouth-green)',
    tone: 'supportive'
  },
  attention_alert: {
    title: 'Time Check',
    icon: '🎯',
    color: 'var(--oxford-blue)',
    tone: 'informative'
  },
  break_suggestion: {
    title: 'Break Time?',
    icon: '☕',
    color: 'var(--tsinghua-purple)',
    tone: 'caring'
  },
  productivity_insight: {
    title: 'Learning Insight',
    icon: '📊',
    color: 'var(--harvard-crimson)',
    tone: 'analytical'
  }
};

const AntiProcrastinationTool = ({
  readingTimeEstimate,
  understandingTimeEstimate,
  currentSection,
  onBreakSuggested,
  onProductivityInsight,
  userLearningStyle = 'balanced',
  isActive = true
}) => {
  // Time tracking state
  const [sectionStartTime, setSectionStartTime] = useState(null);
  const [currentTimeSpent, setCurrentTimeSpent] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [lastAlertTime, setLastAlertTime] = useState(0);
  
  // Alert state
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  
  // Analytics state
  const [sessionStats, setSessionStats] = useState({
    sectionsCompleted: 0,
    totalEstimated: 0,
    totalActual: 0,
    efficiency: 1.0,
    breaks: 0
  });
  
  // UI state
  const [showProductivityPanel, setShowProductivityPanel] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  // Refs
  const timeIntervalRef = useRef(null);
  const breakIntervalRef = useRef(null);

  // Initialize section timing when section changes
  useEffect(() => {
    if (currentSection && isActive) {
      setSectionStartTime(Date.now());
      setCurrentTimeSpent(0);
      
      // Start time tracking
      timeIntervalRef.current = setInterval(() => {
        setCurrentTimeSpent(prev => {
          const newTime = prev + 1000; // Add 1 second in milliseconds
          checkTimeThresholds(newTime);
          return newTime;
        });
        
        setTotalSessionTime(prev => prev + 1000);
      }, 1000);
    }
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [currentSection, isActive]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Check time thresholds and trigger alerts
  const checkTimeThresholds = (timeSpent) => {
    const totalEstimate = (readingTimeEstimate || 0) + (understandingTimeEstimate || 0);
    if (!totalEstimate || timeSpent < 30000) return; // Wait at least 30 seconds
    
    const timeRatio = timeSpent / (totalEstimate * 60 * 1000); // Convert estimate to milliseconds
    const now = Date.now();
    
    // Gentle nudge at 130%
    if (timeRatio >= MONITORING_CONFIG.gentle_nudge_threshold && 
        timeRatio < MONITORING_CONFIG.attention_alert_threshold &&
        now - lastAlertTime > MONITORING_CONFIG.nudge_interval) {
      triggerAlert('gentle_nudge', timeRatio, totalEstimate);
    }
    
    // Attention alert at 180%
    else if (timeRatio >= MONITORING_CONFIG.attention_alert_threshold && 
             timeRatio < MONITORING_CONFIG.break_suggestion_threshold &&
             now - lastAlertTime > MONITORING_CONFIG.min_alert_interval) {
      triggerAlert('attention_alert', timeRatio, totalEstimate);
    }
    
    // Break suggestion at 250%
    else if (timeRatio >= MONITORING_CONFIG.break_suggestion_threshold &&
             now - lastAlertTime > MONITORING_CONFIG.min_alert_interval) {
      triggerAlert('break_suggestion', timeRatio, totalEstimate);
    }
    
    // Long session break (1 hour continuous)
    if (totalSessionTime > MONITORING_CONFIG.max_continuous_time * 1000 &&
        now - lastAlertTime > MONITORING_CONFIG.min_alert_interval) {
      triggerAlert('break_suggestion', timeRatio, totalEstimate, 'long_session');
    }
  };

  // Trigger different types of alerts
  const triggerAlert = (alertType, timeRatio, estimate, reason = 'time_threshold') => {
    const alert = ALERT_TYPES[alertType];
    const message = generateAlertMessage(alertType, timeRatio, estimate, reason);
    
    const alertData = {
      id: Date.now(),
      type: alertType,
      message,
      timeRatio,
      estimate,
      reason,
      timestamp: new Date(),
      actions: generateAlertActions(alertType, reason)
    };
    
    setActiveAlerts(prev => [...prev, alertData]);
    setAlertHistory(prev => [alertData, ...prev.slice(0, 9)]); // Keep last 10
    setLastAlertTime(Date.now());
    
    // Browser notification if permitted
    if (notificationPermission === 'granted') {
      new Notification(`PACIFIC Learning: ${alert.title}`, {
        body: message,
        icon: '/favicon.ico',
        tag: 'pacific-learning'
      });
    }
  };

  // Generate contextual alert messages
  const generateAlertMessage = (alertType, timeRatio, estimate, reason) => {
    const estimateMinutes = Math.round(estimate);
    const actualMinutes = Math.round((currentTimeSpent / 1000) / 60);
    
    switch (alertType) {
      case 'gentle_nudge':
        return `You've been on this section for ${actualMinutes} minutes (estimated: ${estimateMinutes}m). You're doing great - just checking if you'd like to move forward or take a quick break.`;
      
      case 'attention_alert':
        return `Time check: ${actualMinutes} minutes spent vs ${estimateMinutes}m estimated. This might be a challenging section - consider if you need different approach or help.`;
      
      case 'break_suggestion':
        if (reason === 'long_session') {
          return `You've been learning for over an hour! Taking a 10-15 minute break can actually improve retention and focus.`;
        }
        return `You've spent ${actualMinutes} minutes on this section (estimated: ${estimateMinutes}m). A short break might help you approach this with fresh energy.`;
      
      default:
        return 'Time to check your learning progress.';
    }
  };

  // Generate alert actions based on type
  const generateAlertActions = (alertType, reason) => {
    const baseActions = [
      {
        label: 'Continue Learning',
        action: () => dismissAlert(),
        style: 'secondary'
      },
      {
        label: 'I need more time',
        action: () => extendTime(),
        style: 'primary'
      }
    ];
    
    if (alertType === 'break_suggestion') {
      return [
        {
          label: 'Take 10min break',
          action: () => startBreak(600), // 10 minutes
          style: 'primary'
        },
        {
          label: 'Quick 5min break',
          action: () => startBreak(300), // 5 minutes
          style: 'secondary'
        },
        {
          label: 'Continue for now',
          action: () => dismissAlert(),
          style: 'tertiary'
        }
      ];
    }
    
    if (alertType === 'attention_alert') {
      return [
        ...baseActions,
        {
          label: 'Get help with this',
          action: () => requestHelp(),
          style: 'tertiary'
        }
      ];
    }
    
    return baseActions;
  };

  // Alert action handlers
  const dismissAlert = () => {
    setActiveAlerts([]);
  };

  const extendTime = () => {
    // Add 50% more time to estimates
    const extension = ((readingTimeEstimate || 0) + (understandingTimeEstimate || 0)) * 0.5;
    setLastAlertTime(Date.now() + (extension * 60 * 1000)); // Delay next alert
    dismissAlert();
  };

  const startBreak = (duration) => {
    setIsOnBreak(true);
    setBreakStartTime(Date.now());
    setSessionStats(prev => ({ ...prev, breaks: prev.breaks + 1 }));
    
    // Set break timer
    breakIntervalRef.current = setTimeout(() => {
      endBreak();
    }, duration * 1000);
    
    dismissAlert();
    
    if (onBreakSuggested) {
      onBreakSuggested({ duration, reason: 'user_accepted' });
    }
  };

  const endBreak = () => {
    setIsOnBreak(false);
    setBreakStartTime(null);
    
    if (breakIntervalRef.current) {
      clearTimeout(breakIntervalRef.current);
    }
    
    // Reset section timer
    setSectionStartTime(Date.now());
    setCurrentTimeSpent(0);
  };

  const requestHelp = () => {
    // This would integrate with ActivationPrompt or Q&A system
    dismissAlert();
  };

  // Calculate productivity insights
  const calculateProductivityInsights = () => {
    const totalEstimate = (readingTimeEstimate || 0) + (understandingTimeEstimate || 0);
    if (!totalEstimate) return null;
    
    const efficiency = (totalEstimate * 60 * 1000) / Math.max(currentTimeSpent, 1);
    const timeRatio = currentTimeSpent / (totalEstimate * 60 * 1000);
    
    let insight = '';
    let recommendation = '';
    
    if (efficiency > 1.2) {
      insight = 'You\'re learning efficiently! You\'re completing sections faster than estimated.';
      recommendation = 'Consider tackling more challenging content or reviewing to ensure retention.';
    } else if (efficiency > 0.8) {
      insight = 'You\'re learning at a good pace, close to the estimated time.';
      recommendation = 'You\'re on track. Keep up the consistent effort!';
    } else if (efficiency > 0.5) {
      insight = 'You\'re taking more time than estimated, which is perfectly normal.';
      recommendation = 'Consider if you need different learning strategies or if the content is more challenging.';
    } else {
      insight = 'This section is taking significantly longer than estimated.';
      recommendation = 'This might be challenging content. Consider breaking it down or seeking help.';
    }
    
    return {
      efficiency: Math.round(efficiency * 100) / 100,
      timeRatio: Math.round(timeRatio * 100) / 100,
      insight,
      recommendation
    };
  };

  // Format time display
  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Render alert
  const renderAlert = (alert) => (
    <div
      key={alert.id}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '350px',
        backgroundColor: 'var(--card)',
        border: `3px solid ${ALERT_TYPES[alert.type].color}`,
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        zIndex: 3000,
        fontFamily: '"Times New Roman", Times, serif'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>
          {ALERT_TYPES[alert.type].icon}
        </span>
        <h4 style={{
          margin: 0,
          color: ALERT_TYPES[alert.type].color,
          fontSize: '1.1rem',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          {ALERT_TYPES[alert.type].title}
        </h4>
      </div>
      
      <p style={{
        margin: '0 0 1.5rem 0',
        color: 'var(--dark-charcoal-grey)',
        lineHeight: '1.4',
        fontSize: '0.95rem'
      }}>
        {alert.message}
      </p>
      
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {alert.actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 
                action.style === 'primary' ? ALERT_TYPES[alert.type].color :
                action.style === 'secondary' ? 'var(--muted)' :
                'var(--card)',
              color: 
                action.style === 'primary' ? 'var(--warm-white)' :
                'var(--dark-charcoal-grey)',
              border: action.style === 'tertiary' ? '2px solid var(--border)' : 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (!isActive) return null;

  const insights = calculateProductivityInsights();
  const totalEstimate = (readingTimeEstimate || 0) + (understandingTimeEstimate || 0);

  return (
    <div className="anti-procrastination-tool">
      {/* Active Alerts */}
      {activeAlerts.map(renderAlert)}
      
      {/* Break Overlay */}
      {isOnBreak && (
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
          zIndex: 4000,
          color: 'var(--warm-white)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius)',
            color: 'var(--dark-charcoal-grey)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>☕</div>
            <h2 style={{
              color: 'var(--dartmouth-green)',
              marginBottom: '1rem'
            }}>
              Break Time
            </h2>
            <p style={{
              fontSize: '1.1rem',
              marginBottom: '2rem',
              color: 'var(--medium-grey)'
            }}>
              Taking a break helps improve focus and retention.
              <br />
              You'll automatically return to learning when ready.
            </p>
            <button
              onClick={endBreak}
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
              End Break Early
            </button>
          </div>
        </div>
      )}
      
      {/* Productivity Panel Toggle */}
      <button
        onClick={() => setShowProductivityPanel(!showProductivityPanel)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'var(--harvard-crimson)',
          color: 'var(--warm-white)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
        title="Productivity Insights"
      >
        📊
      </button>
      
      {/* Productivity Panel */}
      {showProductivityPanel && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '20px',
          width: '300px',
          backgroundColor: 'var(--card)',
          border: '2px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          zIndex: 1000,
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <h4 style={{
            margin: '0 0 1rem 0',
            color: 'var(--harvard-crimson)',
            fontSize: '1.1rem'
          }}>
            Session Insights
          </h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: 'var(--medium-grey)', fontSize: '0.9rem' }}>
                Time Spent:
              </span>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                {formatTime(currentTimeSpent)}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: 'var(--medium-grey)', fontSize: '0.9rem' }}>
                Estimated:
              </span>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                {totalEstimate}m
              </span>
            </div>
            
            {insights && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: 'var(--medium-grey)', fontSize: '0.9rem' }}>
                  Efficiency:
                </span>
                <span style={{
                  fontWeight: 'var(--font-weight-medium)',
                  color: insights.efficiency > 1 ? 'var(--dartmouth-green)' : 
                        insights.efficiency > 0.8 ? 'var(--oxford-blue)' : 
                        'var(--harvard-crimson)'
                }}>
                  {Math.round(insights.efficiency * 100)}%
                </span>
              </div>
            )}
          </div>
          
          {insights && (
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--dark-charcoal-grey)',
                lineHeight: '1.4',
                margin: '0 0 0.5rem 0'
              }}>
                {insights.insight}
              </p>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--medium-grey)',
                lineHeight: '1.3',
                margin: 0,
                fontStyle: 'italic'
              }}>
                💡 {insights.recommendation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AntiProcrastinationTool;