#!/usr/bin/env python3
"""
Repository Analyzer

Analizza repository in Python:
- Detects tech stack
- Identifies dependencies
- Recognizes structure patterns
- Generates preliminary assessment
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Set, Optional, Any
from dataclasses import dataclass, asdict
from collections import defaultdict

# Tech stack detection patterns
TECH_PATTERNS = {
    "TypeScript": {
        "files": ["tsconfig.json", "*.ts", "*.tsx"],
        "keywords": ["typescript", "ts-"],
    },
    "Python": {
        "files": ["requirements.txt", "setup.py", "pyproject.toml", "*.py"],
        "keywords": ["python", "pip", "poetry"],
    },
    "JavaScript": {
        "files": ["package.json", "*.js", "*.jsx"],
        "keywords": ["javascript", "js"],
    },
    "Go": {
        "files": ["go.mod", "go.sum", "*.go"],
        "keywords": ["golang", "go"],
    },
    "Rust": {
        "files": ["Cargo.toml", "Cargo.lock", "*.rs"],
        "keywords": ["rust", "cargo"],
    },
    "React": {
        "files": ["package.json"],
        "keywords": ["react", "@react"],
        "dependencies": ["react", "react-dom"],
    },
    "FastAPI": {
        "files": ["requirements.txt", "setup.py"],
        "keywords": ["fastapi"],
        "dependencies": ["fastapi"],
    },
    "Django": {
        "files": ["requirements.txt", "manage.py"],
        "keywords": ["django"],
        "dependencies": ["django"],
    },
    "PostgreSQL": {
        "files": ["*.sql", "migrations"],
        "keywords": ["postgres", "psql"],
        "dependencies": ["psycopg2", "psycopg"],
    },
    "MongoDB": {
        "files": ["*.js", "package.json"],
        "keywords": ["mongodb", "mongo"],
        "dependencies": ["mongodb", "mongoose"],
    },
}


@dataclass
class TechStack:
    languages: List[str]
    frameworks: List[str]
    databases: List[str]
    tools: List[str]
    package_managers: List[str]


@dataclass
class RepoAnalysis:
    repo_path: str
    project_type: str
    tech_stack: TechStack
    dependencies: Dict[str, str]
    dev_dependencies: Dict[str, str]
    directory_structure: Dict[str, Any]
    file_count: int
    directory_count: int
    has_tests: bool
    has_docs: bool
    has_ci: bool
    main_language: str
    assessment: Dict[str, str]


class RepositoryAnalyzer:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        if not self.repo_path.exists():
            raise ValueError(f"Repository not found: {repo_path}")

        self.detected_techs: Set[str] = set()
        self.dependencies: Dict[str, str] = {}
        self.dev_dependencies: Dict[str, str] = {}

    def analyze(self) -> RepoAnalysis:
        """Perform complete repository analysis"""
        print(f"Analyzing repository: {self.repo_path}")

        # Detect technologies
        self._detect_technologies()

        # Parse dependencies
        self._parse_dependencies()

        # Analyze structure
        directory_structure = self._analyze_structure()

        # Count files
        file_count = self._count_files()
        directory_count = self._count_directories()

        # Check for features
        has_tests = self._has_tests()
        has_docs = self._has_documentation()
        has_ci = self._has_ci()

        # Determine main language
        main_language = self._determine_main_language()

        # Generate assessment
        assessment = self._generate_assessment(main_language)

        # Build tech stack
        tech_stack = self._build_tech_stack()

        # Determine project type
        project_type = self._determine_project_type()

        return RepoAnalysis(
            repo_path=str(self.repo_path),
            project_type=project_type,
            tech_stack=tech_stack,
            dependencies=self.dependencies,
            dev_dependencies=self.dev_dependencies,
            directory_structure=directory_structure,
            file_count=file_count,
            directory_count=directory_count,
            has_tests=has_tests,
            has_docs=has_docs,
            has_ci=has_ci,
            main_language=main_language,
            assessment=assessment,
        )

    def _detect_technologies(self) -> None:
        """Detect technologies used in the repository"""
        print("Detecting technologies...")

        for tech, patterns in TECH_PATTERNS.items():
            if self._matches_patterns(patterns):
                self.detected_techs.add(tech)

    def _matches_patterns(self, patterns: Dict) -> bool:
        """Check if patterns match in repository"""
        # Check files
        for file_pattern in patterns.get("files", []):
            if self._find_file_pattern(file_pattern):
                return True

        # Check keywords in filenames
        for keyword in patterns.get("keywords", []):
            if self._search_in_content(keyword):
                return True

        return False

    def _find_file_pattern(self, pattern: str) -> bool:
        """Find files matching pattern"""
        try:
            if "*" in pattern:
                # Glob pattern
                matches = list(self.repo_path.glob(pattern))
                return len(matches) > 0
            else:
                # Exact file
                return (self.repo_path / pattern).exists()
        except:
            return False

    def _search_in_content(self, keyword: str) -> bool:
        """Search keyword in package.json and other config files"""
        config_files = [
            "package.json",
            "requirements.txt",
            "setup.py",
            "pyproject.toml",
        ]

        for config_file in config_files:
            config_path = self.repo_path / config_file
            if config_path.exists():
                try:
                    with open(config_path, "r") as f:
                        content = f.read().lower()
                        if keyword.lower() in content:
                            return True
                except:
                    pass

        return False

    def _parse_dependencies(self) -> None:
        """Parse dependencies from package.json or requirements.txt"""
        print("Parsing dependencies...")

        # JavaScript/Node dependencies
        package_json = self.repo_path / "package.json"
        if package_json.exists():
            try:
                with open(package_json) as f:
                    data = json.load(f)
                    self.dependencies = data.get("dependencies", {})
                    self.dev_dependencies = data.get("devDependencies", {})
            except:
                pass

        # Python dependencies
        requirements_txt = self.repo_path / "requirements.txt"
        if requirements_txt.exists():
            try:
                with open(requirements_txt) as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            self.dependencies[line.split("==")[0]] = line
            except:
                pass

    def _analyze_structure(self) -> Dict[str, Any]:
        """Analyze directory structure"""
        print("Analyzing directory structure...")

        structure = {
            "directories": defaultdict(int),
            "key_files": [],
            "entry_points": [],
        }

        # Count top-level directories
        try:
            for item in self.repo_path.iterdir():
                if item.is_dir() and not item.name.startswith("."):
                    structure["directories"][item.name] += 1

                # Identify key files
                if item.is_file():
                    if item.name in [
                        "package.json",
                        "setup.py",
                        "Makefile",
                        "docker-compose.yml",
                    ]:
                        structure["key_files"].append(item.name)

                    # Identify entry points
                    if item.name in ["main.py", "server.py", "app.py", "index.ts"]:
                        structure["entry_points"].append(item.name)
        except:
            pass

        return structure

    def _count_files(self) -> int:
        """Count total files in repository"""
        count = 0
        try:
            for _ in self.repo_path.rglob("*"):
                if _.is_file():
                    count += 1
        except:
            pass
        return count

    def _count_directories(self) -> int:
        """Count total directories"""
        count = 0
        try:
            for _ in self.repo_path.rglob("*"):
                if _.is_dir():
                    count += 1
        except:
            pass
        return count

    def _has_tests(self) -> bool:
        """Check if repository has tests"""
        test_patterns = [
            "tests",
            "test",
            "__tests__",
            "spec",
            "*.test.*",
            "*.spec.*",
        ]
        for pattern in test_patterns:
            if self._find_file_pattern(pattern):
                return True
        return False

    def _has_documentation(self) -> bool:
        """Check if repository has documentation"""
        doc_files = ["README.md", "docs", "DOCUMENTATION.md", ".github/wiki"]
        for doc_file in doc_files:
            if (self.repo_path / doc_file).exists():
                return True
        return False

    def _has_ci(self) -> bool:
        """Check if repository has CI/CD"""
        ci_files = [
            ".github/workflows",
            ".gitlab-ci.yml",
            ".travis.yml",
            "Jenkinsfile",
        ]
        for ci_file in ci_files:
            if (self.repo_path / ci_file).exists():
                return True
        return False

    def _determine_main_language(self) -> str:
        """Determine the main programming language"""
        # Check file extensions
        extensions = defaultdict(int)
        py_count = 0
        ts_count = 0
        js_count = 0

        try:
            for file_path in self.repo_path.rglob("*"):
                if file_path.is_file():
                    suffix = file_path.suffix
                    if suffix == ".py":
                        py_count += 1
                    elif suffix in [".ts", ".tsx"]:
                        ts_count += 1
                    elif suffix in [".js", ".jsx"]:
                        js_count += 1
        except:
            pass

        if max(py_count, ts_count, js_count) == py_count:
            return "Python"
        elif max(py_count, ts_count, js_count) == ts_count:
            return "TypeScript"
        elif max(py_count, ts_count, js_count) == js_count:
            return "JavaScript"

        return "Unknown"

    def _determine_project_type(self) -> str:
        """Determine project type"""
        if any(
            tech in self.detected_techs
            for tech in ["React", "Vue", "Angular"]
        ):
            return "frontend"
        elif any(tech in self.detected_techs for tech in ["FastAPI", "Django"]):
            return "backend"
        elif len(self.detected_techs) >= 2:
            return "fullstack"
        else:
            return "library"

    def _build_tech_stack(self) -> TechStack:
        """Build technology stack object"""
        return TechStack(
            languages=self._filter_techs(["TypeScript", "Python", "JavaScript"]),
            frameworks=self._filter_techs(["React", "FastAPI", "Django"]),
            databases=self._filter_techs(["PostgreSQL", "MongoDB"]),
            tools=[],
            package_managers=self._filter_techs(["npm", "pip", "yarn"]),
        )

    def _filter_techs(self, techs: List[str]) -> List[str]:
        """Filter detected technologies"""
        return [tech for tech in techs if tech in self.detected_techs]

    def _generate_assessment(self, main_language: str) -> Dict[str, str]:
        """Generate assessment of the repository"""
        assessment = {
            "main_language": main_language,
            "has_tests": "yes" if self._has_tests() else "no",
            "has_documentation": "yes" if self._has_documentation() else "no",
            "has_ci": "yes" if self._has_ci() else "no",
            "complexity": "high" if len(self.detected_techs) > 3 else "medium"
            if len(self.detected_techs) > 1
            else "low",
        }
        return assessment


def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python repo_analyzer.py <repo_path>")
        sys.exit(1)

    repo_path = sys.argv[1]

    analyzer = RepositoryAnalyzer(repo_path)
    analysis = analyzer.analyze()

    # Print results
    print("\n" + "=" * 50)
    print("REPOSITORY ANALYSIS REPORT")
    print("=" * 50)
    print(f"Project Type: {analysis.project_type}")
    print(f"Main Language: {analysis.main_language}")
    print(f"File Count: {analysis.file_count}")
    print(f"Directory Count: {analysis.directory_count}")
    print(f"Has Tests: {analysis.has_tests}")
    print(f"Has Docs: {analysis.has_docs}")
    print(f"Has CI: {analysis.has_ci}")

    # Output as JSON
    print("\n" + json.dumps(asdict(analysis), indent=2, default=str))


if __name__ == "__main__":
    main()
