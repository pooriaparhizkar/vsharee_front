import { AuthStatus, LivekitAuthType, UserType } from '@/interfaces';
import { atom } from 'jotai';
import type { Room } from 'livekit-client';

export const authStatusAtom = atom(AuthStatus.pending);
export const userDataAtom = atom<UserType | null>(null);

export const livekitAuthAtom = atom<LivekitAuthType>({ url: null, token: null });
export const livekitRoomAtom = atom<Room | null>(null);
