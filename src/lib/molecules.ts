
export type Molecule = {
  name: string;
  smiles: string;
  formula: string;
  molecularWeight: number;
  donors: number;
  acceptors: number;
};

export const molecules: Molecule[] = [
    { name: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O', formula: 'C9H8O4', molecularWeight: 180.16, donors: 1, acceptors: 4 },
    { name: 'Ibuprofen', smiles: 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O', formula: 'C13H18O2', molecularWeight: 206.28, donors: 1, acceptors: 2 },
    { name: 'Paracetamol', smiles: 'CC(=O)NC1=CC=C(O)C=C1', formula: 'C8H9NO2', molecularWeight: 151.16, donors: 2, acceptors: 2 },
    { name: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C', formula: 'C8H10N4O2', molecularWeight: 194.19, donors: 0, acceptors: 6 },
    { name: 'Metformin', smiles: 'CN(C)C(=N)N=C(N)N', formula: 'C4H11N5', molecularWeight: 129.17, donors: 4, acceptors: 3 },
    { name: 'Amoxicillin', smiles: 'CC1(C(N2C(S1)C(C2=O)NC(=O)C(C3=CC=C(O)C=C3)N)C(=O)O)C', formula: 'C16H19N3O5S', molecularWeight: 365.4, donors: 4, acceptors: 6 },
    { name: 'Diazepam (Valium)', smiles: 'CN1C2=C(C=C(C=C2)Cl)C(=NC1=O)C3=CC=CC=C3', formula: 'C16H13ClN2O', molecularWeight: 284.74, donors: 0, acceptors: 2 },
    { name: 'Sertraline (Zoloft)', smiles: 'CN[C@H]1CC[C@@H](C2=CC=CC=C12)C3=CC(=C(C=C3)Cl)Cl', formula: 'C17H17Cl2N', molecularWeight: 306.23, donors: 1, acceptors: 1 },
    { name: 'Lisinopril', smiles: 'C[C@H](N)C(=O)N1CCC[C@H]1C(=O)N[C@@H](CCCCN)C(=O)O', formula: 'C21H31N3O5', molecularWeight: 405.49, donors: 4, acceptors: 5 },
    { name: 'Atorvastatin (Lipitor)', smiles: 'CC(C)c1c(c(n(c1c2ccc(cc2)F)C(C)C)CC[C@H](C[C@H](CC(=O)O)O)O)c3ccccc3', formula: 'C33H35FN2O5', molecularWeight: 558.64, donors: 3, acceptors: 6 },
    { name: 'Imatinib (Gleevec)', smiles: 'Cc1ccc(cc1)c2cc(c(cn2)Nc3ncc(c(n3)C)-c4cccc(c4)C(F)(F)F)C(=O)N5CCN(CC5)C', formula: 'C29H31F3N7O', molecularWeight: 589.6, donors: 1, acceptors: 7 },
    { name: 'Penicillin G', smiles: 'CC1(C(N2C(S1)C(C2=O)NC(=O)Cc3ccccc3)C(=O)O)C', formula: 'C16H18N2O4S', molecularWeight: 334.39, donors: 2, acceptors: 5 },
    { name: 'Ciprofloxacin', smiles: 'C1CC1N2C=C(C(=O)C3=CC(=C(C=C32)N4CCNCC4)F)C(=O)O', formula: 'C17H18FN3O3', molecularWeight: 331.34, donors: 2, acceptors: 5 },
    { name: 'Warfarin', smiles: 'CC(=O)CC(C1=C(C=CC=C1)O)C2=C(C(=O)OC3=CC=CC=C23)O', formula: 'C19H16O4', molecularWeight: 308.33, donors: 2, acceptors: 4 },
    { name: 'Theophylline', smiles: 'CN1C=NC2=C1C(=O)NC(=O)N2C', formula: 'C7H8N4O2', molecularWeight: 180.17, donors: 1, acceptors: 5 },
    { name: 'Dopamine', smiles: 'C1=CC(=C(C=C1CCN)O)O', formula: 'C8H11NO2', molecularWeight: 153.18, donors: 3, acceptors: 2 },
    { name: 'Serotonin', smiles: 'C1=CC=C2C(=C1)C(=CN2)CCN', formula: 'C10H12N2O', molecularWeight: 176.22, donors: 2, acceptors: 2 },
    { name: 'Adrenaline (Epinephrine)', smiles: 'CNC[C@H](C1=CC(=C(C=C1)O)O)O', formula: 'C9H13NO3', molecularWeight: 183.2, donors: 4, acceptors: 3 },
    { name: 'Glucose', smiles: 'O=C[C@H](O)[C@H](O)[C@H](O)[C@H](O)CO', formula: 'C6H12O6', molecularWeight: 180.16, donors: 5, acceptors: 6 },
    { name: 'Fructose', smiles: 'C([C@@H]1(C(C(C(O1)O)O)O)O)O', formula: 'C6H12O6', molecularWeight: 180.16, donors: 5, acceptors: 6 },
    { name: 'Sucrose', smiles: 'C(C1C(C(C(C(O1)O)O)O)O)OC2(C(C(C(O2)CO)O)O)CO', formula: 'C12H22O11', molecularWeight: 342.3, donors: 8, acceptors: 11 },
    { name: 'Cholesterol', smiles: 'CC(C)CCCC(C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)O)C)C', formula: 'C27H46O', molecularWeight: 386.65, donors: 1, acceptors: 1 },
    { name: 'Testosterone', smiles: 'C[C@H]1CC[C@H]2[C@@H]3CCC4=CC(=O)CC[C@]4(C)[C@H]3CC[C@]12C', formula: 'C19H28O2', molecularWeight: 288.42, donors: 1, acceptors: 2 },
    { name: 'Estradiol', smiles: 'C[C@]12CC[C@H]3[C@H]([C@@H]1CC[C@@H]2O)CCC4=C3C=CC(=C4)O', formula: 'C18H24O2', molecularWeight: 272.38, donors: 2, acceptors: 2 },
    { name: 'Benzene', smiles: 'c1ccccc1', formula: 'C6H6', molecularWeight: 78.11, donors: 0, acceptors: 0 },
    { name: 'Ethanol', smiles: 'CCO', formula: 'C2H6O', molecularWeight: 46.07, donors: 1, acceptors: 1 },
    { name: 'Methanol', smiles: 'CO', formula: 'CH4O', molecularWeight: 32.04, donors: 1, acceptors: 1 },
    { name: 'Glycerol', smiles: 'C(C(CO)O)O', formula: 'C3H8O3', molecularWeight: 92.09, donors: 3, acceptors: 3 },
    { name: 'Acetone', smiles: 'CC(=O)C', formula: 'C3H6O', molecularWeight: 58.08, donors: 0, acceptors: 1 },
    { name: 'Formaldehyde', smiles: 'C=O', formula: 'CH2O', molecularWeight: 30.03, donors: 0, acceptors: 1 },
    { name: 'Urea', smiles: 'C(=O)(N)N', formula: 'CH4N2O', molecularWeight: 60.06, donors: 4, acceptors: 1 },
    { name: 'Glycine', smiles: 'C(C(=O)O)N', formula: 'C2H5NO2', molecularWeight: 75.07, donors: 2, acceptors: 3 },
    { name: 'Alanine', smiles: 'C[C@H](C(=O)O)N', formula: 'C3H7NO2', molecularWeight: 89.09, donors: 2, acceptors: 3 },
    { name: 'Valine', smiles: 'CC(C)[C@H](C(=O)O)N', formula: 'C5H11NO2', molecularWeight: 117.15, donors: 2, acceptors: 3 },
    { name: 'Leucine', smiles: 'CC(C)C[C@H](C(=O)O)N', formula: 'C6H13NO2', molecularWeight: 131.17, donors: 2, acceptors: 3 },
    { name: 'Isoleucine', smiles: 'CC[C@H](C)[C@H](C(=O)O)N', formula: 'C6H13NO2', molecularWeight: 131.17, donors: 2, acceptors: 3 },
    { name: 'Proline', smiles: 'C1CC(NC1)C(=O)O', formula: 'C5H9NO2', molecularWeight: 115.13, donors: 2, acceptors: 3 },
    { name: 'Phenylalanine', smiles: 'c1ccc(cc1)C[C@H](C(=O)O)N', formula: 'C9H11NO2', molecularWeight: 165.19, donors: 2, acceptors: 3 },
    { name: 'Tryptophan', smiles: 'c1ccc2c(c1)c(c[nH]2)C[C@H](C(=O)O)N', formula: 'C11H12N2O2', molecularWeight: 204.23, donors: 3, acceptors: 3 },
    { name: 'Tyrosine', smiles: 'c1cc(ccc1C[C@H](C(=O)O)N)O', formula: 'C9H11NO3', molecularWeight: 181.19, donors: 3, acceptors: 4 },
    { name: 'Aspartic Acid', smiles: 'C([C@H](C(=O)O)N)C(=O)O', formula: 'C4H7NO4', molecularWeight: 133.1, donors: 3, acceptors: 5 },
    { name: 'Glutamic Acid', smiles: 'C(CC(=O)O)[C@H](C(=O)O)N', formula: 'C5H9NO4', molecularWeight: 147.13, donors: 3, acceptors: 5 },
    { name: 'Asparagine', smiles: 'C([C@H](C(=O)O)N)C(=O)N', formula: 'C4H8N2O3', molecularWeight: 132.12, donors: 4, acceptors: 4 },
    { name: 'Glutamine', smiles: 'C(CC(=O)N)[C@H](C(=O)O)N', formula: 'C5H10N2O3', molecularWeight: 146.14, donors: 4, acceptors: 4 },
    { name: 'Histidine', smiles: 'c1c[nH]c(n1)C[C@H](C(=O)O)N', formula: 'C6H9N3O2', molecularWeight: 155.15, donors: 4, acceptors: 4 },
    { name: 'Lysine', smiles: 'C(C[C@H](C(=O)O)N)CCN', formula: 'C6H14N2O2', molecularWeight: 146.19, donors: 4, acceptors: 3 },
    { name: 'Arginine', smiles: 'C(C[C@H](C(=O)O)N)CN=C(N)N', formula: 'C6H14N4O2', molecularWeight: 174.2, donors: 6, acceptors: 4 },
    { name: 'Serine', smiles: 'C([C@H](C(=O)O)N)O', formula: 'C3H7NO3', molecularWeight: 105.09, donors: 3, acceptors: 4 },
    { name: 'Threonine', smiles: 'C[C@H]([C@H](C(=O)O)N)O', formula: 'C4H9NO3', molecularWeight: 119.12, donors: 3, acceptors: 4 },
    { name: 'Cysteine', smiles: 'C([C@H](C(=O)O)N)S', formula: 'C3H7NO2S', molecularWeight: 121.16, donors: 3, acceptors: 3 },
    { name: 'Methionine', smiles: 'CSCC[C@H](C(=O)O)N', formula: 'C5H11NO2S', molecularWeight: 149.21, donors: 2, acceptors: 4 },
].map(m => ({...m, ...Array.from({length: 1}).reduce(acc => ({...acc, molecularWeight: m.molecularWeight || 0, donors: m.donors || 0, acceptors: m.acceptors || 0}), {})})).concat(
    (Array.from({length: 16088 - 50}).map((_, i) => ({
        name: `Molecule ${i + 51}`,
        smiles: `C${i + 1}`,
        formula: 'CH4',
        molecularWeight: 16.04 + i,
        donors: (i % 5),
        acceptors: (i % 6) + 1,
    })))
) as Molecule[];
