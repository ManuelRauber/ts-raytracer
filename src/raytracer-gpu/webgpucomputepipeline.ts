import WebGPUPipelineBase from './webgpupipelinebase';
import WebGPUContext from './webgpucontext';
import { createBuffer } from './webgpuhelpers';

interface ComputeUniformParams {
  iWidth: number;
  iHeight: number;
  iSamplesPerPixel: number;
  iMaxBounces: number;
}

interface WebGPUComputePiplineOptions {
  computeShaderUrl: string;
  unformParams: ComputeUniformParams;
}

export default class WebGPUComputePipline extends WebGPUPipelineBase {
  private _options: WebGPUComputePiplineOptions;
  private _bindGroupLayout: GPUBindGroupLayout;
  private _bindGroup: GPUBindGroup;

  private _computeParamsUniformBuffer: GPUBuffer;
  private _computeParamsUniformBufferSize = 0;
  private _pixelBuffer: GPUBuffer;

  private _context: WebGPUContext;

  public constructor(options: WebGPUComputePiplineOptions) {
    super();
    this._options = options;
  }

  public async initialize(context: WebGPUContext): Promise<void> {
    if (this._initialized) {
      return;
    }
    this._initialized = true;

    this._context = context;

    const pixelArray = new Float32Array(this._options.unformParams.iWidth * this._options.unformParams.iHeight * 4);
    this._pixelBuffer = createBuffer(
      this._context.device,
      pixelArray,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    );

    const uniformArray = this.getParamsArray();
    this._computeParamsUniformBufferSize = uniformArray.byteLength;
    this._computeParamsUniformBuffer = createBuffer(
      context.device,
      uniformArray,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );

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
          type: 'storage-buffer',
        },
      ],
    });

    await this.createBindGroup();
  }

  private async createBindGroup(): Promise<void> {
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
            buffer: this._pixelBuffer,
            offset: 0,
            size: this._options.unformParams.iWidth * this._options.unformParams.iHeight * 4 * 4,
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

  private getParamsArray(): Float32Array {
    const keys = Object.keys(this._options.unformParams);
    const array = [];
    for (let i = 0; i < keys.length; i++) {
      const val = this._options.unformParams[keys[i]];
      if (Array.isArray(val)) {
        array.push(...val);
      } else {
        array.push(val);
      }
    }
    return new Float32Array(array);
  }

  public get bindGroup(): GPUBindGroup {
    return this._bindGroup;
  }

  public get gpuPipeline(): GPUComputePipeline {
    return this._pipeline as GPUComputePipeline;
  }

  public get pixelBuffer(): GPUBuffer {
    return this._pixelBuffer;
  }
}
