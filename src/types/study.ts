export interface QuizQuestion {
  id?: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface GeneratedStudyData {
  topic: string;
  explanation: string;
  keyPoints: string[];
  practicalExample: string;
  quizQuestions: QuizQuestion[];
  challenge: string;
}

export interface StudySession extends GeneratedStudyData {
  id?: string;
  userId?: string;
  createdAt: number;
}
