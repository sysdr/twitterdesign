import { promises as fs } from 'fs';
import * as path from 'path';
import * as tf from '@tensorflow/tfjs-node';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

export interface ModelMetadata {
  modelId: string;
  version: string;
  accuracy: number;
  latency_p95: number;
  throughput: number;
  trainingConfig: {
    datasetVersion: string;
    hyperparameters: Record<string, any>;
    framework: string;
    timestamp: Date;
  };
  status: 'training' | 'staging' | 'production' | 'archived';
  deploymentTimestamp?: Date;
}

export class ModelRegistry {
  private registryPath: string;
  private models: Map<string, ModelMetadata>;
  private loadedModels: Map<string, tf.GraphModel | tf.LayersModel>;

  constructor(registryPath: string = './models') {
    this.registryPath = registryPath;
    this.models = new Map();
    this.loadedModels = new Map();
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.registryPath, { recursive: true });
    await this.loadRegistry();
    logger.info('Model registry initialized', { 
      path: this.registryPath,
      modelCount: this.models.size 
    });
  }

  async registerModel(
    modelPath: string,
    metadata: Omit<ModelMetadata, 'modelId' | 'version'>
  ): Promise<ModelMetadata> {
    const modelId = uuidv4();
    const version = `v${Date.now()}`;
    
    const fullMetadata: ModelMetadata = {
      ...metadata,
      modelId,
      version,
    };

    // Save model to registry
    const modelDir = path.join(this.registryPath, modelId, version);
    await fs.mkdir(modelDir, { recursive: true });
    
    // Copy model files
    await fs.cp(modelPath, path.join(modelDir, 'model'), { recursive: true });
    
    // Save metadata
    await fs.writeFile(
      path.join(modelDir, 'metadata.json'),
      JSON.stringify(fullMetadata, null, 2)
    );

    this.models.set(`${modelId}:${version}`, fullMetadata);
    
    logger.info('Model registered', { modelId, version, status: metadata.status });
    
    return fullMetadata;
  }

  async loadModel(modelId: string, version: string): Promise<tf.GraphModel | tf.LayersModel> {
    const key = `${modelId}:${version}`;
    
    if (this.loadedModels.has(key)) {
      return this.loadedModels.get(key)!;
    }

    const modelPath = path.join(this.registryPath, modelId, version, 'model');
    
    try {
      const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      this.loadedModels.set(key, model);
      logger.info('Model loaded', { modelId, version });
      return model;
    } catch (error) {
      logger.error('Failed to load model', { modelId, version, error });
      throw error;
    }
  }

  async promoteModel(modelId: string, version: string): Promise<void> {
    const key = `${modelId}:${version}`;
    const metadata = this.models.get(key);
    
    if (!metadata) {
      throw new Error(`Model not found: ${key}`);
    }

    // Demote current production model
    for (const [k, m] of this.models.entries()) {
      if (m.status === 'production') {
        m.status = 'archived';
        this.models.set(k, m);
      }
    }

    // Promote new model
    metadata.status = 'production';
    metadata.deploymentTimestamp = new Date();
    this.models.set(key, metadata);

    await this.saveRegistry();
    
    logger.info('Model promoted to production', { modelId, version });
  }

  getProductionModel(): ModelMetadata | undefined {
    for (const metadata of this.models.values()) {
      if (metadata.status === 'production') {
        return metadata;
      }
    }
    return undefined;
  }

  listModels(status?: ModelMetadata['status']): ModelMetadata[] {
    const models = Array.from(this.models.values());
    return status ? models.filter(m => m.status === status) : models;
  }

  private async loadRegistry(): Promise<void> {
    try {
      const entries = await fs.readdir(this.registryPath);
      
      for (const modelId of entries) {
        const modelPath = path.join(this.registryPath, modelId);
        const stat = await fs.stat(modelPath);
        
        if (stat.isDirectory()) {
          const versions = await fs.readdir(modelPath);
          
          for (const version of versions) {
            const metadataPath = path.join(modelPath, version, 'metadata.json');
            try {
              const data = await fs.readFile(metadataPath, 'utf-8');
              const metadata = JSON.parse(data);
              this.models.set(`${modelId}:${version}`, metadata);
            } catch (error) {
              logger.warn('Failed to load model metadata', { modelId, version, error });
            }
          }
        }
      }
    } catch (error) {
      logger.warn('No existing registry found, starting fresh');
    }
  }

  private async saveRegistry(): Promise<void> {
    for (const [key, metadata] of this.models.entries()) {
      const [modelId, version] = key.split(':');
      const metadataPath = path.join(this.registryPath, modelId, version, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }
  }
}
