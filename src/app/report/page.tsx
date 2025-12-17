'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const NUM_MOLECULES = 16000;
const BIN_SIZE = 1000;

// Generates mock data for the report
const generateDockingData = () => {
  const data = [];
  for (let i = 0; i < NUM_MOLECULES; i++) {
    // Classical docking: relatively fast and consistent
    const classicalTime = 5 + Math.random() * 5; // 5-10 seconds

    // Quantum docking: slower but improves with scale (mocked)
    const quantumTime = 30 + Math.random() * 10 - (i / NUM_MOLECULES) * 15; // Starts ~30-40s, ends ~25-35s

    data.push({
      molecule: i + 1,
      classicalTime,
      quantumTime,
    });
  }
  return data;
};

// Bins the data for visualization
const binData = (data: any[]) => {
  const binnedData = [];
  for (let i = 0; i < NUM_MOLECULES; i += BIN_SIZE) {
    const bin = data.slice(i, i + BIN_SIZE);
    const avgClassicalTime = bin.reduce((acc, cur) => acc + cur.classicalTime, 0) / BIN_SIZE;
    const avgQuantumTime = bin.reduce((acc, cur) => acc + cur.quantumTime, 0) / BIN_SIZE;
    binnedData.push({
      name: `${i + 1}-${i + BIN_SIZE}`,
      'Classical Docking': avgClassicalTime,
      'Quantum Docking': avgQuantumTime,
    });
  }
  return binnedData;
};

export default function ReportPage() {
  const chartData = useMemo(() => {
    const rawData = generateDockingData();
    return binData(rawData);
  }, []);

  const summaryStats = useMemo(() => {
    const totalClassical = chartData.reduce((acc, cur) => acc + cur['Classical Docking'], 0) * BIN_SIZE;
    const totalQuantum = chartData.reduce((acc, cur) => acc + cur['Quantum Docking'], 0) * BIN_SIZE;
    return {
        totalClassical,
        totalQuantum,
        avgClassical: totalClassical / NUM_MOLECULES,
        avgQuantum: totalQuantum / NUM_MOLECULES
    };
  }, [chartData]);


  return (
    <main className="flex-1 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Docking Performance Analysis Report</CardTitle>
          <CardDescription>
            Comparing Classical vs. Quantum Docking Time for {NUM_MOLECULES.toLocaleString()} Molecules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-2">Methodology</h3>
                <p className="text-sm text-muted-foreground">
                    This report visualizes a simulated performance comparison between a classical docking algorithm and a quantum-enhanced docking algorithm across a large set of 16,000 molecules. The data is generated programmatically to reflect typical performance characteristics: classical methods exhibit consistent, lower-overhead timing, while quantum methods, though having higher initial computational cost, may show scaling advantages or variability. To make the large dataset comprehensible, the molecules are grouped into 16 bins of 1,000 molecules each, and the average docking time per molecule is plotted for each bin.
                </p>
            </div>
          
            <Card>
                <CardHeader>
                    <CardTitle>Performance Comparison Chart</CardTitle>
                    <CardDescription>Average time per molecule (in seconds)</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                        data={chartData}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                        >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" label={{ value: 'Molecule Bins', position: 'insideBottom', offset: -10 }} />
                        <YAxis label={{ value: 'Average Time (s)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            labelStyle={{ fontWeight: 'bold' }}
                            formatter={(value: number) => `${value.toFixed(2)}s`}
                        />
                        <Legend verticalAlign="top" />
                        <Line type="monotone" dataKey="Classical Docking" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Quantum Docking" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Summary Statistics</CardTitle>
                    <CardDescription>Overall metrics for the full {NUM_MOLECULES.toLocaleString()} molecule dataset.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-right">Classical Docking</TableHead>
                                <TableHead className="text-right">Quantum Docking</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Total Simulation Time</TableCell>
                                <TableCell className="text-right">{(summaryStats.totalClassical / 3600).toFixed(2)} hours</TableCell>
                                <TableCell className="text-right">{(summaryStats.totalQuantum / 3600).toFixed(2)} hours</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Average Time per Molecule</TableCell>
                                <TableCell className="text-right">{summaryStats.avgClassical.toFixed(2)} seconds</TableCell>
                                <TableCell className="text-right">{summaryStats.avgQuantum.toFixed(2)} seconds</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Throughput (Molecules per Hour)</TableCell>
                                <TableCell className="text-right">{(3600 / summaryStats.avgClassical).toFixed(0)}</TableCell>
                                <TableCell className="text-right">{(3600 / summaryStats.avgQuantum).toFixed(0)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </main>
  );
}
