// TemplatePreview.jsx - Part 1: Core Preview Foundation & View Controls
// Live template preview with responsive design and interaction simulation

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TEMPLATE_LIBRARY_PART1 } from './TemplateLibrary_Part1.js';
import { INTERACTIVE_COMPONENTS } from './TemplateLibrary_Part2.js';
import { LEARNING_STYLES } from './LearningStyleConfig.js';

// Preview Configuration
const PREVIEW_CONFIG = {
  defaultViewport: 'desktop',
  viewports: {
    mobile: { width: 375, height: 667, label: 'Mobile', icon: '📱' },
    tablet: { width: 768, height: 1024, label: 'Tablet', icon: '📱' },
    desktop: { width: 1200, height: 800, label: 'Desktop', icon: '🖥️' }
  },
  simulationSpeed: 'normal',
  speeds: {
    slow: { multiplier: 0.5, label: 'Slow' },
    normal: { multiplier: 1, label: 'Normal' },
    fast: { multiplier: 2, label: 'Fast' }
  },
  printOptions: {
    orientation: 'portrait',
    size: 'A4',
    includeInteractive: false
  }
};

// Preview States
const PREVIEW_STATES = {
  LOADING: 'loading',
  READY: 'ready',
  SIMULATING: 'simulating',
  ERROR: 'error',
  EXPORTING: 'exporting'
};

const TemplatePreview = ({
  template,
  userProfile = null,
  onClose,
  onEdit,
  onShare,
  onExport,
  allowSimulation = true,
  showControls = true,
  fullscreen = false
}) => {
  // Core Preview State
  const [previewState, setPreviewState] = useState(PREVIEW_STATES.LOADING);
  const [currentViewport, setCurrentViewport] = useState(PREVIEW_CONFIG.defaultViewport);
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState('normal');
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Template Data
  const [templateData, setTemplateData] = useState(null);
  const [templateComponents, setTemplateComponents] = useState([]);
  const [templateErrors, setTemplateErrors] = useState([]);
  
  // Preview Options
  const [showGrid, setShowGrid] = useState(false);
  const [showBounds, setShowBounds] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [interactiveMode, setInteractiveMode] = useState(true);
  
  // Refs
  const previewContainerRef = useRef(null);
  const templateRef = useRef(null);
  const printRef = useRef(null);

  // Component Library
  const [availableComponents] = useState(() => ({
    ...TEMPLATE_LIBRARY_PART1,
    ...INTERACTIVE_COMPONENTS
  }));

  // Initialize template data
  useEffect(() => {
    if (template) {
      loadTemplate(template);
    }
  }, [template]);

  // Load and validate template
  const loadTemplate = useCallback(async (templateToLoad) => {
    setPreviewState(PREVIEW_STATES.LOADING);
    
    try {
      // Validate template structure
      const validation = validateTemplate(templateToLoad);
      if (validation.errors.length > 0) {
        setTemplateErrors(validation.errors);
      }

      // Process template components
      const processedComponents = await processTemplateComponents(templateToLoad.components || []);
      
      setTemplateData(templateToLoad);
      setTemplateComponents(processedComponents);
      setPreviewState(PREVIEW_STATES.READY);
      
    } catch (error) {
      console.error('Error loading template:', error);
      setPreviewState(PREVIEW_STATES.ERROR);
      setTemplateErrors([{
        type: 'loading_error',
        message: 'Failed to load template',
        details: error.message
      }]);
    }
  }, []);

  // Validate template structure
  const validateTemplate = useCallback((template) => {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!template.name) {
      errors.push({
        type: 'missing_field',
        field: 'name',
        message: 'Template name is required'
      });
    }

    if (!template.components || !Array.isArray(template.components)) {
      errors.push({
        type: 'invalid_structure',
        field: 'components',
        message: 'Template must have a components array'
      });
      return { errors, warnings };
    }

    // Validate components
    template.components.forEach((component, index) => {
      if (!component.id) {
        errors.push({
          type: 'missing_component_id',
          component: index,
          message: `Component at index ${index} missing ID`
        });
      }

      if (!component.componentType) {
        errors.push({
          type: 'missing_component_type',
          component: component.id || index,
          message: 'Component missing type information'
        });
      }

      // Check if component type exists
      const componentDef = availableComponents[component.componentType];
      if (!componentDef) {
        errors.push({
          type: 'unknown_component_type',
          component: component.id || index,
          message: `Unknown component type: ${component.componentType}`
        });
      }

      // Validate position
      if (!component.position || typeof component.position.x !== 'number' || typeof component.position.y !== 'number') {
        warnings.push({
          type: 'invalid_position',
          component: component.id || index,
          message: 'Component has invalid position data'
        });
      }
    });

    // Check for overlapping components
    const overlaps = checkComponentOverlaps(template.components);
    if (overlaps.length > 0) {
      warnings.push({
        type: 'component_overlaps',
        message: `${overlaps.length} component(s) may be overlapping`,
        details: overlaps
      });
    }

    return { errors, warnings };
  }, [availableComponents]);

  // Process template components for rendering
  const processTemplateComponents = useCallback(async (components) => {
    return components.map(component => {
      const componentDef = availableComponents[component.componentType];
      
      if (!componentDef) {
        return {
          ...component,
          error: `Unknown component type: ${component.componentType}`,
          componentDef: null
        };
      }

      return {
        ...component,
        componentDef,
        processedAt: new Date().toISOString()
      };
    });
  }, [availableComponents]);

  // Check for component overlaps
  const checkComponentOverlaps = useCallback((components) => {
    const overlaps = [];
    
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const comp1 = components[i];
        const comp2 = components[j];
        
        if (componentsOverlap(comp1, comp2)) {
          overlaps.push({
            component1: comp1.id,
            component2: comp2.id,
            severity: calculateOverlapSeverity(comp1, comp2)
          });
        }
      }
    }
    
    return overlaps;
  }, []);

  // Check if two components overlap
  const componentsOverlap = (comp1, comp2) => {
    const rect1 = {
      left: comp1.position.x,
      top: comp1.position.y,
      right: comp1.position.x + (comp1.size?.width || 200),
      bottom: comp1.position.y + (comp1.size?.height || 100)
    };
    
    const rect2 = {
      left: comp2.position.x,
      top: comp2.position.y,
      right: comp2.position.x + (comp2.size?.width || 200),
      bottom: comp2.position.y + (comp2.size?.height || 100)
    };
    
    return !(rect1.right < rect2.left || 
             rect2.right < rect1.left || 
             rect1.bottom < rect2.top || 
             rect2.bottom < rect1.top);
  };

  // Calculate overlap severity (0-1)
  const calculateOverlapSeverity = (comp1, comp2) => {
    // Implementation for overlap severity calculation
    return 0.5; // Placeholder
  };

  // Viewport management
  const changeViewport = useCallback((viewport) => {
    setCurrentViewport(viewport);
    
    // Adjust zoom to fit viewport if needed
    if (previewContainerRef.current && templateRef.current) {
      const container = previewContainerRef.current;
      const template = templateRef.current;
      const viewportConfig = PREVIEW_CONFIG.viewports[viewport];
      
      const containerWidth = container.clientWidth - 40; // Account for padding
      const containerHeight = container.clientHeight - 40;
      
      const scaleX = containerWidth / viewportConfig.width;
      const scaleY = containerHeight / viewportConfig.height;
      const optimalZoom = Math.min(scaleX, scaleY, 1);
      
      setZoomLevel(optimalZoom);
    }
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.25));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const fitToScreen = useCallback(() => {
    if (previewContainerRef.current && templateRef.current) {
      const container = previewContainerRef.current;
      const template = templateRef.current;
      const viewportConfig = PREVIEW_CONFIG.viewports[currentViewport];
      
      const containerWidth = container.clientWidth - 40;
      const containerHeight = container.clientHeight - 40;
      
      const scaleX = containerWidth / viewportConfig.width;
      const scaleY = containerHeight / viewportConfig.height;
      const optimalZoom = Math.min(scaleX, scaleY);
      
      setZoomLevel(optimalZoom);
    }
  }, [currentViewport]);

  // Template rendering with responsive behavior
  const renderTemplate = useCallback(() => {
    if (!templateData || !templateComponents.length) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <h3>No Template Content</h3>
            <p>This template appears to be empty or invalid.</p>
          </div>
        </div>
      );
    }

    const viewportConfig = PREVIEW_CONFIG.viewports[currentViewport];
    
    return (
      <div
        ref={templateRef}
        className={`pacific-template-preview ${darkMode ? 'dark-mode' : ''}`}
        style={{
          width: `${viewportConfig.width}px`,
          height: `${viewportConfig.height}px`,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          backgroundColor: darkMode ? 'var(--dark-charcoal-grey)' : 'var(--cream-background)',
          border: '2px solid var(--border)',
          borderRadius: 'var(--radius)',
          position: 'relative',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backgroundImage: showGrid ? 
            'radial-gradient(circle, var(--border) 1px, transparent 1px)' : 
            'none',
          backgroundSize: showGrid ? '20px 20px' : 'auto'
        }}
      >
        {/* Template Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '2px solid var(--border)',
          backgroundColor: darkMode ? 'var(--oxford-blue)' : 'var(--card)',
          color: darkMode ? 'var(--warm-white)' : 'var(--dark-charcoal-grey)'
        }}>
          <h2 style={{
            margin: '0 0 0.5rem 0',
            fontFamily: '"Times New Roman", Times, serif',
            color: darkMode ? 'var(--warm-white)' : 'var(--harvard-crimson)',
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {templateData.name}
          </h2>
          <div style={{
            display: 'flex',
            gap: '1rem',
            fontSize: '0.9rem',
            color: darkMode ? 'var(--warm-white)' : 'var(--medium-grey)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            <span>Target Level: {templateData.targetLevel}</span>
            <span>Learning Style: {templateData.learningStyle}</span>
            <span>Components: {templateComponents.length}</span>
          </div>
        </div>

        {/* Template Components */}
        <div 
          className="template-content"
          style={{
            position: 'relative',
            minHeight: 'calc(100% - 80px)',
            padding: '1rem'
          }}
        >
          {templateComponents.map(component => (
            <TemplateComponent
              key={component.id}
              component={component}
              darkMode={darkMode}
              interactiveMode={interactiveMode}
              simulationMode={simulationMode}
              showBounds={showBounds}
            />
          ))}
          
          {/* Component bounds overlay */}
          {showBounds && (
            <div className="bounds-overlay">
              {templateComponents.map(component => (
                <div
                  key={`bounds-${component.id}`}
                  style={{
                    position: 'absolute',
                    left: `${component.position.x}px`,
                    top: `${component.position.y}px`,
                    width: `${component.size?.width || 200}px`,
                    height: `${component.size?.height || 100}px`,
                    border: '1px dashed var(--harvard-crimson)',
                    backgroundColor: 'rgba(165, 28, 48, 0.1)',
                    pointerEvents: 'none',
                    zIndex: 1000
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '0',
                    fontSize: '0.7rem',
                    color: 'var(--harvard-crimson)',
                    backgroundColor: 'var(--warm-white)',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {component.componentDef?.name || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }, [templateData, templateComponents, currentViewport, zoomLevel, darkMode, interactiveMode, simulationMode, showGrid, showBounds]);

  // Loading state
  if (previewState === PREVIEW_STATES.LOADING) {
    return (
      <div className="preview-loading" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--cream-background)',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--muted)',
            borderTop: '4px solid var(--harvard-crimson)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <h3 style={{ color: 'var(--dark-charcoal-grey)' }}>Loading Template Preview...</h3>
          <p style={{ color: 'var(--medium-grey)' }}>Preparing your learning template</p>
        </div>
      </div>
    );
  }

  // Error state
  if (previewState === PREVIEW_STATES.ERROR) {
    return (
      <div className="preview-error" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--cream-background)',
        fontFamily: '"Times New Roman", Times, serif',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          padding: '2rem',
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '2px solid var(--harvard-crimson)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h3 style={{ color: 'var(--harvard-crimson)', marginBottom: '1rem' }}>
            Preview Error
          </h3>
          <p style={{ color: 'var(--dark-charcoal-grey)', marginBottom: '1.5rem' }}>
            Unable to load the template preview. Please check the template data and try again.
          </p>
          
          {templateErrors.length > 0 && (
            <div style={{
              textAlign: 'left',
              backgroundColor: 'var(--muted)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem'
            }}>
              <h4 style={{ color: 'var(--harvard-crimson)', marginBottom: '0.5rem' }}>Errors:</h4>
              {templateErrors.map((error, index) => (
                <div key={index} style={{
                  fontSize: '0.9rem',
                  color: 'var(--dark-charcoal-grey)',
                  marginBottom: '0.5rem'
                }}>
                  • {error.message}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--medium-grey)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: '"Times New Roman", Times, serif',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--harvard-crimson)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: '"Times New Roman", Times, serif',
                  cursor: 'pointer'
                }}
              >
                Edit Template
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pacific-template-preview-container ${fullscreen ? 'fullscreen' : ''}`} style={{
      height: fullscreen ? '100vh' : '100%',
      backgroundColor: 'var(--muted)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      {/* Preview Header & Controls */}
      {showControls && (
        <div className="preview-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: 'var(--card)',
          borderBottom: '2px solid var(--border)'
        }}>
          {/* Left Controls */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <h3 style={{
              margin: 0,
              color: 'var(--harvard-crimson)',
              fontSize: '1.2rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Template Preview
            </h3>
            
            {/* Viewport Selector */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {Object.entries(PREVIEW_CONFIG.viewports).map(([key, viewport]) => (
                <button
                  key={key}
                  onClick={() => changeViewport(key)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: currentViewport === key ? 'var(--harvard-crimson)' : 'var(--muted)',
                    color: currentViewport === key ? 'var(--warm-white)' : 'var(--dark-charcoal-grey)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>{viewport.icon}</span>
                  <span>{viewport.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Zoom Controls */}
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <button onClick={zoomOut} style={{ padding: '0.5rem', backgroundColor: 'var(--muted)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>-</button>
              <span style={{ minWidth: '3rem', textAlign: 'center', fontSize: '0.9rem' }}>{Math.round(zoomLevel * 100)}%</span>
              <button onClick={zoomIn} style={{ padding: '0.5rem', backgroundColor: 'var(--muted)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>+</button>
              <button onClick={fitToScreen} style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--oxford-blue)', color: 'var(--warm-white)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem' }}>Fit</button>
            </div>

            {/* View Options */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                Grid
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={showBounds} onChange={(e) => setShowBounds(e.target.checked)} />
                Bounds
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                Dark
              </label>
            </div>

            {/* Action Buttons */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--medium-grey)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div 
        ref={previewContainerRef}
        className="preview-content"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          overflow: 'auto'
        }}
      >
        {renderTemplate()}
      </div>

      {/* Template Errors/Warnings Display */}
      {templateErrors.length > 0 && (
        <div style={{
          backgroundColor: 'var(--harvard-crimson)',
          color: 'var(--warm-white)',
          padding: '0.75rem 1rem',
          fontSize: '0.9rem'
        }}>
          {templateErrors.length} error(s) found in template. Some features may not work correctly.
        </div>
      )}
    </div>
  );
};

// Individual Template Component Renderer (placeholder for Part 2)
const TemplateComponent = ({ component, darkMode, interactiveMode, simulationMode, showBounds }) => {
  if (!component.componentDef) {
    return (
      <div style={{
        position: 'absolute',
        left: `${component.position.x}px`,
        top: `${component.position.y}px`,
        width: `${component.size?.width || 200}px`,
        height: `${component.size?.height || 100}px`,
        backgroundColor: 'var(--harvard-crimson)',
        color: 'var(--warm-white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.9rem',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        Component Error: {component.error || 'Unknown'}
      </div>
    );
  }

  const ComponentRenderer = component.componentDef.component;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${component.position.x}px`,
        top: `${component.position.y}px`,
        minWidth: `${component.size?.width || 200}px`,
        minHeight: `${component.size?.height || 100}px`
      }}
    >
      <ComponentRenderer 
        config={component.config} 
        isPreview={!interactiveMode}
        darkMode={darkMode}
      />
    </div>
  );
};

export default TemplatePreview;