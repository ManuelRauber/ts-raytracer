import WebGPUObjectBase from './webgpuobjectbase';
import WebGPUContext from './webgpucontext';

export default abstract class WebGPUPipelineBase extends WebGPUObjectBase {
  protected _initialized = false;
  protected _pipeline: GPURenderPipeline | GPUComputePipeline;

  protected async loadShader(context: WebGPUContext, shaderUrl: string): Promise<GPUShaderModule> {
    const response = await fetch(shaderUrl);
    const buffer = await response.arrayBuffer();

    const shaderModule = context.device.createShaderModule({
      code: new Uint32Array(buffer),
    });

    return shaderModule;
  }

  public get gpuPipeline(): GPURenderPipeline | GPUComputePipeline {
    return this._pipeline;
  }
}