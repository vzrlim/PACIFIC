// TemplateEditor.jsx - Part 2: Component Palette, Canvas Rendering & Properties Panel
// Complete drag & drop functionality and component management

import React, { useState, useCallback } from 'react';
import { COMPONENT_CATEGORIES } from './TemplateLibrary_Part1.js';

// Component Palette Implementation
const ComponentPalette = ({ 
  availableComponents, 
  recommendedComponents, 
  onDragStart,
  learningStyle 
}) => {
  const [expandedCategories, setExpandedCategories] = useState({
    recommended: true,
    content: true,
    visual: false,
    interactive: false,
    organization: false
  });

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const getComponentsByCategory = (category) => {
    return Object.values(availableComponents).filter(comp => comp.category === category);
  };

 const ComponentItem = ({ component, isRecommended = false }) => {
    const handleDragStart = (e) => {
      e.dataTransfer.setData('component', JSON.stringify(component));
      e.target.style.cursor = 'grabbing';
      onDragStart(component);
    };

    const handleDragEnd = (e) => {
      e.target.style.cursor = 'grab';
    };

    return (
      <div
        className="palette-component"
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          padding: '0.75rem',
          backgroundColor: isRecommended ? 'var(--dartmouth-green)' : 'var(--card)',
          color: isRecommended ? 'var(--warm-white)' : 'var(--dark-charcoal-grey)',
          border: `2px solid ${isRecommended ? 'var(--dartmouth-green)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          cursor: 'grab',
          fontSize: '0.85rem',
          fontFamily: '"Times New Roman", Times, serif',
          marginBottom: '0.5rem',
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
      <div style={{ 
        fontWeight: 'var(--font-weight-medium)',
        marginBottom: '0.25rem'
      }}>
        {component.icon} {component.name}
      </div>
      <div style={{ 
        fontSize: '0.75rem', 
        opacity: 0.9,
        lineHeight: '1.3'
      }}>
        {component.description}
      </div>
    </div>
  );
};

  return (
    <div className="component-palette">
      {/* Recommended Components */}
      {recommendedComponents.length > 0 && (
        <div className="palette-section">
          <div
            className="section-header"
            onClick={() => toggleCategory('recommended')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem',
              backgroundColor: 'var(--dartmouth-green)',
              color: 'var(--warm-white)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              marginBottom: '0.75rem',
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            <span>Recommended for {learningStyle} learners</span>
            <span>{expandedCategories.recommended ? '−' : '+'}</span>
          </div>
          
          {expandedCategories.recommended && (
            <div className="category-components" style={{ marginBottom: '1.5rem' }}>
              {recommendedComponents.slice(0, 6).map(component => (
                <ComponentItem 
                  key={component.id} 
                  component={component} 
                  isRecommended={true} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Components by Category */}
      {Object.entries(COMPONENT_CATEGORIES).map(([categoryKey, categoryInfo]) => {
        const categoryComponents = getComponentsByCategory(categoryKey);
        if (categoryComponents.length === 0) return null;

        return (
          <div key={categoryKey} className="palette-section">
            <div
              className="section-header"
              onClick={() => toggleCategory(categoryKey)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                backgroundColor: categoryInfo.color,
                color: 'var(--warm-white)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                marginBottom: '0.75rem',
                fontFamily: '"Times New Roman", Times, serif',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              <div>
                <div>{categoryInfo.name}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  {categoryInfo.description}
                </div>
              </div>
              <span>{expandedCategories[categoryKey] ? '−' : '+'}</span>
            </div>
            
            {expandedCategories[categoryKey] && (
              <div className="category-components" style={{ marginBottom: '1.5rem' }}>
                {categoryComponents.map(component => (
                  <ComponentItem 
                    key={component.id} 
                    component={component} 
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Canvas Component Renderer
const CanvasComponent = ({ 
  component, 
  isSelected, 
  onSelect, 
  onDelete, 
  onPositionChange, 
  zoomLevel,
  readonly = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    if (readonly) return;
    
    e.stopPropagation();
    onSelect(component.id);
    
    if (e.detail === 2) return; // Ignore double-clicks for drag
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - component.position.x * zoomLevel,
      y: e.clientY - component.position.y * zoomLevel
    });
  }, [component.id, component.position, onSelect, zoomLevel, readonly]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || readonly) return;
    
    const newX = (e.clientX - dragStart.x) / zoomLevel;
    const newY = (e.clientY - dragStart.y) / zoomLevel;
    
    onPositionChange(component.id, { x: newX, y: newY });
  }, [isDragging, dragStart, component.id, onPositionChange, zoomLevel, readonly]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const ComponentRenderer = component.componentType?.component;
  if (!ComponentRenderer) return null;

  return (
    <div
      className={`pacific-canvas-component ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${component.position.x}px`,
        top: `${component.position.y}px`,
        minWidth: `${component.size?.width || 200}px`,
        minHeight: `${component.size?.height || 100}px`,
        border: isSelected ? '2px solid var(--harvard-crimson)' : '2px solid transparent',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--card)',
        boxShadow: isSelected ? '0 4px 12px rgba(165, 28, 48, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
        cursor: readonly ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        zIndex: isSelected ? 1000 : 1,
        transition: isDragging ? 'none' : 'all 0.2s ease'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Component Header */}
      {!readonly && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.25rem 0.5rem',
          backgroundColor: isSelected ? 'var(--harvard-crimson)' : 'var(--muted)',
          color: isSelected ? 'var(--warm-white)' : 'var(--medium-grey)',
          fontSize: '0.75rem',
          fontFamily: '"Times New Roman", Times, serif',
          borderTopLeftRadius: 'var(--radius-sm)',
          borderTopRightRadius: 'var(--radius-sm)'
        }}>
          <span>{component.componentType.icon} {component.componentType.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(component.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0.25rem',
              fontSize: '0.8rem'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Component Content */}
      <div style={{ padding: readonly ? '0.5rem' : '0.75rem' }}>
        <ComponentRenderer 
          config={component.config} 
          isPreview={true}
        />
      </div>

      {/* Resize Handle */}
      {!readonly && isSelected && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '12px',
            height: '12px',
            backgroundColor: 'var(--harvard-crimson)',
            cursor: 'se-resize',
            clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'
          }}
        />
      )}
    </div>
  );
};

// Properties Panel Implementation
const PropertiesPanel = ({ 
  selectedComponent, 
  canvasComponents, 
  onConfigUpdate,
  onComponentUpdate 
}) => {
  const component = canvasComponents.find(comp => comp.id === selectedComponent);
  
  if (!component) {
    return (
      <div className="properties-panel-empty">
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
          <h4>No Component Selected</h4>
          <p>Select a component on the canvas to edit its properties</p>
        </div>
      </div>
    );
  }

  const ConfigField = ({ label, value, type = 'text', options = [], onChange }) => {
    const fieldId = `config-${label.toLowerCase().replace(/\s+/g, '-')}`;
    
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label 
          htmlFor={fieldId}
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontFamily: '"Times New Roman", Times, serif',
            color: 'var(--dark-charcoal-grey)',
            fontWeight: 'var(--font-weight-medium)',
            fontSize: '0.9rem'
          }}
        >
          {label}
        </label>
        
        {type === 'select' ? (
          <select
            id={fieldId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--input-background)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '0.9rem'
            }}
          >
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--input-background)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '0.9rem',
              resize: 'vertical'
            }}
          />
        ) : type === 'checkbox' ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span style={{ fontSize: '0.9rem' }}>Enable</span>
          </label>
        ) : (
          <input
            id={fieldId}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--input-background)',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '0.9rem'
            }}
          />
        )}
      </div>
    );
  };

  const updateConfig = (key, value) => {
    onConfigUpdate(component.id, { [key]: value });
  };

  const configOptions = component.componentType?.configOptions || {};

  return (
    <div className="properties-panel-content">
      {/* Component Info */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius)',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{
          fontFamily: '"Times New Roman", Times, serif',
          color: 'var(--harvard-crimson)',
          margin: '0 0 0.5rem 0',
          fontSize: '1rem',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          {component.componentType.icon} {component.componentType.name}
        </h4>
        <p style={{
          margin: 0,
          fontSize: '0.85rem',
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          {component.componentType.description}
        </p>
      </div>

      {/* Position & Size */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h5 style={{
          fontFamily: '"Times New Roman", Times, serif',
          color: 'var(--dark-charcoal-grey)',
          marginBottom: '1rem',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Position & Size
        </h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <ConfigField
            label="X Position"
            type="number"
            value={component.position.x}
            onChange={(value) => onComponentUpdate(component.id, {
              position: { ...component.position, x: parseInt(value) || 0 }
            })}
          />
          <ConfigField
            label="Y Position"
            type="number"
            value={component.position.y}
            onChange={(value) => onComponentUpdate(component.id, {
              position: { ...component.position, y: parseInt(value) || 0 }
            })}
          />
        </div>
      </div>

      {/* Component-Specific Configuration */}
      <div>
        <h5 style={{
          fontFamily: '"Times New Roman", Times, serif',
          color: 'var(--dark-charcoal-grey)',
          marginBottom: '1rem',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Component Settings
        </h5>

        {/* Render configuration fields based on component type */}
        {Object.entries(component.config).map(([key, value]) => {
          const options = configOptions[key];
          
          if (Array.isArray(options)) {
            return (
              <ConfigField
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                type="select"
                value={value}
                options={options}
                onChange={(newValue) => updateConfig(key, newValue)}
              />
            );
          } else if (typeof value === 'boolean') {
            return (
              <ConfigField
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                type="checkbox"
                value={value}
                onChange={(newValue) => updateConfig(key, newValue)}
              />
            );
          } else if (typeof value === 'string' && value.length > 50) {
            return (
              <ConfigField
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                type="textarea"
                value={value}
                onChange={(newValue) => updateConfig(key, newValue)}
              />
            );
          } else if (Array.isArray(value)) {
            return (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontFamily: '"Times New Roman", Times, serif',
                  color: 'var(--dark-charcoal-grey)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  {Array.isArray(value) ? value.join(', ') : 'Array data'}
                </div>
              </div>
            );
          } else {
            return (
              <ConfigField
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                type="text"
                value={value}
                onChange={(newValue) => updateConfig(key, newValue)}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

// Export Part 2 Components
export {
  ComponentPalette,
  CanvasComponent,
  PropertiesPanel
};
