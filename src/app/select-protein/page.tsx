
'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { QuantumDockLogo } from '@/components/quantum-dock/logo';
import { proteins as proteinOptions } from '@/lib/proteins';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

function SelectProteinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProteins, setSelectedProteins] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const proteinsParam = searchParams.get('proteins');
    let initialProteins = new Set<string>();
    if (proteinsParam) {
        try {
            initialProteins = new Set(JSON.parse(proteinsParam));
        } catch {
            // keep it empty
        }
    } else {
        const proteinParam = searchParams.get('protein'); // Legacy support
        if (proteinParam) {
            initialProteins.add(proteinParam);
        }
    }
    setSelectedProteins(initialProteins);
    setHydrated(true);
  }, [searchParams]);

  const filteredProteins = useMemo(() => {
    if (!searchTerm) {
      return proteinOptions;
    }
    return proteinOptions.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredProteins.length / ITEMS_PER_PAGE);
  const paginatedProteins = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProteins.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProteins, currentPage]);
  
  const handleSelect = (proteinName: string, checked: boolean | 'indeterminate') => {
    const newSet = new Set(selectedProteins);
    if (checked) {
      newSet.add(proteinName);
    } else {
      newSet.delete(proteinName);
    }
    setSelectedProteins(newSet);
  };
  
    const handleSelectAllOnPage = (checked: boolean | 'indeterminate') => {
      const newSet = new Set(selectedProteins);
      paginatedProteins.forEach(p => {
          if (checked) {
              newSet.add(p.name);
          } else {
              newSet.delete(p.name);
          }
      });
      setSelectedProteins(newSet);
  };

  const isAllOnPageSelected = paginatedProteins.length > 0 && paginatedProteins.every(d => selectedProteins.has(d.name));


  const buildQueryString = () => {
    const params = new URLSearchParams(searchParams.toString());
    const proteinsArray = Array.from(selectedProteins);
    if (proteinsArray.length > 0) {
      params.set('proteins', JSON.stringify(proteinsArray));
    } else {
      params.delete('proteins');
    }
    // Delete old single-protein param if it exists
    params.delete('protein');
    return params.toString();
  };

  const handleConfirm = () => {
    const queryString = buildQueryString();
    router.push(`/dashboard?${queryString}`);
  };

  const backLink = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    // On "back", we don't change the parameters
    return `/dashboard?${params.toString()}`;
  }, [searchParams]);

  if (!hydrated) {
      return <LoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <QuantumDockLogo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">QuantumDock</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={backLink}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Simulation
          </Link>
        </Button>
      </header>
      <main className="flex flex-1 justify-center p-4 md:p-6">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Select Protein Targets</CardTitle>
            <CardDescription>
              Search and select one or more proteins for the docking simulation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <ScrollArea className="h-[50vh] rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                         <TableHead className="w-[50px]">
                            <Checkbox 
                                checked={isAllOnPageSelected}
                                onCheckedChange={handleSelectAllOnPage}
                                aria-label="Select all on page"
                            />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProteins.map((protein) => (
                        <TableRow key={protein.name}>
                           <TableCell>
                                <Checkbox
                                checked={selectedProteins.has(protein.name)}
                                onCheckedChange={(checked) => handleSelect(protein.name, checked)}
                                id={protein.name}
                                />
                          </TableCell>
                          <TableCell>
                            <Label htmlFor={protein.name} className="font-medium cursor-pointer">{protein.name}</Label>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{protein.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </ScrollArea>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Selected {selectedProteins.size} protein(s).
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <Button onClick={handleConfirm}>
                Confirm Selection ({selectedProteins.size})
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="flex min-h-screen w-full flex-col bg-background">
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-7 w-40" />
      </div>
      <Skeleton className="h-9 w-44" />
    </header>
    <main className="flex flex-1 justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-[70vh] w-full" />
      </div>
    </main>
  </div>
);


export default function SelectProteinPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <SelectProteinContent />
        </Suspense>
    )
}
