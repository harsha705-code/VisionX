/**
 * Multi-Scale Biological Views Manager
 * Transitions between:
 * 0. Human Body Hologram
 * 0.5. Functional Organ Diagram (Brain neurons, Lung airways, Blood capillaries)
 * 1. Cell Nucleus View
 * 2. 23 Chromosome Karyotype View (with Trisomy 21)
 * 3. DNA Double Helix (Molecular)
 * 4. Blood Cell Impact & Phenotype
 */
import * as THREE from 'three';
import { BodyModel } from './bodyModel.js';
import { OrganDiagramsManager } from './organDiagrams.js';

export class ScaleViewsManager {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;

    // Scale 0: Human Body Hologram
    this.bodyModel = new BodyModel(this.scene);

    // Scale 0.5: 3D Functional Organ Diagrams
    this.organDiagrams = new OrganDiagramsManager(this.scene);

    // Scale 1: Cell Scale
    this.cellGroup = new THREE.Group();
    this.cellGroup.name = 'Cell_Scale_Group';
    this.cellGroup.visible = false;
    this.scene.add(this.cellGroup);

    // Scale 2: Karyotype
    this.karyotypeGroup = new THREE.Group();
    this.karyotypeGroup.name = 'Karyotype_Scale_Group';
    this.karyotypeGroup.visible = false;
    this.scene.add(this.karyotypeGroup);

    // Scale 4: Phenotype
    this.phenotypeGroup = new THREE.Group();
    this.phenotypeGroup.name = 'Phenotype_Scale_Group';
    this.phenotypeGroup.visible = false;
    this.scene.add(this.phenotypeGroup);

    this.currentScale = 'dna';
    this.buildCellModel();
    this.buildKaryotypeModel(false);
    this.buildPhenotype3DModel('wildtype');
  }

  buildCellModel() {
    const cellGeo = new THREE.SphereGeometry(22, 32, 32);
    const cellMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.18,
      roughness: 0.5,
      metalness: 0.2,
      wireframe: true
    });
    const cellMesh = new THREE.Mesh(cellGeo, cellMat);
    this.cellGroup.add(cellMesh);

    const nucleusGeo = new THREE.SphereGeometry(9, 32, 32);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4338ca,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.5
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    this.cellGroup.add(nucleusMesh);

    for (let i = 0; i < 40; i++) {
      const phi = Math.acos(-1 + (2 * i) / 40);
      const theta = Math.sqrt(40 * Math.PI) * phi;
      const r = 9.1;

      const poreGeo = new THREE.TorusGeometry(0.4, 0.1, 8, 16);
      const poreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const pore = new THREE.Mesh(poreGeo, poreMat);

      pore.position.set(
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi)
      );
      pore.lookAt(0, 0, 0);
      this.cellGroup.add(pore);
    }

    const curvePoints = [];
    for (let t = 0; t < 15; t += 0.2) {
      const rad = 2 + t * 0.8;
      curvePoints.push(new THREE.Vector3(
        Math.cos(t * 2) * rad,
        (t - 7) * 1.5,
        Math.sin(t * 2) * rad
      ));
    }
    const chromatinCurve = new THREE.CatmullRomCurve3(curvePoints);
    const chromatinGeo = new THREE.TubeGeometry(chromatinCurve, 64, 0.25, 8, false);
    const chromatinMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.5
    });
    const chromatinMesh = new THREE.Mesh(chromatinGeo, chromatinMat);
    this.cellGroup.add(chromatinMesh);
  }

  buildKaryotypeModel(isTrisomy21 = false) {
    while (this.karyotypeGroup.children.length > 0) {
      const obj = this.karyotypeGroup.children.pop();
      if (obj.geometry) obj.geometry.dispose();
    }

    const cols = 6;
    const spacingX = 4.8;
    const spacingY = 5.2;

    const chrMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x3730a3,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.3
    });

    const highlightMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.7,
      roughness: 0.2
    });

    for (let c = 1; c <= 23; c++) {
      const row = Math.floor((c - 1) / cols);
      const col = (c - 1) % cols;
      const xCenter = (col - (cols - 1) / 2) * spacingX;
      const yCenter = -(row - 1.5) * spacingY;

      const scaleFactor = Math.max(0.45, 1.2 - (c / 23) * 0.65);
      const copies = (c === 21 && isTrisomy21) ? 3 : 2;
      const isDiseaseChromosome = (c === 11 || c === 7 || c === 4 || c === 21);

      for (let k = 0; k < copies; k++) {
        const chrObj = this.createChromosomeMesh(scaleFactor, isDiseaseChromosome ? highlightMat : chrMat);
        const xOffset = (k - (copies - 1) / 2) * 1.0;
        chrObj.position.set(xCenter + xOffset, yCenter, 0);
        this.karyotypeGroup.add(chrObj);
      }
    }
  }

  createChromosomeMesh(scale, material) {
    const group = new THREE.Group();
    const pArmLength = 1.4 * scale;
    const qArmLength = 2.2 * scale;
    const armRadius = 0.26 * scale;

    const centroGeo = new THREE.SphereGeometry(armRadius * 0.85, 12, 12);
    const centroMesh = new THREE.Mesh(centroGeo, material);
    group.add(centroMesh);

    const angles = [-0.25, 0.25, Math.PI - 0.25, Math.PI + 0.25];
    angles.forEach((ang, i) => {
      const length = i < 2 ? pArmLength : qArmLength;
      const armGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.9, length, 12);
      armGeo.translate(0, length / 2, 0);
      const arm = new THREE.Mesh(armGeo, material);
      arm.rotation.z = ang;
      group.add(arm);
    });

    return group;
  }

  buildPhenotype3DModel(disorderId) {
    while (this.phenotypeGroup.children.length > 0) {
      const obj = this.phenotypeGroup.children.pop();
      if (obj.geometry) obj.geometry.dispose();
    }

    const normalGroup = new THREE.Group();
    normalGroup.position.set(-6, 0, 0);

    const discGeo = new THREE.CylinderGeometry(3.5, 3.5, 1.2, 32);
    const rbcMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      emissive: 0x881337,
      emissiveIntensity: 0.4,
      roughness: 0.35,
      metalness: 0.1
    });
    const normalRBC = new THREE.Mesh(discGeo, rbcMat);
    normalRBC.scale.set(1, 0.4, 1);
    normalGroup.add(normalRBC);
    this.phenotypeGroup.add(normalGroup);

    const mutantGroup = new THREE.Group();
    mutantGroup.position.set(6, 0, 0);
    this.mutantCellGroup = mutantGroup;

    const sickleGeo = new THREE.TorusGeometry(3.2, 0.9, 16, 32, Math.PI * 1.1);
    const mutantMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });
    this.sickleCellMesh = new THREE.Mesh(sickleGeo, mutantMat);
    this.sickleCellMesh.rotation.z = Math.PI * 0.4;
    mutantGroup.add(this.sickleCellMesh);

    this.phenotypeGroup.add(mutantGroup);
  }

  morphMutantToCured() {
    if (!this.mutantCellGroup || !this.sickleCellMesh) return;
    const startTime = performance.now();
    const duration = 1800;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress * progress * (3 - 2 * progress);

      this.sickleCellMesh.rotation.z = THREE.MathUtils.lerp(Math.PI * 0.4, 0, ease);
      this.sickleCellMesh.scale.set(
        THREE.MathUtils.lerp(1.0, 0.8, ease),
        THREE.MathUtils.lerp(1.0, 0.4, ease),
        THREE.MathUtils.lerp(1.0, 0.8, ease)
      );

      this.sickleCellMesh.material.color.setHex(0xbe123c);
      this.sickleCellMesh.material.emissive.setHex(0x881337);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  /**
   * Smoothly zooms directly into a specific organ on the human body!
   */
  zoomToOrganOnBody(organKey, onComplete) {
    this.setScale('body', null, organKey);

    let targetCam = new THREE.Vector3(0, 2, 28);
    let targetLook = new THREE.Vector3(0, 2, 0);

    if (organKey === 'huntington' || organKey === 'brain') {
      targetCam = new THREE.Vector3(0, 11.6, 5.2);
      targetLook = new THREE.Vector3(0, 11.6, 0);
    } else if (organKey === 'cystic_fibrosis' || organKey === 'lungs') {
      targetCam = new THREE.Vector3(0, 7.4, 6.0);
      targetLook = new THREE.Vector3(0, 7.4, 0);
    } else if (organKey === 'sickle_cell' || organKey === 'heart' || organKey === 'blood') {
      targetCam = new THREE.Vector3(0.4, 7.1, 5.2);
      targetLook = new THREE.Vector3(0.4, 7.1, 0);
    } else if (organKey === 'down_syndrome' || organKey === 'genome') {
      targetCam = new THREE.Vector3(0, 3.2, 5.2);
      targetLook = new THREE.Vector3(0, 3.2, 0);
    }

    this.animateCameraTo(targetCam, targetLook, 1200, onComplete);
  }

  setScale(scaleName, dnaModelGroup, disorderKey = 'wildtype') {
    this.currentScale = scaleName;

    // Reset visibility
    this.bodyModel.group.visible = (scaleName === 'body');
    this.cellGroup.visible = (scaleName === 'cell');
    this.karyotypeGroup.visible = (scaleName === 'karyotype');
    this.phenotypeGroup.visible = (scaleName === 'phenotype');
    if (dnaModelGroup) dnaModelGroup.visible = (scaleName === 'dna');

    // Handle Functional Organ Diagrams
    if (scaleName === 'organ_diagram') {
      this.bodyModel.group.visible = false;
      this.organDiagrams.showOrgan(disorderKey);
      this.animateCameraTo(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, 0));
    } else {
      this.organDiagrams.hide();
    }

    if (scaleName === 'body') {
      this.animateCameraTo(new THREE.Vector3(0, 2, 28), new THREE.Vector3(0, 2, 0));
    } else if (scaleName === 'karyotype') {
      const isTrisomy = (disorderKey === 'down_syndrome');
      this.buildKaryotypeModel(isTrisomy);
      this.animateCameraTo(new THREE.Vector3(0, 0, 32), new THREE.Vector3(0, 0, 0));
    } else if (scaleName === 'cell') {
      this.animateCameraTo(new THREE.Vector3(0, 0, 48), new THREE.Vector3(0, 0, 0));
    } else if (scaleName === 'phenotype') {
      this.buildPhenotype3DModel(disorderKey);
      this.animateCameraTo(new THREE.Vector3(0, 0, 22), new THREE.Vector3(0, 0, 0));
    } else if (scaleName === 'dna') {
      this.animateCameraTo(new THREE.Vector3(0, 0, 26), new THREE.Vector3(0, 0, 0));
    }
  }

  animateCameraTo(targetPos, targetLookAt, duration = 1200, onComplete = null) {
    const startPos = this.camera.position.clone();
    const startTime = performance.now();

    const animateStep = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(startPos, targetPos, ease);
      this.controls.target.lerp(targetLookAt, ease);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      } else {
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(animateStep);
  }

  animate(delta) {
    if (this.bodyModel) {
      this.bodyModel.animate(delta);
    }
    if (this.organDiagrams) {
      this.organDiagrams.animate(delta);
    }
    if (this.cellGroup.visible) {
      this.cellGroup.rotation.y += delta * 0.15;
    }
    if (this.phenotypeGroup.visible) {
      this.phenotypeGroup.children.forEach((cell, idx) => {
        cell.rotation.y += delta * 0.4 * (idx % 2 === 0 ? 1 : -1);
      });
    }
  }
}
