import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'om-silk',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./ngx-silk.component.html",
  styleUrl: './ngx-silk.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxSilkComponent implements AfterViewInit, OnDestroy {
  @ViewChild('OmSilk') containerRef!: ElementRef<HTMLDivElement>;

  @Input()
  set speed(val: number) {
    this.speedSignal.set(val);
    if (this.uniforms) this.uniforms['uSpeed'].value = val;
  }

  @Input()
  set scale(val: number) {
    this.scaleSignal.set(val);
    if (this.uniforms) this.uniforms['uScale'].value = val;
  }

  @Input()
  set color(val: string) {
    this.colorSignal.set(val);
    if (this.uniforms) {
      const colorNorm = this.hexToNormalizedRGB(val);
      this.uniforms['uColor'].value.set(...colorNorm);
    }
  }

  @Input()
  set noiseIntensity(val: number) {
    this.noiseIntensitySignal.set(val);
    if (this.uniforms) this.uniforms['uNoiseIntensity'].value = val;
  }

  @Input()
  set rotation(val: number) {
    this.rotationSignal.set(val);
    if (this.uniforms) this.uniforms['uRotation'].value = val;
  }

  speedSignal = signal(0.1);
  scaleSignal = signal(1);
  colorSignal = signal('#7B7481');
  noiseIntensitySignal = signal(1.5);
  rotationSignal = signal(0);

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private mesh?: THREE.Mesh;
  private animationFrameId?: number;
  private uniforms?: { [k: string]: THREE.IUniform };
  private intersectionObserver?: IntersectionObserver;
  private resizeListener?: () => void;
  private running = false;
  isInView = signal(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.setupScene();
    this.observeInView();
    this.handleResize();
  }

  ngOnDestroy() {
    this.running = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.intersectionObserver) this.intersectionObserver.disconnect();
    if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
    if (this.renderer) {
      this.containerRef.nativeElement.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }

  private observeInView() {
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      const wasInView = this.isInView();
      this.isInView.set(entry.isIntersecting);
      if (!wasInView && this.isInView()) {
        this.running = true;
        this.animate();
      }
      if (wasInView && !this.isInView()) {
        this.running = false;
      }
    });
    this.intersectionObserver.observe(this.containerRef.nativeElement);
  }

  private setupScene() {
    if (this.renderer) {
      this.containerRef.nativeElement.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }

    this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    this.renderer.setClearColor(0x000000, 0);

    this.containerRef.nativeElement.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const aspect = this.containerRef.nativeElement.clientWidth / this.containerRef.nativeElement.clientHeight || 1;
    this.camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    const colorNorm = this.hexToNormalizedRGB(this.colorSignal());
    this.uniforms = {
      uSpeed: {value: this.speedSignal()},
      uScale: {value: this.scaleSignal()},
      uNoiseIntensity: {value: this.noiseIntensitySignal()},
      uColor: {value: new THREE.Color(...colorNorm)},
      uRotation: {value: this.rotationSignal()},
      uTime: {value: 0},
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader(),
      fragmentShader: this.fragmentShader(),
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.onResize();
  }

  private animate = () => {
    if (!this.running) return;
    if (!this.uniforms) return;
    this.uniforms['uTime'].value += 0.1;
    this.renderer?.render(this.scene!, this.camera!);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private handleResize() {
    this.resizeListener = () => this.onResize();
    window.addEventListener('resize', this.resizeListener);
    this.onResize();
  }

  private onResize() {
    if (!this.renderer || !this.camera) return;
    const width = this.containerRef.nativeElement.clientWidth;
    const height = this.containerRef.nativeElement.clientHeight;
    this.renderer.setSize(width, height, false);

    const aspect = width / height || 1;
    const cam = this.camera as THREE.OrthographicCamera;
    cam.left = -aspect;
    cam.right = aspect;
    cam.top = 1;
    cam.bottom = -1;
    cam.updateProjectionMatrix();

    if (this.mesh) {
      this.mesh.scale.set(aspect > 1 ? aspect : 1, aspect < 1 ? 1 / aspect : 1, 1);
    }
  }

  private vertexShader(): string {
    return `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private fragmentShader(): string {
    return `
      varying vec2 vUv;
      varying vec3 vPosition;

      uniform float uTime;
      uniform vec3  uColor;
      uniform float uSpeed;
      uniform float uScale;
      uniform float uRotation;
      uniform float uNoiseIntensity;

      const float e = 2.71828182845904523536;

      float noise(vec2 texCoord) {
        float G = e;
        vec2  r = (G * sin(G * texCoord));
        return fract(r.x * r.y * (1.0 + texCoord.x));
      }

      vec2 rotateUvs(vec2 uv, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        mat2  rot = mat2(c, -s, s, c);
        return rot * uv;
      }

      void main() {
        float rnd        = noise(gl_FragCoord.xy);
        vec2  uv         = rotateUvs(vUv * uScale, uRotation);
        vec2  tex        = uv * uScale;
        float tOffset    = uSpeed * uTime;

        tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

        float pattern = 0.6 +
                        0.4 * sin(5.0 * (tex.x + tex.y +
                                         cos(3.0 * tex.x + 5.0 * tex.y) +
                                         0.02 * tOffset) +
                                 sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

        vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
        col.a = 1.0;
        gl_FragColor = col;
      }
    `;
  }

  private hexToNormalizedRGB(hex: string): [number, number, number] {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
    ];
  }
}
