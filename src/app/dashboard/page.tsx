
'use client';

import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { molecules as allMolecules, type Molecule } from '@/lib/molecules';
import { proteins as allProteins, type Protein } from '@/lib/proteins';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Save, Clock, Beaker, Zap, Orbit, Link2, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export const dynamic = 'force-dynamic';

type SimulationStatus = 'idle' | 'preparing' | 'simulating' | 'analyzing' | 'complete' | 'error';
type SimulationStep = 'preparing' | 'classifying' | 'docking' | 'refining' | 'predicting' | 'done';

type Result = {
    molecule: Molecule;
    protein: Protein;
    status: SimulationStatus;
    step: SimulationStep;
    progress: number;
    classicalScore: number | null;
    refinedEnergy: number | null;
    prediction: any | null;
    error?: string;
    createdAt?: any;
    userId?: string;
};

const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash;
};

const getAffinityLevel = (affinity: number): { level: 'High' | 'Moderate' | 'Low', className: string } => {
    if (affinity < 10) return { level: 'High', className: 'bg-green-500 hover:bg-green-500/80' };
    if (affinity <= 100) return { level: 'Moderate', className: 'bg-yellow-500 hover:bg-yellow-500/80' };
    return { level: 'Low', className: 'bg-red-500 hover:bg-red-500/80' };
};


function SimulationResultsDisplay({ results, title, onSaveResults, isSaving }: { results: Result[], title: string, onSaveResults: () => void, isSaving: boolean }) {
    const completedResults = useMemo(() => results.filter(r => r.status === 'complete' && r.prediction), [results]);
    const erroredResults = useMemo(() => results.filter(r => r.status === 'error'), [results]);

    const chartData = useMemo(() => {
        return completedResults
            .map(r => ({
                name: `${r.molecule.name.substring(0, 10)}... + ${r.protein.name.substring(0, 10)}...`,
                bindingAffinity: r.prediction.bindingAffinity,
            }))
            .sort((a, b) => a.bindingAffinity - b.bindingAffinity);
    }, [completedResults]);

    const chartConfig = {
        bindingAffinity: {
            label: "Binding Affinity (nM)",
            color: "hsl(var(--accent))",
        },
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const docTitle = "QuantumDock - Detailed Simulation Results";

        doc.setFontSize(18);
        doc.text(docTitle, 14, 22);

        let lastY = 30;

        if (chartData.length > 0) {
             const chartContainer = document.querySelector('[data-testid="chart-container"]');
            if (chartContainer) {
                const canvas = chartContainer.querySelector('canvas');
                if (canvas) {
                    const imgData = canvas.toDataURL('image/png', 1.0);
                    doc.setFontSize(14);
                    doc.text("Binding Affinity Comparison", 14, lastY);
                    lastY += 10;
                    const imgProps = doc.getImageProperties(imgData);
                    const pdfWidth = doc.internal.pageSize.getWidth() - 28;
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    doc.addImage(imgData, 'PNG', 14, lastY, pdfWidth, pdfHeight);
                    lastY += pdfHeight + 10;
                }
            }
        }
        
        doc.setFontSize(14);
        doc.text("Detailed Simulation Results", 14, lastY);
        lastY += 10;


        const mainTableColumn = ["Combination", "Classical Score (kcal/mol)", "Refined Energy (kcal/mol)", "Quantum Affinity (nM)", "Confidence", "GNN Model (nM)", "Explanation", "Affinity Level"];
        const mainTableRows: any[][] = [];

        completedResults.forEach(res => {
            const rowData = [
                `${res.molecule.name} + ${res.protein.name}`,
                res.classicalScore?.toFixed(2) ?? 'N/A',
                res.refinedEnergy?.toFixed(2) ?? 'N/A',
                res.prediction.bindingAffinity.toFixed(2),
                `${Math.round(res.prediction.confidenceScore * 100)}%`,
                res.prediction.comparison.gnnModelScore.toFixed(2),
                res.prediction.comparison.explanation,
                getAffinityLevel(res.prediction.bindingAffinity).level,
            ];
            mainTableRows.push(rowData);
        });

        if (mainTableRows.length > 0) {
            (doc as any).autoTable({
                head: [mainTableColumn],
                body: mainTableRows,
                startY: lastY,
                theme: 'striped',
                headStyles: { fillColor: [46, 82, 102] },
                columnStyles: { 6: { cellWidth: 70 } }
            });
            lastY = (doc as any).lastAutoTable.finalY + 15;
        } else {
             doc.setFontSize(12);
             doc.text("No completed simulation data to export.", 14, lastY);
             lastY += 10;
        }
        
        doc.setFontSize(14);
        doc.text("Molecular Properties", 14, lastY);
        lastY += 10;
        
        const propertiesTableColumn = ["Combination", "Comb. MW (Da)", "H-Donors", "H-Acceptors"];
        const propertiesTableRows: any[][] = [];

        completedResults.forEach(res => {
            const rowData = [
                 `${res.molecule.name} + ${res.protein.name}`,
                 (res.molecule.molecularWeight + res.protein.molecularWeight).toLocaleString(undefined, { maximumFractionDigits: 2 }),
                 res.molecule.donors,
                 res.molecule.acceptors
            ];
            propertiesTableRows.push(rowData);
        });
        
         if (propertiesTableRows.length > 0) {
            (doc as any).autoTable({
                head: [propertiesTableColumn],
                body: propertiesTableRows,
                startY: lastY,
                theme: 'striped',
                headStyles: { fillColor: [46, 82, 102] }
            });
             lastY = (doc as any).lastAutoTable.finalY + 15;
        }
        
        doc.setFontSize(14);
        doc.text("Performance Comparison", 14, lastY);
        lastY += 10;

        const timingTableColumn = ["Combination", "Quantum Model Time (s)", "GNN Model Time (s)"];
        const timingTableRows: any[][] = [];

        completedResults.forEach(res => {
            const rowData = [
                 `${res.molecule.name} + ${res.protein.name}`,
                 res.prediction.timing.quantumModelTime.toFixed(2),
                 res.prediction.timing.gnnModelTime.toFixed(2),
            ];
            timingTableRows.push(rowData);
        });

        if (timingTableRows.length > 0) {
            (doc as any).autoTable({
                head: [timingTableColumn],
                body: timingTableRows,
                startY: lastY,
                theme: 'grid',
                headStyles: { fillColor: [46, 82, 102] }
            });
        }


        doc.save(`QuantumDock_Results_${new Date().toISOString()}.pdf`);
    };
    
    const handleDownloadDocx = () => {
        if (completedResults.length === 0) {
            alert("No completed simulation data to export.");
            return;
        }

        const tableHeader = new DocxTableRow({
            children: [
                new DocxTableCell({ children: [new Paragraph({ text: "Combination", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "Classical Score (kcal/mol)", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "Refined Energy (kcal/mol)", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "Quantum Affinity (nM)", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "Confidence", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "GNN Model (nM)", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "Explanation", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "Affinity Level", bold: true })] }),
            ],
        });

        const tableRows = completedResults.map(res => new DocxTableRow({
            children: [
                new DocxTableCell({ children: [new Paragraph(`${res.molecule.name} + ${res.protein.name}`)] }),
                new DocxTableCell({ children: [new Paragraph(res.classicalScore?.toFixed(2) ?? 'N/A')] }),
                new DocxTableCell({ children: [new Paragraph(res.refinedEnergy?.toFixed(2) ?? 'N/A')] }),
                new DocxTableCell({ children: [new Paragraph(res.prediction.bindingAffinity.toFixed(2))] }),
                new DocxTableCell({ children: [new Paragraph(`${Math.round(res.prediction.confidenceScore * 100)}%`)] }),
                new DocxTableCell({ children: [new Paragraph(res.prediction.comparison.gnnModelScore.toFixed(2))] }),
                new DocxTableCell({ children: [new Paragraph(res.prediction.comparison.explanation)] }),
                new DocxTableCell({ children: [new Paragraph(getAffinityLevel(res.prediction.bindingAffinity).level)] }),
            ],
        }));

        const mainTable = new DocxTable({
            rows: [tableHeader, ...tableRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
        });

        const propertiesHeader = new DocxTableRow({
            children: [
                 new DocxTableCell({ children: [new Paragraph({ text: "Combination", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "Combined MW (Da)", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "H-Donors", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "H-Acceptors", bold: true })] }),
            ]
        });

         const propertiesRows = completedResults.map(res => new DocxTableRow({
            children: [
                new DocxTableCell({ children: [new Paragraph(`${res.molecule.name} + ${res.protein.name}`)] }),
                new DocxTableCell({ children: [new Paragraph((res.molecule.molecularWeight + res.protein.molecularWeight).toLocaleString(undefined, { maximumFractionDigits: 2 }))] }),
                new DocxTableCell({ children: [new Paragraph(String(res.molecule.donors))] }),
                new DocxTableCell({ children: [new Paragraph(String(res.molecule.acceptors))] }),
            ]
        }));

        const propertiesTable = new DocxTable({
            rows: [propertiesHeader, ...propertiesRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
        });
        
        const timingHeader = new DocxTableRow({
            children: [
                 new DocxTableCell({ children: [new Paragraph({ text: "Combination", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "Quantum Model Time (s)", bold: true })] }),
                new DocxTableCell({ children: [new Paragraph({ text: "GNN Model Time (s)", bold: true })] }),
            ]
        });

        const timingRows = completedResults.map(res => new DocxTableRow({
            children: [
                new DocxTableCell({ children: [new Paragraph(`${res.molecule.name} + ${res.protein.name}`)] }),
                new DocxTableCell({ children: [new Paragraph(res.prediction.timing.quantumModelTime.toFixed(2))] }),
                new DocxTableCell({ children: [new Paragraph(res.prediction.timing.gnnModelTime.toFixed(2))] }),
            ]
        }));
        
        const timingTable = new DocxTable({
            rows: [timingHeader, ...timingRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "QuantumDock - Detailed Simulation Results", bold: true, size: 36 })],
                    }),
                    new Paragraph({ children: [new TextRun({ text: "Molecular Properties", bold: true, size: 28 })] }),
                    propertiesTable,
                    new Paragraph({ text: "", spacing: { after: 200 } }),
                    new Paragraph({ children: [new TextRun({ text: "Binding Affinity Comparison", bold: true, size: 28 })] }),
                    mainTable,
                    new Paragraph({ text: "", spacing: { after: 200 } }),
                    new Paragraph({ children: [new TextRun({ text: "Performance Comparison", bold: true, size: 28 })] }),
                    timingTable,
                ],
            }],
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, `QuantumDock_Results_${new Date().toISOString()}.docx`);
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>
                                Lower binding affinity (nM) indicates a stronger, more favorable interaction.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={completedResults.length === 0}>
                                <Download className="mr-2 h-4 w-4" /> PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownloadDocx} disabled={completedResults.length === 0}>
                                <Download className="mr-2 h-4 w-4" /> DOCX
                            </Button>
                            <Button variant="default" size="sm" onClick={onSaveResults} disabled={completedResults.length === 0 || isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Results
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                     {completedResults.length > 0 && (
                        <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Molecular Properties</CardTitle>
                                <CardDescription>
                                    Combined properties of the simulated molecule-protein pairs.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Combination</TableHead>
                                                <TableHead>Comb. MW (Da)</TableHead>
                                                <TableHead>H-Donors</TableHead>
                                                <TableHead>H-Acceptors</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {completedResults.map((result, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">
                                                        <div>{result.molecule.name}</div>
                                                        <div className="text-xs text-muted-foreground">+ {result.protein.name}</div>
                                                    </TableCell>
                                                    <TableCell>{(result.molecule.molecularWeight + result.protein.molecularWeight).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                                    <TableCell>{result.molecule.donors}</TableCell>
                                                    <TableCell>{result.molecule.acceptors}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div data-testid="chart-container">
                            <CardTitle className="text-lg mb-4">Binding Affinity Comparison</CardTitle>
                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                <ResponsiveContainer>
                                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                            fontSize={10}
                                        />
                                        <YAxis
                                            label={{ value: 'Binding Affinity (nM)', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            content={<ChartTooltipContent />}
                                        />
                                        <Bar dataKey="bindingAffinity" fill="var(--color-bindingAffinity)" radius={4} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                        </>
                    )}
                    
                    <div>
                        <CardTitle className="text-lg mb-4">Detailed Simulation Results</CardTitle>
                         {(completedResults.length === 0 && erroredResults.length === 0) ? (
                            <div className="rounded-md border h-24 flex items-center justify-center text-sm text-muted-foreground">
                                No results yet. Run a simulation to see the output.
                            </div>
                        ) : (
                             <Accordion type="single" collapsible className="w-full">
                                <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 py-2 font-medium text-muted-foreground text-sm border-b">
                                    <div className="col-span-3">Combination</div>
                                    <div className="col-span-2">Classical Score</div>
                                    <div className="col-span-2">Refined Energy</div>
                                    <div className="col-span-2">Quantum Affinity (nM)</div>
                                    <div className="col-span-3 text-right">Affinity Level</div>
                                </div>
                                {completedResults.length > 0 && completedResults.map((result, index) => {
                                    const affinityInfo = getAffinityLevel(result.prediction.bindingAffinity);
                                    return (
                                        <AccordionItem value={`item-${index}`} key={index}>
                                            <AccordionTrigger className="grid sm:grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 hover:no-underline rounded-md">
                                                <div className="col-span-11 sm:col-span-3 text-left">
                                                     <div className="font-medium">{result.molecule.name}</div>
                                                     <div className="text-xs text-muted-foreground">+ {result.protein.name}</div>
                                                </div>
                                                <div className="col-span-11 sm:col-span-2 text-left font-semibold">{result.classicalScore?.toFixed(2)}</div>
                                                <div className="col-span-11 sm:col-span-2 text-left font-semibold">{result.refinedEnergy?.toFixed(2)}</div>
                                                <div className="col-span-11 sm:col-span-2 text-left font-semibold">{result.prediction.bindingAffinity.toFixed(2)}</div>
                                                <div className="col-span-11 sm:col-span-3 text-right">
                                                     <Badge variant="default" className={affinityInfo.className}>
                                                        {affinityInfo.level}
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 pt-4 pb-2 bg-muted/20 border-t space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold flex items-center gap-2"><Beaker className="h-5 w-5 text-primary" /> Quantum Details</h4>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pl-7">
                                                            <div className="text-muted-foreground">Ground-State Energy</div>
                                                            <div className="font-semibold text-right">{result.prediction.groundStateEnergy.toFixed(4)} kcal/mol</div>
                                                            <div className="text-muted-foreground">ΔE (Correction)</div>
                                                            <div className="font-semibold text-right">{result.prediction.energyCorrection.toFixed(4)} kcal/mol</div>
                                                            <div className="text-muted-foreground">Confidence Score</div>
                                                            <div className="font-semibold text-right">{Math.round(result.prediction.confidenceScore * 100)}%</div>
                                                        </div>
                                                    </div>
                                                     <div className="space-y-4">
                                                        <h4 className="font-semibold flex items-center gap-2"><Orbit className="h-5 w-5 text-primary" /> Pose & Consistency</h4>
                                                        <div className="pl-7 space-y-2">
                                                            <p className="text-xs text-muted-foreground">A specific 3D orientation of the ligand within the protein's active site.</p>
                                                            <div className="text-xs font-mono bg-primary/10 p-2 rounded-md mt-1">{result.prediction.pose}</div>
                                                            <div className="text-xs mt-2">
                                                                <span className="font-semibold">Ranking Consistency: {Math.round(result.prediction.rankingConsistency * 100)}%</span>
                                                                <Progress value={result.prediction.rankingConsistency * 100} className="h-1.5 mt-1" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Rationale</h4>
                                                        <p className="text-xs text-muted-foreground pl-7">{result.prediction.rationale}</p>
                                                    </div>
                                                </div>
                                                
                                                {result.prediction.diseaseImpact && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Disease Impact</h4>
                                                        <p className="text-xs text-muted-foreground pl-7">{result.prediction.diseaseImpact}</p>
                                                    </div>
                                                )}

                                                <Separator className="my-4" />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                     <div>
                                                        <h4 className="font-semibold mb-2">Current model vs GNN model</h4>
                                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <div className="text-muted-foreground">GNN Model Affinity</div>
                                                                <div className="font-semibold">{result.prediction.comparison.gnnModelScore.toFixed(2)} nM</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-muted-foreground">Explanation</div>
                                                                <p className="text-xs">{result.prediction.comparison.explanation}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                     <div>
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> Performance Comparison</h4>
                                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <div className="text-muted-foreground">Quantum Model Time</div>
                                                                <div className="font-semibold">{result.prediction.timing.quantumModelTime.toFixed(2)}s</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-muted-foreground">GNN Model Time</div>
                                                                <div className="font-semibold">{result.prediction.timing.gnnModelTime.toFixed(2)}s</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                                {erroredResults.length > 0 && erroredResults.map((result, index) => (
                                    <div key={`error-${index}`} className="p-4 border-b">
                                         <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="font-medium">{result.molecule.name} + {result.protein.name}</div>
                                                <div className="text-xs text-destructive">{result.error}</div>
                                            </div>
                                            <Badge variant="destructive">Error</Badge>
                                        </div>
                                    </div>
                                ))}
                            </Accordion>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


function DashboardPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { firestore, user } = useFirebase();

    const [selectedSmiles, setSelectedSmiles] = useState<Set<string>>(new Set());
    const [selectedProteinNames, setSelectedProteinNames] = useState<Set<string>>(new Set());
    const [selectedDiseases, setSelectedDiseases] = useState<Set<string>>(new Set());
    
    const [isRunning, setIsRunning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [totalProgress, setTotalProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [simulationResults, setSimulationResults] = useState<Result[]>([]);
    const [lastRunResults, setLastRunResults] = useState<Result[]>([]);

    const [hydrated, setHydrated] = useState(false);
     useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (hydrated) {
            const smilesParam = searchParams.get('smiles');
            const proteinsParam = searchParams.get('proteins');
            const diseasesParam = searchParams.get('diseases');

            if (smilesParam) {
                try {
                    setSelectedSmiles(new Set(JSON.parse(smilesParam)));
                } catch {
                    setSelectedSmiles(new Set());
                }
            }
            if (proteinsParam) {
                try {
                    setSelectedProteinNames(new Set(JSON.parse(proteinsParam)));
                } catch {
                    setSelectedProteinNames(new Set());
                }
            }
            if (diseasesParam) {
                try {
                    setSelectedDiseases(new Set(JSON.parse(diseasesParam)));
                } catch {
                    setSelectedDiseases(new Set());
                }
            }
        }
    }, [searchParams, hydrated]);

    const selectedMolecules = useMemo(() => {
        return allMolecules.filter(m => selectedSmiles.has(m.smiles));
    }, [selectedSmiles]);

    const selectedProteins = useMemo(() => {
        return allProteins.filter(p => selectedProteinNames.has(p.name));
    }, [selectedProteinNames]);

    const moleculeQueryString = useMemo(() => {
        const smilesArray = Array.from(selectedSmiles);
        if (smilesArray.length === 0) return '';
        return `smiles=${encodeURIComponent(JSON.stringify(smilesArray))}`;
    }, [selectedSmiles]);

    const proteinQueryString = useMemo(() => {
        const proteinArray = Array.from(selectedProteinNames);
        if (proteinArray.length === 0) return '';
        return `proteins=${encodeURIComponent(JSON.stringify(proteinArray))}`;
    }, [selectedProteinNames]);
    
    const diseaseQueryString = useMemo(() => {
        const diseaseArray = Array.from(selectedDiseases);
        if (diseaseArray.length === 0) return '';
        return `diseases=${encodeURIComponent(JSON.stringify(diseaseArray))}`;
    }, [selectedDiseases]);


    const runSimulation = async () => {
        if (!selectedMolecules.length || !selectedProteins.length) {
            toast({
                variant: 'destructive',
                title: 'Selection missing',
                description: 'Please select at least one molecule and one protein.',
            });
            return;
        }

        setIsRunning(true);
        setTotalProgress(0);
        setCurrentStep('Initializing simulations...');

        const combinations = selectedMolecules.flatMap(molecule =>
            selectedProteins.map(protein => ({ molecule, protein }))
        );

        const initialResults: Result[] = combinations.map(c => ({
            ...c,
            status: 'preparing',
            step: 'preparing',
            progress: 0,
            classicalScore: null,
            refinedEnergy: null,
            prediction: null,
        }));
        setSimulationResults(initialResults);
        setLastRunResults([]);

        const totalSteps = combinations.length;
        let completedSteps = 0;

        const updateOverallProgress = () => {
            completedSteps++;
            setTotalProgress((completedSteps / totalSteps) * 100);
        };
        
        let finalResults: Result[] = [];
        for (let i = 0; i < combinations.length; i++) {
            const { molecule, protein } = combinations[i];
            let currentResult: Result | null = null;
            const updateResult = (update: Partial<Result>) => {
                setSimulationResults(prev => prev.map((r, idx) => {
                     if (idx === i) {
                        currentResult = { ...r, ...update };
                        return currentResult;
                     }
                     return r;
                }));
            };

            try {
                setCurrentStep(`[${i + 1}/${combinations.length}] Simulating ${molecule.name} + ${protein.name}...`);
                updateResult({ status: 'simulating', step: 'predicting', progress: 50 });
                
                // Mock simulation logic
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const seed = simpleHash(molecule.smiles + protein.name);
                const random = () => {
                    let x = Math.sin(seed + i) * 10000;
                    return x - Math.floor(x);
                };

                const classicalScore = -12 + random() * 6; // Range: -12 to -6
                const refinedEnergy = classicalScore - (random() * 2); // Slightly better than classical
                
                const prediction = {
                    bindingAffinity: random() * 100,
                    confidenceScore: 0.7 + random() * 0.29, // 70% to 99%
                    rationale: "The model predicts a strong interaction due to favorable electrostatic and van der Waals forces, coupled with a low desolvation penalty. The ligand fits well within the protein's binding pocket.",
                    pose: `[${(random() * 10).toFixed(4)}, ${(random() * 10).toFixed(4)}, ${(random() * 10).toFixed(4)}]`,
                    groundStateEnergy: -15.0 + random() * 5,
                    energyCorrection: -2.0 + random(),
                    rankingConsistency: 0.8 + random() * 0.19, // 80% to 99%
                    comparison: {
                        gnnModelScore: random() * 120 + 5,
                        explanation: "The quantum model provides a more accurate energy calculation by considering electron correlation effects, which are approximated in the GNN model."
                    },
                    timing: {
                        quantumModelTime: 0.3 + random() * 0.5, // 0.3s to 0.8s
                        gnnModelTime: 1.0 + random() * 1.5, // 1.0s to 2.5s
                    },
                    diseaseImpact: selectedDiseases.size > 0 ? `This interaction shows high potential for disrupting the disease progression of ${Array.from(selectedDiseases)[0]}, as it targets a key pathway.` : null,
                };
                
                updateResult({ 
                    prediction, 
                    classicalScore,
                    refinedEnergy,
                    status: 'complete', 
                    step: 'done', 
                    progress: 100 
                });
                updateOverallProgress();

            } catch (error: any) {
                const errorMessage = error.message || 'An unknown error occurred during simulation.';
                updateResult({ status: 'error', error: errorMessage, progress: 100 });
                toast({
                    variant: 'destructive',
                    title: `Simulation Failed for ${molecule.name} + ${protein.name}`,
                    description: errorMessage,
                });
                 updateOverallProgress();
            } finally {
                if (currentResult) {
                    finalResults.push(currentResult);
                }
            }
        }
        setIsRunning(false);
        setCurrentStep('All simulations complete.');
        setLastRunResults(finalResults);
    };

    const handleSaveResults = async () => {
       if (!user || !firestore) {
            toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "You must be signed in to save results.",
            });
            return;
        }

        const completedResults = lastRunResults.filter(r => r.status === 'complete');
        if (completedResults.length === 0) {
            toast({
                title: "No Results to Save",
                description: "There are no completed simulations to save.",
            });
            return;
        }

        setIsSaving(true);
        const collectionRef = collection(firestore, 'users', user.uid, 'dockingResults');
        let savedCount = 0;

        for (const result of completedResults) {
            const resultToSave = {
                moleculeName: result.molecule.name,
                proteinName: result.protein.name,
                classicalScore: result.classicalScore,
                refinedEnergy: result.refinedEnergy,
                bindingAffinity: result.prediction.bindingAffinity,
                confidenceScore: result.prediction.confidenceScore,
                rationale: result.prediction.rationale,
                pose: result.prediction.pose,
                diseaseImpact: result.prediction.diseaseImpact,
                createdAt: serverTimestamp(),
                userId: user.uid,
            };
            
            // Using non-blocking add
            addDocumentNonBlocking(collectionRef, resultToSave);
            savedCount++;
        }

        toast({
            title: "Results Saved",
            description: `${savedCount} simulation result(s) have been saved to your account.`,
        });
        setIsSaving(false);
    };
    
    if (!hydrated) {
        return (
             <main className="flex min-h-[calc(100vh_-_4rem)] flex-col">
                <div className="mx-auto grid w-full max-w-full flex-1 gap-6 p-4 md:px-6 md:grid-cols-3">
                    <div className="md:col-span-1">
                        <Card className="h-full">
                            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                                <Skeleton className="h-9 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-2">
                         <Card className="h-full">
                            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                            <CardContent className="flex items-center justify-center h-full">
                               <div className="text-center text-muted-foreground">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
                                    <p>Loading dashboard...</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <>
            <main className="flex min-h-[calc(100vh_-_4rem)] flex-col">
                <div className="mx-auto grid w-full max-w-full flex-1 gap-6 p-4 md:px-6 md:grid-cols-3">
                    <div className="md:col-span-1 flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Molecule Viewer</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Molecules</h3>
                                    <Card className="p-4">
                                        {selectedMolecules.length > 0 ? (
                                            <ScrollArea className="h-24">
                                                <ul className="space-y-1 text-sm text-muted-foreground">
                                                    {selectedMolecules.map(m => <li key={m.smiles}>{m.name}</li>)}
                                                </ul>
                                            </ScrollArea>
                                        ) : (
                                            <div className="text-center text-sm text-muted-foreground py-8">
                                                No molecules selected.
                                            </div>
                                        )}
                                    </Card>
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href={`/select-molecule?${proteinQueryString}&${diseaseQueryString}`}>
                                            Molecules selection
                                        </Link>
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Select Diseases</h3>
                                     <Card className="p-4">
                                         {selectedDiseases.size > 0 ? (
                                             <ScrollArea className="h-24">
                                                 <div className="flex flex-wrap gap-2">
                                                     {Array.from(selectedDiseases).map(d => <Badge key={d} variant="secondary">{d}</Badge>)}
                                                 </div>
                                             </ScrollArea>
                                         ) : <div className="text-center text-sm text-muted-foreground py-8">No diseases for suggestions.</div>}
                                     </Card>
                                     <Button asChild={true} variant="outline" size="sm" className="w-full">
                                         <Link href={`/select-disease?${moleculeQueryString}&${proteinQueryString}`}>Disease selection</Link>
                                     </Button>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Protein Targets</h3>
                                    <Card className="p-4">
                                        {selectedProteins.length > 0 ? (
                                            <ScrollArea className="h-24">
                                                <ul className="space-y-1 text-sm text-muted-foreground">
                                                    {selectedProteins.map(p => <li key={p.name}>{p.name}</li>)}
                                                </ul>
                                            </ScrollArea>
                                        ) : (
                                            <div className="text-center text-sm text-muted-foreground py-8">
                                                No proteins selected.
                                            </div>
                                        )}
                                    </Card>
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href={`/select-protein?${moleculeQueryString}&${diseaseQueryString}`}>
                                            Target selection
                                        </Link>
                                    </Button>
                                </div>

                                <Button onClick={runSimulation} disabled={isRunning || selectedMolecules.length === 0 || selectedProteins.length === 0}>
                                    {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Run docking for ({selectedMolecules.length * selectedProteins.length}) combinations
                                </Button>

                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Visualisation</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-start justify-start bg-muted/30 border-dashed -mt-6 rounded-b-lg p-6">
                                {isRunning ? (
                                    <div className="w-full p-6 space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-muted-foreground text-center">{currentStep}</p>
                                            <Progress value={totalProgress} />
                                        </div>
                                        <ScrollArea className="h-[calc(100vh-28rem)]">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {simulationResults.map((result, index) => (
                                                    <Card key={index}>
                                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                            <CardTitle className="text-sm font-medium">{result.molecule.name} + {result.protein.name}</CardTitle>
                                                            {result.status === 'simulating' || result.status === 'analyzing' || result.status === 'preparing' ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            ) : null}
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="flex justify-center my-2">
                                                                <Image src={`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(result.molecule.smiles)}/image?width=100&height=100`} alt={`Structure of ${result.molecule.name}`} width={100} height={100} className="rounded-md bg-white p-2 border" unoptimized />
                                                            </div>
                                                            <div className="text-xs text-muted-foreground capitalize text-center">{result.step}...</div>
                                                            <Progress value={result.progress} className="mt-2 h-2" />
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                ) : lastRunResults.length > 0 ? (
                                    <div className="w-full">
                                        <SimulationResultsDisplay results={lastRunResults} title="Last Simulation Run" onSaveResults={handleSaveResults} isSaving={isSaving} />
                                    </div>
                                ) : selectedMolecules.length > 0 ? (
                                    <div className="w-full">
                                        <CardTitle className="mb-4">Selected Molecules</CardTitle>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {selectedMolecules.map(molecule => (
                                                <Card key={molecule.smiles}>
                                                    <CardHeader>
                                                        <CardTitle className="text-base">{molecule.name}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="flex flex-col items-center gap-2">
                                                        <Image src={`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(molecule.smiles)}/image?width=150&height=150`} alt={`Structure of ${molecule.name}`} width={150} height={150} className="rounded-md bg-white p-2 border" unoptimized />
                                                        <div className="text-left w-full text-xs space-y-1">
                                                            <p><span className="font-semibold">Molecular Formula:</span> <span className="font-mono">{molecule.formula}</span></p>
                                                            <p><span className="font-semibold">Molecular Weight:</span> {molecule.molecularWeight.toFixed(2)} g/mol</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground m-auto">
                                        <p>Select molecules and proteins, then run the simulation.</p>
                                        <p>Results will appear here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Toaster />
        </>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardPage />
        </Suspense>
    )
}
