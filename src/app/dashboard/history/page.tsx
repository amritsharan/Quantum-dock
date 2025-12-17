
'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Inbox } from 'lucide-react';

const getAffinityLevel = (affinity: number): { level: 'High' | 'Moderate' | 'Low', className: string } => {
    if (affinity < 10) return { level: 'High', className: 'bg-green-500 hover:bg-green-500/80' };
    if (affinity <= 100) return { level: 'Moderate', className: 'bg-yellow-500 hover:bg-yellow-500/80' };
    return { level: 'Low', className: 'bg-red-500 hover:bg-red-500/80' };
};

function HistoryPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center p-2">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-60" />
                            </div>
                            <div className="space-y-2 text-right">
                                <Skeleton className="h-5 w-24 ml-auto" />
                                <Skeleton className="h-4 w-16 ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function HistoryPage() {
    const { firestore, user } = useFirebase();

    const historyQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'dockingResults'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: results, isLoading, error } = useCollection<any>(historyQuery);

    const formattedResults = useMemo(() => {
        return results?.map(r => ({
            ...r,
            createdAt: r.createdAt?.toDate ? formatDistanceToNow(r.createdAt.toDate(), { addSuffix: true }) : 'Just now',
            affinityInfo: getAffinityLevel(r.bindingAffinity)
        }));
    }, [results]);

    return (
        <main className="flex-1 p-4 md:p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Simulation History</CardTitle>
                    <CardDescription>
                        Browse and review your past docking simulation results.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && <HistoryPageSkeleton />}
                    
                    {error && (
                         <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading History</AlertTitle>
                            <AlertDescription>
                                Could not load simulation history. Please check your connection or try again later.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !error && formattedResults && formattedResults.length > 0 && (
                         <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Combination</TableHead>
                                        <TableHead>Binding Affinity (nM)</TableHead>
                                        <TableHead>Confidence</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Saved</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formattedResults.map((result) => (
                                        <TableRow key={result.id}>
                                            <TableCell className="font-medium">
                                                <div>{result.moleculeName}</div>
                                                <div className="text-xs text-muted-foreground">+ {result.proteinName}</div>
                                            </TableCell>
                                            <TableCell className="font-semibold">{result.bindingAffinity.toFixed(2)}</TableCell>
                                            <TableCell>{Math.round(result.confidenceScore * 100)}%</TableCell>
                                            <TableCell>
                                                <Badge variant="default" className={result.affinityInfo.className}>
                                                    {result.affinityInfo.level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{result.createdAt}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                    )}
                    
                     {!isLoading && !error && (!formattedResults || formattedResults.length === 0) && (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-dashed border-2 rounded-lg p-12">
                            <Inbox className="h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No History Yet</h3>
                            <p className="mt-1 text-sm">Run a simulation and save the results to see them here.</p>
                        </div>
                     )}

                </CardContent>
            </Card>
        </main>
    );
}
