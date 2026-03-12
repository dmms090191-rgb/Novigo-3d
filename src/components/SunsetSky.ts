import * as THREE from 'three';

const sunsetSkyVertexShader = `
varying vec3 vWorldPosition;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w;
}
`;

const sunsetSkyFragmentShader = `
uniform vec3 sunPosition;

varying vec3 vWorldPosition;

void main() {
    vec3 direction = normalize(vWorldPosition);
    vec3 sunDir = normalize(sunPosition);

    float y = direction.y;
    float t = y * 0.5 + 0.5;

    vec3 veryDarkBlue = vec3(0.01, 0.02, 0.12);
    vec3 deepBlue = vec3(0.02, 0.04, 0.18);
    vec3 midBlue = vec3(0.04, 0.10, 0.32);
    vec3 transitionBlue = vec3(0.08, 0.15, 0.40);
    vec3 warmTransition = vec3(0.35, 0.20, 0.25);
    vec3 deepMagenta = vec3(0.55, 0.15, 0.18);
    vec3 brightRed = vec3(0.85, 0.18, 0.08);
    vec3 fireOrange = vec3(0.98, 0.45, 0.08);
    vec3 intenseOrange = vec3(1.0, 0.55, 0.12);
    vec3 goldenOrange = vec3(1.0, 0.65, 0.18);
    vec3 deepRed = vec3(0.80, 0.10, 0.02);
    vec3 darkRed = vec3(0.55, 0.05, 0.01);

    vec3 skyColor;

    if (t > 0.82) {
        skyColor = mix(deepBlue, veryDarkBlue, (t - 0.82) / 0.18);
    } else if (t > 0.68) {
        skyColor = mix(midBlue, deepBlue, (t - 0.68) / 0.14);
    } else if (t > 0.55) {
        skyColor = mix(transitionBlue, midBlue, (t - 0.55) / 0.13);
    } else if (t > 0.45) {
        skyColor = mix(warmTransition, transitionBlue, (t - 0.45) / 0.10);
    } else if (t > 0.38) {
        skyColor = mix(deepMagenta, warmTransition, (t - 0.38) / 0.07);
    } else if (t > 0.32) {
        skyColor = mix(brightRed, deepMagenta, (t - 0.32) / 0.06);
    } else if (t > 0.26) {
        skyColor = mix(fireOrange, brightRed, (t - 0.26) / 0.06);
    } else if (t > 0.20) {
        skyColor = mix(intenseOrange, fireOrange, (t - 0.20) / 0.06);
    } else if (t > 0.14) {
        skyColor = mix(goldenOrange, intenseOrange, (t - 0.14) / 0.06);
    } else if (t > 0.08) {
        skyColor = mix(deepRed, goldenOrange, (t - 0.08) / 0.06);
    } else {
        skyColor = mix(darkRed, deepRed, t / 0.08);
    }

    float sunDot = dot(direction, sunDir);
    float sunInfluence = pow(max(0.0, sunDot), 2.0);
    skyColor = mix(skyColor, intenseOrange, sunInfluence * 0.35);

    float horizonGlow = exp(-abs(y) * 3.5);
    skyColor += vec3(1.0, 0.40, 0.08) * horizonGlow * 0.35;

    float redGlow = exp(-abs(y) * 2.0) * (1.0 - abs(direction.x) * 0.2);
    skyColor += vec3(0.70, 0.12, 0.02) * redGlow * 0.30;

    float orangeBand = exp(-pow((t - 0.22) * 8.0, 2.0));
    skyColor += vec3(0.95, 0.50, 0.10) * orangeBand * 0.25;

    gl_FragColor = vec4(skyColor, 1.0);
}
`;

const sunDiscVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const sunDiscFragmentShader = `
varying vec2 vUv;

void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    vec3 sunCore = vec3(0.95, 0.30, 0.05);
    vec3 sunMid = vec3(0.85, 0.18, 0.02);
    vec3 sunEdge = vec3(0.75, 0.10, 0.01);

    vec3 color;
    if (dist < 0.18) {
        color = mix(sunCore, sunMid, dist / 0.18);
    } else if (dist < 0.32) {
        color = mix(sunMid, sunEdge, (dist - 0.18) / 0.14);
    } else {
        color = sunEdge;
    }

    float alpha = 1.0 - smoothstep(0.30, 0.40, dist);
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
}
`;

const sunGlowFragmentShader = `
varying vec2 vUv;

void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    vec3 innerColor = vec3(0.90, 0.25, 0.03);
    vec3 outerColor = vec3(0.75, 0.12, 0.01);

    float glow = exp(-dist * dist * 10.0);
    vec3 color = mix(outerColor, innerColor, glow);

    float alpha = glow * smoothstep(0.5, 0.08, dist) * 0.70;

    gl_FragColor = vec4(color, alpha);
}
`;

const sunOuterGlowFragmentShader = `
varying vec2 vUv;

void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    vec3 color = vec3(0.80, 0.15, 0.01);

    float glow = exp(-dist * dist * 4.5);
    float alpha = glow * smoothstep(0.5, 0.04, dist) * 0.40;

    gl_FragColor = vec4(color, alpha);
}
`;

const cloudVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const cloudFragmentShader = `
uniform float time;
uniform vec3 sunPosition;
uniform float cloudDensity;

varying vec2 vUv;
varying vec3 vWorldPosition;

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
    for (int i = 0; i < 7; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vUv;
    uv.x += time * 0.004;

    float cloud1 = fbm(uv * 2.0 + vec2(time * 0.001, 0.0));
    float cloud2 = fbm(uv * 4.0 + vec2(5.0, time * 0.002));
    float cloud3 = fbm(uv * 8.0 + vec2(10.0, 3.0));

    float clouds = cloud1 * 0.55 + cloud2 * 0.30 + cloud3 * 0.15;

    float threshold = 1.0 - cloudDensity;
    clouds = smoothstep(threshold, threshold + 0.25, clouds);

    vec3 sunDir = normalize(sunPosition);
    vec2 sunUV = vec2(0.5 + sunDir.x * 0.35, 0.5 - sunDir.z * 0.25);
    float distToSun = length(vUv - sunUV);
    float sunProximity = 1.0 - smoothstep(0.0, 0.6, distToSun);

    vec3 darkCloud = vec3(0.08, 0.05, 0.06);
    vec3 midCloud = vec3(0.25, 0.15, 0.12);
    vec3 brightCloud = vec3(0.85, 0.55, 0.25);
    vec3 sunlitCloud = vec3(1.0, 0.75, 0.40);
    vec3 goldEdge = vec3(1.0, 0.60, 0.15);

    float lightFactor = fbm(uv * 2.5 + vec2(time * 0.003, 0.0));
    lightFactor = lightFactor * 0.5 + 0.5;
    lightFactor *= pow(sunProximity, 0.6) * 0.65 + 0.35;

    vec3 cloudColor = mix(darkCloud, midCloud, lightFactor * 0.8);
    cloudColor = mix(cloudColor, brightCloud, pow(lightFactor, 1.8) * sunProximity);
    cloudColor = mix(cloudColor, sunlitCloud, pow(sunProximity, 2.5) * lightFactor);

    float edge = smoothstep(threshold, threshold + 0.12, clouds) * (1.0 - smoothstep(threshold + 0.12, threshold + 0.25, clouds));
    cloudColor += goldEdge * edge * sunProximity * 2.0;

    float rimLight = pow(1.0 - clouds, 4.0) * sunProximity;
    cloudColor += vec3(1.0, 0.50, 0.10) * rimLight * 0.6;

    float alpha = clouds * 0.95;

    float edgeFade = smoothstep(0.0, 0.18, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    alpha *= edgeFade;

    gl_FragColor = vec4(cloudColor, alpha);
}
`;

const sunRayVertexShader = `
attribute float rayIndex;
attribute float rayProgress;

uniform vec3 sunWorldPos;
uniform float time;

varying float vProgress;
varying float vRayIndex;
varying float vIntensity;

float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

void main() {
    vProgress = rayProgress;
    vRayIndex = rayIndex;

    float rayAngle = rayIndex * 0.2244 + hash(rayIndex) * 0.3;
    float rayLength = 2500.0 + hash(rayIndex * 7.3) * 1500.0;

    float pulse = sin(time * 0.5 + rayIndex * 0.5) * 0.15 + 0.85;
    float flicker = hash(rayIndex + floor(time * 2.0)) * 0.1 + 0.9;
    vIntensity = pulse * flicker;

    float spreadAngle = rayAngle;
    float verticalSpread = (hash(rayIndex * 3.7) - 0.5) * 0.6;

    vec3 rayDir = vec3(
        sin(spreadAngle) * cos(verticalSpread),
        sin(verticalSpread) * 0.3 - rayProgress * 0.15,
        cos(spreadAngle) * cos(verticalSpread)
    );

    vec3 pos = sunWorldPos + rayDir * rayProgress * rayLength;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = mix(35.0, 3.0, rayProgress) * vIntensity;
}
`;

const sunRayFragmentShader = `
uniform float intensity;

varying float vProgress;
varying float vRayIndex;
varying float vIntensity;

void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    if (dist > 0.5) discard;

    float falloff = 1.0 - smoothstep(0.0, 0.5, dist);

    vec3 coreColor = vec3(1.0, 0.85, 0.5);
    vec3 midColor = vec3(1.0, 0.5, 0.15);
    vec3 outerColor = vec3(0.9, 0.25, 0.05);

    vec3 color = mix(outerColor, midColor, falloff);
    color = mix(color, coreColor, pow(falloff, 3.0));

    float alpha = falloff * (1.0 - vProgress * 0.7) * intensity * vIntensity * 0.6;

    gl_FragColor = vec4(color, alpha);
}
`;

const waterVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const waterFragmentShader = `
uniform vec3 sunPosition;
uniform float time;

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
    vec3 sunDir = normalize(sunPosition);
    float sunX = 0.5 + sunDir.x * 0.35;

    vec2 waveUV = vUv * vec2(25.0, 4.0);
    waveUV.x += time * 0.25;
    float wave = noise(waveUV) * 0.5 + noise(waveUV * 2.0 + time * 0.4) * 0.25;

    vec3 deepWater = vec3(0.55, 0.30, 0.15);
    vec3 waterMid = vec3(0.75, 0.45, 0.22);
    vec3 waterHighlight = vec3(1.0, 0.65, 0.30);
    vec3 sunReflection = vec3(1.0, 0.80, 0.45);

    float distToSunX = abs(vUv.x - sunX);
    float reflectionWidth = 0.12 + wave * 0.04;
    float reflection = smoothstep(reflectionWidth, 0.0, distToSunX);
    reflection *= (0.65 + wave * 0.7);

    float sparkle = noise(vUv * vec2(80.0, 15.0) + time * 1.5);
    sparkle = pow(sparkle, 10.0) * reflection * 2.5;

    vec3 waterColor = mix(deepWater, waterMid, vUv.y * 0.8 + wave * 0.2);
    waterColor = mix(waterColor, waterHighlight, reflection * 0.55);
    waterColor = mix(waterColor, sunReflection, pow(reflection, 2.0) * 0.7);
    waterColor += vec3(1.0, 0.85, 0.55) * sparkle;

    float distFade = smoothstep(0.0, 0.25, vUv.y);
    float alpha = 0.92 * distFade;

    gl_FragColor = vec4(waterColor, alpha);
}
`;

export class SunsetSkySystem {
    private scene: THREE.Scene;
    private skyMesh: THREE.Mesh;
    private sunMesh: THREE.Mesh;
    private sunGlowMesh: THREE.Mesh;
    private sunOuterGlowMesh: THREE.Mesh;
    private cloudLayers: THREE.Mesh[];
    private sunRays: THREE.Points;
    private waterPlane: THREE.Mesh;
    private sunLight: THREE.DirectionalLight;
    private ambientLight: THREE.AmbientLight;
    private hemisphereLight: THREE.HemisphereLight;
    private sunPosition: THREE.Vector3;
    private sunWorldPosition: THREE.Vector3;
    private time: number = 0;

    private skyUniforms: {
        sunPosition: { value: THREE.Vector3 };
    };

    private cloudUniforms: {
        time: { value: number };
        sunPosition: { value: THREE.Vector3 };
        cloudDensity: { value: number };
    };

    private sunRayUniforms: {
        sunWorldPos: { value: THREE.Vector3 };
        time: { value: number };
        intensity: { value: number };
    };

    private waterUniforms: {
        sunPosition: { value: THREE.Vector3 };
        time: { value: number };
    };

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.sunPosition = new THREE.Vector3(0.0, 0.15, 1.0).normalize();
        this.sunWorldPosition = new THREE.Vector3(0, 500, 4000);
        this.cloudLayers = [];

        this.skyUniforms = {
            sunPosition: { value: this.sunPosition.clone() }
        };

        this.cloudUniforms = {
            time: { value: 0.0 },
            sunPosition: { value: this.sunPosition.clone() },
            cloudDensity: { value: 0.55 }
        };

        this.sunRayUniforms = {
            sunWorldPos: { value: this.sunWorldPosition.clone() },
            time: { value: 0.0 },
            intensity: { value: 0.85 }
        };

        this.waterUniforms = {
            sunPosition: { value: this.sunPosition.clone() },
            time: { value: 0.0 }
        };

        this.skyMesh = new THREE.Mesh();
        this.sunMesh = new THREE.Mesh();
        this.sunGlowMesh = new THREE.Mesh();
        this.sunOuterGlowMesh = new THREE.Mesh();
        this.sunRays = new THREE.Points();
        this.waterPlane = new THREE.Mesh();
        this.sunLight = new THREE.DirectionalLight();
        this.ambientLight = new THREE.AmbientLight();
        this.hemisphereLight = new THREE.HemisphereLight();
    }

    init(): void {
        this.createSky();
        this.createSun();
        this.createClouds();
        this.createSunRays();
        this.createWater();
        this.createLighting();
    }

    private createSky(): void {
        const skyGeometry = new THREE.SphereGeometry(4500, 64, 64);
        const skyMaterial = new THREE.ShaderMaterial({
            vertexShader: sunsetSkyVertexShader,
            fragmentShader: sunsetSkyFragmentShader,
            uniforms: this.skyUniforms,
            side: THREE.BackSide,
            depthWrite: false
        });

        this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.skyMesh.name = 'sunsetSky';
        this.skyMesh.renderOrder = -1000;
        this.scene.add(this.skyMesh);
    }

    private createSun(): void {
        const sunDistance = 4000;
        const sunPos = new THREE.Vector3(0, 500, sunDistance);

        const sunGeometry = new THREE.PlaneGeometry(320, 320);
        const sunMaterial = new THREE.ShaderMaterial({
            vertexShader: sunDiscVertexShader,
            fragmentShader: sunDiscFragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sunMesh.position.copy(sunPos);
        this.sunMesh.lookAt(0, 0, 0);
        this.sunMesh.name = 'sunsetSun';
        this.sunMesh.renderOrder = -980;
        this.scene.add(this.sunMesh);

        const glowGeometry = new THREE.PlaneGeometry(700, 700);
        const glowMaterial = new THREE.ShaderMaterial({
            vertexShader: sunDiscVertexShader,
            fragmentShader: sunGlowFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        this.sunGlowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sunGlowMesh.position.copy(sunPos);
        this.sunGlowMesh.lookAt(0, 0, 0);
        this.sunGlowMesh.name = 'sunsetSunGlow';
        this.sunGlowMesh.renderOrder = -985;
        this.scene.add(this.sunGlowMesh);

        const outerGlowGeometry = new THREE.PlaneGeometry(1200, 1200);
        const outerGlowMaterial = new THREE.ShaderMaterial({
            vertexShader: sunDiscVertexShader,
            fragmentShader: sunOuterGlowFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        this.sunOuterGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        this.sunOuterGlowMesh.position.copy(sunPos);
        this.sunOuterGlowMesh.lookAt(0, 0, 0);
        this.sunOuterGlowMesh.name = 'sunsetSunOuterGlow';
        this.sunOuterGlowMesh.renderOrder = -988;
        this.scene.add(this.sunOuterGlowMesh);
    }

    private createClouds(): void {
    }

    private createSunRays(): void {
        const numRays = 28;
        const pointsPerRay = 50;
        const totalPoints = numRays * pointsPerRay;

        const positions = new Float32Array(totalPoints * 3);
        const rayIndices = new Float32Array(totalPoints);
        const rayProgress = new Float32Array(totalPoints);

        for (let ray = 0; ray < numRays; ray++) {
            for (let p = 0; p < pointsPerRay; p++) {
                const idx = (ray * pointsPerRay + p);
                positions[idx * 3] = 0;
                positions[idx * 3 + 1] = 0;
                positions[idx * 3 + 2] = 0;
                rayIndices[idx] = ray;
                rayProgress[idx] = p / pointsPerRay;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('rayIndex', new THREE.BufferAttribute(rayIndices, 1));
        geometry.setAttribute('rayProgress', new THREE.BufferAttribute(rayProgress, 1));

        const material = new THREE.ShaderMaterial({
            vertexShader: sunRayVertexShader,
            fragmentShader: sunRayFragmentShader,
            uniforms: this.sunRayUniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.sunRays = new THREE.Points(geometry, material);
        this.sunRays.name = 'sunRays';
        this.sunRays.renderOrder = -850;
        this.scene.add(this.sunRays);
    }

    private createWater(): void {
        const waterGeometry = new THREE.PlaneGeometry(12000, 3500);
        const waterMaterial = new THREE.ShaderMaterial({
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            uniforms: this.waterUniforms,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.waterPlane = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterPlane.rotation.x = -Math.PI / 2;
        this.waterPlane.position.set(0, -8, 1800);
        this.waterPlane.name = 'sunsetWater';
        this.waterPlane.renderOrder = -700;
        this.scene.add(this.waterPlane);
    }

    private createLighting(): void {
        this.sunLight = new THREE.DirectionalLight(0xffa040, 2.2);
        this.sunLight.position.copy(this.sunPosition).multiplyScalar(200);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -200;
        this.sunLight.shadow.camera.right = 200;
        this.sunLight.shadow.camera.top = 200;
        this.sunLight.shadow.camera.bottom = -200;
        this.sunLight.shadow.bias = -0.0001;
        this.sunLight.name = 'sunsetSunLight';
        this.scene.add(this.sunLight);

        this.hemisphereLight = new THREE.HemisphereLight(0xffaa55, 0x553311, 0.7);
        this.hemisphereLight.name = 'sunsetHemisphereLight';
        this.scene.add(this.hemisphereLight);

        this.ambientLight = new THREE.AmbientLight(0xff8855, 0.4);
        this.ambientLight.name = 'sunsetAmbientLight';
        this.scene.add(this.ambientLight);
    }

    private updateSunPosition(): void {
        const sunDistance = 4000;
        const sunPos = new THREE.Vector3(0, 500, sunDistance);

        this.sunMesh.position.copy(sunPos);
        this.sunMesh.lookAt(0, 0, 0);

        this.sunGlowMesh.position.copy(sunPos);
        this.sunGlowMesh.lookAt(0, 0, 0);

        this.sunOuterGlowMesh.position.copy(sunPos);
        this.sunOuterGlowMesh.lookAt(0, 0, 0);

        this.sunWorldPosition.copy(sunPos);
        this.sunRayUniforms.sunWorldPos.value.copy(sunPos);

        this.sunLight.position.set(0, 100, 200);
    }

    setSunPosition(elevation: number, azimuth: number): void {
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);

        this.sunPosition.setFromSphericalCoords(1, phi, theta);

        this.skyUniforms.sunPosition.value.copy(this.sunPosition);
        this.cloudUniforms.sunPosition.value.copy(this.sunPosition);
        this.waterUniforms.sunPosition.value.copy(this.sunPosition);

        this.updateSunPosition();
    }

    update(deltaTime: number): void {
        this.time += deltaTime;
        this.cloudUniforms.time.value = this.time;
        this.sunRayUniforms.time.value = this.time;
        this.waterUniforms.time.value = this.time;
    }

    setCloudDensity(density: number): void {
        this.cloudUniforms.cloudDensity.value = density;
        this.cloudLayers.forEach((layer, index) => {
            const material = layer.material as THREE.ShaderMaterial;
            material.uniforms.cloudDensity.value = density - index * 0.10;
        });
    }

    setGodRaysIntensity(intensity: number): void {
        this.sunRayUniforms.intensity.value = intensity;
    }

    setVisible(visible: boolean): void {
        this.skyMesh.visible = visible;
        this.sunMesh.visible = visible;
        this.sunGlowMesh.visible = visible;
        this.sunOuterGlowMesh.visible = visible;
        this.cloudLayers.forEach(layer => layer.visible = visible);
        if (this.sunRays) this.sunRays.visible = visible;
        if (this.waterPlane) this.waterPlane.visible = visible;
        this.sunLight.visible = visible;
        this.hemisphereLight.visible = visible;
        this.ambientLight.visible = visible;
    }

    dispose(): void {
        if (this.skyMesh) {
            this.skyMesh.geometry.dispose();
            (this.skyMesh.material as THREE.Material).dispose();
            this.scene.remove(this.skyMesh);
        }
        if (this.sunMesh) {
            this.sunMesh.geometry.dispose();
            (this.sunMesh.material as THREE.Material).dispose();
            this.scene.remove(this.sunMesh);
        }
        if (this.sunGlowMesh) {
            this.sunGlowMesh.geometry.dispose();
            (this.sunGlowMesh.material as THREE.Material).dispose();
            this.scene.remove(this.sunGlowMesh);
        }
        if (this.sunOuterGlowMesh) {
            this.sunOuterGlowMesh.geometry.dispose();
            (this.sunOuterGlowMesh.material as THREE.Material).dispose();
            this.scene.remove(this.sunOuterGlowMesh);
        }
        this.cloudLayers.forEach(layer => {
            layer.geometry.dispose();
            (layer.material as THREE.Material).dispose();
            this.scene.remove(layer);
        });
        if (this.sunRays) {
            this.sunRays.geometry.dispose();
            (this.sunRays.material as THREE.Material).dispose();
            this.scene.remove(this.sunRays);
        }
        if (this.waterPlane) {
            this.waterPlane.geometry.dispose();
            (this.waterPlane.material as THREE.Material).dispose();
            this.scene.remove(this.waterPlane);
        }
        if (this.sunLight) {
            this.scene.remove(this.sunLight);
        }
        if (this.hemisphereLight) {
            this.scene.remove(this.hemisphereLight);
        }
        if (this.ambientLight) {
            this.scene.remove(this.ambientLight);
        }
    }
}
