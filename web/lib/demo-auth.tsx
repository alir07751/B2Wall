'use client';

/**
 * Mock auth for frontend-only demo. Role persisted in localStorage.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { DemoRole } from './types';

const STORAGE_KEY = 'b2wall-demo-auth';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
}

interface DemoAuthState {
  user: DemoUser | null;
  role: DemoRole | null;
}

function loadStored(): DemoAuthState {
  if (typeof window === 'undefined') return { user: null, role: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, role: null };
    const { role, name, email, phone } = JSON.parse(raw) as { role: DemoRole; name?: string; email?: string; phone?: string };
    const id = role === 'investor' ? 'demo-investor' : role === 'seeker' ? 'demo-seeker' : 'demo-admin';
    return {
      role,
      user: {
        id,
        name: name ?? (role === 'investor' ? 'کاربر' : role === 'seeker' ? 'سازنده نمونه' : 'مدیر'),
        email: email ?? (phone ? `${phone}@b2wall.demo` : `${role}@b2wall.demo`),
        role,
      },
    };
  } catch {
    return { user: null, role: null };
  }
}

function saveStored(role: DemoRole | null, name?: string, email?: string, phone?: string) {
  if (typeof window === 'undefined') return;
  if (role == null) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, name, email, phone }));
}

const DemoAuthContext = createContext<{
  user: DemoUser | null;
  role: DemoRole | null;
  login: (role: DemoRole, name?: string, email?: string) => void;
  loginWithMobile: (mobile: string) => void;
  logout: () => void;
} | null>(null);

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoAuthState>(() => loadStored());

  useEffect(() => {
    setState(loadStored());
  }, []);

  const login = useCallback((role: DemoRole, name?: string, email?: string) => {
    const id = role === 'investor' ? 'demo-investor' : role === 'seeker' ? 'demo-seeker' : 'demo-admin';
    const user: DemoUser = {
      id,
      name: name ?? (role === 'investor' ? 'کاربر' : role === 'seeker' ? 'سازنده نمونه' : 'مدیر'),
      email: email ?? `${role}@b2wall.demo`,
      role,
    };
    saveStored(role, name, email);
    setState({ user, role });
  }, []);

  const loginWithMobile = useCallback((mobile: string) => {
    const role: DemoRole = 'investor';
    const user: DemoUser = {
      id: 'demo-investor',
      name: 'کاربر',
      email: `${mobile}@b2wall.demo`,
      role,
    };
    saveStored(role, undefined, undefined, mobile);
    setState({ user, role });
  }, []);

  const logout = useCallback(() => {
    saveStored(null);
    setState({ user: null, role: null });
  }, []);

  return (
    <DemoAuthContext.Provider value={{ user: state.user, role: state.role, login, loginWithMobile, logout }}>
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const ctx = useContext(DemoAuthContext);
  if (!ctx) throw new Error('useDemoAuth must be used within DemoAuthProvider');
  return ctx;
}
