// AppFlowController.jsx - Mandatory Flow Enforcement System
// Enforces: Profile → Placement Test → Language Selection → Contextual Use → Phase 1
// Prevents users from skipping critical setup steps

import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Lock, AlertTriangle } from 'lucide-react';

// Import your existing components
import config from '../../config';
import ProfileProgressTracker from '../Phase0/ProfileProgressTracker';
import PlacementTest from '../Phase1/PlacementTest';
import LanguageSelector from '../Phase0/LanguageSelector';
import ContextualUseCollector from '../ContextualUseCollector';
import PhaseManager from './PhaseManager';
import SimulationEnvironment from '../Phase3/SimulationEnvironment';
import MoSCoWPrioritizationSystem from './MoSCoWPrioritizationSystem';

// Flow stages definition matching your design
const FLOW_STAGES = {
  PROFILE_SETUP: 'profile_setup',
  PLACEMENT_TEST: 'placement_test', 
  LANGUAGE_SELECTION: 'language_selection',
  CONTEXTUAL_USE: 'contextual_use',
  LEARNING_PHASE: 'learning_phase'
};

// Stage validation rules
const STAGE_REQUIREMENTS = {
  [FLOW_STAGES.PROFILE_SETUP]: {
    name: 'Profile Setup',
    description: 'Complete your language background profile',
    isComplete: (data) => {
      return data.userProfile && 
             data.userProfile.nationality && 
             data.userProfile.nativeLanguages &&
             data.userProfile.nativeLanguages.length > 0 &&
             data.userProfile.learningStyle;
    }
  },
  [FLOW_STAGES.PLACEMENT_TEST]: {
    name: 'Placement Assessment', 
    description: 'Take official CEFR placement test (one-time only)',
    isComplete: (data) => {
      return data.placementResults && 
             data.placementResults.level &&
             data.placementResults.certification;
    }
  },
  [FLOW_STAGES.LANGUAGE_SELECTION]: {
    name: 'Target Language',
    description: 'Select your learning target language',
    isComplete: (data) => {
      return data.targetLanguage && 
             data.targetLanguage.language &&
             data.targetLanguage.language.trim().length > 0;
    }
  },
  [FLOW_STAGES.CONTEXTUAL_USE]: {
    name: 'Learning Context & Priorities',
    description: 'Define how you plan to use this language and set learning priorities',
    isComplete: (data) => {
      return data.contextualUse && 
            data.contextualUse.type &&
            (data.contextualUse.specificSituation || data.contextualUse.personalInterest) &&
            data.contextualUse.priorityScale &&
            data.userPriorities &&
            data.userPriorities.mustHave.length > 0; // Require at least 1 priority
    }
  },
  [FLOW_STAGES.LEARNING_PHASE]: {
    name: 'Learning Journey',
    description: 'Begin your structured learning phases',
    isComplete: (data) => {
      return data.currentPhase === 'new_knowledge' && data.courseInitialized;
    }
  }
};

const AppFlowController = ({ onFlowComplete }) => {
  // Flow state management
  const [currentStage, setCurrentStage] = useState(FLOW_STAGES.PROFILE_SETUP);
  const [flowData, setFlowData] = useState({
    userProfile: null,
    placementResults: null, 
    targetLanguage: null,
    contextualUse: null,
    currentPhase: null,
    courseInitialized: false
  });
  
  const [stageHistory, setStageHistory] = useState([]);
  const [flowLocked, setFlowLocked] = useState(false);
  const [error, setError] = useState(null);

  // MoSCoW state management
  const [userPriorities, setUserPriorities] = useState({
    mustHave: [], shouldHave: [], couldHave: [], wontHave: []
  });
  const [prioritiesSet, setPrioritiesSet] = useState(false);

  // Load existing progress from localStorage on mount
  useEffect(() => {
    loadExistingProgress();
  }, []);

  // Auto-advance logic when stage requirements are met
  useEffect(() => {
    const currentRequirement = STAGE_REQUIREMENTS[currentStage];
    if (currentRequirement && currentRequirement.isComplete(flowData)) {
      // Stage is complete, check if we should auto-advance
      const stages = Object.keys(FLOW_STAGES);
      const currentIndex = stages.findIndex(stage => FLOW_STAGES[stage] === currentStage);
      
      if (currentIndex < stages.length - 1) {
        // Not the final stage, can advance
        setTimeout(() => {
          const nextStage = FLOW_STAGES[stages[currentIndex + 1]];
          advanceToStage(nextStage);
        }, 1000); // Brief delay for user to see completion
      } else {
        // Final stage complete
        completeFlow();
      }
    }
  }, [flowData, currentStage]);

  const loadExistingProgress = () => {
    try {
      // Load from localStorage
      const savedProfile = localStorage.getItem('pacific_user_profile');
      const savedPlacement = localStorage.getItem('pacific_placement_tests');
      const savedLanguage = localStorage.getItem('pacific_target_language');
      const savedContext = localStorage.getItem('pacific_contextual_use');
      const savedProgress = localStorage.getItem('pacific_flow_progress');

      let loadedData = {};
      let resumeStage = FLOW_STAGES.PROFILE_SETUP;

      if (savedProfile) {
        loadedData.userProfile = JSON.parse(savedProfile);
        resumeStage = FLOW_STAGES.PLACEMENT_TEST;
      }

      if (savedPlacement) {
        const placementData = JSON.parse(savedPlacement);
        // Get the most recent placement test
        const latestTest = Object.values(placementData)[0];
        if (latestTest) {
          loadedData.placementResults = latestTest;
          resumeStage = FLOW_STAGES.LANGUAGE_SELECTION;
        }
      }

      if (savedLanguage) {
        loadedData.targetLanguage = JSON.parse(savedLanguage);
        resumeStage = FLOW_STAGES.CONTEXTUAL_USE;
      }

      if (savedContext) {
        loadedData.contextualUse = JSON.parse(savedContext);
        resumeStage = FLOW_STAGES.LEARNING_PHASE;
      }

      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        loadedData.currentPhase = progressData.currentPhase;
        loadedData.courseInitialized = progressData.courseInitialized;
        if (progressData.userPriorities) {
          loadedData.userPriorities = progressData.userPriorities;
          setUserPriorities(progressData.userPriorities);
          setPrioritiesSet(true);
        }
        if (progressData.courseInitialized) {
          resumeStage = FLOW_STAGES.LEARNING_PHASE;
        }
      }

      setFlowData(loadedData);
      setCurrentStage(resumeStage);

    } catch (error) {
      console.error('Error loading existing progress:', error);
      // Continue with fresh start
    }
  };

  const saveProgress = (stage, data) => {
    try {
      // Save to localStorage
      if (data.userProfile) {
        localStorage.setItem('pacific_user_profile', JSON.stringify(data.userProfile));
      }
      if (data.targetLanguage) {
        localStorage.setItem('pacific_target_language', JSON.stringify(data.targetLanguage));
      }
      if (data.contextualUse) {
        localStorage.setItem('pacific_contextual_use', JSON.stringify(data.contextualUse));
      }
      if (data.currentPhase || data.courseInitialized || data.userPriorities) {
        localStorage.setItem('pacific_flow_progress', JSON.stringify({
          currentPhase: data.currentPhase,
          courseInitialized: data.courseInitialized,
          userPriorities: data.userPriorities,
          lastUpdated: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const advanceToStage = (nextStage) => {
    // Record stage completion
    const completionRecord = {
      stage: currentStage,
      completedAt: new Date().toISOString(),
      data: flowData
    };

    setStageHistory(prev => [...prev, completionRecord]);
    setCurrentStage(nextStage);
    setError(null);

    // Save progress
    saveProgress(nextStage, flowData);
  };

  const updateFlowData = (stageData) => {
    setFlowData(prev => ({
      ...prev,
      ...stageData
    }));
  };

  const completeFlow = () => {
    const completedFlowData = {
      ...flowData,
      flowCompleted: true,
      completedAt: new Date().toISOString(),
      stageHistory
    };

    setFlowData(completedFlowData);
    saveProgress(FLOW_STAGES.LEARNING_PHASE, completedFlowData);

    if (onFlowComplete) {
      onFlowComplete(completedFlowData);
    }
  };

  const handleStageComplete = (stageData) => {
    updateFlowData(stageData);
    // Auto-advance logic will trigger from useEffect
  };

  const validateStageTransition = (fromStage, toStage) => {
    const stages = Object.values(FLOW_STAGES);
    const fromIndex = stages.indexOf(fromStage);
    const toIndex = stages.indexOf(toStage);

    // Can only advance to next stage or go back to previous stages
    if (toIndex > fromIndex + 1) {
      setError('You must complete each stage in order before advancing');
      return false;
    }

    return true;
  };

  const forceStageJump = (targetStage) => {
    // Emergency override for development/testing
    if (process.env.NODE_ENV === 'development') {
      setCurrentStage(targetStage);
      setError(null);
    }
  };

  const isStageAccessible = (stage) => {
    const stages = Object.values(FLOW_STAGES);
    const targetIndex = stages.indexOf(stage);
    const currentIndex = stages.indexOf(currentStage);
    
    return targetIndex <= currentIndex + 1; // Can access current + 1 stage max
  };

  const isStageComplete = (stage) => {
    const requirement = STAGE_REQUIREMENTS[stage];
    return requirement && requirement.isComplete(flowData);
  };

  const getStageStatus = (stage) => {
    if (stage === currentStage) return 'current';
    if (isStageComplete(stage)) return 'complete';
    if (isStageAccessible(stage)) return 'accessible';
    return 'locked';
  };

  const renderProgressIndicator = () => (
    <div style={{
      backgroundColor: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      marginBottom: '2rem',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      <h2 style={{
        color: 'var(--harvard-crimson)',
        margin: '0 0 1rem 0',
        fontSize: '1.5rem',
        fontWeight: 'var(--font-weight-medium)'
      }}>
        PACIFIC Learning Setup Progress
      </h2>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {Object.entries(FLOW_STAGES).map(([key, stage], index) => {
          const status = getStageStatus(stage);
          const requirement = STAGE_REQUIREMENTS[stage];
          
          return (
            <React.Fragment key={stage}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                minWidth: '120px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 
                    status === 'complete' ? 'var(--dartmouth-green)' :
                    status === 'current' ? 'var(--harvard-crimson)' :
                    status === 'accessible' ? 'var(--oxford-blue)' :
                    'var(--muted)',
                  color: 'var(--warm-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.5rem',
                  border: status === 'current' ? '3px solid var(--harvard-crimson)' : 'none'
                }}>
                  {status === 'complete' ? (
                    <CheckCircle size={20} />
                  ) : status === 'locked' ? (
                    <Lock size={16} />
                  ) : (
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: status === 'current' ? 'bold' : 'normal',
                  color: status === 'current' ? 'var(--harvard-crimson)' : 'var(--dark-charcoal-grey)'
                }}>
                  {requirement.name}
                </div>
              </div>
              
              {index < Object.keys(FLOW_STAGES).length - 1 && (
                <div style={{
                  width: '40px',
                  height: '2px',
                  backgroundColor: getStageStatus(Object.values(FLOW_STAGES)[index + 1]) !== 'locked' 
                    ? 'var(--dartmouth-green)' 
                    : 'var(--border)',
                  margin: '0 0 2rem 0'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.9rem',
        color: 'var(--medium-grey)'
      }}>
        <strong>Current Stage:</strong> {STAGE_REQUIREMENTS[currentStage]?.description || 'Unknown stage'}
      </div>
    </div>
  );

  const renderCurrentStage = () => {
    switch (currentStage) {
      case FLOW_STAGES.PROFILE_SETUP:
        return (
          <ProfileProgressTracker
            apiEndpoint={config.API_ENDPOINT}
            isLocalDevelopment={false}
            onProfileComplete={(profile) => handleStageComplete({ userProfile: profile })}
          />
        );

      case FLOW_STAGES.PLACEMENT_TEST:
        return (
          <PlacementTest
            userProfile={flowData.userProfile}
            testType="placement"
            language={flowData.userProfile?.nativeLanguages?.[0]?.toLowerCase() || 'english'}
            onTestComplete={(results, testType) => {
              if (results && testType === 'official_placement') {
                handleStageComplete({ placementResults: results });
              }
            }}
          />
        );

      case FLOW_STAGES.LANGUAGE_SELECTION:
        return (
          <LanguageSelector
            userProfile={flowData.userProfile}
            currentStep="confirm-native"
            onLanguageConfirmed={(nativeLanguages) => {
              // Update profile with confirmed languages
              updateFlowData({
                userProfile: {
                  ...flowData.userProfile,
                  nativeLanguages
                }
              });
            }}
            onTargetLanguageSelected={(targetLanguage) => {
              handleStageComplete({ targetLanguage });
            }}
            onUpdateProfile={(updatedProfile) => {
              updateFlowData({ userProfile: updatedProfile });
            }}
          />
        );

      case FLOW_STAGES.CONTEXTUAL_USE:
        return (
          <div>
            <ContextualUseCollector
              userProfile={flowData.userProfile}
              targetLanguage={flowData.targetLanguage}
              placementResults={flowData.placementResults}
              onContextualUseComplete={(contextualUse) => {
                updateFlowData({ contextualUse });
                // Don't complete stage yet - need priorities
              }}
            />
            
            {/* MoSCoW Priority Setting */}
            {flowData.contextualUse && (
              <div style={{ marginTop: '2rem' }}>
                <MoSCoWPrioritizationSystem
                  itemSet="learning_content"
                  initialPriorities={userPriorities}
                  onPrioritiesChange={(priorities) => {
                    setUserPriorities(priorities);
                    setPrioritiesSet(true);
                    handleStageComplete({ 
                      contextualUse: flowData.contextualUse,
                      userPriorities: priorities 
                    });
                  }}
                  contextualUse={flowData.contextualUse}
                  showTimeAllocation={true}
                  maxMustHave={4}
                  maxShouldHave={8}
                />
              </div>
            )}
          </div>
        );

      case FLOW_STAGES.LEARNING_PHASE:
        return (
          <PhaseManager
            userProfile={flowData.userProfile}
            contextualUse={flowData.contextualUse}
            targetLanguage={flowData.targetLanguage}
            placementResults={flowData.placementResults}
            userPriorities={flowData.userPriorities || userPriorities}
            onPhaseChange={(phaseData) => {
              updateFlowData({
                currentPhase: phaseData.toPhase,
                courseInitialized: true
              });
            }}
            onPhaseComplete={(completionData) => {
              completeFlow();
            }}
          >
            <SimulationEnvironment />
          </PhaseManager>
        );

      default:
        return (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--destructive)'
          }}>
            <AlertTriangle size={48} style={{ margin: '0 auto 1rem' }} />
            <h3>Unknown Stage</h3>
            <p>An error occurred in the flow controller.</p>
            <button
              onClick={() => setCurrentStage(FLOW_STAGES.PROFILE_SETUP)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--harvard-crimson)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              Restart Flow
            </button>
          </div>
        );
    }
  };

  if (flowLocked) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <Lock size={64} style={{ color: 'var(--medium-grey)', margin: '0 auto 1rem' }} />
        <h2 style={{ color: 'var(--dark-charcoal-grey)' }}>Setup Flow Locked</h2>
        <p style={{ color: 'var(--medium-grey)' }}>
          Please contact support if you need to modify your completed setup.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--cream-background)',
      padding: '2rem',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {renderProgressIndicator()}
        
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(165, 28, 48, 0.1)',
            border: '2px solid var(--harvard-crimson)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '2rem',
            color: 'var(--harvard-crimson)',
            textAlign: 'center'
          }}>
            <AlertTriangle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            {error}
          </div>
        )}

        <div className="flow-stage-content">
          {renderCurrentStage()}
        </div>

        {/* Development Tools */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '3rem',
            padding: '1rem',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius)',
            fontSize: '0.8rem'
          }}>
            <strong>Dev Tools:</strong>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {Object.values(FLOW_STAGES).map(stage => (
                <button
                  key={stage}
                  onClick={() => forceStageJump(stage)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.7rem',
                    backgroundColor: stage === currentStage ? 'var(--harvard-crimson)' : 'var(--oxford-blue)',
                    color: 'var(--warm-white)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  {stage}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '0.5rem', color: 'var(--medium-grey)' }}>
              Current Data: {JSON.stringify(Object.keys(flowData), null, 1)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppFlowController;