import joblib
import numpy as np
import pandas as pd
from datetime import date
import os
from app.services.growth_validation import get_growth_measurement_error

# ── Load model artifacts ──────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_DIR  = os.path.join(BASE_DIR, "model")

rf_model    = joblib.load(os.path.join(MODEL_DIR, "rf_model.pkl"))
preprocessor= joblib.load(os.path.join(MODEL_DIR, "preprocessor.pkl"))
le          = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))

# ── WHO Z-Score Calculator ────────────────────────────────────
class WHOZScoreCalculator:
    def __init__(self):
        try:
            import pygrowup
            self.calc      = pygrowup.Calculator(
                adjust_height_data=False,
                adjust_weight_scores=False
            )
            self.available = True
        except ImportError:
            self.available = False

    def calculate(self, age_months: int, height_cm: float,
                  weight_kg: float, gender: str) -> dict:
        if not self.available:
            return {"error": "pygrowup tidak tersedia"}
        if not (0 <= int(age_months) <= 59):
            return {"error": "Usia harus antara 0–59 bulan"}
        if height_cm <= 0 or weight_kg <= 0:
            return {"error": "Tinggi dan berat harus lebih dari 0"}
        if gender not in ["M", "F"]:
            return {"error": "Gender harus M atau F"}
        try:
            age   = int(age_months)
            haz   = float(self.calc.lhfa(height_cm, age, gender))
            waz   = float(self.calc.wfa(weight_kg, age, gender))
            whz   = float(self.calc.wfh(
                measurement=weight_kg, age_in_months=age,
                sex=gender, height=height_cm
            ))
            haz_s = self._classify_haz(haz)
            return {
                "haz"            : round(haz, 2),
                "waz"            : round(waz, 2),
                "whz"            : round(whz, 2),
                "haz_status"     : haz_s,
                "waz_status"     : self._classify_waz(waz),
                "whz_status"     : self._classify_whz(whz),
                "haz_label"      : self._haz_label(haz),
                "waz_label"      : self._waz_label(waz),
                "whz_label"      : self._whz_label(whz),
                "stunting_status": self._stunting_status(haz_s)[0],
                "stunting_color" : self._stunting_status(haz_s)[1],
                "interpretation" : self._interpret(haz, waz, whz),
                "recommendation" : self._recommend(haz, waz, whz),
            }
        except Exception as e:
            return {"error": str(e)}

    def _classify_haz(self, z):
        if z >= -2:   return "normal"
        elif z >= -3: return "stunting"
        else:         return "stunting_berat"

    def _haz_label(self, z):
        if z >= -2:   return "Normal"
        elif z >= -3: return "Stunting (Pendek)"
        else:         return "Stunting Berat (Sangat Pendek)"

    def _classify_waz(self, z):
        if z >= -2:   return "normal"
        elif z >= -3: return "underweight"
        else:         return "severely_underweight"

    def _waz_label(self, z):
        if z >= -2:   return "Normal"
        elif z >= -3: return "Berat Badan Kurang"
        else:         return "Berat Badan Sangat Kurang"

    def _classify_whz(self, z):
        if z >= -2:   return "normal"
        elif z >= -3: return "wasted"
        else:         return "severely_wasted"

    def _whz_label(self, z):
        if z >= -2:   return "Normal"
        elif z >= -3: return "Kurus (Wasted)"
        else:         return "Sangat Kurus"

    def _stunting_status(self, haz_status):
        if haz_status == "stunting_berat": return ("Stunting Berat", "red")
        elif haz_status == "stunting":     return ("Stunting", "orange")
        else:                              return ("Normal", "green")

    def _interpret(self, haz, waz, whz):
        issues = []
        if haz < -3:   issues.append("stunting berat")
        elif haz < -2: issues.append("stunting")
        if waz < -3:   issues.append("berat badan sangat kurang")
        elif waz < -2: issues.append("berat badan kurang")
        if whz < -3:   issues.append("sangat kurus")
        elif whz < -2: issues.append("kurus")
        if not issues:
            return "Status gizi anak dalam rentang normal berdasarkan standar WHO."
        return "Berdasarkan standar WHO, anak " + " dan ".join(issues) + "."

    def _recommend(self, haz, waz, whz):
        if haz < -3 or waz < -3 or whz < -3:
            return "Segera rujuk ke dokter atau puskesmas terdekat."
        elif haz < -2 or waz < -2 or whz < -2:
            return ("Konsultasikan dengan tenaga kesehatan dan tingkatkan "
                    "asupan gizi anak. Pantau pertumbuhan setiap bulan di Posyandu.")
        else:
            return ("Pertahankan pola makan bergizi seimbang dan rutin "
                    "memantau pertumbuhan anak setiap bulan di Posyandu.")

zscore_calc = WHOZScoreCalculator()

# ── Feature Engineering (sama seperti training) ───────────────
IDEAL_HEIGHT = {
    # (age_months, gender): median_height_cm dari tabel WHO
    # Boys
    **{(i, "M"): h for i, h in enumerate([
        49.9,54.7,58.4,61.4,63.9,65.9,67.6,69.2,70.6,72.0,73.3,74.5,
        75.7,76.9,78.0,79.1,80.2,81.2,82.3,83.2,84.2,85.1,86.0,86.9,
        87.8,88.7,89.7,90.5,91.4,92.3,93.1,93.9,94.7,95.5,96.3,97.0,
        97.8,98.5,99.3,100.0,100.7,101.5,102.2,102.9,103.6,104.3,104.9,
        105.6,106.3,107.0,107.7,108.4,109.1,109.7,110.4,111.0,111.7,
        112.3,112.9,113.6
    ])},
    # Girls
    **{(i, "F"): h for i, h in enumerate([
        49.1,53.7,57.1,59.8,62.1,64.0,65.7,67.3,68.7,70.1,71.5,72.8,
        74.0,75.2,76.4,77.5,78.6,79.7,80.7,81.7,82.7,83.7,84.6,85.5,
        86.5,87.4,88.4,89.3,90.1,91.0,91.8,92.7,93.5,94.2,95.0,95.8,
        96.5,97.3,98.0,98.8,99.5,100.2,100.9,101.6,102.3,103.0,103.7,
        104.3,105.0,105.7,106.3,107.0,107.6,108.3,108.9,109.5,110.2,
        110.8,111.4,112.0
    ])}
}

IDEAL_WEIGHT = {
    **{(i, "M"): w for i, w in enumerate([
        3.35,4.47,5.57,6.38,7.00,7.51,7.93,8.30,8.62,8.90,9.16,9.41,
        9.65,9.87,10.10,10.31,10.52,10.73,10.93,11.13,11.33,11.51,11.70,
        11.88,12.07,12.24,12.42,12.59,12.76,12.93,13.09,13.25,13.41,
        13.57,13.73,13.89,14.04,14.19,14.34,14.49,14.64,14.79,14.93,
        15.07,15.22,15.35,15.49,15.63,15.76,15.90,16.03,16.16,16.29,
        16.42,16.54,16.67,16.79,16.92,17.04,17.16
    ])},
    **{(i, "F"): w for i, w in enumerate([
        3.23,4.19,5.13,5.85,6.42,6.90,7.30,7.64,7.95,8.23,8.48,8.72,
        8.95,9.17,9.39,9.60,9.81,10.02,10.22,10.43,10.64,10.84,11.04,
        11.24,11.44,11.63,11.83,12.02,12.21,12.39,12.58,12.76,12.94,
        13.12,13.30,13.48,13.66,13.83,14.01,14.18,14.35,14.52,14.69,
        14.86,15.03,15.20,15.36,15.53,15.69,15.86,16.02,16.18,16.35,
        16.51,16.67,16.83,16.99,17.15,17.30,17.46
    ])}
}

def add_stunting_features(df_input):
    """Feature engineering SAMA PERSIS dengan training script."""
    df_feat = df_input.copy()
    
    df_feat['height_per_age'] = df_feat['Height'] / (df_feat['Child Age'] + 1)
    df_feat['weight_per_age'] = df_feat['Weight'] / (df_feat['Child Age'] + 1)
    df_feat['bmi']            = df_feat['Weight'] / ((df_feat['Height'] / 100) ** 2)
    df_feat['birth_bmi']      = df_feat['Birth Weight'] / ((df_feat['Birth Length'] / 100) ** 2)
    
    df_feat['height_growth_rate'] = (df_feat['Height'] - df_feat['Birth Length']) / (df_feat['Child Age'] + 1)
    df_feat['weight_growth_rate'] = (df_feat['Weight'] - df_feat['Birth Weight']) / (df_feat['Child Age'] + 1)
    
    df_feat['mother_child_height_ratio'] = df_feat['Height'] / df_feat['Mother Height']
    df_feat['height_to_weight']          = df_feat['Height'] / (df_feat['Weight'] + 1e-5)
    
    age = df_feat['Child Age']
    expected_height = np.where(age <= 12, 50 + age * 2.0,
                     np.where(age <= 24, 74 + (age - 12) * 1.0,
                     np.where(age <= 36, 86 + (age - 24) * 0.7,
                              94 + (age - 36) * 0.6)))
    
    expected_weight = np.where(age <= 12, 3.3 + age * 0.6,
                      np.where(age <= 24, 10.5 + (age - 12) * 0.2,
                      np.where(age <= 36, 12.9 + (age - 24) * 0.18,
                               15.0 + (age - 36) * 0.15)))
    
    df_feat['expected_height']      = expected_height
    df_feat['height_diff_expected'] = df_feat['Height'] - expected_height
    df_feat['height_pct_expected']  = df_feat['Height'] / expected_height
    df_feat['expected_weight']      = expected_weight
    df_feat['weight_diff_expected'] = df_feat['Weight'] - expected_weight
    df_feat['weight_pct_expected']  = df_feat['Weight'] / expected_weight
    
    return df_feat


NUM_FEATURES_RAW = [
    "Child Age", "Birth Length", "Birth Weight", "Height", "Weight",
    "Mother Age", "Mother Height", "ANC Visits",
    "Complementary Feeding Start Age", "Diarrhea Frequency"
]
NUM_ENGINEERED = [
    'height_per_age', 'weight_per_age', 'bmi', 'birth_bmi',
    'height_growth_rate', 'weight_growth_rate', 'mother_child_height_ratio',
    'height_to_weight', 'expected_height', 'height_diff_expected',
    'height_pct_expected', 'expected_weight', 'weight_diff_expected',
    'weight_pct_expected'
]
NUM_FEATURES = NUM_FEATURES_RAW + NUM_ENGINEERED

CAT_NOMINAL_FEATURES = [
    "Gender", "Exclusive Breastfeeding", "Drinking Water Source",
    "Sanitation", "Residence Type", "Deworming Drug Consumption"
]
CAT_ORDINAL_FEATURES = {
    "Mother Education": ["No Education", "Elementary/Middle School", "High School", "University"],
    "Immunization":     ["Not Immunized", "Incomplete", "Complete"],
    "Economic Level":   ["Low", "Middle", "High"]
}
ALL_FEATURES = NUM_FEATURES + CAT_NOMINAL_FEATURES + list(CAT_ORDINAL_FEATURES.keys())


def predict_stunting(
    age_months, gender, height_cm, weight_kg,
    birth_length, birth_weight, mother_age, mother_height,
    anc_visits, mother_education, mother_working,
    father_education, father_working, exclusive_bf,
    complementary_age, immunization, diarrhea_freq,
    water_source, sanitation, economic_level,
    residence_type, deworming,
) -> dict:
    """Jalankan prediksi Random Forest + kalkulasi Z-Score WHO."""

    zscore_result = zscore_calc.calculate(age_months, height_cm, weight_kg, gender)
    if "error" in zscore_result:
        return {"zscore": zscore_result}

    validation_error = get_growth_measurement_error(zscore_result)
    if validation_error:
        return {"zscore": {"error": validation_error}}

    # 1. Buat raw dataframe dengan nama kolom SAMA dengan training
    raw = {
        "Child Age"                      : age_months,
        "Gender"                         : gender,
        "Birth Length"                   : birth_length,
        "Birth Weight"                   : birth_weight,
        "Height"                         : height_cm,
        "Weight"                         : weight_kg,
        "Mother Age"                     : mother_age,
        "Mother Education"               : mother_education,
        "Mother Height"                  : mother_height,
        "ANC Visits"                     : anc_visits,
        "Exclusive Breastfeeding"        : exclusive_bf,
        "Complementary Feeding Start Age": complementary_age,
        "Immunization"                   : immunization,
        "Diarrhea Frequency"             : diarrhea_freq,
        "Drinking Water Source"          : water_source,
        "Sanitation"                     : sanitation,
        "Economic Level"                 : economic_level,
        "Residence Type"                 : residence_type,
        "Deworming Drug Consumption"     : deworming,
    }
    df = pd.DataFrame([raw])

    # 2. Feature engineering (sama persis dengan training)
    df = add_stunting_features(df)

    # 3. Pilih kolom sesuai urutan training
    df = df[ALL_FEATURES]

    # 4. Preprocessing + prediksi
    X_proc     = preprocessor.transform(df)
    y_pred     = rf_model.predict(X_proc)[0]
    y_proba    = rf_model.predict_proba(X_proc)[0]
    risk_level = le.inverse_transform([y_pred])[0]
    risk_score = round(float(max(y_proba)) * 100, 2)

    # 5. Rekomendasi
    if risk_level == "High":
        rekomendasi = ("Risiko tinggi terdeteksi. Segera konsultasikan dengan "
                       "dokter atau ahli gizi. Perhatikan asupan protein, "
                       "vitamin, dan mineral anak secara intensif.")
    elif risk_level == "Medium":
        rekomendasi = ("Risiko sedang terdeteksi. Tingkatkan kualitas dan "
                       "kuantitas asupan gizi anak. Pantau pertumbuhan setiap "
                       "bulan dan konsultasikan dengan tenaga kesehatan.")
    else:
        rekomendasi = ("Risiko rendah. Pertahankan pola makan bergizi seimbang, "
                       "pastikan imunisasi lengkap, dan rutin pantau pertumbuhan "
                       "anak setiap bulan di Posyandu.")

    return {
        "risk_level" : risk_level,
        "risk_score" : risk_score,
        "rekomendasi": rekomendasi,
        "zscore"     : zscore_result,
    }