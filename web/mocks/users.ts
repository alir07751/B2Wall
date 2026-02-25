import type { User } from '@/lib/types';

export const MOCK_USERS: User[] = [
  { id: 'demo-seeker', role: 'seeker', name: 'سازنده نمونه', email: 'seeker@b2wall.demo', riskProfile: null },
  { id: 'demo-investor', role: 'investor', name: 'سرمایه‌گذار نمونه', email: 'investor@b2wall.demo', riskProfile: 'moderate' },
  { id: 'demo-admin', role: 'admin', name: 'مدیر', email: 'admin@b2wall.demo', riskProfile: null },
];

export function getMockUser(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
