import R from 'ramda'
import * as Rx from 'rxjs'

function Commuter(worker){

  const incoming$ = Rx.Observable.fromEvent(worker, 'message').map(x => x.data)



const msgsOfType = type => incoming$.filter(x => x.type == type)

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

const send = msg => worker.postMessage(JSON.stringify(msg))

const isFunction = val => Object.prototype.toString.call(val) === '[object Function]'

const isNotNil = R.compose(R.not,R.isNil)

const hasFunction = R.curry( (name, obj) => R.both(isNotNil, R.propSatisfies(isFunction, name))(obj))

const isPromise = hasFunction('then') 

const isObservable = hasFunction('subscribe')

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
  processMsg,
  on
}

}

export default Commuter

