"""A clean negative legacy scan does not prove that the loader exists."""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
CANONICAL = "https://github.com/MrWizard94-Compile/Agents-Constitution"


class GovernanceEntryTests(unittest.TestCase):
    def test_agents_loads_the_canonical_skill(self) -> None:
        entry = ROOT / "AGENTS.md"
        self.assertTrue(entry.is_file(), "A project AGENTS loader is required")
        content = entry.read_text(encoding="utf-8")
        self.assertIn(CANONICAL, content)
        self.assertIn("wpai-constitution", content)

    def test_readme_routes_to_the_canonical_entry(self) -> None:
        content = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("[AGENTS.md](AGENTS.md)", content)
        self.assertIn(CANONICAL, content)


if __name__ == "__main__":
    unittest.main()
