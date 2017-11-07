import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import PseudoWorker from 'pseudo-worker'
import {XMLHttpRequest} from 'xmlhttprequest'
import {resolve} from 'path'
import * as Rx from 'rxjs'
import Commuter from '../src/commuter.client.js'

chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)
const {expect} = chai

global.XMLHttpRequest = XMLHttpRequest // shim for xhr for pseudoWorker


const getLocalPath = localPath => 'file://' + resolve(localPath) // the xhr shim wants absolute paths

const workerPath = getLocalPath('dist/worker_bundle.js')

const worker = new PseudoWorker(workerPath)

const logger = sinon.spy()

const commuter = Commuter(worker, logger)

const action = commuter.action

const sum = action('SUM').asObservable()
const multiply = action('MULT').asObservable()
const inc = action('INC').asObservable()
const progress = action('PROGRESS').asObservable()
const err = action('ERR').asObservable()
const sideEffect = action('SIDE-EFFECT')

describe('Commuter', () => {

  beforeEach(() => {

    logger.reset()
  })


  it("works for named methods", (done) => {

    sum(1,2).subscribe(res => {
      expect(res).equals(3)
      done()
    })					
  })

  it("works for lambdas", (done) => {

    multiply(3,2).subscribe(res => {
      expect(res).equals(6)
      done()
    })				
  })
		
  it("works for methods returning promises", () => {

    inc(5).subscribe(res => {
      expect(res).to.eventually.equals(6)
    })				
  })

  it("works for methods returning observable streams", () => {

    let spy = sinon.spy()


    progress(5).subscribe(
      next => spy(next),
      err => false,
      complete => {
        expect(spy.getCall(0).args[0]).equals(2)
        expect(spy.getCall(1).args[0]).equals(3)
        expect(spy.getCall(2).args[0]).equals(4)
        expect(spy).to.have.been.calledThrice
      }
    )				
  })

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
    expect(logger.getCall(0).args[0]).eql('loggin')
    expect(logger.getCall(0).args[1]).eql(4)
  })

})
