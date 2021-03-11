import React from 'react'

function BooleanState(props) {
  return (
    <div>{props.text}: {typeof props.value === 'string' ? props.value : props.value ? '✅' : '❌'}</div>
  )
}

export default function MotionMaster ({onMotionEvent}) {
  const [motionPermission, setMotionPermission] = React.useState('🤷')

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
      { requestFunction && <BooleanState text='Permission granted' value={motionPermission} /> }
      { requestFunction && <button onClick={requestMotionPermissions}>request permission</button> }
    </div>
  )
}
