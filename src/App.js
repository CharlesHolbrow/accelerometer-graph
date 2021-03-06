import React, { Component } from 'react';
import '../node_modules/react-vis/dist/style.css';
import { XYPlot, LineSeries, VerticalGridLines, HorizontalGridLines, XAxis, YAxis } from 'react-vis';

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      motionHandler: (event) => {
        // event has several interesting properties, measured in chrome
        // holding the phone in front of you selfie style (in portrait mode)
        // - event.accelerationIncludingGravity
        // - event.acceleration.x left/right
        //                     .y up/down
        //                     .z toward/away from you
        // - event.interval - a time in ms, always 16 on my motox4 (always in integer?)
        // - event.timeStamp - float value in milliseconds
        // - rotationRate.alpha
        //               .beta
        //               .gamma
        const acc = event.accelerationIncludingGravity
        const time = event.timeStamp * .001
        console.log('motion', event.interval, event)

        const motionX = this.state.motionX.slice()
        const motionY = this.state.motionY.slice()
        const motionZ = this.state.motionZ.slice()

        motionX.push({x: time, y: acc.x})
        motionY.push({x: time, y: acc.y})
        motionZ.push({x: time, y: acc.z})

        if (motionX.length > 300) motionX.shift()
        if (motionY.length > 300) motionY.shift()
        if (motionZ.length > 300) motionZ.shift()
        this.setState({ motionX, motionY, motionZ })
      },
      motionX: [],
      motionY: [],
      motionZ: [],
    }

    // window.addEventListener('deviceorientation', this.state.orientationHandler)
    window.addEventListener('devicemotion', this.state.motionHandler)

  }

  componentWillUnmount() {
    window.removeEventListener('devicemotion', this.state.motionHandler)
  }

  render() {
    return (
      <div className="App">
        <XYPlot height={400} width={400}  >
          <VerticalGridLines />
          <HorizontalGridLines />
          <XAxis />
          <YAxis />
          <LineSeries className='motion-z' data={this.state.motionZ} color='blue' />
          <LineSeries className='motion-y' data={this.state.motionY} color='green' />
          <LineSeries className='motion-x' data={this.state.motionX} color='red' />
        </XYPlot>
      </div>
    );
  }
}

export default App;
