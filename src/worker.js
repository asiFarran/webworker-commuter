
if(!self.removeEventListener){
	self.removeEventListener = function(){}
}

import Commuter from './commuter.worker.js'

const commuter = Commuter(self)
const on = commuter.on
const log = commuter.log


const sum = function(num1, num2){
	return num1 + num2;
}

const incWithPromise = function(num){
	return new Promise((resolve,reject) => {
		resolve(num + 1)
	});
}

const withObservable = function(num){
//  log('what do think?',{name:'asi'},5)
	return Rx.Observable.of(1,2,3).map(x => x + 1);
}


const throwErr = function(args){
	throw new Error("WTF!!!!")
}


on("SUM", sum)
on("MULT", (num1, num2) => num1 * num2)
on("INC", incWithPromise)
on("PROGRESS", withObservable)
on("ERR", throwErr)
on("SIDE-EFFECT", _ => log('loggin', 4), false)


//log(this);



