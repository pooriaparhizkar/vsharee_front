import { AuthStatus, UserData } from '@/interfaces';
import { atom } from 'jotai';

export const authStatusAtom = atom(AuthStatus.pending);
export const userDataAtom = atom<UserData | null>(null);
