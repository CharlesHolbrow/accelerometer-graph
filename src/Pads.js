import React from 'react'

const getGamepadsInObject = () => {
  // Firefox returns an Array, Chrome returns an object with int for keys
  const gamePads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [])
  if (Array.isArray(gamePads)) {
    const obj = {}
    gamePads.forEach((pad, key) => { obj[key] = pad })
    return obj
  }
  return gamePads
}

const jsPadsToCPads = (jsPadObj) => {
  const cPadObj = {}
  Object.entries(jsPadObj).forEach(([i, pad]) => { if (pad) cPadObj[i] = createCPad(pad) })
  return cPadObj
}

function PadButton({value, handle, time}) {
  return <span>{value ? '✅' : '⭕️'}</span>
}

function Pad({buttons}) {
  const elements = buttons.map((b, i) => {
    return <PadButton value={b} key={i} />
  })

  return (
    <div>{elements}</div>
  )
}

const createCPad = (jsPad) => {
  return { buttons: jsPad.buttons.map(b => b.value), id: jsPad.id, index: jsPad.index }
}

function Pads({ time }) {
  const previousGamepadsRef = React.useRef([])

  // Note that firefox will return the same object on subsequent calls to
  // getGamepads. The immutable properties will have changed, but the objects
  // will be the same. If we want to compare objects between callbacks, we
  // must deep copy any properties we are interested in.
  const jsGamepads = getGamepadsInObject()
  const currentGamepads = jsPadsToCPads(jsGamepads)
  const previousGamepads = previousGamepadsRef.current
  previousGamepadsRef.current = currentGamepads

  // cStateRef stores the state of all current game pads. They keys are .index
  // values, and values are custom objects created with 'createCPad(jsObject)'.
  // Unlike currentGamepads and previousGamepads, a change to the cState.buttons
  // object between frames should indicate a change to the underlying data.
  const cStateRef = React.useRef({})

  const addPad = (cPad) => cStateRef.current[cPad.index] = createCPad(cPad)
  const removePad = (cPad) => delete cStateRef.current[cPad.index]

  // check if we need to remove pads
  Object.entries(previousGamepads).forEach(([i, cPad]) => {
    if (cPad && !currentGamepads[i]){
      removePad(cPad)
      console.log(`pad${i} removed`)
    }
  })
  // check if we need to add pads
  Object.entries(currentGamepads).forEach(([i, cPad]) => {
    if (!cPad) return
    if (!previousGamepads[i]) {
      console.log(`pad${i} added`, jsGamepads[i])
      addPad(cPad)
    } else {
      for (const [j, b] of cPad.buttons.entries()) {
        if (b !== previousGamepads[i].buttons[j]) console.log(`pad${i} b${j} state: ${b} at ${time}`)
      }
      cStateRef.current[cPad.index] = cPad
    }
  })

  const padElements = Object.entries(cStateRef.current).map(([i, cPad]) => {
    return <Pad buttons={cPad.buttons} key={i} ></Pad>
  })

  return (
    <div>Pads
      {padElements}
    </div>
  )
}

export default Pads
