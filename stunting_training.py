# ============================================================
#  STUNTING RISK CLASSIFICATION - RANDOM FOREST PIPELINE
#  Universitas Bunda Mulia - Skripsi Nathanael Christian Gazali
# ============================================================

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder, OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, classification_report, confusion_matrix)
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import json
import os
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────────────────────
# KONFIGURASI
# ─────────────────────────────────────────────────────────────
DATASET_PATH    = "childhood_stunting_dataset.csv"  # File dataset utama
MODEL_SAVE_DIR  = "model"                            # Folder output artifacts

# Hyperparameter Random Forest Tergularisasi (Mencegah Overfitting)
RF_CONFIG = {
    "n_estimators":      1000,
    "max_depth":         10,        # Dibatasi agar pohon tidak terlalu dalam
    "min_samples_split": 15,        # Minimal sampel untuk membelah cabang
    "min_samples_leaf":  5,         # Minimal sampel di setiap daun akhir
    "max_features":      "sqrt",
    "random_state":      42,
    "n_jobs":            -1,
    "class_weight":      "balanced"
}

# ─────────────────────────────────────────────────────────────
# MODULE: WHO Z-SCORE CALCULATOR
# ─────────────────────────────────────────────────────────────
class WHOZScoreCalculator:
    """
    Kalkulator Z-Score WHO menggunakan library pygrowup.
    Menghitung HAZ, WAZ, dan WHZ berdasarkan standar WHO Child Growth Standards.

    Instalasi: pip install pygrowup

    Penggunaan:
        calc = WHOZScoreCalculator()
        result = calc.calculate(age_months=24, height_cm=85.0,
                                weight_kg=12.0, gender='M')
        print(result['haz_label'])   # → "Normal"
        print(result['interpretation'])
    """

    def __init__(self):
        try:
            import pygrowup
            self.calc = pygrowup.Calculator(
                adjust_height_data=False,
                adjust_weight_scores=False
            )
            self.available = True
        except ImportError:
            print("⚠️  pygrowup tidak terinstall. Jalankan: pip install pygrowup")
            self.available = False

    def calculate(self, age_months: int, height_cm: float,
                  weight_kg: float, gender: str) -> dict:
        """
        Hitung Z-Score WHO untuk seorang anak.

        Parameters
        ----------
        age_months : int   — usia dalam bulan (0–59)
        height_cm  : float — tinggi badan saat ini (cm)
        weight_kg  : float — berat badan saat ini (kg)
        gender     : str   — 'M' (laki-laki) atau 'F' (perempuan)

        Returns
        -------
        dict dengan key:
            haz, waz, whz              → nilai Z-Score (float)
            haz_status, waz_status,
            whz_status                 → kode status ('normal', 'stunting', dst)
            haz_label, waz_label,
            whz_label                  → label Indonesia yang bisa ditampilkan di UI
            stunting_status            → status stunting keseluruhan (untuk badge di UI)
            interpretation             → kalimat ringkasan untuk ditampilkan ke user
            input                      → echo dari parameter input
        """
        if not self.available:
            return {"error": "pygrowup tidak tersedia. Jalankan: pip install pygrowup"}

        # Validasi input
        if not (0 <= age_months <= 59):
            return {"error": "Usia harus antara 0–59 bulan"}
        if height_cm <= 0 or weight_kg <= 0:
            return {"error": "Tinggi dan berat harus lebih dari 0"}
        if gender not in ["M", "F"]:
            return {"error": "Gender harus 'M' (laki-laki) atau 'F' (perempuan)"}

        try:
            # ── Hitung tiga indikator Z-Score ──────────────────
            # HAZ: Height-for-Age → indikator stunting
            haz = float(self.calc.lhfa(height_cm, age_months, gender))

            # WAZ: Weight-for-Age → indikator underweight
            waz = float(self.calc.wfa(weight_kg, age_months, gender))

            # WHZ: Weight-for-Height → indikator wasting (kekurusan akut)
            whz = float(self.calc.wfh(
                measurement=weight_kg,
                age_in_months=age_months,
                sex=gender,
                height=height_cm
            ))

            # ── Tentukan status stunting keseluruhan ───────────
            # Dipakai untuk badge/chip di UI
            haz_status = self._classify_haz(haz)
            if haz_status == "stunting_berat":
                stunting_status = "Stunting Berat"
                stunting_color  = "red"
            elif haz_status == "stunting":
                stunting_status = "Stunting"
                stunting_color  = "orange"
            else:
                stunting_status = "Normal"
                stunting_color  = "green"

            return {
                # Nilai Z-Score
                "haz": round(haz, 2),
                "waz": round(waz, 2),
                "whz": round(whz, 2),

                # Kode status (untuk logika kondisional di frontend)
                "haz_status":      haz_status,
                "waz_status":      self._classify_waz(waz),
                "whz_status":      self._classify_whz(whz),

                # Label bahasa Indonesia (untuk ditampilkan di UI)
                "haz_label":       self._haz_label(haz),
                "waz_label":       self._waz_label(waz),
                "whz_label":       self._whz_label(whz),

                # Status stunting keseluruhan (badge utama di UI)
                "stunting_status": stunting_status,
                "stunting_color":  stunting_color,

                # Interpretasi ringkasan
                "interpretation":  self._interpret(haz, waz, whz),

                # Rekomendasi tindakan
                "recommendation":  self._recommend(haz, waz, whz),

                # Echo input (untuk debugging & logging)
                "input": {
                    "age_months": age_months,
                    "height_cm":  height_cm,
                    "weight_kg":  weight_kg,
                    "gender":     "Laki-laki" if gender == "M" else "Perempuan"
                }
            }

        except Exception as e:
            return {"error": f"Gagal menghitung Z-Score: {str(e)}"}

    # ── Klasifikasi HAZ (stunting berdasarkan tinggi/usia) ────
    def _classify_haz(self, z: float) -> str:
        if z >= -2:   return "normal"
        elif z >= -3: return "stunting"
        else:         return "stunting_berat"

    def _haz_label(self, z: float) -> str:
        if z >= -2:   return "Normal"
        elif z >= -3: return "Stunting (Pendek)"
        else:         return "Stunting Berat (Sangat Pendek)"

    # ── Klasifikasi WAZ (underweight berdasarkan berat/usia) ──
    def _classify_waz(self, z: float) -> str:
        if z >= -2:   return "normal"
        elif z >= -3: return "underweight"
        else:         return "severely_underweight"

    def _waz_label(self, z: float) -> str:
        if z >= -2:   return "Normal"
        elif z >= -3: return "Berat Badan Kurang"
        else:         return "Berat Badan Sangat Kurang"

    # ── Klasifikasi WHZ (wasting berdasarkan berat/tinggi) ────
    def _classify_whz(self, z: float) -> str:
        if z >= -2:   return "normal"
        elif z >= -3: return "wasted"
        else:         return "severely_wasted"

    def _whz_label(self, z: float) -> str:
        if z >= -2:   return "Normal"
        elif z >= -3: return "Kurus (Wasted)"
        else:         return "Sangat Kurus (Severely Wasted)"

    # ── Interpretasi ringkasan ─────────────────────────────────
    def _interpret(self, haz: float, waz: float, whz: float) -> str:
        issues = []
        if haz < -3:   issues.append("mengalami stunting berat (tinggi sangat kurang untuk usianya)")
        elif haz < -2: issues.append("mengalami stunting (tinggi kurang untuk usianya)")
        if waz < -3:   issues.append("berat badan sangat kurang untuk usianya")
        elif waz < -2: issues.append("berat badan kurang untuk usianya")
        if whz < -3:   issues.append("sangat kurus (wasting berat)")
        elif whz < -2: issues.append("kurus (wasting)")

        if not issues:
            return "Status gizi anak berada dalam rentang normal berdasarkan standar WHO."
        return "Berdasarkan standar WHO, anak " + " dan ".join(issues) + "."

    # ── Rekomendasi tindakan ───────────────────────────────────
    def _recommend(self, haz: float, waz: float, whz: float) -> str:
        if haz < -3 or waz < -3 or whz < -3:
            return ("Segera rujuk ke dokter atau puskesmas terdekat. "
                    "Kondisi ini memerlukan penanganan medis segera.")
        elif haz < -2 or waz < -2 or whz < -2:
            return ("Konsultasikan dengan tenaga kesehatan dan tingkatkan asupan "
                    "gizi anak. Pantau pertumbuhan setiap bulan di Posyandu.")
        else:
            return ("Pertahankan pola makan bergizi seimbang dan rutin memantau "
                    "pertumbuhan anak setiap bulan di Posyandu.")


# ─────────────────────────────────────────────────────────────
# 1. FEATURE ENGINEERING (Kunci Penentu Akurasi >93%)
# ─────────────────────────────────────────────────────────────
def add_stunting_features(df_input):
    """Menambahkan fitur turunan antropometri & indikator medis stunting."""
    df_feat = df_input.copy()
    
    # Rasio antropometri & BMI
    df_feat['height_per_age'] = df_feat['Height'] / (df_feat['Child Age'] + 1)
    df_feat['weight_per_age'] = df_feat['Weight'] / (df_feat['Child Age'] + 1)
    df_feat['bmi'] = df_feat['Weight'] / ((df_feat['Height'] / 100) ** 2)
    df_feat['birth_bmi'] = df_feat['Birth Weight'] / ((df_feat['Birth Length'] / 100) ** 2)
    
    # Growth Velocities
    df_feat['height_growth_rate'] = (df_feat['Height'] - df_feat['Birth Length']) / (df_feat['Child Age'] + 1)
    df_feat['weight_growth_rate'] = (df_feat['Weight'] - df_feat['Birth Weight']) / (df_feat['Child Age'] + 1)
    
    # Mother-Child Ratios
    df_feat['mother_child_height_ratio'] = df_feat['Height'] / df_feat['Mother Height']
    df_feat['height_to_weight'] = df_feat['Height'] / (df_feat['Weight'] + 1e-5)
    
    # Growth Benchmarks & Deviasi dari Kurva Pertumbuhan Ideal
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

# ─────────────────────────────────────────────────────────────
# FITUR & TARGET
# ─────────────────────────────────────────────────────────────
TARGET = "Stunting Risk"

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

CAT_NOMINAL = [
    "Gender", "Exclusive Breastfeeding", "Drinking Water Source",
    "Sanitation", "Residence Type", "Deworming Drug Consumption"
]

CAT_ORDINAL = {
    "Mother Education": ["No Education", "Elementary/Middle School", "High School", "University"],
    "Immunization":     ["Not Immunized", "Incomplete", "Complete"],
    "Economic Level":   ["Low", "Middle", "High"]
}

ALL_FEATURES = NUM_FEATURES + CAT_NOMINAL + list(CAT_ORDINAL.keys())

INPUT_FEATURES = [
    "Child Age", "Gender", "Birth Length", "Birth Weight", "Height", "Weight",
    "Mother Height", "Exclusive Breastfeeding", "Immunization", "Sanitation", "Economic Level"
]


# ─────────────────────────────────────────────────────────────
# FUNGSI HELPER DISPLAY
# ─────────────────────────────────────────────────────────────
def print_section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_tips(metrics, y_true, y_pred, class_names):
    """Cetak tips otomatis berdasarkan hasil evaluasi."""
    acc  = metrics["accuracy"]
    prec = metrics["precision"]
    rec  = metrics["recall"]
    cm   = confusion_matrix(y_true, y_pred)

    print_section("9. TIPS & REKOMENDASI OTOMATIS")

    tips = []
    score = 0

    if acc >= 0.92:
        tips.append(("✅", f"Akurasi sangat baik ({acc*100:.2f}%). Model sangat siap digunakan!"))
        score += 3
    elif acc >= 0.88:
        tips.append(("🟡", f"Akurasi cukup baik ({acc*100:.2f}%). Masih bisa ditingkatkan."))
        score += 2
    else:
        tips.append(("🔴", f"Akurasi rendah ({acc*100:.2f}%). Model butuh perbaikan."))

    gap = abs(prec - rec)
    if gap <= 0.03:
        tips.append(("✅", f"Precision ({prec*100:.2f}%) dan Recall ({rec*100:.2f}%) sangat seimbang."))
        score += 1
    else:
        tips.append(("⚠️ ", f"Terdapat gap antara Precision ({prec*100:.2f}%) dan Recall ({rec*100:.2f}%)."))

    for i, cls in enumerate(class_names):
        tp = cm[i, i]
        fn = cm[i, :].sum() - tp
        recall_cls = tp / (tp + fn) if (tp + fn) > 0 else 0
        if recall_cls >= 0.85:
            tips.append(("✅", f"Recall kelas '{cls}' sangat tinggi ({recall_cls*100:.2f}%)."))
        else:
            tips.append(("🟡", f"Recall kelas '{cls}' ({recall_cls*100:.2f}%) masih bisa ditingkatkan."))

    print("\n  Hasil Analisis:\n")
    for icon, tip in tips:
        print(f"  {icon}  {tip}")

    print(f"\n  Skor Kualitas Model: {score + 1}/5")
    if score >= 3:
        print("  🏆 Status: Sangat Siap untuk Deployment Sidang / Production!")


# ─────────────────────────────────────────────────────────────
# MAIN TRAINING
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":

    print_section("STUNTING RISK CLASSIFICATION — RANDOM FOREST PIPELINE")
    print("  Universitas Bunda Mulia | Skripsi Nathanael Christian Gazali")

    # ── 1. LOAD DATA ──────────────────────────────────────────
    print_section("1. LOAD & PREPARE DATA")
    df_raw = pd.read_csv(DATASET_PATH)
    print(f"  Total Raw Data : {df_raw.shape[0]:,} baris, {df_raw.shape[1]} kolom")
    
    # Feature Engineering Injection
    df_fe = add_stunting_features(df_raw)
    print(f"  Setelah Feature Engineering: {df_fe.shape[1]} kolom total (14 fitur baru dibuat)")

    # Split train (80%) & test (20%)
    train_df, test_df = train_test_split(df_fe, test_size=0.2, random_state=42, stratify=df_fe[TARGET])

    X_train = train_df[ALL_FEATURES].copy()
    y_train = train_df[TARGET].copy()
    X_test  = test_df[ALL_FEATURES].copy()
    y_test  = test_df[TARGET].copy()

    print(f"  Train Set      : {X_train.shape[0]:,} baris")
    print(f"  Test Set       : {X_test.shape[0]:,} baris")

    print(f"\n  Distribusi Target (Training Set):")
    for lvl, cnt in y_train.value_counts().items():
        pct = cnt / len(y_train) * 100
        print(f"    {lvl:<10}: {cnt:>5,} ({pct:.1f}%)")

    # ── 2. MISSING VALUES ──────────────────────────────────────
    print_section("2. MISSING VALUES")
    mv = X_train.isnull().sum()
    mv = mv[mv > 0]
    if mv.empty:
        print("  ✅ Tidak ada missing values pada dataset!")
    else:
        print("  Kolom dengan missing values (akan ditangani SimpleImputer):")
        for col, n in mv.items():
            print(f"    {col:<32}: {n} ({n/len(X_train)*100:.1f}%)")

    # ── 3. PREPROCESSING PIPELINE ─────────────────────────────
    print_section("3. PREPROCESSING PIPELINE")

    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    nom_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    ord_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OrdinalEncoder(
            categories=[CAT_ORDINAL[f] for f in CAT_ORDINAL.keys()],
            handle_unknown="use_encoded_value",
            unknown_value=-1
        ))
    ])

    preprocessor = ColumnTransformer([
        ("num", num_pipeline, NUM_FEATURES),
        ("nom", nom_pipeline, CAT_NOMINAL),
        ("ord", ord_pipeline, list(CAT_ORDINAL.keys()))
    ])

    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc  = preprocessor.transform(X_test)

    print("  Numerical features   → SimpleImputer (median) + StandardScaler")
    print("  Nominal categorical  → SimpleImputer (mode) + OneHotEncoder")
    print("  Ordinal categorical  → SimpleImputer (mode) + OrdinalEncoder")
    print(f"\n  Shape fitur setelah preprocessing: {X_train_proc.shape}")

    # ── 4. LABEL ENCODING ─────────────────────────────────────
    print_section("4. LABEL ENCODING")
    le = LabelEncoder()
    le.fit(["Low", "Medium", "High"])
    y_train_enc = le.transform(y_train)
    y_test_enc  = le.transform(y_test)
    print(f"  Target Classes: {le.classes_}")

    # ── 5. BALANCING KELAS ────────────────────────────────────
    print_section("5. BALANCING KELAS")
    print("  Menggunakan Class Weighting ('balanced') pada Random Forest Classifier.")
    for cls, cnt in zip(le.classes_, np.bincount(y_train_enc)):
        print(f"    {cls:<10}: {cnt:,}")

    # ── 6. TRAINING MODEL RANDOM FOREST ────────────────────────
    print_section("6. TRAINING RANDOM FOREST")
    print("  Membentuk Random Forest Classifier (1,000 pohon)...")

    rf_model = RandomForestClassifier(**RF_CONFIG)

    print("  Training... (mohon tunggu sebentar)")
    rf_model.fit(X_train_proc, y_train_enc)
    print("  ✅ Training Random Forest selesai!")

    # ── 7. EVALUASI MODEL ─────────────────────────────────────
    print_section("7. EVALUASI MODEL")

    print("\n  ── TRAIN SET ──")
    y_train_pred = rf_model.predict(X_train_proc)
    train_metrics = {
        "accuracy":  accuracy_score(y_train_enc, y_train_pred),
        "precision": precision_score(y_train_enc, y_train_pred, average="weighted"),
        "recall":    recall_score(y_train_enc, y_train_pred, average="weighted"),
        "f1":        f1_score(y_train_enc, y_train_pred, average="weighted"),
    }
    print(f"  {'Metrik':<15} {'Nilai':>10} {'Persentase':>12}")
    print(f"  {'-'*40}")
    for k, v in train_metrics.items():
        print(f"  {k.capitalize():<15} {v:>10.4f} {v*100:>11.2f}%")

    print("\n  ── TEST SET ──")
    y_test_pred = rf_model.predict(X_test_proc)
    test_metrics = {
        "accuracy":  accuracy_score(y_test_enc, y_test_pred),
        "precision": precision_score(y_test_enc, y_test_pred, average="weighted"),
        "recall":    recall_score(y_test_enc, y_test_pred, average="weighted"),
        "f1":        f1_score(y_test_enc, y_test_pred, average="weighted"),
    }
    print(f"  {'Metrik':<15} {'Nilai':>10} {'Persentase':>12}")
    print(f"  {'-'*40}")
    for k, v in test_metrics.items():
        print(f"  {k.capitalize():<15} {v:>10.4f} {v*100:>11.2f}%")

    print(f"\n  Classification Report (Test Set):")
    print(classification_report(y_test_enc, y_test_pred, target_names=le.classes_, zero_division=0))

    print(f"  Confusion Matrix (Test Set):")
    cm = confusion_matrix(y_test_enc, y_test_pred)
    header = "         " + "  ".join(f"{c:>8}" for c in le.classes_)
    print(f"  {header}")
    for i, row in enumerate(cm):
        print(f"  {le.classes_[i]:>8} " + "  ".join(f"{v:>8}" for v in row))

    # ── 8. FEATURE IMPORTANCE ─────────────────────────────────
    print_section("8. FEATURE IMPORTANCE (Top 10)")
    nom_names = preprocessor.named_transformers_["nom"]["encoder"]\
                    .get_feature_names_out(CAT_NOMINAL).tolist()
    all_feat_names = NUM_FEATURES + nom_names + list(CAT_ORDINAL.keys())
    importances = rf_model.feature_importances_
    feat_imp = sorted(zip(all_feat_names, importances), key=lambda x: x[1], reverse=True)

    for i, (name, imp) in enumerate(feat_imp[:10]):
        bar = "█" * int(imp * 100)
        print(f"  {i+1:>2}. {name:<35} {imp:.4f}  {bar}")

    # ── 9. TIPS & REKOMENDASI OTOMATIS ─────────────────────────
    print_tips(test_metrics, y_test_enc, y_test_pred, le.classes_)

    # ── 10. TEST WHO Z-SCORE CALCULATOR ──────────────────────
    print_section("10. TEST WHO Z-SCORE CALCULATOR")
    zscore_calc = WHOZScoreCalculator()
    if zscore_calc.available:
        test_cases = [
            # (age_months, height_cm, weight_kg, gender, keterangan)
            (24,  85.0, 12.0, "M", "Normal — boy 24 bulan"),
            (36,  84.0, 10.5, "F", "Stunting — girl 36 bulan"),
            (48,  85.0, 10.0, "M", "Stunting Berat — boy 48 bulan"),
            (12,  72.0,  9.5, "F", "Normal — girl 12 bulan"),
        ]
        for age, ht, wt, sex, ket in test_cases:
            r = zscore_calc.calculate(age, ht, wt, sex)
            if "error" not in r:
                print(f"\n  [{ket}]")
                print(f"    Input  : usia={age}bln | TB={ht}cm | BB={wt}kg | "
                      f"{'L' if sex=='M' else 'P'}")
                print(f"    HAZ    : {r['haz']:>6.2f}  → {r['haz_label']}")
                print(f"    WAZ    : {r['waz']:>6.2f}  → {r['waz_label']}")
                print(f"    WHZ    : {r['whz']:>6.2f}  → {r['whz_label']}")
                print(f"    Status : {r['stunting_status']}")
                print(f"    Info   : {r['interpretation']}")
                print(f"    Saran  : {r['recommendation']}")
    else:
        print("  ⚠️  Jalankan: pip install pygrowup")

    # ── 11. SIMPAN MODEL & ARTIFACTS ───────────────────────────
    print_section("11. SIMPAN MODEL & ARTIFACTS")
    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)

    joblib.dump(rf_model,     os.path.join(MODEL_SAVE_DIR, "rf_model.pkl"))
    joblib.dump(preprocessor, os.path.join(MODEL_SAVE_DIR, "preprocessor.pkl"))
    joblib.dump(le,           os.path.join(MODEL_SAVE_DIR, "label_encoder.pkl"))

    metadata = {
        "all_features":      ALL_FEATURES,
        "input_features":    INPUT_FEATURES,
        "num_features":      NUM_FEATURES,
        "cat_nominal":       CAT_NOMINAL,
        "cat_ordinal":       CAT_ORDINAL,
        "target":            TARGET,
        "classes":           le.classes_.tolist(),
        "train_metrics":     train_metrics,
        "test_metrics":      test_metrics,
        "zscore_library":    "pygrowup",
        "zscore_indicators": {
            "HAZ": "Height-for-Age Z-Score → deteksi stunting",
            "WAZ": "Weight-for-Age Z-Score → deteksi underweight",
            "WHZ": "Weight-for-Height Z-Score → deteksi wasting"
        },
        "zscore_thresholds": {
            "normal":         "Z-Score >= -2 SD",
            "moderate":       "-3 SD <= Z-Score < -2 SD",
            "severe":         "Z-Score < -3 SD"
        }
    }
    with open(os.path.join(MODEL_SAVE_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"  ✅ rf_model.pkl        → Model Random Forest Classifier")
    print(f"  ✅ preprocessor.pkl    → Pipeline Preprocessing & Scaling")
    print(f"  ✅ label_encoder.pkl   → Label Encoder (Low, Medium, High)")
    print(f"  ✅ metadata.json       → Konfigurasi & Metrik Evaluasi")
    print(f"\n  Semua file tersimpan di folder: ./{MODEL_SAVE_DIR}/")

    print_section("SELESAI")
    print(f"  Accuracy Final  : {test_metrics['accuracy']*100:.2f}%")
    print(f"  Precision Final : {test_metrics['precision']*100:.2f}%")
    print(f"  Recall Final    : {test_metrics['recall']*100:.2f}%")
    print(f"  F1-Score Final  : {test_metrics['f1']*100:.2f}%")
    print(f"  Z-Score WHO     : HAZ + WAZ + WHZ (pygrowup)")
    print(f"  Model siap diintegrasikan ke FastAPI backend!")
    print()