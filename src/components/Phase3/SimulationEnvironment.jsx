// SimulationEnvironment.jsx - Immersive Contextual Language Simulation
// Phase 3 component that creates realistic dialogue scenarios based on user's contextual use

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, AlertCircle, Play } from 'lucide-react';

// Demo scenarios based on your DEMO IDEA.txt
const DEMO_SCENARIOS = {
  paraguayan_spanish_business: {
    title: "Business Meeting in Asunción",
    location: "Paraguay Trade Office, Asunción",
    situation: "Negotiating agricultural export agreement",
    characters: [
      { name: "Carlos Mendoza", role: "Export Director", formality: "formal" },
      { name: "María Santos", role: "Trade Consultant", formality: "semi-formal" }
    ],
    culturalContext: "Paraguayan business culture values relationship-building and formal respect",
    objectives: ["Establish trade partnership", "Negotiate pricing", "Discuss logistics"]
  },
  italian_gion_constantino: {
    title: "Exploring Italian Heritage",
    location: "Venice, inspired by Gion Constantino's world",
    situation: "Cultural immersion through character inspiration",
    characters: [
      { name: "Marco Benetti", role: "Local historian", formality: "friendly" },
      { name: "Sofia Romano", role: "Art guide", formality: "casual" }
    ],
    culturalContext: "Italian appreciation for art, history, and passionate conversation",
    objectives: ["Learn about Italian culture", "Practice conversational Italian", "Cultural exploration"]
  }
};

// Pronunciation mouth shapes for visual guidance
const MOUTH_SHAPES = {
  spanish: {
    'a': { shape: '😮', tip: 'Open mouth wide, jaw dropped' },
    'e': { shape: '😊', tip: 'Slightly open, corners up' },
    'i': { shape: '😏', tip: 'Small opening, corners slightly pulled' },
    'o': { shape: '😗', tip: 'Round lips, moderate opening' },
    'u': { shape: '😙', tip: 'Very round lips, small opening' },
    'r': { shape: '😬', tip: 'Tongue tip vibrates against roof' },
    'rr': { shape: '😤', tip: 'Strong tongue roll, multiple taps' }
  },
  italian: {
    'a': { shape: '😮', tip: 'Wide open, clear sound' },
    'e': { shape: '😊', tip: 'Mid-open, precise' },
    'i': { shape: '😏', tip: 'High, tight corners' },
    'o': { shape: '😗', tip: 'Round, medium open' },
    'u': { shape: '😙', tip: 'Very round, closed' },
    'gl': { shape: '😛', tip: 'Tongue against palate' },
    'gn': { shape: '😋', tip: 'Tongue touches soft palate' }
  }
};

const SimulationEnvironment = ({
  userProfile,
  contextualUse,
  moscowPriorities,
  targetLanguage,
  onSimulationComplete,
  onProgressUpdate,
  currentPhase
}) => {
  // State management
  const [currentScenario, setCurrentScenario] = useState(null);
  const [dialogueState, setDialogueState] = useState({
    currentTurn: 0,
    dialogueHistory: [],
    userResponses: []
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pronunciationTip, setPronunciationTip] = useState(null);
  const [currentDialogue, setCurrentDialogue] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);

  // Refs for simulation
  const recordingInterval = useRef(null);
  const audioContext = useRef(null);

  // Initialize scenario based on contextual use
  useEffect(() => {
    if (contextualUse && targetLanguage) {
      initializeScenario();
    }
  }, [contextualUse, targetLanguage]);

  // Initialize appropriate scenario based on user context
  const initializeScenario = async () => {
    setIsGenerating(true);
    
    try {
      let scenario;
      
      // Determine scenario based on contextual use
      if (contextualUse.type === 'professional' && targetLanguage.language.toLowerCase().includes('spanish')) {
        scenario = DEMO_SCENARIOS.paraguayan_spanish_business;
      } else if (contextualUse.type === 'personal' && targetLanguage.language.toLowerCase().includes('italian')) {
        scenario = DEMO_SCENARIOS.italian_gion_constantino;
      } else {
        // Generate custom scenario based on context
        scenario = await generateCustomScenario();
      }

      setCurrentScenario(scenario);
      await generateInitialDialogue(scenario);
      
    } catch (error) {
      console.error('Failed to initialize scenario:', error);
      setCurrentScenario(createFallbackScenario());
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate custom scenario for other language/context combinations
  const generateCustomScenario = async () => {
    try {
      const response = await fetch('/api/ai/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextualUse,
          targetLanguage,
          moscowPriorities,
          userProfile
        })
      });

      if (!response.ok) throw new Error('Scenario generation failed');
      
      const result = await response.json();
      return result.scenario;
      
    } catch (error) {
      console.error('Custom scenario generation failed:', error);
      return createFallbackScenario();
    }
  };

  // Create fallback scenario if generation fails
  const createFallbackScenario = () => ({
    title: `${targetLanguage.language} Conversation Practice`,
    location: "General conversation setting",
    situation: `Practice ${contextualUse.type} ${targetLanguage.language} conversation`,
    characters: [
      { name: "Alex", role: "Conversation partner", formality: "friendly" }
    ],
    culturalContext: `${targetLanguage.language} speaking culture`,
    objectives: ["Practice conversation", "Build confidence", "Apply learned vocabulary"]
  });

  // Generate initial dialogue for the scenario
  const generateInitialDialogue = async (scenario) => {
    try {
      const response = await fetch('/api/ai/generate-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          contextualUse,
          moscowPriorities,
          targetLanguage,
          userLevel: userProfile?.placementTest?.cefrLevel || 'A1',
          turnCount: 3 // Initial dialogue turns
        })
      });

      if (!response.ok) throw new Error('Dialogue generation failed');
      
      const result = await response.json();
      setCurrentDialogue(result.dialogue || generateFallbackDialogue(scenario));
      
    } catch (error) {
      console.error('Dialogue generation failed:', error);
      setCurrentDialogue(generateFallbackDialogue(scenario));
    }
  };

  // Fallback dialogue if AI generation fails
  const generateFallbackDialogue = (scenario) => {
    if (scenario === DEMO_SCENARIOS.paraguayan_spanish_business) {
      return [
        {
          speaker: "Carlos Mendoza",
          text: "Buenos días. Es un placer conocerle. Soy Carlos Mendoza, Director de Exportaciones.",
          translation: "Good morning. It's a pleasure to meet you. I'm Carlos Mendoza, Export Director.",
          pronunciation: "BWE-nos DEE-as. Es un pla-SER ko-no-SER-le. Soy KAR-los men-DO-sa, dee-rek-TOR de eks-por-ta-see-O-nes.",
          culturalNote: "In Paraguayan business, formal greetings and titles are very important."
        },
        {
          speaker: "User Response Expected",
          text: "[Your turn to introduce yourself]",
          suggestions: [
            "Buenos días, señor Mendoza. Soy [su nombre], representante de [su empresa].",
            "Mucho gusto, Director. Gracias por recibirme hoy.",
            "Es un honor estar aquí. Vengo de Malasia con interés en sus productos agrícolas."
          ]
        }
      ];
    } else if (scenario === DEMO_SCENARIOS.italian_gion_constantino) {
      return [
        {
          speaker: "Marco Benetti",
          text: "Ciao! Benvenuto a Venezia! Ho sentito che sei interessato alla storia di Gion Constantino.",
          translation: "Hi! Welcome to Venice! I heard you're interested in Gion Constantino's story.",
          pronunciation: "CHAH-o! Ben-ve-NU-to a Ve-NE-tsee-a! O sen-TEE-to ke say in-te-res-SA-to al-la STO-ree-a dee Jon Kon-stan-TEE-no.",
          culturalNote: "Venetians are warm and passionate about their city's rich history and culture."
        },
        {
          speaker: "User Response Expected",
          text: "[Express your interest in Italian culture through Gion Constantino]",
          suggestions: [
            "Sì, sono molto affascinato dalla cultura italiana attraverso questo personaggio.",
            "Ciao Marco! Grazie per l'accoglienza. Dimmi di più sulla storia veneziana.",
            "È incredibile essere qui! Gion Constantino mi ha ispirato a imparare l'italiano."
          ]
        }
      ];
    }
    
    return [
      {
        speaker: "Conversation Partner",
        text: `Hello! Ready to practice your ${targetLanguage.language}?`,
        translation: "Let's begin our conversation practice.",
        pronunciation: "Practice pronunciation will be provided here.",
        culturalNote: "Cultural context will be shared as we converse."
      }
    ];
  };

  // Handle fake recording functionality
  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    
    // Fake recording timer (you'll replace with real voice)
    recordingInterval.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);

    // Generate pronunciation tip for current dialogue
    generatePronunciationTip();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }

    // Simulate processing user's response
    processUserResponse();
  };

  // Generate pronunciation tip based on current text
  const generatePronunciationTip = () => {
    const currentTurn = currentDialogue[dialogueState.currentTurn];
    if (!currentTurn || currentTurn.speaker === "User Response Expected") return;

    const languageCode = targetLanguage.language.toLowerCase().includes('spanish') ? 'spanish' : 'italian';
    const mouthShapes = MOUTH_SHAPES[languageCode];
    
    // Extract key sounds from the text
    const text = currentTurn.text.toLowerCase();
    let keySound = 'a'; // default
    
    if (text.includes('rr')) keySound = 'rr';
    else if (text.includes('r')) keySound = 'r';
    else if (text.includes('gl')) keySound = 'gl';
    else if (text.includes('gn')) keySound = 'gn';
    else {
      // Find most common vowel
      const vowels = text.match(/[aeiou]/g) || ['a'];
      keySound = vowels[0];
    }

    const tip = mouthShapes[keySound];
    if (tip) {
      setPronunciationTip({
        sound: keySound,
        shape: tip.shape,
        instruction: tip.tip,
        example: currentTurn.text.split(' ').find(word => word.toLowerCase().includes(keySound)) || currentTurn.text.split(' ')[0]
      });
    }
  };

  // Process user's recorded response (fake for demo)
  const processUserResponse = async () => {
    const userResponse = {
      duration: recordingDuration,
      timestamp: Date.now(),
      turn: dialogueState.currentTurn
    };

    // Update dialogue state
    setDialogueState(prev => ({
      ...prev,
      userResponses: [...prev.userResponses, userResponse],
      currentTurn: prev.currentTurn + 1
    }));

    // Generate next dialogue turn if needed
    if (dialogueState.currentTurn + 1 >= currentDialogue.length) {
      await generateNextDialogueTurn();
    }
  };

  // Generate next turn in dialogue
  const generateNextDialogueTurn = async () => {
    try {
      const response = await fetch('/api/ai/continue-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: currentScenario,
          dialogueHistory: currentDialogue,
          userResponses: dialogueState.userResponses,
          moscowPriorities,
          targetLanguage
        })
      });

      if (!response.ok) throw new Error('Dialogue continuation failed');
      
      const result = await response.json();
      if (result.nextTurn) {
        setCurrentDialogue(prev => [...prev, result.nextTurn]);
      }
      
    } catch (error) {
      console.error('Failed to generate next dialogue turn:', error);
      // Add fallback next turn
      setCurrentDialogue(prev => [...prev, {
        speaker: "Conversation Partner",
        text: "That's interesting! Tell me more.",
        translation: "Continue practicing!",
        pronunciation: "Keep going with the conversation."
      }]);
    }
  };

  // Start simulation
  const startSimulation = () => {
    setSimulationActive(true);
    if (onProgressUpdate) {
      onProgressUpdate({
        simulationStarted: true,
        scenario: currentScenario?.title,
        timestamp: Date.now()
      });
    }
  };

  // Complete simulation
  const completeSimulation = () => {
    if (onSimulationComplete) {
      onSimulationComplete({
        scenario: currentScenario,
        dialogueTurns: dialogueState.userResponses.length,
        totalTime: dialogueState.userResponses.reduce((sum, r) => sum + r.duration, 0),
        completedAt: Date.now()
      });
    }
  };

  // Format recording duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isGenerating) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)',
        padding: '2rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid var(--muted)',
          borderTop: '4px solid var(--harvard-crimson)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <h3 style={{
          color: 'var(--harvard-crimson)',
          fontFamily: '"Times New Roman", Times, serif',
          margin: '0 0 0.5rem 0'
        }}>
          Creating Your Simulation
        </h3>
        <p style={{
          color: 'var(--medium-grey)',
          fontFamily: '"Times New Roman", Times, serif',
          textAlign: 'center',
          margin: 0
        }}>
          Generating immersive {targetLanguage?.language} dialogue based on your context...
        </p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!currentScenario) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--border)'
      }}>
        <AlertCircle size={48} style={{ color: 'var(--harvard-crimson)', marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--dark-charcoal-grey)', fontFamily: '"Times New Roman", Times, serif' }}>
          Unable to Generate Simulation
        </h3>
        <p style={{ color: 'var(--medium-grey)', fontFamily: '"Times New Roman", Times, serif' }}>
          Please ensure your contextual use and language selection are complete.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--cream-background)',
      minHeight: '100vh',
      fontFamily: '"Times New Roman", Times, serif'
    }}>
      {/* Scenario Header */}
      <div style={{
        backgroundColor: 'var(--card)',
        borderBottom: '2px solid var(--border)',
        padding: '1.5rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              color: 'var(--harvard-crimson)',
              margin: '0 0 0.5rem 0',
              fontSize: '1.8rem',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {currentScenario.title}
            </h1>
            <p style={{
              color: 'var(--medium-grey)',
              margin: '0 0 0.5rem 0',
              fontSize: '1rem'
            }}>
              📍 {currentScenario.location} • {currentScenario.situation}
            </p>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--oxford-blue)',
              fontStyle: 'italic'
            }}>
              {currentScenario.culturalContext}
            </div>
          </div>
          
          {!simulationActive ? (
            <button
              onClick={startSimulation}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--harvard-crimson)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: '"Times New Roman", Times, serif',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Play size={20} />
              Start Simulation
            </button>
          ) : (
            <button
              onClick={completeSimulation}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--dartmouth-green)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: '"Times New Roman", Times, serif',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle size={20} />
              Complete
            </button>
          )}
        </div>
      </div>

      {/* Main Simulation Area */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem'
      }}>
        {/* Dialogue Area */}
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '2px solid var(--border)',
          padding: '2rem'
        }}>
          <h3 style={{
            color: 'var(--dark-charcoal-grey)',
            margin: '0 0 2rem 0',
            fontSize: '1.3rem'
          }}>
            Conversation Practice
          </h3>

          {/* Current Dialogue Turn */}
          {currentDialogue[dialogueState.currentTurn] && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--harvard-crimson)'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: 'var(--oxford-blue)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: '0.5rem'
              }}>
                {currentDialogue[dialogueState.currentTurn].speaker}:
              </div>
              
              <div style={{
                fontSize: '1.2rem',
                color: 'var(--dark-charcoal-grey)',
                marginBottom: '1rem',
                lineHeight: '1.6'
              }}>
                {currentDialogue[dialogueState.currentTurn].text}
              </div>
              
              {currentDialogue[dialogueState.currentTurn].translation && (
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--medium-grey)',
                  fontStyle: 'italic',
                  marginBottom: '0.5rem'
                }}>
                  Translation: {currentDialogue[dialogueState.currentTurn].translation}
                </div>
              )}
              
              {currentDialogue[dialogueState.currentTurn].pronunciation && (
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--tsinghua-purple)',
                  fontFamily: 'monospace',
                  backgroundColor: 'var(--card)',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.5rem'
                }}>
                  Pronunciation: {currentDialogue[dialogueState.currentTurn].pronunciation}
                </div>
              )}
              
              {currentDialogue[dialogueState.currentTurn].culturalNote && (
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--dartmouth-green)',
                  fontStyle: 'italic',
                  padding: '0.5rem',
                  backgroundColor: 'rgba(0, 105, 62, 0.1)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  💡 Cultural Note: {currentDialogue[dialogueState.currentTurn].culturalNote}
                </div>
              )}
            </div>
          )}

          {/* Response Suggestions (if current turn expects user response) */}
          {currentDialogue[dialogueState.currentTurn]?.speaker === "User Response Expected" && (
            <div style={{
              marginBottom: '2rem',
              padding: '1rem',
              backgroundColor: 'rgba(0, 105, 62, 0.1)',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--dartmouth-green)'
            }}>
              <h4 style={{
                color: 'var(--dartmouth-green)',
                margin: '0 0 1rem 0',
                fontSize: '1rem'
              }}>
                Suggested Responses:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentDialogue[dialogueState.currentTurn].suggestions?.map((suggestion, index) => (
                  <div key={index} style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--card)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    color: 'var(--dark-charcoal-grey)',
                    border: '1px solid var(--border)'
                  }}>
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recording Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.5rem',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!simulationActive}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isRecording ? 'var(--destructive)' : 'var(--harvard-crimson)',
                color: 'var(--warm-white)',
                cursor: simulationActive ? 'pointer' : 'not-allowed',
                opacity: simulationActive ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--dark-charcoal-grey)',
                marginBottom: '0.25rem'
              }}>
                {isRecording ? formatDuration(recordingDuration) : '0:00'}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: 'var(--medium-grey)'
              }}>
                {isRecording ? 'Recording...' : 'Press to speak'}
              </div>
            </div>
          </div>
        </div>

        {/* Pronunciation Guide Sidebar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Pronunciation Tip */}
          {pronunciationTip && (
            <div style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius)',
              border: '2px solid var(--tsinghua-purple)',
              padding: '1.5rem'
            }}>
              <h4 style={{
                color: 'var(--tsinghua-purple)',
                margin: '0 0 1rem 0',
                fontSize: '1.1rem'
              }}>
                Pronunciation Focus
              </h4>
              
              <div style={{
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '0.5rem'
                }}>
                  {pronunciationTip.shape}
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: 'var(--dark-charcoal-grey)',
                  marginBottom: '0.5rem'
                }}>
                  Sound: "{pronunciationTip.sound}"
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--medium-grey)',
                  fontStyle: 'italic'
                }}>
                  {pronunciationTip.instruction}
                </div>
              </div>
              
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--medium-grey)',
                  marginBottom: '0.25rem'
                }}>
                  Practice with:
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: 'var(--dark-charcoal-grey)'
                }}>
                  "{pronunciationTip.example}"
                </div>
              </div>
            </div>
          )}

          {/* Objectives */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius)',
            border: '2px solid var(--dartmouth-green)',
            padding: '1.5rem'
          }}>
            <h4 style={{
              color: 'var(--dartmouth-green)',
              margin: '0 0 1rem 0',
              fontSize: '1.1rem'
            }}>
              Session Objectives
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currentScenario.objectives?.map((objective, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <CheckCircle size={16} style={{ color: 'var(--dartmouth-green)' }} />
                  <span style={{
                    fontSize: '0.9rem',
                    color: 'var(--dark-charcoal-grey)'
                  }}>
                    {objective}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Tracker */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius)',
            border: '2px solid var(--oxford-blue)',
            padding: '1.5rem'
          }}>
            <h4 style={{
              color: 'var(--oxford-blue)',
              margin: '0 0 1rem 0',
              fontSize: '1.1rem'
            }}>
              Progress
            </h4>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: 'var(--dark-charcoal-grey)'
              }}>
                <span>Dialogue Turns:</span>
                <span>{dialogueState.userResponses.length}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: 'var(--dark-charcoal-grey)'
              }}>
                <span>Speaking Time:</span>
                <span>
                  {formatDuration(dialogueState.userResponses.reduce((sum, r) => sum + r.duration, 0))}
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--muted)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '0.5rem'
              }}>
                <div style={{
                  width: `${Math.min(100, (dialogueState.userResponses.length / 5) * 100)}%`,
                  height: '100%',
                  backgroundColor: 'var(--oxford-blue)',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--medium-grey)',
                textAlign: 'center'
              }}>
                Target: 5 meaningful exchanges
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationEnvironment;