import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Globe, Brain, Target, Users } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8" style={{ color: '#A51C30' }} />
              <h1 className="text-2xl font-semibold" style={{ color: '#2C2C2C' }}>LinguaFlow</h1>
            </div>
            <Button 
              onClick={onGetStarted}
              className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC]"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-semibold mb-6" style={{ color: '#2C2C2C' }}>
            Master Languages Through Your <span style={{ color: '#A51C30' }}>Personal Interests</span>
          </h2>
          <p className="text-xl mb-8" style={{ color: '#666666' }}>
            Revolutionary thematic contextualization that wraps language learning around what you love - 
            from fictional characters to professional goals.
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC] px-8 py-3 text-lg"
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center bg-white border-[#E5E5E5]">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#A51C30] flex items-center justify-center">
                <Brain className="h-6 w-6 text-[#FCFCFC]" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#2C2C2C' }}>Thematic Learning</h3>
              <p className="text-sm" style={{ color: '#666666' }}>
                Learn through your favorite characters, interests, and professional contexts
              </p>
            </Card>

            <Card className="p-6 text-center bg-white border-[#E5E5E5]">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#00693E] flex items-center justify-center">
                <Target className="h-6 w-6 text-[#FCFCFC]" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#2C2C2C' }}>Adaptive Pacing</h3>
              <p className="text-sm" style={{ color: '#666666' }}>
                AI-powered progress tracking with anti-procrastination tools
              </p>
            </Card>

            <Card className="p-6 text-center bg-white border-[#E5E5E5]">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#002147] flex items-center justify-center">
                <Globe className="h-6 w-6 text-[#FCFCFC]" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#2C2C2C' }}>Multi-Language Support</h3>
              <p className="text-sm" style={{ color: '#666666' }}>
                Malay, English, Chinese natives learning Spanish, Guaraní, and more
              </p>
            </Card>

            <Card className="p-6 text-center bg-white border-[#E5E5E5]">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#671372] flex items-center justify-center">
                <Users className="h-6 w-6 text-[#FCFCFC]" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#2C2C2C' }}>Real-world Application</h3>
              <p className="text-sm" style={{ color: '#666666' }}>
                Practice in professional and personal contexts that matter to you
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12" style={{ color: '#2C2C2C' }}>
            How LinguaFlow Works
          </h2>
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-[#A51C30] text-[#FCFCFC] flex items-center justify-center font-semibold">1</div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#2C2C2C' }}>Profile & Placement</h3>
                <p style={{ color: '#666666' }}>
                  Set up your language profile and take CEFR-based placement tests to determine your starting level.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-[#A51C30] text-[#FCFCFC] flex items-center justify-center font-semibold">2</div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#2C2C2C' }}>Customize Your Flow</h3>
                <p style={{ color: '#666666' }}>
                  Drag and drop learning templates, choose your inspiration (characters, goals), and set your timeline.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-[#A51C30] text-[#FCFCFC] flex items-center justify-center font-semibold">3</div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#2C2C2C' }}>Three-Phase Learning</h3>
                <p style={{ color: '#666666' }}>
                  Progress through New Knowledge, Consolidate Practice, and Real-Life Simulation phases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-[#FCFCFC] py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p>&copy; 2024 LinguaFlow. Revolutionizing language learning through personal contextualization.</p>
        </div>
      </footer>
    </div>
  );
}