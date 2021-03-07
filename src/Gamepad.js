import React from 'react'

function PadButton({value}) {
  return <span>{value ? '✅' : '⭕️'}</span>
}

function Pad({buttons}) {
  const elements = buttons.map((b, i) => <PadButton value={b.value} key={i} />)
  return (
    <div>{elements}</div>
  )
}

function Pads({ time }) {
  const [padState, setPadState] = React.useState({})

  React.useEffect(() => {
    console.log('  pads component useEffect run')
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    console.log('  found pads:', gamepads)
    for (const pad of gamepads) {
      if (!pad) continue
      setPadState(oldPadState => {
        const newPadState = { ...oldPadState }
        newPadState[pad.index] = pad
        return newPadState
      })
    }

    const onConnect = (event) => {
      console.log('   pad connected:', event.gamepad)
      setPadState(oldPadState => {
        const newPadState = {...oldPadState }
        newPadState[event.gamepad.index] = event.gamepad
        return newPadState
      })
    }
  
    const onDisconnect = (event) => {
      console.log('  pad disconnected:', event.gamepad)
      setPadState(oldPadState => {
        const newPadState = {...oldPadState}
        delete newPadState[event.gamepad.index]
        return newPadState
      })
    }

    window.addEventListener('gamepadconnected', onConnect)
    window.addEventListener('gamepaddisconnected', onDisconnect)

    return () => {
      window.removeEventListener('gamepadconnect', onConnect)
      window.removeEventListener('gamepaddisconnect', onDisconnect)
    }
  }, [])

  const pads = Object.entries(padState).map(([index, val]) => {

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    return  <Pad buttons={gamepads[index].buttons} key={index}/>
  })

  return (
    <div> pads {time}
      {pads}
    </div>
  )
}

export default Pads
