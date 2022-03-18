import { Data, FieldInfo } from './data';
import { ProvideRequest } from './event-hub';
import { Context, Step } from './step';

export class InitializeStep implements Step<Data> {
    public async execute(data: Data, context: Context): Promise<void> {
        if (data.isInitialized == null) {
            data.isInitialized = true;
        }
    }
    public undo(data: Data, context: Context): Promise<void> {
        return Promise.resolve();
    }
}

export class PrepareFieldsStep implements Step<Data> {
    public async execute(data: Data, context: Context): Promise<void> {
        if (data.futureFields != null) return;
        data.futureFields = Array(data.count).fill(0).map((_, index) => ({ index }));
    }
    public undo(data: Data, context: Context): Promise<void> {
        return Promise.resolve();
    }
}

export class FieldInitializedEvent {
    public constructor(public fieldInfo: FieldInfo) { }
}
export class InitializeFieldStep implements Step<Data> {
    public async execute(data: Data, context: Context): Promise<void> {
        if (data.currentField != null) return;
        if (data.futureFields?.length === 0) return;

        const next = data.futureFields!.shift()!;
        data.currentField = {
            index: next.index,
        };
        context.emit(new FieldInitializedEvent(data.currentField));
    }
    public undo(data: Data, context: Context): Promise<void> {
        return Promise.resolve();
    }
}

export class ChooseMethodRequest extends ProvideRequest<'ABC' | 'DEF'> { }
export class ChooseMethodChosenEvent {
    public constructor(public method: 'ABC' | 'DEF') { }
}

export class ChooseMethodStep implements Step<Data> {
    public async execute(data: Data, context: Context): Promise<void> {
        const currentField = data.currentField;
        if (currentField == null) return;
        if (currentField.method != null) return;

        currentField.method = await context.request(new ChooseMethodRequest(), context.signal);
        context.emit(new ChooseMethodChosenEvent(currentField.method));
    }
    public undo(data: Data, context: Context): Promise<void> {
        return Promise.resolve();
    }
}


export class PathAbcStep implements Step<Data> {
    public async execute(data: Data, context: Context): Promise<void> {
        const currentField = data.currentField;
        if (currentField == null) return;
        currentField.isAbc = true;
    }
    public undo(data: Data, context: Context): Promise<void> {
        return Promise.resolve();
    }
}

export class PathDefStep implements Step<Data> {
    public async execute(data: Data, context: Context): Promise<void> {
        const currentField = data.currentField;
        if (currentField == null) return;
        currentField.isDef = true;
    }
    public undo(data: Data, context: Context): Promise<void> {
        return Promise.resolve();
    }
}

export class FinalizeFieldStep implements Step<Data> {
    public async execute(data: Data, context: Context): Promise<void> {
        if (data.currentField == null) return;
        data.finishedFields.push(data.currentField);
        data.currentField = undefined;
    }
    public undo(data: Data, context: Context): Promise<void> {
        return Promise.resolve();
    }
}

export class FinalizeStep implements Step<Data> {
    public async execute(data: Data, context: Context): Promise<void> {
        data.isFinalized = true;
    }
    public undo(data: Data, context: Context): Promise<void> {
        return Promise.resolve();
    }
}
