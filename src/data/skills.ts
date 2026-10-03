/**
 * Skill groups. Items are product/technology names and stay in English in both
 * locales; only the group label is translated (`skills.groups.<id>`).
 * Every item below appears in the TECHNICAL SKILLS section of cv.pdf, except
 * the "mobile" group, which is drawn from the CV's project/experience bullets
 * (mobile-app REST APIs, Firebase push notifications, SMS OTP verification).
 */
export type SkillGroup = {
  id: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: 'backend',
    items: [
      'Laravel',
      'NestJS',
      'Django',
      'RESTful APIs',
      'JWT Auth',
      'RBAC',
      'MVC Architecture',
    ],
  },
  {
    id: 'frontend',
    items: ['React.js', 'Next.js', 'Tailwind CSS', 'Zustand', 'Redux', 'HTML', 'CSS'],
  },
  {
    id: 'mobile',
    items: [
      'Mobile-app REST APIs',
      'Firebase FCM push notifications',
      'SMS OTP verification',
      'Email OTP verification',
    ],
  },
  {
    id: 'ai',
    items: [
      'Neural Networks',
      'Deep Learning',
      'Machine Learning',
      'PyTorch',
      'NumPy',
    ],
  },
  {
    id: 'languages',
    items: ['PHP', 'JavaScript', 'Python', 'C++', 'Java', 'C#'],
  },
  {
    id: 'data',
    items: ['MySQL', 'PostgreSQL', 'Supabase', 'Neon', 'Redis'],
  },
  {
    id: 'cloud',
    items: [
      'Docker',
      'CI/CD',
      'Linux',
      'Firebase',
      'Vercel',
      'Railway',
      'Laravel Cloud',
    ],
  },
  {
    id: 'tools',
    items: [
      'Git',
      'GitHub',
      'GitLab',
      'Bitbucket',
      'Postman',
      'Insomnia',
      'Apidog',
      'Jira',
      'Clockify',
      'ClickUp',
      'Termius',
    ],
  },
  {
    id: 'practices',
    items: ['OOP', 'Clean Code', 'Algorithms', 'Problem Solving', 'ICPC'],
  },
  {
    id: 'aiAssisted',
    items: ['Claude Code', 'GitHub Copilot', 'Codex', 'Google Antigravity'],
  },
];

/** Section ids in document order — drives the nav and the scroll-spy. */
export const sections = [
  'about',
  'projects',
  'skills',
  'experience',
  'education',
  'contact',
] as const;

export type SectionId = (typeof sections)[number];
