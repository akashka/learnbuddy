/**
 * Enterprise-level seed data generators for rigorous testing.
 * Dummy phone numbers and emails - safe for dev/test.
 */

import { BOARDS, CLASSES, getBoardClassSubjectMappings } from './seed-data';

// Build lookup: `${board}|${classLevel}` -> subjects
const boardClassSubjectsMap = new Map<string, string[]>();
for (const m of getBoardClassSubjectMappings()) {
  boardClassSubjectsMap.set(`${m.board}|${m.classLevel}`, m.subjects);
}

// Indian first names (common)
const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Arjun', 'Aisha', 'Rahul', 'Priya', 'Vikram', 'Sneha',
  'Rohan', 'Kavya', 'Siddharth', 'Ishita', 'Karan', 'Neha', 'Vivek', 'Pooja', 'Raj', 'Anjali',
  'Amit', 'Divya', 'Sanjay', 'Meera', 'Vikrant', 'Shreya', 'Manish', 'Kritika', 'Deepak', 'Riya',
  'Nikhil', 'Tanvi', 'Abhishek', 'Sakshi', 'Gaurav', 'Nidhi', 'Ravi', 'Komal', 'Suresh', 'Pallavi',
  'Manoj', 'Swati', 'Ashok', 'Preeti', 'Sunil', 'Anita', 'Vinod', 'Kavita', 'Prakash', 'Rekha',
  'Sachin', 'Monika', 'Ajay', 'Priti', 'Anil', 'Jyoti', 'Ramesh', 'Sunita', 'Mahesh', 'Lakshmi',
  'Dinesh', 'Sarita', 'Harish', 'Usha', 'Mukesh', 'Geeta', 'Satish', 'Vandana', 'Pradeep', 'Kiran',
  'Rakesh', 'Madhuri', 'Vijay', 'Shalini', 'Arun', 'Nisha', 'Sandeep', 'Ritu', 'Rajesh', 'Simran',
  'Gopal', 'Kavita', 'Bharat', 'Sonal', 'Chandan', 'Rashmi', 'Dilip', 'Padmini', 'Girish', 'Mamta',
  'Harsh', 'Tanya', 'Ishaan', 'Aaradhya', 'Krishna', 'Diya', 'Ved', 'Aria', 'Reyansh', 'Myra',
];

// Indian last names
const LAST_NAMES = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Joshi',
  'Mehta', 'Desai', 'Shah', 'Pillai', 'Rao', 'Menon', 'Nambiar', 'Kulkarni', 'Bhat', 'Acharya',
  'Banerjee', 'Chatterjee', 'Mukherjee', 'Das', 'Roy', 'Ghosh', 'Bose', 'Dutta', 'Sengupta', 'Mitra',
  'Kapoor', 'Malhotra', 'Khanna', 'Chopra', 'Bajaj', 'Sethi', 'Tandon', 'Saxena', 'Agarwal', 'Goel',
  'Trivedi', 'Pandey', 'Mishra', 'Dubey', 'Tiwari', 'Shukla', 'Dwivedi', 'Srivastava', 'Yadav', 'Jha',
];

// Indian cities for location
const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut',
  'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Allahabad',
  'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur',
  'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli', 'Tiruchirappalli',
];

// Schools
const SCHOOL_NAMES = [
  'Delhi Public School', 'Kendriya Vidyalaya', 'DAV Public School', 'St. Xavier\'s School',
  'Bharatiya Vidya Bhavan', 'Ryan International', 'Amity International', 'The Heritage School',
  'Modern School', 'Spring Dale School', 'Loreto Convent', 'St. Mary\'s School',
  'Vidya Mandir', 'Sanskriti School', 'Step by Step School', 'The Shri Ram School',
  'Pathways School', 'Shiv Nadar School', 'GEMS Education', 'Billabong High',
  'Euro School', 'Podar International', 'Vibgyor High', 'Inventure Academy',
  'Oakridge International', 'Indus International', 'The International School',
  'GD Goenka', 'Manav Rachna', 'DPS International', 'Birla Vidya Niketan',
];

// Professions for teachers
const PROFESSIONS = [
  'Teacher', 'Engineer', 'Doctor', 'Professor', 'Housewife', 'Retired Teacher',
  'Software Engineer', 'Accountant', 'Business Owner', 'Freelancer', 'Consultant',
];

// Languages
const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Gujarati'];

// Slot times
const SLOT_TIMES = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:00', end: '18:00' },
  { start: '18:00', end: '19:00' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Review snippets
const REVIEW_SNIPPETS = [
  'Excellent teaching! My child improved significantly.',
  'Very patient and explains concepts clearly.',
  'Highly recommended. Great methodology.',
  'Professional and punctual. Good results.',
  'My daughter loves the classes. Thank you!',
  'Structured approach. Would recommend.',
  'Flexible with timings. Very helpful.',
  'Knowledgeable and engaging sessions.',
  'Great experience overall.',
  'Helped my son score well in exams.',
  'Dedicated teacher. Worth every penny.',
  'Clear communication with parents.',
  'Interactive teaching style.',
  'Consistent and reliable.',
  'Made difficult topics easy to understand.',
];

// Dispute subjects
const DISPUTE_SUBJECTS = [
  'Payment not received', 'Incorrect amount charged', 'Refund request', 'Class cancellation',
  'Schedule mismatch', 'Quality concern', 'Billing error', 'Duplicate charge',
  'Service not as described', 'Other payment issue',
];

// Job titles and teams
const JOB_TITLES = [
  'Senior Software Engineer', 'Product Manager', 'Data Analyst', 'UX Designer',
  'Marketing Manager', 'Sales Executive', 'HR Coordinator', 'Content Writer',
  'DevOps Engineer', 'QA Engineer', 'Business Analyst', 'Customer Success Manager',
];

const JOB_TEAMS = ['Engineering', 'Product', 'Marketing', 'Sales', 'HR', 'Operations', 'Design', 'Data'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const JOB_LOCATIONS = ['Mumbai', 'Bangalore', 'Remote', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai'];

// Contact submission types
const CONTACT_TYPES = ['concern', 'suggestion', 'feedback', 'other'] as const;
const CONTACT_SUBJECTS = [
  'General inquiry', 'Pricing question', 'Technical issue', 'Partnership', 'Feedback',
  'Complaint', 'Feature request', 'Account help', 'Teacher registration', 'Other',
];

export function getSubjectsForBoardAndClass(board: string, classLevel: string): string[] {
  const key = `${board}|${classLevel}`;
  const subjects = boardClassSubjectsMap.get(key) ?? boardClassSubjectsMap.get('CBSE|10') ?? ['Mathematics', 'Science', 'English'];
  return [...subjects];
}

export function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateName(index: number): string {
  const first = pick(FIRST_NAMES, index);
  const last = pick(LAST_NAMES, Math.floor(index / FIRST_NAMES.length));
  return `${first} ${last}`;
}

export function generateParentEmail(index: number): string {
  return `parent.seed${index}@test.guruchakra.local`;
}

export function generateTeacherEmail(index: number): string {
  return `teacher.seed${index}@test.guruchakra.local`;
}

export function generateStudentId(index: number): string {
  return `STU${String(index).padStart(6, '0')}`;
}

export function generateStudentEmail(studentId: string): string {
  return `${studentId.toLowerCase()}@guruchakra.local`;
}

/** Dummy phone - format +91 9XXXXXXXXX */
export function generatePhone(index: number): string {
  const suffix = String(9000000000 + (index % 1000000000)).slice(0, 10);
  return `+91 ${suffix.slice(0, 5)} ${suffix.slice(5)}`;
}

export function generateLocation(index: number): string {
  return pick(CITIES, index);
}

export function generateSchool(index: number): string {
  return pick(SCHOOL_NAMES, index) + (index % 5 === 0 ? ` - ${pick(CITIES, index)}` : '');
}

export function generateProfession(index: number): string {
  return pick(PROFESSIONS, index);
}

export function generateLanguages(index: number): string[] {
  const count = 1 + (index % 3);
  const shuffled = [...LANGUAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateSlot(index: number): { day: string; startTime: string; endTime: string } {
  const time = pick(SLOT_TIMES, index);
  const day = pick(DAYS, index);
  return { day, startTime: time.start, endTime: time.end };
}

export function generateReview(index: number): string {
  return pick(REVIEW_SNIPPETS, index);
}

export function generateDisputeSubject(index: number): string {
  return pick(DISPUTE_SUBJECTS, index);
}

export function generateJobTitle(index: number): string {
  return pick(JOB_TITLES, index);
}

export function generateJobTeam(index: number): string {
  return pick(JOB_TEAMS, index);
}

export function generateJobLocation(index: number): string {
  return pick(JOB_LOCATIONS, index);
}

export function generateContactSubject(index: number): string {
  return pick(CONTACT_SUBJECTS, index);
}

export { BOARDS, CLASSES };
