import * as THREE from 'three';

const starVertexShader = `
attribute float size;
attribute vec3 customColor;
attribute float twinklePhase;
attribute float twinkleSpeed;

varying vec3 vColor;
varying float vTwinklePhase;
varying float vTwinkleSpeed;

uniform float time;

void main() {
    vColor = customColor;
    vTwinklePhase = twinklePhase;
    vTwinkleSpeed = twinkleSpeed;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const starFragmentShader = `
varying vec3 vColor;
varying float vTwinklePhase;
varying float vTwinkleSpeed;

uniform float time;

void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float twinkle = sin(time * vTwinkleSpeed + vTwinklePhase) * 0.3 + 0.7;
    twinkle *= sin(time * vTwinkleSpeed * 0.7 + vTwinklePhase * 1.3) * 0.2 + 0.8;

    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 2.0);

    float spikes = 0.0;
    vec2 centered = gl_PointCoord - vec2(0.5);
    float angle = atan(centered.y, centered.x);
    spikes += pow(max(0.0, cos(angle * 4.0)), 8.0) * (1.0 - dist * 2.0) * 0.5;
    spikes += pow(max(0.0, cos(angle * 4.0 + 0.785)), 8.0) * (1.0 - dist * 2.0) * 0.3;

    float brightness = (core + glow * 0.6 + spikes) * twinkle;

    vec3 finalColor = vColor * brightness;
    finalColor += vec3(0.8, 0.9, 1.0) * core * 0.5;

    gl_FragColor = vec4(finalColor, brightness);
}
`;

const nebulaVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const nebulaFragmentShader = `
uniform float time;
uniform vec3 nebulaColor1;
uniform vec3 nebulaColor2;
uniform vec3 nebulaColor3;
uniform float intensity;

varying vec2 vUv;
varying vec3 vPosition;

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

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for(int i = 0; i < 8; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

void main() {
    vec2 uv = vUv * 3.0;

    float nebula1 = fbm(uv + time * 0.008);
    float nebula2 = fbm(uv * 1.3 - time * 0.006 + vec2(50.0, 30.0));
    float nebula3 = fbm(uv * 1.8 + time * 0.004 + vec2(100.0, 70.0));
    float nebula4 = fbm(uv * 2.5 - time * 0.003 + vec2(200.0, 150.0));

    float greenMask = smoothstep(0.3, 0.7, nebula1);
    float pinkMask = smoothstep(0.35, 0.75, nebula2);
    float detailMask = smoothstep(0.25, 0.65, nebula3);

    float swirl = sin(uv.x * 2.0 + nebula1 * 3.0 + time * 0.01) * 0.5 + 0.5;
    swirl *= cos(uv.y * 1.5 + nebula2 * 2.5 - time * 0.008) * 0.5 + 0.5;

    vec3 greenColor = nebulaColor1 * greenMask * (0.8 + nebula4 * 0.4);
    vec3 pinkColor = nebulaColor2 * pinkMask * (0.9 + nebula3 * 0.3);
    vec3 brightColor = nebulaColor3 * detailMask * swirl * 0.6;

    vec3 color = greenColor + pinkColor + brightColor;

    float coreGlow = pow(nebula1 * nebula2, 2.0) * 1.5;
    color += vec3(0.2, 0.4, 0.3) * coreGlow;
    color += vec3(0.4, 0.15, 0.25) * pow(detailMask, 2.0) * 0.5;

    float dustLanes = fbm(uv * 4.0 + vec2(300.0));
    dustLanes = smoothstep(0.4, 0.6, dustLanes);
    color *= 0.7 + dustLanes * 0.5;

    float combined = (nebula1 + nebula2 + nebula3 * 0.5) / 2.5;
    combined = pow(combined, 1.2);

    float alpha = combined * intensity * 0.25;
    alpha = clamp(alpha, 0.0, 0.45);

    gl_FragColor = vec4(color, alpha);
}
`;

const moonVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const moonFragmentShader = `
uniform vec3 sunDirection;
uniform float phase;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

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

float crater(vec2 uv, vec2 center, float radius) {
    float d = length(uv - center);
    float rim = smoothstep(radius, radius * 0.8, d) * (1.0 - smoothstep(radius * 0.7, radius * 0.5, d));
    float floor = smoothstep(radius * 0.6, radius * 0.3, d);
    return rim * 0.3 - floor * 0.2;
}

void main() {
    vec2 uv = vUv;

    vec3 baseColor = vec3(0.85, 0.85, 0.82);

    float n1 = noise(uv * 20.0) * 0.15;
    float n2 = noise(uv * 40.0) * 0.08;
    float n3 = noise(uv * 80.0) * 0.04;
    float detail = n1 + n2 + n3;

    float craters = 0.0;
    craters += crater(uv, vec2(0.3, 0.4), 0.08);
    craters += crater(uv, vec2(0.6, 0.3), 0.12);
    craters += crater(uv, vec2(0.45, 0.7), 0.1);
    craters += crater(uv, vec2(0.7, 0.6), 0.06);
    craters += crater(uv, vec2(0.2, 0.65), 0.07);
    craters += crater(uv, vec2(0.8, 0.4), 0.05);
    craters += crater(uv, vec2(0.5, 0.5), 0.15);
    craters += crater(uv, vec2(0.35, 0.25), 0.04);
    craters += crater(uv, vec2(0.65, 0.75), 0.055);

    float maria = noise(uv * 3.0);
    maria = smoothstep(0.45, 0.55, maria) * 0.15;

    vec3 moonColor = baseColor - detail - craters - maria;
    moonColor = clamp(moonColor, vec3(0.5), vec3(1.0));

    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(sunDirection);

    float NdotL = dot(normal, lightDir);
    float diffuse = max(0.0, NdotL);
    diffuse = pow(diffuse, 0.7);

    float ambient = 0.08;
    float lighting = ambient + diffuse * 0.92;

    vec2 centered = uv - vec2(0.5);
    float limbDarkening = 1.0 - length(centered) * 0.3;

    vec3 finalColor = moonColor * lighting * limbDarkening;

    float dist = length(centered);
    float edge = smoothstep(0.48, 0.5, dist);

    float glowDist = length(centered);
    float glow = exp(-glowDist * 3.0) * 0.3;
    finalColor += vec3(0.9, 0.95, 1.0) * glow;

    gl_FragColor = vec4(finalColor, 1.0 - edge);
}
`;

const nightSkyVertexShader = `
varying vec3 vWorldPosition;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w;
}
`;

const nightSkyFragmentShader = `
uniform vec3 zenithColor;
uniform vec3 horizonColor;
uniform vec3 nadirColor;
uniform float atmosphereGlow;
uniform vec3 moonPosition;
uniform float moonGlow;

varying vec3 vWorldPosition;

void main() {
    vec3 direction = normalize(vWorldPosition);

    float heightFactor = direction.y;

    vec3 skyColor;
    if (heightFactor > 0.0) {
        float t = pow(heightFactor, 0.6);
        skyColor = mix(horizonColor, zenithColor, t);
    } else {
        float t = pow(abs(heightFactor), 0.8);
        skyColor = mix(horizonColor, nadirColor, t);
    }

    float horizonGlow = 1.0 - abs(direction.y);
    horizonGlow = pow(horizonGlow, 4.0);
    skyColor += vec3(0.05, 0.08, 0.15) * horizonGlow * atmosphereGlow;

    vec3 moonDir = normalize(moonPosition);
    float moonAngle = dot(direction, moonDir);
    float moonHalo = pow(max(0.0, moonAngle), 16.0) * moonGlow * 0.3;
    float moonScatter = pow(max(0.0, moonAngle), 4.0) * moonGlow * 0.1;
    skyColor += vec3(0.6, 0.7, 0.9) * (moonHalo + moonScatter);

    gl_FragColor = vec4(skyColor, 1.0);
}
`;

interface StarData {
    positions: Float32Array;
    colors: Float32Array;
    sizes: Float32Array;
    twinklePhases: Float32Array;
    twinkleSpeeds: Float32Array;
}

export class NightSkySystem {
    private scene: THREE.Scene;
    private skyMesh: THREE.Mesh;
    private starsPoints: THREE.Points;
    private moonMesh: THREE.Mesh;
    private moonGlowMesh: THREE.Mesh;
    private nebulaPlane: THREE.Mesh;
    private moonLight: THREE.DirectionalLight;
    private ambientLight: THREE.AmbientLight;
    private starLight: THREE.PointLight;
    private time: number = 0;

    private skyUniforms: {
        zenithColor: { value: THREE.Color };
        horizonColor: { value: THREE.Color };
        nadirColor: { value: THREE.Color };
        atmosphereGlow: { value: number };
        moonPosition: { value: THREE.Vector3 };
        moonGlow: { value: number };
    };

    private starUniforms: {
        time: { value: number };
    };

    private moonUniforms: {
        sunDirection: { value: THREE.Vector3 };
        phase: { value: number };
    };

    private nebulaUniforms: {
        time: { value: number };
        nebulaColor1: { value: THREE.Color };
        nebulaColor2: { value: THREE.Color };
        nebulaColor3: { value: THREE.Color };
        intensity: { value: number };
    };

    private moonPosition: THREE.Vector3;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.moonPosition = new THREE.Vector3(-0.3, 0.6, 0.4).normalize();

        this.skyUniforms = {
            zenithColor: { value: new THREE.Color(0x000510) },
            horizonColor: { value: new THREE.Color(0x0a1525) },
            nadirColor: { value: new THREE.Color(0x000205) },
            atmosphereGlow: { value: 1.0 },
            moonPosition: { value: this.moonPosition.clone().multiplyScalar(3000) },
            moonGlow: { value: 1.0 },
        };

        this.starUniforms = {
            time: { value: 0 },
        };

        this.moonUniforms = {
            sunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
            phase: { value: 0.75 },
        };

        this.nebulaUniforms = {
            time: { value: 0 },
            nebulaColor1: { value: new THREE.Color(0x1aff6a) },
            nebulaColor2: { value: new THREE.Color(0xff5a8a) },
            nebulaColor3: { value: new THREE.Color(0x80ffb0) },
            intensity: { value: 1.2 },
        };

        this.skyMesh = new THREE.Mesh();
        this.starsPoints = new THREE.Points();
        this.moonMesh = new THREE.Mesh();
        this.moonGlowMesh = new THREE.Mesh();
        this.nebulaPlane = new THREE.Mesh();
        this.moonLight = new THREE.DirectionalLight();
        this.ambientLight = new THREE.AmbientLight();
        this.starLight = new THREE.PointLight();
    }

    init(): void {
        this.createNightSky();
        this.createStars();
        this.createMoon();
        this.createNebula();
        this.createLighting();
    }

    private createNightSky(): void {
        const skyGeometry = new THREE.SphereGeometry(4500, 64, 64);
        const skyMaterial = new THREE.ShaderMaterial({
            vertexShader: nightSkyVertexShader,
            fragmentShader: nightSkyFragmentShader,
            uniforms: this.skyUniforms,
            side: THREE.BackSide,
            depthWrite: false,
        });

        this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.skyMesh.name = 'nightSky';
        this.skyMesh.renderOrder = -1000;
        this.scene.add(this.skyMesh);
    }

    private generateStarData(count: number): StarData {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const twinklePhases = new Float32Array(count);
        const twinkleSpeeds = new Float32Array(count);

        const starColors = [
            new THREE.Color(0xffffff),
            new THREE.Color(0xffeedd),
            new THREE.Color(0xddddff),
            new THREE.Color(0xaaccff),
            new THREE.Color(0xffccaa),
            new THREE.Color(0xffffaa),
        ];

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 4000 + Math.random() * 200;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi));
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            const colorIndex = Math.floor(Math.random() * starColors.length);
            const color = starColors[colorIndex];
            const brightness = 0.6 + Math.random() * 0.4;
            colors[i * 3] = color.r * brightness;
            colors[i * 3 + 1] = color.g * brightness;
            colors[i * 3 + 2] = color.b * brightness;

            const sizeProbability = Math.random();
            if (sizeProbability < 0.7) {
                sizes[i] = 1.0 + Math.random() * 1.5;
            } else if (sizeProbability < 0.9) {
                sizes[i] = 2.5 + Math.random() * 2.0;
            } else {
                sizes[i] = 4.5 + Math.random() * 3.0;
            }

            twinklePhases[i] = Math.random() * Math.PI * 2;
            twinkleSpeeds[i] = 0.5 + Math.random() * 2.0;
        }

        return { positions, colors, sizes, twinklePhases, twinkleSpeeds };
    }

    private createStars(): void {
        const mainStars = this.generateStarData(8000);
        const brightStars = this.generateStarData(500);

        for (let i = 0; i < 500; i++) {
            brightStars.sizes[i] = 5.0 + Math.random() * 6.0;
            const brightness = 0.9 + Math.random() * 0.1;
            brightStars.colors[i * 3] *= brightness;
            brightStars.colors[i * 3 + 1] *= brightness;
            brightStars.colors[i * 3 + 2] *= brightness;
        }

        const totalCount = 8500;
        const positions = new Float32Array(totalCount * 3);
        const colors = new Float32Array(totalCount * 3);
        const sizes = new Float32Array(totalCount);
        const twinklePhases = new Float32Array(totalCount);
        const twinkleSpeeds = new Float32Array(totalCount);

        positions.set(mainStars.positions, 0);
        positions.set(brightStars.positions, 8000 * 3);
        colors.set(mainStars.colors, 0);
        colors.set(brightStars.colors, 8000 * 3);
        sizes.set(mainStars.sizes, 0);
        sizes.set(brightStars.sizes, 8000);
        twinklePhases.set(mainStars.twinklePhases, 0);
        twinklePhases.set(brightStars.twinklePhases, 8000);
        twinkleSpeeds.set(mainStars.twinkleSpeeds, 0);
        twinkleSpeeds.set(brightStars.twinkleSpeeds, 8000);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));
        geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

        const material = new THREE.ShaderMaterial({
            vertexShader: starVertexShader,
            fragmentShader: starFragmentShader,
            uniforms: this.starUniforms,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        this.starsPoints = new THREE.Points(geometry, material);
        this.starsPoints.name = 'stars';
        this.starsPoints.renderOrder = -999;
        this.scene.add(this.starsPoints);
    }

    private createMoon(): void {
        const moonGeometry = new THREE.SphereGeometry(180, 64, 64);
        const moonMaterial = new THREE.ShaderMaterial({
            vertexShader: moonVertexShader,
            fragmentShader: moonFragmentShader,
            uniforms: this.moonUniforms,
            transparent: true,
        });

        this.moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        this.moonMesh.name = 'moon';
        this.moonMesh.renderOrder = -997;

        const moonDistance = 3500;
        this.moonMesh.position.copy(this.moonPosition).multiplyScalar(moonDistance);
        this.scene.add(this.moonMesh);

        const glowGeometry = new THREE.SphereGeometry(280, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xc8d8ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
        });
        this.moonGlowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.moonGlowMesh.position.copy(this.moonMesh.position);
        this.moonGlowMesh.name = 'moonGlow';
        this.moonGlowMesh.renderOrder = -998;
        this.scene.add(this.moonGlowMesh);

        const outerGlowGeometry = new THREE.SphereGeometry(450, 32, 32);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x9aabcc,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlow.position.copy(this.moonMesh.position);
        outerGlow.name = 'moonOuterGlow';
        this.moonMesh.add(outerGlow);
    }

    private createNebula(): void {
        const nebulaGeometry = new THREE.PlaneGeometry(8000, 8000);
        const nebulaMaterial = new THREE.ShaderMaterial({
            vertexShader: nebulaVertexShader,
            fragmentShader: nebulaFragmentShader,
            uniforms: this.nebulaUniforms,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        this.nebulaPlane = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        this.nebulaPlane.rotation.x = -Math.PI / 2;
        this.nebulaPlane.position.y = 3500;
        this.nebulaPlane.name = 'nebula';
        this.nebulaPlane.renderOrder = -996;
        this.scene.add(this.nebulaPlane);
    }

    private createLighting(): void {
        this.moonLight = new THREE.DirectionalLight(0x8899cc, 0.4);
        this.moonLight.position.copy(this.moonPosition).multiplyScalar(200);
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.width = 2048;
        this.moonLight.shadow.mapSize.height = 2048;
        this.moonLight.shadow.camera.near = 0.5;
        this.moonLight.shadow.camera.far = 1000;
        this.moonLight.shadow.camera.left = -200;
        this.moonLight.shadow.camera.right = 200;
        this.moonLight.shadow.camera.top = 200;
        this.moonLight.shadow.camera.bottom = -200;
        this.moonLight.shadow.bias = -0.0001;
        this.moonLight.name = 'moonLight';
        this.scene.add(this.moonLight);

        this.ambientLight = new THREE.AmbientLight(0x1a2040, 0.15);
        this.ambientLight.name = 'nightAmbient';
        this.scene.add(this.ambientLight);

        this.starLight = new THREE.PointLight(0xffffff, 0.05, 5000);
        this.starLight.position.set(0, 2000, 0);
        this.starLight.name = 'starLight';
        this.scene.add(this.starLight);
    }

    update(deltaTime: number): void {
        this.time += deltaTime;
        this.starUniforms.time.value = this.time;
        this.nebulaUniforms.time.value = this.time;

        this.starsPoints.rotation.y += deltaTime * 0.001;
    }

    setMoonPosition(elevation: number, azimuth: number): void {
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);

        this.moonPosition.setFromSphericalCoords(1, phi, theta);

        const moonDistance = 3500;
        this.moonMesh.position.copy(this.moonPosition).multiplyScalar(moonDistance);
        this.moonGlowMesh.position.copy(this.moonMesh.position);

        this.skyUniforms.moonPosition.value.copy(this.moonMesh.position);
        this.moonLight.position.copy(this.moonPosition).multiplyScalar(200);
    }

    setMoonPhase(phase: number): void {
        this.moonUniforms.phase.value = phase;

        const sunAngle = (1 - phase) * Math.PI;
        this.moonUniforms.sunDirection.value.set(
            Math.cos(sunAngle),
            0.3,
            Math.sin(sunAngle)
        ).normalize();
    }

    setStarIntensity(intensity: number): void {
        const sizes = this.starsPoints.geometry.getAttribute('size') as THREE.BufferAttribute;
        const array = sizes.array as Float32Array;
        for (let i = 0; i < array.length; i++) {
            array[i] *= intensity;
        }
        sizes.needsUpdate = true;
    }

    setVisible(visible: boolean): void {
        this.skyMesh.visible = visible;
        this.starsPoints.visible = visible;
        this.moonMesh.visible = visible;
        this.moonGlowMesh.visible = visible;
        this.nebulaPlane.visible = visible;
        this.moonLight.visible = visible;
        this.ambientLight.visible = visible;
        this.starLight.visible = visible;
    }

    dispose(): void {
        if (this.skyMesh) {
            this.skyMesh.geometry.dispose();
            (this.skyMesh.material as THREE.Material).dispose();
            this.scene.remove(this.skyMesh);
        }
        if (this.starsPoints) {
            this.starsPoints.geometry.dispose();
            (this.starsPoints.material as THREE.Material).dispose();
            this.scene.remove(this.starsPoints);
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
        if (this.nebulaPlane) {
            this.nebulaPlane.geometry.dispose();
            (this.nebulaPlane.material as THREE.Material).dispose();
            this.scene.remove(this.nebulaPlane);
        }
        if (this.moonLight) {
            this.scene.remove(this.moonLight);
        }
        if (this.ambientLight) {
            this.scene.remove(this.ambientLight);
        }
        if (this.starLight) {
            this.scene.remove(this.starLight);
        }
    }
}
