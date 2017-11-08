import R from 'ramda'
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/partition";
import "rxjs/add/observable/fromevent";

const isFunction = val => Object.prototype.toString.call(val) === '[object Function]'
const isNotNil = R.compose(R.not,R.isNil)
const hasFunction = R.curry( (name, obj) => R.both(isNotNil, R.propSatisfies(isFunction, name))(obj))
const isPromise = hasFunction('then') 
const isObservable = hasFunction('subscribe')
const isDedicatedWorker = hasFunction('postMessage')

const Commuter = (worker) => {

  let ports = new Set()

  const incomingMessages$ = new Subject();

  if(isDedicatedWorker(worker)){

    ports.add(worker)
    Observable.fromEvent(worker, 'message').map(x => x.data).subscribe(msg => incomingMessages$.next(msg))
  
  }else{
    
    worker.onconnect = e => {

       let port = e.ports[0]
       ports.add(port)
       port.start()

       Observable.fromEvent(port, 'message').map(x => x.data).subscribe(msg => incomingMessages$.next(msg))
    }
  }

  const msgsOfType = type => incomingMessages$.filter(x => x.type == type)

  const sendResult = (id, response, streaming = false, streamComplete = false) => {

    let msg = {
      id,
      payload: response
    }

    if(streaming){
      msg.streaming = true

      if(streamComplete){
        msg.complete = true
      }
    }

    send(msg)
  }

  const sendError = (id, errMsg) => {

    send({
      id,
      error: true,
      reason: errMsg
    });
  }

  const send = R.pipe(
    JSON.stringify,
    msg => R.forEach(port => port.postMessage(msg), ports)
  )


  const log = (...args) => {    
    send({
      type: 'LOG',
      message: args
    });
  }

  const processMsg = (func, shouldRespond) => msg => {

    let {payload} = msg
    
    let OK = R.partial(sendResult, [msg.id])
    let FAIL = R.partial(sendError, [msg.id])

    const handlePromise = promise => promise
      .then(res => OK(res))
      .catch(err => FAIL(err.message))

    const handleObservable = obs => obs.subscribe(
      next => {
        OK(next, true)
      },
      err => FAIL(err.message),
      complete => OK(complete, true, true)
    ) 

    const handleSimpleValue = res => OK(res)


    const respond = R.cond([
      [isPromise, handlePromise],
      [isObservable, handleObservable],
      [R.T, handleSimpleValue]
    ]);


    try{

      let response = func(...payload)

      if(shouldRespond) respond(response)

    }catch(err){

      FAIL(err.message)
    } 
  }

  const on = (type, func, shouldRespond = true) => {

    let handler = processMsg(func, shouldRespond)

    msgsOfType(type).subscribe(handler)
  }


  return {
    log,
    on
  }

}

export default Commuter

