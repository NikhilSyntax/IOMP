import sys
import json
import numpy as np
from sklearn.cluster import KMeans

def calculate_risk(usage_data):
    """Calculate risk levels using KMeans clustering."""
    try:
        # Prepare data (normalize to 0-100 scale)
        X = np.array([
            [min(usage_data['essentials'], 100)],
            [min(usage_data['nonEssentials'], 100)],
            [min(usage_data['investments'], 100)]
        ])
        
        # Cluster into 3 risk levels
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        kmeans.fit(X)
        
        # Sort clusters by center values (ascending)
        sorted_indices = np.argsort(kmeans.cluster_centers_.flatten())
        
        # Map to risk levels
        risk_map = {
            sorted_indices[0]: 'low',
            sorted_indices[1]: 'medium', 
            sorted_indices[2]: 'high'
        }
        
        return {
            'essentials': risk_map[kmeans.labels_[0]],
            'nonEssentials': risk_map[kmeans.labels_[1]],
            'investments': risk_map[kmeans.labels_[2]],
            'overall': risk_map[max(kmeans.labels_)]
        }
        
    except Exception as e:
        raise RuntimeError(f"Risk calculation failed: {str(e)}")

if __name__ == "__main__":
    try:
        usage = json.loads(sys.argv[1])
        risk_levels = calculate_risk(usage)
        
        print(json.dumps({
            'status': 'success',
            'risk_levels': risk_levels,
            'usage': usage
        }))
        
    except Exception as e:
        print(json.dumps({
            'status': 'error',
            'message': str(e)
        }))
        sys.exit(1)