import { AuthStatus, UserType } from '@/interfaces';
import { atom } from 'jotai';

export const authStatusAtom = atom(AuthStatus.pending);
export const userDataAtom = atom<UserType | null>(null);
