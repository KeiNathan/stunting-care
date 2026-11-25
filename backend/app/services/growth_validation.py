BIOLOGICALLY_IMPLAUSIBLE_LIMITS = {
    "haz": (-6, 6),
    "waz": (-6, 5),
    "whz": (-5, 5),
}


def get_growth_measurement_error(zscore_result: dict) -> str | None:
    implausible = [
        f"{indicator.upper()} {zscore_result[indicator]:.2f}"
        for indicator, (lower, upper) in BIOLOGICALLY_IMPLAUSIBLE_LIMITS.items()
        if not lower <= zscore_result[indicator] <= upper
    ]
    if not implausible:
        return None

    return (
        "Hasil pengukuran berada di luar batas pemeriksaan kewajaran "
        f"WHO ({', '.join(implausible)}). Periksa kembali tanggal lahir, "
        "jenis kelamin, tinggi, dan berat badan. Prediksi tidak disimpan."
    )
