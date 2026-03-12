import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface CharacterAnimations {
  idle: THREE.AnimationAction | null;
  walk: THREE.AnimationAction | null;
  run: THREE.AnimationAction | null;
}

export interface RealisticCharacterController {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  animations: CharacterAnimations;
  currentAction: THREE.AnimationAction | null;
  update: (delta: number, isMoving: boolean, isRunning: boolean) => void;
  setPosition: (x: number, y: number, z: number) => void;
  setRotation: (y: number) => void;
  dispose: () => void;
}

const MIXAMO_MODELS = {
  character: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb',
};

export async function createRealisticCharacter(
  scene: THREE.Scene,
  initialPosition: THREE.Vector3
): Promise<RealisticCharacterController> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      MIXAMO_MODELS.character,
      (gltf) => {
        const model = gltf.scene;
        model.position.copy(initialPosition);
        const targetHeight = 1.75;
        const bbox = new THREE.Box3().setFromObject(model);
        const currentHeight = bbox.max.y - bbox.min.y;
        const scaleFactor = targetHeight / currentHeight;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        const animations: CharacterAnimations = {
          idle: null,
          walk: null,
          run: null,
        };

        console.log('Available animations:', gltf.animations.map(a => a.name));

        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          const name = clip.name;

          if (name === 'Idle') {
            animations.idle = action;
          } else if (name === 'Walk') {
            animations.walk = action;
          } else if (name === 'Run') {
            animations.run = action;
          }
        });

        if (!animations.idle && gltf.animations.length > 0) {
          animations.idle = mixer.clipAction(gltf.animations[0]);
        }
        if (!animations.walk) {
          animations.walk = animations.idle;
        }
        if (!animations.run) {
          animations.run = animations.walk || animations.idle;
        }

        let currentAction = animations.idle;
        if (currentAction) {
          currentAction.reset();
          currentAction.setEffectiveTimeScale(1);
          currentAction.setEffectiveWeight(1);
          currentAction.play();
        } else {
          console.warn('No idle animation found, character will remain in T-pose');
        }

        const fadeToAction = (
          newAction: THREE.AnimationAction | null,
          duration: number = 0.2
        ) => {
          if (!newAction || newAction === currentAction) return;

          if (currentAction) {
            currentAction.fadeOut(duration);
          }

          newAction.reset();
          newAction.fadeIn(duration);
          newAction.play();
          currentAction = newAction;
        };

        const controller: RealisticCharacterController = {
          model,
          mixer,
          animations,
          currentAction,
          update: (delta: number, isMoving: boolean, isRunning: boolean) => {
            if (isMoving) {
              if (isRunning && animations.run) {
                fadeToAction(animations.run);
              } else if (animations.walk) {
                fadeToAction(animations.walk);
              }
            } else if (animations.idle) {
              fadeToAction(animations.idle);
            }
            mixer.update(delta);
          },
          setPosition: (x: number, y: number, z: number) => {
            model.position.set(x, y, z);
          },
          setRotation: (y: number) => {
            model.rotation.y = y;
          },
          dispose: () => {
            scene.remove(model);
            mixer.stopAllAction();
            model.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach((m) => m.dispose());
                } else {
                  child.material?.dispose();
                }
              }
            });
          },
        };

        resolve(controller);
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading character: ${percent.toFixed(0)}%`);
      },
      (error) => {
        console.error('Error loading character:', error);
        reject(error);
      }
    );
  });
}

export function createFallbackCharacter(
  scene: THREE.Scene,
  initialPosition: THREE.Vector3
): RealisticCharacterController {
  const character = new THREE.Group();

  const skinColor = 0xffdbac;
  const shirtColor = 0x3b82f6;
  const pantsColor = 0x1e3a5f;
  const shoeColor = 0x2d2d2d;
  const hairColor = 0x3d2314;

  const scale = 0.85;

  const hipsPivot = new THREE.Group();
  hipsPivot.position.y = 0.82 * scale;
  character.add(hipsPivot);

  const torsoPivot = new THREE.Group();
  torsoPivot.position.y = 0.3 * scale;
  hipsPivot.add(torsoPivot);

  const bodyGeometry = new THREE.CylinderGeometry(0.25 * scale, 0.22 * scale, 0.6 * scale, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: shirtColor });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.3 * scale;
  body.castShadow = true;
  torsoPivot.add(body);

  const neckPivot = new THREE.Group();
  neckPivot.position.y = 0.6 * scale;
  torsoPivot.add(neckPivot);

  const headGeometry = new THREE.SphereGeometry(0.18 * scale, 32, 32);
  const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 0.2 * scale;
  head.castShadow = true;
  neckPivot.add(head);

  const hairGeometry = new THREE.SphereGeometry(0.19 * scale, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor });
  const hair = new THREE.Mesh(hairGeometry, hairMaterial);
  hair.position.y = 0.25 * scale;
  hair.castShadow = true;
  neckPivot.add(hair);

  const createLegWithKnee = (side: number) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(side * 0.1 * scale, 0, 0);

    const upperLegPivot = new THREE.Group();
    legGroup.add(upperLegPivot);

    const upperLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * scale, 0.07 * scale, 0.35 * scale, 12),
      new THREE.MeshStandardMaterial({ color: pantsColor })
    );
    upperLeg.position.y = -0.175 * scale;
    upperLeg.castShadow = true;
    upperLegPivot.add(upperLeg);

    const kneePivot = new THREE.Group();
    kneePivot.position.y = -0.35 * scale;
    upperLegPivot.add(kneePivot);

    const lowerLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07 * scale, 0.06 * scale, 0.35 * scale, 12),
      new THREE.MeshStandardMaterial({ color: pantsColor })
    );
    lowerLeg.position.y = -0.175 * scale;
    lowerLeg.castShadow = true;
    kneePivot.add(lowerLeg);

    const anklePivot = new THREE.Group();
    anklePivot.position.y = -0.35 * scale;
    kneePivot.add(anklePivot);

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.2 * scale),
      new THREE.MeshStandardMaterial({ color: shoeColor })
    );
    foot.position.set(0, -0.04 * scale, 0.04 * scale);
    foot.castShadow = true;
    anklePivot.add(foot);

    return { legGroup, upperLegPivot, kneePivot, anklePivot };
  };

  const createArmWithElbow = (side: number) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.32 * scale, 0.5 * scale, 0);

    const shoulderPivot = new THREE.Group();
    armGroup.add(shoulderPivot);

    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * scale, 0.055 * scale, 0.25 * scale, 12),
      new THREE.MeshStandardMaterial({ color: shirtColor })
    );
    upperArm.position.y = -0.125 * scale;
    upperArm.castShadow = true;
    shoulderPivot.add(upperArm);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.y = -0.25 * scale;
    shoulderPivot.add(elbowPivot);

    const lowerArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055 * scale, 0.05 * scale, 0.22 * scale, 12),
      new THREE.MeshStandardMaterial({ color: skinColor })
    );
    lowerArm.position.y = -0.11 * scale;
    lowerArm.castShadow = true;
    elbowPivot.add(lowerArm);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.055 * scale, 16, 16),
      new THREE.MeshStandardMaterial({ color: skinColor })
    );
    hand.position.y = -0.24 * scale;
    hand.castShadow = true;
    elbowPivot.add(hand);

    return { armGroup, shoulderPivot, elbowPivot };
  };

  const leftLegParts = createLegWithKnee(1);
  const rightLegParts = createLegWithKnee(-1);
  hipsPivot.add(leftLegParts.legGroup);
  hipsPivot.add(rightLegParts.legGroup);

  const leftArmParts = createArmWithElbow(1);
  const rightArmParts = createArmWithElbow(-1);
  torsoPivot.add(leftArmParts.armGroup);
  torsoPivot.add(rightArmParts.armGroup);

  character.position.copy(initialPosition);
  scene.add(character);

  let walkPhase = 0;
  let idlePhase = 0;
  let currentBounce = 0;
  let targetBounce = 0;

  const controller: RealisticCharacterController = {
    model: character,
    mixer: new THREE.AnimationMixer(character),
    animations: { idle: null, walk: null, run: null },
    currentAction: null,
    update: (delta: number, isMoving: boolean, isRunning: boolean) => {
      const baseHipHeight = 0.82 * scale;

      if (isMoving) {
        const speed = isRunning ? 10 : 6;
        const legSwing = isRunning ? 0.55 : 0.35;
        const armSwing = isRunning ? 0.5 : 0.3;
        const bounceAmount = isRunning ? 0.06 : 0.025;
        const hipSway = isRunning ? 0.06 : 0.03;
        const torsoTwist = isRunning ? 0.1 : 0.05;

        walkPhase += delta * speed;

        const phase = walkPhase;
        const sinPhase = Math.sin(phase);
        const sin2Phase = Math.sin(phase * 2);

        targetBounce = Math.abs(sin2Phase) * bounceAmount;
        currentBounce += (targetBounce - currentBounce) * 0.25;
        hipsPivot.position.y = baseHipHeight + currentBounce;

        hipsPivot.rotation.z = sinPhase * hipSway;
        hipsPivot.rotation.y = sinPhase * hipSway * 0.3;

        torsoPivot.rotation.y = -sinPhase * torsoTwist;
        torsoPivot.rotation.x = isRunning ? 0.12 : 0.03;

        neckPivot.rotation.y = sinPhase * torsoTwist * 0.2;
        neckPivot.rotation.x = isRunning ? -0.08 : 0;

        const leftLegAngle = sinPhase * legSwing;
        const rightLegAngle = -sinPhase * legSwing;

        leftLegParts.upperLegPivot.rotation.x = leftLegAngle;
        rightLegParts.upperLegPivot.rotation.x = rightLegAngle;

        const leftKneeBend = Math.max(0, -leftLegAngle * 1.2 + 0.15);
        const rightKneeBend = Math.max(0, -rightLegAngle * 1.2 + 0.15);
        leftLegParts.kneePivot.rotation.x = leftKneeBend * (isRunning ? 1.3 : 0.9);
        rightLegParts.kneePivot.rotation.x = rightKneeBend * (isRunning ? 1.3 : 0.9);

        const leftFootPlant = Math.max(0, -sinPhase);
        const rightFootPlant = Math.max(0, sinPhase);
        leftLegParts.anklePivot.rotation.x = -leftLegAngle * 0.4 + leftFootPlant * 0.15;
        rightLegParts.anklePivot.rotation.x = -rightLegAngle * 0.4 + rightFootPlant * 0.15;

        const leftArmAngle = -sinPhase * armSwing;
        const rightArmAngle = sinPhase * armSwing;

        leftArmParts.shoulderPivot.rotation.x = leftArmAngle;
        rightArmParts.shoulderPivot.rotation.x = rightArmAngle;

        leftArmParts.shoulderPivot.rotation.z = isRunning ? -0.12 : -0.04;
        rightArmParts.shoulderPivot.rotation.z = isRunning ? 0.12 : 0.04;

        const leftElbowBend = Math.max(0.2, leftArmAngle * 0.5 + (isRunning ? 0.7 : 0.35));
        const rightElbowBend = Math.max(0.2, rightArmAngle * 0.5 + (isRunning ? 0.7 : 0.35));
        leftArmParts.elbowPivot.rotation.x = -leftElbowBend;
        rightArmParts.elbowPivot.rotation.x = -rightElbowBend;

      } else {
        idlePhase += delta * 1.2;
        const breathe = Math.sin(idlePhase) * 0.015;
        const sway = Math.sin(idlePhase * 0.6) * 0.008;

        currentBounce *= 0.92;
        hipsPivot.position.y = baseHipHeight + currentBounce;

        torsoPivot.position.y = 0.3 + breathe;
        torsoPivot.rotation.x *= 0.92;
        torsoPivot.rotation.y *= 0.92;

        hipsPivot.rotation.z = sway;
        hipsPivot.rotation.y *= 0.95;

        neckPivot.rotation.x = breathe * 0.3;
        neckPivot.rotation.y *= 0.95;

        const dampingFactor = 0.9;
        leftLegParts.upperLegPivot.rotation.x *= dampingFactor;
        rightLegParts.upperLegPivot.rotation.x *= dampingFactor;
        leftLegParts.kneePivot.rotation.x *= dampingFactor;
        rightLegParts.kneePivot.rotation.x *= dampingFactor;
        leftLegParts.anklePivot.rotation.x *= dampingFactor;
        rightLegParts.anklePivot.rotation.x *= dampingFactor;

        leftArmParts.shoulderPivot.rotation.x *= dampingFactor;
        rightArmParts.shoulderPivot.rotation.x *= dampingFactor;
        leftArmParts.shoulderPivot.rotation.z = -0.06 + Math.sin(idlePhase * 0.4) * 0.015;
        rightArmParts.shoulderPivot.rotation.z = 0.06 - Math.sin(idlePhase * 0.4) * 0.015;
        leftArmParts.elbowPivot.rotation.x = -0.12;
        rightArmParts.elbowPivot.rotation.x = -0.12;
      }
    },
    setPosition: (x: number, y: number, z: number) => {
      character.position.set(x, y, z);
    },
    setRotation: (y: number) => {
      character.rotation.y = y;
    },
    dispose: () => {
      scene.remove(character);
      character.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    },
  };

  return controller;
}
