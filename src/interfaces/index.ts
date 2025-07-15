import { __Pagination, __Response } from './general';
import { __AuthStatus } from './register';
import { __ClientToServerEvents, __ServerToClientEvents } from './socket';
import { __GroupType, __loginType, __UserType } from './vsharee';

export interface Pagination<T> extends __Pagination<T> {}
export interface Response<T> extends __Response<T> {}
export interface GroupType extends __GroupType {}
export interface UserType extends __UserType {}
export interface loginType extends __loginType {}
export interface ServerToClientEvents extends __ServerToClientEvents {}
export interface ClientToServerEvents extends __ClientToServerEvents {}
export { __AuthStatus as AuthStatus };
