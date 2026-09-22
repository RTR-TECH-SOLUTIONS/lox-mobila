import type { Project } from './types';
import { projects as fromAdmin } from '../lib/content';

// Proiectele se editeaza din admin: src/content/projects.json,
// pozele stau in src/assets/images/projects/<slug>/.
export const projects: Project[] = fromAdmin;
