import { __Pagination, __Response } from './general';
import { __AuthStatus, __Tokens, __UserData } from './register';
import { __Enum } from './vsharee';

export interface Tokens extends __Tokens {}
export interface UserData extends __UserData {}
export interface Pagination<T> extends __Pagination<T> {}
export interface Response<T> extends __Response<T> {}
export interface Enum extends __Enum {}
export { __AuthStatus as AuthStatus };
