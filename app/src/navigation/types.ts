import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Main: undefined;
  Error: { type?: 'notFound' | 'server' | 'generic'; message?: string };
  Login: undefined;
  Register: undefined;
  ParentRegister: undefined;
  ParentRegisterForm: { phone: string; existing?: boolean };
  TeacherRegister: undefined;
  AboutUs: undefined;
  ContactUs: undefined;
  Faq: undefined;
  ForYou: undefined;
  Features: undefined;
  HowItWorks: undefined;
  ForParents: undefined;
  ForStudents: undefined;
  ForTeachers: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  ParentDashboard: undefined;
  ParentMarketplace: undefined;
  ParentStudents: undefined;
  ParentClasses: undefined;
  TeacherDashboard: undefined;
  TeacherBatches: undefined;
  TeacherClasses: undefined;
  StudentDashboard: undefined;
  StudentCourses: undefined;
  StudentClasses: undefined;
  StudentExams: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  ParentTabs: undefined;
  TeacherTabs: undefined;
  StudentTabs: undefined;
};

export type ParentTabParamList = {
  ParentDashboard: undefined;
  ParentMarketplace: undefined;
  ParentStudents: undefined;
  ParentClasses: undefined;
};

export type TeacherTabParamList = {
  TeacherDashboard: undefined;
  TeacherBatches: undefined;
  TeacherClasses: undefined;
};

export type StudentTabParamList = {
  StudentDashboard: undefined;
  StudentCourses: undefined;
  StudentClasses: undefined;
  StudentExams: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
