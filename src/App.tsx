import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ProfileSetup } from './components/ProfileSetup';
import { Dashboard } from './components/Dashboard';
import { PlacementTest } from './components/PlacementTest';
import { LearningFlow } from './components/LearningFlow';

type AppState = 'landing' | 'profile-setup' | 'placement-test' | 'dashboard' | 'learning';

interface UserProfile {
  id: string;
  nationality: string;
  nativeLanguages: string[];
  additionalLanguages: string[];
  placementResults: Record<string, string>; // language -> CEFR level
  learningPreferences: {
    style: string;
    contextualUse: 'professional' | 'personal';
    motivation: string;
    timeLimit: number; // in hours
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppState>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentView('placement-test');
  };

  const handlePlacementComplete = (results: Record<string, string>) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        placementResults: results
      });
      setCurrentView('dashboard');
    }
  };

  const handleStartLearning = (language: string) => {
    setSelectedLanguage(language);
    setCurrentView('learning');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {currentView === 'landing' && (
        <LandingPage onGetStarted={() => setCurrentView('profile-setup')} />
      )}
      
      {currentView === 'profile-setup' && (
        <ProfileSetup onComplete={handleProfileComplete} />
      )}
      
      {currentView === 'placement-test' && userProfile && (
        <PlacementTest 
          userProfile={userProfile}
          onComplete={handlePlacementComplete} 
        />
      )}
      
      {currentView === 'dashboard' && userProfile && (
        <Dashboard 
          userProfile={userProfile}
          onStartLearning={handleStartLearning}
        />
      )}
      
      {currentView === 'learning' && userProfile && selectedLanguage && (
        <LearningFlow 
          userProfile={userProfile}
          targetLanguage={selectedLanguage}
          onBackToDashboard={handleBackToDashboard}
        />
      )}
    </div>
  );
}