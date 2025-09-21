// LearningStyleConfig.js - Learning Style Configuration and Template Recommendations
// Based on VARK Learning Model + PACIFIC Learning Science Principles

import { TEMPLATE_LIBRARY_PART1 } from './TemplateLibrary_Part1.js';
import { INTERACTIVE_COMPONENTS } from './TemplateLibrary_Part2.js';

// VARK Learning Style Model Implementation
export const LEARNING_STYLES = {
  visual: {
    name: 'Visual Learner',
    description: 'Learns best through charts, diagrams, images, and visual representations',
    icon: '👁️',
    color: 'var(--dartmouth-green)',
    characteristics: [
      'Prefers diagrams and flowcharts',
      'Remembers information better when seen',
      'Likes color-coded organization',
      'Benefits from mind maps and visual aids'
    ],
    preferredComponents: [
      'visual_mindmap',
      'visual_progress_chart', 
      'visual_image_caption',
      'text_vocabulary',
      'interactive_drag_match'
    ],
    avoidComponents: [
      'interactive_audio_pronunciation'
    ]
  },
  
  auditory: {
    name: 'Auditory Learner',
    description: 'Learns best through listening, discussion, and verbal instruction',
    icon: '👂',
    color: 'var(--oxford-blue)',
    characteristics: [
      'Prefers listening to explanations',
      'Benefits from discussions and verbal repetition',
      'Remembers through rhythm and sound patterns',
      'Likes to read aloud or hear content'
    ],
    preferredComponents: [
      'interactive_audio_pronunciation',
      'text_quote',
      'interactive_multiple_choice',
      'text_paragraph',
      'interactive_flip_card'
    ],
    avoidComponents: [
      'visual_mindmap',
      'interactive_drag_match'
    ]
  },
  
  reading: {
    name: 'Reading/Writing Learner',
    description: 'Learns best through written words, lists, and text-based information',
    icon: '📖',
    color: 'var(--harvard-crimson)',
    characteristics: [
      'Prefers written instructions and notes',
      'Likes lists, definitions, and detailed text',
      'Benefits from writing summaries',
      'Enjoys text-based exercises'
    ],
    preferredComponents: [
      'text_paragraph',
      'text_bullet_list',
      'text_numbered_list',
      'text_vocabulary',
      'text_translation',
      'text_quote'
    ],
    avoidComponents: [
      'visual_mindmap',
      'interactive_audio_pronunciation'
    ]
  },
  
  kinesthetic: {
    name: 'Kinesthetic Learner',
    description: 'Learns best through hands-on activities and physical interaction',
    icon: '✋',
    color: 'var(--tsinghua-purple)',
    characteristics: [
      'Prefers hands-on activities and movement',
      'Benefits from interactive exercises',
      'Likes trial and error learning',
      'Needs to physically manipulate information'
    ],
    preferredComponents: [
      'interactive_drag_match',
      'interactive_flip_card',
      'interactive_multiple_choice',
      'visual_progress_chart',
      'interactive_audio_pronunciation'
    ],
    avoidComponents: [
      'text_paragraph',
      'text_quote'
    ]
  }
};

// Mixed Learning Style Combinations
export const MIXED_LEARNING_STYLES = {
  'visual-auditory': {
    name: 'Visual-Auditory Learner',
    description: 'Combines visual and auditory learning preferences',
    preferredComponents: [
      'visual_mindmap',
      'interactive_audio_pronunciation',
      'visual_image_caption',
      'interactive_multiple_choice',
      'text_vocabulary'
    ]
  },
  
  'visual-kinesthetic': {
    name: 'Visual-Kinesthetic Learner', 
    description: 'Combines visual learning with hands-on interaction',
    preferredComponents: [
      'interactive_drag_match',
      'visual_mindmap',
      'interactive_flip_card',
      'visual_progress_chart',
      'visual_image_caption'
    ]
  },
  
  'auditory-kinesthetic': {
    name: 'Auditory-Kinesthetic Learner',
    description: 'Combines listening with interactive activities',
    preferredComponents: [
      'interactive_audio_pronunciation',
      'interactive_multiple_choice',
      'interactive_flip_card',
      'text_quote',
      'interactive_drag_match'
    ]
  },
  
  'balanced': {
    name: 'Balanced Multi-Modal Learner',
    description: 'Benefits from diverse learning approaches',
    preferredComponents: [
      'visual_mindmap',
      'interactive_audio_pronunciation',
      'text_vocabulary',
      'interactive_drag_match',
      'text_paragraph',
      'visual_progress_chart'
    ]
  }
};

// Learning Style Assessment Questions
export const LEARNING_STYLE_ASSESSMENT = {
  questions: [
    {
      id: 'q1',
      question: 'When learning new vocabulary, you prefer to:',
      options: [
        { text: 'See word cards with images', style: 'visual', weight: 3 },
        { text: 'Hear the words pronounced', style: 'auditory', weight: 3 },
        { text: 'Write the words multiple times', style: 'reading', weight: 3 },
        { text: 'Use the words in conversation practice', style: 'kinesthetic', weight: 3 }
      ]
    },
    {
      id: 'q2',
      question: 'To remember grammar rules, you find it most helpful to:',
      options: [
        { text: 'Study colorful grammar charts', style: 'visual', weight: 2 },
        { text: 'Listen to explanations and examples', style: 'auditory', weight: 2 },
        { text: 'Read detailed grammar explanations', style: 'reading', weight: 2 },
        { text: 'Practice with interactive exercises', style: 'kinesthetic', weight: 2 }
      ]
    },
    {
      id: 'q3',
      question: 'When trying to understand a new concept, you typically:',
      options: [
        { text: 'Look for diagrams or visual examples', style: 'visual', weight: 3 },
        { text: 'Ask someone to explain it verbally', style: 'auditory', weight: 3 },
        { text: 'Read about it in detail', style: 'reading', weight: 3 },
        { text: 'Try it out hands-on', style: 'kinesthetic', weight: 3 }
      ]
    },
    {
      id: 'q4',
      question: 'During lessons, you focus best when:',
      options: [
        { text: 'There are visual aids and colors', style: 'visual', weight: 2 },
        { text: 'You can listen and discuss', style: 'auditory', weight: 2 },
        { text: 'You can take detailed notes', style: 'reading', weight: 2 },
        { text: 'You can interact and participate', style: 'kinesthetic', weight: 2 }
      ]
    },
    {
      id: 'q5',
      question: 'To practice pronunciation, you prefer to:',
      options: [
        { text: 'Watch mouth movements and lip reading', style: 'visual', weight: 1 },
        { text: 'Listen and repeat audio recordings', style: 'auditory', weight: 3 },
        { text: 'Study phonetic transcriptions', style: 'reading', weight: 2 },
        { text: 'Record yourself speaking', style: 'kinesthetic', weight: 2 }
      ]
    },
    {
      id: 'q6',
      question: 'When organizing study materials, you like to:',
      options: [
        { text: 'Use color-coding and visual organization', style: 'visual', weight: 3 },
        { text: 'Create audio summaries', style: 'auditory', weight: 2 },
        { text: 'Make detailed written outlines', style: 'reading', weight: 3 },
        { text: 'Create interactive flashcards', style: 'kinesthetic', weight: 2 }
      ]
    }
  ],

  calculateResults: (answers) => {
    const scores = {
      visual: 0,
      auditory: 0,
      reading: 0,
      kinesthetic: 0
    };

    // Calculate weighted scores
    answers.forEach(answer => {
      const option = LEARNING_STYLE_ASSESSMENT.questions
        .find(q => q.id === answer.questionId)
        ?.options[answer.selectedOption];
      
      if (option) {
        scores[option.style] += option.weight;
      }
    });

    // Determine primary and secondary styles
    const sortedStyles = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .map(([style, score]) => ({ style, score }));

    const primary = sortedStyles[0];
    const secondary = sortedStyles[1];
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);

    // Calculate percentages
    const percentages = Object.entries(scores).reduce((acc, [style, score]) => {
      acc[style] = Math.round((score / total) * 100);
      return acc;
    }, {});

    // Determine if mixed style
    const primaryPercentage = (primary.score / total) * 100;
    const secondaryPercentage = (secondary.score / total) * 100;

    let learningStyle;
    if (primaryPercentage > 50) {
      learningStyle = primary.style;
    } else if (primaryPercentage + secondaryPercentage > 70) {
      const mixedKey = [primary.style, secondary.style].sort().join('-');
      learningStyle = MIXED_LEARNING_STYLES[mixedKey] ? mixedKey : 'balanced';
    } else {
      learningStyle = 'balanced';
    }

    return {
      primaryStyle: primary.style,
      secondaryStyle: secondary.style,
      learningStyle,
      scores,
      percentages,
      recommendations: generateRecommendations(learningStyle)
    };
  }
};

// Generate component recommendations based on learning style
const generateRecommendations = (learningStyle) => {
  const allComponents = {
    ...TEMPLATE_LIBRARY_PART1,
    ...INTERACTIVE_COMPONENTS
  };

  let preferredComponents = [];
  let avoidComponents = [];

  if (LEARNING_STYLES[learningStyle]) {
    // Single learning style
    const style = LEARNING_STYLES[learningStyle];
    preferredComponents = style.preferredComponents || [];
    avoidComponents = style.avoidComponents || [];
  } else if (MIXED_LEARNING_STYLES[learningStyle]) {
    // Mixed learning style
    const mixedStyle = MIXED_LEARNING_STYLES[learningStyle];
    preferredComponents = mixedStyle.preferredComponents || [];
  } else {
    // Balanced - include all components
    preferredComponents = Object.keys(allComponents);
  }

  return {
    recommended: preferredComponents.map(id => {
      const component = Object.values(allComponents).find(comp => comp.id === id);
      return component ? {
        id,
        name: component.name,
        type: component.type,
        category: component.category,
        description: component.description,
        icon: component.icon
      } : null;
    }).filter(Boolean),
    
    avoid: avoidComponents.map(id => {
      const component = Object.values(allComponents).find(comp => comp.id === id);
      return component ? {
        id,
        name: component.name,
        reason: `Less suitable for ${LEARNING_STYLES[learningStyle]?.name}`
      } : null;
    }).filter(Boolean)
  };
};

// Template Preset Configurations
export const PACIFIC_TEMPLATE_PRESETS = {
  'beginner-visual': {
    name: 'Beginner Visual Learner',
    description: 'Perfect for visual learners starting their language journey',
    targetLevel: 'A1-A2',
    learningStyle: 'visual',
    components: [
      { type: 'text_heading', config: { text: 'Lesson Topic', level: 'h2' }},
      { type: 'visual_image_caption', config: { caption: 'Visual context for learning' }},
      { type: 'text_vocabulary', config: { title: 'Key Vocabulary', showPronunciation: true }},
      { type: 'visual_mindmap', config: { centralTopic: 'Main Concept' }},
      { type: 'visual_progress_chart', config: { title: 'Your Progress' }}
    ]
  },

  'intermediate-kinesthetic': {
    name: 'Intermediate Interactive Practice',
    description: 'Hands-on learning for intermediate students',
    targetLevel: 'B1-B2',
    learningStyle: 'kinesthetic',
    components: [
      { type: 'text_heading', config: { text: 'Interactive Practice' }},
      { type: 'interactive_multiple_choice', config: { question: 'Test your knowledge' }},
      { type: 'interactive_drag_match', config: { title: 'Match the pairs' }},
      { type: 'interactive_flip_card', config: { frontText: 'Question', backText: 'Answer' }},
      { type: 'interactive_audio_pronunciation', config: { word: 'Practice word' }}
    ]
  },

  'advanced-reading': {
    name: 'Advanced Text-Based Learning',
    description: 'Comprehensive text-based learning for advanced students',
    targetLevel: 'C1-C2',
    learningStyle: 'reading',
    components: [
      { type: 'text_heading', config: { text: 'Advanced Topic Analysis' }},
      { type: 'text_paragraph', config: { text: 'Detailed explanation and context' }},
      { type: 'text_quote', config: { text: 'Important concept or quote' }},
      { type: 'text_numbered_list', config: { items: ['Step 1', 'Step 2', 'Step 3'] }},
      { type: 'text_translation', config: { layout: 'side-by-side' }}
    ]
  },

  'conversational-auditory': {
    name: 'Conversation-Focused Learning',
    description: 'Audio and discussion-based learning approach',
    targetLevel: 'A2-B2',
    learningStyle: 'auditory',
    components: [
      { type: 'text_heading', config: { text: 'Conversation Practice' }},
      { type: 'interactive_audio_pronunciation', config: { allowRecording: true }},
      { type: 'text_quote', config: { text: 'Common conversational phrase' }},
      { type: 'interactive_multiple_choice', config: { question: 'Choose the correct response' }},
      { type: 'text_translation', config: { layout: 'stacked' }}
    ]
  },

  'balanced-comprehensive': {
    name: 'Comprehensive Multi-Modal Learning',
    description: 'Balanced approach using multiple learning methods',
    targetLevel: 'A1-C2',
    learningStyle: 'balanced',
    components: [
      { type: 'text_heading', config: { text: 'Comprehensive Lesson' }},
      { type: 'text_paragraph', config: { text: 'Introduction and context' }},
      { type: 'visual_image_caption', config: { caption: 'Visual support' }},
      { type: 'text_vocabulary', config: { showExamples: true }},
      { type: 'interactive_flip_card', config: { frontText: 'Question', backText: 'Answer' }},
      { type: 'visual_progress_chart', config: { title: 'Learning Progress' }},
      { type: 'interactive_audio_pronunciation', config: { showPhonetics: true }}
    ]
  }
};

// User Learning Profile Management
export class LearningProfile {
  constructor(userId) {
    this.userId = userId;
    this.profile = this.loadProfile();
  }

  loadProfile() {
    const saved = localStorage.getItem(`pacific_learning_profile_${this.userId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      assessmentCompleted: false,
      learningStyle: 'balanced',
      primaryStyle: null,
      secondaryStyle: null,
      preferences: {
        visualElements: true,
        audioElements: true,
        interactiveElements: true,
        textElements: true
      },
      customizations: {
        colorPreference: 'default',
        fontSize: 'medium',
        animationSpeed: 'normal'
      },
      templateHistory: [],
      lastUpdated: new Date().toISOString()
    };
  }

  saveProfile() {
    localStorage.setItem(
      `pacific_learning_profile_${this.userId}`,
      JSON.stringify(this.profile)
    );
  }

  updateLearningStyle(assessmentResults) {
    this.profile.learningStyle = assessmentResults.learningStyle;
    this.profile.primaryStyle = assessmentResults.primaryStyle;
    this.profile.secondaryStyle = assessmentResults.secondaryStyle;
    this.profile.assessmentCompleted = true;
    this.profile.assessmentResults = assessmentResults;
    this.profile.lastUpdated = new Date().toISOString();
    this.saveProfile();
  }

  getRecommendedComponents() {
    return generateRecommendations(this.profile.learningStyle);
  }

  getRecommendedPresets() {
    const allPresets = Object.values(PACIFIC_TEMPLATE_PRESETS);
    
    if (this.profile.learningStyle === 'balanced') {
      return allPresets;
    }

    // Prioritize presets matching learning style
    return allPresets.sort((a, b) => {
      const aMatches = a.learningStyle === this.profile.learningStyle || 
                      a.learningStyle === this.profile.primaryStyle;
      const bMatches = b.learningStyle === this.profile.learningStyle || 
                      b.learningStyle === this.profile.primaryStyle;
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }

  addTemplateToHistory(templateConfig) {
    this.profile.templateHistory.unshift({
      ...templateConfig,
      createdAt: new Date().toISOString()
    });
    
    // Keep only last 10 templates
    this.profile.templateHistory = this.profile.templateHistory.slice(0, 10);
    this.saveProfile();
  }

  updatePreferences(preferences) {
    this.profile.preferences = { ...this.profile.preferences, ...preferences };
    this.profile.lastUpdated = new Date().toISOString();
    this.saveProfile();
  }

  updateCustomizations(customizations) {
    this.profile.customizations = { ...this.profile.customizations, ...customizations };
    this.profile.lastUpdated = new Date().toISOString();
    this.saveProfile();
  }
}

// Export main learning style configuration
export default {
  LEARNING_STYLES,
  MIXED_LEARNING_STYLES,
  LEARNING_STYLE_ASSESSMENT,
  PACIFIC_TEMPLATE_PRESETS,
  LearningProfile,
  generateRecommendations
};