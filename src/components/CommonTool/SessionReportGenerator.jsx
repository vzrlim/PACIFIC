// SessionReportGenerator.jsx - AI Learning Analytics & Session Reporting
// Generates comprehensive reports for AI to track user proficiency and adapt teaching

import React, { useState, useEffect } from 'react';

// Report data structure
const REPORT_CATEGORIES = {
  proficiency: {
    vocabulary: { weight: 0.25, metrics: ['new_words_learned', 'retention_rate', 'usage_accuracy'] },
    grammar: { weight: 0.25, metrics: ['rules_mastered', 'application_success', 'error_patterns'] },
    pronunciation: { weight: 0.15, metrics: ['accuracy_score', 'improvement_rate', 'problem_sounds'] },
    comprehension: { weight: 0.20, metrics: ['reading_speed', 'understanding_accuracy', 'inference_ability'] },
    production: { weight: 0.15, metrics: ['speaking_fluency', 'writing_accuracy', 'expression_complexity'] }
  },
  
  learning_patterns: {
    engagement: ['time_spent', 'completion_rate', 'voluntary_practice'],
    difficulties: ['repeated_mistakes', 'help_requests', 'time_overruns'],
    preferences: ['component_usage', 'learning_style_adaptation', 'feedback_patterns'],
    progress_velocity: ['concepts_per_hour', 'retention_durability', 'skill_transfer']
  },
  
  contextual_interests: {
    motivation_type: ['professional', 'personal', 'academic', 'cultural'],
    specific_contexts: ['business_scenarios', 'travel_situations', 'social_interactions'],
    content_preferences: ['formal_vs_casual', 'cultural_depth', 'practical_vs_theoretical']
  }
};

const SessionReportGenerator = ({
  sessionData,
  userProfile,
  learningHistory,
  onReportGenerated,
  onUpdateUserModel,
  isGenerating = false
}) => {
  // State
  const [currentReport, setCurrentReport] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [analyticsInsights, setAnalyticsInsights] = useState(null);

  // Generate report when session data changes
  useEffect(() => {
    if (sessionData && sessionData.completed) {
      generateSessionReport();
    }
  }, [sessionData]);

  // Main report generation function
  const generateSessionReport = async () => {
    setGenerationProgress(0);
    
    try {
      // Step 1: Analyze proficiency metrics (25%)
      setGenerationProgress(25);
      const proficiencyAnalysis = analyzeProficiencyMetrics();
      
      // Step 2: Extract learning patterns (50%)
      setGenerationProgress(50);
      const learningPatterns = extractLearningPatterns();
      
      // Step 3: Assess contextual interests (75%)
      setGenerationProgress(75);
      const contextualAssessment = assessContextualInterests();
      
      // Step 4: Generate adaptive recommendations (100%)
      setGenerationProgress(100);
      const adaptiveRecommendations = generateAdaptiveRecommendations(
        proficiencyAnalysis,
        learningPatterns,
        contextualAssessment
      );
      
      const report = {
        id: `report_${Date.now()}`,
        sessionId: sessionData.id,
        timestamp: new Date().toISOString(),
        proficiency: proficiencyAnalysis,
        patterns: learningPatterns,
        interests: contextualAssessment,
        recommendations: adaptiveRecommendations,
        metadata: {
          lessonTitle: sessionData.lessonTitle,
          duration: sessionData.duration,
          componentsUsed: sessionData.componentsUsed,
          completionRate: sessionData.completionRate
        }
      };
      
      setCurrentReport(report);
      setReportHistory(prev => [report, ...prev.slice(0, 9)]);
      
      // Generate insights for AI adaptation
      const insights = generateAIInsights(report);
      setAnalyticsInsights(insights);
      
      if (onReportGenerated) {
        onReportGenerated(report);
      }
      
      if (onUpdateUserModel) {
        onUpdateUserModel(insights);
      }
      
    } catch (error) {
      console.error('Report generation failed:', error);
    }
  };

  // Analyze proficiency across different skill areas
  const analyzeProficiencyMetrics = () => {
    const metrics = {};
    
    // Vocabulary analysis
    metrics.vocabulary = {
      new_words_encountered: sessionData.vocabularyStats?.newWords || 0,
      retention_rate: calculateRetentionRate('vocabulary'),
      usage_accuracy: sessionData.vocabularyStats?.accuracyRate || 0,
      difficulty_level: assessVocabularyDifficulty(),
      improvement: calculateImprovement('vocabulary')
    };
    
    // Grammar analysis
    metrics.grammar = {
      rules_introduced: sessionData.grammarStats?.newRules || 0,
      application_success: sessionData.grammarStats?.applicationRate || 0,
      error_patterns: identifyErrorPatterns('grammar'),
      complexity_handled: sessionData.grammarStats?.complexityLevel || 'basic',
      improvement: calculateImprovement('grammar')
    };
    
    // Pronunciation analysis
    metrics.pronunciation = {
      accuracy_score: sessionData.pronunciationStats?.averageScore || 0,
      problem_sounds: sessionData.pronunciationStats?.difficultPhonemes || [],
      improvement_rate: calculateImprovement('pronunciation'),
      confidence_level: sessionData.pronunciationStats?.confidenceScore || 0
    };
    
    // Comprehension analysis
    metrics.comprehension = {
      reading_speed: sessionData.readingStats?.wordsPerMinute || 0,
      understanding_accuracy: sessionData.comprehensionStats?.accuracyRate || 0,
      inference_ability: sessionData.comprehensionStats?.inferenceScore || 0,
      content_difficulty: sessionData.contentDifficulty || 'intermediate'
    };
    
    // Production analysis
    metrics.production = {
      output_volume: sessionData.productionStats?.wordCount || 0,
      accuracy_rate: sessionData.productionStats?.accuracyRate || 0,
      complexity_score: sessionData.productionStats?.complexityScore || 0,
      fluency_indicators: sessionData.productionStats?.fluencyMetrics || {}
    };
    
    return metrics;
  };

  // Extract learning behavior patterns
  const extractLearningPatterns = () => {
    return {
      engagement: {
        time_spent: sessionData.duration || 0,
        completion_rate: sessionData.completionRate || 0,
        voluntary_practice: sessionData.voluntaryActivities || 0,
        focus_duration: sessionData.focusMetrics?.averageDuration || 0,
        break_patterns: sessionData.breakPatterns || []
      },
      
      difficulties: {
        help_requests: sessionData.helpRequests || [],
        repeated_mistakes: identifyRepeatedMistakes(),
        time_overruns: sessionData.timeOverruns || [],
        confusion_indicators: sessionData.confusionSignals || [],
        abandonment_points: sessionData.abandonmentPoints || []
      },
      
      preferences: {
        component_usage: analyzeComponentPreferences(),
        interaction_style: sessionData.interactionStyle || 'mixed',
        feedback_preferences: sessionData.feedbackPreferences || {},
        learning_pace: sessionData.pacingPreference || 'normal'
      },
      
      progress_velocity: {
        concepts_per_minute: calculateConceptVelocity(),
        retention_durability: calculateRetentionDurability(),
        skill_transfer: assessSkillTransfer(),
        learning_curve: modelLearningCurve()
      }
    };
  };

  // Assess user's contextual interests and motivations
  const assessContextualInterests = () => {
    return {
      motivation_type: identifyMotivationType(),
      specific_contexts: extractPreferredContexts(),
      content_preferences: {
        formality_level: sessionData.formalityPreference || 'mixed',
        cultural_depth: sessionData.culturalInterest || 'moderate',
        practical_vs_theoretical: sessionData.practicalPreference || 'balanced',
        topic_interests: sessionData.topicEngagement || {}
      },
      goal_alignment: assessGoalAlignment(),
      contextual_usage: sessionData.contextualExamples || []
    };
  };

  // Generate adaptive recommendations for AI
  const generateAdaptiveRecommendations = (proficiency, patterns, interests) => {
    const recommendations = {
      content_adjustments: [],
      teaching_modifications: [],
      component_suggestions: [],
      pacing_adjustments: [],
      motivation_strategies: []
    };
    
    // Content difficulty adjustments
    if (proficiency.vocabulary.retention_rate < 0.7) {
      recommendations.content_adjustments.push('Reduce vocabulary density');
      recommendations.teaching_modifications.push('Increase repetition cycles');
    }
    
    if (proficiency.grammar.application_success < 0.6) {
      recommendations.content_adjustments.push('Simplify grammar explanations');
      recommendations.component_suggestions.push('More interactive practice exercises');
    }
    
    // Learning pattern adaptations
    if (patterns.engagement.completion_rate < 0.8) {
      recommendations.pacing_adjustments.push('Shorter lesson segments');
      recommendations.motivation_strategies.push('Increase achievement feedback');
    }
    
    if (patterns.difficulties.help_requests.length > 5) {
      recommendations.teaching_modifications.push('Provide more scaffolding');
      recommendations.component_suggestions.push('Add clarification prompts');
    }
    
    // Interest-based adaptations
    if (interests.motivation_type === 'professional') {
      recommendations.content_adjustments.push('Focus on business contexts');
      recommendations.component_suggestions.push('Professional scenario practice');
    }
    
    return recommendations;
  };

  // Generate insights specifically for AI model adaptation
  const generateAIInsights = (report) => {
    return {
      user_model_updates: {
        proficiency_adjustments: generateProficiencyAdjustments(report.proficiency),
        learning_style_refinement: refineLearningStyleModel(report.patterns),
        interest_model_update: updateInterestModel(report.interests),
        difficulty_calibration: calibrateDifficultyModel(report)
      },
      
      content_generation_parameters: {
        vocabulary_level: determineVocabularyLevel(report.proficiency.vocabulary),
        grammar_complexity: determineGrammarComplexity(report.proficiency.grammar),
        content_density: calculateOptimalDensity(report.patterns),
        context_preferences: extractContextParameters(report.interests)
      },
      
      teaching_strategy_adjustments: {
        explanation_style: determineOptimalExplanationStyle(report.patterns),
        practice_ratio: calculateOptimalPracticeRatio(report.proficiency),
        feedback_timing: optimizeFeedbackTiming(report.patterns),
        reinforcement_schedule: calculateReinforcementSchedule(report)
      }
    };
  };

  // Helper functions for analysis
  const calculateRetentionRate = (skillType) => {
    const historical = learningHistory.filter(h => h.skillType === skillType);
    if (historical.length === 0) return 0.5; // Default
    
    const recentSessions = historical.slice(-5);
    const retainedConcepts = recentSessions.reduce((sum, session) => 
      sum + (session.retainedConcepts || 0), 0);
    const totalConcepts = recentSessions.reduce((sum, session) => 
      sum + (session.totalConcepts || 1), 0);
    
    return totalConcepts > 0 ? retainedConcepts / totalConcepts : 0.5;
  };

  const calculateImprovement = (skillType) => {
    const historical = learningHistory.filter(h => h.skillType === skillType);
    if (historical.length < 2) return 0;
    
    const recent = historical.slice(-3).map(h => h.score || 0);
    const older = historical.slice(-6, -3).map(h => h.score || 0);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return recentAvg - olderAvg;
  };

  const identifyErrorPatterns = (skillType) => {
    const errors = sessionData.errors?.filter(e => e.category === skillType) || [];
    const patterns = {};
    
    errors.forEach(error => {
      const pattern = error.pattern || 'unknown';
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });
    
    return Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, frequency: count }));
  };

  const analyzeComponentPreferences = () => {
    const usage = sessionData.componentUsage || {};
    return Object.entries(usage)
      .sort(([,a], [,b]) => b.timeSpent - a.timeSpent)
      .slice(0, 5)
      .map(([component, data]) => ({
        component,
        timeSpent: data.timeSpent,
        engagementScore: data.engagementScore || 0
      }));
  };

  const identifyMotivationType = () => {
    const contextualCues = sessionData.contextualCues || {};
    
    if (contextualCues.businessTerms > contextualCues.casualTerms) return 'professional';
    if (contextualCues.academicContent > contextualCues.practicalContent) return 'academic';
    if (contextualCues.culturalInterest > 0.7) return 'cultural';
    return 'personal';
  };

  // Render component
  if (!sessionData) return null;

  return (
    <div className="session-report-generator" style={{
      padding: '1rem',
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      {isGenerating && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--medium-grey)'
        }}>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'var(--muted)',
            borderRadius: '2px',
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
          <p>Generating learning analytics report... {generationProgress}%</p>
        </div>
      )}

      {currentReport && (
        <div>
          <h3 style={{
            margin: '0 0 1rem 0',
            color: 'var(--harvard-crimson)',
            fontSize: '1.1rem'
          }}>
            Session Report Generated
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--dartmouth-green)' }}>
                {Math.round(currentReport.proficiency.vocabulary.retention_rate * 100)}%
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
                Vocabulary Retention
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--oxford-blue)' }}>
                {Math.round(currentReport.patterns.engagement.completion_rate * 100)}%
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
                Session Completion
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--tsinghua-purple)' }}>
                {currentReport.recommendations.content_adjustments.length}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>
                AI Adaptations
              </div>
            </div>
          </div>
          
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--medium-grey)',
            textAlign: 'center'
          }}>
            Report ID: {currentReport.id} | Generated: {new Date(currentReport.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionReportGenerator;