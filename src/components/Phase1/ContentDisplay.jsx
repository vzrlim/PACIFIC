// ContentDisplay.jsx - Main Learning Interface
// Displays learning content with reading time estimation and external references

import React, { useState, useEffect, useRef } from 'react';
import { MoSCoWUtils, MOSCOW_PRIORITIES } from './MoSCoWPrioritizationSystem';

// Reading Time Estimation Formulas
const READING_TIME_CONFIG = {
  // Words per minute by language difficulty
  wpm: {
    native: 250,        // Native language reading speed
    familiar: 180,      // Additional language user knows
    learning_beginner: 120,   // A1-A2 level
    learning_intermediate: 150, // B1-B2 level
    learning_advanced: 200    // C1-C2 level
  },
  
  // Content complexity multipliers
  complexity: {
    simple: 1.0,        // Basic vocabulary, simple sentences
    medium: 1.3,        // Mixed vocabulary, complex sentences
    complex: 1.8,       // Advanced vocabulary, technical content
    academic: 2.2       // Academic/specialized content
  },
  
  // Processing time for different content types (seconds)
  processingTime: {
    text: 1.2,          // Plain text processing
    vocabulary: 3.0,    // New vocabulary absorption
    grammar: 4.5,       // Grammar concept understanding
    audio: 1.5,         // Audio content processing
    interactive: 2.0    // Interactive component engagement
  }
};

// External Reference Types
const REFERENCE_TYPES = {
  dictionary: { icon: '📖', label: 'Dictionary', color: 'var(--oxford-blue)' },
  grammar: { icon: '📝', label: 'Grammar Guide', color: 'var(--dartmouth-green)' },
  culture: { icon: '🌍', label: 'Cultural Context', color: 'var(--tsinghua-purple)' },
  pronunciation: { icon: '🔊', label: 'Pronunciation', color: 'var(--harvard-crimson)' },
  exercise: { icon: '💪', label: 'Practice Exercise', color: 'var(--oxford-blue)' },
  video: { icon: '🎥', label: 'Video Resource', color: 'var(--dartmouth-green)' },
  article: { icon: '📰', label: 'Article/Reading', color: 'var(--medium-grey)' }
};

const ContentDisplay = ({
  contentData,
  userProfile,
  templateComponents = [],
  onProgressUpdate,
  onContentComplete,
  onFeedback,
  readOnly = false,
  // ADD THESE NEW PROPS:
  moscowPriorities = null,
  priorityTimeAllocation = null,
  currentPhase = 'content'
}) => {
  // Content State
  const [currentSection, setCurrentSection] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [timeEstimates, setTimeEstimates] = useState({});
  const [actualTimeSpent, setActualTimeSpent] = useState({});
  const [sectionStartTime, setSectionStartTime] = useState(null);
  // MoSCoW priority state
  const [prioritizedContent, setPrioritizedContent] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'mustHave', 'shouldHave', 'couldHave'

  
  // UI State
  const [showReferences, setShowReferences] = useState(false);
  const [showTimeEstimator, setShowTimeEstimator] = useState(true);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [estimationMethod, setEstimationMethod] = useState('adaptive'); // 'adaptive', 'conservative', 'optimistic'
  
  // Refs
  const contentRef = useRef(null);
  const progressRef = useRef(null);

  // Initialize content and calculate time estimates
  useEffect(() => {
    if (contentData && userProfile) {
      calculateTimeEstimates();
      
      // ADD: Prioritize content if MoSCoW is available
      if (moscowPriorities) {
        const prioritized = prioritizeContentSections();
        setPrioritizedContent(prioritized);
      } else {
        setPrioritizedContent(contentData.sections || []);
      }
      
      setContentLoaded(true);
      setSectionStartTime(Date.now());
    }
  }, [contentData, userProfile, moscowPriorities]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight - element.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setReadingProgress(Math.min(progress, 100));
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Track time spent on sections
  useEffect(() => {
    return () => {
      if (sectionStartTime) {
        const timeSpent = Date.now() - sectionStartTime;
        setActualTimeSpent(prev => ({
          ...prev,
          [currentSection]: (prev[currentSection] || 0) + timeSpent
        }));
      }
    };
  }, [currentSection, sectionStartTime]);

  // Calculate reading time estimates
  const calculateTimeEstimates = () => {
    if (!contentData?.sections) return;

    const estimates = {};
    let totalEstimate = 0;

    contentData.sections.forEach((section, index) => {
      const estimate = calculateSectionTime(section);
      estimates[index] = estimate;
      totalEstimate += estimate.total;
    });

    estimates.total = totalEstimate;
    setTimeEstimates(estimates);
  };

  // Calculate time for individual section
  const calculateSectionTime = (section) => {
    const userLevel = getUserLearningLevel();
    const baseWPM = READING_TIME_CONFIG.wpm[userLevel];
    const complexityMultiplier = READING_TIME_CONFIG.complexity[section.complexity || 'medium'];
    
    let readingTime = 0;
    let processingTime = 0;
    let wordCount = 0;

    // Calculate reading time
    if (section.content) {
      wordCount = countWords(section.content);
      readingTime = (wordCount / baseWPM) * complexityMultiplier;
    }

    // Add processing time for different content types
    if (section.vocabulary?.length > 0) {
      processingTime += section.vocabulary.length * READING_TIME_CONFIG.processingTime.vocabulary;
    }
    
    if (section.grammar?.length > 0) {
      processingTime += section.grammar.length * READING_TIME_CONFIG.processingTime.grammar;
    }

    if (section.audio?.length > 0) {
      processingTime += section.audio.length * READING_TIME_CONFIG.processingTime.audio;
    }

    if (section.interactive?.length > 0) {
      processingTime += section.interactive.length * READING_TIME_CONFIG.processingTime.interactive;
    }

    // Apply estimation method adjustment
    const methodMultiplier = getEstimationMethodMultiplier();
    const total = (readingTime + processingTime / 60) * methodMultiplier; // Convert to minutes

    return {
      reading: readingTime,
      processing: processingTime / 60,
      total: total,
      wordCount: wordCount,
      complexity: section.complexity || 'medium'
    };
  };

  // Prioritize content sections based on MoSCoW
  const prioritizeContentSections = () => {
    if (!contentData?.sections || !moscowPriorities) return contentData.sections;

    const prioritizedSections = contentData.sections.map(section => {
      const sectionPriority = determineSectionPriority(section);
      return {
        ...section,
        moscowCategory: sectionPriority,
        priorityWeight: MoSCoWUtils.getPriorityWeight(sectionPriority)
      };
    });

    // Sort by priority weight (highest first)
    return prioritizedSections.sort((a, b) => b.priorityWeight - a.priorityWeight);
  };

  // Determine section priority based on content topics
  const determineSectionPriority = (section) => {
    if (!moscowPriorities) return 'couldHave';

    const sectionContent = (section.title + ' ' + section.content).toLowerCase();
    
    // Check each MoSCoW category
    for (const [category, priorities] of Object.entries(moscowPriorities)) {
      const matches = priorities.some(priority => 
        sectionContent.includes(priority.toLowerCase()) ||
        priority.toLowerCase().includes(sectionContent.split(' ')[0])
      );
      if (matches) return category;
    }
    
    return 'couldHave'; // Default fallback
  };

  // Determine user's learning level
  const getUserLearningLevel = () => {
    if (!userProfile?.targetLanguage) return 'learning_beginner';
    
    const cefrLevel = userProfile.placementTest?.cefrLevel;
    if (!cefrLevel) return 'learning_beginner';
    
    if (['A1', 'A2'].includes(cefrLevel)) return 'learning_beginner';
    if (['B1', 'B2'].includes(cefrLevel)) return 'learning_intermediate';
    if (['C1', 'C2'].includes(cefrLevel)) return 'learning_advanced';
    
    return 'learning_beginner';
  };

  // Get estimation method multiplier
  const getEstimationMethodMultiplier = () => {
    switch (estimationMethod) {
      case 'conservative': return 1.3;
      case 'optimistic': return 0.8;
      case 'adaptive': 
      default: return 1.0;
    }
  };

  // Count words in text content
  const countWords = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Format time display
  const formatTime = (minutes) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Navigation functions
  const goToSection = (sectionIndex) => {
    if (sectionStartTime) {
      const timeSpent = Date.now() - sectionStartTime;
      setActualTimeSpent(prev => ({
        ...prev,
        [currentSection]: (prev[currentSection] || 0) + timeSpent
      }));
    }
    
    setCurrentSection(sectionIndex);
    setSectionStartTime(Date.now());
    setReadingProgress(0);
    
    if (onProgressUpdate) {
      onProgressUpdate({
        currentSection: sectionIndex,
        totalSections: contentData?.sections?.length || 0,
        timeSpent: actualTimeSpent,
        readingProgress: 0
      });
    }
  };

  const nextSection = () => {
    if (currentSection < (contentData?.sections?.length || 0) - 1) {
      goToSection(currentSection + 1);
    } else {
      handleContentComplete();
    }
  };

  const previousSection = () => {
    if (currentSection > 0) {
      goToSection(currentSection - 1);
    }
  };

  const handleContentComplete = () => {
    if (onContentComplete) {
      onContentComplete({
        totalTimeSpent: Object.values(actualTimeSpent).reduce((sum, time) => sum + time, 0),
        estimatedTime: timeEstimates.total || 0,
        sectionsCompleted: Object.keys(actualTimeSpent).length,
        finalProgress: readingProgress
      });
    }
  };

  // Render time estimator panel
  const renderTimeEstimator = () => {
    if (!showTimeEstimator || !timeEstimates.total) return null;
    
    const currentEstimate = timeEstimates[currentSection];
    const actualTime = actualTimeSpent[currentSection] || 0;
    
    return (
      <div className="time-estimator-panel" style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        width: '280px',
        backgroundColor: 'var(--card)',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h4 style={{
            margin: 0,
            color: 'var(--harvard-crimson)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '1rem'
          }}>
            Reading Time
          </h4>
          <button
            onClick={() => setShowTimeEstimator(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--medium-grey)',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Current Section Estimate */}
        {currentEstimate && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{
                fontSize: '0.9rem',
                color: 'var(--dark-charcoal-grey)',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                Current Section:
              </span>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--dartmouth-green)'
              }}>
                {formatTime(currentEstimate.total)}
              </span>
            </div>
            
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--medium-grey)',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              {currentEstimate.wordCount} words • {currentEstimate.complexity} complexity
            </div>
            
            {actualTime > 0 && (
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--oxford-blue)',
                marginTop: '0.25rem'
              }}>
                Actual: {formatTime(actualTime / 60000)}
              </div>
            )}
          </div>
        )}

        {/* Total Progress */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <span style={{
              fontSize: '0.9rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Total Estimated:
            </span>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--harvard-crimson)'
            }}>
              {formatTime(timeEstimates.total)}
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((currentSection + 1) / (contentData?.sections?.length || 1)) * 100}%`,
              height: '100%',
              backgroundColor: 'var(--dartmouth-green)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Estimation Method Selector */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Estimation Method:
          </label>
          <select
            value={estimationMethod}
            onChange={(e) => {
              setEstimationMethod(e.target.value);
              calculateTimeEstimates();
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}
          >
            <option value="optimistic">Optimistic (Faster)</option>
            <option value="adaptive">Adaptive (Balanced)</option>
            <option value="conservative">Conservative (Slower)</option>
          </select>
        </div>
      </div>
    );
  };

  // Render external references panel
  const renderExternalReferences = () => {
    const currentSectionData = contentData?.sections?.[currentSection];
    const references = currentSectionData?.externalReferences || [];
    
    if (!showReferences || references.length === 0) return null;
    
    return (
      <div className="external-references-panel" style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        width: '320px',
        maxHeight: '400px',
        backgroundColor: 'var(--card)',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h4 style={{
            margin: 0,
            color: 'var(--harvard-crimson)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '1rem'
          }}>
            External References
          </h4>
          <button
            onClick={() => setShowReferences(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--medium-grey)',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {references.map((reference, index) => {
            const refType = REFERENCE_TYPES[reference.type] || REFERENCE_TYPES.article;
            
            return (
              <div key={index} style={{
                padding: '0.75rem',
                border: `2px solid ${refType.color}`,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--card)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    {refType.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{
                      margin: '0 0 0.25rem 0',
                      color: 'var(--dark-charcoal-grey)',
                      fontFamily: '"Times New Roman", Times, serif',
                      fontSize: '0.9rem',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      {reference.title}
                    </h5>
                    <p style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '0.8rem',
                      color: 'var(--medium-grey)',
                      fontFamily: '"Times New Roman", Times, serif',
                      lineHeight: '1.4'
                    }}>
                      {reference.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: refType.color,
                        color: 'var(--warm-white)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        fontFamily: '"Times New Roman", Times, serif'
                      }}>
                        {refType.label}
                      </span>
                      {reference.url && (
                        <a
                          href={reference.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: refType.color,
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            fontFamily: '"Times New Roman", Times, serif'
                          }}
                        >
                          Open →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render main content
  const renderContent = () => {
    if (!contentData?.sections || contentData.sections.length === 0) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <h3>No Content Available</h3>
            <p>Content is being prepared for your learning session.</p>
          </div>
        </div>
      );
    }

    const sectionsToUse = prioritizedContent.length > 0 ? prioritizedContent : (contentData?.sections || []);
    const filteredSections = priorityFilter === 'all' ? sectionsToUse : 
      sectionsToUse.filter(section => {
        if (priorityFilter === 'mustHave') return section.moscowCategory === 'mustHave';
        if (priorityFilter === 'shouldHave') return ['mustHave', 'shouldHave'].includes(section.moscowCategory);
        if (priorityFilter === 'couldHave') return ['mustHave', 'shouldHave', 'couldHave'].includes(section.moscowCategory);
        return true;
      });

    const section = filteredSections[currentSection];
    
    return (
      <div className="content-section" style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        {/* Section Header */}
        <div style={{
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--medium-grey)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            Section {currentSection + 1} of {filteredSections.length}
            {/* ADD: Priority indicator */}
            {section?.moscowCategory && (
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: MOSCOW_PRIORITIES[section.moscowCategory.toUpperCase()]?.color || 'var(--muted)',
                color: 'var(--warm-white)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {MOSCOW_PRIORITIES[section.moscowCategory.toUpperCase()]?.label || section.moscowCategory}
              </span>
            )}
          </div>
          <h1 style={{
            color: 'var(--harvard-crimson)',
            margin: '0 0 0.5rem 0',
            fontSize: '2rem',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {section.title}
          </h1>
          {section.subtitle && (
            <p style={{
              color: 'var(--medium-grey)',
              fontSize: '1.1rem',
              margin: 0
            }}>
              {section.subtitle}
            </p>
          )}
        </div>

        {/* Section Content */}
        <div className="section-content" style={{
          lineHeight: '1.6',
          fontSize: '1.1rem',
          color: 'var(--dark-charcoal-grey)'
        }}>
          {section.content && (
            <div style={{ marginBottom: '2rem' }}>
              {section.content}
            </div>
          )}

          {/* Template Components Integration */}
          {templateComponents.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              {templateComponents.map((component, index) => (
                <div key={index} style={{ marginBottom: '1.5rem' }}>
                  {/* Render template component here */}
                  <div style={{
                    padding: '1rem',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--card)'
                  }}>
                    Template Component: {component.type || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="pacific-content-display" style={{
      minHeight: '100vh',
      backgroundColor: 'var(--cream-background)',
      position: 'relative'
    }}>
      {/* Content Header */}
      <div style={{
        backgroundColor: 'var(--card)',
        borderBottom: '2px solid var(--border)',
        padding: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 0.25rem 0',
              color: 'var(--harvard-crimson)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '1.3rem'
            }}>
              {contentData?.title || 'Learning Content'}
            </h2>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--medium-grey)',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              {userProfile?.targetLanguage?.language || 'Language Learning'} • 
              Level: {userProfile?.placementTest?.cefrLevel || 'Beginner'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Toggle Buttons */}
            {/* Priority Filter */}
            {moscowPriorities && (
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontFamily: '"Times New Roman", Times, serif',
                  marginRight: '0.5rem'
                }}
              >
                <option value="all">All Content</option>
                <option value="mustHave">Must Have Only</option>
                <option value="shouldHave">Should Have+</option>
                <option value="couldHave">Could Have+</option>
              </select>
            )}
            <button
              onClick={() => setShowTimeEstimator(!showTimeEstimator)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: showTimeEstimator ? 'var(--dartmouth-green)' : 'var(--muted)',
                color: showTimeEstimator ? 'var(--warm-white)' : 'var(--dark-charcoal-grey)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              Time
            </button>
            
            <button
              onClick={() => setShowReferences(!showReferences)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: showReferences ? 'var(--oxford-blue)' : 'var(--muted)',
                color: showReferences ? 'var(--warm-white)' : 'var(--dark-charcoal-grey)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              References
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '4px',
        backgroundColor: 'var(--muted)',
        position: 'sticky',
        top: '72px',
        zIndex: 99
      }}>
        <div style={{
          height: '100%',
          width: `${readingProgress}%`,
          backgroundColor: 'var(--dartmouth-green)',
          transition: 'width 0.1s ease'
        }}></div>
      </div>

      {/* Main Content Area */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem 0'
        }}
      >
        {renderContent()}
      </div>

      {/* Navigation */}
      <div style={{
        backgroundColor: 'var(--card)',
        borderTop: '2px solid var(--border)',
        padding: '1rem',
        position: 'sticky',
        bottom: 0
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={previousSection}
            disabled={currentSection === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: currentSection === 0 ? 'var(--muted)' : 'var(--oxford-blue)',
              color: currentSection === 0 ? 'var(--medium-grey)' : 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif',
              cursor: currentSection === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>

          <div style={{
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '0.9rem'
          }}>
            {readingProgress.toFixed(0)}% complete
          </div>

          <button
            onClick={nextSection}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--harvard-crimson)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif',
              cursor: 'pointer'
            }}
          >
            {currentSection === (filteredSections.length || 0) - 1 ? 'Complete' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Floating Panels */}
      {renderTimeEstimator()}
      {renderExternalReferences()}
    </div>
  );
};

export default ContentDisplay;