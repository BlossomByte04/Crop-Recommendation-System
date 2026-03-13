"""
Generate synthetic Karnataka_Kharif_crop_Final_Data.csv
This script creates a realistic dataset for Karnataka Kharif crops
with growth stages, environmental thresholds, and cost estimates.
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

DISTRICTS = [
    "Belagavi", "Dharwad", "Haveri", "Gadag", "Uttara Kannada",
    "Mysuru", "Mandya", "Tumkur", "Hassan", "Chikkamagaluru",
    "Raichur", "Koppal", "Ballari", "Vijayapura", "Yadgir",
    "Kalaburagi", "Bidar", "Chitradurga", "Davanagere", "Shivamogga"
]

CROPS = [
    "Paddy", "Maize", "Sorghum", "Cotton", "Groundnut",
    "Soybean", "Sunflower", "Ragi", "Tur Dal", "Green Gram"
]

SEASONS = ["Kharif"]

SOWING_WINDOWS = {
    "Paddy": "June 15 - July 15",
    "Maize": "June 1 - July 1",
    "Sorghum": "June 15 - July 15",
    "Cotton": "May 15 - June 30",
    "Groundnut": "June 1 - July 15",
    "Soybean": "June 15 - July 15",
    "Sunflower": "June 15 - July 20",
    "Ragi": "June 15 - July 31",
    "Tur Dal": "June 1 - July 15",
    "Green Gram": "June 15 - July 15",
}

HARVEST_WINDOWS = {
    "Paddy": "Oct 15 - Nov 30",
    "Maize": "Sep 15 - Oct 30",
    "Sorghum": "Oct 1 - Nov 15",
    "Cotton": "Dec 1 - Jan 31",
    "Groundnut": "Sep 15 - Oct 31",
    "Soybean": "Sep 20 - Oct 20",
    "Sunflower": "Oct 1 - Nov 15",
    "Ragi": "Oct 1 - Nov 15",
    "Tur Dal": "Dec 15 - Jan 31",
    "Green Gram": "Sep 1 - Sep 30",
}

STAGES = {
    "Paddy": [
        ("Land Preparation", "Day 1-7", 1, 7),
        ("Nursery / Seed Sowing", "Day 8-21", 8, 21),
        ("Transplanting", "Day 22-30", 22, 30),
        ("Tillering", "Day 31-55", 31, 55),
        ("Panicle Initiation", "Day 56-80", 56, 80),
        ("Flowering", "Day 81-100", 81, 100),
        ("Grain Filling", "Day 101-120", 101, 120),
        ("Harvest", "Day 121-135", 121, 135),
    ],
    "Maize": [
        ("Land Preparation", "Day 1-5", 1, 5),
        ("Seed Sowing", "Day 6-10", 6, 10),
        ("Germination", "Day 11-20", 11, 20),
        ("Vegetative Growth", "Day 21-55", 21, 55),
        ("Tasseling", "Day 56-70", 56, 70),
        ("Silking & Pollination", "Day 71-85", 71, 85),
        ("Grain Filling", "Day 86-105", 86, 105),
        ("Harvest", "Day 106-120", 106, 120),
    ],
    "Sorghum": [
        ("Land Preparation", "Day 1-5", 1, 5),
        ("Seed Sowing", "Day 6-10", 6, 10),
        ("Germination", "Day 11-18", 11, 18),
        ("Vegetative Growth", "Day 19-50", 19, 50),
        ("Booting", "Day 51-70", 51, 70),
        ("Heading", "Day 71-90", 71, 90),
        ("Grain Filling", "Day 91-110", 91, 110),
        ("Harvest", "Day 111-125", 111, 125),
    ],
    "Cotton": [
        ("Land Preparation", "Day 1-7", 1, 7),
        ("Seed Sowing", "Day 8-15", 8, 15),
        ("Germination", "Day 16-25", 16, 25),
        ("Squaring", "Day 26-60", 26, 60),
        ("Flowering", "Day 61-90", 61, 90),
        ("Boll Formation", "Day 91-130", 91, 130),
        ("Boll Opening", "Day 131-160", 131, 160),
        ("Harvest", "Day 161-180", 161, 180),
    ],
    "Groundnut": [
        ("Land Preparation", "Day 1-5", 1, 5),
        ("Seed Sowing", "Day 6-10", 6, 10),
        ("Germination", "Day 11-18", 11, 18),
        ("Vegetative Growth", "Day 19-40", 19, 40),
        ("Flowering", "Day 41-55", 41, 55),
        ("Pegging", "Day 56-75", 56, 75),
        ("Pod Development", "Day 76-100", 76, 100),
        ("Harvest", "Day 101-115", 101, 115),
    ],
    "Soybean": [
        ("Land Preparation", "Day 1-5", 1, 5),
        ("Seed Sowing", "Day 6-10", 6, 10),
        ("Germination", "Day 11-18", 11, 18),
        ("Vegetative Growth", "Day 19-45", 19, 45),
        ("Flowering", "Day 46-65", 46, 65),
        ("Pod Fill", "Day 66-90", 66, 90),
        ("Maturity", "Day 91-105", 91, 105),
        ("Harvest", "Day 106-115", 106, 115),
    ],
    "Sunflower": [
        ("Land Preparation", "Day 1-5", 1, 5),
        ("Seed Sowing", "Day 6-10", 6, 10),
        ("Germination", "Day 11-18", 11, 18),
        ("Vegetative Growth", "Day 19-45", 19, 45),
        ("Bud Development", "Day 46-65", 46, 65),
        ("Flowering", "Day 66-80", 66, 80),
        ("Seed Fill", "Day 81-100", 81, 100),
        ("Harvest", "Day 101-115", 101, 115),
    ],
    "Ragi": [
        ("Land Preparation", "Day 1-5", 1, 5),
        ("Seed Sowing", "Day 6-10", 6, 10),
        ("Germination", "Day 11-18", 11, 18),
        ("Vegetative Growth", "Day 19-50", 19, 50),
        ("Tillering", "Day 51-70", 51, 70),
        ("Heading", "Day 71-90", 71, 90),
        ("Grain Filling", "Day 91-110", 91, 110),
        ("Harvest", "Day 111-120", 111, 120),
    ],
    "Tur Dal": [
        ("Land Preparation", "Day 1-5", 1, 5),
        ("Seed Sowing", "Day 6-12", 6, 12),
        ("Germination", "Day 13-20", 13, 20),
        ("Vegetative Growth", "Day 21-60", 21, 60),
        ("Flowering", "Day 61-100", 61, 100),
        ("Pod Formation", "Day 101-140", 101, 140),
        ("Maturity", "Day 141-170", 141, 170),
        ("Harvest", "Day 171-185", 171, 185),
    ],
    "Green Gram": [
        ("Land Preparation", "Day 1-5", 1, 5),
        ("Seed Sowing", "Day 6-10", 6, 10),
        ("Germination", "Day 11-18", 11, 18),
        ("Vegetative Growth", "Day 19-35", 19, 35),
        ("Flowering", "Day 36-50", 36, 50),
        ("Pod Formation", "Day 51-65", 51, 65),
        ("Maturity", "Day 66-75", 66, 75),
        ("Harvest", "Day 76-85", 76, 85),
    ],
}

ATTRIBUTES = [
    ("temperature", "°C", 25, 32, 20, 24, 33, 37, 15, 19, 38, 42),
    ("rainfall", "mm", 80, 150, 50, 79, 151, 200, 20, 49, 201, 300),
    ("humidity", "%", 60, 80, 45, 59, 81, 90, 30, 44, 91, 100),
    ("soil_nitrogen", "kg/ha", 60, 100, 40, 59, 101, 130, 10, 39, 131, 180),
    ("soil_phosphorus", "kg/ha", 30, 60, 15, 29, 61, 80, 5, 14, 81, 120),
    ("soil_potassium", "kg/ha", 40, 80, 20, 39, 81, 110, 5, 19, 111, 150),
    ("soil_ph", "pH units", 5.5, 7.0, 5.0, 5.4, 7.1, 7.5, 4.0, 4.9, 7.6, 8.5),
]

STAGE_COSTS = {
    "Land Preparation": 1500,
    "Nursery / Seed Sowing": 800,
    "Seed Sowing": 800,
    "Germination": 200,
    "Transplanting": 1200,
    "Vegetative Growth": 2000,
    "Tillering": 1000,
    "Squaring": 1000,
    "Flowering": 1500,
    "Panicle Initiation": 1200,
    "Tasseling": 1000,
    "Silking & Pollination": 800,
    "Booting": 900,
    "Heading": 900,
    "Bud Development": 900,
    "Pegging": 1000,
    "Pod Development": 1200,
    "Pod Fill": 1200,
    "Pod Formation": 1200,
    "Grain Filling": 1500,
    "Boll Formation": 2000,
    "Boll Opening": 1000,
    "Seed Fill": 1500,
    "Maturity": 500,
    "Harvest": 2500,
}

ACTION_MAP = {
    "temperature": {
        "Slightly_Low": "Apply light mulching to retain warmth. Avoid early morning irrigation.",
        "Very_Low": "Use crop covers / tunnels. Delay sowing. Apply potassium-based fertilizers.",
        "Slightly_High": "Irrigate during cooler parts of the day. Apply light mulching.",
        "Very_High": "Provide shade nets. Increase irrigation frequency. Monitor for heat stress.",
    },
    "rainfall": {
        "Slightly_Low": "Supplement with light irrigation. Mulch to retain moisture.",
        "Very_Low": "Activate drip/sprinkler irrigation immediately. Reduce plant density.",
        "Slightly_High": "Ensure proper field drainage. Monitor for waterlogging.",
        "Very_High": "Drain excess water. Raise field bunds. Watch for fungal diseases.",
    },
    "humidity": {
        "Slightly_Low": "Irrigate at regular intervals. Mulch to conserve soil moisture.",
        "Very_Low": "Use mist irrigation. Increase watering frequency. Provide windbreaks.",
        "Slightly_High": "Improve ventilation between plants. Apply fungicide prophylactically.",
        "Very_High": "Apply fungicide immediately. Ensure proper row spacing for air circulation.",
    },
    "soil_nitrogen": {
        "Slightly_Low": "Apply 25 kg/ha Urea as top dressing.",
        "Very_Low": "Apply 40-50 kg/ha Urea immediately. Consider foliar spray of 1% Urea.",
        "Slightly_High": "Reduce nitrogenous fertilizer application. Monitor for lodging.",
        "Very_High": "Halt nitrogen application. Increase irrigation to leach excess. Monitor for lodging.",
    },
    "soil_phosphorus": {
        "Slightly_Low": "Apply 15 kg/ha DAP as band placement.",
        "Very_Low": "Apply 25-30 kg/ha Super Phosphate. Use rock phosphate in acidic soils.",
        "Slightly_High": "Reduce phosphorus application in next cycle. Apply zinc to balance.",
        "Very_High": "Halt phosphorus application. Apply zinc sulfate 5 kg/ha.",
    },
    "soil_potassium": {
        "Slightly_Low": "Apply 15 kg/ha MOP (Muriate of Potash).",
        "Very_Low": "Apply 25-30 kg/ha MOP urgently. Check for deficiency symptoms.",
        "Slightly_High": "Reduce potassium application. Monitor for salt stress.",
        "Very_High": "Halt potassium application. Increase leaching irrigation.",
    },
    "soil_ph": {
        "Slightly_Low": "Apply 1 ton/ha agricultural lime to raise pH.",
        "Very_Low": "Apply 2-3 ton/ha dolomite lime. Avoid acidifying fertilizers.",
        "Slightly_High": "Apply sulfur 100-200 kg/ha to lower pH. Use acidifying fertilizers.",
        "Very_High": "Apply sulfur 300 kg/ha. Use gypsum for calcium supplementation.",
    },
}

RISK_MAP = {
    "temperature": {
        "Slightly_Low": "Mild cold stress — reduced photosynthesis",
        "Very_Low": "Severe cold stress — possible crop damage",
        "Slightly_High": "Mild heat stress — increased water demand",
        "Very_High": "Severe heat stress — crop failure risk",
    },
    "rainfall": {
        "Slightly_Low": "Mild drought stress — yield reduction possible",
        "Very_Low": "Severe drought — high yield loss risk",
        "Slightly_High": "Mild waterlogging risk — nutrient leaching",
        "Very_High": "Severe flooding risk — root rot and crop loss",
    },
    "humidity": {
        "Slightly_Low": "Mild moisture stress — increased pest risk",
        "Very_Low": "Severe moisture stress — crop wilting",
        "Slightly_High": "Mild fungal disease risk",
        "Very_High": "High risk of fungal diseases (blast, blight)",
    },
    "soil_nitrogen": {
        "Slightly_Low": "Mild nitrogen deficiency — reduced leaf growth",
        "Very_Low": "Severe nitrogen deficiency — yellowing and stunted growth",
        "Slightly_High": "Mild nitrogen excess — lodging risk",
        "Very_High": "Severe excess — lodging and burning risk",
    },
    "soil_phosphorus": {
        "Slightly_Low": "Mild phosphorus deficiency — delayed flowering",
        "Very_Low": "Severe deficiency — purple leaves, poor rooting",
        "Slightly_High": "Phosphorus excess — zinc/iron deficiency risk",
        "Very_High": "Severe excess — micronutrient imbalance",
    },
    "soil_potassium": {
        "Slightly_Low": "Mild potassium deficiency — leaf margin scorch",
        "Very_Low": "Severe deficiency — poor grain fill",
        "Slightly_High": "Potassium excess — calcium imbalance",
        "Very_High": "Severe excess — salt stress risk",
    },
    "soil_ph": {
        "Slightly_Low": "Mild acidity — reduced nutrient availability",
        "Very_Low": "Severe acidity — aluminium toxicity risk",
        "Slightly_High": "Mild alkalinity — micronutrient deficiency",
        "Very_High": "Severe alkalinity — multiple nutrient lockout",
    },
}

rows = []
for district in DISTRICTS:
    for crop in CROPS:
        stages = STAGES[crop]
        cumulative_cost = 0
        for stage_name, task_window, day_start, day_end in stages:
            stage_cost = STAGE_COSTS.get(stage_name, 1000) + np.random.randint(-100, 100)
            cumulative_cost += stage_cost
            for attr_tuple in ATTRIBUTES:
                attr = attr_tuple[0]
                unit = attr_tuple[1]
                opt_low, opt_high = attr_tuple[2], attr_tuple[3]
                sl_low, sl_high = attr_tuple[4], attr_tuple[5]
                sh_low, sh_high = attr_tuple[6], attr_tuple[7]
                vl_low, vl_high = attr_tuple[8], attr_tuple[9]
                vh_low, vh_high = attr_tuple[10], attr_tuple[11]

                row = {
                    "District": district,
                    "Crop": crop,
                    "Season": "Kharif",
                    "Stage": stage_name,
                    "Attribute": attr,
                    "Unit": unit,
                    "Govt_Sowing_Window": SOWING_WINDOWS[crop],
                    "Govt_Harvest_Window": HARVEST_WINDOWS[crop],
                    "Recommended_Task_Window": task_window,
                    "Day_Start": day_start,
                    "Day_End": day_end,
                    "Min_Value": vl_low,
                    "Max_Value": vh_high,
                    "Optimum_Range": f"{opt_low}-{opt_high}",
                    "Slightly_Low_Range": f"{sl_low}-{sl_high}",
                    "Slightly_Low_Risk": RISK_MAP[attr]["Slightly_Low"],
                    "Slightly_Low_Action": ACTION_MAP[attr]["Slightly_Low"],
                    "Very_Low_Range": f"{vl_low}-{vl_high}",
                    "Very_Low_Risk": RISK_MAP[attr]["Very_Low"],
                    "Very_Low_Action": ACTION_MAP[attr]["Very_Low"],
                    "Slightly_High_Range": f"{sh_low}-{sh_high}",
                    "Slightly_High_Risk": RISK_MAP[attr]["Slightly_High"],
                    "Slightly_High_Action": ACTION_MAP[attr]["Slightly_High"],
                    "Very_High_Range": f"{vh_low}-{vh_high}",
                    "Very_High_Risk": RISK_MAP[attr]["Very_High"],
                    "Very_High_Action": ACTION_MAP[attr]["Very_High"],
                    "Stage_Cost_INR_per_acre": stage_cost,
                    "Cumulative_Cost_INR_per_acre": cumulative_cost,
                }
                rows.append(row)

df = pd.DataFrame(rows)
os.makedirs("backend/data", exist_ok=True)
output_path = "backend/data/Karnataka_Kharif_crop_Final_Data.csv"
df.to_csv(output_path, index=False)
print(f"Dataset generated: {output_path}")
print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print(f"Crops: {df['Crop'].unique().tolist()}")
print(f"Districts: {df['District'].nunique()} districts")
