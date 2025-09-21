// TemplateEditor.jsx - Part 1: Core Editor Foundation & Canvas Setup
// Main drag & drop interface for creating custom learning templates

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PACIFIC_DRAG_DROP_CORE, 
  createDropZone, 
  handleDragStart, 
  handleDragEnd,
  calculateDropPosition,
  snapToGrid 
} from './DragDropCore.js';
import { TEMPLATE_LIBRARY_PART1 } from './TemplateLibrary_Part1.js';
import { INTERACTIVE_COMPONENTS } from './TemplateLibrary_Part2.js';
import { LearningProfile } from './LearningStyleConfig.js';

// Template Editor Configuration
const EDITOR_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 1000,
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  minComponentWidth: 100,
  minComponentHeight: 50,
  maxComponents: 20,
  autoSave: true,
  autoSaveInterval: 30000 // 30 seconds
};

// Editor States
const EDITOR_STATES = {
  IDLE: 'idle',
  DRAGGING: 'dragging',
  RESIZING: 'resizing',
  SELECTING: 'selecting',
  EDITING: 'editing'
};

const TemplateEditor = ({ 
  userProfile, 
  initialTemplate = null,
  onSave,
  onPreview,
  onTemplateChange,
  readonly = false
}) => {
  // Core Editor State
  const [editorState, setEditorState] = useState(EDITOR_STATES.IDLE);
  const [canvasComponents, setCanvasComponents] = useState(initialTemplate?.components || []);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [templateMetadata, setTemplateMetadata] = useState({
    name: initialTemplate?.name || 'New Template',
    description: initialTemplate?.description || 'Custom learning template',
    learningStyle: initialTemplate?.learningStyle || userProfile?.learningStyle || 'balanced',
    targetLevel: initialTemplate?.targetLevel || 'A1-A2',
    language: initialTemplate?.language || 'english',
    tags: initialTemplate?.tags || [],
    createdAt: initialTemplate?.createdAt || new Date().toISOString(),
    lastModified: new Date().toISOString()
  });

  // Canvas References
  const canvasRef = useRef(null);
  const dragOverlayRef = useRef(null);
  const componentRefs = useRef({});

  // Learning Profile Integration
  const [learningProfile] = useState(() => 
    userProfile ? new LearningProfile(userProfile.id) : null
  );
  const [recommendedComponents, setRecommendedComponents] = useState([]);

  // Template History & Undo/Redo
  const [templateHistory, setTemplateHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // UI State
  const [showGrid, setShowGrid] = useState(EDITOR_CONFIG.showGrid);
  const [snapToGrid, setSnapToGridState] = useState(EDITOR_CONFIG.snapToGrid);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  // Initialize component library
  const [availableComponents] = useState(() => ({
    ...TEMPLATE_LIBRARY_PART1,
    ...INTERACTIVE_COMPONENTS
  }));

  // Initialize recommended components based on learning style
  useEffect(() => {
    if (learningProfile) {
      const recommended = learningProfile.getRecommendedComponents();
      setRecommendedComponents(recommended.recommended || []);
    }
  }, [learningProfile]);

  // Auto-save functionality
  useEffect(() => {
    if (!EDITOR_CONFIG.autoSave || readonly) return;

    const autoSaveTimer = setInterval(() => {
      if (canvasComponents.length > 0) {
        saveTemplate(true); // Auto-save
      }
    }, EDITOR_CONFIG.autoSaveInterval);

    return () => clearInterval(autoSaveTimer);
  }, [canvasComponents]);

  // Template history management
  const addToHistory = useCallback((components, metadata) => {
    const newHistoryItem = {
      components: JSON.parse(JSON.stringify(components)),
      metadata: { ...metadata },
      timestamp: new Date().toISOString()
    };

    setTemplateHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newHistoryItem);
      
      // Keep only last 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = templateHistory[historyIndex - 1];
      setCanvasComponents(previousState.components);
      setTemplateMetadata(previousState.metadata);
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex, templateHistory]);

  // Redo functionality  
  const redo = useCallback(() => {
    if (historyIndex < templateHistory.length - 1) {
      const nextState = templateHistory[historyIndex + 1];
      setCanvasComponents(nextState.components);
      setTemplateMetadata(nextState.metadata);
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, templateHistory]);

  // Canvas event handlers
  const handleCanvasClick = useCallback((e) => {
    if (readonly) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - canvasOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - canvasOffset.y) / zoomLevel;

    // Deselect component if clicking on empty canvas
    const clickedOnComponent = e.target.closest('.pacific-canvas-component');
    if (!clickedOnComponent) {
      setSelectedComponent(null);
      setEditorState(EDITOR_STATES.IDLE);
    }
  }, [canvasOffset, zoomLevel, readonly]);

  const handleComponentSelect = useCallback((componentId) => {
    if (readonly) return;
    
    setSelectedComponent(componentId);
    setEditorState(EDITOR_STATES.SELECTING);
  }, [readonly]);

  const handleComponentDelete = useCallback((componentId) => {
    if (readonly) return;

    setCanvasComponents(prev => {
      const updated = prev.filter(comp => comp.id !== componentId);
      addToHistory(updated, templateMetadata);
      return updated;
    });
    
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
      setEditorState(EDITOR_STATES.IDLE);
    }
  }, [selectedComponent, templateMetadata, addToHistory, readonly]);

  // Component positioning and manipulation
  const updateComponentPosition = useCallback((componentId, newPosition) => {
    if (readonly) return;

    const snappedPosition = snapToGrid ? 
      snapToGrid(newPosition, EDITOR_CONFIG.gridSize) : 
      newPosition;

    setCanvasComponents(prev => {
      const updated = prev.map(comp => 
        comp.id === componentId ? 
          { ...comp, position: snappedPosition } : 
          comp
      );
      return updated;
    });
  }, [snapToGrid, readonly]);

  const updateComponentConfig = useCallback((componentId, newConfig) => {
    if (readonly) return;

    setCanvasComponents(prev => {
      const updated = prev.map(comp => 
        comp.id === componentId ? 
          { ...comp, config: { ...comp.config, ...newConfig } } : 
          comp
      );
      addToHistory(updated, templateMetadata);
      return updated;
    });
  }, [templateMetadata, addToHistory, readonly]);

  // Template management
  const saveTemplate = useCallback((isAutoSave = false) => {
    const templateData = {
      ...templateMetadata,
      components: canvasComponents,
      lastModified: new Date().toISOString(),
      version: '1.0',
      editorVersion: '1.0'
    };

    if (learningProfile && !isAutoSave) {
      learningProfile.addTemplateToHistory(templateData);
    }

    if (onSave) {
      onSave(templateData, isAutoSave);
    }

    if (onTemplateChange) {
      onTemplateChange(templateData);
    }
  }, [canvasComponents, templateMetadata, learningProfile, onSave, onTemplateChange]);

  const loadTemplate = useCallback((templateData) => {
    if (readonly) return;

    setCanvasComponents(templateData.components || []);
    setTemplateMetadata({
      ...templateData,
      lastModified: new Date().toISOString()
    });
    
    // Clear history and add initial state
    setTemplateHistory([{
      components: templateData.components || [],
      metadata: templateData,
      timestamp: new Date().toISOString()
    }]);
    setHistoryIndex(0);
  }, [readonly]);

  const clearCanvas = useCallback(() => {
    if (readonly) return;

    setCanvasComponents([]);
    setSelectedComponent(null);
    setEditorState(EDITOR_STATES.IDLE);
    addToHistory([], templateMetadata);
  }, [templateMetadata, addToHistory, readonly]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (readonly) return;

      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      
      // Save: Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveTemplate();
      }
      
      // Delete selected component: Delete key
      if (e.key === 'Delete' && selectedComponent) {
        e.preventDefault();
        handleComponentDelete(selectedComponent);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveTemplate, selectedComponent, handleComponentDelete, readonly]);

  return (
    <div className="pacific-template-editor">
      {/* Editor Header */}
      <div className="editor-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: 'var(--card)',
        borderBottom: '2px solid var(--border)',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <div className="template-info">
          <h2 style={{
            color: 'var(--harvard-crimson)',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {templateMetadata.name}
          </h2>
          <p style={{
            color: 'var(--medium-grey)',
            margin: '0.25rem 0 0 0',
            fontSize: '0.9rem'
          }}>
            {templateMetadata.description} • Target Level: {templateMetadata.targetLevel}
          </p>
        </div>

        <div className="editor-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          {!readonly && (
            <>
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: historyIndex <= 0 ? 'var(--muted)' : 'var(--oxford-blue)',
                  color: historyIndex <= 0 ? 'var(--medium-grey)' : 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                Undo
              </button>
              
              <button
                onClick={redo}
                disabled={historyIndex >= templateHistory.length - 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: historyIndex >= templateHistory.length - 1 ? 'var(--muted)' : 'var(--oxford-blue)',
                  color: historyIndex >= templateHistory.length - 1 ? 'var(--medium-grey)' : 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: historyIndex >= templateHistory.length - 1 ? 'not-allowed' : 'pointer',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                Redo
              </button>
              
              <button
                onClick={clearCanvas}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--harvard-crimson)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                Clear All
              </button>
            </>
          )}
          
          <button
            onClick={() => saveTemplate()}
            disabled={readonly}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: readonly ? 'var(--muted)' : 'var(--dartmouth-green)',
              color: readonly ? 'var(--medium-grey)' : 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: readonly ? 'not-allowed' : 'pointer',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {readonly ? 'Read Only' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="editor-toolbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--muted)',
        borderBottom: '1px solid var(--border)',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <div className="view-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              disabled={readonly}
            />
            <span style={{ color: 'var(--dark-charcoal-grey)' }}>Show Grid</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGridState(e.target.checked)}
              disabled={readonly}
            />
            <span style={{ color: 'var(--dark-charcoal-grey)' }}>Snap to Grid</span>
          </label>
        </div>

        <div className="zoom-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.25, prev - 0.25))}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            -
          </button>
          
          <span style={{ 
            color: 'var(--dark-charcoal-grey)',
            minWidth: '4rem',
            textAlign: 'center'
          }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          
          <button
            onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            +
          </button>
          
          <button
            onClick={() => setZoomLevel(1)}
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: 'var(--harvard-crimson)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Reset
          </button>
        </div>

        <div className="canvas-info" style={{ color: 'var(--medium-grey)', fontSize: '0.9rem' }}>
          Components: {canvasComponents.length}/{EDITOR_CONFIG.maxComponents} • 
          State: {editorState} • 
          Learning Style: {templateMetadata.learningStyle}
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="editor-main" style={{
        display: 'grid',
        gridTemplateColumns: readonly ? '1fr' : '250px 1fr 300px',
        height: 'calc(100vh - 200px)',
        overflow: 'hidden'
      }}>
        
        {/* Component Palette - Hidden in readonly mode */}
        {!readonly && (
          <div className="component-palette" style={{
            backgroundColor: 'var(--card)',
            borderRight: '2px solid var(--border)',
            overflowY: 'auto',
            padding: '1rem'
          }}>
            <h3 style={{
              fontFamily: '"Times New Roman", Times, serif',
              color: 'var(--harvard-crimson)',
              marginBottom: '1rem',
              fontSize: '1.1rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Component Library
            </h3>
            
            {/* Recommended Components */}
            {recommendedComponents.length > 0 && (
              <div className="recommended-components" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  color: 'var(--dartmouth-green)',
                  fontSize: '0.95rem',
                  marginBottom: '0.75rem',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  Recommended for You
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recommendedComponents.slice(0, 5).map(component => (
                    <div
                      key={component.id}
                      className="palette-component recommended"
                      draggable
                      onDragStart={(e) => handleDragStart(e, component)}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--dartmouth-green)',
                        color: 'var(--warm-white)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'grab',
                        fontSize: '0.85rem',
                        fontFamily: '"Times New Roman", Times, serif',
                        border: '2px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateX(2px)';
                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateX(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        {component.icon} {component.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        opacity: 0.9, 
                        marginTop: '0.25rem' 
                      }}>
                        {component.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* All Components by Category */}
            <div className="all-components">
              <h4 style={{
                fontFamily: '"Times New Roman", Times, serif',
                color: 'var(--dark-charcoal-grey)',
                fontSize: '0.95rem',
                marginBottom: '0.75rem',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                All Components
              </h4>
              
              {/* Component categories will be rendered here */}
              <div style={{ fontSize: '0.85rem', color: 'var(--medium-grey)' }}>
                Component palette will be completed in Part 2...
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div 
          className="canvas-container"
          style={{
            position: 'relative',
            backgroundColor: 'var(--cream-background)',
            overflow: 'auto',
            border: readonly ? 'none' : '2px solid var(--border)'
          }}
          onClick={handleCanvasClick}
        >
          <div
            ref={canvasRef}
            className="pacific-template-canvas"
            style={{
              width: `${EDITOR_CONFIG.canvasWidth * zoomLevel}px`,
              height: `${EDITOR_CONFIG.canvasHeight * zoomLevel}px`,
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
              transformOrigin: 'top left',
              position: 'relative',
              backgroundImage: showGrid ? 
                `radial-gradient(circle, var(--border) 1px, transparent 1px)` : 
                'none',
              backgroundSize: showGrid ? 
                `${EDITOR_CONFIG.gridSize * zoomLevel}px ${EDITOR_CONFIG.gridSize * zoomLevel}px` : 
                'auto',
              cursor: editorState === EDITOR_STATES.DRAGGING ? 'grabbing' : 'default'
            }}
          >
            {/* Canvas components will be rendered here */}
            {canvasComponents.length === 0 && !readonly && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'var(--medium-grey)',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                <h3>Start Building Your Template</h3>
                <p>Drag components from the palette to create your custom learning template</p>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel - Hidden in readonly mode */}
        {!readonly && (
          <div className="properties-panel" style={{
            backgroundColor: 'var(--card)',
            borderLeft: '2px solid var(--border)',
            overflowY: 'auto',
            padding: '1rem'
          }}>
            <h3 style={{
              fontFamily: '"Times New Roman", Times, serif',
              color: 'var(--harvard-crimson)',
              marginBottom: '1rem',
              fontSize: '1.1rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Properties
            </h3>

            {selectedComponent ? (
              <div>
                <p style={{ 
                  color: 'var(--dark-charcoal-grey)',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  Selected: {selectedComponent}
                </p>
                <div style={{ fontSize: '0.85rem', color: 'var(--medium-grey)' }}>
                  Component properties panel will be completed in Part 2...
                </div>
              </div>
            ) : (
              <p style={{ 
                color: 'var(--medium-grey)',
                fontFamily: '"Times New Roman", Times, serif',
                fontStyle: 'italic'
              }}>
                Select a component to edit its properties
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;