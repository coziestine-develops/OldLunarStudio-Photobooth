/**
 * PairSnap pose library.
 *
 * To add a pose: drop the image in /public/poses/ and add one entry below.
 * Category counts in the UI are generated from this array — nothing is hardcoded.
 *
 *   id          unique, stable id
 *   title       shown on cards and the camera screen
 *   image       path served from /public (use BASE_URL so sub-path deploys work)
 *   category    'solo' | 'duo' | 'group'
 *   description optional hint shown under the title on the camera screen
 *   tags        optional
 */
const img = name => `${import.meta.env.BASE_URL}poses/${name}`;

export const POSE_CATEGORIES = [
  { id: 'all',   label: 'All',   icon: 'fa-solid fa-star' },
  { id: 'solo',  label: 'Solo',  icon: 'fa-solid fa-user' },
  { id: 'duo',   label: 'Duo',   icon: 'fa-solid fa-user-group' },
  { id: 'group', label: 'Group', icon: 'fa-solid fa-users' },
];

export const POSES = [
  { id: 'duo-arm-rest',   title: 'Arm Rest Selfie',  image: img('pose4.jpg'), category: 'duo',
    description: 'One of you stretches out the selfie arm, the other rests an arm on their head.', tags: ['selfie', 'playful'] },
  { id: 'duo-cheek-hug',  title: 'Cheek Hug',        image: img('pose3.jpg'), category: 'duo',
    description: 'Hug from the side and squish cheeks together, big grin.', tags: ['hug', 'cute'] },
  { id: 'duo-surprise',   title: 'Surprise Selfie',  image: img('pose2.jpg'), category: 'duo',
    description: 'Lean in close with wide, surprised eyes and open mouths.', tags: ['funny face', 'selfie'] },
  { id: 'duo-classic',    title: 'Classic Couple',   image: img('pose1.jpg'), category: 'duo',
    description: 'Shoulder to shoulder, heads tilted together, easy smiles.', tags: ['classic', 'smile'] },
];

export const poseCounts = (poses = POSES) => {
  const counts = { all: poses.length };
  for (const p of poses) counts[p.category] = (counts[p.category] ?? 0) + 1;
  return counts;
};

export const POSE_MAP = Object.fromEntries(POSES.map(p => [p.id, p]));
