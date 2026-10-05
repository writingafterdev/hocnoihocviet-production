import { TOPICS_TASK2 } from '@/content/prompts';

export const VOCAB_SKILLS = ['task2', 'task1', 'speaking'] as const;
export type VocabSkillId = (typeof VOCAB_SKILLS)[number];
export const OTHER_TOPIC = 'Other Topics';

/** Topics a saved phrase can be filed under, per skill. Task 2 uses the prompt library's topics. */
export const topicsFor = (skill: VocabSkillId): readonly string[] => (skill === 'task2' ? TOPICS_TASK2 : [OTHER_TOPIC]);
export const isSkill = (x: unknown): x is VocabSkillId => typeof x === 'string' && (VOCAB_SKILLS as readonly string[]).includes(x);
/** The topic if it is one of the skill's topics; otherwise "Other Topics". */
export const cleanTopic = (skill: VocabSkillId, topic: unknown) => (typeof topic === 'string' && topicsFor(skill).includes(topic) ? topic : OTHER_TOPIC);
