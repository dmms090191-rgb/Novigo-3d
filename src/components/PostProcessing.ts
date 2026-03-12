import * as THREE from 'three';

const bloomVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const bloomBrightPassShader = `
uniform sampler2D tDiffuse;
uniform float threshold;
uniform float smoothWidth;
varying vec2 vUv;

void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    float brightness = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));
    float contribution = smoothstep(threshold - smoothWidth, threshold + smoothWidth, brightness);
    gl_FragColor = vec4(texel.rgb * contribution, texel.a);
}
`;

const gaussianBlurShader = `
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform vec2 direction;
varying vec2 vUv;

void main() {
    vec2 texelSize = 1.0 / resolution;
    vec3 result = vec3(0.0);

    float weights[9];
    weights[0] = 0.0162162162;
    weights[1] = 0.0540540541;
    weights[2] = 0.1216216216;
    weights[3] = 0.1945945946;
    weights[4] = 0.2270270270;
    weights[5] = 0.1945945946;
    weights[6] = 0.1216216216;
    weights[7] = 0.0540540541;
    weights[8] = 0.0162162162;

    for(int i = -4; i <= 4; i++) {
        vec2 offset = direction * float(i) * texelSize;
        result += texture2D(tDiffuse, vUv + offset).rgb * weights[i + 4];
    }

    gl_FragColor = vec4(result, 1.0);
}
`;

const compositeShader = `
uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
uniform float bloomStrength;
uniform float exposure;
uniform float gamma;
varying vec2 vUv;

vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    vec4 baseColor = texture2D(tDiffuse, vUv);
    vec4 bloomColor = texture2D(tBloom, vUv);

    vec3 combined = baseColor.rgb + bloomColor.rgb * bloomStrength;
    combined *= exposure;
    combined = ACESFilm(combined);
    combined = pow(combined, vec3(1.0 / gamma));

    gl_FragColor = vec4(combined, baseColor.a);
}
`;

const vignetteShader = `
uniform sampler2D tDiffuse;
uniform float intensity;
uniform float smoothness;
varying vec2 vUv;

void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    vec2 uv = vUv * (1.0 - vUv.yx);
    float vig = uv.x * uv.y * 15.0;
    vig = pow(vig, intensity * smoothness);
    gl_FragColor = vec4(texel.rgb * vig, texel.a);
}
`;

export class HDRPostProcessing {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private width: number;
    private height: number;

    private renderTargetA: THREE.WebGLRenderTarget;
    private renderTargetB: THREE.WebGLRenderTarget;
    private renderTargetBright: THREE.WebGLRenderTarget;
    private renderTargetBlurH: THREE.WebGLRenderTarget;
    private renderTargetBlurV: THREE.WebGLRenderTarget;

    private fullScreenQuad: THREE.Mesh;
    private brightPassMaterial: THREE.ShaderMaterial;
    private blurMaterialH: THREE.ShaderMaterial;
    private blurMaterialV: THREE.ShaderMaterial;
    private compositeMaterial: THREE.ShaderMaterial;
    private vignetteMaterial: THREE.ShaderMaterial;

    private orthoCamera: THREE.OrthographicCamera;
    private orthoScene: THREE.Scene;

    public bloomStrength: number = 0.8;
    public bloomThreshold: number = 0.7;
    public exposure: number = 1.0;
    public gamma: number = 2.2;
    public vignetteIntensity: number = 0.3;
    public enabled: boolean = true;

    constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, width: number, height: number) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.width = width;
        this.height = height;

        const rtOptions = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.HalfFloatType,
        };

        this.renderTargetA = new THREE.WebGLRenderTarget(width, height, rtOptions);
        this.renderTargetB = new THREE.WebGLRenderTarget(width, height, rtOptions);
        this.renderTargetBright = new THREE.WebGLRenderTarget(width / 2, height / 2, rtOptions);
        this.renderTargetBlurH = new THREE.WebGLRenderTarget(width / 2, height / 2, rtOptions);
        this.renderTargetBlurV = new THREE.WebGLRenderTarget(width / 2, height / 2, rtOptions);

        this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.orthoScene = new THREE.Scene();

        const quadGeometry = new THREE.PlaneGeometry(2, 2);

        this.brightPassMaterial = new THREE.ShaderMaterial({
            vertexShader: bloomVertexShader,
            fragmentShader: bloomBrightPassShader,
            uniforms: {
                tDiffuse: { value: null },
                threshold: { value: this.bloomThreshold },
                smoothWidth: { value: 0.1 },
            },
        });

        this.blurMaterialH = new THREE.ShaderMaterial({
            vertexShader: bloomVertexShader,
            fragmentShader: gaussianBlurShader,
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(width / 2, height / 2) },
                direction: { value: new THREE.Vector2(1.0, 0.0) },
            },
        });

        this.blurMaterialV = new THREE.ShaderMaterial({
            vertexShader: bloomVertexShader,
            fragmentShader: gaussianBlurShader,
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(width / 2, height / 2) },
                direction: { value: new THREE.Vector2(0.0, 1.0) },
            },
        });

        this.compositeMaterial = new THREE.ShaderMaterial({
            vertexShader: bloomVertexShader,
            fragmentShader: compositeShader,
            uniforms: {
                tDiffuse: { value: null },
                tBloom: { value: null },
                bloomStrength: { value: this.bloomStrength },
                exposure: { value: this.exposure },
                gamma: { value: this.gamma },
            },
        });

        this.vignetteMaterial = new THREE.ShaderMaterial({
            vertexShader: bloomVertexShader,
            fragmentShader: vignetteShader,
            uniforms: {
                tDiffuse: { value: null },
                intensity: { value: this.vignetteIntensity },
                smoothness: { value: 0.5 },
            },
        });

        this.fullScreenQuad = new THREE.Mesh(quadGeometry, this.brightPassMaterial);
        this.orthoScene.add(this.fullScreenQuad);
    }

    render(): void {
        if (!this.enabled) {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        this.renderer.setRenderTarget(this.renderTargetA);
        this.renderer.render(this.scene, this.camera);

        this.brightPassMaterial.uniforms.tDiffuse.value = this.renderTargetA.texture;
        this.brightPassMaterial.uniforms.threshold.value = this.bloomThreshold;
        this.fullScreenQuad.material = this.brightPassMaterial;
        this.renderer.setRenderTarget(this.renderTargetBright);
        this.renderer.render(this.orthoScene, this.orthoCamera);

        this.blurMaterialH.uniforms.tDiffuse.value = this.renderTargetBright.texture;
        this.fullScreenQuad.material = this.blurMaterialH;
        this.renderer.setRenderTarget(this.renderTargetBlurH);
        this.renderer.render(this.orthoScene, this.orthoCamera);

        this.blurMaterialV.uniforms.tDiffuse.value = this.renderTargetBlurH.texture;
        this.fullScreenQuad.material = this.blurMaterialV;
        this.renderer.setRenderTarget(this.renderTargetBlurV);
        this.renderer.render(this.orthoScene, this.orthoCamera);

        for (let i = 0; i < 2; i++) {
            this.blurMaterialH.uniforms.tDiffuse.value = this.renderTargetBlurV.texture;
            this.fullScreenQuad.material = this.blurMaterialH;
            this.renderer.setRenderTarget(this.renderTargetBlurH);
            this.renderer.render(this.orthoScene, this.orthoCamera);

            this.blurMaterialV.uniforms.tDiffuse.value = this.renderTargetBlurH.texture;
            this.fullScreenQuad.material = this.blurMaterialV;
            this.renderer.setRenderTarget(this.renderTargetBlurV);
            this.renderer.render(this.orthoScene, this.orthoCamera);
        }

        this.compositeMaterial.uniforms.tDiffuse.value = this.renderTargetA.texture;
        this.compositeMaterial.uniforms.tBloom.value = this.renderTargetBlurV.texture;
        this.compositeMaterial.uniforms.bloomStrength.value = this.bloomStrength;
        this.compositeMaterial.uniforms.exposure.value = this.exposure;
        this.compositeMaterial.uniforms.gamma.value = this.gamma;
        this.fullScreenQuad.material = this.compositeMaterial;
        this.renderer.setRenderTarget(this.renderTargetB);
        this.renderer.render(this.orthoScene, this.orthoCamera);

        this.vignetteMaterial.uniforms.tDiffuse.value = this.renderTargetB.texture;
        this.vignetteMaterial.uniforms.intensity.value = this.vignetteIntensity;
        this.fullScreenQuad.material = this.vignetteMaterial;
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.orthoScene, this.orthoCamera);
    }

    setSize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        this.renderTargetA.setSize(width, height);
        this.renderTargetB.setSize(width, height);
        this.renderTargetBright.setSize(width / 2, height / 2);
        this.renderTargetBlurH.setSize(width / 2, height / 2);
        this.renderTargetBlurV.setSize(width / 2, height / 2);

        this.blurMaterialH.uniforms.resolution.value.set(width / 2, height / 2);
        this.blurMaterialV.uniforms.resolution.value.set(width / 2, height / 2);
    }

    dispose(): void {
        this.renderTargetA.dispose();
        this.renderTargetB.dispose();
        this.renderTargetBright.dispose();
        this.renderTargetBlurH.dispose();
        this.renderTargetBlurV.dispose();

        this.brightPassMaterial.dispose();
        this.blurMaterialH.dispose();
        this.blurMaterialV.dispose();
        this.compositeMaterial.dispose();
        this.vignetteMaterial.dispose();

        this.fullScreenQuad.geometry.dispose();
    }
}
