# 🧬 GENOME VR: Human Body Anatomy, DNA & Precision Cure 3D Explorer

An interactive 3D and WebXR Virtual Reality web application that takes users on a cinematic journey from the macroscopic human body to microscopic DNA, identifies genetic diseases, and demonstrates how modern precision medicine (CRISPR-Cas9 gene editing, AAV viral vectors, and antisense oligonucleotides) cures them.

---

## 🌟 The Complete Medical Workflow

```
[Scale 0: Human Body Hologram]
       │
       ▼ (Medical Scanner sweeps & selects organ hotspot: Brain, Lungs, Heart/Blood, Genome)
[Scale 1: Organ & Cell Nucleus]
       │
       ▼ (Cinematic Dive & Chromatin Unfurling)
[Scale 2: 23 Chromosome Karyotype]
       │
       ▼ (Locates Pathogenic Gene Locus: HBB, CFTR, HTT, Trisomy 21)
[Scale 3: Molecular DNA Double Helix]
       │
       ▼ (Identifies Point Mutations, Deletions, & Triplet Repeats)
[Scale 4: Pathological Cellular Impact]
       │
       ▼ (User activates "ADMINISTER CRISPR-CAS9 CURE")
[Molecular Repair & Cellular Phenotype Recovery]
  - 3D Cas9 molecular scissors and gRNA complex flies into DNA
  - Double-strand break and Homology-Directed Repair (HDR)
  - Mutant sequence restored to Wild-Type (e.g. GTG -> GAG)
  - Diseased cells (Sickle Erythrocytes) morph into healthy biconcave discs!
```

---

## 🚀 Key Features

1. **3D Holographic Human Body Anatomy & Scanner (`js/bodyModel.js`)**:
   - Futuristic humanoid wireframe and bioluminescent inner core.
   - Animated vertical medical scanning laser beam.
   - Interactive clickable organ targets:
     - 🧠 **Brain / CNS**: Huntington's Disease ($HTT$ locus on Chromosome 4)
     - 🫁 **Lungs / Epithelium**: Cystic Fibrosis ($CFTR$ locus on Chromosome 7)
     - ❤️ **Heart / Circulatory System**: Sickle Cell Anemia ($HBB$ locus on Chromosome 11)
     - 🧬 **Cellular Genome**: Down Syndrome (Trisomy 21)

2. **Procedural 3D B-DNA Double Helix (`js/dnaModel.js`)**:
   - Geometrically accurate B-DNA with 10.5 base pairs per helical turn.
   - Bioluminescent color-coded nucleotides:
     - 🟨 **Adenine (A)** &bull; Amber Glow (`#f59e0b`) &bull; 2 H-Bonds
     - 🟦 **Thymine (T)** &bull; Cyan Glow (`#06b6d4`) &bull; 2 H-Bonds
     - 🟩 **Cytosine (C)** &bull; Emerald Glow (`#10b981`) &bull; 3 H-Bonds
     - 🟥 **Guanine (G)** &bull; Coral Glow (`#f43f5e`) &bull; 3 H-Bonds
   - Central hydrogen bond bridges with raycasting hover inspection.

3. **Gene Therapy & CRISPR-Cas9 Precision Cure Engine (`js/cureEngine.js`)**:
   - **Sickle Cell Anemia Cure**: Models FDA-approved *Casgevy* (Exa-cel). Guide RNA targets codon 6 of $HBB$; Cas9 endonuclease introduces a double-strand break; donor template executes Homology-Directed Repair (HDR) rewriting $GTG$ back to $GAG$ (Valine back to Glutamic Acid).
   - **Cystic Fibrosis Cure**: Inhaled AAV vector delivering functional CFTR cDNA + *Trikafta* (Elexacaftor/Tezacaftor/Ivacaftor) molecular chaperones rescuing epithelial chloride secretion.
   - **Huntington's Disease Cure**: Intrathecal Antisense Oligonucleotide (*Tominersen*) targeting $CAG$ repeat transcripts for RNase H degradation.
   - **Down Syndrome Therapy**: Targeted *XIST* non-coding RNA chromosome dosage compensation.

4. **Interactive 3D Molecular Scissors Animation**:
   - Clicking **"ADMINISTER CRISPR CURE"** spawns the 3D Cas9 ribonucleoprotein complex.
   - Laser cleavage sparks, sequence repair, and a golden healing particle burst.
   - Mutated red blood cells morph smoothly from rigid sickle crescents back into healthy biconcave discs!

5. **Multi-Scale Biological Navigation (`js/scaleViews.js`)**:
   - **Scale 0**: Human Body Hologram
   - **Scale 1**: Cell Nucleus & Nuclear Pores
   - **Scale 2**: 23 Chromosomes (Karyotype)
   - **Scale 3**: Molecular Double Helix
   - **Scale 4**: Cellular Impact & Cure Recovery

6. **WebXR VR & Procedural Audio (`js/audio.js`)**:
   - One-click **ENTER VR** button for Meta Quest, HTC Vive, Apple Vision Pro.
   - 6DoF VR hand controllers with laser pointer raycasting for scanning organs and editing DNA.
   - Procedural Web Audio API sound synthesizer: ambient drone, medical scanner sweeps, CRISPR laser snips, and curative fanfare chords.

---

## ⚡ Quick Start (Zero Dependencies)

Runs directly on Windows without Node.js or Python:

1. Open PowerShell in the project directory:
   ```powershell
   cd C:\Users\harsh\.gemini\antigravity-ide\scratch\vr-dna-disorder-explorer
   ```

2. Start the local HTTP server:
   ```powershell
   .\serve.ps1
   ```

3. Open your browser:
   ```
   http://localhost:8080/
   ```

---

## 🎮 Controls

| Action | Key / Gesture |
| :--- | :--- |
| **Rotate Scene / Body** | Left-Click + Drag |
| **Zoom In / Out** | Mouse Wheel / Pinch |
| **Switch Biological Scales (0-4)** | Keys `0`, `1`, `2`, `3`, `4` or Top Scale Bar |
| **Scan Organ Hotspot** | Click glowing organ nodes (Brain, Lungs, Heart, Genome) |
| **Administer CRISPR Cure** | Click **"ADMINISTER CRISPR-CAS9 CURE"** button |
| **Play / Pause Rotation** | `Spacebar` |
| **Toggle Medical Audio** | `M` Key |
| **Reset Camera** | `R` Key |
| **Enter VR Mode** | Click **ENTER VR** button in WebXR headset |
