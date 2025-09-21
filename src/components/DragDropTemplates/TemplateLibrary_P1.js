// TemplateLibrary.js - Part 1: Core Learning Components & Text-Based Elements
// Based on PACIFIC Learning Science principles - Visual, Auditory, Reading, Kinesthetic

import React from 'react';

// Core Component Types for PACIFIC Learning Templates
export const PACIFIC_COMPONENT_TYPES = {
  TEXT: 'text',
  VISUAL: 'visual', 
  MINDMAP: 'mindmap',
  MNEMONICS: 'mnemonics',
  INTERACTION: 'interaction',
  PROGRESS: 'progress',
  REFERENCE: 'reference',
  CUSTOM: 'custom'
};

// Learning Style Mapping
export const LEARNING_STYLES = {
  visual: ['visual', 'mindmap', 'progress'],
  auditory: ['text', 'mnemonics', 'interaction'],
  reading: ['text', 'reference', 'custom'],
  kinesthetic: ['interaction', 'custom', 'progress']
};

// Component Categories for Organization
export const COMPONENT_CATEGORIES = {
  content: {
    name: 'Content Elements',
    description: 'Core learning content components',
    color: 'var(--harvard-crimson)'
  },
  visual: {
    name: 'Visual Aids',
    description: 'Charts, diagrams, and visual learning tools',
    color: 'var(--dartmouth-green)'
  },
  interactive: {
    name: 'Interactive Elements', 
    description: 'Drag, click, and engagement components',
    color: 'var(--oxford-blue)'
  },
  organization: {
    name: 'Structure & Flow',
    description: 'Layout and organizational components',
    color: 'var(--tsinghua-purple)'
  }
};

// =============================================================================
// PART 1: TEXT-BASED & CONTENT COMPONENTS
// =============================================================================

export const TEXT_COMPONENTS = {
  // Basic Text Elements
  heading: {
    id: 'text_heading',
    type: PACIFIC_COMPONENT_TYPES.TEXT,
    category: 'content',
    name: 'Heading',
    description: 'Main topic headings and subheadings',
    icon: '📝',
    defaultConfig: {
      level: 'h2',
      text: 'Lesson Topic',
      alignment: 'center',
      color: 'var(--harvard-crimson)',
      size: 'large'
    },
    component: ({ config, isPreview = false }) => (
      <div 
        className={`pacific-component pacific-heading ${isPreview ? 'preview' : 'editable'}`}
        style={{ 
          textAlign: config.alignment,
          color: config.color,
          fontSize: config.size === 'large' ? '1.5rem' : '1.25rem'
        }}
      >
        {React.createElement(
          config.level,
          {
            style: { 
              margin: '0.5rem 0',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }
          },
          config.text
        )}
      </div>
    ),
    configOptions: {
      level: ['h1', 'h2', 'h3', 'h4'],
      alignment: ['left', 'center', 'right'],
      size: ['normal', 'large'],
      color: ['var(--harvard-crimson)', 'var(--dartmouth-green)', 'var(--dark-charcoal-grey)']
    }
  },

  paragraph: {
    id: 'text_paragraph',
    type: PACIFIC_COMPONENT_TYPES.TEXT,
    category: 'content',
    name: 'Paragraph',
    description: 'Main content text blocks',
    icon: '📄',
    defaultConfig: {
      text: 'Enter your lesson content here. This paragraph component supports multi-line text with proper formatting.',
      alignment: 'left',
      style: 'normal',
      spacing: 'normal'
    },
    component: ({ config, isPreview = false }) => (
      <div 
        className={`pacific-component pacific-paragraph ${isPreview ? 'preview' : 'editable'}`}
        style={{ textAlign: config.alignment }}
      >
        <p style={{
          fontFamily: '"Times New Roman", Times, serif',
          color: 'var(--dark-charcoal-grey)',
          lineHeight: '1.5',
          margin: config.spacing === 'tight' ? '0.5rem 0' : '1rem 0',
          fontStyle: config.style === 'italic' ? 'italic' : 'normal',
          fontWeight: config.style === 'bold' ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)'
        }}>
          {config.text}
        </p>
      </div>
    ),
    configOptions: {
      alignment: ['left', 'center', 'right', 'justify'],
      style: ['normal', 'italic', 'bold'],
      spacing: ['tight', 'normal', 'loose']
    }
  },

  bulletList: {
    id: 'text_bullet_list',
    type: PACIFIC_COMPONENT_TYPES.TEXT,
    category: 'content',
    name: 'Bullet List',
    description: 'Organized lists for key points',
    icon: '• ',
    defaultConfig: {
      items: [
        'First key point or vocabulary item',
        'Second important concept',
        'Third learning objective'
      ],
      style: 'bullet',
      color: 'var(--dark-charcoal-grey)'
    },
    component: ({ config, isPreview = false }) => (
      <div className={`pacific-component pacific-list ${isPreview ? 'preview' : 'editable'}`}>
        <ul style={{
          fontFamily: '"Times New Roman", Times, serif',
          color: config.color,
          paddingLeft: '1.5rem',
          margin: '0.5rem 0'
        }}>
          {config.items.map((item, index) => (
            <li key={index} style={{
              marginBottom: '0.5rem',
              lineHeight: '1.4'
            }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
    configOptions: {
      style: ['bullet', 'dash', 'arrow'],
      color: ['var(--dark-charcoal-grey)', 'var(--harvard-crimson)', 'var(--dartmouth-green)']
    }
  },

  numberedList: {
    id: 'text_numbered_list', 
    type: PACIFIC_COMPONENT_TYPES.TEXT,
    category: 'content',
    name: 'Numbered List',
    description: 'Sequential steps or ordered information',
    icon: '1.',
    defaultConfig: {
      items: [
        'First step in the learning process',
        'Second step with detailed explanation',
        'Third step to complete understanding'
      ],
      startNumber: 1,
      style: 'decimal',
      color: 'var(--dark-charcoal-grey)'
    },
    component: ({ config, isPreview = false }) => (
      <div className={`pacific-component pacific-numbered-list ${isPreview ? 'preview' : 'editable'}`}>
        <ol style={{
          fontFamily: '"Times New Roman", Times, serif',
          color: config.color,
          paddingLeft: '1.5rem',
          margin: '0.5rem 0',
          counterReset: `item ${config.startNumber - 1}`,
          listStyleType: config.style
        }}>
          {config.items.map((item, index) => (
            <li key={index} style={{
              marginBottom: '0.5rem',
              lineHeight: '1.4'
            }}>
              {item}
            </li>
          ))}
        </ol>
      </div>
    ),
    configOptions: {
      style: ['decimal', 'lower-roman', 'upper-roman', 'lower-alpha', 'upper-alpha'],
      color: ['var(--dark-charcoal-grey)', 'var(--harvard-crimson)', 'var(--dartmouth-green)']
    }
  },

  quote: {
    id: 'text_quote',
    type: PACIFIC_COMPONENT_TYPES.TEXT,
    category: 'content',
    name: 'Quote Block',
    description: 'Highlighted quotes or important statements',
    icon: '"',
    defaultConfig: {
      text: 'Learning a language is not just about memorizing words, but understanding culture and context.',
      author: 'Language Learning Principle',
      style: 'italic',
      alignment: 'center'
    },
    component: ({ config, isPreview = false }) => (
      <div className={`pacific-component pacific-quote ${isPreview ? 'preview' : 'editable'}`}>
        <blockquote style={{
          fontFamily: '"Times New Roman", Times, serif',
          textAlign: config.alignment,
          fontStyle: config.style,
          color: 'var(--medium-grey)',
          borderLeft: '4px solid var(--harvard-crimson)',
          paddingLeft: '1rem',
          margin: '1rem 0',
          backgroundColor: 'var(--muted)',
          padding: '1rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
            "{config.text}"
          </p>
          {config.author && (
            <cite style={{ 
              fontSize: '0.9rem',
              color: 'var(--medium-grey)',
              fontStyle: 'normal'
            }}>
              — {config.author}
            </cite>
          )}
        </blockquote>
      </div>
    ),
    configOptions: {
      style: ['normal', 'italic'],
      alignment: ['left', 'center', 'right']
    }
  },

  translation: {
    id: 'text_translation',
    type: PACIFIC_COMPONENT_TYPES.TEXT,
    category: 'content',
    name: 'Translation Pair',
    description: 'Side-by-side original and translated text',
    icon: '⇌',
    defaultConfig: {
      originalText: 'Buongiorno, come sta?',
      originalLanguage: 'Italian',
      translatedText: 'Good morning, how are you?',
      translatedLanguage: 'English',
      layout: 'side-by-side'
    },
    component: ({ config, isPreview = false }) => (
      <div className={`pacific-component pacific-translation ${isPreview ? 'preview' : 'editable'}`}>
        <div 
          className="translation-container"
          style={{
            display: config.layout === 'side-by-side' ? 'grid' : 'block',
            gridTemplateColumns: config.layout === 'side-by-side' ? '1fr 1fr' : '1fr',
            gap: '1rem',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1rem',
            backgroundColor: 'var(--card)'
          }}
        >
          <div className="original-text">
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--medium-grey)',
              marginBottom: '0.25rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {config.originalLanguage}:
            </div>
            <div style={{
              fontFamily: '"Times New Roman", Times, serif',
              color: 'var(--dark-charcoal-grey)',
              fontSize: '1.1rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {config.originalText}
            </div>
          </div>
          
          <div className="translated-text">
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--medium-grey)',
              marginBottom: '0.25rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {config.translatedLanguage}:
            </div>
            <div style={{
              fontFamily: '"Times New Roman", Times, serif',
              color: 'var(--medium-grey)',
              fontSize: '1rem'
            }}>
              {config.translatedText}
            </div>
          </div>
        </div>
      </div>
    ),
    configOptions: {
      layout: ['side-by-side', 'stacked']
    }
  },

  vocabulary: {
    id: 'text_vocabulary',
    type: PACIFIC_COMPONENT_TYPES.TEXT,
    category: 'content',
    name: 'Vocabulary Table',
    description: 'Organized vocabulary with definitions',
    icon: '📚',
    defaultConfig: {
      title: 'Key Vocabulary',
      items: [
        { word: 'Ciao', pronunciation: '/tʃaʊ/', definition: 'Hello/Goodbye (informal)', example: 'Ciao, come stai?' },
        { word: 'Grazie', pronunciation: '/ˈɡratsi.e/', definition: 'Thank you', example: 'Grazie mille!' },
        { word: 'Prego', pronunciation: '/ˈpreɡo/', definition: 'You\'re welcome/Please', example: 'Prego, si accomodi.' }
      ],
      showPronunciation: true,
      showExamples: true
    },
    component: ({ config, isPreview = false }) => (
      <div className={`pacific-component pacific-vocabulary ${isPreview ? 'preview' : 'editable'}`}>
        <h4 style={{
          fontFamily: '"Times New Roman", Times, serif',
          color: 'var(--harvard-crimson)',
          marginBottom: '1rem',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          {config.title}
        </h4>
        <div className="vocabulary-table" style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden'
        }}>
          {config.items.map((item, index) => (
            <div 
              key={index}
              className="vocabulary-row"
              style={{
                display: 'grid',
                gridTemplateColumns: config.showPronunciation && config.showExamples ? '1fr 1fr 2fr 2fr' : 
                                   config.showPronunciation ? '1fr 1fr 3fr' : 
                                   config.showExamples ? '1fr 2fr 2fr' : '1fr 3fr',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: index % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                borderBottom: index < config.items.length - 1 ? '1px solid var(--border)' : 'none'
              }}
            >
              <div style={{
                fontFamily: '"Times New Roman", Times, serif',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--dark-charcoal-grey)'
              }}>
                {item.word}
              </div>
              
              {config.showPronunciation && (
                <div style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  color: 'var(--medium-grey)',
                  fontSize: '0.9rem'
                }}>
                  {item.pronunciation}
                </div>
              )}
              
              <div style={{
                fontFamily: '"Times New Roman", Times, serif',
                color: 'var(--dark-charcoal-grey)',
                fontSize: '0.95rem'
              }}>
                {item.definition}
              </div>
              
              {config.showExamples && (
                <div style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  color: 'var(--medium-grey)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic'
                }}>
                  {item.example}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    configOptions: {
      showPronunciation: [true, false],
      showExamples: [true, false]
    }
  }
};

// Export Part 1 Components Collection
export const TEMPLATE_LIBRARY_PART1 = {
  ...TEXT_COMPONENTS
};

// Utility Functions for Part 1
export const getComponentsByType = (type) => {
  return Object.values(TEXT_COMPONENTS).filter(component => component.type === type);
};

export const getComponentsByCategory = (category) => {
  return Object.values(TEXT_COMPONENTS).filter(component => component.category === category);
};

export const getComponentsForLearningStyle = (style) => {
  const compatibleTypes = LEARNING_STYLES[style] || [];
  return Object.values(TEXT_COMPONENTS).filter(component => 
    compatibleTypes.includes(component.type)
  );
};

// Default export for Part 1
export default TEMPLATE_LIBRARY_PART1;