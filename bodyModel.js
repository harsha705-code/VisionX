/**
 * 3D Holographic Human Body Anatomy & Medical Diagnostic Scanner
 * Upgraded with realistic organic contours, smooth humanoid curves,
 * vascular pulses, realistic organ silhouettes (Brain, Lungs, Heart), and scanning laser.
 */
import * as THREE from 'three';

export class BodyModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'Human_Body_Hologram';
    this.group.visible = false;
    this.scene.add(this.group);

    this.organHotspots = [];
    this.isScanning = true;
    this.scanDirection = 1;
    this.scanHeight = 0;

    this.initMaterials();
    this.buildSculptedHumanBody();
    this.buildVascularSystem();
    this.buildOrganNodes();
    this.buildScanningLaser();
  }

  initMaterials() {
    // Holographic Translucent Skin - Sleek, smooth, and futuristic
    this.skinMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65,
      transmission: 0.3,
      ior: 1.2
    });

    // Wireframe overlay for high-tech medical scan effect
    this.wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });

    // Joint and bone glow
    this.accentMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.3
    });

    // Organ glow materials
    this.organMaterials = {
      brain: new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0xa855f7,
        emissiveIntensity: 0.9,
        roughness: 0.3
      }),
      lungs: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.85,
        roughness: 0.3
      }),
      heart: new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 1.0,
        roughness: 0.25
      }),
      genome: new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.85,
        roughness: 0.3
      })
    };
  }

  buildSculptedHumanBody() {
    this.bodyGroup = new THREE.Group();

    // 1. Organic Head with jawline & chin
    const headCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 12.8, 0),
      new THREE.Vector3(0.9, 12.5, 0.4),
      new THREE.Vector3(1.3, 11.8, 0.2),
      new THREE.Vector3(1.1, 11.0, 0.3),
      new THREE.Vector3(0.7, 10.4, 0.4), // Chin
      new THREE.Vector3(0, 10.3, 0.5)
    ]);
    const headPoints = headCurve.getPoints(16);
    const headPoints2D = headPoints.map(p => new THREE.Vector2(Math.abs(p.x) + 0.1, p.y - 10.3));
    
    // Head mesh using contoured ellipsoid
    const headGeo = new THREE.SphereGeometry(1.4, 32, 24);
    headGeo.scale(0.85, 1.15, 1.0);
    const headMesh = new THREE.Mesh(headGeo, this.skinMat);
    const headWire = new THREE.Mesh(headGeo, this.wireMat);
    headMesh.position.set(0, 11.5, 0);
    headWire.position.set(0, 11.5, 0);
    this.bodyGroup.add(headMesh, headWire);

    // 2. Neck with natural throat contour
    const neckGeo = new THREE.CylinderGeometry(0.65, 0.85, 1.4, 24);
    const neckMesh = new THREE.Mesh(neckGeo, this.skinMat);
    neckMesh.position.set(0, 9.9, 0);
    this.bodyGroup.add(neckMesh);

    // 3. Anatomical Contoured Torso using Lathe (Shoulders -> Chest -> Tapered Waist -> Flared Hips)
    const torsoPoints = [
      new THREE.Vector2(0.9, 9.4),   // Base of neck
      new THREE.Vector2(2.4, 9.0),   // Broad shoulders / Clavicle
      new THREE.Vector2(2.5, 7.8),   // Pectoral chest
      new THREE.Vector2(2.1, 6.2),   // Lower ribcage
      new THREE.Vector2(1.7, 4.6),   // Tapered athletic waist
      new THREE.Vector2(2.1, 2.8),   // Flared anatomical hips
      new THREE.Vector2(1.9, 1.2),   // Pelvis / Groin
      new THREE.Vector2(0.2, 0.8)    // Base
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 32);
    // Flatten Z slightly for natural human chest depth vs width
    torsoGeo.scale(1.0, 1.0, 0.65);
    torsoGeo.computeVertexNormals();

    const torsoMesh = new THREE.Mesh(torsoGeo, this.skinMat);
    const torsoWire = new THREE.Mesh(torsoGeo, this.wireMat);
    this.bodyGroup.add(torsoMesh, torsoWire);

    // 4. Contoured Organic Arms (Deltoid -> Bicep -> Elbow -> Forearm -> Hand)
    [-1, 1].forEach((side) => {
      // Deltoid Shoulder
      const shoulderGeo = new THREE.SphereGeometry(0.85, 20, 20);
      shoulderGeo.scale(0.9, 1.1, 0.9);
      const shoulder = new THREE.Mesh(shoulderGeo, this.skinMat);
      shoulder.position.set(side * 2.55, 8.8, 0);
      this.bodyGroup.add(shoulder);

      // Upper Arm (Bicep/Tricep taper)
      const bicepCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 2.65, 8.6, 0),
        new THREE.Vector3(side * 3.0, 7.0, 0.05),
        new THREE.Vector3(side * 3.15, 5.6, 0)
      ]);
      const bicepGeo = new THREE.TubeGeometry(bicepCurve, 16, 0.52, 16, false);
      const bicepMesh = new THREE.Mesh(bicepGeo, this.skinMat);
      this.bodyGroup.add(bicepMesh);

      // Elbow
      const elbowGeo = new THREE.SphereGeometry(0.48, 16, 16);
      const elbow = new THREE.Mesh(elbowGeo, this.accentMat);
      elbow.position.set(side * 3.15, 5.5, 0);
      this.bodyGroup.add(elbow);

      // Forearm tapering to wrist
      const forearmCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 3.15, 5.4, 0),
        new THREE.Vector3(side * 3.4, 3.8, 0.1),
        new THREE.Vector3(side * 3.5, 2.2, 0.1)
      ]);
      const forearmGeo = new THREE.TubeGeometry(forearmCurve, 16, 0.42, 16, false);
      const forearmMesh = new THREE.Mesh(forearmGeo, this.skinMat);
      this.bodyGroup.add(forearmMesh);

      // Hand
      const handGeo = new THREE.BoxGeometry(0.45, 1.1, 0.7);
      handGeo.translate(0, -0.5, 0);
      const hand = new THREE.Mesh(handGeo, this.skinMat);
      hand.position.set(side * 3.55, 2.1, 0.1);
      hand.rotation.z = side * -0.15;
      this.bodyGroup.add(hand);
    });

    // 5. Contoured Organic Legs (Thigh -> Knee -> Calves -> Ankles -> Feet)
    [-1, 1].forEach((side) => {
      // Upper Thigh
      const thighCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 1.25, 1.2, 0),
        new THREE.Vector3(side * 1.35, -1.8, 0.1),
        new THREE.Vector3(side * 1.3, -4.8, 0)
      ]);
      const thighGeo = new THREE.TubeGeometry(thighCurve, 20, 0.82, 20, false);
      const thighMesh = new THREE.Mesh(thighGeo, this.skinMat);
      const thighWire = new THREE.Mesh(thighGeo, this.wireMat);
      this.bodyGroup.add(thighMesh, thighWire);

      // Knee Joint
      const kneeGeo = new THREE.SphereGeometry(0.68, 20, 20);
      const knee = new THREE.Mesh(kneeGeo, this.accentMat);
      knee.position.set(side * 1.3, -5.0, 0.05);
      this.bodyGroup.add(knee);

      // Calf muscle with natural curve tapering to ankle
      const calfCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 1.3, -5.2, 0.05),
        new THREE.Vector3(side * 1.38, -6.8, -0.1), // Calf belly
        new THREE.Vector3(side * 1.25, -9.2, 0)     // Ankle
      ]);
      const calfGeo = new THREE.TubeGeometry(calfCurve, 20, 0.65, 20, false);
      const calfMesh = new THREE.Mesh(calfGeo, this.skinMat);
      const calfWire = new THREE.Mesh(calfGeo, this.wireMat);
      this.bodyGroup.add(calfMesh, calfWire);

      // Foot
      const footGeo = new THREE.BoxGeometry(0.85, 0.55, 1.8);
      footGeo.translate(0, 0, 0.4);
      const foot = new THREE.Mesh(footGeo, this.skinMat);
      foot.position.set(side * 1.25, -9.6, 0);
      this.bodyGroup.add(foot);
    });

    // Holographic Medical Pedestal with concentric glowing rings
    const platformGeo = new THREE.CylinderGeometry(5.5, 6.2, 0.5, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.8
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -10.2;
    this.bodyGroup.add(platform);

    for (let r = 1; r <= 3; r++) {
      const ringGeo = new THREE.RingGeometry(r * 1.6, r * 1.6 + 0.08, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -9.92 + r * 0.02;
      this.bodyGroup.add(ring);
    }

    this.group.add(this.bodyGroup);
  }

  buildVascularSystem() {
    // Glowing internal arteries & veins pulsing through the body
    this.vascularGroup = new THREE.Group();

    const arteryMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.8 });
    const veinMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });

    // Main Aorta & Vena Cava
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 7.5, 0.1),
      new THREE.Vector3(0.1, 5.0, 0.05),
      new THREE.Vector3(0.3, 3.0, 0),
      new THREE.Vector3(0.7, 1.2, 0)
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 24, 0.14, 8, false);
    const aortaMesh = new THREE.Mesh(aortaGeo, arteryMat);
    this.vascularGroup.add(aortaMesh);

    const venaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 7.5, 0.1),
      new THREE.Vector3(-0.1, 5.0, 0.05),
      new THREE.Vector3(-0.3, 3.0, 0),
      new THREE.Vector3(-0.7, 1.2, 0)
    ]);
    const venaGeo = new THREE.TubeGeometry(venaCurve, 24, 0.14, 8, false);
    const venaMesh = new THREE.Mesh(venaGeo, veinMat);
    this.vascularGroup.add(venaMesh);

    this.group.add(this.vascularGroup);
  }

  buildOrganNodes() {
    this.organsGroup = new THREE.Group();

    // Anatomical Organ Models:
    // 1. Brain (Hemispheres)
    const brainGroup = new THREE.Group();
    brainGroup.position.set(0, 11.6, 0);

    const leftHemiGeo = new THREE.SphereGeometry(0.7, 16, 16);
    leftHemiGeo.scale(0.8, 1.0, 1.2);
    const leftHemi = new THREE.Mesh(leftHemiGeo, this.organMaterials.brain);
    leftHemi.position.set(-0.35, 0, 0);

    const rightHemiGeo = new THREE.SphereGeometry(0.7, 16, 16);
    rightHemiGeo.scale(0.8, 1.0, 1.2);
    const rightHemi = new THREE.Mesh(rightHemiGeo, this.organMaterials.brain);
    rightHemi.position.set(0.35, 0, 0);

    brainGroup.add(leftHemi, rightHemi);
    brainGroup.userData = {
      id: 'huntington',
      name: 'Brain (Nerve & Memory Center)',
      simpleName: 'Brain',
      organ: 'Brain',
      disorderKey: 'huntington',
      description: 'Controls speech, movement, and thinking. Huntingtons disease creates sticky protein clumps here that damage brain cells.'
    };
    leftHemi.userData = brainGroup.userData;
    rightHemi.userData = brainGroup.userData;

    // 2. Lungs (Left & Right Lobes)
    const lungsGroup = new THREE.Group();
    lungsGroup.position.set(0, 7.4, 0.1);

    [-1, 1].forEach((side) => {
      const lungGeo = new THREE.SphereGeometry(0.85, 16, 16);
      lungGeo.scale(0.7, 1.3, 0.7);
      const lungMesh = new THREE.Mesh(lungGeo, this.organMaterials.lungs);
      lungMesh.position.set(side * 0.95, 0, 0);
      lungMesh.userData = {
        id: 'cystic_fibrosis',
        name: 'Lungs & Airways (Breathing Center)',
        simpleName: 'Lungs',
        organ: 'Lungs',
        disorderKey: 'cystic_fibrosis',
        description: 'Brings oxygen into your blood. Cystic Fibrosis causes thick sticky mucus to clog airways, making breathing hard.'
      };
      lungsGroup.add(lungMesh);
      this.organHotspots.push(lungMesh);
    });

    // 3. Heart (Pumping Engine & Red Blood Cells)
    const heartGeo = new THREE.SphereGeometry(0.68, 20, 20);
    heartGeo.scale(1.0, 1.2, 0.9);
    const heartMesh = new THREE.Mesh(heartGeo, this.organMaterials.heart);
    heartMesh.position.set(0.3, 7.1, 0.4);
    heartMesh.userData = {
      id: 'sickle_cell',
      name: 'Heart & Blood Cells (Oxygen Delivery)',
      simpleName: 'Heart / Blood',
      organ: 'Heart & Blood',
      disorderKey: 'sickle_cell',
      description: 'Pumps red blood cells full of oxygen. In Sickle Cell, red blood cells turn stiff like crescent bananas and get stuck in blood vessels.'
    };
    this.heartMesh = heartMesh;

    // 4. Genome / DNA Core (Cell Nucleus inside Pelvis/Abdomen)
    const genomeGeo = new THREE.SphereGeometry(0.75, 20, 20);
    const genomeMesh = new THREE.Mesh(genomeGeo, this.organMaterials.genome);
    genomeMesh.position.set(0, 3.2, 0.3);
    genomeMesh.userData = {
      id: 'down_syndrome',
      name: 'Chromosomes & DNA (Genetic Blueprint)',
      simpleName: 'DNA & Chromosomes',
      organ: 'Cellular Genome',
      disorderKey: 'down_syndrome',
      description: 'Your bodys instruction manual. Down Syndrome happens when cells have an extra 3rd copy of Chromosome 21.'
    };

    // Add pulsing target reticles to all organs
    [brainGroup, lungsGroup, heartMesh, genomeMesh].forEach(obj => {
      const ringGeo = new THREE.RingGeometry(1.2, 1.4, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(obj.position);
      this.organsGroup.add(ring);
    });

    this.organsGroup.add(brainGroup, lungsGroup, heartMesh, genomeMesh);
    this.organHotspots.push(leftHemi, rightHemi, heartMesh, genomeMesh);

    this.group.add(this.organsGroup);
  }

  buildScanningLaser() {
    this.scannerGroup = new THREE.Group();

    const laserRingGeo = new THREE.RingGeometry(4.8, 5.0, 48);
    const laserRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    this.laserRing = new THREE.Mesh(laserRingGeo, laserRingMat);
    this.laserRing.rotation.x = Math.PI / 2;

    const planeGeo = new THREE.PlaneGeometry(9.6, 9.6);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    this.laserPlane = new THREE.Mesh(planeGeo, planeMat);
    this.laserPlane.rotation.x = Math.PI / 2;

    this.scannerGroup.add(this.laserRing);
    this.scannerGroup.add(this.laserPlane);
    this.group.add(this.scannerGroup);
  }

  getClickableHotspots() {
    return this.organHotspots;
  }

  animate(delta) {
    if (!this.group.visible) return;

    // Gentle holographic rotation
    this.bodyGroup.rotation.y += delta * 0.22;

    // Heartbeat pulse animation
    if (this.heartMesh) {
      const beat = 1 + Math.sin(Date.now() * 0.008) * 0.1;
      this.heartMesh.scale.set(beat, beat * 1.1, beat);
    }

    // Laser scanner vertical sweep (from y = -9.5 to y = 13)
    if (this.isScanning) {
      this.scanHeight += this.scanDirection * delta * 6.0;
      if (this.scanHeight > 13) {
        this.scanHeight = 13;
        this.scanDirection = -1;
      } else if (this.scanHeight < -9.5) {
        this.scanHeight = -9.5;
        this.scanDirection = 1;
      }
      this.scannerGroup.position.y = this.scanHeight;
    }
  }
}
