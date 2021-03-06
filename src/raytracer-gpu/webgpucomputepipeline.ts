import WebGPUPipelineBase from './webgpupipelinebase';
import WebGPUContext from './webgpucontext';
import { createBuffer } from './webgpuhelpers';
import Camera from '../camera';

interface ComputeUniformParams {
  fWidth: number;
  fHeight: number;
  fSamplesPerPixel: number;
  fMaxBounces: number;
  fSphereCount: number;
  fRandomSeed?: number;
}

interface WebGPUComputePiplineOptions {
  computeShaderUrl: string;
  uniformParams: ComputeUniformParams;
  randomScene: Float32Array;
  camera: Camera;
}

export default class WebGPUComputePipline extends WebGPUPipelineBase {
  private _options: WebGPUComputePiplineOptions;

  private _computeParamsUniformBuffer: GPUBuffer;
  private _computeParamsUniformBufferSize = 0;

  private _computeCameraUniformBuffer: GPUBuffer;
  private _computeCameraUniformBufferSize = 0;

  private _pixelBuffer: GPUBuffer;

  private _randomSceneBuffer: GPUBuffer;

  public constructor(options: WebGPUComputePiplineOptions) {
    super();
    this._options = options;
    this._options.uniformParams.fRandomSeed = Math.random();
  }

  public async initialize(context: WebGPUContext): Promise<void> {
    if (this._initialized) {
      return;
    }
    this._initialized = true;

    this._context = context;

    const pixelArray = new Float32Array(this._options.uniformParams.fWidth * this._options.uniformParams.fHeight * 4);
    this._pixelBuffer = createBuffer(
      this._context.device,
      pixelArray,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    );

    const uniformArray = this.getParamsArray(this._options.uniformParams);
    this._computeParamsUniformBufferSize = uniformArray.byteLength;
    this._computeParamsUniformBuffer = createBuffer(
      context.device,
      uniformArray,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );

    const cameraArray = this._options.camera.getUniformArray();
    this._computeCameraUniformBufferSize = cameraArray.byteLength;
    this._computeCameraUniformBuffer = createBuffer(
      context.device,
      cameraArray,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );

    this._randomSceneBuffer = createBuffer(this._context.device, this._options.randomScene, GPUBufferUsage.STORAGE);

    this._bindGroupLayout = this._context.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          type: 'uniform-buffer',
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          type: 'uniform-buffer',
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          type: 'storage-buffer',
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          type: 'storage-buffer',
        },
      ],
    });

    await this.createBindGroup();
  }

  public updateUniformBuffer(): void {
    if (this._initialized) {
      this._options.uniformParams.fRandomSeed = Math.random();
      const uniformArray = this.getParamsArray(this._options.uniformParams);
      this._context.queue.writeBuffer(this._computeParamsUniformBuffer, 0, uniformArray.buffer);
    }
  }

  protected async createBindGroup(): Promise<void> {
    this._bindGroup = this._context.device.createBindGroup({
      layout: this._bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this._computeParamsUniformBuffer,
            offset: 0,
            size: this._computeParamsUniformBufferSize,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this._computeCameraUniformBuffer,
            offset: 0,
            size: this._computeCameraUniformBufferSize,
          },
        },
        {
          binding: 2,
          resource: {
            buffer: this._randomSceneBuffer,
            offset: 0,
            size: this._options.randomScene.byteLength,
          },
        },
        {
          binding: 3,
          resource: {
            buffer: this._pixelBuffer,
            offset: 0,
            size:
              this._options.uniformParams.fWidth *
              this._options.uniformParams.fHeight *
              4 *
              Float32Array.BYTES_PER_ELEMENT,
          },
        },
      ],
    });

    this._bindGroup.label = `${this.name}-BindGroup`;

    const layout = this._context.device.createPipelineLayout({
      bindGroupLayouts: [this._bindGroupLayout],
    });

    const computeStage: GPUProgrammableStageDescriptor = {
      module: await this.loadShader(this._context, this._options.computeShaderUrl),
      entryPoint: 'main',
    };

    const pipelineDesc: GPUComputePipelineDescriptor = {
      layout,
      computeStage,
    };

    this._pipeline = this._context.device.createComputePipeline(pipelineDesc);
  }

  private createCamera(): Float32Array {
    const array = [];

    return new Float32Array(array);
  }

  public get gpuPipeline(): GPUComputePipeline {
    return this._pipeline as GPUComputePipeline;
  }

  public get pixelBuffer(): GPUBuffer {
    return this._pixelBuffer;
  }
}
