
'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { QuantumDockLogo } from '@/components/quantum-dock/logo';
import { Skeleton } from '@/components/ui/skeleton';

const diseaseOptions = [
  "Alzheimer's Disease", "Amyotrophic Lateral Sclerosis (ALS)", "Ankylosing Spondylitis", "Asthma",
  "Atrial Fibrillation", "Autism Spectrum Disorder", "Bipolar Disorder", "Breast Cancer", "Chronic Kidney Disease",
  "Chronic Obstructive Pulmonary Disease (COPD)", "Colorectal Cancer", "Coronary Artery Disease", "Crohn's Disease",
  "Cystic Fibrosis", "Dementia", "Depression", "Diabetes (Type 1)", "Diabetes (Type 2)", "Eczema (Atopic Dermatitis)",
  "Endometriosis", "Epilepsy", "Fibromyalgia", "Glioblastoma", "Gout", "Graves' Disease", "Hashimoto's Thyroiditis",
  "Heart Failure", "Hepatitis C", "HIV/AIDS", "Huntington's Disease", "Hypertension", "Influenza", "Leukemia",
  "Liver Cancer", "Lung Cancer", "Lupus (Systemic Lupus Erythematosus)", "Lymphoma", "Macular Degeneration",
  "Malaria", "Melanoma", "Multiple Sclerosis", "Myocardial Infarction", "Obsessive-Compulsive Disorder (OCD)",
  "Osteoarthritis", "Osteoporosis", "Ovarian Cancer", "Pancreatic Cancer", "Parkinson's Disease",
  "Post-Traumatic Stress Disorder (PTSD)", "Prostate Cancer", "Psoriasis", "Rheumatoid Arthritis", "Schizophrenia",
  "Sickle Cell Anemia", "Skin Cancer", "Stomach Cancer", "Stroke", "Tuberculosis", "Ulcerative Colitis"
];

const ITEMS_PER_PAGE = 10;

function SelectDiseaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiseases, setSelectedDiseases] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const diseasesParam = searchParams.get('diseases');
    if (diseasesParam) {
        try {
            setSelectedDiseases(new Set(JSON.parse(diseasesParam)));
        } catch {
            setSelectedDiseases(new Set());
        }
    }
    setHydrated(true);
  }, [searchParams]);

  const filteredDiseases = useMemo(() => {
    if (!searchTerm) {
      return diseaseOptions;
    }
    return diseaseOptions.filter(
      (d) => d.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredDiseases.length / ITEMS_PER_PAGE);
  const paginatedDiseases = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDiseases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDiseases, currentPage]);

  const handleSelect = (disease: string, checked: boolean | 'indeterminate') => {
    const newSet = new Set(selectedDiseases);
    if (checked) {
      newSet.add(disease);
    } else {
      newSet.delete(disease);
    }
    setSelectedDiseases(newSet);
  };

  const handleSelectAllOnPage = (checked: boolean | 'indeterminate') => {
      const newSet = new Set(selectedDiseases);
      paginatedDiseases.forEach(d => {
          if (checked) {
              newSet.add(d);
          } else {
              newSet.delete(d);
          }
      });
      setSelectedDiseases(newSet);
  };

  const isAllOnPageSelected = paginatedDiseases.length > 0 && paginatedDiseases.every(d => selectedDiseases.has(d));
  
  const buildQueryString = () => {
    const params = new URLSearchParams(searchParams.toString());
    const diseasesArray = Array.from(selectedDiseases);
    if (diseasesArray.length > 0) {
      params.set('diseases', JSON.stringify(diseasesArray));
    } else {
      params.delete('diseases');
    }
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
          <CardTitle>Select Diseases</CardTitle>
          <CardDescription>
            Search and select one or more diseases to generate protein target suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Search by disease name..."
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
                    <TableHead>Disease Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDiseases.map((disease) => (
                    <TableRow key={disease}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDiseases.has(disease)}
                          onCheckedChange={(checked) => handleSelect(disease, checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{disease}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Selected {selectedDiseases.size} disease(s).
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
              Confirm Selection ({selectedDiseases.size})
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

export default function SelectDiseasePage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <SelectDiseaseContent />
        </Suspense>
    )
}
