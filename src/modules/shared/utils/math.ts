export const dotProduct = (vectorA: number[], vectorB: number[]) => {
  return vectorA.reduce((sum, a, idx) => sum + a * vectorB[idx], 0);
}

export const magnitude = (vector: number[]) => {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}

export const cosineSimilarity = (vectorA: number[], vectorB: number[]) => {
  return dotProduct(vectorA, vectorB) / (magnitude(vectorA) * magnitude(vectorB));
}