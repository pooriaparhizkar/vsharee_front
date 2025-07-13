import { __Pagination, __Response } from './general';
import { __AuthStatus } from './register';
import { __GroupType, __loginType, __UserType } from './vsharee';

export interface Pagination<T> extends __Pagination<T> {}
export interface Response<T> extends __Response<T> {}
export interface GroupType extends __GroupType {}
export interface UserType extends __UserType {}
export interface loginType extends __loginType {}
export { __AuthStatus as AuthStatus };
