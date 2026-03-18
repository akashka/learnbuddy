import { BRAND, COMPANY } from './brand';

function aboutUsContent(): string {
  const valuesHtml = COMPANY.values
    .map(
      (v) =>
        `<li><strong>${v.name}:</strong> ${v.description}</li>`
    )
    .join('\n');
  const differentiatorsHtml = COMPANY.differentiators
    .map((d) => {
      const [title, desc] = d.split(' — ');
      return `<li><strong>${title}:</strong> ${desc}</li>`;
    })
    .join('\n');
  return `
      <h2>Who We Are</h2>
      <p>${COMPANY.descriptionLong}</p>
      <h2>Our Vision</h2>
      <p>${COMPANY.vision}</p>
      <h2>Our Mission</h2>
      <p>${COMPANY.mission}</p>
      <h2>Our Values</h2>
      <ul>
        ${valuesHtml}
      </ul>
      <h2>Why Choose ${BRAND.name}</h2>
      <ul>
        ${differentiatorsHtml}
      </ul>
      <h2>Get in Touch</h2>
      <p>Email: <a href="mailto:${COMPANY.contact.email}">${COMPANY.contact.email}</a> | Hours: ${COMPANY.contact.hours}</p>
    `.trim();
}

export const CMS_SEED_PAGES = [
  {
    slug: 'about-us',
    title: 'About Us',
    content: aboutUsContent(),
  },
  {
    slug: 'contact-us',
    title: 'Contact Us',
    content: `
      <p>Have questions, feedback, or need help? We'd love to hear from you. Our support team responds ${COMPANY.contact.responseTime.toLowerCase()}.</p>

      <h2>Get in Touch</h2>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:${COMPANY.contact.email}">${COMPANY.contact.email}</a></li>
        <li><strong>Hours:</strong> ${COMPANY.contact.hours}</li>
        <li><strong>Response time:</strong> ${COMPANY.contact.responseTime}</li>
      </ul>

      <h2>What We Can Help With</h2>
      <ul>
        <li>Account and login issues</li>
        <li>Enrollment and payment questions</li>
        <li>Teacher or parent support</li>
        <li>Technical problems with the app</li>
        <li>Refund requests (see <a href="/refund-policy">Refund Policy</a>)</li>
        <li>Privacy and data requests</li>
        <li>Partnership or career inquiries</li>
      </ul>

      <h2>Before You Contact Us</h2>
      <p>Check our <a href="/faq">FAQ</a> for quick answers to common questions. For legal matters, see our <a href="/privacy-policy">Privacy Policy</a> and <a href="/terms-conditions">Terms & Conditions</a>.</p>
    `.trim(),
  },
  {
    slug: 'faq',
    title: 'Frequently Asked Questions',
    content: `
      <h2>Frequently Asked Questions</h2>
      <p>Find answers to common questions about ${BRAND.name}. Can't find what you need? <a href="/contact-us">Contact us</a>.</p>

      <h3>General</h3>
      <h4>How does LearnBuddy work?</h4>
      <p>${BRAND.name} connects parents with verified teachers for one-to-one online tuition. Parents browse the marketplace, enroll their children in batches, and students attend live classes from home. AI monitors every session for safety, and students can ask AI doubts 24/7.</p>

      <h4>What boards and classes do you support?</h4>
      <p>We support CBSE, ICSE, and State Boards from Class 1 to Class 10. Subjects include Math, Science, English, Hindi, Physics, Chemistry, Biology, History, Geography, and more.</p>

      <h4>Is there a free trial?</h4>
      <p>Contact us at <a href="mailto:${COMPANY.contact.email}">${COMPANY.contact.email}</a> to learn about trial options for new users. We may offer a demo class or short trial based on availability.</p>

      <h4>What devices can I use?</h4>
      <p>${BRAND.name} works on Android and iOS mobile apps. You can also use a tablet or laptop for classes. A stable internet connection is recommended.</p>

      <h3>For Parents</h3>
      <h4>How do I find a teacher?</h4>
      <p>Download the app, register as a parent, add your child's details (board, class, subject), and browse the marketplace. Filter by board, class, and subject. View teacher profiles, reviews, and batch schedules before enrolling.</p>

      <h4>How do I enroll my child?</h4>
      <p>Select a batch, choose duration (3, 6, or 12 months—longer plans have discounts), pay securely through the app, and your child is enrolled. You'll receive the student ID and login details.</p>

      <h4>Can I reschedule or cancel a class?</h4>
      <p>Yes. Reschedule anytime through the app. Cancellation and refund policies apply as per our <a href="/refund-policy">Refund Policy</a>. Contact support for exceptional circumstances.</p>

      <h4>How can I track my child's progress?</h4>
      <p>Parents can view class schedules, attendance, performance reports, and AI-generated exam results in the app. We send regular updates so you stay informed.</p>

      <h4>Is it safe for my child?</h4>
      <p>Yes. Every class is AI-monitored for safety. All teachers undergo BGV (background verification) and AI qualification exams. We are DPDP compliant—your child's data is protected. See our <a href="/privacy-policy">Privacy Policy</a>.</p>

      <h3>For Students</h3>
      <h4>How do I join a class?</h4>
      <p>Your parent enrolls you and shares your Student ID. Log in with your Student ID and password, view your classes, and join live sessions at the scheduled time.</p>

      <h4>What if I have a doubt between classes?</h4>
      <p>Ask AI anytime! Our AI helps with doubts 24/7. You get instant explanations, study materials, and practice questions—no need to wait for the next class.</p>

      <h4>How do exams work?</h4>
      <p>Exams are AI-generated based on your syllabus. AI evaluates your answers fairly. If you disagree with a grade, you can request human review. Results are shared with you and your parent.</p>

      <h4>Can I learn from anywhere?</h4>
      <p>Yes. Use the app on your phone or tablet. Learn from home, during travel, or anywhere with internet. One-to-one attention means your teacher focuses only on you.</p>

      <h3>For Teachers</h3>
      <h4>How do I become a teacher?</h4>
      <p>Download the app, register as a teacher, complete your profile (qualifications, board, class, subjects), pass the AI qualification exam, and complete BGV verification. Once approved, create batches and start teaching.</p>

      <h4>What is the commission?</h4>
      <p>${BRAND.name} charges a transparent 10% commission on tuition fees collected. You keep 90% of what you earn. Payouts are processed monthly. See our <a href="/privacy-policy">Commission Model</a> and Payment Terms for details.</p>

      <h4>When do I get paid?</h4>
      <p>Earnings are calculated monthly and paid by the 10th of the following month. Ensure your bank details are correct in your profile. Minimum payout may apply—see Teacher Payment Terms.</p>

      <h4>Can I teach from home?</h4>
      <p>Yes. Set your own schedule, create batches that fit your availability, and teach from anywhere. The platform handles payments, scheduling, and student matching.</p>

      <h3>Payments & Refunds</h3>
      <h4>What payment methods do you accept?</h4>
      <p>We accept secure online payments through the app (UPI, cards, net banking). All transactions are encrypted. See our <a href="/terms-conditions">Terms & Conditions</a> for payment terms.</p>

      <h4>How do refunds work?</h4>
      <p>Full refund minus a processing fee may apply if you cancel within 7 days of payment and before classes start. After classes begin, pro-rata refunds may be considered in exceptional circumstances. See our <a href="/refund-policy">Refund Policy</a> for full details.</p>

      <h4>Are there any hidden fees?</h4>
      <p>No. Tuition fees are displayed clearly before enrollment. There are no hidden charges. Teachers see transparent commission deductions.</p>

      <h3>Safety & Privacy</h3>
      <h4>How is my data protected?</h4>
      <p>We are DPDP (Digital Personal Data Protection Act) compliant. Children's data is protected. We use encryption, secure storage, and strict access controls. See our <a href="/privacy-policy">Privacy Policy</a>.</p>

      <h4>What does AI monitoring do?</h4>
      <p>AI monitors every class for safety, quality, and engagement. It helps detect inappropriate content and ensures a safe learning environment. Parents get peace of mind. AI does not replace the teacher—it supports safety.</p>

      <h4>Are teachers verified?</h4>
      <p>Yes. All teachers undergo background verification (BGV) and pass an AI qualification exam before they can teach. We verify identity, qualifications, and conduct.</p>

      <h3>Technical & Account</h3>
      <h4>I forgot my password. What do I do?</h4>
      <p>Use the "Forgot Password" option on the login screen. You'll receive a reset link via email. For Student ID login, contact your parent or support.</p>

      <h4>I'm having technical issues. Who do I contact?</h4>
      <p>Contact us at <a href="mailto:${COMPANY.contact.email}">${COMPANY.contact.email}</a> or through the app. Our support team typically responds within 24 hours. Include your device, app version, and a description of the issue.</p>

      <h4>Can I delete my account?</h4>
      <p>Yes. You can request account deletion from the Privacy & Data section in your profile. We will process your request as per DPDP requirements. Note: Active enrollments must be completed or cancelled first.</p>

      <h4>How do I update my profile or bank details?</h4>
      <p>Go to Profile in the app and edit your details. For teachers, ensure bank details are correct for payouts. For parents, update student details if needed.</p>
    `.trim(),
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `
      <h2>Privacy Policy</h2>
      <p><strong>Last updated:</strong> March 2025 | <strong>DPDP Compliant</strong></p>
      <p>${BRAND.name} ("we", "our", "Platform") is committed to protecting your personal data. We comply with India's Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable data protection laws. This policy explains how we collect, use, store, and protect your information.</p>

      <h3>1. Information We Collect</h3>
      <h4>Information you provide</h4>
      <ul>
        <li><strong>Account:</strong> Name, email, phone number, password when you register</li>
        <li><strong>Parents:</strong> Child's name, board, class, subject, date of birth (for age verification)</li>
        <li><strong>Teachers:</strong> Qualifications, experience, bank details (for payouts), identity documents (for BGV)</li>
        <li><strong>Payments:</strong> Payment method details (processed securely by our payment provider)</li>
      </ul>
      <h4>Information collected automatically</h4>
      <ul>
        <li>Device type, IP address, app version for technical support</li>
        <li>Usage data (e.g., class attendance, feature usage) to improve services</li>
        <li>AI monitoring data during classes—used solely for safety and quality assurance</li>
      </ul>

      <h3>2. How We Use Your Data</h3>
      <ul>
        <li><strong>Service delivery:</strong> Matching students with teachers, scheduling classes, processing payments</li>
        <li><strong>Safety:</strong> AI monitoring of classes, BGV verification of teachers, fraud prevention</li>
        <li><strong>Communication:</strong> Class reminders, support, important updates</li>
        <li><strong>Improvement:</strong> Analytics (aggregated, anonymized) to improve the platform</li>
        <li><strong>Legal:</strong> Compliance with laws, responding to lawful requests</li>
      </ul>

      <h3>3. Children's Data (DPDP)</h3>
      <p>We treat children's data with special care. Parents provide consent for data collection when enrolling a child. We do not use children's data for marketing or profiling beyond what is necessary for the service. Parents can request access, correction, or deletion of their child's data at any time.</p>

      <h3>4. Data Sharing</h3>
      <p>We do not sell your data. We may share data with:</p>
      <ul>
        <li><strong>Service providers:</strong> Payment processors, cloud hosting, analytics (under strict agreements)</li>
        <li><strong>Teachers/Parents:</strong> Only as needed for classes (e.g., teacher sees student name)</li>
        <li><strong>Authorities:</strong> When required by law or to protect safety</li>
      </ul>

      <h3>5. Data Security</h3>
      <p>We implement industry-standard security: encryption in transit (HTTPS/TLS) and at rest, access controls, secure authentication, and regular security reviews. AI monitoring data is stored securely and retained only as necessary.</p>

      <h3>6. Data Retention</h3>
      <p>We retain data as long as your account is active and as required for legal, compliance, or dispute resolution purposes. You may request deletion; we will process it in accordance with DPDP requirements.</p>

      <h3>7. Your Rights (DPDP)</h3>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of your personal data</li>
        <li><strong>Correction:</strong> Correct inaccurate or incomplete data</li>
        <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention)</li>
        <li><strong>Withdraw consent:</strong> Where consent is the basis, you may withdraw it</li>
      </ul>
      <p>Use the Privacy & Data section in your profile or contact <a href="mailto:${COMPANY.contact.email}">${COMPANY.contact.email}</a>. We will respond within 30 days as per DPDP.</p>

      <h3>8. Data Breach</h3>
      <p>In the event of a data breach affecting your data, we will notify you and the Data Protection Board as required under the DPDP Act.</p>

      <h3>9. Cookies & Tracking</h3>
      <p>Our website may use cookies for essential functionality and analytics. You can manage cookie preferences in your browser. Our app does not use third-party tracking for advertising.</p>

      <h3>10. Contact</h3>
      <p>For privacy questions or to exercise your rights: <a href="mailto:${COMPANY.contact.email}">${COMPANY.contact.email}</a>. We respond typically within 24 hours.</p>
    `.trim(),
  },
  {
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    content: `
      <h2>Terms & Conditions</h2>
      <p><strong>Last updated:</strong> March 2025</p>
      <p>Welcome to ${BRAND.name}. By accessing or using our platform, you agree to these Terms & Conditions. Please read them carefully.</p>

      <h3>1. Acceptance of Terms</h3>
      <p>By registering, browsing, or using ${BRAND.name} (the "Platform"), you agree to be bound by these Terms, our <a href="/privacy-policy">Privacy Policy</a>, and any applicable policies (e.g., Refund Policy, Course Ownership Rules). If you do not agree, do not use the Platform.</p>

      <h3>2. Eligibility</h3>
      <p>You must be at least 18 years old to register as a parent or teacher. Parents register on behalf of minors (students). By registering a child, you confirm you are the parent or legal guardian and have authority to consent to these terms on their behalf.</p>

      <h3>3. Use of Service</h3>
      <p>${BRAND.name} provides an online tuition platform connecting parents, students, and teachers. You agree to:</p>
      <ul>
        <li>Use the Platform only for lawful, educational purposes</li>
        <li>Provide accurate, complete information</li>
        <li>Not misuse, abuse, or attempt to circumvent security</li>
        <li>Not share login credentials or allow unauthorized access</li>
        <li>Comply with all applicable laws</li>
      </ul>

      <h3>4. Accounts</h3>
      <p>You are responsible for maintaining the confidentiality of your account. Notify us immediately of unauthorized access. We may suspend or terminate accounts that violate these terms or for operational reasons.</p>

      <h3>5. Enrollment and Payments</h3>
      <ul>
        <li><strong>Enrollment:</strong> Subject to teacher and batch availability. Fees are as displayed at checkout.</li>
        <li><strong>Payment:</strong> Due at enrollment. We accept secure payment methods. All fees are in INR unless stated otherwise.</li>
        <li><strong>Refunds:</strong> As per our <a href="/refund-policy">Refund Policy</a>. No refunds for partial months or processing fees once applied.</li>
        <li><strong>Course access:</strong> Governed by our <a href="/course-ownership-rules">Course Ownership & Usage Rules</a>.</li>
      </ul>

      <h3>6. Teachers</h3>
      <p>Teachers must complete BGV verification and AI qualification exam before teaching. Commission, payment terms, and conduct are governed by separate agreements (Commission Model, Payment Terms, Code of Conduct) signed upon registration.</p>

      <h3>7. AI Monitoring</h3>
      <p>Classes are monitored by AI for safety and quality. By using the Platform, you consent to such monitoring. AI data is used solely for safety, quality assurance, and support—not for marketing or profiling.</p>

      <h3>8. Conduct</h3>
      <p>Users must maintain respectful, professional conduct. Harassment, discrimination, inappropriate content, or violation of student safety will result in immediate suspension or termination. We reserve the right to take action including reporting to authorities.</p>

      <h3>9. Intellectual Property</h3>
      <p>${BRAND.name} owns the platform, technology, and branding. Teachers retain rights to their teaching content. Users receive a limited license to access the service for the enrolled period. No copying, redistribution, or commercial use of platform content without permission.</p>

      <h3>10. Disclaimers</h3>
      <p>The Platform is provided "as is." We do not guarantee uninterrupted service or specific outcomes. We are not liable for teacher quality beyond our verification processes, or for issues arising from user conduct, internet connectivity, or third-party services.</p>

      <h3>11. Limitation of Liability</h3>
      <p>To the extent permitted by law, our liability is limited to the amount paid by you for the service in the 12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages.</p>

      <h3>12. Governing Law</h3>
      <p>These terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in India.</p>

      <h3>13. Changes</h3>
      <p>We may update these terms. Material changes will be notified via email or in-app notice. Continued use after changes constitutes acceptance.</p>

      <h3>14. Contact</h3>
      <p>For questions: <a href="mailto:${COMPANY.contact.email}">${COMPANY.contact.email}</a>. See also our <a href="/faq">FAQ</a> and <a href="/contact-us">Contact Us</a> page.</p>
    `.trim(),
  },
  // Teacher agreements
  // Parent purchase agreements
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    content: `
      <h2>LearnBuddy Refund Policy</h2>
      <p><strong>Effective Date:</strong> March 2025 | <strong>Version:</strong> 1.0</p>

      <h3>1. Tuition Fee Refunds</h3>
      <ul>
        <li><strong>Before classes start:</strong> Full refund minus a processing fee of ₹100 if you cancel within 7 days of payment and before the batch start date.</li>
        <li><strong>After classes start:</strong> No refund for the current month. Pro-rata refund may be considered for remaining months in exceptional circumstances (e.g., medical emergency) at LearnBuddy's discretion.</li>
      </ul>

      <h3>2. How to Request a Refund</h3>
      <p>Contact support@learnbuddy.com with your enrollment details and reason. Refund requests must be submitted within 30 days of the payment date.</p>

      <h3>3. Processing Time</h3>
      <p>Approved refunds are processed within 7–10 business days to the original payment method.</p>

      <h3>4. Non-Refundable</h3>
      <p>Processing fees, partial months of tuition, and any discounts availed are non-refundable.</p>
    `.trim(),
  },
  {
    slug: 'course-ownership-rules',
    title: 'Course Ownership & Usage Rules',
    content: `
      <h2>LearnBuddy Course Ownership & Usage Rules</h2>
      <p><strong>Effective Date:</strong> March 2025 | <strong>Version:</strong> 1.0</p>

      <h3>1. Course Access</h3>
      <p>When you purchase a course (enrollment), you receive access for the enrolled student(s) for the paid duration. Access is non-transferable to another person.</p>

      <h3>2. Ownership</h3>
      <ul>
        <li>LearnBuddy owns the platform, technology, and content structure. Teachers provide the teaching; you receive a license to access the service for the enrolled period.</li>
        <li>You do not own the course content, recordings, or materials. They are for personal educational use only.</li>
      </ul>

      <h3>3. Usage Rules</h3>
      <ul>
        <li>Classes are for the enrolled student only. Sharing login credentials or allowing others to attend in place of the student is prohibited.</li>
        <li>Recording or redistributing class content without permission is not allowed.</li>
        <li>Rescheduling and cancellation are subject to the platform's reschedule policy.</li>
      </ul>

      <h3>4. Teacher Assignment</h3>
      <p>LearnBuddy may reassign a different qualified teacher for the same subject/board/class if the original teacher becomes unavailable. You will be notified in advance.</p>
    `.trim(),
  },
  {
    slug: 'teacher-commission-model',
    title: 'Teacher Commission Model Agreement',
    content: `
      <h2>LearnBuddy Teacher Commission Model Agreement</h2>
      <p><strong>Effective Date:</strong> March 2025 | <strong>Version:</strong> 1.0</p>

      <h3>1. Introduction</h3>
      <p>This Commission Model Agreement ("Agreement") sets forth the terms under which LearnBuddy ("Platform") charges a commission from Teachers for tuition fees collected through the Platform. By signing this Agreement, you agree to the commission structure and related terms.</p>

      <h3>2. Commission Structure</h3>
      <ul>
        <li><strong>Default Commission:</strong> LearnBuddy charges a commission of <strong>10%</strong> on the tuition fees collected from parents for classes conducted by you.</li>
        <li><strong>Configurable Rate:</strong> The commission percentage may be adjusted by LearnBuddy (admin) for individual teachers from time to time, based on performance, tenure, or other factors. You will be notified of any change before it takes effect.</li>
        <li><strong>Deduction:</strong> The commission is deducted from your earnings before payout. For example, if a parent pays ₹2,000 for a month's tuition and your commission rate is 10%, you receive ₹1,800 (₹2,000 − 10% = ₹1,800).</li>
      </ul>

      <h3>3. What the Commission Covers</h3>
      <p>The commission covers Platform services including: student-teacher matching, payment processing, class scheduling, AI monitoring for safety, customer support, and platform maintenance.</p>

      <h3>4. Payment to Teacher</h3>
      <p>Your net earnings (tuition fees minus commission) will be paid as per the Payment Terms. Commission is calculated and deducted at the time of each payment cycle.</p>

      <h3>5. Acknowledgment</h3>
      <p>By signing this Agreement, you acknowledge that you have read, understood, and agree to the commission model. You understand that the commission rate may be changed by LearnBuddy with prior notice, and continued use of the Platform constitutes acceptance of the updated rate.</p>
    `.trim(),
  },
  {
    slug: 'teacher-payment-terms',
    title: 'Teacher Payment Terms',
    content: `
      <h2>LearnBuddy Teacher Payment Terms</h2>
      <p><strong>Effective Date:</strong> March 2025 | <strong>Version:</strong> 1.0</p>

      <h3>1. Payment Cycle</h3>
      <p>Teacher payouts are processed on a <strong>monthly basis</strong>. Earnings for a given month are calculated and paid by the <strong>10th of the following month</strong>, subject to bank processing times.</p>

      <h3>2. Earnings Calculation</h3>
      <ul>
        <li>Your gross earnings = Tuition fees collected from parents for your classes.</li>
        <li>Commission (as per Commission Model Agreement) is deducted from gross earnings.</li>
        <li>Net payout = Gross earnings − Commission − any applicable deductions.</li>
      </ul>

      <h3>3. Bank Details</h3>
      <p>You must provide valid bank account details (Account Number, IFSC, Bank Name) in your profile. LearnBuddy is not responsible for failed payouts due to incorrect or outdated bank information.</p>

      <h3>4. Minimum Payout</h3>
      <p>If your net earnings for a month are below ₹500, the amount may be carried forward to the next month until the minimum is reached, unless otherwise communicated.</p>

      <h3>5. Taxes</h3>
      <p>You are responsible for your own tax obligations. LearnBuddy may issue Form 16 or other tax documents as required by law. Consult a tax professional for guidance.</p>

      <h3>6. Disputes</h3>
      <p>Any dispute regarding payments must be raised within 30 days of the payout date. After that, the payment will be considered final.</p>
    `.trim(),
  },
  {
    slug: 'for-parents',
    title: 'For Parents',
    content: `
      <h2>Find the Best Teachers for Your Child</h2>
      <p>LearnBuddy connects you with qualified, verified teachers for one-to-one online tuition. Browse by board, class, and subject—then enroll with confidence.</p>

      <h3>Why Parents Choose LearnBuddy</h3>
      <ul>
        <li><strong>AI Monitored Classes:</strong> Every session is monitored for safety. You get peace of mind knowing your child learns in a secure environment.</li>
        <li><strong>Teachers Screened & BGV Checked:</strong> All teachers undergo background verification and AI qualification exams before joining.</li>
        <li><strong>DPDP Compliant:</strong> We follow India's Digital Personal Data Protection Act. Your child's data is safe.</li>
        <li><strong>Track Progress:</strong> View class schedules, attendance, and performance reports in one place.</li>
        <li><strong>Flexible Scheduling:</strong> Reschedule classes when needed. We make it easy to manage your child's learning.</li>
      </ul>

      <h3>How It Works</h3>
      <ol>
        <li>Download the LearnBuddy app from Play Store or App Store</li>
        <li>Register as a parent and add your child's details</li>
        <li>Browse teachers by board, class, and subject</li>
        <li>Enroll and pay securely through the app</li>
        <li>Your child attends live one-to-one classes—AI monitored for safety</li>
      </ol>

      <p><strong>Download the app today and give your child the best learning experience.</strong></p>
    `.trim(),
  },
  {
    slug: 'for-students',
    title: 'For Students',
    content: `
      <h2>Learn with Fun!</h2>
      <p>LearnBuddy is your learning buddy—one-to-one classes with expert teachers, AI help anytime, and exams that are fair and fun.</p>

      <h3>What Students Love</h3>
      <ul>
        <li><strong>Ask AI Anytime:</strong> Stuck on a doubt? Ask our AI 24/7. Get instant help with study materials and explanations.</li>
        <li><strong>AI Moderated Exams:</strong> Take exams that are fairly evaluated. AI generates questions and grades—with human review if you need it.</li>
        <li><strong>One-to-One Attention:</strong> Your teacher focuses only on you. No crowded classes, no getting lost.</li>
        <li><strong>Learn Anywhere:</strong> Use the app on your phone or tablet. Learn from home, during travel, or anywhere.</li>
        <li><strong>Safe & Monitored:</strong> Classes are AI-monitored for your safety. Learn in a protected environment.</li>
      </ul>

      <h3>Your Learning Journey</h3>
      <ol>
        <li>Your parent enrolls you with a teacher</li>
        <li>Attend live one-to-one classes on the app</li>
        <li>Ask AI doubts anytime between classes</li>
        <li>Take AI-generated exams and get instant feedback</li>
        <li>Track your progress and improve every day</li>
      </ol>

      <p><strong>Download the LearnBuddy app and start learning with fun!</strong></p>
    `.trim(),
  },
  {
    slug: 'for-teachers',
    title: 'For Teachers',
    content: `
      <h2>Teach on Your Terms</h2>
      <p>Join LearnBuddy as a teacher and reach students across India. Set your schedule, earn fairly, and focus on what you love—teaching.</p>

      <h3>Why Teachers Join LearnBuddy</h3>
      <ul>
        <li><strong>Verified & Trusted:</strong> Our BGV check and AI qualification exam build trust with parents. Students come to you ready to learn.</li>
        <li><strong>Fair Commission:</strong> Transparent 10% commission. You keep most of what you earn. Payouts on time, every month.</li>
        <li><strong>AI Tools to Help:</strong> AI-generated study materials, exam questions, and doubt resolution. Teach smarter, not harder.</li>
        <li><strong>Flexible Schedule:</strong> Create batches that fit your availability. Teach from home or anywhere.</li>
        <li><strong>Platform Handles Everything:</strong> Payments, scheduling, and student matching—we take care of it.</li>
      </ul>

      <h3>How to Get Started</h3>
      <ol>
        <li>Download the LearnBuddy app from Play Store or App Store</li>
        <li>Register as a teacher and complete your profile</li>
        <li>Pass the AI qualification exam</li>
        <li>Complete BGV verification</li>
        <li>Create batches and start teaching</li>
      </ol>

      <p><strong>Join thousands of teachers on LearnBuddy. Download the app and apply today.</strong></p>
    `.trim(),
  },
  {
    slug: 'features',
    title: 'Features',
    content: `
      <h2>LearnBuddy Features</h2>
      <p>Everything you need for safe, effective, and fun learning—powered by AI and built for trust.</p>

      <h3>Safety & Compliance</h3>
      <ul>
        <li><strong>DPDP Compliant:</strong> Full compliance with India's Digital Personal Data Protection Act. Children's data is protected.</li>
        <li><strong>AI Monitored Sessions:</strong> Every class and exam is monitored by AI for safety and quality.</li>
        <li><strong>Teachers Screened & BGV Checked:</strong> Background verification for all teachers. AI qualification exam ensures teaching quality.</li>
      </ul>

      <h3>AI-Powered Learning</h3>
      <ul>
        <li><strong>Ask AI Anytime:</strong> Students get instant help with doubts 24/7. AI-powered study materials and explanations.</li>
        <li><strong>AI Moderated Exams:</strong> Fair, unbiased exam generation and evaluation. Human review option for appeals.</li>
        <li><strong>AI Study Materials:</strong> Personalized study content generated for each topic.</li>
      </ul>

      <h3>Platform Features</h3>
      <ul>
        <li><strong>One-to-One Tuition:</strong> Personal attention. No crowded classes.</li>
        <li><strong>Mobile App:</strong> iOS and Android. Learn anywhere, anytime.</li>
        <li><strong>Secure Payments:</strong> Pay through the app. Teachers get paid on time.</li>
        <li><strong>Reschedule Anytime:</strong> Flexible class scheduling for students and teachers.</li>
      </ul>
    `.trim(),
  },
  {
    slug: 'how-it-works',
    title: 'How It Works',
    content: `
      <h2>How LearnBuddy Works</h2>
      <p>From finding a teacher to attending classes—here's your journey with LearnBuddy.</p>

      <h3>For Parents</h3>
      <ol>
        <li><strong>Download the App:</strong> Get LearnBuddy from Play Store or App Store</li>
        <li><strong>Register:</strong> Sign up as a parent and add your child's details (board, class, subject)</li>
        <li><strong>Find a Teacher:</strong> Browse the marketplace. Filter by board, class, subject. Read reviews.</li>
        <li><strong>Enroll:</strong> Choose a batch, pay securely, and your child is enrolled</li>
        <li><strong>Attend Classes:</strong> Your child joins live one-to-one classes. AI monitors every session.</li>
      </ol>

      <h3>For Students</h3>
      <ol>
        <li>Log in with your student ID (set by your parent)</li>
        <li>View your classes and join live sessions</li>
        <li>Ask AI doubts anytime between classes</li>
        <li>Take AI-generated exams and track your progress</li>
      </ol>

      <h3>For Teachers</h3>
      <ol>
        <li><strong>Apply:</strong> Register, complete profile, pass AI qualification exam</li>
        <li><strong>Get Verified:</strong> Complete BGV check</li>
        <li><strong>Create Batches:</strong> Set your schedule, board, class, subject</li>
        <li><strong>Teach:</strong> Conduct live classes. Use AI tools for materials and exams.</li>
        <li><strong>Get Paid:</strong> Monthly payouts. Transparent commission.</li>
      </ol>
    `.trim(),
  },
  {
    slug: 'teacher-conduct-rules',
    title: 'Teacher Code of Conduct',
    content: `
      <h2>LearnBuddy Teacher Code of Conduct</h2>
      <p><strong>Effective Date:</strong> March 2025 | <strong>Version:</strong> 1.0</p>

      <h3>1. Professional Conduct</h3>
      <p>As a Teacher on LearnBuddy, you agree to:</p>
      <ul>
        <li>Conduct classes professionally, punctually, and with respect for students and parents.</li>
        <li>Maintain a safe, inclusive, and supportive learning environment.</li>
        <li>Use appropriate language and behaviour at all times. No foul language, harassment, or discrimination.</li>
      </ul>

      <h3>2. Platform Rules</h3>
      <ul>
        <li><strong>No Off-Platform Payments:</strong> All tuition fees must be collected through LearnBuddy. Do not solicit or accept direct payments from parents for Platform classes.</li>
        <li><strong>No Misrepresentation:</strong> Provide accurate information about your qualifications, experience, and availability.</li>
        <li><strong>AI Monitoring:</strong> Cooperate with AI monitoring during classes. Do not attempt to bypass or disable monitoring.</li>
      </ul>

      <h3>3. Student Safety</h3>
      <p>You must ensure student safety at all times. Report any concerns regarding student welfare to LearnBuddy support immediately. Do not share personal contact details with students without parent consent.</p>

      <h3>4. Consequences of Violation</h3>
      <p>Violation of this Code may result in warnings, suspension, or permanent removal from the Platform. Serious violations may be reported to relevant authorities.</p>

      <h3>5. Acknowledgment</h3>
      <p>By signing this document, you agree to abide by this Code of Conduct. You understand that LearnBuddy reserves the right to update these rules and that continued use of the Platform constitutes acceptance of any updates.</p>
    `.trim(),
  },
];
