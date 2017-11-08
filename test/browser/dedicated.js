import Commuter from '../../src/commuter.client.js';

const logger = (...args) => console.log.apply(console,args)

const worker = new Worker("../../dist/worker_bundle.js?i=" + new Date().getTime());

const commuter = Commuter(worker, logger);
const action = commuter.action;

const sum = action('SUM').asObservable();
const multiply = action('MULT').asObservable();

sum(1,2).subscribe(res => {
  console.log('sum got response', res)
});

multiply(3,2).subscribe(res => {
  console.log('multiply got response', res)
});		