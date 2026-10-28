"""Keep synthetic build inputs in Git without exposing runtime records."""

from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


class SourceIgnoreTests(unittest.TestCase):
    def is_ignored(self, path: str) -> bool:
        result = subprocess.run(
            ["git", "check-ignore", "--no-index", "--quiet", "--", path],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertIn(result.returncode, (0, 1), result.stderr)
        return result.returncode == 0

    def test_required_synthetic_modules_are_not_ignored(self) -> None:
        for name in ("agents", "corpus", "graph", "players"):
            path = f"src/data/{name}.ts"
            with self.subTest(path=path):
                self.assertTrue((ROOT / path).is_file(), path)
                self.assertFalse(self.is_ignored(path), path)

    def test_operational_data_and_credentials_remain_ignored(self) -> None:
        for path in (
            "data/private.sqlite",
            "data/.psyforge-local-token",
            "data/nested/source.json",
            ".psyforge-local-token",
            ".env",
            "node_modules/example/index.js",
            "dist/index.html",
        ):
            with self.subTest(path=path):
                self.assertTrue(self.is_ignored(path), path)


if __name__ == "__main__":
    unittest.main()
