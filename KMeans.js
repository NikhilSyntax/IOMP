class KMeans {
    constructor(k = 2) {
      this.k = k;
      this.clusters = [];
    }
  
    train(data) {
      // Simple K-means implementation
      // Initialize centroids
      this.clusters = Array(this.k).fill().map((_, i) => ({
        centroid: data[i % data.length],
        points: []
      }));
  
      // Cluster points
      let changed;
      do {
        changed = false;
        this.clusters.forEach(c => c.points = []);
        
        data.forEach(point => {
          const closest = this.predict(point);
          this.clusters[closest].points.push(point);
        });
  
        this.clusters.forEach(cluster => {
          const newCentroid = this.calculateCentroid(cluster.points);
          if (!this.areEqual(newCentroid, cluster.centroid)) {
            cluster.centroid = newCentroid;
            changed = true;
          }
        });
      } while (changed);
    }
  
    predict(point) {
      return this.clusters.reduce((minIdx, cluster, idx) => {
        const distance = this.getDistance(point, cluster.centroid);
        return distance < minIdx.distance ? { idx, distance } : minIdx;
      }, { idx: 0, distance: Infinity }).idx;
    }
  
    getDistanceToCenter(point, clusterIdx) {
      return this.getDistance(point, this.clusters[clusterIdx].centroid);
    }
  
    // Helper methods
    calculateCentroid(points) {
      if (points.length === 0) return [0, 0];
      return points[0].map((_, i) => 
        points.reduce((sum, p) => sum + p[i], 0) / points.length
      );
    }
  
    getDistance(a, b) {
      return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
    }
  
    areEqual(a, b, threshold = 0.01) {
      return a.every((val, i) => Math.abs(val - b[i]) < threshold);
    }
  }