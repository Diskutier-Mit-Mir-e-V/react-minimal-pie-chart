
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Path from './ReactMinimalPieChartPath'

const VIEWBOX_SIZE = 100
const VIEWBOX_HALF_SIZE = VIEWBOX_SIZE / 2

export default class ReactMinimalPieChart extends Component {
  // Class properties
  state = {
    activeSegment: undefined
  }

  // Constructors
  constructor (props) {
    super(props)

    if (this.props.animate === true) {
      this.hideSegments = true
    }

    // Bindings
    this._handlePathClick.bind(this)
  }

  // Private methods
  _startAnimation () {
    this.hideSegments = false
    this.forceUpdate()
  }

  _sumValues (data) {
    return data.reduce((acc, dataEntry) => acc + dataEntry.value, 0)
  }

  _evaluateViewBoxSize (ratio, baseSize) {
    // Wide ratio
    if (ratio > 1) {
      return `${baseSize} ${baseSize / ratio}`
    }
    // Narrow/squared ratio
    return `${baseSize * ratio} ${baseSize}`
  }

  // @TODO extract padding evaluation
  _evaluateDegreesFromValues (data, totalAngle, totalValue, paddingAngle) {
    const total = totalValue || this._sumValues(data)

    // Remove segments padding from total degrees
    const degreesTakenByPadding = paddingAngle * (data.length)
    let totalDegrees = Math.abs(totalAngle) - degreesTakenByPadding

    if (totalDegrees > 360) totalDegrees = 360
    if (totalAngle < 0) totalDegrees = -totalDegrees

    // Append "degrees" into each data entry
    return data.map(dataEntry => Object.assign(
      { degrees: (dataEntry.value / total) * totalDegrees },
      dataEntry
    ))
  }

  _makeSegmentTransitionStyle (duration, easing) {
    return {
      transition: `stroke-dashoffset ${duration}ms ${easing}`
    }
  }

  _makeSegments (data, props, hide) {
    // Keep track of how many degrees have already been taken
    let lastSegmentAngle = props.startAngle
    const segmentsPaddingAngle = props.paddingAngle * (props.lengthAngle / Math.abs(props.lengthAngle))
    let reveal

    const style = props.animate
      ? this._makeSegmentTransitionStyle(props.animationDuration, props.animationEasing)
      : undefined

    // Hide/reveal the segment?
    if (hide === true) {
      reveal = 0
    } else if (typeof props.reveal === 'number') {
      reveal = props.reveal
    } else if (hide === false) {
      reveal = 100
    }

    return data.map((dataEntry, index) => {
      const startAngle = lastSegmentAngle
      lastSegmentAngle += dataEntry.degrees + segmentsPaddingAngle

      return (
        <Path
          key={dataEntry.key || index}
          cx={props.cx}
          cy={props.cy}
          startAngle={startAngle}
          lengthAngle={dataEntry.degrees}
          radius={props.radius}
          lineWidth={(props.radius / 100) * props.lineWidth}
          reveal={reveal}
          style={style}
          stroke={this.state.activeSegment === index ? (dataEntry.highlight || dataEntry.color) : dataEntry.color}
          strokeLinecap={props.rounded ? 'round' : undefined}
          fill='none'
          onClick={() => this._handlePathClick(index)}
        />
      )
    })
  }

  _handlePathClick (index) {
    this.setState({
      activeSegment: index
    })

    this.props.clicked(this.state.activeSegment)
  }

  // Lifecycle methods
  componentDidMount () {
    if (this.props.animate === true && window.requestAnimationFrame) {
      this.initialAnimationTimerId = setTimeout(
        () => {
          this.initialAnimationTimerId = null
          this.initialAnimationRAFId = window.requestAnimationFrame(() => {
            this.initialAnimationRAFId = null
            this._startAnimation()
          })
        }
      )
    }
  }

  componentWillUnmount () {
    if (this.initialAnimationTimerId) {
      clearTimeout(this.initialAnimationTimerId)
    }
    if (this.initialAnimationRAFId) {
      window.cancelAnimationFrame(this.initialAnimationRAFId)
    }
  }

  render () {
    if (this.props.data === undefined) {
      return null
    }

    const normalizedData = this._evaluateDegreesFromValues(
      this.props.data,
      this.props.lengthAngle,
      this.props.totalValue,
      this.props.paddingAngle
    )

    return (
      <div
        className={this.props.className}
        style={this.props.style}
      >
        <svg
          viewBox={`0 0 ${this._evaluateViewBoxSize(this.props.ratio, VIEWBOX_SIZE)}`}
          width='100%'
          height='100%'
          style={{ display: 'block' }}
        >
          {this._makeSegments(normalizedData, this.props, this.hideSegments)}
        </svg>
        {this.props.children}
      </div>
    )
  }
}

ReactMinimalPieChart.displayName = 'ReactMinimalPieChart'

ReactMinimalPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      key: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
      ]),
      color: PropTypes.string,
      highlight: PropTypes.string
    })
  ),
  cx: PropTypes.number,
  cy: PropTypes.number,
  ratio: PropTypes.number,
  totalValue: PropTypes.number,
  style: PropTypes.objectOf(
    PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ])
  ),
  startAngle: PropTypes.number,
  lengthAngle: PropTypes.number,
  paddingAngle: PropTypes.number,
  lineWidth: PropTypes.number,
  radius: PropTypes.number,
  rounded: PropTypes.bool,
  animate: PropTypes.bool,
  animationDuration: PropTypes.number,
  animationEasing: PropTypes.string,
  reveal: PropTypes.number,
  children: PropTypes.node,
  clicked: PropTypes.func
}

ReactMinimalPieChart.defaultProps = {
  cx: VIEWBOX_HALF_SIZE,
  cy: VIEWBOX_HALF_SIZE,
  ratio: 1,
  startAngle: 0,
  lengthAngle: 360,
  paddingAngle: 0,
  lineWidth: 100,
  radius: VIEWBOX_HALF_SIZE,
  rounded: false,
  animate: false,
  animationDuration: 500,
  animationEasing: 'ease-out'
}
