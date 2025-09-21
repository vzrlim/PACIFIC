// QADropdown.jsx - Organized Question Management System
// Handles off-topic/branched discussions to keep main lesson notes clean

import React, { useState, useEffect, useRef } from 'react';

// Question categories for organization
const QUESTION_CATEGORIES = {
  off_topic: {
    name: 'Off-Topic Questions',
    description: 'Questions that branched away from main concepts',
    icon: '🔀',
    color: 'var(--tsinghua-purple)'
  },
  deep_dive: {
    name: 'Deep Dive Discussions',
    description: 'Detailed explorations of sub-concepts',
    icon: '🔍',
    color: 'var(--oxford-blue)'
  },
  clarification: {
    name: 'Clarification Needed',
    description: 'Concepts that need further explanation',
    icon: '❓',
    color: 'var(--harvard-crimson)'
  },
  follow_up: {
    name: 'Follow-Up Questions',
    description: 'Questions to revisit later',
    icon: '⏳',
    color: 'var(--dartmouth-green)'
  },
  user_added: {
    name: 'My Questions',
    description: 'Questions I want to ask',
    icon: '💭',
    color: 'var(--medium-grey)'
  }
};

// Question priority levels
const PRIORITY_LEVELS = {
  high: { label: 'High', color: 'var(--harvard-crimson)', order: 1 },
  medium: { label: 'Medium', color: 'var(--oxford-blue)', order: 2 },
  low: { label: 'Low', color: 'var(--dartmouth-green)', order: 3 }
};

const QADropdown = ({
  isVisible = false,
  onClose,
  onQuestionSubmit,
  onUpdateTimeEstimate,
  redirectedQuestions = [],
  selectedTextSegments = [],
  currentLesson = null
}) => {
  // State
  const [questions, setQuestions] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority'); // priority, date, category
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  // Refs
  const questionInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Initialize with redirected questions
  useEffect(() => {
    if (redirectedQuestions.length > 0) {
      const formattedQuestions = redirectedQuestions.map(q => ({
        id: `redirect_${Date.now()}_${Math.random()}`,
        content: q.content,
        category: q.type || 'off_topic',
        priority: 'medium',
        timestamp: new Date(q.timestamp || Date.now()),
        status: 'pending',
        context: q.context || [],
        sourceLesson: currentLesson?.title || 'Unknown',
        isRedirected: true
      }));
      
      setQuestions(prev => [...prev, ...formattedQuestions]);
    }
  }, [redirectedQuestions, currentLesson]);

  // Handle selected text segments
  useEffect(() => {
    setSelectedSegments(selectedTextSegments);
  }, [selectedTextSegments]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isVisible && questionInputRef.current) {
      questionInputRef.current.focus();
    }
  }, [isVisible]);

  // Add new question
  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;

    const question = {
      id: `user_${Date.now()}`,
      content: newQuestion.trim(),
      category: 'user_added',
      priority: selectedPriority,
      timestamp: new Date(),
      status: 'pending',
      context: selectedSegments,
      sourceLesson: currentLesson?.title || 'Current Lesson',
      isRedirected: false
    };

    setQuestions(prev => [question, ...prev]);
    setNewQuestion('');
    setSelectedSegments([]);
    
    // Update time estimate if callback provided
    if (onUpdateTimeEstimate) {
      onUpdateTimeEstimate({
        questionsAdded: 1,
        estimatedTime: estimateQuestionTime(question)
      });
    }
  };

  // Estimate time needed for question
  const estimateQuestionTime = (question) => {
    // Simple estimation based on question complexity and priority
    const baseTime = 3; // 3 minutes base
    const priorityMultiplier = question.priority === 'high' ? 1.5 : 
                              question.priority === 'medium' ? 1.0 : 0.7;
    const contextMultiplier = question.context.length > 0 ? 1.2 : 1.0;
    
    return Math.round(baseTime * priorityMultiplier * contextMultiplier);
  };

  // Submit question to AI
  const handleSubmitQuestion = async (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || question.status === 'processing') return;

    // Update status
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, status: 'processing' } : q
    ));

    if (onQuestionSubmit) {
      try {
        const response = await onQuestionSubmit({
          question: question.content,
          context: question.context,
          priority: question.priority,
          category: question.category,
          sourceLesson: question.sourceLesson
        });

        // Update with response
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? { 
            ...q, 
            status: 'answered',
            response: response.answer,
            answeredAt: new Date(),
            estimatedReadTime: response.estimatedReadTime
          } : q
        ));
      } catch (error) {
        console.error('Error submitting question:', error);
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...q, status: 'error' } : q
        ));
      }
    }
  };

  // Delete question
  const handleDeleteQuestion = (questionId) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
  };

  // Update question priority
  const handleUpdatePriority = (questionId, newPriority) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, priority: newPriority } : q
    ));
  };

  // Toggle question expansion
  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Filter and sort questions
  const getFilteredQuestions = () => {
    let filtered = questions;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(q => q.category === activeCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.content.toLowerCase().includes(term) ||
        (q.response && q.response.toLowerCase().includes(term))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityDiff = PRIORITY_LEVELS[a.priority].order - PRIORITY_LEVELS[b.priority].order;
          return priorityDiff !== 0 ? priorityDiff : b.timestamp - a.timestamp;
        case 'date':
          return b.timestamp - a.timestamp;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Calculate total estimated time
  const getTotalEstimatedTime = () => {
    const pendingQuestions = questions.filter(q => q.status === 'pending');
    return pendingQuestions.reduce((total, q) => total + estimateQuestionTime(q), 0);
  };

  // Format time display
  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Render question item
  const renderQuestion = (question) => {
    const isExpanded = expandedQuestions.has(question.id);
    const category = QUESTION_CATEGORIES[question.category];
    const priority = PRIORITY_LEVELS[question.priority];

    return (
      <div
        key={question.id}
        style={{
          border: `2px solid ${category.color}`,
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
          backgroundColor: 'var(--card)',
          overflow: 'hidden'
        }}
      >
        {/* Question Header */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: `${category.color}10`,
            borderBottom: isExpanded ? `1px solid ${category.color}` : 'none',
            cursor: 'pointer'
          }}
          onClick={() => toggleQuestionExpansion(question.id)}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '1rem' }}>{category.icon}</span>
                <span style={{
                  fontSize: '0.8rem',
                  color: category.color,
                  fontWeight: 'var(--font-weight-medium)',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  {category.name}
                </span>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: priority.color,
                  color: 'var(--warm-white)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.7rem',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  {priority.label}
                </span>
                {question.isRedirected && (
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'var(--oxford-blue)',
                    color: 'var(--warm-white)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    fontFamily: '"Times New Roman", Times, serif'
                  }}>
                    Redirected
                  </span>
                )}
              </div>
              
              <div style={{
                fontSize: '0.95rem',
                color: 'var(--dark-charcoal-grey)',
                fontFamily: '"Times New Roman", Times, serif',
                lineHeight: '1.4',
                marginBottom: '0.5rem'
              }}>
                {question.content}
              </div>
              
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--medium-grey)',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                {question.sourceLesson} • {question.timestamp.toLocaleTimeString()}
                {question.status === 'answered' && question.estimatedReadTime && (
                  <span> • ~{question.estimatedReadTime}m read</span>
                )}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {question.status === 'pending' && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--oxford-blue)'
                }}></div>
              )}
              {question.status === 'processing' && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--dartmouth-green)',
                  animation: 'pulse 1s infinite'
                }}></div>
              )}
              {question.status === 'answered' && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--harvard-crimson)'
                }}></div>
              )}
              
              <span style={{
                fontSize: '1rem',
                color: 'var(--medium-grey)',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div style={{ padding: '1rem' }}>
            {/* Context Segments */}
            {question.context.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h5 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.9rem',
                  color: 'var(--dark-charcoal-grey)',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  Related Text:
                </h5>
                {question.context.map((segment, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'var(--muted)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      color: 'var(--medium-grey)',
                      fontFamily: '"Times New Roman", Times, serif',
                      fontStyle: 'italic',
                      marginBottom: '0.5rem'
                    }}
                  >
                    "{segment}"
                  </div>
                ))}
              </div>
            )}

            {/* AI Response */}
            {question.status === 'answered' && question.response && (
              <div style={{ marginBottom: '1rem' }}>
                <h5 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.9rem',
                  color: 'var(--harvard-crimson)',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  AI Response:
                </h5>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--cream-background)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  color: 'var(--dark-charcoal-grey)',
                  fontFamily: '"Times New Roman", Times, serif',
                  lineHeight: '1.5',
                  border: '1px solid var(--border)'
                }}>
                  {question.response}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {question.status === 'pending' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitQuestion(question.id);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--dartmouth-green)',
                    color: 'var(--warm-white)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: '"Times New Roman", Times, serif'
                  }}
                >
                  Ask AI
                </button>
              )}
              
              {question.status === 'pending' && (
                <select
                  value={question.priority}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleUpdatePriority(question.id, e.target.value);
                  }}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontFamily: '"Times New Roman", Times, serif'
                  }}
                >
                  {Object.entries(PRIORITY_LEVELS).map(([key, priority]) => (
                    <option key={key} value={key}>{priority.label} Priority</option>
                  ))}
                </select>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteQuestion(question.id);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--medium-grey)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isVisible) return null;

  const filteredQuestions = getFilteredQuestions();
  const totalTime = getTotalEstimatedTime();

  return (
    <div
      ref={dropdownRef}
      className="qa-dropdown-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)',
        width: '100%',
        maxWidth: '900px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '2px solid var(--border)',
          backgroundColor: 'var(--muted)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              margin: 0,
              color: 'var(--harvard-crimson)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '1.5rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Q&A Parking Lot
            </h2>
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
          
          <p style={{
            margin: '0 0 1rem 0',
            color: 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '0.9rem'
          }}>
            Organize off-topic and deep-dive questions to keep your main notes clean.
            Total pending time: {formatTime(totalTime)}
          </p>

          {/* Controls */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            />
            
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              <option value="all">All Categories</option>
              {Object.entries(QUESTION_CATEGORIES).map(([key, category]) => (
                <option key={key} value={key}>{category.name}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              <option value="priority">Sort by Priority</option>
              <option value="date">Sort by Date</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>
        </div>

        {/* Add New Question */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--card)'
        }}>
          <h4 style={{
            margin: '0 0 0.75rem 0',
            color: 'var(--dark-charcoal-grey)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '1rem'
          }}>
            Add New Question
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '0.5rem',
            alignItems: 'end'
          }}>
            <div>
              <textarea
                ref={questionInputRef}
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What would you like to ask about?"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              {Object.entries(PRIORITY_LEVELS).map(([key, priority]) => (
                <option key={key} value={key}>{priority.label}</option>
              ))}
            </select>
            
            <button
              onClick={handleAddQuestion}
              disabled={!newQuestion.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: !newQuestion.trim() ? 'var(--medium-grey)' : 'var(--harvard-crimson)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: !newQuestion.trim() ? 'not-allowed' : 'pointer',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              Add
            </button>
          </div>
          
          {selectedSegments.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--medium-grey)',
                marginBottom: '0.5rem'
              }}>
                Selected text will be included as context:
              </div>
              {selectedSegments.map((segment, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'var(--muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: 'var(--medium-grey)',
                    fontStyle: 'italic',
                    marginBottom: '0.25rem'
                  }}
                >
                  "{segment}"
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Questions List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {filteredQuestions.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: 'var(--medium-grey)',
              fontFamily: '"Times New Roman", Times, serif',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                <h3>No questions yet</h3>
                <p>Add questions here to keep your main lesson notes organized</p>
              </div>
            </div>
          ) : (
            filteredQuestions.map(renderQuestion)
          )}
        </div>

        {/* Footer Stats */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--muted)',
          fontSize: '0.9rem',
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              {filteredQuestions.length} question(s) 
              {activeCategory !== 'all' && ` in ${QUESTION_CATEGORIES[activeCategory].name}`}
            </span>
            <span>
              Estimated time: {formatTime(totalTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QADropdown;