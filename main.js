/**
 * GENOME VR - Main Orchestrator & Application Entry Point
 * Implements the 4-Step Animated Cure Story:
 * Step 1: Human Body Zoom
 * Step 2: Inside the Organ (3D Functional Diagram)
 * Step 3: DNA Unwinding & Replication (Spotting the Typo)
 * Step 4: CRISPR-Cas9 Molecular Scissors Cure & Healing
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

import { DNAModel } from './dnaModel.js';
import { ScaleViewsManager } from './scaleViews.js';
import { CrisprVisualEffect, CURE_DATABASE } from './cureEngine.js';
import { soundEngine } from './audio.js';
import {
  DISORDERS_DB,
  CODON_TABLE,
  BASE_METADATA,
  translateSequence,
  COMPLEMENTS
} from './disorderEngine.js';

class GenomeApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.currentDisorderKey = 'sickle_cell';
    this.currentSequence = [...DISORDERS_DB.sickle_cell.sequence];
    this.selectedBaseIndex = 19;
    this.isRotating = true;
    this.rotationSpeed = 1.0;
    this.isUnwound = false;
    this.currentStoryStep = 1;
    this.isAutoPlaying = false;

    this.initScene();
    this.initLights();
    this.initVR();
    this.initModels();
    this.initInteraction();
    this.initUI();

    // Default start at Step 1: Human Body Zoom
    this.setStoryStep(1);

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.renderer.setAnimationLoop(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060814);
    this.scene.fog = new THREE.FogExp2(0x060814, 0.015);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 2, 28);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.xr.enabled = true;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 90;
    this.controls.minDistance = 3.5;
    this.controls.target.set(0, 2, 0);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight1.position.set(15, 20, 18);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 2.0);
    dirLight2.position.set(-15, -15, -15);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 1.5, 35);
    pointLight.position.set(0, 0, 5);
    this.scene.add(pointLight);
  }

  initVR() {
    const vrBtnSlot = document.getElementById('vr-button-slot');
    try {
      const vrButton = VRButton.createButton(this.renderer);
      vrBtnSlot.appendChild(vrButton);
    } catch (e) {
      console.warn('WebXR VRButton not supported or unavailable', e);
    }

    this.controller1 = this.renderer.xr.getController(0);
    this.controller2 = this.renderer.xr.getController(1);

    const controllerModelFactory = new XRControllerModelFactory();
    this.controllerGrip1 = this.renderer.xr.getControllerGrip(0);
    this.controllerGrip1.add(controllerModelFactory.createControllerModel(this.controllerGrip1));
    this.scene.add(this.controllerGrip1);

    this.controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    this.controllerGrip2.add(controllerModelFactory.createControllerModel(this.controllerGrip2));
    this.scene.add(this.controllerGrip2);

    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5)
    ]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });

    const laser1 = new THREE.Line(laserGeo, laserMat);
    const laser2 = new THREE.Line(laserGeo, laserMat);
    this.controller1.add(laser1);
    this.controller2.add(laser2);

    this.scene.add(this.controller1);
    this.scene.add(this.controller2);

    this.renderer.xr.addEventListener('sessionstart', () => {
      document.getElementById('vr-hud-notice')?.classList.remove('hidden');
    });
    this.renderer.xr.addEventListener('sessionend', () => {
      document.getElementById('vr-hud-notice')?.classList.add('hidden');
    });
  }

  initModels() {
    this.dnaModel = new DNAModel(this.scene);
    this.scaleManager = new ScaleViewsManager(this.scene, this.camera, this.controls);
    this.crisprEffect = new CrisprVisualEffect(this.scene);

    this.dnaModel.buildHelix(this.currentSequence, 19);
    this.renderCodonStrip();
  }

  initInteraction() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.hoveredMesh = null;
    this.tooltip = document.getElementById('hud-tooltip');
    this.tooltipTitle = document.getElementById('tooltip-base-title');
    this.tooltipSub = document.getElementById('tooltip-base-sub');

    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.tooltip && !this.tooltip.classList.contains('hidden')) {
        this.tooltip.style.left = `${e.clientX}px`;
        this.tooltip.style.top = `${e.clientY}px`;
      }
    });

    this.canvas.addEventListener('click', () => {
      if (this.hoveredMesh) {
        const uData = this.hoveredMesh.userData;
        if (uData.disorderKey) {
          this.loadDisorder(uData.disorderKey);
          this.showOrganDiseasePopup(uData.disorderKey, uData.organ || uData.name);
        } else if (uData.base) {
          this.selectNucleotide(uData);
          soundEngine.playClick();
        }
      }
    });
  }

  showOrganDiseasePopup(disorderKey, organName) {
    const popup = document.getElementById('organ-popup-overlay');
    if (!popup) return;

    const disease = DISORDERS_DB[disorderKey] || DISORDERS_DB['sickle_cell'];
    const cure = CURE_DATABASE[disorderKey] || CURE_DATABASE['sickle_cell'];

    const iconMap = {
      'huntington': '🧠',
      'cystic_fibrosis': '🫁',
      'sickle_cell': '❤️',
      'down_syndrome': '🧬'
    };

    document.getElementById('organ-popup-icon').textContent = iconMap[disorderKey] || '🔬';
    document.getElementById('organ-popup-part').textContent = `Selected Body Part: ${organName || disease.gene}`;
    document.getElementById('organ-popup-disease-title').textContent = disease.name;
    document.getElementById('organ-popup-problem-text').textContent = disease.simpleExplain;
    document.getElementById('organ-popup-cure-name').textContent = cure.therapyName;
    document.getElementById('organ-popup-cure-desc').textContent = cure.simpleHowItWorks;

    popup.classList.remove('hidden');
    soundEngine.playScanSound();
  }

  selectNucleotide(userData) {
    if (!userData) return;
    this.selectedBaseIndex = userData.index;
    this.dnaModel.highlightBase(userData.index);
    this.highlightCodonInStrip(userData.codonIndex);
  }

  initUI() {
    // Top Scale Bar Buttons
    document.querySelectorAll('.scale-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const scale = btn.dataset.scale;
        this.scaleManager.setScale(scale, this.dnaModel.group, this.currentDisorderKey);
        soundEngine.playClick();
      });
    });

    // Organ Chips
    document.querySelectorAll('.organ-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.organ-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const disorderKey = chip.dataset.disorder;
        this.loadDisorder(disorderKey);
        this.setStoryStep(1);
        this.showOrganDiseasePopup(disorderKey, chip.textContent.trim());
      });
    });

    // Disorder Cards
    document.querySelectorAll('.disorder-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const key = card.dataset.disorder;
        if (!key || key === 'wildtype') return;

        // If user clicked the play cure button inside the card
        if (e.target.closest('.card-cure-btn')) {
          e.stopPropagation();
          this.playAutoCureStory(key);
          return;
        }

        this.loadDisorder(key);
        this.setStoryStep(1);
        this.showOrganDiseasePopup(key);
        soundEngine.playMutateSound();
      });
    });

    // Story Step Dots Click
    document.querySelectorAll('.story-step-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const step = parseInt(dot.dataset.step);
        this.setStoryStep(step);
      });
    });

    // Story Navigation Buttons (Back & Next)
    document.getElementById('btn-story-prev').addEventListener('click', () => {
      if (this.currentStoryStep > 1) {
        this.setStoryStep(this.currentStoryStep - 1);
      }
    });

    document.getElementById('btn-story-next').addEventListener('click', () => {
      if (this.currentStoryStep < 4) {
        this.setStoryStep(this.currentStoryStep + 1);
      }
    });

    // Auto-Play Cure Story
    document.getElementById('btn-story-autoplay').addEventListener('click', () => {
      this.playAutoCureStory();
    });

    // Administer Cure Button
    const cureBtn = document.getElementById('btn-administer-cure');
    cureBtn.addEventListener('click', () => {
      this.setStoryStep(4);
    });

    // Audio Toggle
    const audioBtn = document.getElementById('btn-audio-toggle');
    const soundOn = document.getElementById('icon-sound-on');
    const soundOff = document.getElementById('icon-sound-off');

    audioBtn.addEventListener('click', () => {
      const isPlaying = soundEngine.toggleAudio();
      audioBtn.classList.toggle('active', isPlaying);
      soundOn.classList.toggle('hidden', !isPlaying);
      soundOff.classList.toggle('hidden', isPlaying);
    });

    // Play / Pause Rotation
    const pauseBtn = document.getElementById('btn-pause-rotation');
    const iconPause = document.getElementById('icon-pause');
    const iconPlay = document.getElementById('icon-play');

    pauseBtn.addEventListener('click', () => {
      this.isRotating = !this.isRotating;
      iconPause.classList.toggle('hidden', !this.isRotating);
      iconPlay.classList.toggle('hidden', this.isRotating);
      soundEngine.playClick();
    });

    const speedSlider = document.getElementById('slider-rotation-speed');
    speedSlider.addEventListener('input', (e) => {
      this.rotationSpeed = parseFloat(e.target.value);
    });

    // Unwind & Transcription
    const btnUnwind = document.getElementById('btn-unwind-dna');
    btnUnwind.addEventListener('click', () => {
      this.isUnwound = !this.isUnwound;
      btnUnwind.classList.toggle('active', this.isUnwound);
      this.dnaModel.setUnwind(this.isUnwound ? 1 : 0);
      soundEngine.playUnwindSound();
    });

    const btnTranscribe = document.getElementById('btn-transcription');
    btnTranscribe.addEventListener('click', () => {
      this.simulateTranscription();
    });

    // Modals
    document.getElementById('btn-view-phenotype-3d').addEventListener('click', () => {
      document.getElementById('phenotype-modal').classList.remove('hidden');
      soundEngine.playClick();
    });
    document.getElementById('btn-close-phenotype').addEventListener('click', () => {
      document.getElementById('phenotype-modal').classList.add('hidden');
    });

    document.getElementById('btn-open-sandbox').addEventListener('click', () => {
      document.getElementById('sandbox-modal').classList.remove('hidden');
      soundEngine.playClick();
    });
    document.getElementById('btn-close-sandbox').addEventListener('click', () => {
      document.getElementById('sandbox-modal').classList.add('hidden');
    });

    document.getElementById('btn-help-toggle').addEventListener('click', () => {
      document.getElementById('help-modal').classList.remove('hidden');
      soundEngine.playClick();
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
      document.getElementById('help-modal').classList.add('hidden');
    });

    document.getElementById('btn-reset-cam').addEventListener('click', () => {
      this.setStoryStep(1);
      soundEngine.playClick();
    });

    // Sandbox Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applySandboxPreset(btn.dataset.preset);
        soundEngine.playMutateSound();
      });
    });

    // Fullscreen Mode Toggle
    const fsBtn = document.getElementById('btn-fullscreen-toggle');
    const iconFsEnter = document.getElementById('icon-fs-enter');
    const iconFsExit = document.getElementById('icon-fs-exit');

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    };

    fsBtn?.addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      iconFsEnter?.classList.toggle('hidden', isFs);
      iconFsExit?.classList.toggle('hidden', !isFs);
    });

    // Organ Disease Popup Buttons
    document.getElementById('btn-close-organ-popup')?.addEventListener('click', () => {
      document.getElementById('organ-popup-overlay')?.classList.add('hidden');
    });

    document.getElementById('btn-popup-launch-cure')?.addEventListener('click', () => {
      document.getElementById('organ-popup-overlay')?.classList.add('hidden');
      this.playAutoCureStory();
    });

    // Hotkeys
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        pauseBtn.click();
      } else if (e.key === 'm' || e.key === 'M') {
        audioBtn.click();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'r' || e.key === 'R') {
        document.getElementById('btn-reset-cam').click();
      } else if (e.key >= '1' && e.key <= '4') {
        this.setStoryStep(parseInt(e.key));
      }
    });
  }

  loadDisorder(key) {
    const data = DISORDERS_DB[key];
    if (!data) return;

    this.currentDisorderKey = key;
    this.currentSequence = [...data.sequence];

    document.querySelectorAll('.disorder-card').forEach(c => c.classList.remove('active'));
    document.querySelector(`.disorder-card[data-disorder="${key}"]`)?.classList.add('active');

    this.dnaModel.buildHelix(this.currentSequence, data.mutatedIndex);

    // Update Pathology Panel
    document.getElementById('pathology-title').textContent = `Condition: ${data.name}`;
    const statusPill = document.getElementById('pathology-status');
    statusPill.className = `status-pill ${data.statusClass}`;
    statusPill.textContent = data.statusLabel;
    document.getElementById('pathology-desc').textContent = data.simpleExplain;

    // Update Cure Information Card
    const cureData = CURE_DATABASE[key] || CURE_DATABASE['sickle_cell'];
    document.getElementById('cure-therapy-name').textContent = cureData.therapyName;
    document.getElementById('cure-therapy-type').textContent = cureData.therapyType;
    document.getElementById('cure-mechanism-text').textContent = cureData.simpleHowItWorks;
    document.getElementById('cure-btn-text').textContent = `ADMINISTER ${cureData.therapyName.split('(')[0].trim().toUpperCase()} CURE`;

    this.renderCodonStrip();
  }

  /**
   * Orchestrates the 4-step guided cure story
   */
  setStoryStep(stepNumber) {
    this.currentStoryStep = stepNumber;
    const disease = DISORDERS_DB[this.currentDisorderKey] || DISORDERS_DB['sickle_cell'];
    const cure = CURE_DATABASE[this.currentDisorderKey] || CURE_DATABASE['sickle_cell'];

    // Update Step Dots & Buttons
    document.querySelectorAll('.story-step-dot').forEach(d => {
      const dStep = parseInt(d.dataset.step);
      d.classList.toggle('active', dStep === stepNumber);
      d.classList.toggle('completed', dStep < stepNumber);
    });

    document.getElementById('btn-story-prev').disabled = (stepNumber === 1);
    document.getElementById('btn-story-next').disabled = (stepNumber === 4);

    const badge = document.getElementById('story-step-badge');
    const title = document.getElementById('story-title');
    const subtitle = document.getElementById('story-subtitle');
    const desc = document.getElementById('story-description');
    const highlight = document.getElementById('story-highlight-box');

    if (stepNumber === 1) {
      // Step 1: Human Body Zoom into target organ
      badge.textContent = 'Step 1 of 4: Body Zoom';
      title.textContent = 'Step 1: Zooming into the Organ';
      subtitle.textContent = `${disease.name} (${disease.chromosome})`;
      desc.textContent = `We start at the 3D human body and dive straight into the ${disease.gene}, where the disease causes physical trouble.`;
      highlight.innerHTML = `<strong>What you see:</strong> Watch the camera zoom directly into the organ on the contoured human body!`;

      soundEngine.playScanSound();
      this.scaleManager.zoomToOrganOnBody(this.currentDisorderKey);

    } else if (stepNumber === 2) {
      // Step 2: Inside the Organ (Functional 3D Diagram)
      badge.textContent = 'Step 2 of 4: Inside Organ';
      title.textContent = 'Step 2: Inside the Organ (Functional Diagram)';
      subtitle.textContent = `Internal View of ${disease.gene}`;
      desc.textContent = disease.simpleExplain;
      highlight.innerHTML = `<strong>What you see:</strong> A 3D functional diagram of the organ showing how cells work inside before we read its DNA.`;

      soundEngine.playClick();
      this.scaleManager.setScale('organ_diagram', this.dnaModel.group, this.currentDisorderKey);

    } else if (stepNumber === 3) {
      // Step 3: DNA Unwinding & Replication (Spot the typo)
      badge.textContent = 'Step 3 of 4: DNA Typo';
      title.textContent = 'Step 3: DNA Unwinding & Finding the Typo';
      subtitle.textContent = `Reading the Recipe Letters`;
      desc.textContent = `We dive into the DNA double helix. The strand unzips to reveal the genetic code. The glowing red letter is the exact typo: ${disease.shiftSummary}.`;
      highlight.innerHTML = `<strong>What you see:</strong> The DNA double helix opens in a replication bubble, highlighting the single misspelled letter!`;

      soundEngine.playUnwindSound();
      this.scaleManager.setScale('dna', this.dnaModel.group, this.currentDisorderKey);
      this.dnaModel.animateReplicationAndUnwind(disease.mutatedIndex);

    } else if (stepNumber === 4) {
      // Step 4: CRISPR-Cas9 Cure & Healing
      badge.textContent = 'Step 4 of 4: CURED! ✓';
      title.textContent = 'Step 4: CRISPR Molecular Scissors Cure';
      subtitle.textContent = cure.therapyName;
      desc.textContent = cure.simpleHowItWorks;
      highlight.innerHTML = `<strong>What you see:</strong> Molecular scissors (Cas9) fly in, cut out the bad DNA, and a golden healing burst repairs the letter. Cells return to 100% health!`;

      this.administerCure();
    }
  }

  playAutoCureStory(disorderKey) {
    if (disorderKey && disorderKey !== this.currentDisorderKey) {
      this.loadDisorder(disorderKey);
    }
    // Clear any pending timeouts
    if (this.storyTimeouts) {
      this.storyTimeouts.forEach(t => clearTimeout(t));
    }
    this.storyTimeouts = [];

    this.isAutoPlaying = true;
    const btn = document.getElementById('btn-story-autoplay');
    if (btn) {
      btn.style.opacity = '0.6';
      btn.innerHTML = `<span>▶ Playing Cure Animation...</span>`;
    }

    this.setStoryStep(1);
    this.storyTimeouts.push(setTimeout(() => {
      this.setStoryStep(2);
      this.storyTimeouts.push(setTimeout(() => {
        this.setStoryStep(3);
        this.storyTimeouts.push(setTimeout(() => {
          this.setStoryStep(4);
          this.storyTimeouts.push(setTimeout(() => {
            if (btn) {
              btn.style.opacity = '1.0';
              btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Play Full Animated Cure Story</span>`;
            }
            this.isAutoPlaying = false;
          }, 3500));
        }, 3200));
      }, 3000));
    }, 2800));
  }

  administerCure() {
    const cureBtn = document.getElementById('btn-administer-cure');
    if (cureBtn) {
      cureBtn.disabled = true;
      cureBtn.style.opacity = '0.6';
    }

    soundEngine.playCrisprCutSound();

    if (this.scaleManager.currentScale !== 'dna') {
      this.scaleManager.setScale('dna', this.dnaModel.group, this.currentDisorderKey);
    }

    const disease = DISORDERS_DB[this.currentDisorderKey] || DISORDERS_DB['sickle_cell'];
    const cure = CURE_DATABASE[this.currentDisorderKey] || CURE_DATABASE['sickle_cell'];

    // Specific target base index and repair base for each disorder
    let targetIndex = 19;
    let repairChar = 'A';
    let cureSuccessMessage = 'CURED! HEALTHY DONUT CELLS RESTORED';

    if (this.currentDisorderKey === 'huntington') {
      targetIndex = 3;
      repairChar = 'C';
      cureSuccessMessage = 'CURED! BRAIN NERVES SAVED & TOXIC CLUMPS DISSOLVED';
    } else if (this.currentDisorderKey === 'cystic_fibrosis') {
      targetIndex = 6;
      repairChar = 'C';
      cureSuccessMessage = 'CURED! LUNG AIRWAYS OPENED & MUCUS CLEARED';
    } else if (this.currentDisorderKey === 'down_syndrome') {
      targetIndex = 9;
      repairChar = 'A';
      cureSuccessMessage = 'CURED! CHROMOSOME 21 BALANCED VIA XIST SLEEP SWITCH';
    }

    const targetPos = this.dnaModel.getBasePosition(targetIndex);

    // Play 3D Cas9 molecular scissors flying in
    this.crisprEffect.playRepairAnimation(targetPos, () => {
      // Golden particle burst & sequence repair
      this.dnaModel.animateCrisprRepair(targetIndex, repairChar, () => {
        soundEngine.playCureSound();

        const statusPill = document.getElementById('pathology-status');
        if (statusPill) {
          statusPill.className = 'status-pill status-healthy';
          statusPill.textContent = cureSuccessMessage;
        }

        // Heal functional organ diagrams & morph cells based on disorder
        if (this.currentDisorderKey === 'sickle_cell') {
          this.scaleManager.organDiagrams.healBlood();
          this.scaleManager.morphMutantToCured();
        } else if (this.currentDisorderKey === 'cystic_fibrosis') {
          this.scaleManager.organDiagrams.healLungs();
        } else if (this.currentDisorderKey === 'huntington') {
          this.scaleManager.organDiagrams.healBrain();
        } else {
          this.scaleManager.morphMutantToCured();
        }

        const cureBtnText = document.getElementById('cure-btn-text');
        if (cureBtnText) {
          cureBtnText.textContent = `${cure.therapyName} SUCCESSFUL! CURED ✓`;
        }
        if (cureBtn) {
          cureBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          cureBtn.style.opacity = '1.0';
        }

        this.renderCodonStrip();

        setTimeout(() => {
          if (cureBtn) cureBtn.disabled = false;
        }, 3000);
      });
    });
  }

  renderCodonStrip() {
    const track = document.getElementById('codon-track');
    if (!track) return;
    track.innerHTML = '';

    const codons = translateSequence(this.currentSequence);
    const mutantCodon = (this.currentDisorderKey === 'sickle_cell') ? 7 : -1;

    codons.forEach((codon) => {
      const pill = document.createElement('div');
      pill.className = `codon-pill ${codon.index === mutantCodon ? 'mutant' : ''}`;
      pill.dataset.codon = codon.index;

      pill.innerHTML = `
        <span class="codon-triplet">${codon.mrna}</span>
        <span class="codon-amino">${codon.amino.code}</span>
      `;

      pill.addEventListener('click', () => {
        this.highlightCodonInHelix(codon.index);
        soundEngine.playClick();
      });

      track.appendChild(pill);
    });
  }

  highlightCodonInStrip(codonIndex) {
    document.querySelectorAll('.codon-pill').forEach(p => {
      p.classList.toggle('active', parseInt(p.dataset.codon) === codonIndex);
    });
    const ribosomeMarker = document.getElementById('ribosome-marker');
    if (ribosomeMarker) {
      ribosomeMarker.textContent = `Word ${codonIndex} of ${Math.ceil(this.currentSequence.length / 3)}`;
    }
  }

  highlightCodonInHelix(codonIndex) {
    const baseIndex = (codonIndex - 1) * 3;
    if (baseIndex < this.currentSequence.length) {
      this.dnaModel.highlightBase(baseIndex);
    }
  }

  simulateTranscription() {
    soundEngine.playUnwindSound();
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const codonIndex = (step % Math.ceil(this.currentSequence.length / 3)) + 1;
      this.highlightCodonInHelix(codonIndex);
      if (step > 12) clearInterval(interval);
    }, 280);
  }

  applySandboxPreset(type) {
    const mutBox = document.getElementById('sandbox-mut-seq');
    const peptideBox = document.getElementById('sandbox-peptide');
    const impactBox = document.getElementById('sandbox-impact');

    if (type === 'missense') {
      mutBox.textContent = 'ATG GTG CAC CTG ACT CCT GTG GAG AAG TCT GCC';
      peptideBox.textContent = 'Met - Val - His - Leu - Thr - Pro - [Val] - Glu - Lys - Ser - Ala';
      impactBox.innerHTML = '<strong>1-Letter Swap:</strong> Letter A changed to T at position 7 (Sickle Cell Anemia).';
      this.loadDisorder('sickle_cell');
      this.setStoryStep(3);
    } else if (type === 'nonsense') {
      mutBox.textContent = 'ATG GTG CAC CTG ACT CCT TAA GAG AAG TCT GCC';
      peptideBox.textContent = 'Met - Val - His - Leu - Thr - Pro - [STOP]';
      impactBox.innerHTML = '<strong>Premature Stop:</strong> A stop word was created too early, cutting protein production short.';
    } else if (type === 'frameshift') {
      mutBox.textContent = 'ATG GTG CAC CTG ACT CCT A GAG GAG AAG TCT GCC';
      peptideBox.textContent = 'Met - Val - His - Leu - Thr - Pro - [Arg] - [Gly] - [Arg]...';
      impactBox.innerHTML = '<strong>Letter Insertion:</strong> Pushing 1 extra letter shifts all words downstream, creating jumbled gibberish.';
    } else if (type === 'deletion') {
      mutBox.textContent = 'ATG GTG CAC CTG ACT CCT --- GAG AAG TCT GCC';
      peptideBox.textContent = 'Met - Val - His - Leu - Thr - Pro - [Deleted] - Glu - Lys...';
      impactBox.innerHTML = '<strong>3 Letters Erased:</strong> Erasing 3 letters breaks the protein without jumbling the rest (Cystic Fibrosis ΔF508).';
      this.loadDisorder('cystic_fibrosis');
      this.setStoryStep(3);
    } else if (type === 'reset') {
      mutBox.textContent = 'ATG GTG CAC CTG ACT CCT GAG GAG AAG TCT GCC';
      peptideBox.textContent = 'Met - Val - His - Leu - Thr - Pro - Glu - Glu - Lys - Ser - Ala';
      impactBox.innerHTML = '<strong>100% Healthy:</strong> Normal healthy recipe without typos.';
      this.loadDisorder('wildtype');
      this.setStoryStep(1);
    }
  }

  animate() {
    const delta = this.clock.getDelta();

    if (this.dnaModel) {
      this.dnaModel.animate(delta, this.rotationSpeed, !this.isRotating);
    }
    if (this.scaleManager) {
      this.scaleManager.animate(delta);
    }

    if (!this.renderer.xr.isPresenting) {
      this.controls.update();

      this.raycaster.setFromCamera(this.mouse, this.camera);
      let hitCandidates = [];

      if (this.scaleManager.currentScale === 'body') {
        hitCandidates = this.scaleManager.bodyModel.getClickableHotspots();
      } else if (this.dnaModel && this.dnaModel.group.visible) {
        hitCandidates = this.dnaModel.getClickableMeshes();
      }

      const intersects = this.raycaster.intersectObjects(hitCandidates, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        this.hoveredMesh = hit;
        const uData = hit.userData;

        if (this.tooltip && uData) {
          this.tooltip.classList.remove('hidden');
          if (uData.organ) {
            this.tooltipTitle.textContent = uData.name;
            this.tooltipSub.textContent = `Click to Zoom & Start Cure Story (${uData.organ})`;
          } else if (uData.base) {
            const meta = BASE_METADATA[uData.base] || BASE_METADATA['A'];
            this.tooltipTitle.textContent = `${meta.name} (${uData.base})`;
            this.tooltipSub.textContent = `Pairs with ${uData.complement} • Word ${uData.codonIndex}`;
          }
        }
        document.body.style.cursor = 'pointer';
      } else {
        this.hoveredMesh = null;
        if (this.tooltip) this.tooltip.classList.add('hidden');
        document.body.style.cursor = 'default';
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GenomeApp();
});
