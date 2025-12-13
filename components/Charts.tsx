import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TestResult } from '../types';

interface ResultsChartsProps {
  results: TestResult[];
}

export const EnergyChart: React.FC<ResultsChartsProps> = ({ results }) => {
  const data = results.map((r, index) => ({
    name: `${r.material.name} (#${index + 1})`,
    absorbed: r.absorbedEnergy,
    initial: r.initialEnergy,
    fill: r.material.color
  }));

  return (
    <div className="h-[300px] w-full">
      <h3 className="text-sm font-semibold text-slate-500 mb-2">Energía Absorbida (Joules) - Comparativa</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60}/>
          <YAxis label={{ value: 'Energía (J)', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            cursor={{fill: 'transparent'}}
            labelStyle={{color: '#334155', fontWeight: 'bold'}}
          />
          <Legend wrapperStyle={{paddingTop: '20px'}}/>
          <Bar dataKey="absorbed" name="Energía Absorbida" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};