// LanguageSelector.jsx - Simplified Language Selection Component
// Reads from profile and accepts user input for any target language

import React, { useState, useEffect } from 'react';

const LanguageSelector = ({
  userProfile,
  onLanguageConfirmed,
  onTargetLanguageSelected,
  onUpdateProfile,
  currentStep = 'confirm-native'
}) => {
  // Component State
  const [step, setStep] = useState(currentStep);
  const [confirmedNativeLanguages, setConfirmedNativeLanguages] = useState([]);
  const [targetLanguageInput, setTargetLanguageInput] = useState('');
  const [targetLanguageReason, setTargetLanguageReason] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [showSpecialtyNotice, setShowSpecialtyNotice] = useState(false);

  // Initialize from user profile
  useEffect(() => {
    if (userProfile) {
      const profileNative = userProfile.nativeLanguages || [];
      setConfirmedNativeLanguages([...profileNative]);
    }
  }, [userProfile]);

  // Validation Functions
  const validateNativeLanguages = () => {
    const errors = [];
    
    if (confirmedNativeLanguages.length === 0) {
      errors.push('Please enter at least one native language');
    }
    
    if (confirmedNativeLanguages.length > 3) {
      errors.push('Maximum 3 native languages supported for optimal learning');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validateTargetLanguage = () => {
    const errors = [];
    
    if (!targetLanguageInput.trim()) {
      errors.push('Please enter the language you want to learn');
    }
    
    // Check if target language is different from native languages
    const isAlreadyKnown = confirmedNativeLanguages.some(lang => 
      lang.toLowerCase().includes(targetLanguageInput.toLowerCase()) ||
      targetLanguageInput.toLowerCase().includes(lang.toLowerCase())
    );
    
    if (isAlreadyKnown) {
      errors.push('Target language should be different from your native languages');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Check if Spanish specialty notice should show
  const checkSpecialtyNotice = (language) => {
    const isSpanish = language.toLowerCase().includes('spanish') || 
                     language.toLowerCase().includes('español') ||
                     language.toLowerCase().includes('castellano');
    setShowSpecialtyNotice(!isSpanish && language.trim().length > 0);
  };

  // Native Language Management
  const addNativeLanguage = () => {
    if (confirmedNativeLanguages.length < 3) {
      setConfirmedNativeLanguages(prev => [...prev, '']);
    }
  };

  const updateNativeLanguage = (index, value) => {
    setConfirmedNativeLanguages(prev => 
      prev.map((lang, i) => i === index ? value : lang)
    );
  };

  const removeNativeLanguage = (index) => {
    setConfirmedNativeLanguages(prev => 
      prev.filter((_, i) => i !== index)
    );
  };

  const handleConfirmNativeLanguages = () => {
    // Filter out empty languages
    const filteredLanguages = confirmedNativeLanguages.filter(lang => lang.trim());
    setConfirmedNativeLanguages(filteredLanguages);
    
    if (validateNativeLanguages()) {
      const updatedProfile = {
        ...userProfile,
        nativeLanguages: filteredLanguages
      };
      
      if (onUpdateProfile) {
        onUpdateProfile(updatedProfile);
      }
      
      if (onLanguageConfirmed) {
        onLanguageConfirmed(filteredLanguages);
      }
      
      setStep('select-target');
    }
  };

  // Target Language Selection
  const handleTargetLanguageChange = (value) => {
    setTargetLanguageInput(value);
    checkSpecialtyNotice(value);
  };

  const handleConfirmTargetLanguage = () => {
    if (validateTargetLanguage()) {
      const targetLanguage = {
        language: targetLanguageInput.trim(),
        reason: targetLanguageReason.trim(),
        isSpanishSpecialty: targetLanguageInput.toLowerCase().includes('spanish') ||
                           targetLanguageInput.toLowerCase().includes('español'),
        timestamp: new Date().toISOString()
      };
      
      if (onTargetLanguageSelected) {
        onTargetLanguageSelected(targetLanguage);
      }
    }
  };

  // Render Native Language Confirmation Step
  const renderNativeLanguageConfirmation = () => (
    <div className="language-confirmation-step">
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
          Confirm Your Native Languages
        </h2>
        <p style={{
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: 0,
          fontSize: '1rem'
        }}>
          Please confirm your native/mother tongue languages (maximum 3)
        </p>
      </div>

      {/* Current Profile Display */}
      {userProfile && (
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
            From Your Profile:
          </h4>
          <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
            <div>Nationality: {userProfile.nationality || 'Not specified'}</div>
            <div>Current Native Languages: {userProfile.nativeLanguages?.length || 0}/3</div>
            <div>Additional Languages: {userProfile.additionalLanguages?.length || 0}</div>
          </div>
        </div>
      )}

      {/* Native Language Inputs */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: '0 0 1rem 0'
        }}>
          Your Native Languages:
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {confirmedNativeLanguages.map((language, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={language}
                onChange={(e) => updateNativeLanguage(index, e.target.value)}
                placeholder={`Native language ${index + 1} (e.g., English, 中文, Bahasa Melayu)`}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '1rem'
                }}
              />
              {confirmedNativeLanguages.length > 1 && (
                <button
                  onClick={() => removeNativeLanguage(index)}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--harvard-crimson)',
                    color: 'var(--warm-white)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        
        {confirmedNativeLanguages.length < 3 && (
          <button
            onClick={addNativeLanguage}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--dartmouth-green)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif',
              cursor: 'pointer'
            }}
          >
            + Add Another Native Language
          </button>
        )}
      </div>

      {/* Helper Text */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius-sm)'
      }}>
        <p style={{
          margin: 0,
          fontSize: '0.9rem',
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <strong>Note:</strong> Include any language you're fully comfortable with since childhood. 
          Regional variations (like Malaysian Chinese vs Mainland Chinese) will be handled 
          automatically by our AI when preparing your lessons.
        </p>
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
          <h4 style={{
            margin: '0 0 0.5rem 0',
            color: 'var(--harvard-crimson)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Please address the following:
          </h4>
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

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleConfirmNativeLanguages}
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
          Confirm Native Languages →
        </button>
      </div>
    </div>
  );

  // Render Target Language Selection Step
  const renderTargetLanguageSelection = () => (
    <div className="target-language-step">
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
          Choose Your Target Language
        </h2>
        <p style={{
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: 0,
          fontSize: '1rem'
        }}>
          Tell us which language you want to learn
        </p>
      </div>

      {/* Native Languages Summary */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius-sm)'
      }}>
        <h4 style={{
          margin: '0 0 0.5rem 0',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          Your Native Languages:
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {confirmedNativeLanguages.filter(lang => lang.trim()).map((lang, index) => (
            <span key={index} style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--dartmouth-green)',
              color: 'var(--warm-white)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Target Language Input */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.75rem',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)',
          fontSize: '1.1rem'
        }}>
          What language do you want to learn?
        </label>
        
        <input
          type="text"
          value={targetLanguageInput}
          onChange={(e) => handleTargetLanguageChange(e.target.value)}
          placeholder="e.g., Spanish, Italiano, Français, 한국어, 日本語, Português..."
          style={{
            width: '100%',
            padding: '1rem',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '1.1rem',
            marginBottom: '1rem'
          }}
        />
        
        <p style={{
          margin: 0,
          fontSize: '0.9rem',
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          Enter in any language or script. Our AI supports all languages.
        </p>
      </div>

      {/* Language Specialty Notice */}
      {showSpecialtyNotice && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--oxford-blue)',
          color: 'var(--warm-white)',
          borderRadius: 'var(--radius)',
          border: '2px solid var(--oxford-blue)'
        }}>
          <h4 style={{
            margin: '0 0 1rem 0',
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            Language Specialty Notice
          </h4>
          <p style={{
            margin: '0 0 1rem 0',
            fontSize: '0.95rem',
            fontFamily: '"Times New Roman", Times, serif',
            lineHeight: '1.5'
          }}>
            <strong>Our specialty is Spanish</strong> with deep cultural context and regional variations. 
            For other languages, we'll provide excellent learning content but with more surface-level 
            cultural context as our AI researches from available internet sources.
          </p>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            fontFamily: '"Times New Roman", Times, serif',
            opacity: 0.9
          }}>
            You can still learn any language effectively - just expect varying levels of cultural depth.
          </p>
        </div>
      )}

      {/* Optional: Why are you learning this language? */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.75rem',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)',
          fontSize: '1.1rem'
        }}>
          Why do you want to learn this language? (Optional)
        </label>
        
        <textarea
          value={targetLanguageReason}
          onChange={(e) => setTargetLanguageReason(e.target.value)}
          placeholder="e.g., For business in Latin America, crush on an Italian comic character, travel to Korea, academic research..."
          rows={3}
          style={{
            width: '100%',
            padding: '1rem',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
        
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '0.9rem',
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          The more specific you are, the better we can tailor your learning content and context.
        </p>
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
          <h4 style={{
            margin: '0 0 0.5rem 0',
            color: 'var(--harvard-crimson)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Please address the following:
          </h4>
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

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={() => setStep('confirm-native')}
          style={{
            padding: '1rem 2rem',
            backgroundColor: 'var(--medium-grey)',
            color: 'var(--warm-white)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          ← Back to Native Languages
        </button>
        
        <button
          onClick={handleConfirmTargetLanguage}
          disabled={!targetLanguageInput.trim()}
          style={{
            padding: '1rem 2rem',
            backgroundColor: !targetLanguageInput.trim() ? 'var(--medium-grey)' : 'var(--harvard-crimson)',
            color: 'var(--warm-white)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '1rem',
            fontWeight: 'var(--font-weight-medium)',
            cursor: !targetLanguageInput.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          Confirm Target Language →
        </button>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="pacific-language-selector" style={{
      minHeight: '100vh',
      backgroundColor: 'var(--cream-background)',
      padding: '2rem',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--harvard-crimson)',
              color: 'var(--warm-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              1
            </div>
            <div style={{
              width: '60px',
              height: '2px',
              backgroundColor: step === 'select-target' ? 'var(--harvard-crimson)' : 'var(--border)'
            }}></div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: step === 'select-target' ? 'var(--harvard-crimson)' : 'var(--border)',
              color: 'var(--warm-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              2
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 'confirm-native' ? renderNativeLanguageConfirmation() : renderTargetLanguageSelection()}
      </div>
    </div>
  );
};

export default LanguageSelector;