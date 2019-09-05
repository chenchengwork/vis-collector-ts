// @ts-ignore
import {fetch as fetchPolyfill} from './fetchPolyfill';

export type TypeFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>

export default window.fetch || fetchPolyfill
