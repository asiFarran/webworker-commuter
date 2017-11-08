import Commuter from '../../src/commuter.client.js';

const logger = (...args) => console.log.apply(console,args)

const worker = new SharedWorker("../../dist/worker_bundle.js");

const commuter = Commuter(worker, logger);
const action = commuter.action;

const sum = action('SUM').asObservable();
const multiply = action('MULT').asObservable();
const sideEffect = action('SIDE-EFFECT')

sum(1,2).subscribe(res => {
  console.log('sum got response', res)
});

multiply(3,2).subscribe(res => {
  console.log('multiply got response', res)
});		

global.sideEffect = sideEffect
