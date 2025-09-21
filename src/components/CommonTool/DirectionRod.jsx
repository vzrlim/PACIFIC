// DirectionRod.jsx - Learning Direction Feedback System
// Converts user feedback into structured AI prompts for course redirection

import React, { useState, useEffect } from 'react';

// Feedback Categories
const FEEDBACK_CATEGORIES = {
  interest_mismatch: {
    name: 'Interest Mismatch',
    description: 'Content doesn\'t match my personal interests',
    icon: '🎯',
    color: 'var(--harvard-crimson)'
  },
  practical_gap: {
    name: 'Practical Gap',
    description: 'Not useful for my real-world needs',
    icon: '🔧',
    color: 'var(--oxford-blue)'
  },
  pace_issue: {
    name: 'Pace Issue',
    description: 'Too fast/slow for my learning speed',
    icon: '⏱️',
    color: 'var(--dartmouth-green)'
  },
  difficulty_level: {
    name: 'Difficulty Level',
    description: 'Too easy/hard for my current level',
    icon: '📊',
    color: 'var(--tsinghua-purple)'
  },
  context_mismatch: {
    name: 'Context Mismatch',
    description: 'Wrong cultural/professional context',
    icon: '🌍',
    color: 'var(--oxford-blue)'
  },
  method_preference: {
    name: 'Method Preference',
    description: 'Prefer different learning approach',
    icon: '🎨',
    color: 'var(--dartmouth-green)'
  }
};

// Priority vs Practicality Scale
const PRIORITY_PRACTICALITY_OPTIONS = {
  high_priority_high_practical: {
    label: 'High Priority + High Practical',
    description: 'Essential for my goals AND immediately useful',
    weight: 1.0,
    color: 'var(--dartmouth-green)'
  },
  high_priority_low_practical: {
    label: 'High Priority + Low Practical',
    description: 'Essential for my goals but not immediately useful',
    weight: 0.8,
    color: 'var(--oxford-blue)'
  },
  low_priority_high_practical: {
    label: 'Low Priority + High Practical',
    description: 'Not essential but immediately useful',
    weight: 0.6,
    color: 'var(--tsinghua-purple)'
  },
  low_priority_low_practical: {
    label: 'Low Priority + Low Practical',
    description: 'Neither essential nor immediately useful',
    weight: 0.3,
    color: 'var(--harvard-crimson)'
  }
};

const DirectionRod = ({
  currentContent,
  userProfile,
  onFeedbackSubmit,
  onRedirectRequest,
  onPriorityUpdate,
  isVisible = false,
  onClose
}) => {
  // Feedback State
  const [feedbackType, setFeedbackType] = useState('');
  const [specificFeedback, setSpecificFeedback] = useState('');
  const [redirectRequest, setRedirectRequest] = useState('');
  const [priorityScale, setPriorityScale] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('medium');
  const [step, setStep] = useState('category'); // category, details, priority, submit
  
  // Moscow Prioritization
  const [moscowPrioritization, setMoscowPrioritization] = useState({
    must_have: '',
    should_have: '',
    could_have: '',
    wont_have: ''
  });

  // Validation
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when component becomes visible
  useEffect(() => {
    if (isVisible) {
      setStep('category');
      setValidationErrors([]);
    }
  }, [isVisible]);

  // Validation functions
  const validateCategory = () => {
    const errors = [];
    if (!feedbackType) {
      errors.push('Please select a feedback category');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validateDetails = () => {
    const errors = [];
    if (!specificFeedback.trim()) {
      errors.push('Please provide specific feedback about the issue');
    }
    if (specificFeedback.trim().length < 20) {
      errors.push('Please provide more detailed feedback (minimum 20 characters)');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validatePriority = () => {
    const errors = [];
    if (!priorityScale) {
      errors.push('Please indicate priority vs practicality');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle step navigation
  const nextStep = () => {
    let isValid = false;
    
    switch (step) {
      case 'category':
        isValid = validateCategory();
        if (isValid) setStep('details');
        break;
      case 'details':
        isValid = validateDetails();
        if (isValid) setStep('priority');
        break;
      case 'priority':
        isValid = validatePriority();
        if (isValid) setStep('submit');
        break;
      default:
        break;
    }
  };

  const previousStep = () => {
    switch (step) {
      case 'details':
        setStep('category');
        break;
      case 'priority':
        setStep('details');
        break;
      case 'submit':
        setStep('priority');
        break;
      default:
        break;
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        type: feedbackType,
        specificFeedback: specificFeedback.trim(),
        redirectRequest: redirectRequest.trim(),
        priorityScale,
        urgencyLevel,
        moscowPrioritization,
        currentContent: {
          id: currentContent?.id,
          section: currentContent?.currentSection,
          title: currentContent?.title
        },
        userContext: {
          targetLanguage: userProfile?.targetLanguage,
          learningGoals: userProfile?.learningGoals,
          contextualUse: userProfile?.contextualUse
        },
        timestamp: new Date().toISOString(),
        needsImmediate: urgencyLevel === 'high'
      };

      if (onFeedbackSubmit) {
        await onFeedbackSubmit(feedbackData);
      }

      if (redirectRequest.trim() && onRedirectRequest) {
        await onRedirectRequest({
          direction: redirectRequest.trim(),
          priority: PRIORITY_PRACTICALITY_OPTIONS[priorityScale]?.weight || 0.5,
          urgency: urgencyLevel
        });
      }

      if (onPriorityUpdate) {
        await onPriorityUpdate({
          moscow: moscowPrioritization,
          priorityScale: PRIORITY_PRACTICALITY_OPTIONS[priorityScale]
        });
      }

      // Reset form
      setFeedbackType('');
      setSpecificFeedback('');
      setRedirectRequest('');
      setPriorityScale('');
      setMoscowPrioritization({
        must_have: '',
        should_have: '',
        could_have: '',
        wont_have: ''
      });
      
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setValidationErrors(['Failed to submit feedback. Please try again.']);
    }
    
    setIsSubmitting(false);
  };

  // Render category selection
  const renderCategorySelection = () => (
    <div className="feedback-category-step">
      <h3 style={{
        margin: '0 0 1rem 0',
        color: 'var(--harvard-crimson)',
        fontFamily: '"Times New Roman", Times, serif',
        textAlign: 'center'
      }}>
        What's the issue with current teaching?
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {Object.entries(FEEDBACK_CATEGORIES).map(([key, category]) => (
          <div
            key={key}
            onClick={() => setFeedbackType(key)}
            style={{
              padding: '1rem',
              border: `3px solid ${feedbackType === key ? category.color : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              backgroundColor: feedbackType === key ? `${category.color}10` : 'var(--card)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>{category.icon}</div>
            <div>
              <h4 style={{
                margin: '0 0 0.25rem 0',
                color: 'var(--dark-charcoal-grey)',
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: '1rem'
              }}>
                {category.name}
              </h4>
              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: 'var(--medium-grey)',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                {category.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render details input
  const renderDetailsInput = () => (
    <div className="feedback-details-step">
      <h3 style={{
        margin: '0 0 1rem 0',
        color: 'var(--harvard-crimson)',
        fontFamily: '"Times New Roman", Times, serif',
        textAlign: 'center'
      }}>
        Tell us specifically what's wrong
      </h3>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--muted)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>
              {FEEDBACK_CATEGORIES[feedbackType]?.icon}
            </span>
            <strong style={{
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              {FEEDBACK_CATEGORIES[feedbackType]?.name}
            </strong>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            {FEEDBACK_CATEGORIES[feedbackType]?.description}
          </p>
        </div>

        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Specific feedback about the issue:
        </label>
        
        <textarea
          value={specificFeedback}
          onChange={(e) => setSpecificFeedback(e.target.value)}
          placeholder="Be specific about what's not working for you. For example: 'The business Spanish content focuses on formal meetings, but I need casual restaurant conversation for my food tourism business.'"
          rows={4}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Minimum 20 characters
          </span>
          <span style={{
            fontSize: '0.8rem',
            color: specificFeedback.length >= 20 ? 'var(--dartmouth-green)' : 'var(--medium-grey)'
          }}>
            {specificFeedback.length}/20
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          How should we redirect the teaching? (Optional)
        </label>
        
        <textarea
          value={redirectRequest}
          onChange={(e) => setRedirectRequest(e.target.value)}
          placeholder="Suggest a better direction. For example: 'Focus more on conversational phrases for casual social situations rather than formal business vocabulary.'"
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Urgency Level:
        </label>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['low', 'medium', 'high'].map(level => (
            <label key={level} style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              border: `2px solid ${urgencyLevel === level ? 'var(--harvard-crimson)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: urgencyLevel === level ? 'rgba(165, 28, 48, 0.05)' : 'transparent'
            }}>
              <input
                type="radio"
                name="urgency"
                value={level}
                checked={urgencyLevel === level}
                onChange={(e) => setUrgencyLevel(e.target.value)}
              />
              <span style={{
                fontFamily: '"Times New Roman", Times, serif',
                textTransform: 'capitalize'
              }}>
                {level}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // Render priority assessment
  const renderPriorityAssessment = () => (
    <div className="feedback-priority-step">
      <h3 style={{
        margin: '0 0 1rem 0',
        color: 'var(--harvard-crimson)',
        fontFamily: '"Times New Roman", Times, serif',
        textAlign: 'center'
      }}>
        Priority vs Practicality Assessment
      </h3>
      
      <p style={{
        textAlign: 'center',
        marginBottom: '2rem',
        color: 'var(--medium-grey)',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        Help us understand how to weight this feedback against practical use
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{
          margin: '0 0 1rem 0',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          How important vs practical is this change?
        </h4>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {Object.entries(PRIORITY_PRACTICALITY_OPTIONS).map(([key, option]) => (
            <label key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              border: `2px solid ${priorityScale === key ? option.color : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: priorityScale === key ? `${option.color}10` : 'transparent'
            }}>
              <input
                type="radio"
                name="priority"
                value={key}
                checked={priorityScale === key}
                onChange={(e) => setPriorityScale(e.target.value)}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--dark-charcoal-grey)',
                  fontFamily: '"Times New Roman", Times, serif',
                  marginBottom: '0.25rem'
                }}>
                  {option.label}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--medium-grey)',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  {option.description}
                </div>
              </div>
              <div style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: option.color,
                color: 'var(--warm-white)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                Weight: {option.weight}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{
          margin: '0 0 1rem 0',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          MoSCoW Prioritization (Optional)
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}>
          {[
            { key: 'must_have', label: 'Must Have', color: 'var(--harvard-crimson)' },
            { key: 'should_have', label: 'Should Have', color: 'var(--oxford-blue)' },
            { key: 'could_have', label: 'Could Have', color: 'var(--dartmouth-green)' },
            { key: 'wont_have', label: 'Won\'t Have', color: 'var(--medium-grey)' }
          ].map(item => (
            <div key={item.key}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: item.color,
                fontFamily: '"Times New Roman", Times, serif',
                fontWeight: 'var(--font-weight-medium)',
                fontSize: '0.9rem'
              }}>
                {item.label}:
              </label>
              <input
                type="text"
                value={moscowPrioritization[item.key]}
                onChange={(e) => setMoscowPrioritization(prev => ({
                  ...prev,
                  [item.key]: e.target.value
                }))}
                placeholder={`What ${item.label.toLowerCase()}...`}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: `2px solid ${item.color}`,
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render submission summary
  const renderSubmissionSummary = () => (
    <div className="feedback-submit-step">
      <h3 style={{
        margin: '0 0 1rem 0',
        color: 'var(--harvard-crimson)',
        fontFamily: '"Times New Roman", Times, serif',
        textAlign: 'center'
      }}>
        Review Your Feedback
      </h3>
      
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius)',
        marginBottom: '2rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <strong style={{
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Issue: {FEEDBACK_CATEGORIES[feedbackType]?.name}
          </strong>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: '0.5rem',
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Your Feedback:
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            lineHeight: '1.4'
          }}>
            {specificFeedback}
          </div>
        </div>
        
        {redirectRequest && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Suggested Direction:
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--medium-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              lineHeight: '1.4'
            }}>
              {redirectRequest}
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: '0.5rem',
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Priority Level:
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: PRIORITY_PRACTICALITY_OPTIONS[priorityScale]?.color,
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            {PRIORITY_PRACTICALITY_OPTIONS[priorityScale]?.label} 
            (Weight: {PRIORITY_PRACTICALITY_OPTIONS[priorityScale]?.weight})
          </div>
        </div>
        
        <div>
          <div style={{
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: '0.5rem',
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Urgency:
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            textTransform: 'capitalize'
          }}>
            {urgencyLevel}
          </div>
        </div>
      </div>
      
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--card)',
        border: '2px solid var(--oxford-blue)',
        borderRadius: 'var(--radius)',
        fontSize: '0.9rem',
        color: 'var(--dark-charcoal-grey)',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <strong>Next Steps:</strong> Our AI will analyze your feedback and adjust the teaching approach. 
        You'll see changes in the next lesson section based on your priority and practicality assessment.
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="direction-rod-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '2rem'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 0.5rem 0',
              color: 'var(--harvard-crimson)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '1.5rem'
            }}>
              🧭 DirectionRod Feedback
            </h2>
            <p style={{
              margin: 0,
              color: 'var(--medium-grey)',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Redirect teaching to match your interests and practical needs
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--medium-grey)'
            }}
          >
            ×
          </button>
        </div>

        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['category', 'details', 'priority', 'submit'].map((stepName, index) => (
              <div key={stepName} style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: ['category', 'details', 'priority', 'submit'].indexOf(step) >= index 
                  ? 'var(--harvard-crimson)' 
                  : 'var(--border)'
              }}></div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div style={{ minHeight: '300px', marginBottom: '2rem' }}>
          {step === 'category' && renderCategorySelection()}
          {step === 'details' && renderDetailsInput()}
          {step === 'priority' && renderPriorityAssessment()}
          {step === 'submit' && renderSubmissionSummary()}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={{
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: 'rgba(165, 28, 48, 0.1)',
            border: '2px solid var(--harvard-crimson)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {validationErrors.map((error, index) => (
                <li key={index} style={{
                  color: 'var(--harvard-crimson)',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <button
            onClick={previousStep}
            disabled={step === 'category'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: step === 'category' ? 'var(--muted)' : 'var(--medium-grey)',
              color: step === 'category' ? 'var(--medium-grey)' : 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif',
              cursor: step === 'category' ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>

          {step === 'submit' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: isSubmitting ? 'var(--medium-grey)' : 'var(--harvard-crimson)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif',
                fontWeight: 'var(--font-weight-medium)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          ) : (
            <button
              onClick={nextStep}
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
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectionRod;