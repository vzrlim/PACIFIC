// MoSCoWPrioritizationSystem.jsx - Comprehensive Priority & Practicality Scale
// Implements MoSCoW methodology across learning content, features, and time allocation
// Can be integrated into lesson planning, content selection, and study scheduling

import React, { useState, useEffect } from 'react';
import { Target, Clock, Zap, Pause, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

// MoSCoW Priority Levels with clear definitions
export const MOSCOW_PRIORITIES = {
  MUST_HAVE: {
    key: 'mustHave',
    label: 'Must Have',
    description: 'Critical for success - cannot proceed without these',
    color: 'var(--destructive)',
    icon: Target,
    maxItems: 4, // Limit to maintain focus
    urgency: 'immediate'
  },
  SHOULD_HAVE: {
    key: 'shouldHave', 
    label: 'Should Have',
    description: 'Important but not critical - high value if time permits',
    color: 'var(--harvard-crimson)',
    icon: Zap,
    maxItems: 8,
    urgency: 'high'
  },
  COULD_HAVE: {
    key: 'couldHave',
    label: 'Could Have',
    description: 'Nice to have - adds value but not essential',
    color: 'var(--oxford-blue)',
    icon: Clock,
    maxItems: 12,
    urgency: 'medium'
  },
  WONT_HAVE: {
    key: 'wontHave',
    label: "Won't Have",
    description: 'Not needed for current goals - explicitly excluded',
    color: 'var(--medium-grey)',
    icon: Pause,
    maxItems: null,
    urgency: 'none'
  }
};

// Predefined item sets for different contexts
export const MOSCOW_ITEM_SETS = {
  learning_content: {
    name: 'Learning Content Priorities',
    items: [
      'Grammar fundamentals', 'Core vocabulary', 'Pronunciation practice', 'Listening comprehension',
      'Speaking practice', 'Reading skills', 'Writing practice', 'Cultural context',
      'Formal communication', 'Casual conversation', 'Business terminology', 'Academic language',
      'Idioms and expressions', 'Slang and colloquialisms', 'Technical vocabulary', 'Literature and arts'
    ]
  },
  language_skills: {
    name: 'Language Skills Focus',
    items: [
      'Basic conversation', 'Professional communication', 'Travel phrases', 'Emergency vocabulary',
      'Numbers and dates', 'Family and relationships', 'Food and dining', 'Transportation',
      'Shopping and money', 'Health and medical', 'Work and career', 'Education and learning',
      'Entertainment and hobbies', 'Technology and internet', 'News and current events', 'Philosophy and abstract concepts'
    ]
  },
  study_features: {
    name: 'Study Features and Tools',
    items: [
      'Interactive exercises', 'Audio pronunciation', 'Video content', 'Flashcard system',
      'Progress tracking', 'Spaced repetition', 'Grammar explanations', 'Cultural notes',
      'Peer interaction', 'Tutor feedback', 'Gamification elements', 'Offline access',
      'Mobile synchronization', 'Custom notes', 'Study reminders', 'Advanced analytics'
    ]
  },
  time_allocation: {
    name: 'Time Allocation Priorities',
    items: [
      'Daily vocabulary review', 'Grammar practice', 'Listening exercises', 'Speaking practice',
      'Reading comprehension', 'Writing practice', 'Cultural learning', 'Review and revision',
      'New lesson content', 'Practice exercises', 'Real-world application', 'Assessment tests',
      'Note organization', 'Progress review', 'Goal adjustment', 'Motivation activities'
    ]
  }
};

const MoSCoWPrioritizationSystem = ({
  itemSet = 'learning_content',
  customItems = [],
  initialPriorities = {},
  onPrioritiesChange,
  maxMustHave = 4,
  maxShouldHave = 8,
  allowCustomItems = true,
  showTimeAllocation = false,
  contextualUse = null
}) => {
  // State management
  const [priorities, setPriorities] = useState({
    mustHave: [],
    shouldHave: [],
    couldHave: [],
    wontHave: [],
    ...initialPriorities
  });
  
  const [availableItems, setAvailableItems] = useState([]);
  const [customItem, setCustomItem] = useState('');
  const [errors, setErrors] = useState([]);
  const [timeAllocation, setTimeAllocation] = useState({});
  const [showValidation, setShowValidation] = useState(false);

  // Initialize available items
  useEffect(() => {
    const baseItems = MOSCOW_ITEM_SETS[itemSet]?.items || [];
    setAvailableItems([...baseItems, ...customItems]);
  }, [itemSet, customItems]);

  // Auto-calculate time allocation based on priorities
  useEffect(() => {
    if (showTimeAllocation) {
      calculateTimeAllocation();
    }
  }, [priorities, showTimeAllocation]);

  // Validation rules
  const validatePriorities = () => {
    const errors = [];
    
    if (priorities.mustHave.length === 0) {
      errors.push('Select at least 1 "Must Have" priority to maintain focus');
    }
    
    if (priorities.mustHave.length > maxMustHave) {
      errors.push(`Maximum ${maxMustHave} "Must Have" items - too many priorities reduces effectiveness`);
    }
    
    if (priorities.shouldHave.length > maxShouldHave) {
      errors.push(`Maximum ${maxShouldHave} "Should Have" items - consider moving some to "Could Have"`);
    }
    
    const totalPrioritized = priorities.mustHave.length + priorities.shouldHave.length + priorities.couldHave.length;
    if (totalPrioritized < 3) {
      errors.push('Prioritize at least 3 items total for effective learning focus');
    }

    setErrors(errors);
    return errors.length === 0;
  };

  // Calculate suggested time allocation based on MoSCoW priorities
  const calculateTimeAllocation = () => {
    const total = 100; // 100% of available time
    const mustHaveItems = priorities.mustHave.length;
    const shouldHaveItems = priorities.shouldHave.length;
    const couldHaveItems = priorities.couldHave.length;
    
    const allocation = {
      mustHave: mustHaveItems > 0 ? Math.max(60, 80 - (shouldHaveItems * 5)) : 0,
      shouldHave: shouldHaveItems > 0 ? Math.min(30, shouldHaveItems * 8) : 0,
      couldHave: couldHaveItems > 0 ? Math.min(15, couldHaveItems * 3) : 0,
      buffer: 10 // Always keep buffer time
    };
    
    // Normalize to 100%
    const sum = allocation.mustHave + allocation.shouldHave + allocation.couldHave + allocation.buffer;
    Object.keys(allocation).forEach(key => {
      allocation[key] = Math.round((allocation[key] / sum) * 100);
    });
    
    setTimeAllocation(allocation);
  };

  // Priority assignment handlers
  const assignPriority = (item, priority) => {
    const priorityLimits = {
      mustHave: maxMustHave,
      shouldHave: maxShouldHave,
      couldHave: MOSCOW_PRIORITIES.COULD_HAVE.maxItems,
      wontHave: null
    };
    
    setPriorities(prev => {
      // Remove item from all priority lists first
      const cleaned = {
        mustHave: prev.mustHave.filter(i => i !== item),
        shouldHave: prev.shouldHave.filter(i => i !== item),
        couldHave: prev.couldHave.filter(i => i !== item),
        wontHave: prev.wontHave.filter(i => i !== item)
      };
      
      // Check if adding to priority would exceed limit
      const currentCount = cleaned[priority].length;
      const limit = priorityLimits[priority];
      
      if (limit && currentCount >= limit) {
        setErrors([`Maximum ${limit} items allowed in "${MOSCOW_PRIORITIES[priority.toUpperCase()]?.label}"`]);
        return prev;
      }
      
      // Add to new priority list
      const updated = {
        ...cleaned,
        [priority]: [...cleaned[priority], item]
      };
      
      setErrors([]);
      
      // Notify parent component
      if (onPrioritiesChange) {
        onPrioritiesChange(updated);
      }
      
      return updated;
    });
  };

  const getPriorityForItem = (item) => {
    for (const [priority, items] of Object.entries(priorities)) {
      if (items.includes(item)) return priority;
    }
    return null;
  };

  const addCustomItem = () => {
    if (customItem.trim() && !availableItems.includes(customItem.trim())) {
      setAvailableItems(prev => [...prev, customItem.trim()]);
      setCustomItem('');
    }
  };

  const resetPriorities = () => {
    setPriorities({
      mustHave: [],
      shouldHave: [],
      couldHave: [],
      wontHave: []
    });
    setErrors([]);
  };

  const autoSuggestPriorities = () => {
    if (!contextualUse) return;
    
    // Auto-suggest based on contextual use
    const suggestions = {
      mustHave: [],
      shouldHave: [],
      couldHave: []
    };
    
    if (contextualUse.type === 'professional') {
      suggestions.mustHave = ['Professional communication', 'Core vocabulary', 'Grammar fundamentals'];
      suggestions.shouldHave = ['Business terminology', 'Formal communication', 'Pronunciation practice'];
    } else {
      suggestions.mustHave = ['Basic conversation', 'Core vocabulary', 'Pronunciation practice'];
      suggestions.shouldHave = ['Casual conversation', 'Cultural context', 'Travel phrases'];
    }
    
    // Filter suggestions to only include available items
    Object.keys(suggestions).forEach(priority => {
      suggestions[priority] = suggestions[priority].filter(item => 
        availableItems.some(available => available.toLowerCase().includes(item.toLowerCase()))
      );
    });
    
    setPriorities(prev => ({
      ...prev,
      ...suggestions,
      wontHave: prev.wontHave
    }));
  };

  const renderPriorityColumn = (priorityKey) => {
    const priority = MOSCOW_PRIORITIES[priorityKey.toUpperCase()];
    const items = priorities[priorityKey] || [];
    const IconComponent = priority.icon;
    const isAtLimit = priority.maxItems && items.length >= priority.maxItems;

    return (
      <div style={{
        flex: 1,
        padding: '1rem',
        border: `3px solid ${priority.color}`,
        borderRadius: 'var(--radius)',
        backgroundColor: `${priority.color}10`,
        minHeight: '200px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconComponent size={20} style={{ color: priority.color, marginRight: '0.5rem' }} />
            <h3 style={{
              color: priority.color,
              fontFamily: '"Times New Roman", Times, serif',
              margin: 0,
              fontSize: '1.1rem'
            }}>
              {priority.label}
            </h3>
          </div>
          <span style={{
            fontSize: '0.9rem',
            color: priority.color,
            fontWeight: 'bold'
          }}>
            {items.length}{priority.maxItems ? `/${priority.maxItems}` : ''}
          </span>
        </div>
        
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--medium-grey)',
          margin: '0 0 1rem 0',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          {priority.description}
        </p>
        
        {isAtLimit && (
          <div style={{
            padding: '0.5rem',
            backgroundColor: `${priority.color}20`,
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: priority.color,
            textAlign: 'center'
          }}>
            Limit reached
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(item => (
            <div
              key={item}
              onClick={() => assignPriority(item, 'wontHave')}
              style={{
                padding: '0.75rem',
                backgroundColor: priority.color,
                color: 'var(--warm-white)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontFamily: '"Times New Roman", Times, serif',
                transition: 'opacity 0.2s ease',
                border: 'none'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {item}
            </div>
          ))}
        </div>
        
        {showTimeAllocation && timeAllocation[priorityKey] && (
          <div style={{
            marginTop: '1rem',
            padding: '0.5rem',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center'
          }}>
            <strong>{timeAllocation[priorityKey]}%</strong>
            <div style={{ fontSize: '0.7rem', color: 'var(--medium-grey)' }}>
              of study time
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="moscow-prioritization-system" style={{
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            color: 'var(--harvard-crimson)',
            margin: 0,
            fontSize: '1.5rem'
          }}>
            Priority & Practicality Scale
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {contextualUse && (
              <button
                onClick={autoSuggestPriorities}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--dartmouth-green)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Zap size={16} />
                Auto-Suggest
              </button>
            )}
            <button
              onClick={resetPriorities}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--medium-grey)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>
        
        <p style={{
          color: 'var(--medium-grey)',
          margin: 0,
          fontSize: '1rem'
        }}>
          {MOSCOW_ITEM_SETS[itemSet]?.name || 'Custom Priority Set'} - Click items below to assign priority levels
        </p>
      </div>

      {/* Priority Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {Object.keys(MOSCOW_PRIORITIES).map(priorityKey => 
          renderPriorityColumn(MOSCOW_PRIORITIES[priorityKey].key)
        )}
      </div>

      {/* Available Items */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          color: 'var(--dark-charcoal-grey)',
          margin: '0 0 1rem 0'
        }}>
          Available Items - Click to Assign Priority
        </h3>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: allowCustomItems ? '1rem' : 0
        }}>
          {availableItems.map(item => {
            const priority = getPriorityForItem(item);
            const isAssigned = !!priority;
            
            return (
              <div
                key={item}
                onClick={() => assignPriority(item, isAssigned ? 'wontHave' : 'mustHave')}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${isAssigned ? 'var(--muted)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isAssigned ? 'var(--muted)' : 'var(--warm-white)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: isAssigned ? 'var(--medium-grey)' : 'var(--dark-charcoal-grey)',
                  textDecoration: isAssigned ? 'line-through' : 'none',
                  opacity: isAssigned ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isAssigned) {
                    e.target.style.borderColor = 'var(--harvard-crimson)';
                    e.target.style.backgroundColor = 'rgba(165, 28, 48, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAssigned) {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.backgroundColor = 'var(--warm-white)';
                  }
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
        
        {allowCustomItems && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              placeholder="Add custom priority item..."
              onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem'
              }}
            />
            <button
              onClick={addCustomItem}
              disabled={!customItem.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: customItem.trim() ? 'var(--oxford-blue)' : 'var(--muted)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                cursor: customItem.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Validation and Errors */}
      {errors.length > 0 && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(165, 28, 48, 0.1)',
          border: '2px solid var(--harvard-crimson)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.5rem',
            color: 'var(--harvard-crimson)'
          }}>
            <AlertTriangle size={20} style={{ marginRight: '0.5rem' }} />
            <h4 style={{ margin: 0 }}>Priority Issues</h4>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--harvard-crimson)' }}>
            {errors.map((error, index) => (
              <li key={index} style={{ fontSize: '0.9rem' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Time Allocation Display */}
      {showTimeAllocation && Object.keys(timeAllocation).length > 0 && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '2px solid var(--dartmouth-green)'
        }}>
          <h3 style={{
            color: 'var(--dartmouth-green)',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Clock size={20} style={{ marginRight: '0.5rem' }} />
            Recommended Time Allocation
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            {Object.entries(timeAllocation).map(([priority, percentage]) => (
              <div key={priority} style={{
                padding: '1rem',
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: MOSCOW_PRIORITIES[priority.toUpperCase()]?.color || 'var(--medium-grey)'
                }}>
                  {percentage}%
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--medium-grey)',
                  textTransform: 'capitalize'
                }}>
                  {priority.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
          
          <p style={{
            margin: '1rem 0 0 0',
            fontSize: '0.8rem',
            color: 'var(--medium-grey)',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            This allocation maximizes learning efficiency based on your priorities
          </p>
        </div>
      )}

      {/* Summary */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--dark-charcoal-grey)' }}>
          <strong>Priority Summary:</strong> {priorities.mustHave.length} Must • {priorities.shouldHave.length} Should • {priorities.couldHave.length} Could • {priorities.wontHave.length} Won't
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          color: validatePriorities() ? 'var(--dartmouth-green)' : 'var(--harvard-crimson)'
        }}>
          {validatePriorities() ? (
            <>
              <CheckCircle2 size={16} style={{ marginRight: '0.25rem' }} />
              <span style={{ fontSize: '0.9rem' }}>Valid Priorities</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} style={{ marginRight: '0.25rem' }} />
              <span style={{ fontSize: '0.9rem' }}>Needs Adjustment</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Export utility functions for integration with other components
export const MoSCoWUtils = {
  validatePriorities: (priorities, maxMustHave = 4, maxShouldHave = 8) => {
    const errors = [];
    if (priorities.mustHave?.length === 0) errors.push('At least 1 Must Have required');
    if (priorities.mustHave?.length > maxMustHave) errors.push(`Max ${maxMustHave} Must Have items`);
    if (priorities.shouldHave?.length > maxShouldHave) errors.push(`Max ${maxShouldHave} Should Have items`);
    return { isValid: errors.length === 0, errors };
  },
  
  calculateTimeAllocation: (priorities) => {
    const mustHave = priorities.mustHave?.length || 0;
    const shouldHave = priorities.shouldHave?.length || 0;
    const couldHave = priorities.couldHave?.length || 0;
    
    return {
      mustHave: Math.max(60, 80 - (shouldHave * 5)),
      shouldHave: Math.min(30, shouldHave * 8),
      couldHave: Math.min(15, couldHave * 3),
      buffer: 10
    };
  },
  
  getPriorityWeight: (priority) => {
    const weights = { mustHave: 4, shouldHave: 3, couldHave: 2, wontHave: 0 };
    return weights[priority] || 0;
  },
  
  sortByPriority: (items, priorities) => {
    return items.sort((a, b) => {
      const aPriority = Object.keys(priorities).find(p => priorities[p].includes(a)) || 'wontHave';
      const bPriority = Object.keys(priorities).find(p => priorities[p].includes(b)) || 'wontHave';
      return MoSCoWUtils.getPriorityWeight(bPriority) - MoSCoWUtils.getPriorityWeight(aPriority);
    });
  }
};

export default MoSCoWPrioritizationSystem;