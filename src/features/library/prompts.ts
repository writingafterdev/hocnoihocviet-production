/**
 * MOCK prompt library from the prototype. In production prompts are imported and their
 * questions extracted (see chainlab/specs.ts for the per-question data the builder needs).
 */
export type Task = 'task1' | 'task2';

export interface LibraryPrompt {
  id: string;
  task: Task;
  category: string;
  topic: string;
  text: string;
  image: string;
}

export const PROMPTS: LibraryPrompt[] = [
  { id: 'p0-childcare', task: 'task2', category: 'Agree or Disagree', topic: 'Society and Culture', text: 'Caring for children is an important responsibility. Some people believe that all parents should be required to take childcare training courses. To what extent do you agree or disagree?', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80' },
  { id: 'p1-young-offenders', task: 'task2', category: 'Agree or Disagree', topic: 'Government & Criminal Justice', text: 'Young people who commit crimes should be treated the same way as adults. To what extent do you agree or disagree with this statement?', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80' },
  { id: 'p1-international-news', task: 'task2', category: 'Discussion', topic: 'Education', text: 'Some people think secondary school students should study international news as one of their subjects, while others believe that this is a waste of valuable school time? Discuss both these views and give your own opinion.', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80' },
  { id: 'p2-university-admission', task: 'task2', category: 'Discussion', topic: 'Education', text: 'Many people believe that universities should only offer places to students with the highest marks. Others say they should accept people of all ages, even if they did not do well at school. Discuss both views and give your own opinion.', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80' },
];

/** The prompt that opens the sample-prompt switcher ("Đề mẫu") in ChainLab. */
export const DEMO_PROMPT_ID = 'p0-childcare';

export const CATEGORIES_TASK2 = ['Agree or Disagree', 'Discussion', 'Advantages and Disadvantages', 'Causes, Problems and Solutions', 'Two-Part Question', 'Positive or Negative Development'];
export const CATEGORIES_TASK1 = ['Line Graph', 'Bar Chart', 'Pie Chart', 'Table', 'Process', 'Map', 'Mixed Charts'];
export const TOPICS_TASK2 = ['Education', 'Environment', 'Work and Careers', 'Government & Criminal Justice', 'Science and Technology', 'Health', 'Entertainment', 'Society and Culture', 'Economics', 'Other Topics', 'Travel and Transportation'];

export const findPrompt = (id: string) => PROMPTS.find((p) => p.id === id) || null;
