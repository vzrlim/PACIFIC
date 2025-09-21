// UnderstandingTimeEstimator.jsx - Cognitive Processing Time Calculator
// Research-based formulas for concept understanding and knowledge internalization

import React, { useState, useEffect } from 'react';

// Cognitive Load Theory constants (Sweller et al., 2011)
const COGNITIVE_LOAD_FACTORS = {
  // Working memory capacity (Miller, 1956; Cowan, 2001)
  working_memory_slots: 7, // ±2 items in working memory
  
  // Concept complexity levels (Bloom's Taxonomy + Anderson & Krathwohl, 2001)
  concept_complexity: {
    remember: 1.0,      // Factual recall
    understand: 1.5,    // Comprehension
    apply: 2.0,         // Application
    analyze: 2.5,       // Analysis
    evaluate: 3.0,      // Evaluation
    create: 3.5         // Synthesis/Creation
  },
  
  // Prior knowledge multipliers (Chi et al., 1981)
  prior_knowledge: {
    expert: 0.4,        // Strong foundation
    intermediate: 0.7,  // Some background
    novice: 1.0,        // Little background
    complete_beginner: 1.5 // No foundation
  },
  
  // Concept density (ideas per paragraph)
  density_penalty: {
    low: 1.0,          // 1-2 concepts per paragraph
    medium: 1.3,       // 3-4 concepts per paragraph
    high: 1.8,         // 5+ concepts per paragraph
    overwhelming: 2.5   // Too many interconnected concepts
  },
  
  // Abstract vs concrete concepts (Dual Coding Theory, Paivio, 1986)
  abstraction_level: {
    concrete: 0.8,     // Physical, tangible concepts
    semi_concrete: 1.0, // Mix of concrete and abstract
    abstract: 1.4,     // Theoretical, conceptual
    highly_abstract: 1.8 // Mathematical, philosophical
  }
};

// Spaced repetition intervals (Ebbinghaus, 1885; Pimsleur, 1967)
const RETENTION_SCHEDULE = {
  initial_learning: 1.0,      // First exposure
  first_review: 0.3,          // 70% retention after first review
  second_review: 0.2,         // Further consolidation
  long_term_retention: 0.1    // Maintenance reviews
};

// Cognitive processing speeds (Just & Carpenter, 1992)
const PROCESSING_SPEEDS = {
  // Base processing times in seconds per concept
  base_concept_time: {
    simple: 15,        // Basic vocabulary, simple rules
    moderate: 30,      // Grammar patterns, cultural concepts
    complex: 60,       // Abstract grammar, nuanced meanings
    expert_level: 120  // Advanced theoretical concepts
  },
  
  // Elaboration time (connecting to existing knowledge)
  elaboration_factor: 1.5,
  
  // Practice time multipliers for different learning goals
  practice_multipliers: {
    recognition: 1.0,   // Just need to recognize
    recall: 2.0,        // Need to actively recall
    application: 3.0,   // Need to use in context
    mastery: 5.0       // Need complete command
  }
};

const UnderstandingTimeEstimator = ({
  content,
  concepts = [],
  userProfile = {},
  learningGoal = 'recall',
  onEstimateUpdate,
  showBreakdown = true
}) => {
  // State
  const [analysis, setAnalysis] = useState(null);
  const [timeEstimate, setTimeEstimate] = useState(null);
  const [userCognitiveProfile, setUserCognitiveProfile] = useState(null);

  // Initialize user cognitive profile
  useEffect(() => {
    const profile = buildCognitiveProfile(userProfile);
    setUserCognitiveProfile(profile);
  }, [userProfile]);

  // Calculate understanding time when inputs change
  useEffect(() => {
    if ((content || concepts.length > 0) && userCognitiveProfile) {
      const contentAnalysis = analyzeContent(content, concepts);
      const estimate = calculateUnderstandingTime(contentAnalysis, userCognitiveProfile, learningGoal);
      
      setAnalysis(contentAnalysis);
      setTimeEstimate(estimate);
      
      if (onEstimateUpdate) {
        onEstimateUpdate({
          analysis: contentAnalysis,
          estimate,
          profile: userCognitiveProfile
        });
      }
    }
  }, [content, concepts, userCognitiveProfile, learningGoal, onEstimateUpdate]);

  // Build user cognitive profile
  const buildCognitiveProfile = (profile) => {
    // Determine prior knowledge level
    const cefrLevel = profile.placementTest?.cefrLevel;
    const targetLanguage = profile.targetLanguage?.language;
    const nativeLanguages = profile.nativeLanguages || [];
    
    let priorKnowledgeLevel;
    if (cefrLevel) {
      if (['C1', 'C2'].includes(cefrLevel)) priorKnowledgeLevel = 'expert';
      else if (['B1', 'B2'].includes(cefrLevel)) priorKnowledgeLevel = 'intermediate';
      else if (['A1', 'A2'].includes(cefrLevel)) priorKnowledgeLevel = 'novice';
      else priorKnowledgeLevel = 'complete_beginner';
    } else {
      priorKnowledgeLevel = 'complete_beginner';
    }
    
    // Check for related language knowledge
    const hasRelatedLanguage = checkLanguageRelationship(targetLanguage, nativeLanguages);
    
    // Estimate working memory capacity (affected by age, education)
    let workingMemoryCapacity = COGNITIVE_LOAD_FACTORS.working_memory_slots;
    if (profile.age && profile.age > 60) workingMemoryCapacity *= 0.9; // Slight decline with age
    if (profile.education?.level === 'graduate') workingMemoryCapacity *= 1.1; // Training helps
    
    return {
      priorKnowledgeLevel,
      hasRelatedLanguage,
      workingMemoryCapacity,
      learningStyle: profile.learningStyle || 'balanced',
      processingSpeed: estimateProcessingSpeed(profile),
      attentionSpan: estimateAttentionSpan(profile)
    };
  };

  // Check if target language is related to known languages
  const checkLanguageRelationship = (target, native) => {
    if (!target || !native.length) return false;
    
    // Simplified language family relationships
    const languageFamilies = {
      romance: ['spanish', 'italian', 'french', 'portuguese', 'romanian'],
      germanic: ['english', 'german', 'dutch', 'swedish', 'norwegian'],
      sinitic: ['chinese', 'mandarin', 'cantonese'],
      slavic: ['russian', 'polish', 'czech', 'ukrainian']
    };
    
    const targetLower = target.toLowerCase();
    
    for (const family of Object.values(languageFamilies)) {
      if (family.some(lang => targetLower.includes(lang))) {
        return native.some(nativeLang => 
          family.some(lang => nativeLang.toLowerCase().includes(lang))
        );
      }
    }
    
    return false;
  };

  // Estimate individual processing speed
  const estimateProcessingSpeed = (profile) => {
    let speed = 1.0; // Base multiplier
    
    // Age factor (processing speed peaks ~20s, gradual decline)
    if (profile.age) {
      if (profile.age < 25) speed *= 1.1;
      else if (profile.age > 50) speed *= 0.9;
      else if (profile.age > 70) speed *= 0.8;
    }
    
    // Education/experience factor
    if (profile.education?.level === 'graduate') speed *= 1.1;
    if (profile.languageLearningExperience === 'extensive') speed *= 1.2;
    
    return speed;
  };

  // Estimate attention span
  const estimateAttentionSpan = (profile) => {
    let baseSpan = 20; // minutes for focused learning
    
    if (profile.age && profile.age < 25) baseSpan *= 1.2; // Young adults
    if (profile.learningStyle === 'kinesthetic') baseSpan *= 0.8; // Need more breaks
    if (profile.distractibility === 'high') baseSpan *= 0.6;
    
    return Math.max(10, Math.min(45, baseSpan));
  };

  // Analyze content complexity
  const analyzeContent = (textContent, conceptList) => {
    let totalConcepts = conceptList.length;
    let avgComplexity = 'moderate';
    let abstractionLevel = 'semi_concrete';
    let density = 'medium';
    
    // If we have explicit concept data
    if (conceptList.length > 0) {
      const complexityLevels = conceptList.map(c => c.complexity || 'moderate');
      const complexityValues = complexityLevels.map(level => 
        COGNITIVE_LOAD_FACTORS.concept_complexity[level] || COGNITIVE_LOAD_FACTORS.concept_complexity.understand
      );
      const avgComplexityValue = complexityValues.reduce((sum, val) => sum + val, 0) / complexityValues.length;
      
      // Map back to complexity level
      if (avgComplexityValue <= 1.2) avgComplexity = 'remember';
      else if (avgComplexityValue <= 1.7) avgComplexity = 'understand';
      else if (avgComplexityValue <= 2.2) avgComplexity = 'apply';
      else if (avgComplexityValue <= 2.7) avgComplexity = 'analyze';
      else if (avgComplexityValue <= 3.2) avgComplexity = 'evaluate';
      else avgComplexity = 'create';
      
      // Determine abstraction level from concept types
      const abstractConcepts = conceptList.filter(c => 
        c.type === 'abstract' || c.type === 'theoretical'
      ).length;
      const abstractRatio = abstractConcepts / totalConcepts;
      
      if (abstractRatio > 0.7) abstractionLevel = 'highly_abstract';
      else if (abstractRatio > 0.4) abstractionLevel = 'abstract';
      else if (abstractRatio > 0.1) abstractionLevel = 'semi_concrete';
      else abstractionLevel = 'concrete';
      
    } else if (textContent) {
      // Estimate from text content
      const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
      totalConcepts = Math.max(1, Math.floor(sentences.length * 0.7)); // ~0.7 concepts per sentence
      
      // Simple heuristics for complexity
      const avgSentenceLength = textContent.split(/\s+/).length / sentences.length;
      if (avgSentenceLength > 20) avgComplexity = 'analyze';
      else if (avgSentenceLength > 15) avgComplexity = 'apply';
      else avgComplexity = 'understand';
      
      // Check for abstract indicators
      const abstractIndicators = ['concept', 'theory', 'principle', 'abstract', 'philosophy'];
      const abstractCount = abstractIndicators.reduce((count, word) => 
        count + (textContent.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0
      );
      
      if (abstractCount > totalConcepts * 0.3) abstractionLevel = 'abstract';
    }
    
    // Determine density
    const wordsPerConcept = textContent ? textContent.split(/\s+/).length / totalConcepts : 50;
    if (wordsPerConcept < 30) density = 'overwhelming';
    else if (wordsPerConcept < 50) density = 'high';
    else if (wordsPerConcept < 100) density = 'medium';
    else density = 'low';
    
    return {
      totalConcepts,
      avgComplexity,
      abstractionLevel,
      density,
      estimatedCognitiveLoad: calculateCognitiveLoad(totalConcepts, avgComplexity, density)
    };
  };

  // Calculate cognitive load (Sweller's CLT)
  const calculateCognitiveLoad = (concepts, complexity, density) => {
    const complexityFactor = COGNITIVE_LOAD_FACTORS.concept_complexity[complexity];
    const densityFactor = COGNITIVE_LOAD_FACTORS.density_penalty[density];
    
    // Intrinsic load (inherent difficulty)
    const intrinsicLoad = concepts * complexityFactor;
    
    // Extraneous load (from presentation/density)
    const extraneousLoad = concepts * densityFactor * 0.5;
    
    // Total cognitive load
    return intrinsicLoad + extraneousLoad;
  };

  // Calculate understanding time
  const calculateUnderstandingTime = (contentAnalysis, profile, goal) => {
    if (!contentAnalysis.totalConcepts) return null;
    
    // Base processing time per concept
    const baseTimePerConcept = PROCESSING_SPEEDS.base_concept_time.moderate; // seconds
    
    // Apply complexity modifier
    const complexityMultiplier = COGNITIVE_LOAD_FACTORS.concept_complexity[contentAnalysis.avgComplexity];
    
    // Apply prior knowledge modifier
    const priorKnowledgeMultiplier = COGNITIVE_LOAD_FACTORS.prior_knowledge[profile.priorKnowledgeLevel];
    
    // Apply abstraction modifier
    const abstractionMultiplier = COGNITIVE_LOAD_FACTORS.abstraction_level[contentAnalysis.abstractionLevel];
    
    // Apply density penalty
    const densityMultiplier = COGNITIVE_LOAD_FACTORS.density_penalty[contentAnalysis.density];
    
    // Apply related language bonus
    const languageBonus = profile.hasRelatedLanguage ? 0.8 : 1.0;
    
    // Apply processing speed
    const speedMultiplier = 1 / profile.processingSpeed;
    
    // Apply learning goal multiplier
    const goalMultiplier = PROCESSING_SPEEDS.practice_multipliers[goal];
    
    // Calculate base understanding time
    let timePerConcept = baseTimePerConcept * 
      complexityMultiplier * 
      priorKnowledgeMultiplier * 
      abstractionMultiplier * 
      densityMultiplier * 
      languageBonus * 
      speedMultiplier * 
      goalMultiplier;
    
    // Account for working memory limits (if too many concepts, need chunking)
    const workingMemoryPenalty = contentAnalysis.totalConcepts > profile.workingMemoryCapacity ? 
      1 + (contentAnalysis.totalConcepts - profile.workingMemoryCapacity) * 0.1 : 1.0;
    
    timePerConcept *= workingMemoryPenalty;
    
    // Total understanding time
    const totalSeconds = timePerConcept * contentAnalysis.totalConcepts;
    const totalMinutes = totalSeconds / 60;
    
    // Add elaboration time (connecting concepts)
    const elaborationTime = totalMinutes * PROCESSING_SPEEDS.elaboration_factor * 0.3;
    
    // Add review time based on spaced repetition
    const reviewTime = calculateReviewTime(totalMinutes, goal);
    
    const finalTime = totalMinutes + elaborationTime + reviewTime;
    
    // Break time needed (based on attention span)
    const breaksNeeded = Math.max(0, Math.floor(finalTime / profile.attentionSpan) - 1);
    const breakTime = breaksNeeded * 10; // 10 minutes per break
    
    return {
      totalMinutes: Math.round(finalTime * 10) / 10,
      breakdown: {
        initial_learning: Math.round(totalMinutes * 10) / 10,
        elaboration: Math.round(elaborationTime * 10) / 10,
        review: Math.round(reviewTime * 10) / 10,
        breaks: Math.round(breakTime * 10) / 10
      },
      factors: {
        complexityMultiplier: Math.round(complexityMultiplier * 100) / 100,
        priorKnowledgeMultiplier: Math.round(priorKnowledgeMultiplier * 100) / 100,
        abstractionMultiplier: Math.round(abstractionMultiplier * 100) / 100,
        densityMultiplier: Math.round(densityMultiplier * 100) / 100,
        languageBonus: Math.round(languageBonus * 100) / 100,
        workingMemoryPenalty: Math.round(workingMemoryPenalty * 100) / 100
      },
      cognitiveLoad: Math.round(contentAnalysis.estimatedCognitiveLoad * 10) / 10,
      breaksNeeded,
      confidence: calculateConfidence(contentAnalysis, profile)
    };
  };

  // Calculate review time based on spaced repetition
  const calculateReviewTime = (initialTime, goal) => {
    if (goal === 'recognition') return initialTime * RETENTION_SCHEDULE.first_review;
    if (goal === 'recall') return initialTime * (RETENTION_SCHEDULE.first_review + RETENTION_SCHEDULE.second_review);
    if (goal === 'application') return initialTime * (RETENTION_SCHEDULE.first_review + RETENTION_SCHEDULE.second_review + 0.1);
    if (goal === 'mastery') return initialTime * (RETENTION_SCHEDULE.first_review + RETENTION_SCHEDULE.second_review + RETENTION_SCHEDULE.long_term_retention);
    
    return initialTime * RETENTION_SCHEDULE.first_review;
  };

  // Calculate confidence in estimate
  const calculateConfidence = (analysis, profile) => {
    let confidence = 80; // Base confidence
    
    // Reduce for high complexity/abstraction
    if (analysis.avgComplexity === 'create') confidence -= 15;
    if (analysis.abstractionLevel === 'highly_abstract') confidence -= 10;
    if (analysis.density === 'overwhelming') confidence -= 15;
    
    // Increase for good conditions
    if (profile.priorKnowledgeLevel === 'expert') confidence += 10;
    if (profile.hasRelatedLanguage) confidence += 5;
    
    return Math.max(60, Math.min(95, confidence));
  };

  // Format time display
  const formatTime = (minutes) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    if (minutes < 60) return `${Math.round(minutes)}m`;
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (!timeEstimate || !analysis) {
    return (
      <div className="understanding-time-estimator" style={{
        padding: '1rem',
        backgroundColor: 'var(--card)',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontFamily: '"Times New Roman", Times, serif',
        textAlign: 'center',
        color: 'var(--medium-grey)'
      }}>
        {content || concepts.length > 0 ? 'Calculating understanding time...' : 'Add content or concepts to estimate understanding time'}
      </div>
    );
  }

  return (
    <div className="understanding-time-estimator" style={{
      padding: '1.5rem',
      backgroundColor: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: 'var(--radius)',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      {/* Main Estimate */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          color: 'var(--harvard-crimson)',
          fontSize: '1.2rem',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Understanding Time Estimate
        </h3>
        
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--dartmouth-green)',
          marginBottom: '0.5rem'
        }}>
          {formatTime(timeEstimate.totalMinutes)}
        </div>
        
        <div style={{
          fontSize: '0.9rem',
          color: 'var(--medium-grey)',
          textTransform: 'capitalize'
        }}>
          For {learningGoal} level • {timeEstimate.confidence}% confidence
        </div>
        
        {timeEstimate.breaksNeeded > 0 && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--oxford-blue)'
          }}>
            Includes {timeEstimate.breaksNeeded} break(s)
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--oxford-blue)'
          }}>
            {analysis.totalConcepts}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--medium-grey)' }}>
            Concepts
          </div>
        </div>
        
        <div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--tsinghua-purple)',
            textTransform: 'capitalize'
          }}>
            {analysis.avgComplexity}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--medium-grey)' }}>
            Complexity
          </div>
        </div>
        
        <div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-medium)',
            color: timeEstimate.cognitiveLoad > 10 ? 'var(--harvard-crimson)' : 'var(--dartmouth-green)'
          }}>
            {timeEstimate.cognitiveLoad}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--medium-grey)' }}>
            Cognitive Load
          </div>
        </div>
      </div>

      {/* Time Breakdown */}
      {showBreakdown && (
        <div>
          <h4 style={{
            margin: '0 0 1rem 0',
            color: 'var(--dark-charcoal-grey)',
            fontSize: '1rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.5rem'
          }}>
            Time Breakdown
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--dartmouth-green)'
              }}>
                {formatTime(timeEstimate.breakdown.initial_learning)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--medium-grey)' }}>
                Initial Learning
              </div>
            </div>
            
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--oxford-blue)'
              }}>
                {formatTime(timeEstimate.breakdown.elaboration)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--medium-grey)' }}>
                Elaboration
              </div>
            </div>
            
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--tsinghua-purple)'
              }}>
                {formatTime(timeEstimate.breakdown.review)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--medium-grey)' }}>
                Review Time
              </div>
            </div>
            
            {timeEstimate.breakdown.breaks > 0 && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--medium-grey)'
                }}>
                  {formatTime(timeEstimate.breakdown.breaks)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--medium-grey)' }}>
                  Break Time
                </div>
              </div>
            )}
          </div>
          
          <h4 style={{
            margin: '0 0 1rem 0',
            color: 'var(--dark-charcoal-grey)',
            fontSize: '1rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.5rem'
          }}>
            Calculation Factors
          </h4>
          
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--dark-charcoal-grey)',
            lineHeight: '1.5'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Complexity:</strong> ×{timeEstimate.factors.complexityMultiplier} ({analysis.avgComplexity})
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Prior Knowledge:</strong> ×{timeEstimate.factors.priorKnowledgeMultiplier} ({userCognitiveProfile?.priorKnowledgeLevel})
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Abstraction Level:</strong> ×{timeEstimate.factors.abstractionMultiplier} ({analysis.abstractionLevel})
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Content Density:</strong> ×{timeEstimate.factors.densityMultiplier} ({analysis.density})
            </div>
            {userCognitiveProfile?.hasRelatedLanguage && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Related Language Bonus:</strong> ×{timeEstimate.factors.languageBonus}
              </div>
            )}
            {timeEstimate.factors.workingMemoryPenalty > 1 && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Working Memory Overload:</strong> ×{timeEstimate.factors.workingMemoryPenalty}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnderstandingTimeEstimator;