import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Globe, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Star,
  BookOpen,
  Play
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

interface DashboardProps {
  userProfile: UserProfile;
  onStartLearning: (language: string) => void;
}

export function Dashboard({ userProfile, onStartLearning }: DashboardProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const availableNewLanguages = [
    { code: 'es', name: 'Spanish', flag: '🇪🇸', popular: true },
    { code: 'gn', name: 'Guaraní', flag: '🇵🇾', popular: false },
    { code: 'it', name: 'Italian', flag: '🇮🇹', popular: true },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷', popular: true },
    { code: 'fr', name: 'French', flag: '🇫🇷', popular: true },
    { code: 'de', name: 'German', flag: '🇩🇪', popular: true }
  ];

  const mockProgress = {
    'es': { completed: 15, total: 40, currentPhase: 'New Knowledge' },
    'it': { completed: 8, total: 30, currentPhase: 'Consolidate Knowledge' }
  };

  const getMotivationSummary = () => {
    const motivation = userProfile.learningPreferences.motivation;
    if (motivation.length > 100) {
      return motivation.substring(0, 100) + '...';
    }
    return motivation;
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: '#2C2C2C' }}>
                Welcome back to LinguaFlow
              </h1>
              <p style={{ color: '#666666' }}>
                Continue your language learning journey
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{userProfile.nationality}</Badge>
              <Badge className="bg-[#A51C30] text-[#FCFCFC]">
                {userProfile.learningPreferences.contextualUse}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="new-language">New Language</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="p-6 bg-white border-[#E5E5E5]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#A51C30] flex items-center justify-center">
                    <Globe className="h-5 w-5 text-[#FCFCFC]" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#666666' }}>Native Languages</p>
                    <p className="text-xl font-semibold" style={{ color: '#2C2C2C' }}>
                      {userProfile.nativeLanguages.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-[#E5E5E5]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#00693E] flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-[#FCFCFC]" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#666666' }}>Learning</p>
                    <p className="text-xl font-semibold" style={{ color: '#2C2C2C' }}>
                      {Object.keys(mockProgress).length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-[#E5E5E5]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#002147] flex items-center justify-center">
                    <Clock className="h-5 w-5 text-[#FCFCFC]" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#666666' }}>Time Budget</p>
                    <p className="text-xl font-semibold" style={{ color: '#2C2C2C' }}>
                      {userProfile.learningPreferences.timeLimit}h
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-[#E5E5E5]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#671372] flex items-center justify-center">
                    <Target className="h-5 w-5 text-[#FCFCFC]" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#666666' }}>Style</p>
                    <p className="text-xl font-semibold" style={{ color: '#2C2C2C' }}>
                      {userProfile.learningPreferences.style}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Current Learning */}
            <Card className="p-6 bg-white border-[#E5E5E5]">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                Continue Learning
              </h2>
              {Object.keys(mockProgress).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(mockProgress).map(([lang, progress]) => (
                    <div key={lang} className="flex items-center justify-between p-4 bg-[#F9F7F4] rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {lang === 'es' ? '🇪🇸' : '🇮🇹'}
                        </div>
                        <div>
                          <h3 className="font-semibold" style={{ color: '#2C2C2C' }}>
                            {lang === 'es' ? 'Spanish' : 'Italian'}
                          </h3>
                          <p className="text-sm" style={{ color: '#666666' }}>
                            Phase: {progress.currentPhase}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={(progress.completed / progress.total) * 100} className="w-32 h-2" />
                            <span className="text-sm" style={{ color: '#666666' }}>
                              {progress.completed}/{progress.total}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => onStartLearning(lang)}
                        className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC]"
                      >
                        Continue
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666666' }}>No active learning sessions. Start a new language!</p>
              )}
            </Card>

            {/* Motivation Summary */}
            <Card className="p-6 bg-white border-[#E5E5E5]">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                Your Learning Motivation
              </h2>
              <p style={{ color: '#666666' }}>
                {getMotivationSummary()}
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card className="p-6 bg-white border-[#E5E5E5]">
              <h2 className="text-xl font-semibold mb-6" style={{ color: '#2C2C2C' }}>
                Learning Progress
              </h2>
              
              {/* Language Proficiency Levels */}
              <div className="space-y-6">
                <h3 className="font-semibold" style={{ color: '#2C2C2C' }}>Current Proficiency Levels</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(userProfile.placementResults).map(([language, level]) => (
                    <Card key={language} className="p-4 border-[#E5E5E5]">
                      <div className="flex items-center justify-between">
                        <span className="font-medium" style={{ color: '#2C2C2C' }}>{language}</span>
                        <Badge className="bg-[#00693E] text-[#FCFCFC]">{level}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Progress Tracking */}
              <div className="space-y-4 mt-8">
                <h3 className="font-semibold" style={{ color: '#2C2C2C' }}>Learning Streaks</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center border-[#E5E5E5]">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" style={{ color: '#A51C30' }} />
                    <p className="text-2xl font-semibold" style={{ color: '#2C2C2C' }}>7</p>
                    <p className="text-sm" style={{ color: '#666666' }}>Day Streak</p>
                  </Card>
                  <Card className="p-4 text-center border-[#E5E5E5]">
                    <Star className="h-8 w-8 mx-auto mb-2" style={{ color: '#A51C30' }} />
                    <p className="text-2xl font-semibold" style={{ color: '#2C2C2C' }}>23</p>
                    <p className="text-sm" style={{ color: '#666666' }}>Lessons Completed</p>
                  </Card>
                  <Card className="p-4 text-center border-[#E5E5E5]">
                    <Brain className="h-8 w-8 mx-auto mb-2" style={{ color: '#A51C30' }} />
                    <p className="text-2xl font-semibold" style={{ color: '#2C2C2C' }}>85%</p>
                    <p className="text-sm" style={{ color: '#666666' }}>Average Score</p>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="new-language" className="space-y-6">
            <Card className="p-6 bg-white border-[#E5E5E5]">
              <h2 className="text-xl font-semibold mb-6" style={{ color: '#2C2C2C' }}>
                Start Learning a New Language
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableNewLanguages.map((language) => (
                  <Card 
                    key={language.code} 
                    className={`p-6 cursor-pointer transition-all border-2 ${
                      selectedLanguage === language.code 
                        ? 'border-[#A51C30] bg-[#FEF2F2]' 
                        : 'border-[#E5E5E5] hover:border-[#A51C30]/50'
                    }`}
                    onClick={() => setSelectedLanguage(language.code)}
                  >
                    <div className="text-center space-y-3">
                      <div className="text-4xl">{language.flag}</div>
                      <div>
                        <h3 className="font-semibold" style={{ color: '#2C2C2C' }}>
                          {language.name}
                        </h3>
                        {language.popular && (
                          <Badge variant="secondary" className="mt-1">Popular</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {selectedLanguage && (
                <div className="mt-6 p-4 bg-[#F9F7F4] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold" style={{ color: '#2C2C2C' }}>
                        Ready to start {availableNewLanguages.find(l => l.code === selectedLanguage)?.name}?
                      </h3>
                      <p className="text-sm" style={{ color: '#666666' }}>
                        We'll use your motivation and preferences to create a personalized learning experience.
                      </p>
                    </div>
                    <Button 
                      onClick={() => onStartLearning(selectedLanguage)}
                      className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC] flex items-center space-x-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Learning</span>
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 bg-white border-[#E5E5E5]">
              <h2 className="text-xl font-semibold mb-6" style={{ color: '#2C2C2C' }}>
                Profile Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: '#2C2C2C' }}>Basic Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm" style={{ color: '#666666' }}>Nationality</p>
                      <p className="font-medium" style={{ color: '#2C2C2C' }}>{userProfile.nationality}</p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#666666' }}>Learning Context</p>
                      <p className="font-medium" style={{ color: '#2C2C2C' }}>
                        {userProfile.learningPreferences.contextualUse}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3" style={{ color: '#2C2C2C' }}>Languages</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm" style={{ color: '#666666' }}>Native Languages</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {userProfile.nativeLanguages.map((lang) => (
                          <Badge key={lang} className="bg-[#00693E] text-[#FCFCFC]">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#666666' }}>Additional Languages</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {userProfile.additionalLanguages.map((lang) => (
                          <Badge key={lang} variant="outline">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3" style={{ color: '#2C2C2C' }}>Learning Preferences</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm" style={{ color: '#666666' }}>Preferred Style</p>
                      <p className="font-medium" style={{ color: '#2C2C2C' }}>
                        {userProfile.learningPreferences.style}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#666666' }}>Time Budget</p>
                      <p className="font-medium" style={{ color: '#2C2C2C' }}>
                        {userProfile.learningPreferences.timeLimit} hours
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3" style={{ color: '#2C2C2C' }}>Motivation</h3>
                  <p style={{ color: '#666666' }}>
                    {userProfile.learningPreferences.motivation}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}