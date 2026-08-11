'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ChartWrapper({ data }: { data: any[] }) {
  const COLORS = {
    vencido: '#D9D9D9',
    liquidar: '#FF0000',
    proximo: '#E97132',
    precaucion: '#FFC000',
    atencion: '#00B050'
  };

  const totals = {
    vencido: data.reduce((acc, curr) => acc + Number(curr.vencido), 0),
    liquidar: data.reduce((acc, curr) => acc + Number(curr.liquidar), 0),
    proximo: data.reduce((acc, curr) => acc + Number(curr.proximo), 0),
    precaucion: data.reduce((acc, curr) => acc + Number(curr.precaucion), 0),
    atencion: data.reduce((acc, curr) => acc + Number(curr.atencion), 0),
  };

  const pieData = [
    { name: 'Vencido', value: totals.vencido, color: COLORS.vencido },
    { name: 'Liquidar', value: totals.liquidar, color: COLORS.liquidar },
    { name: 'Próximo', value: totals.proximo, color: COLORS.proximo },
    { name: 'Precaución', value: totals.precaucion, color: COLORS.precaucion },
    { name: 'Atención', value: totals.atencion, color: COLORS.atencion },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfico de Barras por Sucursal */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Estado de Productos por Sucursal</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="sucursal" axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={80} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="atencion" name="Atención (>270d)" stackId="a" fill={COLORS.atencion} radius={[0, 0, 4, 4]} />
              <Bar dataKey="precaucion" name="Precaución (181-270d)" stackId="a" fill={COLORS.precaucion} />
              <Bar dataKey="proximo" name="Próximo (61-180d)" stackId="a" fill={COLORS.proximo} />
              <Bar dataKey="liquidar" name="Liquidar (0-60d)" stackId="a" fill={COLORS.liquidar} />
              <Bar dataKey="vencido" name="Vencido (<0d)" stackId="a" fill={COLORS.vencido} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Torta General */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución Global</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={'cell-' + index} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-8 space-y-3">
          {pieData.map(item => (
            <div key={item.name} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: item.color}}></span>
                <span className="text-slate-600 font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md">{item.value} productos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
