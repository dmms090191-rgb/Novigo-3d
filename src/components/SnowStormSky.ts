import * as THREE from 'three';

const nightSkyVertexShader = `
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w;
}
`;

const nightSkyFragmentShader = `
uniform float time;

varying vec3 vWorldPosition;
varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    vec3 direction = normalize(vWorldPosition);

    vec3 horizonColor = vec3(0.08, 0.12, 0.18);
    vec3 midSkyColor = vec3(0.04, 0.06, 0.12);
    vec3 zenithColor = vec3(0.02, 0.03, 0.08);

    float t = direction.y * 0.5 + 0.5;
    vec3 skyColor;

    if (t < 0.3) {
        skyColor = mix(horizonColor, midSkyColor, t / 0.3);
    } else if (t < 0.6) {
        skyColor = mix(midSkyColor, zenithColor, (t - 0.3) / 0.3);
    } else {
        skyColor = zenithColor;
    }

    vec2 nebulaUV = direction.xz / (direction.y + 0.5) * 0.5;
    float nebula = noise(nebulaUV * 2.0) * noise(nebulaUV * 4.0 + 10.0);
    vec3 nebulaColor = vec3(0.1, 0.12, 0.2) * nebula * 0.3;
    skyColor += nebulaColor * smoothstep(0.3, 0.8, t);

    gl_FragColor = vec4(skyColor, 1.0);
}
`;

const starsVertexShader = `
attribute float size;
attribute float brightness;
attribute vec3 starColor;

varying float vBrightness;
varying vec3 vStarColor;

uniform float time;

void main() {
    vBrightness = brightness;
    vStarColor = starColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float twinkle = sin(time * 2.0 + brightness * 100.0) * 0.3 + 0.7;

    gl_PointSize = size * twinkle * (800.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const starsFragmentShader = `
varying float vBrightness;
varying vec3 vStarColor;

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);

    float alpha = (core * 1.0 + glow * 0.4) * vBrightness;

    vec3 finalColor = mix(vStarColor, vec3(1.0), core * 0.8);

    gl_FragColor = vec4(finalColor, alpha);
}
`;

const snowParticleVertexShader = `
attribute float size;
attribute float opacity;
attribute float rotation;
attribute float snowType;

varying float vOpacity;
varying float vRotation;
varying float vSnowType;
varying float vDepth;

uniform float time;

void main() {
    vOpacity = opacity;
    vRotation = rotation;
    vSnowType = snowType;

    vec3 pos = position;

    float drift = sin(time * 1.2 + position.y * 0.05 + position.x * 0.02) * 0.15;
    pos.x += drift;

    float sway = cos(time * 0.8 + position.z * 0.03) * 0.1;
    pos.z += sway;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mvPosition.z;

    float baseSize = size;

    gl_PointSize = baseSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const snowParticleFragmentShader = `
varying float vOpacity;
varying float vRotation;
varying float vSnowType;
varying float vDepth;

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    float softCircle = 1.0 - smoothstep(0.0, 0.5, dist);
    float glow = exp(-dist * dist * 12.0);
    float alpha = (softCircle * 0.8 + glow * 0.2) * vOpacity;

    float depthFade = smoothstep(50.0, 500.0, vDepth);
    alpha *= mix(1.0, 0.4, depthFade);

    vec3 snowColor = vec3(1.0, 1.0, 1.0);

    gl_FragColor = vec4(snowColor, alpha);
}
`;

const moonVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const moonFragmentShader = `
uniform float time;

varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    vec2 center = vUv - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    float crater1 = noise(vUv * 8.0);
    float crater2 = noise(vUv * 15.0 + 5.0);
    float crater3 = noise(vUv * 25.0 + 10.0);
    float craters = crater1 * 0.5 + crater2 * 0.3 + crater3 * 0.2;

    vec3 moonBase = vec3(0.95, 0.95, 0.92);
    vec3 moonDark = vec3(0.75, 0.75, 0.72);
    vec3 moonColor = mix(moonDark, moonBase, craters);

    float edge = smoothstep(0.5, 0.45, dist);
    float innerGlow = 1.0 - dist * 1.5;
    moonColor *= (0.85 + innerGlow * 0.15);

    float alpha = edge;

    gl_FragColor = vec4(moonColor, alpha);
}
`;

const moonGlowFragmentShader = `
varying vec2 vUv;

void main() {
    vec2 center = vUv - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    float glow = exp(-dist * dist * 4.0);
    vec3 glowColor = vec3(0.9, 0.92, 1.0);

    float edgeFade = smoothstep(0.5, 0.3, dist);
    float alpha = glow * 0.5 * edgeFade;

    gl_FragColor = vec4(glowColor, alpha);
}
`;

export class SnowStormSkySystem {
    private scene: THREE.Scene;
    private skyMesh: THREE.Mesh;
    private starsMesh: THREE.Points;
    private moonMesh: THREE.Mesh;
    private moonGlowMesh: THREE.Mesh;
    private snowParticles: THREE.Points;
    private ambientLight: THREE.AmbientLight;
    private moonLight: THREE.DirectionalLight;
    private time: number = 0;

    private starCount: number = 8000;
    private snowCount: number = 15000;
    private snowPositions: Float32Array;
    private snowVelocities: Float32Array;
    private snowSizes: Float32Array;
    private snowOpacities: Float32Array;
    private snowRotations: Float32Array;
    private snowTypes: Float32Array;

    private skyUniforms: {
        time: { value: number };
    };

    private starsUniforms: {
        time: { value: number };
    };

    private snowUniforms: {
        time: { value: number };
    };

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        this.snowPositions = new Float32Array(this.snowCount * 3);
        this.snowVelocities = new Float32Array(this.snowCount * 3);
        this.snowSizes = new Float32Array(this.snowCount);
        this.snowOpacities = new Float32Array(this.snowCount);
        this.snowRotations = new Float32Array(this.snowCount);
        this.snowTypes = new Float32Array(this.snowCount);

        this.skyUniforms = {
            time: { value: 0.0 }
        };

        this.starsUniforms = {
            time: { value: 0.0 }
        };

        this.snowUniforms = {
            time: { value: 0.0 }
        };

        this.skyMesh = new THREE.Mesh();
        this.starsMesh = new THREE.Points();
        this.moonMesh = new THREE.Mesh();
        this.moonGlowMesh = new THREE.Mesh();
        this.snowParticles = new THREE.Points();
        this.ambientLight = new THREE.AmbientLight();
        this.moonLight = new THREE.DirectionalLight();
    }

    init(): void {
        this.createNightSky();
        this.createStars();
        this.createMoon();
        this.createSnowParticles();
        this.createLighting();
    }

    private createNightSky(): void {
        const skyGeometry = new THREE.SphereGeometry(4500, 64, 64);
        const skyMaterial = new THREE.ShaderMaterial({
            vertexShader: nightSkyVertexShader,
            fragmentShader: nightSkyFragmentShader,
            uniforms: this.skyUniforms,
            side: THREE.BackSide,
            depthWrite: false
        });

        this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.skyMesh.name = 'snowStormSky';
        this.skyMesh.renderOrder = -1000;
        this.scene.add(this.skyMesh);
    }

    private createStars(): void {
        const positions = new Float32Array(this.starCount * 3);
        const sizes = new Float32Array(this.starCount);
        const brightnesses = new Float32Array(this.starCount);
        const colors = new Float32Array(this.starCount * 3);

        for (let i = 0; i < this.starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 0.95 + 0.05);
            const radius = 4000 + Math.random() * 300;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            const sizeProbability = Math.random();
            if (sizeProbability < 0.6) {
                sizes[i] = 0.8 + Math.random() * 1.2;
            } else if (sizeProbability < 0.85) {
                sizes[i] = 2.0 + Math.random() * 2.0;
            } else if (sizeProbability < 0.97) {
                sizes[i] = 4.0 + Math.random() * 3.0;
            } else {
                sizes[i] = 7.0 + Math.random() * 4.0;
            }

            brightnesses[i] = 0.5 + Math.random() * 0.5;

            const colorType = Math.random();
            if (colorType > 0.92) {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.8;
                colors[i * 3 + 2] = 0.6;
            } else if (colorType > 0.84) {
                colors[i * 3] = 0.7;
                colors[i * 3 + 1] = 0.85;
                colors[i * 3 + 2] = 1.0;
            } else if (colorType > 0.76) {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 1.0;
                colors[i * 3 + 2] = 0.8;
            } else {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 1.0;
                colors[i * 3 + 2] = 1.0;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('brightness', new THREE.BufferAttribute(brightnesses, 1));
        geometry.setAttribute('starColor', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.ShaderMaterial({
            vertexShader: starsVertexShader,
            fragmentShader: starsFragmentShader,
            uniforms: this.starsUniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.starsMesh = new THREE.Points(geometry, material);
        this.starsMesh.name = 'snowStormStars';
        this.starsMesh.renderOrder = -900;
        this.scene.add(this.starsMesh);
    }

    private createMoon(): void {
        const moonGeometry = new THREE.PlaneGeometry(450, 450);
        const moonMaterial = new THREE.ShaderMaterial({
            vertexShader: moonVertexShader,
            fragmentShader: moonFragmentShader,
            uniforms: {
                time: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        this.moonMesh.position.set(600, 1600, -2500);
        this.moonMesh.lookAt(0, 0, 0);
        this.moonMesh.name = 'snowStormMoon';
        this.moonMesh.renderOrder = -800;
        this.scene.add(this.moonMesh);

        const glowGeometry = new THREE.PlaneGeometry(900, 900);
        const glowMaterial = new THREE.ShaderMaterial({
            vertexShader: moonVertexShader,
            fragmentShader: moonGlowFragmentShader,
            uniforms: {},
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        this.moonGlowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.moonGlowMesh.position.copy(this.moonMesh.position);
        this.moonGlowMesh.lookAt(0, 0, 0);
        this.moonGlowMesh.name = 'snowStormMoonGlow';
        this.moonGlowMesh.renderOrder = -850;
        this.scene.add(this.moonGlowMesh);

        const outerGlowGeometry = new THREE.PlaneGeometry(1400, 1400);
        const outerGlowMaterial = new THREE.ShaderMaterial({
            vertexShader: moonVertexShader,
            fragmentShader: `
                varying vec2 vUv;
                void main() {
                    vec2 center = vUv - vec2(0.5);
                    float dist = length(center);
                    if (dist > 0.5) discard;
                    float glow = exp(-dist * dist * 3.0);
                    vec3 glowColor = vec3(0.85, 0.9, 1.0);
                    float edgeFade = smoothstep(0.5, 0.25, dist);
                    float alpha = glow * 0.2 * edgeFade;
                    gl_FragColor = vec4(glowColor, alpha);
                }
            `,
            uniforms: {},
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlowMesh.position.copy(this.moonMesh.position);
        outerGlowMesh.lookAt(0, 0, 0);
        outerGlowMesh.name = 'snowStormMoonOuterGlow';
        outerGlowMesh.renderOrder = -860;
        this.scene.add(outerGlowMesh);
    }

    private createSnowParticles(): void {
        const spread = 600;
        const height = 500;

        for (let i = 0; i < this.snowCount; i++) {
            this.snowPositions[i * 3] = (Math.random() - 0.5) * spread;
            this.snowPositions[i * 3 + 1] = Math.random() * height;
            this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;

            this.snowVelocities[i * 3] = (Math.random() - 0.5) * 0.08;
            this.snowVelocities[i * 3 + 1] = -0.4 - Math.random() * 0.6;
            this.snowVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.08;

            this.snowSizes[i] = 0.5 + Math.random() * 1.5;
            this.snowOpacities[i] = 0.4 + Math.random() * 0.5;
            this.snowRotations[i] = Math.random() * Math.PI * 2;
            this.snowTypes[i] = Math.random();
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(this.snowSizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(this.snowOpacities, 1));
        geometry.setAttribute('rotation', new THREE.BufferAttribute(this.snowRotations, 1));
        geometry.setAttribute('snowType', new THREE.BufferAttribute(this.snowTypes, 1));

        const material = new THREE.ShaderMaterial({
            vertexShader: snowParticleVertexShader,
            fragmentShader: snowParticleFragmentShader,
            uniforms: this.snowUniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.snowParticles = new THREE.Points(geometry, material);
        this.snowParticles.name = 'snowStormParticles';
        this.snowParticles.renderOrder = 100;
        this.scene.add(this.snowParticles);
    }

    private createLighting(): void {
        this.ambientLight = new THREE.AmbientLight(0x4466aa, 0.2);
        this.ambientLight.name = 'snowStormAmbient';
        this.scene.add(this.ambientLight);

        this.moonLight = new THREE.DirectionalLight(0xd0e0ff, 0.6);
        this.moonLight.position.set(600, 1600, -2500);
        this.moonLight.name = 'snowStormMoonLight';
        this.scene.add(this.moonLight);
    }

    private updateSnowParticles(deltaTime: number): void {
        const positions = this.snowParticles.geometry.attributes.position.array as Float32Array;
        const rotations = this.snowParticles.geometry.attributes.rotation.array as Float32Array;

        const spread = 600;
        const height = 500;
        const groundLevel = -5;

        for (let i = 0; i < this.snowCount; i++) {
            const idx = i * 3;

            positions[idx] += this.snowVelocities[idx] * deltaTime;
            positions[idx + 1] += this.snowVelocities[idx + 1] * deltaTime;
            positions[idx + 2] += this.snowVelocities[idx + 2] * deltaTime;

            rotations[i] += deltaTime * 0.2;

            if (positions[idx + 1] < groundLevel) {
                positions[idx] = (Math.random() - 0.5) * spread;
                positions[idx + 1] = height;
                positions[idx + 2] = (Math.random() - 0.5) * spread;
            }

            if (Math.abs(positions[idx]) > spread / 2) {
                positions[idx] = -Math.sign(positions[idx]) * spread / 2 + (Math.random() - 0.5) * 20;
            }
            if (Math.abs(positions[idx + 2]) > spread / 2) {
                positions[idx + 2] = -Math.sign(positions[idx + 2]) * spread / 2 + (Math.random() - 0.5) * 20;
            }
        }

        this.snowParticles.geometry.attributes.position.needsUpdate = true;
        this.snowParticles.geometry.attributes.rotation.needsUpdate = true;
    }

    update(deltaTime: number): void {
        this.time += deltaTime;
        this.skyUniforms.time.value = this.time;
        this.starsUniforms.time.value = this.time;
        this.snowUniforms.time.value = this.time;

        this.updateSnowParticles(deltaTime);
    }

    setStormIntensity(_intensity: number): void {
    }

    setWindStrength(_strength: number): void {
    }

    setSnowDensity(density: number): void {
        const targetCount = Math.floor(this.snowCount * density);
        for (let i = 0; i < this.snowCount; i++) {
            this.snowOpacities[i] = i < targetCount ? (0.6 + Math.random() * 0.4) : 0;
        }
        this.snowParticles.geometry.attributes.opacity.needsUpdate = true;
    }

    setVisible(visible: boolean): void {
        this.skyMesh.visible = visible;
        this.starsMesh.visible = visible;
        this.moonMesh.visible = visible;
        this.moonGlowMesh.visible = visible;
        this.snowParticles.visible = visible;
        this.ambientLight.visible = visible;
        this.moonLight.visible = visible;
    }

    dispose(): void {
        if (this.skyMesh) {
            this.skyMesh.geometry.dispose();
            (this.skyMesh.material as THREE.Material).dispose();
            this.scene.remove(this.skyMesh);
        }

        if (this.starsMesh) {
            this.starsMesh.geometry.dispose();
            (this.starsMesh.material as THREE.Material).dispose();
            this.scene.remove(this.starsMesh);
        }

        if (this.moonMesh) {
            this.moonMesh.geometry.dispose();
            (this.moonMesh.material as THREE.Material).dispose();
            this.scene.remove(this.moonMesh);
        }

        if (this.moonGlowMesh) {
            this.moonGlowMesh.geometry.dispose();
            (this.moonGlowMesh.material as THREE.Material).dispose();
            this.scene.remove(this.moonGlowMesh);
        }

        if (this.snowParticles) {
            this.snowParticles.geometry.dispose();
            (this.snowParticles.material as THREE.Material).dispose();
            this.scene.remove(this.snowParticles);
        }

        if (this.ambientLight) {
            this.scene.remove(this.ambientLight);
        }

        if (this.moonLight) {
            this.scene.remove(this.moonLight);
        }
    }
}
