import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { CheckCircle, Clock } from 'lucide-react';

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

interface PlacementTestProps {
  userProfile: UserProfile;
  onComplete: (results: Record<string, string>) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

const sampleQuestions: Record<string, Question[]> = {
  'Standard Malay': [
    {
      id: '1',
      question: 'Pilih jawapan yang betul: "Saya _____ ke sekolah setiap hari."',
      options: ['pergi', 'perlu', 'dapat', 'mahu'],
      correctAnswer: 0,
      level: 'A1'
    },
    {
      id: '2', 
      question: 'Apakah maksud "mempertimbangkan" dalam ayat: "Kita perlu mempertimbangkan semua pilihan."',
      options: ['mengingat', 'memikirkan dengan teliti', 'melupakan', 'menolak'],
      correctAnswer: 1,
      level: 'B1'
    }
  ],
  'English': [
    {
      id: '1',
      question: 'Choose the correct answer: "I _____ to the store yesterday."',
      options: ['go', 'went', 'going', 'will go'],
      correctAnswer: 1,
      level: 'A2'
    },
    {
      id: '2',
      question: 'What does "procrastinate" mean?',
      options: ['to do immediately', 'to delay or postpone', 'to finish quickly', 'to organize'],
      correctAnswer: 1,
      level: 'B2'
    }
  ],
  'Standard Simplified Chinese': [
    {
      id: '1',
      question: '选择正确答案：我今天___去商店。',
      options: ['要', '了', '过', '着'],
      correctAnswer: 0,
      level: 'A1'
    },
    {
      id: '2',
      question: '"锲而不舍"的意思是什么？',
      options: ['半途而废', '坚持不懈', '犹豫不决', '随便放弃'],
      correctAnswer: 1,
      level: 'B2'
    }
  ]
};

export function PlacementTest({ userProfile, onComplete }: PlacementTestProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [completedLanguages, setCompletedLanguages] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const testLanguages = [...userProfile.nativeLanguages, ...userProfile.additionalLanguages];
  const currentQuestions = currentLanguage ? sampleQuestions[currentLanguage] || [] : [];
  const currentQuestion = currentQuestions[currentQuestionIndex];

  const calculateLevel = (languageAnswers: number[]): string => {
    const correctCount = languageAnswers.reduce((count, answer, index) => {
      const question = currentQuestions[index];
      return count + (answer === question?.correctAnswer ? 1 : 0);
    }, 0);
    
    const percentage = correctCount / languageAnswers.length;
    
    if (percentage >= 0.9) return 'C2';
    if (percentage >= 0.8) return 'C1';
    if (percentage >= 0.7) return 'B2';
    if (percentage >= 0.6) return 'B1';
    if (percentage >= 0.4) return 'A2';
    return 'A1';
  };

  const startTest = (language: string) => {
    setCurrentLanguage(language);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;

    const languageAnswers = answers[currentLanguage] || [];
    languageAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(prev => ({ ...prev, [currentLanguage]: languageAnswers }));

    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Test completed for this language
      const level = calculateLevel([...languageAnswers, selectedAnswer]);
      setTestResults(prev => ({ ...prev, [currentLanguage]: level }));
      setCompletedLanguages(prev => [...prev, currentLanguage]);
      setCurrentLanguage('');
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
    }
  };

  const completeAllTests = () => {
    onComplete(testResults);
  };

  if (!currentLanguage) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 bg-white border-[#E5E5E5]">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                Placement Tests
              </h1>
              <p style={{ color: '#666666' }}>
                Take CEFR-based tests for your languages to determine your proficiency level
              </p>
            </div>

            <div className="space-y-4">
              {testLanguages.map((language) => (
                <Card key={language} className="p-6 border-[#E5E5E5]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        completedLanguages.includes(language) ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {completedLanguages.includes(language) ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Clock className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: '#2C2C2C' }}>{language}</h3>
                        {completedLanguages.includes(language) && testResults[language] && (
                          <p className="text-sm text-green-600">
                            Level: {testResults[language]}
                          </p>
                        )}
                        {!completedLanguages.includes(language) && (
                          <p className="text-sm" style={{ color: '#666666' }}>
                            {userProfile.nativeLanguages.includes(language) ? 'Native' : 'Additional'} Language
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {!completedLanguages.includes(language) && (
                      <Button 
                        onClick={() => startTest(language)}
                        className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC]"
                      >
                        Start Test
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {completedLanguages.length === testLanguages.length && (
              <div className="text-center mt-8">
                <Button 
                  onClick={completeAllTests}
                  size="lg"
                  className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC]"
                >
                  Continue to Dashboard
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-8 bg-white border-[#E5E5E5]">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold" style={{ color: '#2C2C2C' }}>
                {currentLanguage} Placement Test
              </h2>
              <span className="text-sm" style={{ color: '#666666' }}>
                Question {currentQuestionIndex + 1} of {currentQuestions.length}
              </span>
            </div>
            <Progress 
              value={(currentQuestionIndex / currentQuestions.length) * 100} 
              className="h-2"
            />
          </div>

          {currentQuestion && (
            <div className="space-y-6">
              <div className="p-6 bg-[#F9F7F4] rounded-lg">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                  {currentQuestion.question}
                </h3>
                
                <RadioGroup 
                  value={selectedAnswer?.toString()} 
                  onValueChange={(value) => setSelectedAnswer(parseInt(value))}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentLanguage('')}
                >
                  Back to Tests
                </Button>
                
                <Button 
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null}
                  className="bg-[#A51C30] hover:bg-[#8B1728] text-[#FCFCFC]"
                >
                  {currentQuestionIndex < currentQuestions.length - 1 ? 'Next Question' : 'Complete Test'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}