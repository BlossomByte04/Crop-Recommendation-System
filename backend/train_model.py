import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import re

np.random.seed(42)

print("Reading Karnataka_Kharif_crop_Final_Data.csv...")
df_raw = pd.read_csv('../Karnataka_Kharif_crop_Final_Data.csv')

# We need to extract the overall Optimum_Range for each crop and attribute to generate synthetic training data.
# The user's prompt states: Model inputs = N, P, K, temperature, humidity, ph, rainfall.
# Outputs = recommended crop

def parse_range(range_str):
    if pd.isna(range_str): return None
    # Extract numbers from "20-30 °C" or "100-150 kg/ha"
    nums = re.findall(r'\d+\.?\d*', str(range_str))
    if len(nums) >= 2:
        return (float(nums[0]), float(nums[1]))
    elif len(nums) == 1:
        return (float(nums[0]) * 0.9, float(nums[0]) * 1.1)
    return None

crop_profiles = {}
crops = df_raw['Crop'].unique()

for crop in crops:
    crop_df = df_raw[df_raw['Crop'] == crop]
    profile = {}
    
    # Map dataset attributes to our model features
    attr_map = {
        'Soil Nitrogen': 'N',
        'Soil Phosphorus': 'P',
        'Soil Potassium': 'K',
        'Temperature': 'temperature',
        'Rainfall': 'rainfall',
        # Fallbacks/Defaults since not all attributes might be in the CSV for all crops
    }
    
    for df_attr, model_feature in attr_map.items():
        attr_df = crop_df[crop_df['Attribute'].str.contains(df_attr, case=False, na=False)]
        if not attr_df.empty:
            # Get the optimum range for the first stage (or take average)
            opt_range_str = attr_df.iloc[0]['Optimum_Range']
            parsed = parse_range(opt_range_str)
            if parsed:
                profile[model_feature] = parsed
    
    # Fill defaults for things not explicitly in the dataset (like humidity, ph)
    if 'N' not in profile: profile['N'] = (60, 100)
    if 'P' not in profile: profile['P'] = (30, 60)
    if 'K' not in profile: profile['K'] = (40, 80)
    if 'temperature' not in profile: profile['temperature'] = (20, 32)
    if 'rainfall' not in profile: profile['rainfall'] = (100, 200)
    profile['humidity'] = (60, 80)  # Default for Kharif
    profile['ph'] = (5.5, 7.5)      # Default broad range
    
    crop_profiles[crop] = profile

print(f"Extracted profiles for {len(crop_profiles)} crops.")

rows = []
for crop, profile in crop_profiles.items():
    n_samples = 300  # 300 samples per crop
    N = np.random.uniform(*profile["N"], n_samples)
    P = np.random.uniform(*profile["P"], n_samples)
    K = np.random.uniform(*profile["K"], n_samples)
    ph = np.random.uniform(*profile["ph"], n_samples)
    temp = np.random.uniform(*profile["temperature"], n_samples)
    rain = np.random.uniform(*profile["rainfall"], n_samples)
    hum = np.random.uniform(*profile["humidity"], n_samples)

    for i in range(n_samples):
        rows.append({
            "N": round(N[i], 2),
            "P": round(P[i], 2),
            "K": round(K[i], 2),
            "temperature": round(temp[i], 2),
            "humidity": round(hum[i], 2),
            "ph": round(ph[i], 2),
            "rainfall": round(rain[i], 2),
            "label": crop,
        })

df = pd.DataFrame(rows)
print(f"Training samples: {len(df)}")
print(f"Class distribution:\n{df['label'].value_counts()}")

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
X = df[FEATURES]
y = df["label"]

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

print("\nTraining Random Forest model...")
model = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy: {accuracy * 100:.2f}%")

# Save models
os.makedirs("ml", exist_ok=True)
joblib.dump(model, "ml/crop_model.joblib")
joblib.dump(label_encoder, "ml/label_encoder.joblib")

print("\nModel saved to ml/crop_model.joblib")
print("Label encoder saved to ml/label_encoder.joblib")
