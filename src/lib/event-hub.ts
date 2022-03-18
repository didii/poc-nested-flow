import { Type } from './types';

export class ProvideRequest<TResult> {
    __result!: TResult;
}

export type ResultOf<T extends ProvideRequest<any>> = T extends ProvideRequest<infer TResult> ? TResult : never;

export class EventHub {
    private listeners: { type: Type<any>, callback: (ev: any) => void; }[] = [];
    private providers: { type: Type<any>, callback: (ev: any, signal?: AbortSignal) => Promise<any>; }[] = [];

    public addListener<T extends object>(type: Type<T>, callback: (ev: T) => void): void {
        this.listeners.push({ type, callback });
    }
    public addProvider<T extends ProvideRequest<any>>(type: Type<T>, callback: (ev: T) => Promise<ResultOf<T>>): void {
        this.providers.push({ type, callback });
    }

    public emit<T extends object>(event: T): void {
        const listeners = this.listeners.filter(l => l.type === event.constructor);
        if (listeners.length === 0) {
            return;
        }

        for (const listener of listeners) {
            listener.callback(event);
        }
    }

    public request<TResult>(request: ProvideRequest<TResult>, signal?: AbortSignal): Promise<TResult> {
        const provider = this.providers.find(p => p.type === request.constructor);
        if (provider == null) {
            throw Error('No providers found');
        }

        return provider.callback(request, signal);
    }
}
