import './index.css'

import React from 'react'

// My React Components
import Pads from './Pads'
import Graph from './Graph'
import LocalStoreTextField from './LocalStoreTextField'
import MotionMaster from './MotionMaster'

// My miscellaneous
import { sendToServer } from './server-access'

export default function App() {
  const motionEventsRef = React.useRef([]) // All motion events
  const buttonEventsRef = React.useRef([]) // All button events
  const previousMotionEvent = React.useRef(null)
  const [state, setState] = React.useState({
    graphX: [],
    graphY: [],
    graphZ: [],
    buttons: [],
    gameTime: 0,
  })

  // const [gameTime, setGameTime] = React.useState(0)

  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = React.useRef()
  const previousTimeRef = React.useRef()
  const graphDurationSeconds = 8

  const animate = React.useCallback(time => {
    time *= 0.001 // do everything in seconds, not milliseconds
    if (typeof previousTimeRef.current === 'number') {
      const deltaTime = time - previousTimeRef.current

      // Pass on a function to the setter of the state
      // to make sure we always have the latest state

      setState((oldState) => {
        // If we want to "bail out", we can return the old state object
        const {graphX, graphY, graphZ, buttons} = oldState

        if (motionEventsRef.current.length) {
          const newState = { gameTime: time } 

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

          return newState
        }
        return oldState
      })
    }

    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }, [])

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(requestRef.current) }
  }, []) // eslint-disable-line

  const keyRef = React.useRef('secret')
  const setKey = (key) => keyRef.current = key
  const sessionNameRef = React.useRef('session01')
  const setSessionName = (sessionName) => sessionNameRef.current = sessionName

  const sendMotionEventsToServer = async () => {
    // TODO: display results
    // TODO: send actual content. (not dummy content)
    const result = await sendToServer(keyRef.current, sessionNameRef.current, { example: 'payload' })
    console.log(result)
  }

  return (
    <div>
      <h3>App2</h3>
      <MotionMaster onMotionEvent={motion => motionEventsRef.current.push(motion) }/>
      <Graph dataX={state.graphX} dataY={state.graphY} dataZ={state.graphZ} dataB={state.buttons} />
      <div>game time: {state.gameTime.toFixed(1)}</div>
      <Pads time={state.gameTime} onButtonEvent={event => buttonEventsRef.current.push(event) }/>
      <LocalStoreTextField onChange={setSessionName} id='input-session-name' label='session' type='text' />
      <LocalStoreTextField onChange={setKey}         id='input-key'          label='key'     type='password' />
      <button onClick={sendMotionEventsToServer}>Send</button>
    </div>
  )
}

// Find which items we need to remove from the 
const indexOfLastEventBefore = (time, events) => {
  let i = 0
  while (i < events.length) {
    if (events[i].x > time) break
    i++
  }
  return i
}