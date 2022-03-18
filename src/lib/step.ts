import { ProvideRequest } from './event-hub';

export interface Context {
    signal?: AbortSignal;
    emit<T extends object>(event: T): void;
    request<TResult>(request: ProvideRequest<TResult>, signal?: AbortSignal): Promise<TResult>;
}

export interface Step<TData> {
    execute(data: TData, context: Context): Promise<void>;
    undo(data: TData, context: Context): Promise<void>;
}
