// TemplatePreview.jsx - Part 2: Interactive Simulation & Export Features
// Advanced preview functionality with simulation, sharing, and export capabilities

import React, { useState, useCallback, useEffect } from 'react';

// Simulation Engine for Interactive Components
const SimulationEngine = {
  // Simulate user interactions with template components
  simulateInteraction: async (component, interactionType = 'auto', speed = 1) => {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms / speed));
    
    switch (component.componentDef?.type) {
      case 'interactive_flip_card':
        await delay(1000);
        // Simulate card flip
        return { action: 'flip', success: true };
        
      case 'interactive_multiple_choice':
        await delay(2000);
        // Simulate answer selection
        const correctAnswer = component.config.correctAnswer || 0;
        return { action: 'select_answer', answer: correctAnswer, success: true };
        
      case 'interactive_drag_match':
        await delay(3000);
        // Simulate drag and drop matching
        return { action: 'complete_matching', success: true };
        
      case 'interactive_audio_pronunciation':
        await delay(1500);
        // Simulate audio playback
        return { action: 'play_audio', success: true };
        
      default:
        await delay(500);
        return { action: 'view', success: true };
    }
  },

  // Calculate simulation progress
  calculateProgress: (completedComponents, totalComponents) => {
    return totalComponents > 0 ? (completedComponents / totalComponents) * 100 : 0;
  },

  // Generate interaction analytics
  generateAnalytics: (interactions, duration) => {
    const totalInteractions = interactions.length;
    const successfulInteractions = interactions.filter(i => i.success).length;
    const interactionTypes = [...new Set(interactions.map(i => i.action))];
    
    return {
      totalInteractions,
      successfulInteractions,
      successRate: totalInteractions > 0 ? (successfulInteractions / totalInteractions) * 100 : 0,
      duration,
      interactionTypes,
      averageTimePerInteraction: totalInteractions > 0 ? duration / totalInteractions : 0
    };
  }
};

// Export functionality
const ExportManager = {
  // Export template as PDF
  exportToPDF: async (templateRef, options = {}) => {
    try {
      // Use html2pdf or similar library in real implementation
      const element = templateRef.current;
      if (!element) throw new Error('Template element not found');

      // Generate PDF (placeholder implementation)
      const pdfData = await generatePDFFromElement(element, {
        orientation: options.orientation || 'portrait',
        format: options.format || 'A4',
        quality: options.quality || 1,
        ...options
      });

      // Download PDF
      downloadFile(pdfData, `template-${Date.now()}.pdf`, 'application/pdf');
      return { success: true, filename: `template-${Date.now()}.pdf` };
      
    } catch (error) {
      console.error('PDF export failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Export template as image
  exportToImage: async (templateRef, format = 'png', quality = 1) => {
    try {
      const element = templateRef.current;
      if (!element) throw new Error('Template element not found');

      // Use html2canvas or similar library in real implementation
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: quality,
        useCORS: true
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        downloadFile(blob, `template-${Date.now()}.${format}`, `image/${format}`);
      }, `image/${format}`, quality);

      return { success: true, filename: `template-${Date.now()}.${format}` };
      
    } catch (error) {
      console.error('Image export failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Export template data as JSON
  exportToJSON: (templateData) => {
    try {
      const exportData = {
        ...templateData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      downloadFile(blob, `template-${templateData.name || 'unnamed'}.json`, 'application/json');
      return { success: true, filename: `template-${templateData.name || 'unnamed'}.json` };
      
    } catch (error) {
      console.error('JSON export failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate shareable link
  generateShareLink: async (templateData) => {
    try {
      // In real implementation, upload to cloud storage and get share URL
      const shareId = generateShareId();
      const shareData = {
        id: shareId,
        template: templateData,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
      
      // Store share data (placeholder)
      await storeShareData(shareData);
      
      const shareUrl = `${window.location.origin}/shared/${shareId}`;
      return { success: true, url: shareUrl, id: shareId };
      
    } catch (error) {
      console.error('Share link generation failed:', error);
      return { success: false, error: error.message };
    }
  }
};

// Utility functions (placeholders for real implementations)
const generatePDFFromElement = async (element, options) => {
  // Placeholder for PDF generation
  return new Blob(['PDF content'], { type: 'application/pdf' });
};

const html2canvas = async (element, options) => {
  // Placeholder for html2canvas
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

const downloadFile = (data, filename, mimeType) => {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const generateShareId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const storeShareData = async (shareData) => {
  // Placeholder for cloud storage
  localStorage.setItem(`share_${shareData.id}`, JSON.stringify(shareData));
};

// Interactive Simulation Panel
const SimulationPanel = ({ 
  templateComponents, 
  onStartSimulation, 
  onStopSimulation, 
  simulationActive, 
  simulationProgress,
  simulationStats 
}) => {
  const [selectedSpeed, setSelectedSpeed] = useState('normal');
  const [autoMode, setAutoMode] = useState(true);
  const [showStats, setShowStats] = useState(true);

  const speedOptions = {
    slow: { label: 'Slow', multiplier: 0.5 },
    normal: { label: 'Normal', multiplier: 1 },
    fast: { label: 'Fast', multiplier: 2 }
  };

  return (
    <div className="simulation-panel" style={{
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      width: '300px',
      backgroundColor: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1001
    }}>
      <h4 style={{
        margin: '0 0 1rem 0',
        color: 'var(--harvard-crimson)',
        fontFamily: '"Times New Roman", Times, serif',
        fontWeight: 'var(--font-weight-medium)'
      }}>
        Interactive Simulation
      </h4>

      {/* Simulation Controls */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            fontFamily: '"Times New Roman", Times, serif',
            color: 'var(--dark-charcoal-grey)'
          }}>
            Simulation Speed:
          </label>
          <select
            value={selectedSpeed}
            onChange={(e) => setSelectedSpeed(e.target.value)}
            disabled={simulationActive}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif'
            }}
          >
            {Object.entries(speedOptions).map(([key, option]) => (
              <option key={key} value={key}>{option.label}</option>
            ))}
          </select>
        </div>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
            disabled={simulationActive}
          />
          Auto-advance through components
        </label>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!simulationActive ? (
            <button
              onClick={() => onStartSimulation({ speed: speedOptions[selectedSpeed].multiplier, auto: autoMode })}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: 'var(--dartmouth-green)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif',
                cursor: 'pointer'
              }}
            >
              Start Simulation
            </button>
          ) : (
            <button
              onClick={onStopSimulation}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: 'var(--harvard-crimson)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontFamily: '"Times New Roman", Times, serif',
                cursor: 'pointer'
              }}
            >
              Stop Simulation
            </button>
          )}
        </div>
      </div>

      {/* Progress Display */}
      {simulationActive && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{
              fontSize: '0.9rem',
              fontFamily: '"Times New Roman", Times, serif',
              color: 'var(--dark-charcoal-grey)'
            }}>
              Progress
            </span>
            <span style={{
              fontSize: '0.9rem',
              color: 'var(--medium-grey)'
            }}>
              {Math.round(simulationProgress)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${simulationProgress}%`,
              height: '100%',
              backgroundColor: 'var(--dartmouth-green)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {showStats && simulationStats && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--muted)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
            Simulation Stats:
          </div>
          <div>Interactions: {simulationStats.totalInteractions}</div>
          <div>Success Rate: {Math.round(simulationStats.successRate)}%</div>
          <div>Duration: {Math.round(simulationStats.duration / 1000)}s</div>
        </div>
      )}
    </div>
  );
};

// Export Options Panel
const ExportPanel = ({ 
  templateData, 
  templateRef, 
  onExport, 
  onShare, 
  onClose 
}) => {
  const [exportType, setExportType] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    orientation: 'portrait',
    format: 'A4',
    quality: 1,
    includeInteractive: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let result;
      
      switch (exportType) {
        case 'pdf':
          result = await ExportManager.exportToPDF(templateRef, exportOptions);
          break;
        case 'image':
          result = await ExportManager.exportToImage(templateRef, 'png', exportOptions.quality);
          break;
        case 'json':
          result = await ExportManager.exportToJSON(templateData);
          break;
        default:
          throw new Error('Unknown export type');
      }
      
      if (result.success && onExport) {
        onExport(result);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
    
    setIsExporting(false);
  };

  const handleShare = async () => {
    try {
      const result = await ExportManager.generateShareLink(templateData);
      if (result.success) {
        setShareUrl(result.url);
        if (onShare) {
          onShare(result);
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="export-panel" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '500px',
      backgroundColor: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '2rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      zIndex: 2000
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          margin: 0,
          color: 'var(--harvard-crimson)',
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Export & Share Template
        </h3>
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

      {/* Export Options */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{
          margin: '0 0 1rem 0',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          Export Options
        </h4>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontFamily: '"Times New Roman", Times, serif',
            color: 'var(--dark-charcoal-grey)'
          }}>
            Export Format:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { value: 'pdf', label: 'PDF Document' },
              { value: 'image', label: 'PNG Image' },
              { value: 'json', label: 'JSON Data' }
            ].map(option => (
              <label key={option.value} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                border: `2px solid ${exportType === option.value ? 'var(--harvard-crimson)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}>
                <input
                  type="radio"
                  value={option.value}
                  checked={exportType === option.value}
                  onChange={(e) => setExportType(e.target.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {exportType === 'pdf' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                Orientation:
              </label>
              <select
                value={exportOptions.orientation}
                onChange={(e) => setExportOptions(prev => ({ ...prev, orientation: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                Size:
              </label>
              <select
                value={exportOptions.format}
                onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
              </select>
            </div>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: isExporting ? 'var(--medium-grey)' : 'var(--dartmouth-green)',
            color: 'var(--warm-white)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontFamily: '"Times New Roman", Times, serif',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            marginTop: '1rem'
          }}
        >
          {isExporting ? 'Exporting...' : `Export as ${exportType.toUpperCase()}`}
        </button>
      </div>

      {/* Share Options */}
      <div>
        <h4 style={{
          margin: '0 0 1rem 0',
          color: 'var(--dark-charcoal-grey)',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          Share Template
        </h4>

        {!shareUrl ? (
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--oxford-blue)',
              color: 'var(--warm-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: '"Times New Roman", Times, serif',
              cursor: 'pointer'
            }}
          >
            Generate Share Link
          </button>
        ) : (
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Share URL:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={shareUrl}
                readOnly
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--muted)',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              />
              <button
                onClick={copyShareUrl}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--harvard-crimson)',
                  color: 'var(--warm-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                Copy
              </button>
            </div>
            <p style={{
              fontSize: '0.8rem',
              color: 'var(--medium-grey)',
              marginTop: '0.5rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Share link expires in 30 days
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Performance Analytics Component
const PerformanceAnalytics = ({ templateData, interactions, usage }) => {
  const [analyticsView, setAnalyticsView] = useState('overview');

  const calculateMetrics = () => {
    const totalComponents = templateData?.components?.length || 0;
    const interactiveComponents = templateData?.components?.filter(
      comp => comp.componentDef?.type?.startsWith('interactive_')
    ).length || 0;
    
    const avgCompletionTime = interactions.reduce((sum, interaction) => 
      sum + (interaction.duration || 0), 0) / Math.max(interactions.length, 1);

    const popularComponents = {};
    interactions.forEach(interaction => {
      const type = interaction.componentType || 'unknown';
      popularComponents[type] = (popularComponents[type] || 0) + 1;
    });

    return {
      totalComponents,
      interactiveComponents,
      avgCompletionTime,
      popularComponents,
      totalSessions: usage?.sessions || 0,
      completionRate: usage?.completionRate || 0
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="performance-analytics" style={{
      position: 'absolute',
      bottom: '1rem',
      left: '1rem',
      width: '300px',
      backgroundColor: 'var(--card)',
      border: '2px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1001
    }}>
      <h4 style={{
        margin: '0 0 1rem 0',
        color: 'var(--harvard-crimson)',
        fontFamily: '"Times New Roman", Times, serif',
        fontWeight: 'var(--font-weight-medium)'
      }}>
        Performance Analytics
      </h4>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
          {['overview', 'interactions', 'usage'].map(view => (
            <button
              key={view}
              onClick={() => setAnalyticsView(view)}
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: analyticsView === view ? 'var(--harvard-crimson)' : 'var(--muted)',
                color: analyticsView === view ? 'var(--warm-white)' : 'var(--dark-charcoal-grey)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {analyticsView === 'overview' && (
          <div style={{ fontSize: '0.9rem', fontFamily: '"Times New Roman", Times, serif' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              Total Components: <strong>{metrics.totalComponents}</strong>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              Interactive: <strong>{metrics.interactiveComponents}</strong>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              Avg. Completion: <strong>{Math.round(metrics.avgCompletionTime / 1000)}s</strong>
            </div>
            <div>
              Completion Rate: <strong>{Math.round(metrics.completionRate)}%</strong>
            </div>
          </div>
        )}

        {analyticsView === 'interactions' && (
          <div style={{ fontSize: '0.9rem', fontFamily: '"Times New Roman", Times, serif' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 'var(--font-weight-medium)' }}>
              Popular Components:
            </div>
            {Object.entries(metrics.popularComponents)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([type, count]) => (
                <div key={type} style={{ marginBottom: '0.25rem' }}>
                  {type}: <strong>{count}</strong>
                </div>
              ))
            }
          </div>
        )}

        {analyticsView === 'usage' && (
          <div style={{ fontSize: '0.9rem', fontFamily: '"Times New Roman", Times, serif' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              Total Sessions: <strong>{metrics.totalSessions}</strong>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              Success Rate: <strong>{Math.round(interactions.filter(i => i.success).length / Math.max(interactions.length, 1) * 100)}%</strong>
            </div>
            <div>
              Last Updated: <strong>{new Date().toLocaleTimeString()}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export Part 2 Components
export {
  SimulationEngine,
  ExportManager,
  SimulationPanel,
  ExportPanel,
  PerformanceAnalytics
};