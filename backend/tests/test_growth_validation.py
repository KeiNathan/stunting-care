import unittest

from app.services.growth_validation import get_growth_measurement_error


class GrowthMeasurementValidationTests(unittest.TestCase):
    def test_accepts_z_scores_inside_who_data_quality_limits(self):
        zscore = {"haz": 0, "waz": 0, "whz": 0}

        self.assertIsNone(get_growth_measurement_error(zscore))

    def test_rejects_implausible_newborn_measurement_scores(self):
        zscore = {"haz": 30.43, "waz": 22.56, "whz": 5.6}

        error = get_growth_measurement_error(zscore)

        self.assertIn("HAZ 30.43", error)
        self.assertIn("WAZ 22.56", error)
        self.assertIn("WHZ 5.60", error)
        self.assertIn("Prediksi tidak disimpan.", error)

    def test_accepts_scores_at_the_who_data_quality_limits(self):
        zscore = {"haz": 6, "waz": 5, "whz": -5}

        self.assertIsNone(get_growth_measurement_error(zscore))


if __name__ == "__main__":
    unittest.main()
