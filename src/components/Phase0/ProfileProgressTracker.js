import React, { useState, useEffect } from 'react';
import { User, TrendingUp, RotateCcw, Award, Calendar, Globe2 } from 'lucide-react';

const ProfileProgressTracker = ({ 
  initialProfile = null, 
  onProfileComplete,
  apiEndpoint = null,
  isLocalDevelopment = true 
}) => {
  const [userProfile, setUserProfile] = useState({
    nationality: '',
    nativeLanguages: [], // Matches LanguageSelector structure
    additionalLanguages: [],
    proficiencyLevels: {},
    learningHistory: [],
    progressData: {
      vocabulary: 0,
      grammar: 0,
      listening: 0,
      speaking: 0,
      reading: 0,
      writing: 0
    },
    lastActivity: null,
    createdAt: null
  });

  const [availableLanguages, setAvailableLanguages] = useState({
    native: [],
    additional: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showProgressPolygon, setShowProgressPolygon] = useState(false);
  const [retestAvailable, setRetestAvailable] = useState(false);

  // Initialize profile from props or load from API
  useEffect(() => {
    if (initialProfile) {
      setUserProfile(prevProfile => ({
        ...prevProfile,
        ...initialProfile
      }));
    } else if (!isLocalDevelopment && apiEndpoint) {
      loadUserProfile();
    }
    
    loadAvailableLanguages();
  }, [initialProfile, apiEndpoint, isLocalDevelopment]);

  const loadUserProfile = async () => {
    if (!apiEndpoint) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${apiEndpoint}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(prevProfile => ({
          ...prevProfile,
          ...profileData
        }));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableLanguages = async () => {
    if (isLocalDevelopment) {
      setAvailableLanguages({
        native: [
          'Standard Malay', 'English', 'Standard Simplified Chinese',
          'Tamil', 'Cantonese', 'Mandarin', 'Arabic', 'Indonesian'
        ],
        additional: [
          'Tamil', 'Cantonese', 'Hokkien', 'Mandarin', 'Arabic', 
          'Thai', 'Indonesian', 'Spanish', 'French', 'German',
          'Japanese', 'Korean', 'Portuguese', 'Italian', 'Russian'
        ]
      });
      return;
    }

    try {
      const response = await fetch(`${apiEndpoint}/supported-languages`);
      if (response.ok) {
        const languages = await response.json();
        setAvailableLanguages(languages);
      }
    } catch (error) {
      console.error('Failed to load supported languages:', error);
      setAvailableLanguages({
        native: ['Standard Malay', 'English', 'Standard Simplified Chinese'],
        additional: ['Tamil', 'Cantonese', 'Hokkien', 'Mandarin', 'Arabic', 'Thai', 'Indonesian']
      });
    }
  };

  const calculatePolygonPoints = (data) => {
    const center = 100;
    const radius = 80;
    const angles = [0, 60, 120, 180, 240, 300];
    
    return Object.values(data).map((value, index) => {
      const angle = (angles[index] * Math.PI) / 180;
      const distance = (value / 100) * radius;
      const x = center + distance * Math.cos(angle - Math.PI / 2);
      const y = center + distance * Math.sin(angle - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  };

  useEffect(() => {
    const lastActivity = userProfile.lastActivity;
    if (lastActivity) {
      const daysSince = (Date.now() - new Date(lastActivity)) / (1000 * 60 * 60 * 24);
      setRetestAvailable(daysSince > 7);
    }
  }, [userProfile.lastActivity]);

  const handleNativeLanguageChange = (languages) => {
    const updatedProficiencyLevels = { ...userProfile.proficiencyLevels };
    languages.forEach(lang => {
      updatedProficiencyLevels[lang] = 'native';
    });

    setUserProfile(prev => ({
      ...prev,
      nativeLanguages: languages,
      proficiencyLevels: updatedProficiencyLevels
    }));
  };

  const handleAdditionalLanguageToggle = (language) => {
    setUserProfile(prev => {
      const additionalLanguages = prev.additionalLanguages.includes(language)
        ? prev.additionalLanguages.filter(l => l !== language)
        : [...prev.additionalLanguages, language];
      
      return {
        ...prev,
        additionalLanguages
      };
    });
  };

  const updateProgressData = (attribute, value) => {
    setUserProfile(prev => ({
      ...prev,
      progressData: {
        ...prev.progressData,
        [attribute]: Math.max(0, Math.min(100, value))
      },
      lastActivity: new Date().toISOString()
    }));
  };

  const triggerRetest = () => {
    setUserProfile(prev => ({
      ...prev,
      progressData: {
        vocabulary: 0,
        grammar: 0,
        listening: 0,
        speaking: 0,
        reading: 0,
        writing: 0
      },
      learningHistory: [...prev.learningHistory, {
        type: 'retest',
        timestamp: new Date().toISOString(),
        reason: 'User initiated retest'
      }]
    }));
    setRetestAvailable(false);
  };

  const isProfileComplete = () => {
    return userProfile.nationality && userProfile.nativeLanguages.length > 0;
  };

  const saveProfile = async () => {
    const completeProfile = {
      ...userProfile,
      createdAt: userProfile.createdAt || new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    setIsLoading(true);
    
    try {
      if (!isLocalDevelopment && apiEndpoint) {
        const response = await fetch(`${apiEndpoint}/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completeProfile),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save profile');
        }
      }
      
      setUserProfile(completeProfile);
      
      if (onProfileComplete) {
        onProfileComplete(completeProfile);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem',
        textAlign: 'center',
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <div>Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1.5rem',
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      {/* Development Mode Notice */}
      {isLocalDevelopment && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius)',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid #ffc107',
          color: '#856404'
        }}>
          <strong>Development Mode:</strong> Running locally. Profile data will not persist without backend connection.
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '1rem' 
        }}>
          <User style={{ marginRight: '0.75rem', color: 'var(--harvard-crimson)' }} size={32} />
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 'var(--font-weight-medium)', 
            color: 'var(--foreground)',
            margin: 0
          }}>
            Profile & Progress Tracker
          </h1>
        </div>
        <p style={{ 
          fontSize: '1.125rem', 
          color: 'var(--medium-grey)',
          margin: 0
        }}>
          Track growth with attribute analyser polygon (Sense of Achievement + Motivation)
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
        gap: '2rem' 
      }}>
        {/* Profile Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ 
            backgroundColor: 'var(--card)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'var(--font-weight-medium)', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Globe2 style={{ marginRight: '0.5rem', color: 'var(--harvard-crimson)' }} size={20} />
              Language Profile
            </h2>
            
            {/* Nationality */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: '0.5rem',
                color: 'var(--dark-charcoal-grey)'
              }}>
                Nationality *
              </label>
              <input
                type="text"
                placeholder="e.g., Malaysian, Singaporean"
                value={userProfile.nationality}
                onChange={(e) => setUserProfile(prev => ({ ...prev, nationality: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--input-background)',
                  color: 'var(--dark-charcoal-grey)',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              />
              <p style={{
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                color: 'var(--medium-grey)',
                margin: '0.25rem 0 0 0'
              }}>
                Why nationality matters: Malaysian & Singaporean Chinese speak different Chinese variants than Mainland Chinese
              </p>
            </div>

            {/* Native Languages */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: '0.5rem',
                color: 'var(--dark-charcoal-grey)'
              }}>
                Native (Mother Tongue) Languages * (Max 3)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {availableLanguages.native.map(lang => (
                  <label key={lang} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.5rem',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--muted)'
                  }}>
                    <input
                      type="checkbox"
                      checked={userProfile.nativeLanguages.includes(lang)}
                      onChange={() => {
                        const currentNative = userProfile.nativeLanguages;
                        if (currentNative.includes(lang)) {
                          handleNativeLanguageChange(currentNative.filter(l => l !== lang));
                        } else if (currentNative.length < 3) {
                          handleNativeLanguageChange([...currentNative, lang]);
                        }
                      }}
                      disabled={!userProfile.nativeLanguages.includes(lang) && userProfile.nativeLanguages.length >= 3}
                      style={{ accentColor: 'var(--harvard-crimson)' }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>{lang}</span>
                  </label>
                ))}
              </div>
              <p style={{
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                color: 'var(--medium-grey)',
                margin: '0.25rem 0 0 0'
              }}>
                Selected: {userProfile.nativeLanguages.length}/3 native languages
              </p>
            </div>

            {/* Additional Languages */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: '0.5rem',
                color: 'var(--dark-charcoal-grey)'
              }}>
                Additional Languages (Non-native)
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '0.5rem',
                maxHeight: '12rem',
                overflowY: 'auto'
              }}>
                {availableLanguages.additional.map(lang => (
                  <label key={lang} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.5rem',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--muted)'
                  }}>
                    <input
                      type="checkbox"
                      checked={userProfile.additionalLanguages.includes(lang)}
                      onChange={() => handleAdditionalLanguageToggle(lang)}
                      disabled={userProfile.nativeLanguages.includes(lang)}
                      style={{ accentColor: 'var(--harvard-crimson)' }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>{lang}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Controls */}
          <div style={{ 
            backgroundColor: 'var(--card)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'var(--font-weight-medium)', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <TrendingUp style={{ marginRight: '0.5rem', color: 'var(--dartmouth-green)' }} size={18} />
              Progress Tracking
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(userProfile.progressData).map(([skill, value]) => (
                <div key={skill}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: '0.25rem',
                    textTransform: 'capitalize',
                    color: 'var(--dark-charcoal-grey)'
                  }}>
                    {skill}: {value}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => updateProgressData(skill, parseInt(e.target.value))}
                    style={{ 
                      width: '100%',
                      accentColor: 'var(--harvard-crimson)'
                    }}
                  />
                </div>
              ))}
            </div>

            {retestAvailable && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--accent)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--dark-charcoal-grey)',
                      margin: 0
                    }}>
                      Retest Available
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'var(--medium-grey)',
                      margin: 0
                    }}>
                      Haven't practiced in a while. Time for reassessment?
                    </p>
                  </div>
                  <button
                    onClick={triggerRetest}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--harvard-crimson)',
                      color: 'var(--warm-white)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <RotateCcw size={14} />
                    Retest
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowProgressPolygon(!showProgressPolygon)}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--dartmouth-green)',
                color: 'var(--warm-white)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              {showProgressPolygon ? 'Hide' : 'Show'} Progress Polygon
            </button>
          </div>
        </div>

        {/* Progress Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {showProgressPolygon && (
            <div style={{ 
              backgroundColor: 'var(--card)', 
              padding: '1.5rem', 
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'var(--font-weight-medium)', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Award style={{ marginRight: '0.5rem', color: 'var(--harvard-crimson)' }} size={18} />
                Attribute Analyzer Polygon
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <g stroke="var(--border)" strokeWidth="1" fill="none">
                    {[20, 40, 60, 80].map(radius => (
                      <polygon
                        key={radius}
                        points={calculatePolygonPoints({
                          vocabulary: radius * 1.25,
                          grammar: radius * 1.25,
                          listening: radius * 1.25,
                          speaking: radius * 1.25,
                          reading: radius * 1.25,
                          writing: radius * 1.25
                        })}
                        opacity="0.3"
                      />
                    ))}
                    {[0, 60, 120, 180, 240, 300].map(angle => {
                      const radian = (angle * Math.PI) / 180;
                      const x2 = 100 + 80 * Math.cos(radian - Math.PI / 2);
                      const y2 = 100 + 80 * Math.sin(radian - Math.PI / 2);
                      return (
                        <line
                          key={angle}
                          x1="100"
                          y1="100"
                          x2={x2}
                          y2={y2}
                          opacity="0.3"
                        />
                      );
                    })}
                  </g>
                  
                  <polygon
                    points={calculatePolygonPoints(userProfile.progressData)}
                    fill="var(--harvard-crimson)"
                    fillOpacity="0.3"
                    stroke="var(--harvard-crimson)"
                    strokeWidth="2"
                  />
                  
                  {Object.keys(userProfile.progressData).map((skill, index) => {
                    const angle = [0, 60, 120, 180, 240, 300][index];
                    const radian = (angle * Math.PI) / 180;
                    const x = 100 + 95 * Math.cos(radian - Math.PI / 2);
                    const y = 100 + 95 * Math.sin(radian - Math.PI / 2);
                    return (
                      <text
                        key={skill}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        fontSize="12"
                        fill="var(--dark-charcoal-grey)"
                        style={{ textTransform: 'capitalize' }}
                      >
                        {skill}
                      </text>
                    );
                  })}
                </svg>
              </div>
              
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--medium-grey)',
                  margin: 0
                }}>
                  Overall Progress: {Math.round(Object.values(userProfile.progressData).reduce((a, b) => a + b, 0) / 6)}%
                </p>
              </div>
            </div>
          )}

          <div style={{ 
            backgroundColor: 'var(--card)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'var(--font-weight-medium)', 
              marginBottom: '1rem'
            }}>Profile Status</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Profile Complete:</span>
                <span style={{ color: isProfileComplete() ? 'var(--dartmouth-green)' : 'var(--destructive)' }}>
                  {isProfileComplete() ? 'Yes' : 'No'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Native Languages:</span>
                <span>{userProfile.nativeLanguages.length}/3</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Additional Languages:</span>
                <span>{userProfile.additionalLanguages.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Environment:</span>
                <span>{isLocalDevelopment ? 'Local Dev' : 'Production'}</span>
              </div>
            </div>

            {isProfileComplete() && (
              <button
                onClick={saveProfile}
                disabled={isLoading}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  fontWeight: 'var(--font-weight-medium)',
                  backgroundColor: isLoading ? 'var(--medium-grey)' : 'var(--harvard-crimson)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                {isLoading ? 'Saving...' : 'Save Profile & Continue to Placement Test'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileProgressTracker;