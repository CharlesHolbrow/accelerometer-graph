import React, { Component } from 'react';
import Chart from 'react-apexcharts';
import ReactDOM from 'react-dom';
import './index.css';

function Square (props) {
  return (
    <button
      className='square'
      onClick= { props.onClick }
    >
      { props.value }
    </button>
  )
}

class Board extends Component {

  constructor(props) {
    super(props)
    this.state = {
      squares: new Array(9).fill(null),
      xIsNext: false,
    }
  }

  renderSquare(i) {
    return (
      <Square
        value={this.state.squares[i]}
        onClick={() => this.handleClick(i)}
      />
    );
  }

  handleClick(i) {
    if (calculateWinner(this.state.squares) || this.state.squares[i]) return;
    const xIsNext = !this.state.xIsNext
    const squares = this.state.squares.slice()
    squares[i] = xIsNext ? '✅' : '❌'
    this.setState({ squares, xIsNext })
  }

  render() {
    const winner = calculateWinner(this.state.squares);

    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } else {
      status = `Next player: ${this.state.xIsNext ? '✅' : '❌'}`;
    }

    return (
      <div>
        <div className='status'>{status}</div>
        <div className='board-row'>
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className='board-row'>
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className='board-row'>
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class Game extends Component {
  render() {
    return (
      <div className='game'>
        <div className='game-board'>
          <Board />
        </div>
        <div className='game-info'>
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

const options = {
  chart: {
    id: 'realtime',
    height: 350,
    type: 'line',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    },
    toolbar: {
      show: false
    },
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  title: {
    text: 'Dynamic Updating Chart',
    align: 'left'
  },
  markers: {
    size: 0
  },
  xaxis: {
    type: 'datetime',
    range: 100,
  },
  yaxis: {
    max: 100,min: 0

  },
  legend: {
    show: false
  },
};



class Charty extends Component {
  constructor(props) {
    super(props)
    this.state = {
      options: {
        chart: {
          id: 'basic-line',
          animations: { enabled: false, easing: 'linear', dynamicAnimation: { speed: 1000 }, },
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        stroke: { curve: 'smooth' },
        // xaxis: {
        //   type: 'datetime',
        //   range: 100,
        // },
        yaxis: { max: 100, min: 0 },
        dataLabels: { enabled: false }
      },
      series: [
        {
          name: 'series-1',
          data: new Array(100).fill(50)
        }
      ],
      interval: setInterval(() => {
        const i = this.state.series[0].data.length - 1
        const currentValue = this.state.series[0].data[i]
        const newValue = currentValue + (Math.random() * 5 - 2.5)
        this.push(Math.max(Math.min(newValue, 100)), 0)
      }, 250)
    };
  }

  render() {
    return (
      <div className='line-chart'>
        <Chart
          options={this.state.options}
          series={this.state.series}
          type='line'
          width='500'
          height='500'
        />
      </div>
    )
  }

  componentWillUnmount() {
    clearTimeout(this.state.interval)
  }

  push(value) {
    const data = this.state.series[0].data.slice()
    data.push(value)
    data.shift()
    const series = [{ data, name: 'series-1' }]
    this.setState({ series })
  }
}

// ========================================

ReactDOM.render(
  <Charty />,
  document.getElementById('root')
);
