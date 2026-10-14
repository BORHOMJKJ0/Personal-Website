/**
 * What Omar offers, drawn from the TECHNICAL SKILLS and EXPERIENCE sections of
 * cv.pdf — nothing here claims a capability the CV does not support.
 *
 * Copy lives under `services.items.<id>` in the locale files; the technology
 * list stays in English in both locales because they are product names.
 */
import type { LucideIcon } from 'lucide-react';
import { Boxes, BrainCircuit, Database, Server } from 'lucide-react';

export type Service = {
  id: string;
  Icon: LucideIcon;
  tech: string[];
};

export const services: Service[] = [
  {
    id: 'backend',
    Icon: Server,
    tech: ['Laravel', 'RESTful APIs', 'JWT', 'RBAC'],
  },
  {
    id: 'fullstack',
    Icon: Boxes,
    tech: ['React', 'Next.js', 'Tailwind CSS', 'Zustand'],
  },
  {
    id: 'ai',
    Icon: BrainCircuit,
    tech: ['PyTorch', 'NumPy', 'Deep Learning'],
  },
  {
    id: 'data',
    Icon: Database,
    tech: ['MySQL', 'PostgreSQL', 'Supabase', 'Redis'],
  },
];
