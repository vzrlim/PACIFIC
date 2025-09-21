// PlacementTest.jsx - Comprehensive CEFR-Based Placement Testing System
// Implements official standards-based ONE-TIME placement tests and AI-generated improvement assessments

import React, { useState, useEffect } from 'react';
import { 
  OFFICIAL_PLACEMENT_TESTS, 
  CEFR_LEVELS,
  calculateCEFRLevel,
  generateImprovementTest,
  calculateImprovement 
} from './CEFRStandards.js';

const PlacementTest = ({ 
  userProfile, 
  onTestComplete, 
  testType = 'placement', // 'placement' or 'improvement'
  language = 'english',
  currentLevel = 'A1'
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [results, setResults] = useState(null);
  const [hasOfficialTest, setHasOfficialTest] = useState(false);

  // Initialize test data
  useEffect(() => {
    const initializeTest = () => {
      try {
        setLoading(true);
        
        // Check if user has already taken official placement test
        const existingTests = JSON.parse(localStorage.getItem('pacific_placement_tests') || '{}');
        const languageKey = `${language}_official`;
        const hasExistingTest = existingTests[languageKey];
        
        setHasOfficialTest(hasExistingTest);

        let questions;
        if (testType === 'placement' && !hasExistingTest) {
          // Official ONE-TIME placement test
          questions = OFFICIAL_PLACEMENT_TESTS[language]?.questions || [];
          if (questions.length === 0) {
            throw new Error(`Official placement test not available for ${language}`);
          }
          
          // Set timer based on question count (2 minutes per question)
          setTimeRemaining(questions.length * 120);
          
          setTestData({
            type: 'official_placement',
            questions: questions,
            metadata: OFFICIAL_PLACEMENT_TESTS[language].metadata,
            language,
            startTime: new Date().toISOString()
          });

        } else if (testType === 'improvement' || hasExistingTest) {
          // AI-generated improvement test (retakeable)
          const improvementTestData = generateImprovementTest(currentLevel, language);
          
          // Set timer: 90 seconds per question for improvement tests
          setTimeRemaining(improvementTestData.questions.length * 90);
          
          setTestData({
            ...improvementTestData,
            type: 'improvement_assessment',
            startTime: new Date().toISOString()
          });
        }

        setAnswers([]);
        setCurrentQuestion(0);
        setLoading(false);
        
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initializeTest();
  }, [testType, language, currentLevel]);

  // Timer countdown
  useEffect(() => {
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && testStarted) {
      handleTestComplete();
    }
  }, [timeRemaining, testStarted, testCompleted]);

  const startTest = () => {
    if (!testData || !testData.questions || testData.questions.length === 0) {
      setError('No test questions available');
      return;
    }
    setTestStarted(true);
    setShowInstructions(false);
  };

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    // Auto-advance to next question after short delay
    setTimeout(() => {
      if (currentQuestion < testData.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleTestComplete();
      }
    }, 500);
  };

  const handleTestComplete = () => {
    if (!testData || testCompleted) return;

    setTestCompleted(true);
    setLoading(true);

    try {
      let testResults;
      
      if (testData.type === 'official_placement') {
        // Calculate CEFR level using official methodology
        testResults = calculateCEFRLevel(answers, language);
        
        // Save to localStorage (ONE-TIME only)
        const existingTests = JSON.parse(localStorage.getItem('pacific_placement_tests') || '{}');
        const languageKey = `${language}_official`;
        existingTests[languageKey] = {
          ...testResults,
          completedAt: new Date().toISOString(),
          testData: {
            type: testData.type,
            questionsCount: testData.questions.length,
            metadata: testData.metadata
          }
        };
        localStorage.setItem('pacific_placement_tests', JSON.stringify(existingTests));
        
      } else {
        // Calculate improvement
        testResults = calculateImprovement(answers, testData, currentLevel);
        
        // Save improvement test results
        const improvementHistory = JSON.parse(localStorage.getItem('pacific_improvement_history') || '[]');
        improvementHistory.push({
          ...testResults,
          completedAt: new Date().toISOString(),
          testData: {
            type: testData.type,
            questionsCount: testData.questions.length,
            basedOnLevel: currentLevel
          }
        });
        localStorage.setItem('pacific_improvement_history', JSON.stringify(improvementHistory));
      }

      setResults(testResults);
      setLoading(false);
      
      // Notify parent component
      if (onTestComplete) {
        onTestComplete(testResults, testData.type);
      }
      
    } catch (err) {
      setError('Error calculating test results: ' + err.message);
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLanguageDisplayName = (lang) => {
    const names = {
      english: 'English',
      chinese: '中文 (Chinese)',
      spanish: 'Español (Spanish)', 
      malay: 'Bahasa Melayu (Malay)'
    };
    return names[lang] || lang;
  };

  if (loading) {
    return (
      <div className="pacific-test-container">
        <div className="pacific-loading-state">
          <div className="pacific-spinner"></div>
          <h3 style={{ color: 'var(--dark-charcoal-grey)' }}>
            {testData?.type === 'official_placement' ? 'Preparing Official Placement Test...' : 'Generating Improvement Assessment...'}
          </h3>
          <p style={{ color: 'var(--medium-grey)' }}>
            Loading {getLanguageDisplayName(language)} {testData?.type === 'official_placement' ? 'CEFR' : 'Adaptive'} Assessment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pacific-test-container">
        <div className="pacific-error-state">
          <h3 style={{ color: 'var(--harvard-crimson)' }}>Assessment Error</h3>
          <p style={{ color: 'var(--medium-grey)' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="pacific-button-primary"
          >
            Retry Assessment
          </button>
        </div>
      </div>
    );
  }

  if (testType === 'placement' && hasOfficialTest) {
    return (
      <div className="pacific-test-container">
        <div className="pacific-test-completed-notice">
          <h3 style={{ color: 'var(--dark-charcoal-grey)' }}>
            Official {getLanguageDisplayName(language)} Placement Test Already Completed
          </h3>
          <p style={{ color: 'var(--medium-grey)' }}>
            You have already taken the official CEFR placement test for {getLanguageDisplayName(language)}. 
            This test can only be taken once to ensure assessment integrity.
          </p>
          <div className="pacific-test-alternatives">
            <button 
              onClick={() => onTestComplete?.(null, 'already_completed')}
              className="pacific-button-secondary"
            >
              View Previous Results
            </button>
            <button 
              onClick={() => {
                // Switch to improvement test
                setTestStarted(false);
                setShowInstructions(true);
                // Re-initialize as improvement test
                const improvementTestData = generateImprovementTest(currentLevel, language);
                setTestData({
                  ...improvementTestData,
                  type: 'improvement_assessment',
                  startTime: new Date().toISOString()
                });
                setTimeRemaining(improvementTestData.questions.length * 90);
              }}
              className="pacific-button-primary"
            >
              Take Improvement Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted && results) {
    return (
      <div className="pacific-test-container">
        <div className="pacific-test-results">
          <h2 style={{ color: 'var(--harvard-crimson)' }}>
            {testData.type === 'official_placement' ? 'Official CEFR Assessment Results' : 'Improvement Assessment Results'}
          </h2>
          
          {testData.type === 'official_placement' ? (
            <div className="pacific-placement-results">
              <div className="pacific-level-badge">
                <h3 style={{ color: 'var(--warm-white)' }}>
                  CEFR Level: {results.level}
                </h3>
                <p style={{ color: 'var(--warm-white)' }}>
                  {CEFR_LEVELS[results.level].name}
                </p>
              </div>
              <div className="pacific-score-breakdown">
                <p><strong>Score:</strong> {results.score}/{results.totalQuestions} ({results.percentage}%)</p>
                <p><strong>Description:</strong> {results.description}</p>
                <p><strong>Certification:</strong> {results.certification}</p>
              </div>
              <div className="pacific-level-breakdown">
                <h4>Performance by Level:</h4>
                {Object.entries(results.levelBreakdown).map(([level, percentage]) => (
                  <div key={level} className="pacific-level-score">
                    <span>{level}:</span>
                    <div className="pacific-progress-bar">
                      <div 
                        className="pacific-progress-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span>{Math.round(percentage)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pacific-improvement-results">
              <div className="pacific-improvement-summary">
                {results.improvement > 0 ? (
                  <div className="pacific-improvement-positive">
                    <h3 style={{ color: 'var(--dartmouth-green)' }}>
                      Congratulations! Level Improved
                    </h3>
                    <p><strong>Previous Level:</strong> {results.previousLevel}</p>
                    <p><strong>New Level:</strong> {results.newLevel}</p>
                    <p><strong>Improvement:</strong> +{results.improvement} level{results.improvement > 1 ? 's' : ''}</p>
                  </div>
                ) : (
                  <div className="pacific-improvement-maintain">
                    <h3 style={{ color: 'var(--harvard-crimson)' }}>
                      Current Level Maintained
                    </h3>
                    <p><strong>Level:</strong> {results.newLevel}</p>
                    <p>{results.recommendation}</p>
                  </div>
                )}
              </div>
              <div className="pacific-detail-analysis">
                <h4>Performance Analysis:</h4>
                {results.detailAnalysis.map((levelData) => (
                  <div key={levelData.level} className="pacific-level-analysis">
                    <span>{levelData.level}:</span>
                    <div className="pacific-progress-bar">
                      <div 
                        className="pacific-progress-fill"
                        style={{ width: `${levelData.percentage}%` }}
                      ></div>
                    </div>
                    <span>{levelData.correct}/{levelData.total} ({levelData.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="pacific-test-actions">
            <button 
              onClick={() => onTestComplete?.(results, testData.type)}
              className="pacific-button-primary"
            >
              Continue to Course Setup
            </button>
            {testData.type === 'improvement_assessment' && (
              <button 
                onClick={() => {
                  setTestCompleted(false);
                  setTestStarted(false);
                  setShowInstructions(true);
                  setCurrentQuestion(0);
                  setAnswers([]);
                  // Generate new test
                  const newTestData = generateImprovementTest(currentLevel, language);
                  setTestData({
                    ...newTestData,
                    type: 'improvement_assessment',
                    startTime: new Date().toISOString()
                  });
                  setTimeRemaining(newTestData.questions.length * 90);
                }}
                className="pacific-button-secondary"
              >
                Retake Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!testStarted && showInstructions) {
    return (
      <div className="pacific-test-container">
        <div className="pacific-test-instructions">
          <h2 style={{ color: 'var(--harvard-crimson)' }}>
            {testData?.type === 'official_placement' 
              ? `Official ${getLanguageDisplayName(language)} Placement Test`
              : `${getLanguageDisplayName(language)} Improvement Assessment`
            }
          </h2>
          
          <div className="pacific-test-info">
            <div className="pacific-test-details">
              <h3>Test Information:</h3>
              <ul>
                <li><strong>Questions:</strong> {testData?.questions?.length || 0}</li>
                <li><strong>Time Limit:</strong> {formatTime(timeRemaining)}</li>
                <li><strong>Standard:</strong> {testData?.metadata?.source || 'CEFR Aligned'}</li>
                {testData?.type === 'official_placement' && (
                  <li><strong>⚠️ Important:</strong> This test can only be taken ONCE</li>
                )}
                {testData?.type === 'improvement_assessment' && (
                  <li><strong>Testing Levels:</strong> {testData.testLevels?.join(', ')}</li>
                )}
              </ul>
            </div>
            
            <div className="pacific-test-guidelines">
              <h3>Instructions:</h3>
              <ol>
                <li>Answer all questions to the best of your ability</li>
                <li>You cannot go back to previous questions</li>
                <li>Each question will auto-advance after selection</li>
                <li>The test will auto-submit when time expires</li>
                {testData?.type === 'official_placement' && (
                  <li><strong>This official test determines your certified CEFR level</strong></li>
                )}
                {testData?.type === 'improvement_assessment' && (
                  <li>This test measures improvement from your current level ({currentLevel})</li>
                )}
              </ol>
            </div>
            
            {testData?.type === 'official_placement' && (
              <div className="pacific-official-warning">
                <h4 style={{ color: 'var(--harvard-crimson)' }}>⚠️ Official Assessment Notice</h4>
                <p style={{ color: 'var(--medium-grey)' }}>
                  This is a certified CEFR placement test based on {testData.metadata?.source}. 
                  It can only be taken once per language to maintain assessment integrity. 
                  Your results will be permanently recorded for course customization.
                </p>
              </div>
            )}
          </div>
          
          <div className="pacific-test-start">
            <button 
              onClick={startTest}
              className="pacific-button-primary"
              disabled={!testData || !testData.questions || testData.questions.length === 0}
            >
              {testData?.type === 'official_placement' ? 'Begin Official Assessment' : 'Start Improvement Test'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!testData || !testData.questions || currentQuestion >= testData.questions.length) {
    return (
      <div className="pacific-test-container">
        <div className="pacific-error-state">
          <h3>No Questions Available</h3>
          <p>Unable to load test questions. Please try again.</p>
        </div>
      </div>
    );
  }

  const question = testData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / testData.questions.length) * 100;

  return (
    <div className="pacific-test-container">
      <div className="pacific-test-header">
        <div className="pacific-test-progress">
          <div className="pacific-progress-info">
            <span style={{ color: 'var(--medium-grey)' }}>
              Question {currentQuestion + 1} of {testData.questions.length}
            </span>
            <span style={{ color: 'var(--harvard-crimson)' }}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="pacific-progress-bar">
            <div 
              className="pacific-progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="pacific-question-meta">
          <span className="pacific-level-badge pacific-level-{question.level?.toLowerCase()}">
            {question.level}
          </span>
          <span className="pacific-skill-badge">
            {question.skill}
          </span>
        </div>
      </div>

      <div className="pacific-question-content">
        <h3 style={{ color: 'var(--dark-charcoal-grey)' }}>
          {question.question}
        </h3>
        
        {question.question_translation && (
          <p style={{ color: 'var(--medium-grey)', fontStyle: 'italic' }}>
            {question.question_translation}
          </p>
        )}
        
        {question.text && (
          <div className="pacific-reading-passage">
            <h4>Reading Passage:</h4>
            <p>{question.text}</p>
          </div>
        )}
        
        <div className="pacific-answer-options">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={`pacific-answer-option ${answers[currentQuestion] === index ? 'selected' : ''}`}
              disabled={answers[currentQuestion] !== undefined}
            >
              <span className="pacific-option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="pacific-option-text">
                {option}
              </span>
            </button>
          ))}
        </div>
        
        <div className="pacific-question-source">
          <small style={{ color: 'var(--medium-grey)' }}>
            Source: {question.source}
          </small>
        </div>
      </div>
    </div>
  );
};

export default PlacementTest;