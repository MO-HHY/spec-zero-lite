#!/usr/bin/env python3
"""
Metadata Manager

Gestisce directory _meta/:
- Salva e carica specs, logs, cache, state.json
- Thread-safe operations
- Validation di formato YAML + markdown
"""

import os
import json
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import threading
from dataclasses import dataclass, asdict


@dataclass
class NodeMetadata:
    node_id: str
    node_name: str
    layer: int
    dependencies: List[str]
    status: str  # pending, completed, failed
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_seconds: Optional[float] = None
    output_path: Optional[str] = None
    error: Optional[str] = None


class MetadataManager:
    """Gestisce la directory _meta/ con thread-safety"""

    def __init__(self, meta_path: str):
        self.meta_path = Path(meta_path)
        self.locks: Dict[str, threading.Lock] = {}
        self._ensure_structure()

    def _ensure_structure(self):
        """Crea struttura _meta/ se non esiste"""
        directories = [
            "",
            "logs",
            "cache",
            "02-nodes",
        ]

        for subdir in directories:
            dir_path = self.meta_path / subdir
            dir_path.mkdir(parents=True, exist_ok=True)

    def _get_lock(self, resource: str) -> threading.Lock:
        """Ottieni lock per risorsa (thread-safe)"""
        if resource not in self.locks:
            self.locks[resource] = threading.Lock()
        return self.locks[resource]

    # ===== Overview Management =====

    def save_overview(self, content: str) -> str:
        """Salva 00-overview.md"""
        path = self.meta_path / "00-overview.md"
        with self._get_lock("overview"):
            with open(path, "w") as f:
                f.write(content)
        return str(path)

    def load_overview(self) -> Optional[str]:
        """Carica 00-overview.md"""
        path = self.meta_path / "00-overview.md"
        if path.exists():
            with open(path, "r") as f:
                return f.read()
        return None

    # ===== DAG Management =====

    def save_dag(self, content: str) -> str:
        """Salva 01-dag.md"""
        path = self.meta_path / "01-dag.md"
        with self._get_lock("dag"):
            with open(path, "w") as f:
                f.write(content)
        return str(path)

    def load_dag(self) -> Optional[str]:
        """Carica 01-dag.md"""
        path = self.meta_path / "01-dag.md"
        if path.exists():
            with open(path, "r") as f:
                return f.read()
        return None

    # ===== Node Specs Management =====

    def save_node_spec(self, node_id: str, content: str) -> str:
        """Salva node spec"""
        path = self.meta_path / "02-nodes" / f"node-{node_id}.md"
        with self._get_lock(f"node-{node_id}"):
            with open(path, "w") as f:
                f.write(content)
        return str(path)

    def load_node_spec(self, node_id: str) -> Optional[str]:
        """Carica node spec"""
        path = self.meta_path / "02-nodes" / f"node-{node_id}.md"
        if path.exists():
            with open(path, "r") as f:
                return f.read()
        return None

    def list_node_specs(self) -> List[str]:
        """Lista tutti i node specs"""
        nodes_dir = self.meta_path / "02-nodes"
        if nodes_dir.exists():
            return [
                f.stem for f in nodes_dir.glob("node-*.md")
            ]
        return []

    # ===== Logging =====

    def append_log(self, log_entry: Dict[str, Any]) -> None:
        """Appendi entry al log (thread-safe)"""
        log_path = self.meta_path / "logs" / "orchestrator.log"

        with self._get_lock("orchestrator.log"):
            with open(log_path, "a") as f:
                f.write(json.dumps(log_entry) + "\n")

    def read_logs(self, limit: Optional[int] = None) -> List[Dict]:
        """Leggi log entries"""
        log_path = self.meta_path / "logs" / "orchestrator.log"
        entries = []

        if log_path.exists():
            with open(log_path, "r") as f:
                for line in f:
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass

        if limit:
            entries = entries[-limit:]

        return entries

    def create_node_log(self, node_id: str) -> Path:
        """Crea log file per nodo"""
        log_path = self.meta_path / "logs" / f"node-{node_id}.log"
        with self._get_lock(f"node-{node_id}.log"):
            log_path.touch(exist_ok=True)
        return log_path

    # ===== Cache Management =====

    def save_summary(self, node_id: str, content: str) -> str:
        """Salva summary di nodo (per dependency injection)"""
        cache_path = self.meta_path / "cache" / f"summary-{node_id}.md"
        with self._get_lock(f"summary-{node_id}"):
            with open(cache_path, "w") as f:
                f.write(content)
        return str(cache_path)

    def load_summary(self, node_id: str) -> Optional[str]:
        """Carica summary di nodo"""
        cache_path = self.meta_path / "cache" / f"summary-{node_id}.md"
        if cache_path.exists():
            with open(cache_path, "r") as f:
                return f.read()
        return None

    def list_summaries(self) -> Dict[str, str]:
        """Lista tutti i summaries"""
        cache_dir = self.meta_path / "cache"
        summaries = {}

        if cache_dir.exists():
            for summary_file in cache_dir.glob("summary-*.md"):
                node_id = summary_file.stem.replace("summary-", "")
                with open(summary_file, "r") as f:
                    summaries[node_id] = f.read()

        return summaries

    # ===== State Management =====

    def save_state(self, state: Dict[str, Any]) -> str:
        """Salva state.json"""
        state_path = self.meta_path / "state.json"

        with self._get_lock("state.json"):
            with open(state_path, "w") as f:
                json.dump(state, f, indent=2)

        return str(state_path)

    def load_state(self) -> Dict[str, Any]:
        """Carica state.json"""
        state_path = self.meta_path / "state.json"

        if state_path.exists():
            with open(state_path, "r") as f:
                return json.load(f)

        # Default initial state
        return {
            "session_id": self._generate_uuid(),
            "start_time": datetime.now().isoformat(),
            "current_state": "idle",
            "current_layer": 0,
            "completed_nodes": [],
            "failed_nodes": [],
            "resumable": False,
            "last_error": None,
        }

    def update_state(self, updates: Dict[str, Any]) -> None:
        """Aggiorna state.json (merge)"""
        current = self.load_state()
        current.update(updates)
        self.save_state(current)

    # ===== Manifest Management =====

    def save_manifest(self, manifest: Dict[str, Any]) -> str:
        """Salva manifest.json finale"""
        manifest_path = self.meta_path / "manifest.json"

        manifest["generated_at"] = datetime.now().isoformat()

        with self._get_lock("manifest.json"):
            with open(manifest_path, "w") as f:
                json.dump(manifest, f, indent=2)

        return str(manifest_path)

    def load_manifest(self) -> Optional[Dict]:
        """Carica manifest.json"""
        manifest_path = self.meta_path / "manifest.json"

        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                return json.load(f)

        return None

    # ===== Validation =====

    def validate_frontmatter(self, content: str) -> bool:
        """Valida YAML frontmatter"""
        try:
            if content.startswith("---\n"):
                end_idx = content.find("\n---\n", 4)
                if end_idx != -1:
                    yaml_str = content[4:end_idx]
                    yaml.safe_load(yaml_str)
                    return True
        except yaml.YAMLError:
            return False
        return False

    def validate_markdown(self, content: str) -> bool:
        """Validazione base di markdown"""
        # Check code block balance
        code_block_count = content.count("```")
        if code_block_count % 2 != 0:
            return False

        return True

    # ===== Utility =====

    @staticmethod
    def _generate_uuid() -> str:
        """Genera UUID v4"""
        import uuid
        return str(uuid.uuid4())

    def cleanup_old_logs(self, days: int = 30) -> int:
        """Rimuovi log vecchi"""
        import time
        cutoff_time = time.time() - (days * 86400)
        removed = 0

        logs_dir = self.meta_path / "logs"
        if logs_dir.exists():
            for log_file in logs_dir.glob("*.log"):
                if log_file.stat().st_mtime < cutoff_time:
                    log_file.unlink()
                    removed += 1

        return removed

    def get_stats(self) -> Dict[str, Any]:
        """Ottieni statistiche _meta/"""
        return {
            "meta_size": self._dir_size(self.meta_path),
            "node_specs": len(self.list_node_specs()),
            "log_entries": len(self.read_logs()),
            "summaries": len(self.list_summaries()),
            "has_state": (self.meta_path / "state.json").exists(),
            "has_manifest": (self.meta_path / "manifest.json").exists(),
        }

    @staticmethod
    def _dir_size(path: Path) -> int:
        """Calcola size di directory"""
        size = 0
        for file in path.rglob("*"):
            if file.is_file():
                size += file.stat().st_size
        return size


def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python metadata_manager.py <meta_path>")
        sys.exit(1)

    meta_path = sys.argv[1]

    manager = MetadataManager(meta_path)

    # Test operations
    print(f"Metadata Manager initialized at: {meta_path}")
    print(f"Stats: {json.dumps(manager.get_stats(), indent=2)}")

    # Load state
    state = manager.load_state()
    print(f"\nState: {json.dumps(state, indent=2)}")


if __name__ == "__main__":
    main()
