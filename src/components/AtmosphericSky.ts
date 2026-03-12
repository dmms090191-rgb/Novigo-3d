import * as THREE from 'three';

const skyVertexShader = `
varying vec3 vWorldPosition;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w;
}
`;

const skyFragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform float sunSize;
uniform float sunBloom;
uniform float atmosphereIntensity;

varying vec3 vWorldPosition;

void main() {
    vec3 direction = normalize(vWorldPosition);

    float heightFactor = direction.y * 0.5 + 0.5;
    heightFactor = pow(heightFactor, 0.8);

    vec3 skyColor = mix(bottomColor, topColor, heightFactor);

    float horizonGlow = 1.0 - abs(direction.y);
    horizonGlow = pow(horizonGlow, 3.0);
    vec3 horizonColor = mix(vec3(0.9, 0.85, 0.7), vec3(0.95, 0.9, 0.8), horizonGlow);
    skyColor = mix(skyColor, horizonColor, horizonGlow * 0.4 * atmosphereIntensity);

    vec3 normalizedSunDir = normalize(sunDirection);
    float sunAngle = dot(direction, normalizedSunDir);

    float sunDisk = smoothstep(1.0 - sunSize * 0.01, 1.0 - sunSize * 0.005, sunAngle);

    float sunGlow = pow(max(0.0, sunAngle), 8.0) * sunBloom;
    float sunHalo = pow(max(0.0, sunAngle), 64.0) * 2.0;

    vec3 finalColor = skyColor;
    finalColor += sunColor * sunGlow * 0.5;
    finalColor += sunColor * sunHalo;
    finalColor = mix(finalColor, sunColor * 2.0, sunDisk);

    float scattering = pow(max(0.0, sunAngle), 2.0) * (1.0 - abs(direction.y));
    finalColor += vec3(1.0, 0.8, 0.5) * scattering * 0.15 * atmosphereIntensity;

    gl_FragColor = vec4(finalColor, 1.0);
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
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform float cloudCoverage;
uniform float cloudDensity;
uniform float cloudSpeed;

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
    float frequency = 1.0;

    for(int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

void main() {
    vec2 uv = vUv * 3.0;
    uv.x += time * cloudSpeed * 0.015;

    float cloud = fbm(uv);
    cloud += fbm(uv * 2.0 + time * cloudSpeed * 0.01) * 0.5;
    cloud = cloud / 1.5;

    float threshold = 1.0 - cloudCoverage;
    cloud = smoothstep(threshold, threshold + 0.25, cloud);

    vec3 sunDir = normalize(sunDirection);
    float lightFactor = dot(vec3(0.0, 1.0, 0.0), sunDir) * 0.5 + 0.5;

    vec3 cloudBright = vec3(1.0, 0.98, 0.95);
    vec3 cloudDark = vec3(0.7, 0.75, 0.85);

    vec3 cloudColor = mix(cloudDark, cloudBright, cloud * 0.6 + lightFactor * 0.4);
    cloudColor += sunColor * 0.1 * lightFactor;

    float alpha = cloud * cloudDensity;
    alpha = clamp(alpha, 0.0, 0.85);

    gl_FragColor = vec4(cloudColor, alpha);
}
`;

export class AtmosphericSkySystem {
    private scene: THREE.Scene;
    private skyMesh: THREE.Mesh;
    private sunSphere: THREE.Mesh;
    private cloudPlane: THREE.Mesh;
    private sunLight: THREE.DirectionalLight;
    private hemisphereLight: THREE.HemisphereLight;
    private ambientLight: THREE.AmbientLight;
    private sunDirection: THREE.Vector3;
    private skyUniforms: {
        topColor: { value: THREE.Color };
        bottomColor: { value: THREE.Color };
        sunDirection: { value: THREE.Vector3 };
        sunColor: { value: THREE.Color };
        sunSize: { value: number };
        sunBloom: { value: number };
        atmosphereIntensity: { value: number };
    };
    private cloudUniforms: {
        time: { value: number };
        sunDirection: { value: THREE.Vector3 };
        sunColor: { value: THREE.Color };
        cloudCoverage: { value: number };
        cloudDensity: { value: number };
        cloudSpeed: { value: number };
    };
    private time: number = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.sunDirection = new THREE.Vector3(0.5, 0.7, 0.5).normalize();

        this.skyUniforms = {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0x89CFF0) },
            sunDirection: { value: this.sunDirection.clone() },
            sunColor: { value: new THREE.Color(0xffffee) },
            sunSize: { value: 1.0 },
            sunBloom: { value: 1.0 },
            atmosphereIntensity: { value: 1.0 },
        };

        this.cloudUniforms = {
            time: { value: 0.0 },
            sunDirection: { value: this.sunDirection.clone() },
            sunColor: { value: new THREE.Color(0xffffff) },
            cloudCoverage: { value: 0.5 },
            cloudDensity: { value: 0.7 },
            cloudSpeed: { value: 1.0 },
        };

        this.skyMesh = new THREE.Mesh();
        this.sunSphere = new THREE.Mesh();
        this.cloudPlane = new THREE.Mesh();
        this.sunLight = new THREE.DirectionalLight();
        this.hemisphereLight = new THREE.HemisphereLight();
        this.ambientLight = new THREE.AmbientLight();
    }

    init(): void {
        this.createSky();
        this.createSun();
        this.createClouds();
        this.createLighting();
    }

    private createSky(): void {
        const skyGeometry = new THREE.SphereGeometry(4000, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            vertexShader: skyVertexShader,
            fragmentShader: skyFragmentShader,
            uniforms: this.skyUniforms,
            side: THREE.BackSide,
            depthWrite: false,
        });

        this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.skyMesh.name = 'atmosphericSky';
        this.skyMesh.renderOrder = -1000;
        this.scene.add(this.skyMesh);
    }

    private createSun(): void {
        const sunGeometry = new THREE.SphereGeometry(100, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffdd,
            transparent: false,
        });
        this.sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sunSphere.name = 'sunSphere';
        this.sunSphere.renderOrder = -999;

        const glowGeometry = new THREE.SphereGeometry(150, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.name = 'sunGlow';
        this.sunSphere.add(glowMesh);

        this.scene.add(this.sunSphere);
    }

    private createClouds(): void {
        const cloudGeometry = new THREE.PlaneGeometry(6000, 6000, 1, 1);
        const cloudMaterial = new THREE.ShaderMaterial({
            vertexShader: cloudVertexShader,
            fragmentShader: cloudFragmentShader,
            uniforms: this.cloudUniforms,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        this.cloudPlane = new THREE.Mesh(cloudGeometry, cloudMaterial);
        this.cloudPlane.rotation.x = -Math.PI / 2;
        this.cloudPlane.position.y = 600;
        this.cloudPlane.name = 'cloudLayer';
        this.cloudPlane.renderOrder = -998;
        this.scene.add(this.cloudPlane);
    }

    private createLighting(): void {
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 1000;
        this.sunLight.shadow.camera.left = -200;
        this.sunLight.shadow.camera.right = 200;
        this.sunLight.shadow.camera.top = 200;
        this.sunLight.shadow.camera.bottom = -200;
        this.sunLight.shadow.bias = -0.0001;
        this.sunLight.name = 'atmosphericSunLight';
        this.scene.add(this.sunLight);

        this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8B7355, 0.5);
        this.hemisphereLight.name = 'atmosphericHemisphereLight';
        this.scene.add(this.hemisphereLight);

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.ambientLight.name = 'atmosphericAmbientLight';
        this.scene.add(this.ambientLight);
    }

    setSunPosition(elevation: number, azimuth: number): void {
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);

        this.sunDirection.setFromSphericalCoords(1, phi, theta);

        this.skyUniforms.sunDirection.value.copy(this.sunDirection);
        this.cloudUniforms.sunDirection.value.copy(this.sunDirection);

        const sunDistance = 3000;
        this.sunSphere.position.copy(this.sunDirection).multiplyScalar(sunDistance);

        this.sunLight.position.copy(this.sunDirection).multiplyScalar(200);
        this.sunLight.target.position.set(0, 0, 0);

        const sunIntensity = Math.max(0.3, Math.sin(THREE.MathUtils.degToRad(elevation)));
        this.sunLight.intensity = 1.2 + sunIntensity * 0.8;

        if (elevation < 25) {
            const t = elevation / 25;
            this.skyUniforms.topColor.value.setHex(0x0077ff).lerp(new THREE.Color(0xff6633), 1 - t);
            this.skyUniforms.bottomColor.value.setHex(0x89CFF0).lerp(new THREE.Color(0xffaa55), 1 - t);
            this.sunLight.color.setHSL(0.08, 0.9, 0.6 + t * 0.3);
        } else {
            this.skyUniforms.topColor.value.setHex(0x0077ff);
            this.skyUniforms.bottomColor.value.setHex(0x89CFF0);
            this.sunLight.color.setHex(0xffffff);
        }
    }

    update(deltaTime: number): void {
        this.time += deltaTime;
        this.cloudUniforms.time.value = this.time;
    }

    setCloudCoverage(coverage: number): void {
        this.cloudUniforms.cloudCoverage.value = coverage;
    }

    setCloudSpeed(speed: number): void {
        this.cloudUniforms.cloudSpeed.value = speed;
    }

    setRayleigh(value: number): void {
        this.skyUniforms.atmosphereIntensity.value = value / 2.0;
    }

    setTurbidity(value: number): void {
        this.skyUniforms.sunBloom.value = value / 4.0;
    }

    setVisible(visible: boolean): void {
        this.skyMesh.visible = visible;
        this.sunSphere.visible = visible;
        this.cloudPlane.visible = visible;
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
        if (this.sunSphere) {
            this.sunSphere.geometry.dispose();
            (this.sunSphere.material as THREE.Material).dispose();
            this.scene.remove(this.sunSphere);
        }
        if (this.cloudPlane) {
            this.cloudPlane.geometry.dispose();
            (this.cloudPlane.material as THREE.Material).dispose();
            this.scene.remove(this.cloudPlane);
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
