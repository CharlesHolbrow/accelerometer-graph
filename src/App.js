import './index.css'

import React from 'react'

// My React Components
import Pads from './Pads'
import Graph from './Graph'
import LocalStoreTextField from './LocalStoreTextField'
import MotionMaster from './MotionMaster'

// My miscellaneous
import { sendToServer } from './server-access'

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
      <MotionMaster onMotionEvent={motion => motionEventsRef.current.push(motion)}/>
      <Graph dataX={state.graphX} dataY={state.graphY} dataZ={state.graphZ} />
      <div>game time: {(gameTime * 0.001).toFixed(1)}</div>
      <Pads time={gameTime}/>
      <LocalStoreTextField onChange={setSessionName} id='input-session-name' label='session' type='text' />
      <LocalStoreTextField onChange={setKey}         id='input-key'          label='key'     type='password' />
      <button onClick={sendMotionEventsToServer}>Send</button>
    </div>
  )
}

export default App
