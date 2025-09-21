// ContextualUseCollector.jsx - Detailed Contextual Use Assessment
// Implements MoSCoW Priority & Practicality Scale for Professional vs Personal contexts
// Feeds data to aiLessonGenerator.py for thematic contextualization

import React, { useState, useEffect } from 'react';
import { Briefcase, Heart, Clock, Target, AlertCircle, CheckCircle2 } from 'lucide-react';

const ContextualUseCollector = ({
  userProfile,
  targetLanguage,
  placementResults,
  onContextualUseComplete
}) => {
  // Component state
  const [step, setStep] = useState('use_type_selection');
  const [useType, setUseType] = useState(''); // 'professional' or 'personal'
  const [professionalContext, setProfessionalContext] = useState({
    industry: '',
    role: '',
    specificSituation: '',
    businessNeed: '',
    colleagues: '',
    urgencyLevel: '',
    practicalApplication: ''
  });
  const [personalContext, setPersonalContext] = useState({
    inspiration: '',
    personalInterest: '',
    hobby: '',
    travelPlans: '',
    culturalInterest: '',
    creativePursuit: '',
    socialContext: ''
  });
  const [priorityScale, setPriorityScale] = useState({
    mustHave: [],
    shouldHave: [],
    couldHave: [],
    wontHave: []
  });
  const [timeConstraints, setTimeConstraints] = useState({
    availableTime: '',
    deadline: '',
    urgency: 'moderate'
  });
  const [validationErrors, setValidationErrors] = useState([]);

  // Professional context options
  const industryOptions = [
    'Technology/Software', 'Healthcare/Medical', 'Education/Academic', 'Finance/Banking',
    'Manufacturing/Engineering', 'Hospitality/Tourism', 'Legal/Government', 'Retail/Sales',
    'Marketing/Media', 'Research/Science', 'Consulting', 'Real Estate', 'Other'
  ];

  const urgencyLevels = [
    { value: 'immediate', label: 'Immediate (< 1 month)', color: 'var(--destructive)' },
    { value: 'urgent', label: 'Urgent (1-3 months)', color: 'var(--harvard-crimson)' },
    { value: 'moderate', label: 'Moderate (3-6 months)', color: 'var(--oxford-blue)' },
    { value: 'relaxed', label: 'Relaxed (6+ months)', color: 'var(--dartmouth-green)' }
  ];

  // Personal interest categories
  const personalInterestOptions = [
    'Travel & Culture', 'Literature & Reading', 'Movies & Entertainment', 'Music & Arts',
    'Sports & Fitness', 'Cooking & Food', 'Gaming & Technology', 'History & Heritage',
    'Romance & Relationships', 'Hobbies & Crafts', 'Philosophy & Spirituality', 'Other'
  ];

  // MoSCoW methodology items
  const moscowItems = {
    professional: [
      'Business email communication',
      'Meeting participation',
      'Presentation delivery',
      'Client/customer interaction', 
      'Technical documentation',
      'Networking events',
      'Contract negotiation',
      'Team collaboration',
      'Phone/video calls',
      'Written reports'
    ],
    personal: [
      'Casual conversation',
      'Travel communication',
      'Social media interaction',
      'Entertainment consumption',
      'Cultural events',
      'Making friends',
      'Dating/relationships',
      'Family communication',
      'Hobby discussions',
      'Online communities'
    ]
  };

  // Validation functions
  const validateUseTypeSelection = () => {
    if (!useType) {
      setValidationErrors(['Please select whether this is for professional or personal use']);
      return false;
    }
    setValidationErrors([]);
    return true;
  };

  const validateContextDetails = () => {
    const errors = [];
    
    if (useType === 'professional') {
      if (!professionalContext.specificSituation.trim()) {
        errors.push('Please describe your specific professional situation');
      }
      if (!professionalContext.businessNeed.trim()) {
        errors.push('Please explain your business need for this language');
      }
      if (!professionalContext.urgencyLevel) {
        errors.push('Please select urgency level');
      }
    } else if (useType === 'personal') {
      if (!personalContext.inspiration.trim() && !personalContext.personalInterest.trim()) {
        errors.push('Please provide either your inspiration or main personal interest');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validatePriorityScale = () => {
    const errors = [];
    
    if (priorityScale.mustHave.length === 0) {
      errors.push('Please select at least one "Must Have" priority');
    }
    
    if (priorityScale.mustHave.length > 4) {
      errors.push('Maximum 4 "Must Have" priorities - keep focus manageable');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle MoSCoW priority assignment
  const assignPriority = (item, priority) => {
    setPriorityScale(prev => {
      // Remove item from all priority lists first
      const cleaned = {
        mustHave: prev.mustHave.filter(i => i !== item),
        shouldHave: prev.shouldHave.filter(i => i !== item),
        couldHave: prev.couldHave.filter(i => i !== item),
        wontHave: prev.wontHave.filter(i => i !== item)
      };
      
      // Add to new priority list
      return {
        ...cleaned,
        [priority]: [...cleaned[priority], item]
      };
    });
  };

  const getPriorityForItem = (item) => {
    for (const [priority, items] of Object.entries(priorityScale)) {
      if (items.includes(item)) return priority;
    }
    return null;
  };

  const handleComplete = () => {
    const contextualUse = {
      type: useType,
      timestamp: new Date().toISOString(),
      
      // Professional context
      ...(useType === 'professional' && {
        industry: professionalContext.industry,
        role: professionalContext.role,
        specificSituation: professionalContext.specificSituation,
        businessNeed: professionalContext.businessNeed,
        colleagues: professionalContext.colleagues,
        urgencyLevel: professionalContext.urgencyLevel,
        practicalApplication: professionalContext.practicalApplication
      }),
      
      // Personal context
      ...(useType === 'personal' && {
        inspiration: personalContext.inspiration,
        personalInterest: personalContext.personalInterest,
        hobby: personalContext.hobby,
        travelPlans: personalContext.travelPlans,
        culturalInterest: personalContext.culturalInterest,
        creativePursuit: personalContext.creativePursuit,
        socialContext: personalContext.socialContext
      }),
      
      // Priority scale (MoSCoW)
      priorityScale,
      
      // Time constraints
      timeConstraints,
      
      // Derived metadata for backend
      communicationType: useType === 'professional' ? 'formal' : 'informal',
      primaryUse: priorityScale.mustHave[0] || 'general_communication',
      
      // Integration with existing user data
      targetLanguage: targetLanguage?.language,
      currentLevel: placementResults?.level || 'A1',
      userNationality: userProfile?.nationality,
      nativeLanguages: userProfile?.nativeLanguages
    };

    onContextualUseComplete(contextualUse);
  };

  // Step navigation
  const nextStep = () => {
    switch (step) {
      case 'use_type_selection':
        if (validateUseTypeSelection()) {
          setStep('context_details');
        }
        break;
      case 'context_details':
        if (validateContextDetails()) {
          setStep('priority_scale');
        }
        break;
      case 'priority_scale':
        if (validatePriorityScale()) {
          setStep('time_constraints');
        }
        break;
      case 'time_constraints':
        setStep('review');
        break;
      case 'review':
        handleComplete();
        break;
    }
  };

  const prevStep = () => {
    const steps = ['use_type_selection', 'context_details', 'priority_scale', 'time_constraints', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
      setValidationErrors([]);
    }
  };

  // Render functions for each step
  const renderUseTypeSelection = () => (
    <div className="use-type-selection">
      <div className="step-header" style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)'
      }}>
        <h2 style={{
          color: 'var(--harvard-crimson)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)',
          margin: '0 0 0.5rem 0'
        }}>
          How will you use {targetLanguage?.language || 'this language'}?
        </h2>
        <p style={{
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: 0,
          fontSize: '1rem'
        }}>
          This determines how we contextualize your learning content
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Professional Use */}
        <div
          onClick={() => setUseType('professional')}
          style={{
            padding: '2rem',
            border: `3px solid ${useType === 'professional' ? 'var(--harvard-crimson)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            backgroundColor: useType === 'professional' ? 'rgba(165, 28, 48, 0.05)' : 'var(--card)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
        >
          <Briefcase size={48} style={{
            color: useType === 'professional' ? 'var(--harvard-crimson)' : 'var(--medium-grey)',
            margin: '0 auto 1rem'
          }} />
          <h3 style={{
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 1rem 0'
          }}>
            Professional Use
          </h3>
          <p style={{
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}>
            For work, business, career advancement, or professional development. 
            Includes formal communication, meetings, presentations, and industry-specific vocabulary.
          </p>
          <div style={{
            marginTop: '1rem',
            fontSize: '0.8rem',
            color: 'var(--medium-grey)',
            fontStyle: 'italic'
          }}>
            Examples: Business meetings, client communication, technical documentation, presentations
          </div>
        </div>

        {/* Personal Use */}
        <div
          onClick={() => setUseType('personal')}
          style={{
            padding: '2rem',
            border: `3px solid ${useType === 'personal' ? 'var(--harvard-crimson)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            backgroundColor: useType === 'personal' ? 'rgba(165, 28, 48, 0.05)' : 'var(--card)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
        >
          <Heart size={48} style={{
            color: useType === 'personal' ? 'var(--harvard-crimson)' : 'var(--medium-grey)',
            margin: '0 auto 1rem'
          }} />
          <h3 style={{
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 1rem 0'
          }}>
            Personal Use
          </h3>
          <p style={{
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}>
            For personal interests, hobbies, travel, relationships, or entertainment. 
            Includes casual conversation, cultural exploration, and creative pursuits.
          </p>
          <div style={{
            marginTop: '1rem',
            fontSize: '0.8rem',
            color: 'var(--medium-grey)',
            fontStyle: 'italic'
          }}>
            Examples: Travel communication, entertainment, dating, hobbies, cultural interest
          </div>
        </div>
      </div>

      {useType && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--muted)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '2rem'
        }}>
          <h4 style={{
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 0.5rem 0'
          }}>
            You selected: {useType === 'professional' ? 'Professional' : 'Personal'} Use
          </h4>
          <p style={{
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '0.9rem',
            margin: 0
          }}>
            We'll now collect detailed context to create {useType === 'professional' ? 'business-relevant' : 'personally meaningful'} learning content for you.
          </p>
        </div>
      )}
    </div>
  );

  const renderContextDetails = () => (
    <div className="context-details">
      <div className="step-header" style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)'
      }}>
        <h2 style={{
          color: 'var(--harvard-crimson)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)',
          margin: '0 0 0.5rem 0'
        }}>
          {useType === 'professional' ? 'Professional Context' : 'Personal Context'}
        </h2>
        <p style={{
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: 0,
          fontSize: '1rem'
        }}>
          The more specific you are, the better we can tailor your learning experience
        </p>
      </div>

      {useType === 'professional' ? (
        <div className="professional-context" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Industry */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Industry/Field
            </label>
            <select
              value={professionalContext.industry}
              onChange={(e) => setProfessionalContext(prev => ({ ...prev, industry: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: '1rem'
              }}
            >
              <option value="">Select your industry</option>
              {industryOptions.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Role/Position
            </label>
            <input
              type="text"
              value={professionalContext.role}
              onChange={(e) => setProfessionalContext(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Software Developer, Marketing Manager, Sales Representative"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Specific Situation */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Specific Professional Situation *
            </label>
            <textarea
              value={professionalContext.specificSituation}
              onChange={(e) => setProfessionalContext(prev => ({ ...prev, specificSituation: e.target.value }))}
              placeholder="Describe your specific work situation where you'll use this language. Be as detailed as possible - this directly impacts how we create your lessons."
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

          {/* Business Need */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Business Need *
            </label>
            <textarea
              value={professionalContext.businessNeed}
              onChange={(e) => setProfessionalContext(prev => ({ ...prev, businessNeed: e.target.value }))}
              placeholder="Why does your business/career require this language? What problem will it solve or opportunity will it create?"
              rows={2}
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

          {/* Urgency Level */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Urgency Level *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {urgencyLevels.map(level => (
                <label key={level.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  border: `2px solid ${professionalContext.urgencyLevel === level.value ? level.color : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: professionalContext.urgencyLevel === level.value ? `${level.color}15` : 'var(--card)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="urgency"
                    value={level.value}
                    checked={professionalContext.urgencyLevel === level.value}
                    onChange={(e) => setProfessionalContext(prev => ({ ...prev, urgencyLevel: e.target.value }))}
                    style={{ marginRight: '0.5rem', accentColor: level.color }}
                  />
                  <span style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    color: 'var(--dark-charcoal-grey)'
                  }}>
                    {level.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="personal-context" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Inspiration */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              What inspired you to learn {targetLanguage?.language || 'this language'}? *
            </label>
            <textarea
              value={personalContext.inspiration}
              onChange={(e) => setPersonalContext(prev => ({ ...prev, inspiration: e.target.value }))}
              placeholder="Tell us your story - what sparked your interest? A movie, book, person, travel experience, cultural fascination? The more personal and specific, the better we can customize your learning."
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

          {/* Personal Interest Category */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Primary Interest Category
            </label>
            <select
              value={personalContext.personalInterest}
              onChange={(e) => setPersonalContext(prev => ({ ...prev, personalInterest: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: '1rem'
              }}
            >
              <option value="">Select your main interest</option>
              {personalInterestOptions.map(interest => (
                <option key={interest} value={interest}>{interest}</option>
              ))}
            </select>
          </div>

          {/* Travel Plans */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Travel Plans (Optional)
            </label>
            <input
              type="text"
              value={personalContext.travelPlans}
              onChange={(e) => setPersonalContext(prev => ({ ...prev, travelPlans: e.target.value }))}
              placeholder="Any specific countries or regions you plan to visit?"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Cultural Interest */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--dark-charcoal-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Cultural Interest Details (Optional)
            </label>
            <textarea
              value={personalContext.culturalInterest}
              onChange={(e) => setPersonalContext(prev => ({ ...prev, culturalInterest: e.target.value }))}
              placeholder="Any specific cultural aspects that fascinate you? Music, food, traditions, literature, movies, etc."
              rows={2}
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
        </div>
      )}
    </div>
  );

  const renderPriorityScale = () => (
    <div className="priority-scale">
      <div className="step-header" style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)'
      }}>
        <h2 style={{
          color: 'var(--harvard-crimson)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)',
          margin: '0 0 0.5rem 0'
        }}>
          Priority & Practicality Scale
        </h2>
        <p style={{
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: 0,
          fontSize: '1rem'
        }}>
          Using MoSCoW methodology: Must have • Should have • Could have • Won't have
        </p>
      </div>

      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius-sm)'
      }}>
        <h4 style={{
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: '0 0 0.5rem 0'
        }}>
          How to use this scale:
        </h4>
        <ul style={{
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: '0.9rem',
          margin: 0,
          paddingLeft: '1.5rem'
        }}>
          <li><strong>Must Have:</strong> Critical abilities you need immediately (max 4)</li>
          <li><strong>Should Have:</strong> Important but not critical</li>
          <li><strong>Could Have:</strong> Nice to have if time permits</li>
          <li><strong>Won't Have:</strong> Not needed for your specific goals</li>
        </ul>
      </div>

      <div className="moscow-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Priority columns */}
        <div style={{
          padding: '1rem',
          border: '2px solid var(--destructive)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(165, 28, 48, 0.05)'
        }}>
          <h4 style={{
            color: 'var(--destructive)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 1rem 0',
            textAlign: 'center'
          }}>
            Must Have ({priorityScale.mustHave.length}/4)
          </h4>
          <div style={{ minHeight: '100px' }}>
            {priorityScale.mustHave.map(item => (
              <div key={item} style={{
                padding: '0.5rem',
                margin: '0.25rem 0',
                backgroundColor: 'var(--destructive)',
                color: 'var(--warm-white)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }} onClick={() => assignPriority(item, 'shouldHave')}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          border: '2px solid var(--harvard-crimson)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(165, 28, 48, 0.03)'
        }}>
          <h4 style={{
            color: 'var(--harvard-crimson)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 1rem 0',
            textAlign: 'center'
          }}>
            Should Have ({priorityScale.shouldHave.length})
          </h4>
          <div style={{ minHeight: '100px' }}>
            {priorityScale.shouldHave.map(item => (
              <div key={item} style={{
                padding: '0.5rem',
                margin: '0.25rem 0',
                backgroundColor: 'var(--harvard-crimson)',
                color: 'var(--warm-white)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }} onClick={() => assignPriority(item, 'couldHave')}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          border: '2px solid var(--oxford-blue)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(0, 62, 126, 0.05)'
        }}>
          <h4 style={{
            color: 'var(--oxford-blue)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 1rem 0',
            textAlign: 'center'
          }}>
            Could Have ({priorityScale.couldHave.length})
          </h4>
          <div style={{ minHeight: '100px' }}>
            {priorityScale.couldHave.map(item => (
              <div key={item} style={{
                padding: '0.5rem',
                margin: '0.25rem 0',
                backgroundColor: 'var(--oxford-blue)',
                color: 'var(--warm-white)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }} onClick={() => assignPriority(item, 'wontHave')}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          border: '2px solid var(--medium-grey)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(128, 128, 128, 0.05)'
        }}>
          <h4 style={{
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 1rem 0',
            textAlign: 'center'
          }}>
            Won't Have ({priorityScale.wontHave.length})
          </h4>
          <div style={{ minHeight: '100px' }}>
            {priorityScale.wontHave.map(item => (
              <div key={item} style={{
                padding: '0.5rem',
                margin: '0.25rem 0',
                backgroundColor: 'var(--medium-grey)',
                color: 'var(--warm-white)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }} onClick={() => assignPriority(item, 'mustHave')}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Available items to prioritize */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-sm)',
        border: '2px solid var(--border)'
      }}>
        <h4 style={{
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: '0 0 1rem 0'
        }}>
          Click items to assign priority:
        </h4>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {moscowItems[useType].map(item => {
            const priority = getPriorityForItem(item);
            return (
              <div
                key={item}
                onClick={() => assignPriority(item, priority ? 'mustHave' : 'mustHave')}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${priority ? 'transparent' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: priority ? 'var(--muted)' : 'var(--warm-white)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontFamily: '"Times New Roman", Times, serif',
                  color: priority ? 'var(--medium-grey)' : 'var(--dark-charcoal-grey)',
                  textDecoration: priority ? 'line-through' : 'none'
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTimeConstraints = () => (
    <div className="time-constraints">
      <div className="step-header" style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)'
      }}>
        <h2 style={{
          color: 'var(--harvard-crimson)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)',
          margin: '0 0 0.5rem 0'
        }}>
          Time & Schedule Preferences
        </h2>
        <p style={{
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: 0,
          fontSize: '1rem'
        }}>
          Help us optimize your learning pace and content delivery
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Available Time */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            How much time can you dedicate to learning per week?
          </label>
          <select
            value={timeConstraints.availableTime}
            onChange={(e) => setTimeConstraints(prev => ({ ...prev, availableTime: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '1rem'
            }}
          >
            <option value="">Select your available time</option>
            <option value="1-2 hours">1-2 hours per week</option>
            <option value="3-5 hours">3-5 hours per week</option>
            <option value="6-10 hours">6-10 hours per week</option>
            <option value="10+ hours">10+ hours per week</option>
            <option value="intensive">Intensive (20+ hours/week)</option>
          </select>
        </div>

        {/* Deadline */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            Do you have a specific deadline or target date?
          </label>
          <input
            type="date"
            value={timeConstraints.deadline}
            onChange={(e) => setTimeConstraints(prev => ({ ...prev, deadline: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Learning Urgency */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            Learning Urgency
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { value: 'relaxed', label: 'Relaxed - I have plenty of time to learn', icon: '🌱' },
              { value: 'moderate', label: 'Moderate - Steady progress is fine', icon: '📈' },
              { value: 'focused', label: 'Focused - I want to progress quickly', icon: '🎯' },
              { value: 'urgent', label: 'Urgent - I need results as soon as possible', icon: '⚡' }
            ].map(option => (
              <label key={option.value} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                border: `2px solid ${timeConstraints.urgency === option.value ? 'var(--harvard-crimson)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: timeConstraints.urgency === option.value ? 'rgba(165, 28, 48, 0.05)' : 'var(--card)',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="urgency"
                  value={option.value}
                  checked={timeConstraints.urgency === option.value}
                  onChange={(e) => setTimeConstraints(prev => ({ ...prev, urgency: e.target.value }))}
                  style={{ marginRight: '0.5rem', accentColor: 'var(--harvard-crimson)' }}
                />
                <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>{option.icon}</span>
                <span style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  color: 'var(--dark-charcoal-grey)'
                }}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="review-step">
      <div className="step-header" style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)'
      }}>
        <h2 style={{
          color: 'var(--harvard-crimson)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)',
          margin: '0 0 0.5rem 0'
        }}>
          Review Your Contextual Use Profile
        </h2>
        <p style={{
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: 0,
          fontSize: '1rem'
        }}>
          This information will shape all your learning content
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Use Type Summary */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-sm)',
          border: '2px solid var(--border)'
        }}>
          <h3 style={{
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 1rem 0'
          }}>
            {useType === 'professional' ? '💼 Professional Use' : '❤️ Personal Use'}
          </h3>
          {useType === 'professional' ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
              <div><strong>Industry:</strong> {professionalContext.industry}</div>
              <div><strong>Role:</strong> {professionalContext.role}</div>
              <div><strong>Situation:</strong> {professionalContext.specificSituation}</div>
              <div><strong>Business Need:</strong> {professionalContext.businessNeed}</div>
              <div><strong>Urgency:</strong> {professionalContext.urgencyLevel}</div>
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
              <div><strong>Inspiration:</strong> {personalContext.inspiration}</div>
              <div><strong>Interest:</strong> {personalContext.personalInterest}</div>
              {personalContext.travelPlans && <div><strong>Travel:</strong> {personalContext.travelPlans}</div>}
              {personalContext.culturalInterest && <div><strong>Cultural Interest:</strong> {personalContext.culturalInterest}</div>}
            </div>
          )}
        </div>

        {/* Priority Summary */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-sm)',
          border: '2px solid var(--border)'
        }}>
          <h3 style={{
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 1rem 0'
          }}>
            🎯 Priority Scale (MoSCoW)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--destructive)' }}>Must Have ({priorityScale.mustHave.length}):</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem', fontSize: '0.8rem' }}>
                {priorityScale.mustHave.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <strong style={{ color: 'var(--harvard-crimson)' }}>Should Have ({priorityScale.shouldHave.length}):</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem', fontSize: '0.8rem' }}>
                {priorityScale.shouldHave.slice(0, 3).map(item => <li key={item}>{item}</li>)}
                {priorityScale.shouldHave.length > 3 && <li>...and {priorityScale.shouldHave.length - 3} more</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Time Constraints */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-sm)',
          border: '2px solid var(--border)'
        }}>
          <h3 style={{
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            margin: '0 0 1rem 0'
          }}>
            ⏱️ Time & Schedule
          </h3>
          <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
            <div><strong>Available Time:</strong> {timeConstraints.availableTime || 'Not specified'}</div>
            <div><strong>Deadline:</strong> {timeConstraints.deadline || 'No specific deadline'}</div>
            <div><strong>Urgency:</strong> {timeConstraints.urgency}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--cream-background)',
      padding: '2rem',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {['use_type_selection', 'context_details', 'priority_scale', 'time_constraints', 'review'].map((stepName, index) => (
              <React.Fragment key={stepName}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 
                    step === stepName ? 'var(--harvard-crimson)' :
                    ['use_type_selection', 'context_details', 'priority_scale', 'time_constraints', 'review'].indexOf(step) > index ? 'var(--dartmouth-green)' :
                    'var(--border)',
                  color: 'var(--warm-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {['use_type_selection', 'context_details', 'priority_scale', 'time_constraints', 'review'].indexOf(step) > index ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <span style={{ fontSize: '0.9rem' }}>{index + 1}</span>
                  )}
                </div>
                {index < 4 && (
                  <div style={{
                    width: '60px',
                    height: '2px',
                    backgroundColor: ['use_type_selection', 'context_details', 'priority_scale', 'time_constraints', 'review'].indexOf(step) > index + 1 ? 'var(--dartmouth-green)' : 'var(--border)'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          {step === 'use_type_selection' && renderUseTypeSelection()}
          {step === 'context_details' && renderContextDetails()}
          {step === 'priority_scale' && renderPriorityScale()}
          {step === 'time_constraints' && renderTimeConstraints()}
          {step === 'review' && renderReview()}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'rgba(165, 28, 48, 0.1)',
            border: '2px solid var(--harvard-crimson)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem',
              color: 'var(--harvard-crimson)'
            }}>
              <AlertCircle size={20} style={{ marginRight: '0.5rem' }} />
              <h4 style={{ margin: 0, fontFamily: '"Times New Roman", Times, serif' }}>
                Please address the following:
              </h4>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {validationErrors.map((error, index) => (
                <li key={index} style={{
                  color: 'var(--harvard-crimson)',
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '3rem'
        }}>
          <button
            onClick={prevStep}
            disabled={step === 'use_type_selection'}
            style={{
              padding: '1rem 2rem',
              backgroundColor: step === 'use_type_selection' ? 'var(--muted)' : 'var(--medium-grey)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '1rem',
              cursor: step === 'use_type_selection' ? 'not-allowed' : 'pointer',
              opacity: step === 'use_type_selection' ? 0.5 : 1
            }}
          >
            ← Previous
          </button>

          <button
            onClick={nextStep}
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'var(--harvard-crimson)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '1rem',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer'
            }}
          >
            {step === 'review' ? 'Complete Setup →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextualUseCollector;