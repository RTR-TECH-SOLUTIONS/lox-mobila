import type { Review } from './types';
import { reviews as fromAdmin } from '../lib/content';

// Recenziile se editeaza din admin: src/content/reviews.json.
export const reviews: Review[] = fromAdmin;
