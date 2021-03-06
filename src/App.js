import React, { Component } from 'react'
import '../node_modules/react-vis/dist/style.css'
import { XYPlot, LineSeries, VerticalGridLines, HorizontalGridLines, XAxis, YAxis } from 'react-vis'

const Graph = () => {

  const [count, setCount] = React.useState(0)
  const [graphData, setGraphData] = React.useState([])

  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = React.useRef()
  const previousTimeRef = React.useRef()
  const motionEventsRef = React.useRef([])

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

    motionEventsRef.current.push(motion)

    // const motionX = this.state.motionX.slice()
    // const motionY = this.state.motionY.slice()
    // const motionZ = this.state.motionZ.slice()

    // motionX.push({x: time, y: acc.x})
    // motionY.push({x: time, y: acc.y})
    // motionZ.push({x: time, y: acc.z})

    // if (motionX.length > 300) motionX.shift()
    // if (motionY.length > 300) motionY.shift()
    // if (motionZ.length > 300) motionZ.shift()
    // return { motionX, motionY, motionZ }
  }

  const animate = React.useCallback(time => {
    if (typeof previousTimeRef.current === 'number') {
      const deltaTime = time - previousTimeRef.current

      // Pass on a function to the setter of the state
      // to make sure we always have the latest state
      setCount(prevCount => (prevCount + deltaTime * 0.01))
      if (motionEventsRef.current.length) {
        setGraphData(prevGraph => {
          const lastEvent = motionEventsRef.current[motionEventsRef.current.length - 1]
          const newData = prevGraph.slice()
          const datum = { x: lastEvent.time, y: lastEvent.acc.x }
          console.log(newData.length)
          newData.push(datum)
          if (newData.length > 300) newData.shift()
          setGraphData(newData)
        })
      }
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }, [])

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(requestRef.current) }
  }, [animate]) // Make sure the effect runs only once

  React.useEffect(() => {
    window.addEventListener('devicemotion', handleMotionEvent)
    return () => { window.removeEventListener('devicemotion', handleMotionEvent)}
  }, [])

  return (
    <div>
      {Math.round(count)}
      <XYPlot height={400} width={400}>
          <VerticalGridLines />
          <HorizontalGridLines />
          <XAxis />
          <YAxis />
          {/* <LineSeries className='motion-z' data={this.state.motionZ} color='blue' /> */}
          {/* <LineSeries className='motion-y' data={this.state.motionY} color='green' /> */}
          <LineSeries className='motion-x' data={graphData} color='red' />
        </XYPlot>
    </div>
  )
}

function BooleanState(props) {
  return (
    <div>{props.text}: {typeof props.value === 'string' ? props.value : props.value ? '✅' : '❌'}</div>
  )
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      motionSupport: !!window.DeviceMotionEvent,
      motionPermissionRequired: !!(window.DeviceMotionEvent && (typeof DeviceMotionEvent.requestPermission === 'function')),
      motionPermission: '🤷🏻‍♂️',        // '🤷🏻‍♂️', 'ok', 'granted', 'denied'
      accelerometerPermission: '🤷🏻‍♂️', // '🤷🏻‍♂️', 'prompt', 'granted', 'denied'
      gyroscopePermission: '🤷🏻‍♂️',     // '🤷🏻‍♂️', 'prompt', 'granted', 'denied'
    }
  }

  /**
   * Use the navigator.permissions.query API to check the status of the
   * accelerometer and gyroscope permissions. As of March 2021,
   * - Firefox does not support querying the accelerometer or gyroscope.
   * - Chrome support seems to be working.
   * - I believe safari is working, but am not %100 sure
   */
  async checkMotionPermissions() {
    if (!navigator.permissions) return

    const p1 = navigator.permissions.query({ name: 'accelerometer' })
    const p2 = navigator.permissions.query({ name: 'gyroscope' })

    this.setState({ accelerometerPermission: (await p1).state })
    this.setState({ gyroscopePermission: (await p2).state })
  }

  /**
   * Safari will not fire motion events until the user grants access. As of
   * March 2021, Chrome and Firefox do not exhibit this behavior. I don't
   * remember where, but I read that it's okay to start listening for events
   * before the user grants permission.
   */
  async requestMotionPermissions() {
    if (!window.DeviceMotionEvent) {
      this.setState({ motionSupport: false })
      return
    }

    const stateUpdate = { motionSupport: true }

    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      stateUpdate.motionPermission = 'not required'
      this.setState(stateUpdate)
      return
    }

    // https://www.w3.org/TR/orientation-event/#dom-deviceorientationevent-requestpermission
    stateUpdate.motionPermission = await DeviceMotionEvent.requestPermission()
    this.setState(stateUpdate)
  }

  render() {
    return (
      <div>
        <div>Acc Test</div>
        <BooleanState text='Motion supported' value={this.state.motionSupport} />
        <BooleanState text='Permission required' value={this.state.motionPermissionRequired} />
        <BooleanState text='Permission granted' value={this.state.motionPermission} />
        <button onClick={this.requestMotionPermissions.bind(this)}>Request Permission</button>
        {/* Because firefox doesn't support querying for permission, don't bother showing the state */}
        {/* <BooleanState text='Permission (accelerometer)' value={this.state.accelerometerPermission} /> */}
        {/* <BooleanState text='Permission (gyroscope)' value={this.state.gyroscopePermission} /> */}
        <Graph />
      </div>
    )
  }
}

export default App
