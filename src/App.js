import React from 'react'
import '../node_modules/react-vis/dist/style.css'
import { XYPlot, LineSeries, VerticalGridLines, HorizontalGridLines, XAxis, YAxis } from 'react-vis'
import './index.css'
import Pads from './Gamepad'
import { sendToServer } from './server-access'

const MotionMaster = ({onMotionEvent}) => {

  const [motionPermission, setMotionPermission] = React.useState('🤷‍♂️')

  React.useEffect(() => {
    const handleMotionEvent = event => {
      // event has several interesting properties, measured in chrome
      // holding the phone in front of you selfie style (in portrait mode)
      // - event.accelerationIncludingGravity
      // - event.acceleration.x left/right
      //                     .y up/down
      //                     .z toward/away from you
      // - event.interval - a time in ms according to the docs (always an integer?)
      //                  - on chrome for android always 16 on my motox4, but I console.logged 44 updates in a second
      //                  - on firefox for android always 100, but confusingly, it seems like this event is fired ~220 times a second on firefox
      //
      // - event.timeStamp - float value in milliseconds
      // - rotationRate.alpha
      //               .beta
      //               .gamma
      //
      // see also: window.addEventListener('deviceorientation', this.state.orientationHandler)
      const acc = event.accelerationIncludingGravity
      const time = event.timeStamp * .001
      const motion = { acc, time }
      onMotionEvent(motion)
    }

    window.addEventListener('devicemotion', handleMotionEvent)
    return () => { window.removeEventListener('devicemotion', handleMotionEvent)}
  }, []) // eslint-disable-line

  /**
  * Safari will not fire motion events until the user grants access. As of
  * March 2021, Chrome and Firefox do not exhibit this behavior. I don't
  * remember where, but I read that it's okay to start listening for events
  * before the user grants permission.
  */
  const requestMotionPermissions = async () => {
    if (!window.DeviceMotionEvent) {
      return
    }

    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      setMotionPermission('not available')
      return
    }

    // https://www.w3.org/TR/orientation-event/#dom-deviceorientationevent-requestpermission
    setMotionPermission(await DeviceMotionEvent.requestPermission())
  }

  const requestFunction = (window.DeviceMotionEvent && (typeof DeviceMotionEvent.requestPermission === 'function')) && DeviceMotionEvent.requestPermission.bind(DeviceMotionEvent)

  return (
    <div>
      <BooleanState text='DeviceMotion available' value={!!window.DeviceMotionEvent} />
      { requestFunction &&  <BooleanState text='Permission granted' value={motionPermission} /> }
      { requestFunction && <button onClick={requestMotionPermissions}>request permission</button> }
    </div>
  )
}

const App = () => {
  const motionEventsRef = React.useRef([])    // All motion events
  const [state, setState] = React.useState({
    graphX: [],
    graphY: [],
    graphZ: [],
  })

  const [gameTime, setGameTime] = React.useState(0)

  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = React.useRef()
  const previousTimeRef = React.useRef()
  const SIZE = 180

  const animate = React.useCallback(time => {
    if (typeof previousTimeRef.current === 'number') {
      const deltaTime = time - previousTimeRef.current
      setGameTime(time)

      // Pass on a function to the setter of the state
      // to make sure we always have the latest state

      if (motionEventsRef.current.length) {
        setState(({graphX, graphY, graphZ}) => {
          const newState = {}
          const lastEvent = motionEventsRef.current[motionEventsRef.current.length - 1]

          newState.graphX = graphX.slice(Math.max(0, graphX.length - SIZE))
          newState.graphX.push({ x: lastEvent.time, y: lastEvent.acc.x })

          newState.graphY = graphY.slice(Math.max(0, graphY.length - SIZE))
          newState.graphY.push({ x: lastEvent.time, y: lastEvent.acc.y })

          newState.graphZ = graphZ.slice(Math.max(0, graphZ.length - SIZE))
          newState.graphZ.push({ x: lastEvent.time, y: lastEvent.acc.z })

          return newState
        })
      }
    }

    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }, [])

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(requestRef.current) }
  }, []) // eslint-disable-line

  const sendMotionEventsToServer = async () => {
    // TODO: get the key from a PW text field (and store that in localstorage)
    // TODO: get the session id from text field (and store that in localstore)
    // TODO: display results
    const result = await sendToServer('this is a key!', 'tuesday', { example: 'payload' })
    console.log(result)
  }

  return (
    <div>
      <h3>App2</h3>
      <MotionMaster onMotionEvent={motion => motionEventsRef.current.push(motion)}/>
      <Graph dataX={state.graphX} dataY={state.graphY} dataZ={state.graphZ} />
      <button onClick={sendMotionEventsToServer}>Send</button>
      <Pads time={gameTime}/>
    </div>
  )
}

/**
 * @param {object} props
 * @param {object[]} props.dataX
 */
const Graph = ({dataX, dataY, dataZ}) => {
  return (
    <div>
      <XYPlot height={400} width={400}>
        <VerticalGridLines />
        <HorizontalGridLines />
        <XAxis />
        <YAxis />
        <LineSeries className='motion-z' data={dataZ} color='blue' />
        <LineSeries className='motion-y' data={dataY} color='green' />
        <LineSeries className='motion-x' data={dataX} color='red' />
      </XYPlot>
    </div>
  )
}

function BooleanState(props) {
  return (
    <div>{props.text}: {typeof props.value === 'string' ? props.value : props.value ? '✅' : '❌'}</div>
  )
}

export default App
