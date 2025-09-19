import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nationality: '',
    nativeLanguages: [] as string[],
    additionalLanguages: [] as string[],
    contextualUse: 'personal' as 'professional' | 'personal',
    motivation: '',
    timeLimit: 40,
    learningStyle: ''
  });

  const supportedLanguages = [
    'Standard Malay',
    'English', 
    'Standard Simplified Chinese'
  ];

  const handleLanguageToggle = (language: string, type: 'native' | 'additional') => {
    const key = type === 'native' ? 'nativeLanguages' : 'additionalLanguages';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].includes(language) 
        ? prev[key].filter(l => l !== language)
        : [...prev[key], language]
    }));
  };

  const handleComplete = () => {
    const profile: UserProfile = {
      id: Date.now().toString(),
      nationality: formData.nationality,
      nativeLanguages: formData.nativeLanguages,
      additionalLanguages: formData.additionalLanguages,
      placementResults: {},
      learningPreferences: {
        style: formData.learningStyle,
        contextualUse: formData.contextualUse,
        motivation: formData.motivation,
        timeLimit: formData.timeLimit
      }
    };
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-8 bg-white border-[#E5E5E5]">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2C2C2C' }}>
              Set Up Your Profile
            </h1>
            <p style={{ color: '#666666' }}>
              Help us understand your language background and learning goals
            </p>
            <div className="flex space-x-2 mt-4">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className={`h-2 flex-1 rounded ${i <= step ? 'bg-[#A51C30]' : 'bg-[#E5E5E5]'}`}
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold" style={{ color: '#2C2C2C' }}>
                Language Background
              </h2>
              
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="malaysian">Malaysian</SelectItem>
                    <SelectItem value="singaporean">Singaporean</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Native Languages (up to 3)</Label>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Currently supporting: Standard Malay, English, Standard Simplified Chinese
                </p>
                {supportedLanguages.map((lang) => (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`native-${lang}`}
                      checked={formData.nativeLanguages.includes(lang)}
                      onCheckedChange={() => handleLanguageToggle(lang, 'native')}
                      disabled={formData.nativeLanguages.length >= 3 && !formData.nativeLanguages.includes(lang)}
                    />
                    <Label htmlFor={`native-${lang}`}>{lang}</Label>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label>Additional Languages (non-native)</Label>
                {supportedLanguages.map((lang) => (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`additional-${lang}`}
                      checked={formData.additionalLanguages.includes(lang)}
                      onCheckedChange={() => handleLanguageToggle(lang, 'additional')}
                    />
                    <Label htmlFor={`additional-${lang}`}>{lang}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold" style={{ color: '#2C2C2C' }}>
                Learning Context
              </h2>
              
              <div className="space-y-4">
                <Label>What's your primary purpose for learning?</Label>
                <RadioGroup 
                  value={formData.contextualUse}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contextualUse: value as 'professional' | 'personal' }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="professional" id="professional" />
                    <Label htmlFor="professional">Professional</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="personal" id="personal" />
                    <Label htmlFor="personal">Personal Interest</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation">Describe your motivation in detail</Label>
                <p className="text-sm" style={{ color: '#666666' }}>
                  The more detailed you describe, the more the content will suit your situation/taste.
                  {formData.contextualUse === 'professional' 
                    ? ' For example: "I want to learn Spanish because I realized Malaysia has a $7 trillion blindspot in Latin America trade"'
                    : ' For example: "I want to learn Italian because I have a crush on a comic character named Gion Constantino from the Prince Series"'
                  }
                </p>
                <Textarea 
                  id="motivation"
                  placeholder="Describe your motivation..."
                  value={formData.motivation}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold" style={{ color: '#2C2C2C' }}>
                Learning Preferences
              </h2>
              
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Course Duration (hours)</Label>
                <Input 
                  id="timeLimit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 40 }))}
                  min={1}
                  max={200}
                />
              </div>

              <div className="space-y-3">
                <Label>Preferred Learning Style</Label>
                <RadioGroup 
                  value={formData.learningStyle}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, learningStyle: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="visual" id="visual" />
                    <Label htmlFor="visual">Visual (icons, pictures, mind maps)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="textual" id="textual" />
                    <Label htmlFor="textual">Text-based explanations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mixed" id="mixed" />
                    <Label htmlFor="mixed">Mixed approach</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mnemonics" id="mnemonics" />
                    <Label htmlFor="mnemonics">Mnemonics and memory aids</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC] flex items-center space-x-2"
                disabled={step === 1 && (!formData.nationality || formData.nativeLanguages.length === 0)}
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC]"
                disabled={!formData.motivation || !formData.learningStyle}
              >
                Complete Setup
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}