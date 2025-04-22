from flask import Flask, request, jsonify
from sklearn.cluster import KMeans
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from your frontend

# Dummy training data representing usual user spending
# Format: [Essentials, Non-Essentials, Investments]
spending_data = np.array([
    [10000, 20000, 5000],
    [15000, 18000, 4000],
    [9000, 22000, 6000],
    [11000, 24000, 3000],
    [13000, 21000, 3500]
])

kmeans = KMeans(n_clusters=2, random_state=42)
kmeans.fit(spending_data)

@app.route('/check-budget-alert', methods=['POST'])
def check_budget():
    data = request.json
    subcategory = data.get('subcategory')
    amount = float(data.get('amount', 0))
    category = data.get('category')

    if category not in ['Essentials', 'Non-Essentials', 'Investments']:
        return jsonify({'notify': False})

    new_spending = [0, 0, 0]
    if category == 'Essentials':
        new_spending[0] = amount
    elif category == 'Non-Essentials':
        new_spending[1] = amount
    elif category == 'Investments':
        new_spending[2] = amount

    # Check cluster distance
    distances = kmeans.transform([new_spending])
    min_distance = min(distances[0])

    if min_distance > 8000:  # threshold distance
        return jsonify({
            'notify': True,
            'message': f"⚠️ Your {category} spending seems unusually high!"
        })

    return jsonify({'notify': False})

if __name__ == '__main__':
    app.run(port=5001)
