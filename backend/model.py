import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import joblib

# Your app's expected features
FEATURES = ['Total Assets', 'Total Liabilities', 'Net Income', 'Cash Flow', 
            'Debt-to-Equity', 'Current Ratio', 'Revenue']

def load_real_data(file_path='bankruptcy_data.csv'):
    """Load and preprocess real bankruptcy data from Kaggle CSV."""
    try:
        data = pd.read_csv(file_path)
        print(f"Loaded real data with {len(data)} records")
        print("Available columns:", data.columns.tolist())

        # Map Kaggle columns to your FEATURES
        mapped_data = pd.DataFrame()
        mapped_data['Bankrupt'] = data['Bankrupt?']  # Direct mapping

        # Approximate mappings (using ratios and scaling where necessary)
        # Assume a base Total Assets value for scaling ratios
        base_assets = 1000000  # Arbitrary base for scaling ratios to absolute values
        mapped_data['Total Assets'] = base_assets  # Placeholder (could use ' Total Asset Growth Rate' with scaling)
        mapped_data['Total Liabilities'] = data[' Total debt/Total net worth'].fillna(0.5) * mapped_data['Total Assets']  # Scale ratio
        mapped_data['Net Income'] = data[' Net Income to Total Assets'].fillna(0) * mapped_data['Total Assets']  # Scale ratio
        mapped_data['Cash Flow'] = data[' Cash Flow to Total Assets'].fillna(0) * mapped_data['Total Assets']  # Scale ratio
        mapped_data['Debt-to-Equity'] = data[' Debt ratio %'].fillna(0.5)  # Approximation
        mapped_data['Current Ratio'] = data[' Current Ratio'].fillna(1.0)  # Direct match
        mapped_data['Revenue'] = data[' Revenue Per Share (Yuan ¥)'].fillna(100000) * 100  # Scale to approximate total revenue

        # Handle missing values
        mapped_data = mapped_data.fillna(0)
        return mapped_data
    except Exception as e:
        print(f"Error loading CSV: {str(e)}")
        return generate_synthetic_data()

def generate_synthetic_data(n_samples=1000):
    """Fallback synthetic data generator."""
    np.random.seed(42)
    data = pd.DataFrame({
        'Total Assets': np.random.uniform(10000, 10000000, n_samples),
        'Total Liabilities': np.random.uniform(5000, 8000000, n_samples),
        'Net Income': np.random.uniform(-500000, 1000000, n_samples),
        'Cash Flow': np.random.uniform(-200000, 500000, n_samples),
        'Debt-to-Equity': np.random.uniform(0.1, 5.0, n_samples),
        'Current Ratio': np.random.uniform(0.5, 3.0, n_samples),
        'Revenue': np.random.uniform(10000, 12000000, n_samples)
    })
    data['Bankrupt'] = np.where(
        (data['Debt-to-Equity'] > 2) & 
        (data['Current Ratio'] < 1) & 
        (data['Net Income'] < 0), 
        1, 0
    )
    return data

def train_model():
    data = load_real_data()
    X = data[FEATURES]
    y = data['Bankrupt']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    model = LogisticRegression(random_state=42)
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy:.2f}")
    joblib.dump(model, 'bankruptcy_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    return model, scaler

def load_model():
    try:
        model = joblib.load('bankruptcy_model.pkl')
        scaler = joblib.load('scaler.pkl')
        return model, scaler
    except FileNotFoundError:
        raise Exception("Model or scaler file not found. Please train the model first.")

def predict_bankruptcy(input_data):
    model, scaler = load_model()
    input_df = pd.DataFrame([input_data], columns=FEATURES)
    input_scaled = scaler.transform(input_df)
    risk_prob = model.predict_proba(input_scaled)[0][1]
    risk_score = int(risk_prob * 100)
    confidence = 95
    risk_factors = {}
    if input_data['Debt-to-Equity'] > 2:
        risk_factors['High Debt-to-Equity'] = 40
    if input_data['Current Ratio'] < 1:
        risk_factors['Low Liquidity'] = 30
    if input_data['Net Income'] < 0:
        risk_factors['Negative Profitability'] = 20
    if input_data['Cash Flow'] < 0:
        risk_factors['Negative Cash Flow'] = 10
    return risk_score, confidence, risk_factors

if __name__ == "__main__":
    train_model()