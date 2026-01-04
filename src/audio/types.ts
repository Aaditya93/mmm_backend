export interface AudioTokenUsage {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AudioCost {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface AudioGenerationResult {
  audioUrl: string;
  localPath: string;
  tokenUsage: AudioTokenUsage;
  cost: AudioCost;
}

export interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}
