import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/partition";
import "rxjs/add/observable/fromevent";

const configureWorker = worker => {  

  if(worker.port != null){
    worker.port.start()
    return worker.port
  }
  else{
    return worker
  }
}

const Commuter = (worker, logger) => {

  const port = configureWorker(worker)

  const workerMessagesStream$ = Observable.fromEvent(port, 'message')
  .filter(x => x.data.trim() != '')
  .map(x => JSON.parse(x.data));

  const [logStream$, messageStream$] = workerMessagesStream$.partition(msg =>  msg.type === 'LOG')

  const isStreamingAction = (msg) => msg.streaming == true
  const isStreamComplete = (msg) => msg.complete == true
  const isErrorMsg = (msg) => msg.error == true
  const isStreamTerminationMessage = (msg) => (isStreamingAction(msg) && isStreamComplete(msg)) ? true : false
  const moreMessagesExpected = (msg) => (isStreamingAction(msg) && !isStreamComplete(msg)) ? true : false


  logStream$.subscribe(msg => logger.apply(null, msg.message));

  messageStream$.subscribe(msg => console.log('incoming', msg));

  var id = 0;
  const generateId = () => id++

  const action = type => {

    const dispatch = (expectResults, ...args) => {

      let msg = { type, payload: args}

      if(expectResults == false){
        return port.postMessage(msg);

      }else{
  			
        msg.id = generateId()

        return Observable.create(function (observer) {

          messageStream$
          .filter(x => x.id == msg.id)
          .subscribe((msg) => { 

            if(isErrorMsg(msg)){
  			  			
              observer.error(msg.reason)
            }
            else{

              if(!isStreamTerminationMessage(msg))
              {
                observer.next(msg.payload)
              }
  	 
              if(moreMessagesExpected(msg) == false){
                observer.complete()
              }
            }
          })

          port.postMessage(msg)
        })
      }
    }

    return {
      send: (...args) => dispatch(false, ...args),
      asObservable: () => (...args) => dispatch(true, ...args)
    }
  }

  return {
  	action
  }
}

export default Commuter;
