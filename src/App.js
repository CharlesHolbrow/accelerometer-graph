import './index.css'

import React from 'react'

// My React Components
import Pads from './Pads'
import Graph from './Graph'
import LocalStoreTextField from './LocalStoreTextField'
import MotionMaster from './MotionMaster'

// My miscellaneous
import { sendToServer } from './server-access'

// Find which items we need to remove from a sequence of events. Assume each
// event has a .x member which indicates it's time.
const indexOfLastEventBefore = (time, events) => {
  let i = 0
  while (i < events.length) {
    if (events[i].x > time) break
    i++
  }
  return i
}

const SEND_INTERVAL_SECONDS = 20

export default function App() {
  // These two EventsRef objects are where we store our event while they are
  // waiting to be sent to the server. Note that these are cleared every time we
  // start recording. They are also cleared each time we sent the current state
  // to the server.
  const motionEventsRef = React.useRef([])
  const buttonEventsRef = React.useRef([])
  //
  const previousMotionEvent = React.useRef(null)

  const [state, setState] = React.useState({
    graphX: [],
    graphY: [],
    graphZ: [],
    buttons: [],
    gameTime: 0,
  })

  const [message, setMessage] = React.useState('')
  const [recording, setRecording] = React.useState(false)
  const recordingStartTimeRef = React.useRef(0)
  const previousSendTimeRef = React.useRef(0)

  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const animationRef = React.useRef()
  const timeRef = React.useRef(0)

  const log = (msg) => {
    let stringMsg
    if (typeof msg === 'string' || typeof msg === 'number') stringMsg = msg
    else if (msg instanceof Response) stringMsg = `${msg.status}-${msg.statusText}`
    else stringMsg = JSON.stringify(msg)
    setMessage(`${timeRef.current.toFixed(2)}: ${stringMsg}`)
    console.log(msg)
  }

  const graphDurationSeconds = 8

  const keyRef = React.useRef('secret')
  const setKey = (key) => keyRef.current = key
  const sessionNameRef = React.useRef('session01')
  const setSessionName = (sessionName) => sessionNameRef.current = sessionName

  const sendEventsToServer = async () => {
    // Update the previous sendTimeRef even if there is nothing to send. This
    // will just trigger another retry after SEND_INTERVAL_SECONDS
    previousSendTimeRef.current = timeRef.current

    if (!motionEventsRef.current.length && !buttonEventsRef.current.length) {
      log('nothing to send')
      return
    }

    const content = {
      motionEvents: motionEventsRef.current,
      buttonEvents: buttonEventsRef.current,
    }
    motionEventsRef.current = []
    buttonEventsRef.current = []

    const result = await sendToServer(keyRef.current, sessionNameRef.current, content)
    log(result)
  }

  const timeSinceLastSend = timeRef.current - previousSendTimeRef.current
  if (recording && timeSinceLastSend > SEND_INTERVAL_SECONDS) {
    sendEventsToServer()
  }

  const toggleRecording = () => {
    if (!recording) {
      recordingStartTimeRef.current = state.gameTime
      previousSendTimeRef.current = state.gameTime
      motionEventsRef.current = []
      buttonEventsRef.current = []
    } else {
      sendEventsToServer()
    }
    setRecording(!recording)
  }

  const animate = React.useCallback(time => {
    time *= 0.001 // do everything in seconds, not milliseconds

    const deltaTime = time - timeRef.current
    timeRef.current = time

    setState((oldState) => {
      // If we want to "bail out", we can return the old state object
      const { graphX, graphY, graphZ } = oldState
      const newState = { ...oldState }
      newState.gameTime = time

      if (motionEventsRef.current.length) {
        let i = motionEventsRef.current.length -1
        const mostRecentEvent = motionEventsRef.current[i]
        const previouslyAddedMotionEvent = previousMotionEvent.current
        previousMotionEvent.current = mostRecentEvent

        const graphStartTime = time - graphDurationSeconds
        const sliceFrom = indexOfLastEventBefore(graphStartTime, graphX)
        const sliceTo = graphX.length

        newState.graphX = graphX.slice(sliceFrom, sliceTo)
        newState.graphY = graphY.slice(sliceFrom, sliceTo)
        newState.graphZ = graphZ.slice(sliceFrom, sliceTo)

        if (mostRecentEvent !== previouslyAddedMotionEvent) {
          newState.graphX.push({ x: mostRecentEvent.time, y: mostRecentEvent.acc.x })
          newState.graphY.push({ x: mostRecentEvent.time, y: mostRecentEvent.acc.y })
          newState.graphZ.push({ x: mostRecentEvent.time, y: mostRecentEvent.acc.z })
        }

        // find all the button pushes that are within the window of interest
        const newButtons = newState.buttons = []
        for (let i = buttonEventsRef.current.length - 1; i >=0; i--) {
          const buttonEvent = buttonEventsRef.current[i]
          if (buttonEvent.time < graphStartTime) break
          if (buttonEvent.type === 'down') newButtons.push({x: buttonEvent.time, y: buttonEvent.button })
        }
      }
      return newState
    })

    animationRef.current = requestAnimationFrame(animate)
  }, [])

  React.useEffect(() => {
    animationRef.current = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(animationRef.current) }
  }, []) // eslint-disable-line

  return (
    <div>
      <h3>App2</h3>
      <MotionMaster onMotionEvent={motion => motionEventsRef.current.push(motion) }/>
      <Graph dataX={state.graphX} dataY={state.graphY} dataZ={state.graphZ} dataB={state.buttons} />
      <div>record time: {recording ? (state.gameTime - recordingStartTimeRef.current).toFixed(1) : 'X'}</div>
      <Pads time={state.gameTime} onButtonEvent={event => buttonEventsRef.current.push(event) }/>
      <LocalStoreTextField onChange={setSessionName} id='input-session-name' label='session' type='text' />
      <LocalStoreTextField onChange={setKey}         id='input-key'          label='key'     type='password' />
      <button onClick={toggleRecording}>{recording ? 'Stop' : 'Record'}</button>
      <button onClick={sendEventsToServer}>Send</button>
      <div style={{color:'red'}}>{message}</div>
    </div>
  )
}
