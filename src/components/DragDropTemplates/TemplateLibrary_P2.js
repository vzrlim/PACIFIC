// TemplateLibrary.js - Part 2: Interactive Components Complete
// Continuing from flip card back side and other interactive elements

import React, { useState, useEffect } from 'react';
import { PACIFIC_COMPONENT_TYPES, COMPONENT_CATEGORIES } from './TemplateLibrary_Part1.js';

export const INTERACTIVE_COMPONENTS = {
  // Flip Card Component (Complete)
  flipCard: {
    id: 'interactive_flip_card',
    type: PACIFIC_COMPONENT_TYPES.INTERACTION,
    category: 'interactive',
    name: 'Flip Card',
    description: 'Click to reveal answer or translation',
    icon: '🔄',
    defaultConfig: {
      frontText: 'Buongiorno',
      backText: 'Good morning',
      frontColor: 'var(--harvard-crimson)',
      backColor: 'var(--dartmouth-green)',
      size: 'medium'
    },
    component: ({ config, isPreview = false }) => {
      const [isFlipped, setIsFlipped] = useState(false);
      
      return (
        <div className={`pacific-component pacific-flip-card ${isPreview ? 'preview' : 'editable'}`}>
          <div
            className="flip-card-container"
            style={{
              width: config.size === 'small' ? '150px' : config.size === 'large' ? '250px' : '200px',
              height: '120px',
              perspective: '1000px',
              margin: '0 auto'
            }}
            onClick={() => !isPreview && setIsFlipped(!isFlipped)}
          >
            <div
              className="flip-card-inner"
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                textAlign: 'center',
                transition: 'transform 0.6s',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                cursor: isPreview ? 'default' : 'pointer'
              }}
            >
              {/* Front Side */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  backgroundColor: config.frontColor,
                  color: 'var(--warm-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius)',
                  border: '2px solid var(--border)'
                }}
              >
                <span style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '1.1rem',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {config.frontText}
                </span>
              </div>
              
              {/* Back Side */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  backgroundColor: config.backColor,
                  color: 'var(--warm-white)',
                  transform: 'rotateY(180deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius)',
                  border: '2px solid var(--border)'
                }}
              >
                <span style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '1.1rem',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {config.backText}
                </span>
              </div>
            </div>
          </div>
          
          {!isPreview && (
            <p style={{
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--medium-grey)',
              marginTop: '0.5rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Click to flip
            </p>
          )}
        </div>
      );
    },
    configOptions: {
      size: ['small', 'medium', 'large'],
      frontColor: ['var(--harvard-crimson)', 'var(--dartmouth-green)', 'var(--oxford-blue)', 'var(--tsinghua-purple)'],
      backColor: ['var(--dartmouth-green)', 'var(--harvard-crimson)', 'var(--oxford-blue)', 'var(--tsinghua-purple)']
    }
  },

  // Multiple Choice Quiz
  multipleChoice: {
    id: 'interactive_multiple_choice',
    type: PACIFIC_COMPONENT_TYPES.INTERACTION,
    category: 'interactive',
    name: 'Multiple Choice',
    description: 'Interactive quiz questions with immediate feedback',
    icon: '❓',
    defaultConfig: {
      question: 'What does "Grazie" mean in English?',
      options: ['Hello', 'Thank you', 'Goodbye', 'Please'],
      correctAnswer: 1,
      explanation: '"Grazie" is the Italian word for "Thank you"',
      showExplanation: true,
      allowRetry: true
    },
    component: ({ config, isPreview = false }) => {
      const [selectedAnswer, setSelectedAnswer] = useState(null);
      const [showResult, setShowResult] = useState(false);
      const [hasAnswered, setHasAnswered] = useState(false);

      const handleAnswerSelect = (index) => {
        if (isPreview || hasAnswered) return;
        
        setSelectedAnswer(index);
        setShowResult(true);
        setHasAnswered(true);
      };

      const resetQuiz = () => {
        setSelectedAnswer(null);
        setShowResult(false);
        setHasAnswered(false);
      };

      return (
        <div className={`pacific-component pacific-multiple-choice ${isPreview ? 'preview' : 'editable'}`}>
          <div style={{
            padding: '1.5rem',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--card)'
          }}>
            <h4 style={{
              fontFamily: '"Times New Roman", Times, serif',
              color: 'var(--dark-charcoal-grey)',
              marginBottom: '1rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {config.question}
            </h4>

            <div className="options" style={{ marginBottom: '1rem' }}>
              {config.options.map((option, index) => {
                const isCorrect = index === config.correctAnswer;
                const isSelected = selectedAnswer === index;
                
                let optionStyle = {
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--dark-charcoal-grey)',
                  fontFamily: '"Times New Roman", Times, serif',
                  cursor: isPreview || hasAnswered ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                };

                if (showResult) {
                  if (isCorrect) {
                    optionStyle.backgroundColor = 'var(--dartmouth-green)';
                    optionStyle.color = 'var(--warm-white)';
                    optionStyle.borderColor = 'var(--dartmouth-green)';
                  } else if (isSelected && !isCorrect) {
                    optionStyle.backgroundColor = 'var(--harvard-crimson)';
                    optionStyle.color = 'var(--warm-white)';
                    optionStyle.borderColor = 'var(--harvard-crimson)';
                  }
                } else if (!isPreview) {
                  optionStyle[':hover'] = {
                    backgroundColor: 'var(--muted)',
                    borderColor: 'var(--harvard-crimson)'
                  };
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    style={optionStyle}
                    disabled={isPreview || hasAnswered}
                  >
                    <span style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {showResult && config.showExplanation && (
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem'
              }}>
                <p style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  color: 'var(--dark-charcoal-grey)',
                  margin: 0,
                  fontSize: '0.95rem'
                }}>
                  <strong>Explanation:</strong> {config.explanation}
                </p>
              </div>
            )}

            {showResult && config.allowRetry && !isPreview && (
              <button
                onClick={resetQuiz}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--oxford-blue)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: '"Times New Roman", Times, serif',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    },
    configOptions: {
      showExplanation: [true, false],
      allowRetry: [true, false]
    }
  },

  // Drag and Drop Matching
  dragMatch: {
    id: 'interactive_drag_match',
    type: PACIFIC_COMPONENT_TYPES.INTERACTION,
    category: 'interactive',
    name: 'Drag & Drop Match',
    description: 'Drag items to match with correct pairs',
    icon: '🎯',
    defaultConfig: {
      title: 'Match Italian words with English translations',
      leftItems: ['Ciao', 'Grazie', 'Prego', 'Scusi'],
      rightItems: ['Thank you', 'Hello/Goodbye', 'Excuse me', 'You\'re welcome'],
      correctPairs: [[0, 1], [1, 0], [2, 3], [3, 2]], // [leftIndex, rightIndex]
      showFeedback: true
    },
    component: ({ config, isPreview = false }) => {
      const [draggedItem, setDraggedItem] = useState(null);
      const [matches, setMatches] = useState({});
      const [completed, setCompleted] = useState(false);

      const handleDragStart = (e, item, index, side) => {
        if (isPreview) return;
        setDraggedItem({ item, index, side });
      };

      const handleDragOver = (e) => {
        e.preventDefault();
      };

      const handleDrop = (e, targetIndex, targetSide) => {
        e.preventDefault();
        if (isPreview || !draggedItem) return;

        if (draggedItem.side !== targetSide) {
          const newMatches = { ...matches };
          
          if (draggedItem.side === 'left') {
            newMatches[draggedItem.index] = targetIndex;
          } else {
            newMatches[targetIndex] = draggedItem.index;
          }
          
          setMatches(newMatches);
          
          // Check if completed
          const totalPairs = config.leftItems.length;
          const matchedPairs = Object.keys(newMatches).length;
          if (matchedPairs === totalPairs) {
            setCompleted(true);
          }
        }
        
        setDraggedItem(null);
      };

      const isCorrectMatch = (leftIndex, rightIndex) => {
        return config.correctPairs.some(pair => 
          pair[0] === leftIndex && pair[1] === rightIndex
        );
      };

      return (
        <div className={`pacific-component pacific-drag-match ${isPreview ? 'preview' : 'editable'}`}>
          <h4 style={{
            fontFamily: '"Times New Roman", Times, serif',
            color: 'var(--harvard-crimson)',
            marginBottom: '1rem',
            textAlign: 'center',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {config.title}
          </h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            padding: '1rem',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--card)'
          }}>
            {/* Left Column */}
            <div className="left-items">
              <h5 style={{
                fontFamily: '"Times New Roman", Times, serif',
                color: 'var(--medium-grey)',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                Italian
              </h5>
              {config.leftItems.map((item, index) => {
                const isMatched = matches.hasOwnProperty(index);
                const matchedRightIndex = matches[index];
                const isCorrect = isMatched && isCorrectMatch(index, matchedRightIndex);

                return (
                  <div
                    key={index}
                    draggable={!isPreview}
                    onDragStart={(e) => handleDragStart(e, item, index, 'left')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, 'left')}
                    style={{
                      padding: '0.75rem',
                      margin: '0.5rem 0',
                      backgroundColor: isMatched 
                        ? (isCorrect ? 'var(--dartmouth-green)' : 'var(--harvard-crimson)')
                        : 'var(--muted)',
                      color: isMatched ? 'var(--warm-white)' : 'var(--dark-charcoal-grey)',
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      cursor: isPreview ? 'default' : 'grab',
                      fontFamily: '"Times New Roman", Times, serif',
                      fontWeight: 'var(--font-weight-medium)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>

            {/* Right Column */}
            <div className="right-items">
              <h5 style={{
                fontFamily: '"Times New Roman", Times, serif',
                color: 'var(--medium-grey)',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                English
              </h5>
              {config.rightItems.map((item, index) => {
                const leftIndex = Object.keys(matches).find(key => matches[key] === index);
                const isMatched = leftIndex !== undefined;
                const isCorrect = isMatched && isCorrectMatch(parseInt(leftIndex), index);

                return (
                  <div
                    key={index}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, 'right')}
                    style={{
                      padding: '0.75rem',
                      margin: '0.5rem 0',
                      backgroundColor: isMatched 
                        ? (isCorrect ? 'var(--dartmouth-green)' : 'var(--harvard-crimson)')
                        : 'var(--muted)',
                      color: isMatched ? 'var(--warm-white)' : 'var(--dark-charcoal-grey)',
                      border: '2px dashed var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      fontFamily: '"Times New Roman", Times, serif',
                      minHeight: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          </div>

          {completed && config.showFeedback && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--dartmouth-green)',
              color: 'var(--warm-white)',
              borderRadius: 'var(--radius)',
              textAlign: 'center'
            }}>
              <p style={{
                fontFamily: '"Times New Roman", Times, serif',
                margin: 0,
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Excellent! All matches completed correctly!
              </p>
            </div>
          )}

          {!isPreview && (
            <p style={{
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--medium-grey)',
              marginTop: '0.5rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Drag words from the left column to match with the right column
            </p>
          )}
        </div>
      );
    },
    configOptions: {
      showFeedback: [true, false]
    }
  },

  // Audio Pronunciation Component
  audioPronunciation: {
    id: 'interactive_audio_pronunciation',
    type: PACIFIC_COMPONENT_TYPES.INTERACTION,
    category: 'interactive',
    name: 'Audio Pronunciation',
    description: 'Listen and repeat pronunciation practice',
    icon: '🔊',
    defaultConfig: {
      word: 'Buongiorno',
      pronunciation: '/bwonˈdʒorno/',
      audioUrl: null, // Will be generated by text-to-speech
      language: 'it-IT',
      showPhonetics: true,
      allowRecording: true
    },
    component: ({ config, isPreview = false }) => {
      const [isPlaying, setIsPlaying] = useState(false);
      const [isRecording, setIsRecording] = useState(false);

      const playAudio = () => {
        if (isPreview) return;
        
        setIsPlaying(true);
        
        // Use Web Speech API for text-to-speech
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(config.word);
          utterance.lang = config.language;
          utterance.rate = 0.8; // Slower for learning
          
          utterance.onend = () => {
            setIsPlaying(false);
          };
          
          speechSynthesis.speak(utterance);
        }
      };

      const startRecording = () => {
        if (isPreview) return;
        // Placeholder for recording functionality
        setIsRecording(true);
        setTimeout(() => setIsRecording(false), 3000); // Demo recording
      };

      return (
        <div className={`pacific-component pacific-audio-pronunciation ${isPreview ? 'preview' : 'editable'}`}>
          <div style={{
            padding: '1.5rem',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--card)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontFamily: '"Times New Roman", Times, serif',
              color: 'var(--dark-charcoal-grey)',
              marginBottom: '0.5rem',
              fontSize: '1.5rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {config.word}
            </h3>

            {config.showPhonetics && (
              <p style={{
                fontFamily: '"Times New Roman", Times, serif',
                color: 'var(--medium-grey)',
                fontSize: '1rem',
                marginBottom: '1rem',
                fontStyle: 'italic'
              }}>
                {config.pronunciation}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={playAudio}
                disabled={isPreview || isPlaying}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isPlaying ? 'var(--medium-grey)' : 'var(--harvard-crimson)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: '"Times New Roman", Times, serif',
                  cursor: isPreview || isPlaying ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{isPlaying ? '⏸️' : '▶️'}</span>
                {isPlaying ? 'Playing...' : 'Listen'}
              </button>

              {config.allowRecording && (
                <button
                  onClick={startRecording}
                  disabled={isPreview || isRecording}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isRecording ? 'var(--harvard-crimson)' : 'var(--dartmouth-green)',
                    color: 'var(--warm-white)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: '"Times New Roman", Times, serif',
                    cursor: isPreview || isRecording ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>{isRecording ? '🔴' : '🎤'}</span>
                  {isRecording ? 'Recording...' : 'Practice'}
                </button>
              )}
            </div>

            {!isPreview && (
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--medium-grey)',
                marginTop: '1rem',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                Click "Listen" to hear pronunciation, then "Practice" to record yourself
              </p>
            )}
          </div>
        </div>
      );
    },
    configOptions: {
      showPhonetics: [true, false],
      allowRecording: [true, false],
      language: ['it-IT', 'es-ES', 'fr-FR', 'de-DE', 'pt-PT', 'zh-CN', 'ja-JP']
    }
  }
};

// Export all interactive components
export default {
  ...INTERACTIVE_COMPONENTS
};

// Utility functions for interactive components
export const getInteractiveComponents = () => {
  return Object.values(INTERACTIVE_COMPONENTS);
};

export const getComponentById = (id) => {
  return INTERACTIVE_COMPONENTS[Object.keys(INTERACTIVE_COMPONENTS).find(key => 
    INTERACTIVE_COMPONENTS[key].id === id
  )];
};