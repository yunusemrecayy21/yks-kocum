export interface AuthUser {
  uid: string;
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export type GradeLevel = '9. Sınıf' | '10. Sınıf' | '11. Sınıf' | '12. Sınıf' | 'Mezun';

export type StudyField = 'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil' | 'Sadece TYT';

export interface UserOnboardingProfile {
  gradeLevel: GradeLevel;
  studyField: StudyField;
  targetUniversity: string;
  targetDepartment: string;
  completedAt: string;
}

export interface StudentProfile {
  name: string;
  targetField: 'SAY' | 'EA' | 'SÖZ' | 'DİL';
  targetUniversity: string;
  targetDepartment: string;
  examYear: number;
}

export type Subject = 
  | 'Türkçe'
  | 'Matematik'
  | 'Geometri'
  | 'Fizik'
  | 'Kimya'
  | 'Biyoloji'
  | 'Tarih'
  | 'Coğrafya'
  | 'Felsefe'
  | 'Din Kültürü'
  | 'Edebiyat'
  | 'Yabancı Dil';

export interface StudyTask {
  id: string;
  subject: Subject;
  topic: string;
  durationMinutes?: number;
  completed: boolean;
  date: string; // YYYY-MM-DD
  category: 'TYT' | 'AYT' | 'Tekrar' | 'Soru Çözümü';
}

export interface TYTScore {
  turkce: number; // Max 40
  matematik: number; // Max 40
  sosyal: number; // Max 20
  fen: number; // Max 20
  total: number;
}

export interface AYTScore {
  matematik?: number;
  fizik?: number;
  kimya?: number;
  biyoloji?: number;
  edebiyat?: number;
  tarih1?: number;
  cografya1?: number;
  total: number;
}

export interface TrialExam {
  id: string;
  examType: 'TYT' | 'AYT';
  field?: StudyField;
  name: string;
  date: string;
  publisher?: string;
  scores: {
    turkce?: number;
    matematik?: number;
    sosyal?: number;
    fen?: number;
    edebiyat?: number;
    sosyal1?: number;
    sosyal2?: number;
    ydt?: number;
    total: number;
  };
}
