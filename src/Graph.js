import '../node_modules/react-vis/dist/style.css'
import { XYPlot, LineSeries, VerticalGridLines, HorizontalGridLines, XAxis, YAxis } from 'react-vis'

/**
* @param {object} props
* @param {object[]} props.dataX
*/
export default function Graph ({dataX, dataY, dataZ}) {
 return (
   <div>
     <XYPlot height={400} width={400}>
       <VerticalGridLines />
       <HorizontalGridLines />
       <XAxis />
       <YAxis />
       <LineSeries className='motion-z' data={dataZ} color='blue' />
       <LineSeries className='motion-y' data={dataY} color='green' />
       <LineSeries className='motion-x' data={dataX} color='red' />
     </XYPlot>
   </div>
 )
}