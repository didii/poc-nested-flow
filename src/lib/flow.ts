import { EventHub, ProvideRequest, ResultOf } from './event-hub';
import { Context, Step } from './step';
import { globals } from './globals';
import { Type } from './types';


export class Flow<TData> {
    protected procedure: ({ type: 'step', step: Step<TData>; } | { type: 'flow', flow: Flow<TData>; })[] = [];
    protected data!: TData;

    public constructor(
        protected eventHub: EventHub,
    ) { }

    public addStep(step: Step<TData>) {
        this.procedure.push({ type: 'step', step });
    }

    public addFlow(flow: Flow<TData>) {
        this.procedure.push({ type: 'flow', flow });
    }

    public addListener<T extends object>(type: Type<T>, callback: (ev: T, data: TData) => void): void {
        this.eventHub.addListener(type, ev => callback(ev, this.data));
    }

    public addProvider<T extends ProvideRequest<any>>(type: Type<T>, callback: (ev: T, data: TData) => Promise<ResultOf<T>>) {
        this.eventHub.addProvider(type, ev => callback(ev, this.data));
    }

    public async execute(data: TData, signal?: AbortSignal): Promise<void> {
        this.data = data;
        const context: Context = {
            signal,
            emit: event => this.eventHub.emit(event),
            request: (request, signal) => this.eventHub.request(request, signal),
        };

        for (let i = 0; i < this.procedure.length; i++) {
            const current = this.procedure[i];
            console.log('\t'.repeat(globals.tabDepth) + 'Executing', current);
            if (current.type === 'step') {
                await current.step.execute(this.data, context);
            } else if (current.type === 'flow') {
                globals.tabDepth++;
                await current.flow.execute(this.data, signal);
                globals.tabDepth--;
            }
        }
    }
}

export class RepeatingFlow<TData> extends Flow<TData> {
    public constructor(
        eventHub: EventHub,
        public condition: (data: TData, signal?: AbortSignal) => boolean | Promise<boolean>
    ) {
        super(eventHub);
    }

    public async execute(data: TData, signal?: AbortSignal): Promise<void> {
        while (await this.condition(data, signal)) {
            await super.execute(data, signal);
        }
    }

}
