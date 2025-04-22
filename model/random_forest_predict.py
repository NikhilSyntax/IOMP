import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'rf_model.joblib')


def train_and_save(csv_path: str = './data/survey_responses.csv'):
    # Load dataset and separate features and labels
    df = pd.read_csv(csv_path)
    X = df.drop('risk_label', axis=1)  # Features (remove 'risk_label' column)
    y = df['risk_label']  # Target label (risk_label)

    # Initialize and train the Random Forest model
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X, y)

    # Save the trained model to a file
    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


def load_model():
    try:
        # Verify if the file exists
        if not os.path.exists(MODEL_PATH):
            print(f"❌ Model file not found at {MODEL_PATH}")
            return None
        
        # Load the model from the joblib file
        model = joblib.load(MODEL_PATH)
        if isinstance(model, RandomForestClassifier):
            print("✅ Model loaded successfully.")
            return model
        else:
            print(f"❌ Loaded object is not a RandomForestClassifier")
            return None
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None


def predict_responses(model, responses: dict):
    try:
        # Convert the responses into a DataFrame to match the model's input format
        df = pd.DataFrame([responses])
        # Check if the model is correctly loaded
        if model is not None and hasattr(model, 'predict'):
            prediction = model.predict(df)
            return prediction[0]  # Return the predicted risk label
        else:
            raise ValueError("Invalid model object or model not loaded correctly")
    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        raise e


if __name__ == '__main__':
    # For training and saving the model (run once)
    train_and_save()
