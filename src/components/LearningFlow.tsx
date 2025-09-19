import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  Brain, 
  MessageSquare, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface UserProfile {
  id: string;
  nationality: string;
  nativeLanguages: string[];
  additionalLanguages: string[];
  placementResults: Record<string, string>;
  learningPreferences: {
    style: string;
    contextualUse: 'professional' | 'personal';
    motivation: string;
    timeLimit: number;
  };
}

interface LearningFlowProps {
  userProfile: UserProfile;
  targetLanguage: string;
  onBackToDashboard: () => void;
}

export function LearningFlow({ userProfile, targetLanguage, onBackToDashboard }: LearningFlowProps) {
  const [currentPhase, setCurrentPhase] = useState<'knowledge' | 'consolidate' | 'simulation'>('knowledge');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [estimatedReadingTime, setEstimatedReadingTime] = useState(8);
  const [estimatedDigestionTime, setEstimatedDigestionTime] = useState(12);
  const [showQA, setShowQA] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [swordPointerFeedback, setSwordPointerFeedback] = useState('');

  // Extract character from motivation for thematic contextualization
  const extractThematicContext = () => {
    const motivation = userProfile.learningPreferences.motivation.toLowerCase();
    if (motivation.includes('gion constantino') || motivation.includes('italian')) {
      return {
        character: 'Gion Constantino',
        setting: 'Prince Series',
        traits: ['intelligent', 'formal', 'strategic', 'fond of cats', 'likes cappuccino'],
        nationality: 'Italian'
      };
    }
    return null;
  };

  const thematicContext = extractThematicContext();

  const getLessonContent = () => {
    if (targetLanguage === 'es' || targetLanguage === 'Spanish') {
      if (thematicContext) {
        return {
          title: 'Formal Address (Lei) - Through Royal Protocol',
          content: `In Spanish, just like in Italian royal settings, formal address is crucial. When Gion would address dignitaries, he uses formal language.

**Core Grammar: Formal "You" (Usted)**
• Usted es muy inteligente → "You are very intelligent"
• ¿Cómo está usted? → "How are you?"

**Practice with Gion's Context:**
• Príncipe Gion, usted es muy estratégico → "Prince Gion, you are very strategic"
• Gion bebe un café → "Gion drinks coffee" (using his love for cappuccino)`,
          exercises: [
            'Translate: "Prince, you are intelligent"',
            'How would Gion formally greet a Spanish ambassador?'
          ],
          culturalNote: 'Just like Italian bella figura, Spanish speakers value formal courtesy in professional settings.'
        };
      } else {
        return {
          title: 'Basic Spanish Greetings',
          content: `**Essential Greetings:**
• Hola → Hello
• Buenos días → Good morning
• ¿Cómo está? → How are you?
• Muy bien, gracias → Very well, thank you`,
          exercises: [
            'Practice: Greet someone formally',
            'Translate: "Good afternoon"'
          ],
          culturalNote: 'Spanish greetings vary by time of day and formality level.'
        };
      }
    }
    return {
      title: 'Welcome to Your Language Journey',
      content: 'Your personalized content is being prepared...',
      exercises: [],
      culturalNote: ''
    };
  };

  const lesson = getLessonContent();

  const handleTimerToggle = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleSubmitQuestion = () => {
    if (!userQuestion.trim()) return;
    
    // Simulate AI response based on the question
    const response = `Regarding "${userQuestion}": This relates to the core concept we're learning. ${thematicContext ? `Think of how ${thematicContext.character} would use this in formal situations.` : 'Let me clarify this concept for you.'} Remember, we're focusing on practical application for your ${userProfile.learningPreferences.contextualUse} context.`;
    
    setUserQuestion('');
    // In a real app, this would integrate with the AI system
  };

  const handleSwordPointer = () => {
    const feedback = swordPointerFeedback.trim();
    if (!feedback) return;
    
    // Process feedback and adjust teaching approach
    console.log('Sword Pointer feedback:', feedback);
    setSwordPointerFeedback('');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={onBackToDashboard}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          
          <div className="flex items-center space-x-4">
            <Badge className="bg-[#A51C30] text-[#FCFCFC]">
              {targetLanguage === 'es' ? 'Spanish' : targetLanguage}
            </Badge>
            <Badge variant="outline">Phase 1: New Knowledge</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Tracking */}
            <Card className="p-6 bg-white border-[#E5E5E5]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold" style={{ color: '#2C2C2C' }}>
                  Lesson Progress
                </h2>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleTimerToggle}
                    className="flex items-center space-x-1"
                  >
                    {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
                  </Button>
                </div>
              </div>
              <Progress value={30} className="h-2" />
              <div className="flex justify-between text-sm mt-2" style={{ color: '#666666' }}>
                <span>Lesson 3 of 10</span>
                <span>30% Complete</span>
              </div>
            </Card>

            {/* Main Learning Content */}
            <Card className="p-8 bg-white border-[#E5E5E5]">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                    {lesson.title}
                  </h1>
                  {thematicContext && (
                    <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#A51C30]/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="h-5 w-5" style={{ color: '#A51C30' }} />
                        <span className="font-semibold" style={{ color: '#A51C30' }}>
                          Thematic Context: {thematicContext.character}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: '#666666' }}>
                        Learning through your inspiration: {thematicContext.setting}
                      </p>
                    </div>
                  )}
                </div>

                <div className="prose prose-lg max-w-none">
                  <div style={{ color: '#2C2C2C' }} dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                </div>

                {lesson.culturalNote && (
                  <div className="p-4 bg-[#F0F9FF] border border-[#002147]/20 rounded-lg">
                    <h3 className="font-semibold mb-2" style={{ color: '#002147' }}>
                      Cultural Insight
                    </h3>
                    <p style={{ color: '#666666' }}>{lesson.culturalNote}</p>
                  </div>
                )}

                {/* Time Estimators */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-[#F9F7F4] rounded-lg">
                    <Clock className="h-5 w-5" style={{ color: '#A51C30' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>Reading Time</p>
                      <p className="text-xs" style={{ color: '#666666' }}>{estimatedReadingTime} minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-[#F9F7F4] rounded-lg">
                    <Brain className="h-5 w-5" style={{ color: '#A51C30' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>Digestion Time</p>
                      <p className="text-xs" style={{ color: '#666666' }}>{estimatedDigestionTime} minutes</p>
                    </div>
                  </div>
                </div>

                {/* Fixed Prompt for Questions */}
                <div className="border-t border-[#E5E5E5] pt-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageSquare className="h-5 w-5" style={{ color: '#A51C30' }} />
                    <h3 className="font-semibold" style={{ color: '#2C2C2C' }}>
                      Ask About This Concept
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your question about this concept..."
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      className="flex-1"
                      rows={2}
                    />
                    <Button 
                      onClick={handleSubmitQuestion}
                      className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC]"
                    >
                      Ask
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Q&A Dropdown */}
            <Card className="bg-white border-[#E5E5E5]">
              <Button
                variant="ghost"
                onClick={() => setShowQA(!showQA)}
                className="w-full flex items-center justify-between p-6"
              >
                <span className="font-semibold" style={{ color: '#2C2C2C' }}>
                  Questions & Discussions
                </span>
                {showQA ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {showQA && (
                <div className="px-6 pb-6">
                  <Separator className="mb-4" />
                  <p className="text-sm" style={{ color: '#666666' }}>
                    Previous questions and deeper discussions will appear here. 
                    This keeps your main lesson clean while allowing exploration of subtopics.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* External References */}
            <Card className="p-6 bg-white border-[#E5E5E5]">
              <h3 className="font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                External References
              </h3>
              <div className="space-y-3">
                <a 
                  href="#" 
                  className="flex items-center space-x-2 text-sm p-2 rounded hover:bg-[#F9F7F4] transition-colors"
                  style={{ color: '#A51C30' }}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Spanish Formal Address - SpanishDict</span>
                </a>
                <a 
                  href="#" 
                  className="flex items-center space-x-2 text-sm p-2 rounded hover:bg-[#F9F7F4] transition-colors"
                  style={{ color: '#A51C30' }}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Cultural Etiquette in Spain</span>
                </a>
              </div>
            </Card>

            {/* Sword Pointer Feedback */}
            <Card className="p-6 bg-white border-[#E5E5E5]">
              <h3 className="font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                Sword Pointer Feedback
              </h3>
              <p className="text-sm mb-4" style={{ color: '#666666' }}>
                If you don't like how the teaching is going, please provide feedback. 
                We balance your interests with practical use for optimal learning.
              </p>
              <div className="space-y-3">
                <Textarea
                  placeholder="How would you like to adjust the teaching approach?"
                  value={swordPointerFeedback}
                  onChange={(e) => setSwordPointerFeedback(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleSwordPointer}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Submit Feedback
                </Button>
              </div>
            </Card>

            {/* Anti-Procrastination Alert */}
            <Card className="p-6 bg-[#FFF7ED] border-[#FB923C]/20">
              <h3 className="font-semibold mb-2" style={{ color: '#EA580C' }}>
                Time Alert
              </h3>
              <p className="text-sm" style={{ color: '#9A3412' }}>
                You've been on this section for {estimatedReadingTime + 2} minutes. 
                Consider moving to practice exercises to reinforce learning.
              </p>
              <Button 
                size="sm" 
                className="mt-3 w-full bg-[#EA580C] hover:bg-[#DC2626] text-white"
              >
                Continue to Exercises
              </Button>
            </Card>

            {/* Flow Retainer */}
            <Card className="p-6 bg-white border-[#E5E5E5]">
              <h3 className="font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                Flow Retainer
              </h3>
              <p className="text-sm mb-4" style={{ color: '#666666' }}>
                Taking a break? We'll help you resume smoothly.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Quick Resume Summary</span>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}