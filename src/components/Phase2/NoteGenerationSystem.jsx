// NoteGenerationSystem.jsx - AI-Generated Concise Learning Notes
// Automatically creates concise notes from lesson content without complex UI

import React, { useState, useEffect, useRef } from 'react';

// Note templates for different content types
const NOTE_TEMPLATES = {
  vocabulary: {
    sections: ['key_terms', 'examples', 'usage_tips'],
    maxLength: 200,
    format: 'bulleted'
  },
  grammar: {
    sections: ['rule_summary', 'examples', 'common_mistakes'],
    maxLength: 250,
    format: 'structured'
  },
  culture: {
    sections: ['key_insights', 'practical_applications', 'context'],
    maxLength: 180,
    format: 'narrative'
  },
  conversation: {
    sections: ['phrases', 'scenarios', 'tips'],
    maxLength: 200,
    format: 'practical'
  }
};

// AI content analysis patterns
const CONTENT_PATTERNS = {
  vocabulary_indicators: ['word', 'term', 'meaning', 'definition', 'vocabulary'],
  grammar_indicators: ['rule', 'structure', 'form', 'tense', 'grammar'],
  culture_indicators: ['culture', 'tradition', 'custom', 'social', 'cultural'],
  conversation_indicators: ['phrase', 'conversation', 'dialogue', 'speaking', 'say']
};

const NoteGenerationSystem = ({
  lessonContent,
  lessonId,
  lessonTitle,
  userProgress,
  onNotesGenerated,
  onNotesUpdated,
  isEnabled = true
}) => {
  // State
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [notesVisible, setNotesVisible] = useState(false);
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true);
  const [savedNotes, setSavedNotes] = useState([]);
  const [noteHistory, setNoteHistory] = useState([]);

  // Refs
  const generationTimeoutRef = useRef(null);
  const lastLessonIdRef = useRef(null);

  // Auto-generate notes when lesson content changes
  useEffect(() => {
    if (!lessonContent || !autoGenerateEnabled || !isEnabled) return;
    
    // Only generate if this is a new lesson
    if (lastLessonIdRef.current !== lessonId) {
      lastLessonIdRef.current = lessonId;
      
      // Delay generation to avoid interrupting learning flow
      generationTimeoutRef.current = setTimeout(() => {
        generateNotesFromContent();
      }, 2000);
    }
    
    return () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, [lessonContent, lessonId, autoGenerateEnabled, isEnabled]);

  // Load saved notes on component mount
  useEffect(() => {
    loadSavedNotes();
  }, [lessonId]);

  // Main AI note generation function
  const generateNotesFromContent = async () => {
    if (!lessonContent || isGenerating) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Step 1: Analyze content type (25%)
      setGenerationProgress(25);
      const contentType = analyzeContentType(lessonContent);
      
      // Step 2: Extract key information (50%)
      setGenerationProgress(50);
      const keyInformation = extractKeyInformation(lessonContent, contentType);
      
      // Step 3: Generate concise notes (75%)
      setGenerationProgress(75);
      const notes = generateConciseNotes(keyInformation, contentType);
      
      // Step 4: Format and finalize (100%)
      setGenerationProgress(100);
      const finalNotes = formatNotes(notes, contentType);
      
      const notePackage = {
        id: `notes_${lessonId}_${Date.now()}`,
        lessonId,
        lessonTitle,
        contentType,
        notes: finalNotes,
        timestamp: new Date().toISOString(),
        wordCount: finalNotes.content?.length || 0,
        keyTopics: finalNotes.keyTopics || [],
        generatedFrom: 'ai_auto'
      };
      
      setGeneratedNotes(notePackage);
      setSavedNotes(prev => [notePackage, ...prev.slice(0, 19)]); // Keep last 20
      setNoteHistory(prev => [notePackage, ...prev.slice(0, 9)]); // Keep last 10 in history
      
      // Save to storage
      saveNotesToStorage(notePackage);
      
      if (onNotesGenerated) {
        onNotesGenerated(notePackage);
      }
      
    } catch (error) {
      console.error('Note generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Analyze content type using AWS AI API
  const analyzeContentType = async (content) => {
    try {
      const contentText = extractTextFromContent(content);
      
      const response = await fetch('/api/ai/analyze-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentText,
          task: 'content_classification',
          options: ['vocabulary', 'grammar', 'culture', 'conversation']
        })
      });
      
      if (!response.ok) throw new Error('AI API failed');
      
      const result = await response.json();
      return result.contentType || 'vocabulary';
      
    } catch (error) {
      console.error('AI content analysis failed:', error);
      // Fallback to simple keyword matching
      return analyzeContentTypeFallback(content);
    }
  };

  // Fallback content analysis if AI API fails
  const analyzeContentTypeFallback = (content) => {
    const contentText = extractTextFromContent(content).toLowerCase();
    const scores = {};
    
    Object.entries(CONTENT_PATTERNS).forEach(([type, indicators]) => {
      const typeKey = type.replace('_indicators', '');
      scores[typeKey] = indicators.reduce((score, indicator) => {
        const regex = new RegExp(indicator, 'gi');
        const matches = contentText.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0);
    });
    
    const topType = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topType[1] > 0 ? topType[0] : 'vocabulary';
  };

  // Extract text content from complex lesson structure
  const extractTextFromContent = (content) => {
    if (typeof content === 'string') return content;
    
    let text = '';
    
    // Handle different content structures
    if (content.sections) {
      content.sections.forEach(section => {
        text += section.content || section.text || '';
        if (section.examples) {
          text += ' ' + section.examples.join(' ');
        }
      });
    }
    
    if (content.vocabulary) {
      content.vocabulary.forEach(item => {
        text += ` ${item.word} ${item.definition} ${item.example || ''}`;
      });
    }
    
    if (content.dialogue) {
      content.dialogue.forEach(line => {
        text += ` ${line.speaker}: ${line.text}`;
      });
    }
    
    if (content.text) text += content.text;
    if (content.content) text += content.content;
    
    return text;
  };

  // Extract key information using AWS AI API
  const extractKeyInformation = async (content, contentType) => {
    try {
      const contentText = extractTextFromContent(content);
      
      const response = await fetch('/api/ai/extract-information', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentText,
          contentType,
          extractionTasks: [
            'main_concepts',
            'key_terms', 
            'examples',
            'practical_tips',
            'cultural_notes'
          ]
        })
      });
      
      if (!response.ok) throw new Error('AI extraction failed');
      
      const result = await response.json();
      return {
        mainConcepts: result.main_concepts || [],
        keyTerms: result.key_terms || [],
        examples: result.examples || [],
        practicalTips: result.practical_tips || [],
        culturalNotes: result.cultural_notes || []
      };
      
    } catch (error) {
      console.error('AI information extraction failed:', error);
      // Fallback to manual extraction
      return extractKeyInformationFallback(content, contentType);
    }
  };

  // Fallback extraction if AI API fails
  const extractKeyInformationFallback = (content, contentType) => {
    const info = {
      mainConcepts: [],
      keyTerms: [],
      examples: [],
      practicalTips: [],
      culturalNotes: []
    };
    
    // Basic extraction from structured content
    if (content.vocabulary) {
      info.keyTerms = content.vocabulary.map(item => ({
        word: item.word || item.term,
        definition: item.definition || item.meaning
      }));
    }
    
    if (content.examples) {
      info.examples = content.examples;
    }
    
    if (content.sections) {
      content.sections.forEach(section => {
        if (section.type === 'concept') {
          info.mainConcepts.push(section.title || section.content);
        }
      });
    }
    
    return info;
  };

  // Generate concise notes using AWS AI API
  const generateConciseNotes = async (keyInfo, contentType) => {
    try {
      const template = NOTE_TEMPLATES[contentType];
      
      const response = await fetch('/api/ai/generate-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyInformation: keyInfo,
          contentType,
          template: {
            sections: template.sections,
            maxLength: template.maxLength,
            format: template.format
          },
          requirements: {
            concise: true,
            studentFriendly: true,
            actionable: true
          }
        })
      });
      
      if (!response.ok) throw new Error('AI note generation failed');
      
      const result = await response.json();
      return {
        keyTopics: result.key_topics || [],
        content: result.content || '',
        sections: result.sections || {}
      };
      
    } catch (error) {
      console.error('AI note generation failed:', error);
      // Fallback to template-based generation
      return generateConciseNotesFallback(keyInfo, contentType);
    }
  };

  // Fallback note generation if AI API fails
  const generateConciseNotesFallback = (keyInfo, contentType) => {
    const template = NOTE_TEMPLATES[contentType];
    const notes = {
      keyTopics: [],
      content: '',
      sections: {}
    };
    
    // Generate content based on template
    template.sections.forEach(sectionType => {
      switch (sectionType) {
        case 'key_terms':
          if (keyInfo.keyTerms.length > 0) {
            notes.sections.keyTerms = keyInfo.keyTerms.slice(0, 5);
            notes.keyTopics.push('Key Terms');
          }
          break;
          
        case 'examples':
          if (keyInfo.examples.length > 0) {
            notes.sections.examples = keyInfo.examples.slice(0, 3);
            notes.keyTopics.push('Examples');
          }
          break;
          
        case 'usage_tips':
        case 'tips':
          if (keyInfo.practicalTips.length > 0) {
            notes.sections.tips = keyInfo.practicalTips.slice(0, 3);
            notes.keyTopics.push('Tips');
          }
          break;
          
        case 'rule_summary':
          if (keyInfo.mainConcepts.length > 0) {
            notes.sections.rules = keyInfo.mainConcepts.slice(0, 2);
            notes.keyTopics.push('Rules');
          }
          break;
          
        case 'key_insights':
          if (keyInfo.culturalNotes.length > 0) {
            notes.sections.insights = keyInfo.culturalNotes.slice(0, 3);
            notes.keyTopics.push('Cultural Insights');
          }
          break;
      }
    });
    
    return notes;
  };

  // Format notes according to template
  const formatNotes = (notes, contentType) => {
    const template = NOTE_TEMPLATES[contentType];
    let formattedContent = '';
    
    switch (template.format) {
      case 'bulleted':
        formattedContent = formatBulletedNotes(notes);
        break;
      case 'structured':
        formattedContent = formatStructuredNotes(notes);
        break;
      case 'narrative':
        formattedContent = formatNarrativeNotes(notes);
        break;
      case 'practical':
        formattedContent = formatPracticalNotes(notes);
        break;
    }
    
    // Ensure content doesn't exceed max length
    if (formattedContent.length > template.maxLength) {
      formattedContent = formattedContent.substring(0, template.maxLength - 3) + '...';
    }
    
    return {
      ...notes,
      content: formattedContent,
      format: template.format,
      wordCount: formattedContent.split(' ').length
    };
  };

  // Format as bulleted notes
  const formatBulletedNotes = (notes) => {
    let content = '';
    
    if (notes.sections.keyTerms) {
      content += 'Key Terms:\n';
      notes.sections.keyTerms.forEach(term => {
        content += `• ${term.word}: ${term.definition}\n`;
      });
      content += '\n';
    }
    
    if (notes.sections.examples) {
      content += 'Examples:\n';
      notes.sections.examples.forEach(example => {
        content += `• ${example}\n`;
      });
      content += '\n';
    }
    
    if (notes.sections.tips) {
      content += 'Tips:\n';
      notes.sections.tips.forEach(tip => {
        content += `• ${tip}\n`;
      });
    }
    
    return content.trim();
  };

  // Extract vocabulary terms
  const extractVocabularyTerms = (content) => {
    const terms = [];
    
    if (content.vocabulary) {
      content.vocabulary.forEach(item => {
        terms.push({
          word: item.word || item.term,
          definition: item.definition || item.meaning,
          example: item.example
        });
      });
    }
    
    return terms;
  };

  // Extract usage examples
  const extractUsageExamples = (content) => {
    const examples = [];
    
    if (content.examples) {
      examples.push(...content.examples);
    }
    
    if (content.vocabulary) {
      content.vocabulary.forEach(item => {
        if (item.example) examples.push(item.example);
      });
    }
    
    return examples;
  };

  // Extract practical tips from text
  const extractVocabularyTips = (text) => {
    const tips = [];
    const tipKeywords = ['tip:', 'remember:', 'note:', 'important:', 'be careful'];
    
    tipKeywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}([^.!?]*[.!?])`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          tips.push(match.replace(keyword, '').trim());
        });
      }
    });
    
    return tips;
  };

  // Save notes to localStorage
  const saveNotesToStorage = (notePackage) => {
    try {
      const existingNotes = JSON.parse(localStorage.getItem('pacific_notes') || '[]');
      const updatedNotes = [notePackage, ...existingNotes.slice(0, 49)]; // Keep last 50
      localStorage.setItem('pacific_notes', JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  // Load saved notes
  const loadSavedNotes = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('pacific_notes') || '[]');
      const lessonNotes = saved.filter(note => note.lessonId === lessonId);
      setSavedNotes(lessonNotes);
      
      if (lessonNotes.length > 0) {
        setGeneratedNotes(lessonNotes[0]); // Most recent
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  // Manual note generation trigger
  const handleManualGenerate = () => {
    if (!isGenerating) {
      generateNotesFromContent();
    }
  };

  // Toggle notes visibility
  const toggleNotesVisibility = () => {
    setNotesVisible(!notesVisible);
  };

  // Toggle auto-generation
  const toggleAutoGenerate = () => {
    setAutoGenerateEnabled(!autoGenerateEnabled);
  };

  if (!isEnabled) return null;

  return (
    <div className="note-generation-system" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '320px',
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 2000,
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      {/* Header Controls */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1rem',
          color: 'var(--harvard-crimson)'
        }}>
          Lesson Notes
        </h3>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={toggleAutoGenerate}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              backgroundColor: autoGenerateEnabled ? 'var(--dartmouth-green)' : 'var(--medium-grey)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            Auto
          </button>
          
          <button
            onClick={toggleNotesVisibility}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              backgroundColor: 'var(--oxford-blue)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            {notesVisible ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div style={{ padding: '1rem' }}>
          <div style={{
            width: '100%',
            height: '3px',
            backgroundColor: 'var(--muted)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: `${generationProgress}%`,
              height: '100%',
              backgroundColor: 'var(--harvard-crimson)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.8rem',
            color: 'var(--medium-grey)',
            textAlign: 'center'
          }}>
            Generating notes... {generationProgress}%
          </p>
        </div>
      )}

      {/* Notes Content */}
      {notesVisible && generatedNotes && !isGenerating && (
        <div style={{
          padding: '1rem',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--medium-grey)',
              marginBottom: '0.5rem'
            }}>
              {generatedNotes.contentType.toUpperCase()} • {generatedNotes.wordCount} words
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--dark-charcoal-grey)',
              lineHeight: '1.4',
              whiteSpace: 'pre-line'
            }}>
              {generatedNotes.notes.content}
            </div>
          </div>
          
          {generatedNotes.notes.keyTopics.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              {generatedNotes.notes.keyTopics.map((topic, index) => (
                <span key={index} style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.7rem',
                  backgroundColor: 'var(--tsinghua-purple)',
                  color: 'var(--warm-white)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {topic}
                </span>
              ))}
            </div>
          )}
          
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--medium-grey)',
            textAlign: 'center'
          }}>
            Generated {new Date(generatedNotes.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Manual Generate Button */}
      {!isGenerating && (!generatedNotes || !notesVisible) && (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <button
            onClick={handleManualGenerate}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--harvard-crimson)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}
          >
            Generate Notes
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteGenerationSystem;