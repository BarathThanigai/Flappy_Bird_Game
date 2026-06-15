import { Achievement } from '../types';
import { audioManager } from './audio';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_flight',
    title: 'First Flight',
    description: 'Pass your very first pipe',
    criteria: 'Pass 1 pipe',
    requirement: 1,
    unlocked: false,
    category: 'score',
    badgeColor: 'from-amber-600 to-amber-800' // Bronze
  },
  {
    id: 'bronze_flyer',
    title: 'Bronze Wing',
    description: 'Reach a score of 5',
    criteria: 'Score 5 points',
    requirement: 5,
    unlocked: false,
    category: 'score',
    badgeColor: 'from-zinc-400 to-zinc-600' // Silver-bronze
  },
  {
    id: 'silver_soarer',
    title: 'Silver Soarer',
    description: 'Reach a score of 15',
    criteria: 'Score 15 points',
    requirement: 15,
    unlocked: false,
    category: 'score',
    badgeColor: 'from-slate-300 to-slate-400' // Silver
  },
  {
    id: 'gold_glider',
    title: 'Gold Glider',
    description: 'Reach a score of 30',
    criteria: 'Score 30 points',
    requirement: 30,
    unlocked: false,
    category: 'score',
    badgeColor: 'from-yellow-400 to-amber-500' // Gold
  },
  {
    id: 'platinum_king',
    title: 'Platinum Champion',
    description: 'Reach an epic score of 50',
    criteria: 'Score 50 points',
    requirement: 50,
    unlocked: false,
    category: 'score',
    badgeColor: 'from-cyan-300 to-indigo-500' // Platinum
  },
  {
    id: 'hundred_flaps',
    title: 'Wing Master',
    description: 'Flap a total of 100 times',
    criteria: 'Flap 100 times in total',
    requirement: 100,
    unlocked: false,
    category: 'flaps',
    badgeColor: 'from-pink-400 to-purple-600 animate-pulse'
  },
  {
    id: 'marathon_flyer',
    title: 'Distance Legend',
    description: 'Fly a cumulative distance of 2,000 meters',
    criteria: 'Cumulative meter survival',
    requirement: 2000,
    unlocked: false,
    category: 'distance',
    badgeColor: 'from-emerald-400 to-teal-500'
  }
];

export function loadAchievements(): Achievement[] {
  try {
    const saved = localStorage.getItem('flappy_react_achievements');
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, boolean>;
      return INITIAL_ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: !!parsed[ach.id]
      }));
    }
  } catch (e) {
    console.error('Error loading achievements', e);
  }
  return [...INITIAL_ACHIEVEMENTS];
}

export function saveAchievements(achFile: Achievement[]) {
  try {
    const status: Record<string, boolean> = {};
    achFile.forEach(ach => {
      status[ach.id] = ach.unlocked;
    });
    localStorage.setItem('flappy_react_achievements', JSON.stringify(status));
  } catch (e) {
    console.error('Error saving achievements', e);
  }
}

/**
 * Checks for newly unlocked achievements and returns the title of any newly unlocked ones.
 */
export function checkAchievements(
  currentList: Achievement[],
  stats: { maxScore: number; currentFlaps: number; totalDistance: number }
): { updatedList: Achievement[]; newlyUnlockedTitle: string | null } {
  let newlyUnlockedTitle: string | null = null;
  let changed = false;

  const updatedList = currentList.map(ach => {
    if (ach.unlocked) return ach;

    let canUnlock = false;
    if (ach.category === 'score' && stats.maxScore >= ach.requirement) {
      canUnlock = true;
    } else if (ach.category === 'flaps' && stats.currentFlaps >= ach.requirement) {
      canUnlock = true;
    } else if (ach.category === 'distance' && stats.totalDistance >= ach.requirement) {
      canUnlock = true;
    }

    if (canUnlock) {
      audioManager.playUnlock();
      newlyUnlockedTitle = ach.title;
      changed = true;
      return { ...ach, unlocked: true };
    }

    return ach;
  });

  if (changed) {
    saveAchievements(updatedList);
  }

  return { updatedList, newlyUnlockedTitle };
}
