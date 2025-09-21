// CustomRevisionExercises.jsx - AI-Generated Personalized Practice Questions
// Generates MCQ + structured questions based on user's SessionReportGenerator data

import React, { useState, useEffect, useRef } from 'react';
import { MoSCoWUtils, MOSCOW_PRIORITIES } from './MoSCoWPrioritizationSystem';

// Exercise types and configurations
const EXERCISE_TYPES = {
  multiple_choice: {
    name: 'Multiple Choice',
    icon: '◯',
    difficulty_scaling: true,
    time_limit: 30, // seconds
    points: 10
  },
  fill_in_blank: {
    name: 'Fill in the Blank',
    icon: '___',
    difficulty_scaling: true,
    time_limit: 45,
    points: 15
  },
  sentence_completion: {
    name: 'Complete the Sentence',
    icon: '→',
    difficulty_scaling: true,
    time_limit: 60,
    points: 20
  },
  error_correction: {
    name: 'Find & Fix Errors',
    icon: '✏️',
    difficulty_scaling: false,
    time_limit: 90,
    points: 25
  },
  contextual_usage: {
    name: 'Use in Context',
    icon: '💬',
    difficulty_scaling: true,
    time_limit: 120,
    points: 30
  }
};

// Difficulty adaptation based on user performance
const DIFFICULTY_LEVELS = {
  beginner: {
    vocab_complexity: 'basic',
    grammar_complexity: 'simple',
    context_complexity: 'familiar',
    question_count: 5
  },
  intermediate: {
    vocab_complexity: 'moderate',
    grammar_complexity: 'intermediate',
    context_complexity: 'mixed',
    question_count: 8
  },
  advanced: {
    vocab_complexity: 'complex',
    grammar_complexity: 'advanced',
    context_complexity: 'varied',
    question_count: 10
  }
};

// Modify the component props declaration
const CustomRevisionExercises = ({
  sessionReport,
  userProfile,
  learningHistory,
  onExerciseComplete,
  onProgressUpdate,
  isEnabled = true,
  // ADD THESE NEW PROPS:
  moscowPriorities = null, // From MoSCoW system
  priorityTimeAllocation = null, // From MoSCoW system
  currentPhase = 'practice' // From PhaseManager
}) => {
  // State
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exerciseQueue, setExerciseQueue] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [exerciseResults, setExerciseResults] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const generationRequestRef = useRef(null);

  // Generate exercises when session report changes
  useEffect(() => {
    if (sessionReport && isEnabled) {
      generateCustomExercises();
    }
  }, [sessionReport, isEnabled]);

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerActive) {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, isTimerActive]);

  // Main exercise generation function
  const generateCustomExercises = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Step 1: Analyze user's weak areas (25%)
      setGenerationProgress(25);
      const weakAreas = analyzeWeakAreas(sessionReport);
      
      // Step 2: Determine appropriate difficulty (50%)
      setGenerationProgress(50);
      const difficulty = determineDifficulty(sessionReport, userProfile);
      
      // Step 3: Generate targeted exercises (75%)
      setGenerationProgress(75);
      const exercises = await generateTargetedExercises(weakAreas, difficulty);
      
      // Step 4: Personalize and queue (100%)
      setGenerationProgress(100);
      const personalizedExercises = personalizeExercises(exercises, userProfile);
      
      setExerciseQueue(personalizedExercises);
      if (personalizedExercises.length > 0) {
        setCurrentExercise(personalizedExercises[0]);
        setTimeRemaining(personalizedExercises[0].timeLimit);
      }
      
    } catch (error) {
      console.error('Exercise generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // REPLACE the existing analyzeWeakAreas function with this enhanced version
  const analyzeWeakAreas = (report) => {
    const weakAreas = [];
    const threshold = 0.7;
    
    // Check proficiency metrics
    if (report.proficiency.vocabulary.retention_rate < threshold) {
      weakAreas.push({
        area: 'vocabulary',
        severity: 1 - report.proficiency.vocabulary.retention_rate,
        focus: 'retention_practice',
        moscowCategory: getMoscowCategoryForSkill('Core vocabulary')
      });
    }
    
    if (report.proficiency.grammar.application_success < threshold) {
      weakAreas.push({
        area: 'grammar',
        severity: 1 - report.proficiency.grammar.application_success,
        focus: 'application_practice',
        moscowCategory: getMoscowCategoryForSkill('Grammar fundamentals')
      });
    }
    
    if (report.proficiency.pronunciation.accuracy_score < threshold) {
      weakAreas.push({
        area: 'pronunciation',
        severity: 1 - report.proficiency.pronunciation.accuracy_score,
        focus: 'sound_practice',
        moscowCategory: getMoscowCategoryForSkill('Pronunciation practice')
      });
    }
    
    // Filter weak areas by MoSCoW priorities and sort by priority weight
    const prioritizedAreas = moscowPriorities ? 
      weakAreas.filter(area => area.moscowCategory !== 'wontHave')
              .sort((a, b) => MoSCoWUtils.getPriorityWeight(b.moscowCategory) - MoSCoWUtils.getPriorityWeight(a.moscowCategory))
      : weakAreas.sort((a, b) => b.severity - a.severity);
    
    return prioritizedAreas.slice(0, 5);
  };

  const getMoscowCategoryForSkill = (skillName) => {
    if (!moscowPriorities) return 'couldHave';
    
    for (const [category, skills] of Object.entries(moscowPriorities)) {
      if (skills.some(skill => skill.toLowerCase().includes(skillName.toLowerCase()) || 
                              skillName.toLowerCase().includes(skill.toLowerCase()))) {
        return category;
      }
    }
    return 'couldHave'; // Default fallback
  }; 

  // Determine appropriate difficulty level
  const determineDifficulty = (report, profile) => {
    const averageProficiency = (
      report.proficiency.vocabulary.retention_rate +
      report.proficiency.grammar.application_success +
      report.proficiency.comprehension.understanding_accuracy
    ) / 3;
    
    const engagementLevel = report.patterns.engagement.completion_rate;
    
    // Adjust difficulty based on proficiency and engagement
    if (averageProficiency < 0.5 || engagementLevel < 0.6) {
      return 'beginner';
    } else if (averageProficiency < 0.8 || engagementLevel < 0.8) {
      return 'intermediate';
    } else {
      return 'advanced';
    }
  };

  // Generate exercises using AWS AI API
  const generateTargetedExercises = async (weakAreas, difficulty) => {
    try {
      // Calculate exercise distribution based on MoSCoW priorities
      const exerciseDistribution = calculateMoscowExerciseDistribution(weakAreas);
      
      const response = await fetch('/api/ai/generate-exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weakAreas,
          difficulty,
          exerciseTypes: Object.keys(EXERCISE_TYPES),
          moscowPriorities,
          priorityTimeAllocation,
          exerciseDistribution, // ADD THIS
          requirements: {
            targetedPractice: true,
            progressiveDifficulty: true,
            varietyBalance: true,
            userEngagement: true,
            priorityFocus: true // ADD THIS
          },
          constraints: {
            maxQuestions: DIFFICULTY_LEVELS[difficulty].question_count,
            timeConstraints: true,
            adaptiveContent: true,
            mustHaveFocus: exerciseDistribution.mustHave || 60 // ADD THIS
          }
        })
      });
      
      if (!response.ok) throw new Error('Exercise generation failed');
      
      const result = await response.json();
      return result.exercises || [];
      
    } catch (error) {
      console.error('AI exercise generation failed:', error);
      return generateExercisesFallback(weakAreas, difficulty);
    }
  };

  // ADD this new function after generateTargetedExercises
  const calculateMoscowExerciseDistribution = (weakAreas) => {
    if (!moscowPriorities || !priorityTimeAllocation) {
      return { mustHave: 60, shouldHave: 30, couldHave: 10 };
    }
    
    // Count weak areas by MoSCoW category
    const categoryCounts = {
      mustHave: weakAreas.filter(area => area.moscowCategory === 'mustHave').length,
      shouldHave: weakAreas.filter(area => area.moscowCategory === 'shouldHave').length,
      couldHave: weakAreas.filter(area => area.moscowCategory === 'couldHave').length
    };
    
    // Use MoSCoW time allocation as base, adjust for weak area concentration
    return {
      mustHave: Math.max(priorityTimeAllocation.mustHave || 60, categoryCounts.mustHave * 20),
      shouldHave: Math.min(priorityTimeAllocation.shouldHave || 30, 40 - categoryCounts.shouldHave * 5),
      couldHave: Math.min(priorityTimeAllocation.couldHave || 10, 20)
    };
  };

  // Fallback exercise generation
  const generateExercisesFallback = (weakAreas, difficulty) => {
    const exercises = [];
    const config = DIFFICULTY_LEVELS[difficulty];
    
    // Generate basic exercises for each weak area
    weakAreas.slice(0, 3).forEach((area, index) => {
      const exerciseType = Object.keys(EXERCISE_TYPES)[index % Object.keys(EXERCISE_TYPES).length];
      
      exercises.push({
        id: `exercise_${Date.now()}_${index}`,
        type: exerciseType,
        area: area.area,
        difficulty,
        timeLimit: EXERCISE_TYPES[exerciseType].time_limit,
        points: EXERCISE_TYPES[exerciseType].points,
        question: generateFallbackQuestion(area, exerciseType),
        options: generateFallbackOptions(area, exerciseType),
        correctAnswer: generateFallbackAnswer(area, exerciseType),
        explanation: `This question targets your ${area.area} skills.`
      });
    });
    
    return exercises;
  };

  // Personalize exercises based on user profile
  const personalizeExercises = (exercises, profile) => {
    return exercises.map(exercise => ({
      ...exercise,
      personalizedHint: generatePersonalizedHint(exercise, profile),
      motivationalContext: generateMotivationalContext(exercise, profile),
      culturalContext: addCulturalContext(exercise, profile)
    }));
  };

  // Generate personalized hint using AI
  const generatePersonalizedHint = async (exercise, profile) => {
    try {
      const response = await fetch('/api/ai/generate-hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercise,
          userProfile: profile,
          hintLevel: 'subtle' // Don't give away the answer
        })
      });
      
      if (!response.ok) throw new Error('Hint generation failed');
      
      const result = await response.json();
      return result.hint || 'Think about the context and structure.';
      
    } catch (error) {
      return 'Consider the grammar rules and context clues.';
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = (answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        answer,
        timeSpent: currentExercise.timeLimit - timeRemaining,
        timestamp: Date.now()
      }
    }));
    
    setIsTimerActive(false);
    
    // Move to next question or show results
    if (currentQuestionIndex < exerciseQueue.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentExercise(exerciseQueue[nextIndex]);
      setTimeRemaining(exerciseQueue[nextIndex].timeLimit);
      setIsTimerActive(true);
    } else {
      // All questions completed
      calculateResults();
    }
  };

  // Handle time up
  const handleTimeUp = () => {
    handleAnswerSubmit(null); // No answer provided
  };

  // Calculate exercise results
  const calculateResults = async () => {
    try {
      const response = await fetch('/api/ai/evaluate-exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercises: exerciseQueue,
          userAnswers,
          evaluationCriteria: {
            accuracy: true,
            timeEfficiency: true,
            improvementAreas: true,
            nextSteps: true
          }
        })
      });
      
      if (!response.ok) throw new Error('Evaluation failed');
      
      const results = await response.json();
      
      setExerciseResults({
        score: results.totalScore || 0,
        accuracy: results.accuracy || 0,
        timeEfficiency: results.timeEfficiency || 0,
        strengths: results.strengths || [],
        improvements: results.improvements || [],
        nextSteps: results.nextSteps || [],
        detailedFeedback: results.feedback || []
      });
      
      setShowResults(true);
      
      if (onExerciseComplete) {
        onExerciseComplete(results);
      }
      
    } catch (error) {
      console.error('Results calculation failed:', error);
      // Fallback calculation
      calculateResultsFallback();
    }
  };

  // Fallback results calculation
  const calculateResultsFallback = () => {
    let correctAnswers = 0;
    let totalTime = 0;
    
    exerciseQueue.forEach((exercise, index) => {
      const userAnswer = userAnswers[index];
      if (userAnswer && userAnswer.answer === exercise.correctAnswer) {
        correctAnswers++;
      }
      totalTime += userAnswer?.timeSpent || exercise.timeLimit;
    });
    
    const accuracy = exerciseQueue.length > 0 ? correctAnswers / exerciseQueue.length : 0;
    const averageTime = exerciseQueue.length > 0 ? totalTime / exerciseQueue.length : 0;
    
    setExerciseResults({
      score: Math.round(accuracy * 100),
      accuracy,
      timeEfficiency: averageTime < 60 ? 'Good' : 'Can improve',
      strengths: accuracy > 0.7 ? ['Good understanding'] : [],
      improvements: accuracy < 0.7 ? ['Review weak areas'] : [],
      nextSteps: ['Continue practicing', 'Review mistakes'],
      // ADD THESE NEW FIELDS:
      priorityBreakdown: moscowPriorities ? calculatePriorityBreakdown() : null,
      moscowAlignment: moscowPriorities ? 'Exercises aligned with your priorities' : null
    });
    
    setShowResults(true);
  };


  const calculatePriorityBreakdown = () => {
    if (!moscowPriorities) return null;
    
    const breakdown = {};
    
    // Calculate scores for each priority category based on exercises answered
    Object.keys(moscowPriorities).forEach(priority => {
      const priorityExercises = exerciseQueue.filter(exercise => 
        exercise.area && getMoscowCategoryForSkill(exercise.area) === priority
      );
      
      if (priorityExercises.length > 0) {
        const correctAnswers = priorityExercises.filter((exercise, index) => {
          const userAnswer = userAnswers[index];
          return userAnswer && userAnswer.answer === exercise.correctAnswer;
        }).length;
        
        breakdown[priority] = {
          score: Math.round((correctAnswers / priorityExercises.length) * 100),
          exerciseCount: priorityExercises.length
        };
      }
    });
    
    return breakdown;
  };  

  // Start new exercise session
  const startNewSession = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setExerciseResults(null);
    if (exerciseQueue.length > 0) {
      setCurrentExercise(exerciseQueue[0]);
      setTimeRemaining(exerciseQueue[0].timeLimit);
      setIsTimerActive(true);
    }
  };

  // Generate fallback question content
  const generateFallbackQuestion = (area, type) => {
    const questions = {
      vocabulary: 'What does this word mean in context?',
      grammar: 'Choose the correct grammatical form:',
      pronunciation: 'Which pronunciation is correct?'
    };
    return questions[area.area] || 'Complete this exercise:';
  };

  const generateFallbackOptions = (area, type) => {
    return ['Option A', 'Option B', 'Option C', 'Option D'];
  };

  const generateFallbackAnswer = (area, type) => {
    return 'Option A'; // Simplified fallback
  };

  if (!isEnabled || !sessionReport) return null;

  return (
    <div className="custom-revision-exercises" style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      {/* Generation Progress */}
      {isGenerating && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            color: 'var(--harvard-crimson)'
          }}>
            Generating Personalized Exercises
          </h3>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--muted)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: `${generationProgress}%`,
              height: '100%',
              backgroundColor: 'var(--harvard-crimson)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{ margin: 0, color: 'var(--medium-grey)' }}>
            Analyzing your learning patterns and creating targeted practice... {generationProgress}%
          </p>
        </div>
      )}

      {/* Exercise Interface */}
      {currentExercise && !showResults && !isGenerating && (
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}>
          {/* Exercise Header */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--muted)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                color: 'var(--harvard-crimson)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {EXERCISE_TYPES[currentExercise.type].icon} {EXERCISE_TYPES[currentExercise.type].name}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'var(--medium-grey)'
              }}>
                Question {currentQuestionIndex + 1} of {exerciseQueue.length} • {currentExercise.points} points
              </p>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '0.75rem',
              backgroundColor: timeRemaining <= 10 ? 'var(--error)' : 'var(--dartmouth-green)',
              color: 'var(--warm-white)',
              borderRadius: 'var(--radius-sm)',
              minWidth: '80px'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
              <div style={{ fontSize: '0.7rem' }}>remaining</div>
            </div>
          </div>

          {/* Question Content */}
          <div style={{ padding: '2rem' }}>
            <div style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: 'var(--dark-charcoal-grey)',
              marginBottom: '2rem'
            }}>
              {currentExercise.question}
            </div>

            {/* Answer Options */}
            {currentExercise.options && (
              <div style={{
                display: 'grid',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {currentExercise.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSubmit(option)}
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      backgroundColor: 'var(--card)',
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      fontFamily: '"Times New Roman", Times, serif'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = 'var(--harvard-crimson)';
                      e.target.style.backgroundColor = 'var(--muted)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = 'var(--border)';
                      e.target.style.backgroundColor = 'var(--card)';
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--oxford-blue)',
                      color: 'var(--warm-white)',
                      textAlign: 'center',
                      lineHeight: '1.5rem',
                      marginRight: '1rem',
                      fontSize: '0.8rem'
                    }}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Hint */}
            {currentExercise.personalizedHint && (
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '4px solid var(--tsinghua-purple)'
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--tsinghua-purple)',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}>
                  HINT
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--medium-grey)',
                  fontStyle: 'italic'
                }}>
                  {currentExercise.personalizedHint}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {showResults && exerciseResults && (
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: '2rem'
        }}>
          <h3 style={{
            margin: '0 0 2rem 0',
            color: 'var(--harvard-crimson)',
            textAlign: 'center',
            fontSize: '1.5rem'
          }}>
            Exercise Complete!
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'var(--dartmouth-green)',
                marginBottom: '0.5rem'
              }}>
                {exerciseResults.score}%
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
                Overall Score
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'var(--oxford-blue)',
                marginBottom: '0.5rem'
              }}>
                {Math.round(exerciseResults.accuracy * 100)}%
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
                Accuracy
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--tsinghua-purple)',
                marginBottom: '0.5rem'
              }}>
                {exerciseResults.timeEfficiency}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
                Time Efficiency
              </div>
            </div>
          </div>

          {/* PRIORITY BREAKDOWN SECTION */}
          {moscowPriorities && exerciseResults.priorityBreakdown && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '2rem'
            }}>
              <h4 style={{
                margin: '0 0 1rem 0',
                color: 'var(--dartmouth-green)',
                textAlign: 'center'
              }}>
                Priority Focus Results
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem'
              }}>
                {Object.entries(exerciseResults.priorityBreakdown).map(([priority, data]) => (
                  <div key={priority} style={{
                    textAlign: 'center',
                    padding: '0.5rem',
                    backgroundColor: 'var(--card)',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${MOSCOW_PRIORITIES[priority.toUpperCase()]?.color || 'var(--border)'}`
                  }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: MOSCOW_PRIORITIES[priority.toUpperCase()]?.color
                    }}>
                      {data.score}%
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--medium-grey)' }}>
                      {MOSCOW_PRIORITIES[priority.toUpperCase()]?.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {exerciseResults.nextSteps.length > 0 && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '2rem'
            }}>
              <h4 style={{
                margin: '0 0 1rem 0',
                color: 'var(--dartmouth-green)'
              }}>
                Recommended Next Steps:
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: '1.5rem',
                color: 'var(--dark-charcoal-grey)'
              }}>
                {exerciseResults.nextSteps.map((step, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem' }}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={startNewSession}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--harvard-crimson)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '1rem',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              Practice Again
            </button>
            
            <button
              onClick={() => generateCustomExercises()}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--dartmouth-green)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '1rem',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              New Exercises
            </button>
          </div>
        </div>

      )}

      {/* No exercises ready state */}
      {!isGenerating && !currentExercise && !showResults && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            color: 'var(--harvard-crimson)'
          }}>
            Ready for Personalized Practice?
          </h3>
          <p style={{
            margin: '0 0 2rem 0',
            color: 'var(--medium-grey)',
            lineHeight: '1.6'
          }}>
            Based on your learning session, I'll create custom exercises targeting your specific areas for improvement.
          </p>
          <button
            onClick={generateCustomExercises}
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'var(--harvard-crimson)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}
          >
            Generate Practice Exercises
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomRevisionExercises;