/**
 * Skill groups. Items are product/technology names and stay in English in both
 * locales; only the group label is translated (`skills.groups.<id>`).
 * Every item below appears in the TECHNICAL SKILLS section of cv.pdf, except
 * the "mobile" group, which is drawn from the CV's project/experience bullets
 * (mobile-app REST APIs, Firebase push notifications, SMS OTP verification).
 */
import type { LucideIcon } from 'lucide-react';
import {
  Binary,
  BrainCircuit,
  Cloud,
  Database,
  Layout,
  Server,
  Smartphone,
  Sparkles,
  Terminal,
  Wrench,
} from 'lucide-react';
export type SkillGroup = {
  id: string;
  /** One icon library across the whole site — lucide-react. */
  Icon: LucideIcon;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: 'backend',
    Icon: Server,
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
    Icon: Layout,
    items: ['React.js', 'Next.js', 'Tailwind CSS', 'Zustand', 'Redux', 'HTML', 'CSS'],
  },
  {
    id: 'mobile',
    Icon: Smartphone,
    items: [
      'Mobile-app REST APIs',
      'Firebase FCM push notifications',
      'SMS OTP verification',
      'Email OTP verification',
    ],
  },
  {
    id: 'ai',
    Icon: BrainCircuit,
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
    Icon: Terminal,
    items: ['PHP', 'JavaScript', 'Python', 'C++', 'Java', 'C#'],
  },
  {
    id: 'data',
    Icon: Database,
    items: ['MySQL', 'PostgreSQL', 'Supabase', 'Neon', 'Redis'],
  },
  {
    id: 'cloud',
    Icon: Cloud,
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
    Icon: Wrench,
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
    Icon: Binary,
    items: ['OOP', 'Clean Code', 'Algorithms', 'Problem Solving', 'ICPC'],
  },
  {
    id: 'aiAssisted',
    Icon: Sparkles,
    items: ['Claude Code', 'GitHub Copilot', 'Codex', 'Google Antigravity'],
  },
];

/** Section ids in document order — drives the nav and the scroll-spy. */
export const sections = [
  'about',
  'services',
  'projects',
  'skills',
  'experience',
  'education',
  'contact',
] as const;

export type SectionId = (typeof sections)[number];
