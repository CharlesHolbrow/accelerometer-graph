import React from 'react'
import '../node_modules/react-vis/dist/style.css'
import { XYPlot, LineSeries, VerticalGridLines, HorizontalGridLines, XAxis, YAxis } from 'react-vis'

const MotionMaster = (props) => {

  const [motionPermission, setMotionPermission] = React.useState('🤷‍♂️')

  const handleMotionEvent = React.useCallback(event => {
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
    props.onMotionEvent(motion)
  }, [])

  React.useEffect(() => {
    window.addEventListener('devicemotion', handleMotionEvent)
    return () => { window.removeEventListener('devicemotion', handleMotionEvent)}
  }, [])

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

  return (
    <div>
      <BooleanState text='DeviceMotion available' value={!!window.DeviceMotionEvent} />
      <BooleanState text='DeviceMotion.requestPermission exists' value={!!(window.DeviceMotionEvent && (typeof DeviceMotionEvent.requestPermission === 'function'))} />
      <BooleanState text='Permission granted' value={motionPermission} />
      <button onClick={requestMotionPermissions}>request permission</button>
    </div>
  )
}

const App = () => {
  const motionEventsRef = React.useRef([])             // All motion events
  const [graphX, setGraphX] = React.useState([]) // data for graph
  const [graphY, setGraphY] = React.useState([]) // data for graph
  const [graphZ, setGraphZ] = React.useState([]) // data for graph


  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = React.useRef()
  const previousTimeRef = React.useRef()

  const animate = React.useCallback(time => {
    if (typeof previousTimeRef.current === 'number') {
      const deltaTime = time - previousTimeRef.current

      // Pass on a function to the setter of the state
      // to make sure we always have the latest state

      if (motionEventsRef.current.length) {
        setGraphX(prevGraph => {
          const lastEvent = motionEventsRef.current[motionEventsRef.current.length - 1]
          const newDataX = prevGraph.slice()
          newDataX.push({ x: lastEvent.time, y: lastEvent.acc.x })
          if (newDataX.length > 300) newDataX.shift()
          return newDataX
        })
        setGraphY(prevGraph => {
          const lastEvent = motionEventsRef.current[motionEventsRef.current.length - 1]
          const newDataY = prevGraph.slice()
          newDataY.push({ x: lastEvent.time, y: lastEvent.acc.y })
          if (newDataY.length > 300) newDataY.shift()
          return newDataY
        })
        setGraphZ(prevGraph => {
          const lastEvent = motionEventsRef.current[motionEventsRef.current.length - 1]
          const newDataZ = prevGraph.slice()
          newDataZ.push({ x: lastEvent.time, y: lastEvent.acc.z })
          if (newDataZ.length > 300) newDataZ.shift()
          return newDataZ
        })
      }
    }
  
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }, [])

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(requestRef.current) }
  }, [])


  return (
    <div>
      <h3>App2</h3>
      <MotionMaster onMotionEvent={motion => motionEventsRef.current.push(motion)}/>
      {/* <Graph dataX={graphData} /> */}
      <XYPlot height={400} width={400}>
          <VerticalGridLines />
          <HorizontalGridLines />
          <XAxis />
          <YAxis />
          <LineSeries className='motion-z' data={graphZ} color='blue' />
          <LineSeries className='motion-y' data={graphY} color='green' />
          <LineSeries className='motion-x' data={graphX} color='red' />
        </XYPlot>
    </div>
  )
}

/**
 * @param {object} props
 * @param {object[]} props.dataX
 */
const Graph = (props) => {
  return (
    <div>

    </div>
  )
}

function BooleanState(props) {
  return (
    <div>{props.text}: {typeof props.value === 'string' ? props.value : props.value ? '✅' : '❌'}</div>
  )
}

export default App
