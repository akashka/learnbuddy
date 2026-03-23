/**
 * Matches backend `generateEasyPassword`: studentId + year of birth (e.g. STU1A2B3C2012).
 * Used to show login password in the parent app without storing plaintext server-side.
 */
export function getStudentLoginPassword(studentId: string, dateOfBirth?: string | Date | null): string {
  if (!studentId) return '';
  if (!dateOfBirth) {
    return studentId + new Date().getFullYear();
  }
  const d = new Date(dateOfBirth);
  if (Number.isNaN(d.getTime())) {
    return studentId + new Date().getFullYear();
  }
  return studentId + d.getFullYear();
}
