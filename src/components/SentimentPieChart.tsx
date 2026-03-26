import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { useState } from 'react';

interface SentimentPieChartProps {
  positive: number;
  negative: number;
  neutral: number;
  onSliceClick?: (sentiment: string) => void;
}

const COLORS = {
  positive: '#00C17A',
  negative: '#F24935',
  neutral: '#494C6B'
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} className="font-black text-lg">
        {payload.name}
      </text>
      <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#666" className="text-sm">
        {value} ({(percent * 100).toFixed(1)}%)
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx} cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 14}
        outerRadius={outerRadius + 18}
        fill={fill}
      />
    </g>
  );
};

export const SentimentPieChart = ({ positive, negative, neutral, onSliceClick }: SentimentPieChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  
  const data = [
    { name: 'إيجابي', value: positive, color: COLORS.positive, key: 'إيجابي' },
    { name: 'سلبي', value: negative, color: COLORS.negative, key: 'سلبي' },
    { name: 'محايد', value: neutral, color: COLORS.neutral, key: 'محايد' }
  ];

  const total = positive + negative + neutral;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percent = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-card p-3 border border-border rounded-2xl shadow-lg">
          <p className="font-bold">{payload[0].name}</p>
          <p className="text-sm">
            {payload[0].value} تغريدة ({percent}%)
          </p>
          {onSliceClick && (
            <p className="text-xs text-blue-600 mt-1 font-bold">🔍 اضغط للتصفية</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[400px] border border-border rounded-2xl p-4 bg-card">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={false}
            outerRadius={120}
            innerRadius={50}
            fill="#8884d8"
            dataKey="value"
            stroke="#fff"
            strokeWidth={3}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
            onClick={(entry) => {
              if (onSliceClick) onSliceClick(entry.key);
            }}
            style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={50}
            align="center"
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="font-bold text-base">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
