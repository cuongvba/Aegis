import unittest
import main
from main import IRT3PLEngine, QuestionIRT


class TestSympsonHetterExposureControl(unittest.TestCase):
    def setUp(self):
        main._total_sessions_started = 0
        main._item_selection_counts.clear()
        main._item_administration_counts.clear()
        main._sympson_hetter_k.clear()

    def test_deterministic_when_randomesque_k_is_1_and_low_sessions(self):
        bank = [
            QuestionIRT(question_id="q1", a=2.2, b=0.0, c=0.25),
            QuestionIRT(question_id="q2", a=1.5, b=0.0, c=0.25),
            QuestionIRT(question_id="q3", a=1.0, b=0.0, c=0.25),
        ]
        chosen = IRT3PLEngine.select_next_item(0.0, bank, set(), max_exposure_rate=0.20, randomesque_k=1)
        self.assertIsNotNone(chosen)
        self.assertEqual(chosen.question_id, "q1")

    def test_sympson_hetter_throttles_overexposed_item_and_diversifies_pool(self):
        bank = [
            QuestionIRT(question_id=f"q{i}", a=2.0 - i * 0.05, b=0.0, c=0.25)
            for i in range(10)
        ]

        administered_counts = {f"q{i}": 0 for i in range(10)}
        # Simulate 100 CAT sessions starting at theta = 0.0 with r_max = 0.20 and randomesque_k = 3
        for _ in range(100):
            main._total_sessions_started += 1
            chosen = IRT3PLEngine.select_next_item(0.0, bank, set(), max_exposure_rate=0.20, randomesque_k=3)
            self.assertIsNotNone(chosen)
            administered_counts[chosen.question_id] += 1

        # Verify that q0 is NOT administered 100% of the time (diversity achieved)
        self.assertLess(administered_counts["q0"], 75)
        distinct_used = sum(1 for c in administered_counts.values() if c > 0)
        self.assertGreaterEqual(distinct_used, 3)


if __name__ == "__main__":
    unittest.main()

