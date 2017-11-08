import chai from 'chai'
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import PseudoWorker from 'pseudo-worker';
import {XMLHttpRequest} from 'xmlhttprequest';
import {resolve} from 'path';
import * as Rx from 'rxjs';
import Commuter from '../../src/commuter.client.js';

global.XMLHttpRequest = XMLHttpRequest; // shim for pseudo-worker
global.Rx = Rx;

chai.use(sinonChai);
chai.use(chaiAsPromised);
const {expect} = chai;

const getLocalPath = localPath => 'file://' + resolve(localPath); // xhr shim wants absolute paths

const workerPath = getLocalPath('dist/worker_bundle.js');
			
const worker = new PseudoWorker(workerPath);
const logger = sinon.spy()

const commuter = Commuter(worker, logger);
const action = commuter.action;


// ACTIONS
const sum = action('SUM').asObservable();
const multiply = action('MULT').asObservable();
const inc = action('INC').asObservable();
const progress = action('PROGRESS').asObservable();
const err = action('ERR').asObservable()
const sideEffect = action('SIDE-EFFECT')



describe('Commuter', () => {

  it("works with defined methods", (done) => {

    sum(1,2).subscribe(res => {
      expect(res).to.equal(3)
      done();
    });					
  });

  it("works with lambdas", (done) => {

    multiply(3,2).subscribe(res => {
      expect(res).to.equal(6)
      done();
    });				
  });
		
  it("works with methods returning promises", (done) => {

    inc(5).subscribe(res => {
      expect(res).to.equal(6)
      done()
    });				
  });

  it("works with methods returning observable streams", () => {


	let spy = sinon.spy();

    progress(5).subscribe(
    	next => spy(next),
    	err => false,
    	complete => {
    		expect(spy.getCall(0).args[0]).to.equal(2)
    		expect(spy.getCall(1).args[0]).to.equal(3)
    		expect(spy.getCall(2).args[0]).to.equal(4)
    		expect(spy).to.have.been.calledThrice

    	}
    );				
  });

  it("correctly wraps and returns errors", () => {

    let spy = sinon.spy()

    err(5).subscribe(
      next => spy(next),
      err => {
        expect(spy).to.have.not.been.called
        expect(err).equals('WTF!!!!')
      },
      complete => false
    )							
  }) 

  it("can deliver fire-and-forget messages and commute log actions from worker back", () => {
 		
    sideEffect.send(4)

    expect(logger).to.have.been.calledOnce
    expect(logger.getCall(0).args[0]).to.equal('loggin')
    expect(logger.getCall(0).args[1]).to.equal(4)
  })

});
