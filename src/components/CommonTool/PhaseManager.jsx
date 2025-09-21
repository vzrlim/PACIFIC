// PhaseManager.jsx - Core Phase Flow Control System
// Enforces the mandatory Phase 1 → Phase 2 → Phase 3 progression from design

import React, { useState, useEffect, useCallback } from 'react';
import MoSCoWPrioritizationSystem, { MoSCoWUtils } from './MoSCoWPrioritizationSystem';

// Phase definitions matching your design document
export const LEARNING_PHASES = {
  NEW_KNOWLEDGE: 'new_knowledge',      // Phase 1: Content Display, Learning
  CONSOLIDATE: 'consolidate',          // Phase 2: Notes, Memorization, Practice  
  SIMULATION: 'simulation'             // Phase 3: Real-life Application
};

// Phase completion criteria
const PHASE_REQUIREMENTS = {
  [LEARNING_PHASES.NEW_KNOWLEDGE]: {
    minLessonsCompleted: 1,
    minTimeSpent: 1800,        // 30 minutes minimum
    requiredComponents: ['content_reading', 'vocabulary', 'grammar'],
    name: 'New Knowledge Phase'
  },
  [LEARNING_PHASES.CONSOLIDATE]: {
    minNotesCreated: 1,
    minExercisesCompleted: 3,
    minReviewSessions: 1,
    name: 'Knowledge Consolidation Phase'
  },
  [LEARNING_PHASES.SIMULATION]: {
    minSimulationsCompleted: 1,
    contextualUseValidated: true,
    name: 'Real-Life Simulation Phase'
  }
};

// Phase-specific MoSCoW item sets
const PHASE_MOSCOW_ITEMS = {
  phase1_content: {
    name: 'Phase 1: New Knowledge Priorities',
    items: [
      'Core vocabulary acquisition', 'Grammar fundamentals', 'Pronunciation basics',
      'Reading comprehension', 'Cultural context introduction', 'Audio content listening',
      'Basic conversation patterns', 'Writing structure basics', 'Interactive exercises',
      'Progress tracking', 'Concept explanations', 'Visual learning aids'
    ]
  },
  phase2_activities: {
    name: 'Phase 2: Consolidation Priorities', 
    items: [
      'Note-taking practice', 'Spaced repetition drills', 'Grammar application exercises',
      'Vocabulary retention tests', 'Speaking practice sessions', 'Writing composition tasks',
      'Error correction practice', 'Comprehension quizzes', 'Review and revision'
    ]
  },
  phase3_applications: {
    name: 'Phase 3: Real-World Application Priorities',
    items: [
      'Professional communication scenarios', 'Casual conversation practice',
      'Travel situation simulations', 'Business meeting simulations', 'Social interaction practice',
      'Problem-solving in target language', 'Cultural immersion activities'
    ]
  }
};

// Phase transition rules
const PHASE_TRANSITIONS = {
  [LEARNING_PHASES.NEW_KNOWLEDGE]: {
    next: LEARNING_PHASES.CONSOLIDATE,
    canSkip: false  // Never allow skipping Phase 1
  },
  [LEARNING_PHASES.CONSOLIDATE]: {
    next: LEARNING_PHASES.SIMULATION,
    canSkip: true,  // Can skip if time-limited + verbal contextual use
    skipConditions: ['time_critical', 'verbal_communication_priority']
  },
  [LEARNING_PHASES.SIMULATION]: {
    next: null,     // Final phase
    canSkip: false
  }
};

const PhaseManager = ({
  userProfile,
  currentPhase = LEARNING_PHASES.NEW_KNOWLEDGE,
  onPhaseChange,
  onPhaseComplete,
  contextualUse = {},
  timeLimit = null,
  children
}) => {
  // Phase state management
  const [phase, setPhase] = useState(currentPhase);
  const [phaseProgress, setPhaseProgress] = useState({});
  const [phaseHistory, setPhaseHistory] = useState([]);
  const [canAdvance, setCanAdvance] = useState(false);
  const [skipOptions, setSkipOptions] = useState([]);
    // MoSCoW state management for each phase
  const [phasePriorities, setPhasePriorities] = useState({});
  const [currentPhasePriorities, setCurrentPhasePriorities] = useState({
    mustHave: [], shouldHave: [], couldHave: [], wontHave: []
  });
  const [prioritiesSetForPhase, setPrioritiesSetForPhase] = useState(new Set());  

  // Handle MoSCoW priority changes for current phase
  const handlePhasePriorityChange = useCallback((newPriorities) => {
    setCurrentPhasePriorities(newPriorities);
    setPhasePriorities(prev => ({ ...prev, [phase]: newPriorities }));
    setPrioritiesSetForPhase(prev => new Set([...prev, phase]));
  }, [phase]);

  // Track phase completion requirements
  useEffect(() => {
    checkPhaseCompletion();
  }, [phaseProgress, phase]);

  // Check if phase requirements are met
  const checkPhaseCompletion = useCallback(() => {
    const requirements = PHASE_REQUIREMENTS[phase];
    if (!requirements) return;

    const progress = phaseProgress[phase] || {};
    let completed = true;
    let canSkip = false;

    // Check completion criteria based on phase
    switch (phase) {
      case LEARNING_PHASES.NEW_KNOWLEDGE:
        completed = (progress.lessonsCompleted >= requirements.minLessonsCompleted) &&
                   (progress.timeSpent >= requirements.minTimeSpent) &&
                   requirements.requiredComponents.every(comp => progress.completedComponents?.includes(comp));
        break;

      case LEARNING_PHASES.CONSOLIDATE:
        completed = (progress.notesCreated >= requirements.minNotesCreated) &&
                   (progress.exercisesCompleted >= requirements.minExercisesCompleted) &&
                   (progress.reviewSessions >= requirements.minReviewSessions);
        
        // Check skip conditions (time-critical + verbal communication)
        canSkip = checkSkipConditions();
        break;

      case LEARNING_PHASES.SIMULATION:
        completed = (progress.simulationsCompleted >= requirements.minSimulationsCompleted) &&
                   progress.contextualUseValidated;
        break;
    }

    setCanAdvance(completed);
    setSkipOptions(canSkip ? ['skip_to_simulation'] : []);
  }, [phase, phaseProgress, contextualUse, timeLimit]);

  // Check if phase can be skipped based on design conditions
  const checkSkipConditions = useCallback(() => {
    if (phase !== LEARNING_PHASES.CONSOLIDATE) return false;

    const transition = PHASE_TRANSITIONS[phase];
    if (!transition.canSkip) return false;

    // "Exceptional Case: can move on here immediately after phase 1, skipping phase 2. 
    // If time limit set by user too limited and their contextual use involve communicate verbally"
    const isTimeCritical = timeLimit && timeLimit < 86400; // Less than 24 hours
    const isVerbalCommunication = contextualUse.communicationType === 'verbal' || 
                                 contextualUse.primaryUse === 'speaking';

    return isTimeCritical && isVerbalCommunication;
  }, [phase, timeLimit, contextualUse]);

  // Advance to next phase
  const advancePhase = useCallback((skipToPhase = null) => {
    const currentTransition = PHASE_TRANSITIONS[phase];
    const nextPhase = skipToPhase || currentTransition?.next;

    if (!nextPhase) {
      // Course completion
      if (onPhaseComplete) {
        onPhaseComplete({
          completedPhases: phaseHistory,
          finalPhase: phase,
          totalTime: calculateTotalTime()
        });
      }
      return;
    }

    // Record phase completion
    const completionRecord = {
      phase,
      completedAt: new Date().toISOString(),
      progress: phaseProgress[phase],
      skipped: !!skipToPhase
    };

    setPhaseHistory(prev => [...prev, completionRecord]);
    setPhase(nextPhase);
    setCanAdvance(false);

    if (onPhaseChange) {
      onPhaseChange({
        fromPhase: phase,
        toPhase: nextPhase,
        skipped: !!skipToPhase,
        history: [...phaseHistory, completionRecord]
      });
    }
  }, [phase, phaseHistory, phaseProgress, onPhaseChange, onPhaseComplete]);

  // Update phase progress (called by child components)
  const updatePhaseProgress = useCallback((progressData) => {
    setPhaseProgress(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        ...progressData,
        lastUpdated: new Date().toISOString()
      }
    }));
  }, [phase]);

  // Calculate total time spent across phases
  const calculateTotalTime = useCallback(() => {
    return Object.values(phaseProgress).reduce((total, progress) => {
      return total + (progress.timeSpent || 0);
    }, 0);
  }, [phaseProgress]);

  // Skip to simulation (exceptional case)
  const skipToSimulation = useCallback(() => {
    if (!skipOptions.includes('skip_to_simulation')) return;
    advancePhase(LEARNING_PHASES.SIMULATION);
  }, [skipOptions, advancePhase]);

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="pacific-phase-manager">
      {/* Phase Header */}
      <div style={{
        backgroundColor: 'var(--card)',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
        marginBottom: '1rem',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            margin: 0,
            color: 'var(--harvard-crimson)',
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {PHASE_REQUIREMENTS[phase]?.name}
          </h2>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--medium-grey)'
          }}>
            Phase {Object.keys(LEARNING_PHASES).indexOf(phase.toUpperCase()) + 1} of 3
          </div>
        </div>

        {/* Phase Progress Indicator */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          {Object.values(LEARNING_PHASES).map((phaseKey, index) => (
            <div
              key={phaseKey}
              style={{
                flex: 1,
                height: '8px',
                backgroundColor: 
                  phaseHistory.some(h => h.phase === phaseKey) ? 'var(--dartmouth-green)' :
                  phaseKey === phase ? 'var(--harvard-crimson)' :
                  'var(--muted)',
                borderRadius: 'var(--radius-sm)',
                transition: 'background-color 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Phase Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--dark-charcoal-grey)'
          }}>
            {canAdvance ? 
              'Phase requirements completed!' : 
              'Complete requirements to advance'
            }
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Skip option for time-critical verbal communication */}
            {skipOptions.includes('skip_to_simulation') && (
              <button
                onClick={skipToSimulation}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--oxford-blue)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                Skip to Simulation (Time Critical)
              </button>
            )}

            {/* Advance button */}
            <button
              onClick={() => advancePhase()}
              disabled={!canAdvance}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: canAdvance ? 'var(--harvard-crimson)' : 'var(--muted)',
                color: canAdvance ? 'var(--warm-white)' : 'var(--medium-grey)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                cursor: canAdvance ? 'pointer' : 'not-allowed',
                fontFamily: '"Times New Roman", Times, serif',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {PHASE_TRANSITIONS[phase]?.next ? 'Next Phase' : 'Complete Course'}
            </button>
          </div>
        </div>
      </div>

      {/* Phase Content */}
      <div className="phase-content">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              currentPhase: phase,
              updatePhaseProgress,
              phaseProgress: phaseProgress[phase] || {},
              userProfile,
              contextualUse,
              // NEW: Pass priority data to child components
              phasePriorities: phasePriorities[phase],
              priorityTimeAllocation: phasePriorities[phase] ? MoSCoWUtils.calculateTimeAllocation(phasePriorities[phase]) : null
            });
          }
          return child;
        })}
      </div>

      {/* Phase History (Debug/Development) */}
      {process.env.NODE_ENV === 'development' && phaseHistory.length > 0 && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'var(--muted)',
          borderRadius: 'var(--radius)',
          fontSize: '0.8rem',
          color: 'var(--medium-grey)'
        }}>
          <strong>Phase History:</strong>
          {phaseHistory.map((record, index) => (
            <div key={index}>
              {record.phase} completed at {new Date(record.completedAt).toLocaleTimeString()}
              {record.skipped && ' (skipped)'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export phase utilities for use in other components
export const PhaseUtils = {
  getCurrentPhaseRequirements: (phase) => PHASE_REQUIREMENTS[phase],
  canSkipPhase: (phase, timeLimit, contextualUse) => {
    const transition = PHASE_TRANSITIONS[phase];
    if (!transition?.canSkip) return false;
    
    const isTimeCritical = timeLimit && timeLimit < 86400;
    const isVerbalCommunication = contextualUse.communicationType === 'verbal';
    
    return isTimeCritical && isVerbalCommunication;
  },
  getPhaseProgress: (phaseData) => {
    if (!phaseData) return 0;
    
    // Calculate progress percentage based on phase requirements
    // This would need to be customized based on specific phase metrics
    return Math.min(100, Object.keys(phaseData).length * 25);
  }
};

export default PhaseManager;