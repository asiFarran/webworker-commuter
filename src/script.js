let worker = new Worker("worker.js?i=" + new Date().getTime());

let action = Commuter(worker).action;


//duplicate('hello').subscribe(res => console.log('got response from bus baby', res))

const sum = action('sum').asObservable();
const duplicate = action('duplicate').asObservable();
const extract = action('extract').asObservable();
const combine = action('combine').asObservable();
const ongoing = action('ongoing').asObservable();
const noop1 = action('noop1');
const noop2 = action('noop2');
const err = action('err').asObservable(); 

const wPromise = action('wPromise').asObservable(); 
const wObservable = action('wObservable').asObservable(); 
