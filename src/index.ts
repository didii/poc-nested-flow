import { Flow, RepeatingFlow } from './lib/flow';
import { Data } from './lib/data';
import { EventHub } from './lib/event-hub';
import { ChooseMethodChosenEvent, ChooseMethodRequest, ChooseMethodStep, FinalizeFieldStep, FinalizeStep, InitializeFieldStep, InitializeStep, PathAbcStep, PathDefStep, PrepareFieldsStep } from './lib/steps';

const eventHub = new EventHub();

/**
 * Paths:
 * Initialize -> PrepareFields -> Finalize
 * Initialize -> PrepareFields -> ChooseMethod -> Path-Abc -> Finalize
 * Initialize -> PrepareFields -> ChooseMethod -> Path-Def -> Finalize
 * Initialize -> PrepareFields -> ChooseMethod -> Path-Abc -> ChooseMethod -> Path-Abc -> PrepareFields -> Finalize
 * Initialize -> PrepareFields -> ChooseMethod -> Path-Abc -> ChooseMethod -> Path-Def -> PrepareFields -> Finalize
 * ...
 */

const signingFlow = new Flow<Data>(eventHub);
signingFlow.addListener(ChooseMethodChosenEvent, (ev, data) => {
    switch (ev.method) {
        case 'ABC':
            signingFlow.addStep(new PathAbcStep());
            break;
        case 'DEF':
            signingFlow.addStep(new PathDefStep());
            break;
    }
});

const repeating = new RepeatingFlow<Data>(eventHub, data => data.futureFields != null && data.futureFields.length > 0);
repeating.addStep(new InitializeFieldStep());
repeating.addStep(new ChooseMethodStep());
repeating.addFlow(signingFlow);
repeating.addStep(new FinalizeFieldStep());


const flow = new Flow<Data>(eventHub);
flow.addStep(new InitializeStep());
flow.addStep(new PrepareFieldsStep());
flow.addFlow(repeating);
flow.addStep(new FinalizeStep());
flow.addProvider(ChooseMethodRequest, async (ev, data) => {
    return 'ABC' as 'ABC';
});

const aborter = new AbortController();
flow.execute({ count: 4, finishedFields: [] }, aborter.signal);

export {};
