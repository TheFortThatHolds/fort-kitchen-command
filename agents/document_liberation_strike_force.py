#!/usr/bin/env python3
"""
Fort Document Liberation Strike Force
Multi-agent system for massive document deduplication and organization
Built for the productively lazy who have 5K+ documents to organize

Agents:
- Duplicate Hunter: Finds identical files by hash
- Folder Organizer: Sorts by project/type/date  
- Size Optimizer: Finds huge files that don't need backup
- Version Controller: Identifies different versions of same doc
- Junk Detector: Spots temp files, cached crap, system files
- Progress Reporter: Updates without spam
- Safety Net: Creates restore points before moves
"""

import os
import hashlib
import shutil
import json
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import time

class Agent:
    """Base agent class"""
    def __init__(self, name):
        self.name = name
        self.log = []
        
    def report(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {self.name}: {message}"
        self.log.append(log_entry)
        print(log_entry)

class DuplicateHunterAgent(Agent):
    """Finds duplicate files by hash - the nuclear option"""
    def __init__(self):
        super().__init__("Duplicate-Hunter")
        
    def get_file_hash(self, filepath):
        """Get SHA256 hash of file"""
        try:
            with open(filepath, 'rb') as f:
                return hashlib.sha256(f.read()).hexdigest()
        except Exception as e:
            self.report(f"Error hashing {filepath}: {e}")
            return None
    
    def find_duplicates(self, directory):
        """Find all duplicate files in directory tree"""
        self.report(f"Scanning for duplicates in {directory}")
        
        hash_map = defaultdict(list)
        file_count = 0
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                filepath = Path(root) / file
                if filepath.exists() and filepath.is_file():
                    file_hash = self.get_file_hash(filepath)
                    if file_hash:
                        hash_map[file_hash].append(filepath)
                        file_count += 1
                    
                    if file_count % 100 == 0:
                        self.report(f"Processed {file_count} files...")
        
        # Find actual duplicates (hash appears more than once)
        duplicates = {h: paths for h, paths in hash_map.items() if len(paths) > 1}
        
        self.report(f"Found {len(duplicates)} sets of duplicates from {file_count} files")
        return duplicates, hash_map

class FolderOrganizerAgent(Agent):
    """Organizes files by project/type/date"""
    def __init__(self):
        super().__init__("Folder-Organizer")
        
        # File type classifications
        self.type_patterns = {
            'documents': ['.md', '.txt', '.docx', '.pdf'],
            'code': ['.py', '.js', '.html', '.css', '.json'],
            'audio': ['.wav', '.mp3', '.flac', '.m4a'],
            'images': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
            'config': ['.ini', '.cfg', '.conf', '.toml', '.yaml'],
            'living_scrolls': ['LIVING_SCROLL'],
            'fort_projects': ['fort-', 'Fort', 'FORT'],
        }
    
    def classify_file(self, filepath):
        """Determine file category"""
        file_path = Path(filepath)
        filename = file_path.name.lower()
        suffix = file_path.suffix.lower()
        
        # Special cases first
        if 'living_scroll' in filename:
            return 'living_scrolls'
        
        if any(pattern.lower() in filename for pattern in self.type_patterns['fort_projects']):
            return 'fort_projects'
            
        # By file extension
        for category, extensions in self.type_patterns.items():
            if suffix in extensions:
                return category
                
        return 'other'
    
    def suggest_organization(self, files):
        """Suggest folder structure for files"""
        self.report("Analyzing file organization patterns...")
        
        categories = defaultdict(list)
        for filepath in files:
            category = self.classify_file(filepath)
            categories[category].append(filepath)
            
        self.report(f"Organization suggestion:")
        for category, file_list in categories.items():
            self.report(f"  {category}: {len(file_list)} files")
            
        return categories

class SizeOptimizerAgent(Agent):
    """Finds huge files that might not need backup"""
    def __init__(self):
        super().__init__("Size-Optimizer")
        
    def analyze_sizes(self, directory):
        """Find suspiciously large files"""
        self.report(f"Analyzing file sizes in {directory}")
        
        large_files = []
        total_size = 0
        file_count = 0
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                filepath = Path(root) / file
                if filepath.exists():
                    try:
                        size = filepath.stat().st_size
                        total_size += size
                        file_count += 1
                        
                        # Flag files over 100MB
                        if size > 100 * 1024 * 1024:
                            large_files.append((filepath, size))
                            
                    except Exception as e:
                        self.report(f"Error checking size of {filepath}: {e}")
        
        # Sort by size
        large_files.sort(key=lambda x: x[1], reverse=True)
        
        self.report(f"Total: {file_count} files, {total_size / (1024*1024):.1f} MB")
        self.report(f"Found {len(large_files)} files over 100MB")
        
        for filepath, size in large_files[:10]:  # Top 10
            mb_size = size / (1024 * 1024)
            self.report(f"  {mb_size:.1f} MB: {filepath.name}")
            
        return large_files, total_size

class JunkDetectorAgent(Agent):
    """Spots temp files, cache, system junk"""
    def __init__(self):
        super().__init__("Junk-Detector")
        
        self.junk_patterns = [
            r'\.tmp$', r'\.temp$', r'\.cache$', r'~$',
            r'desktop\.ini$', r'thumbs\.db$', r'\.ds_store$',
            r'__pycache__', r'\.pyc$', r'\.pyo$',
            r'node_modules', r'\.git', r'\.vscode',
            r'\.log$', r'error\.log', r'debug\.log'
        ]
        
    def is_junk(self, filepath):
        """Check if file matches junk patterns"""
        path_str = str(filepath).lower()
        filename = Path(filepath).name.lower()
        
        for pattern in self.junk_patterns:
            if re.search(pattern, path_str) or re.search(pattern, filename):
                return True
        return False
        
    def find_junk(self, directory):
        """Find all junk files"""
        self.report(f"Scanning for junk files in {directory}")
        
        junk_files = []
        junk_size = 0
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                filepath = Path(root) / file
                if self.is_junk(filepath):
                    try:
                        size = filepath.stat().st_size
                        junk_files.append((filepath, size))
                        junk_size += size
                    except:
                        junk_files.append((filepath, 0))
        
        mb_size = junk_size / (1024 * 1024)
        self.report(f"Found {len(junk_files)} junk files, {mb_size:.1f} MB total")
        
        return junk_files

class ProgressReporterAgent(Agent):
    """Updates on progress without spam"""
    def __init__(self):
        super().__init__("Progress-Reporter")
        self.start_time = time.time()
        
    def report_progress(self, current, total, operation="Processing"):
        """Report progress with ETA"""
        if current % 50 == 0 or current == total:  # Report every 50 items
            elapsed = time.time() - self.start_time
            if current > 0:
                eta = (elapsed / current) * (total - current)
                eta_min = eta / 60
                self.report(f"{operation}: {current}/{total} ({current/total*100:.1f}%) ETA: {eta_min:.1f}min")
            else:
                self.report(f"{operation}: {current}/{total} (0.0%)")

class SafetyNetAgent(Agent):
    """Creates restore points before major operations"""
    def __init__(self):
        super().__init__("Safety-Net")
        
    def create_backup_manifest(self, source_dir, backup_dir):
        """Create manifest of what we're about to do"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        manifest_path = Path(backup_dir) / f"backup_manifest_{timestamp}.json"
        
        self.report(f"Creating backup manifest: {manifest_path}")
        
        manifest = {
            'timestamp': timestamp,
            'source_directory': str(source_dir),
            'backup_directory': str(backup_dir),
            'files': []
        }
        
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                filepath = Path(root) / file
                if filepath.exists():
                    manifest['files'].append({
                        'path': str(filepath),
                        'size': filepath.stat().st_size,
                        'modified': filepath.stat().st_mtime
                    })
        
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
            
        self.report(f"Manifest created with {len(manifest['files'])} files")
        return manifest_path

class DocumentLiberationForce:
    """Coordinator for all agents"""
    def __init__(self):
        self.agents = {
            'duplicate_hunter': DuplicateHunterAgent(),
            'folder_organizer': FolderOrganizerAgent(), 
            'size_optimizer': SizeOptimizerAgent(),
            'junk_detector': JunkDetectorAgent(),
            'progress_reporter': ProgressReporterAgent(),
            'safety_net': SafetyNetAgent()
        }
        
    def execute_mission(self, source_dir, target_dir):
        """Run the full document liberation mission"""
        print("🏰 FORT DOCUMENT LIBERATION STRIKE FORCE ACTIVATED 🏰")
        print(f"Mission: Liberate documents from {source_dir} to {target_dir}")
        print("=" * 60)
        
        # Phase 1: Intelligence gathering
        print("\n📊 PHASE 1: INTELLIGENCE GATHERING")
        duplicates, all_hashes = self.agents['duplicate_hunter'].find_duplicates(source_dir)
        categories = self.agents['folder_organizer'].suggest_organization(all_hashes.keys())
        large_files, total_size = self.agents['size_optimizer'].analyze_sizes(source_dir)
        junk_files = self.agents['junk_detector'].find_junk(source_dir)
        
        # Phase 2: Safety preparations  
        print("\n🛡️ PHASE 2: SAFETY PREPARATIONS")
        if not Path(target_dir).exists():
            Path(target_dir).mkdir(parents=True, exist_ok=True)
        
        manifest = self.agents['safety_net'].create_backup_manifest(source_dir, target_dir)
        
        # Phase 3: Report findings
        print("\n📋 PHASE 3: MISSION REPORT")
        print(f"Total files found: {len(all_hashes)}")
        print(f"Duplicate sets: {len(duplicates)}")
        print(f"Large files (>100MB): {len(large_files)}")
        print(f"Junk files: {len(junk_files)}")
        print(f"Total size: {total_size / (1024*1024):.1f} MB")
        
        # Generate summary report
        report_path = Path(target_dir) / "liberation_report.json"
        report = {
            'timestamp': datetime.now().isoformat(),
            'source': str(source_dir),
            'target': str(target_dir),
            'total_files': len(all_hashes),
            'duplicate_sets': len(duplicates),
            'large_files': len(large_files),
            'junk_files': len(junk_files),
            'total_size_mb': total_size / (1024*1024),
            'categories': {k: len(v) for k, v in categories.items()},
            'agent_logs': {name: agent.log for name, agent in self.agents.items()}
        }
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"\n✅ Mission report saved: {report_path}")
        print("🏰 DOCUMENT LIBERATION STRIKE FORCE MISSION COMPLETE 🏰")
        
        return report

def main():
    """CLI interface for the strike force"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fort Document Liberation Strike Force')
    parser.add_argument('source', help='Source directory to liberate')
    parser.add_argument('target', help='Target directory for liberated documents')
    parser.add_argument('--dry-run', action='store_true', help='Analyze only, no moves')
    
    args = parser.parse_args()
    
    force = DocumentLiberationForce()
    report = force.execute_mission(args.source, args.target)
    
    if args.dry_run:
        print("\n🔍 DRY RUN COMPLETE - No files were moved")
    else:
        print(f"\n📁 Ready to liberate {report['total_files']} documents!")

if __name__ == "__main__":
    main()