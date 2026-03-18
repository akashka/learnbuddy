/**
 * Indian education boards, classes 6-12, and subjects mapped per board/class
 * Based on curricula taught across the country (CBSE, ICSE, State Boards)
 */

export const BOARDS = [
  'CBSE',
  'ICSE',
  'IB',
  'State Board - Andhra Pradesh',
  'State Board - Bihar',
  'State Board - Gujarat',
  'State Board - Karnataka',
  'State Board - Kerala',
  'State Board - Maharashtra',
  'State Board - Rajasthan',
  'State Board - Tamil Nadu',
  'State Board - Uttar Pradesh',
  'State Board - West Bengal',
  'NIOS',
];

export const CLASSES = ['6', '7', '8', '9', '10', '11', '12'];

export const ALL_SUBJECTS = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'Sanskrit',
  'Social Studies',
  'History',
  'Geography',
  'Political Science',
  'Economics',
  'Computer Science',
  'Accountancy',
  'Business Studies',
  'Psychology',
  'Sociology',
  'Physical Education',
  'Telugu',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Tamil',
  'Bengali',
  'Environmental Studies (EVS)',
];

// Board-Class-Subject mapping - key is class group (6-8, 9-10, 11-12)
const BOARD_CLASS_SUBJECTS: Record<string, Record<string, string[]>> = {
  // Classes 6, 7, 8 - Middle school
  '6-8': {
    CBSE: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Sanskrit', 'Computer Science'],
    ICSE: ['Mathematics', 'Science', 'English', 'Hindi', 'History', 'Geography', 'Computer Science'],
    IB: ['Mathematics', 'Science', 'English', 'Hindi', 'Humanities', 'Computer Science'],
    'State Board - Andhra Pradesh': ['Mathematics', 'Science', 'English', 'Telugu', 'Social Studies', 'Computer Science'],
    'State Board - Bihar': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
    'State Board - Gujarat': ['Mathematics', 'Science', 'English', 'Gujarati', 'Social Studies'],
    'State Board - Karnataka': ['Mathematics', 'Science', 'English', 'Kannada', 'Social Studies'],
    'State Board - Kerala': ['Mathematics', 'Science', 'English', 'Malayalam', 'Social Studies'],
    'State Board - Maharashtra': ['Mathematics', 'Science', 'English', 'Marathi', 'Social Studies'],
    'State Board - Rajasthan': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
    'State Board - Tamil Nadu': ['Mathematics', 'Science', 'English', 'Tamil', 'Social Studies'],
    'State Board - Uttar Pradesh': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
    'State Board - West Bengal': ['Mathematics', 'Science', 'English', 'Bengali', 'Social Studies'],
    NIOS: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
  },
  // Classes 9, 10 - Secondary
  '9-10': {
    CBSE: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Sanskrit', 'Computer Science'],
    ICSE: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'History', 'Geography', 'Computer Science'],
    IB: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Humanities'],
    'State Board - Andhra Pradesh': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social Studies'],
    'State Board - Bihar': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
    'State Board - Gujarat': ['Mathematics', 'Science', 'English', 'Gujarati', 'Social Studies'],
    'State Board - Karnataka': ['Mathematics', 'Science', 'English', 'Kannada', 'Social Studies'],
    'State Board - Kerala': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Malayalam', 'Social Studies'],
    'State Board - Maharashtra': ['Mathematics', 'Science', 'English', 'Marathi', 'Social Studies'],
    'State Board - Rajasthan': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
    'State Board - Tamil Nadu': ['Mathematics', 'Science', 'English', 'Tamil', 'Social Studies'],
    'State Board - Uttar Pradesh': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
    'State Board - West Bengal': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Bengali', 'Social Studies'],
    NIOS: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
  },
  // Classes 11, 12 - Senior Secondary (Science, Commerce, Humanities streams combined)
  '11-12': {
    CBSE: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Business Studies', 'Economics', 'History', 'Geography', 'Political Science', 'Psychology', 'Sociology', 'Computer Science', 'Physical Education'],
    ICSE: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'Business Studies', 'History', 'Geography', 'Political Science', 'Computer Science'],
    IB: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Economics', 'Business Studies', 'History', 'Psychology'],
    'State Board - Andhra Pradesh': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'Business Studies', 'History', 'Political Science'],
    'State Board - Bihar': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
    'State Board - Gujarat': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
    'State Board - Karnataka': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
    'State Board - Kerala': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
    'State Board - Maharashtra': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
    'State Board - Rajasthan': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
    'State Board - Tamil Nadu': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
    'State Board - Uttar Pradesh': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
    'State Board - West Bengal': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
    NIOS: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'History', 'Political Science'],
  },
};

function getClassGroup(classLevel: string): string {
  const n = parseInt(classLevel, 10);
  if (n >= 6 && n <= 8) return '6-8';
  if (n >= 9 && n <= 10) return '9-10';
  if (n >= 11 && n <= 12) return '11-12';
  return '6-8';
}

function getSubjectsForBoardClass(board: string, classLevel: string): string[] {
  const group = getClassGroup(classLevel);
  const classMap = BOARD_CLASS_SUBJECTS[group] || BOARD_CLASS_SUBJECTS['6-8'];
  const subjects = classMap[board] || classMap['CBSE'] || ['Mathematics', 'Science', 'English', 'Social Studies'];
  return [...new Set(subjects)];
}

export function getBoardClassSubjectMappings(): { board: string; classLevel: string; subjects: string[] }[] {
  const mappings: { board: string; classLevel: string; subjects: string[] }[] = [];
  for (const classLevel of CLASSES) {
    for (const board of BOARDS) {
      const subjects = getSubjectsForBoardClass(board, classLevel);
      mappings.push({ board, classLevel, subjects });
    }
  }
  return mappings;
}

const DEFAULT_TOPICS: Record<string, string[]> = {
  Mathematics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Number System', 'Fractions', 'Equations', 'Mensuration', 'Probability'],
  Science: ['Physics - Motion', 'Physics - Force', 'Chemistry - Atoms', 'Chemistry - Reactions', 'Biology - Cells', 'Biology - Human Body', 'Light', 'Sound', 'Electricity', 'Magnetism'],
  English: ['Grammar', 'Comprehension', 'Essay Writing', 'Vocabulary', 'Literature', 'Poetry', 'Prose', 'Letter Writing'],
  Physics: ['Motion', 'Force', 'Work and Energy', 'Light', 'Sound', 'Electricity', 'Magnetism', 'Heat', 'Waves'],
  Chemistry: ['Atoms', 'Molecules', 'Chemical Reactions', 'Acids and Bases', 'Periodic Table', 'Organic Chemistry', 'States of Matter'],
  Biology: ['Cells', 'Human Body', 'Plant Kingdom', 'Animal Kingdom', 'Genetics', 'Ecology', 'Health and Disease'],
  'Social Studies': ['History', 'Geography', 'Civics', 'Economics', 'Indian Freedom Struggle', 'World History'],
};

export function getDefaultTopicsForSeeding(): { board: string; classLevel: string; subject: string; topic: string; displayOrder: number }[] {
  const result: { board: string; classLevel: string; subject: string; topic: string; displayOrder: number }[] = [];
  for (const classLevel of CLASSES) {
    for (const board of ['CBSE', 'ICSE']) {
      const subjects = getSubjectsForBoardClass(board, classLevel);
      for (const subject of subjects) {
        const topics = DEFAULT_TOPICS[subject] || DEFAULT_TOPICS['Mathematics'];
        topics.forEach((topic, i) => {
          result.push({ board, classLevel, subject, topic, displayOrder: i + 1 });
        });
      }
    }
  }
  return result;
}
