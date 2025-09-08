# file_manager.py: Professional file management system for chat app
# Maximum ~250 lines

import os
import json
import shutil
from datetime import datetime
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import jsonify, request, send_file
import mimetypes

class FileManager:
    def __init__(self, base_path="_databricks/uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        # Allowed file extensions for security
        self.allowed_extensions = {
            'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'csv', 'json', 'xml', 'md', 'py', 'js', 'html', 'css',
            'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp',
            'mp4', 'avi', 'mov', 'wmv', 'mp3', 'wav', 'ogg'
        }
        
        # Max file size: 50MB
        self.max_file_size = 50 * 1024 * 1024
    
    def is_allowed_file(self, filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def get_file_icon(self, filename):
        """Get appropriate icon for file type"""
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        
        icon_map = {
            # Documents
            'pdf': 'file-text', 'doc': 'file-text', 'docx': 'file-text',
            'txt': 'file-text', 'md': 'file-text',
            # Spreadsheets
            'xls': 'file-spreadsheet', 'xlsx': 'file-spreadsheet', 'csv': 'file-spreadsheet',
            # Presentations
            'ppt': 'file-presentation', 'pptx': 'file-presentation',
            # Images
            'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
            'svg': 'image', 'webp': 'image',
            # Videos
            'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video',
            # Audio
            'mp3': 'music', 'wav': 'music', 'ogg': 'music',
            # Code
            'py': 'code', 'js': 'code', 'html': 'code', 'css': 'code',
            'json': 'code', 'xml': 'code'
        }
        
        return icon_map.get(ext, 'file')
    
    def get_file_info(self, file_path):
        """Get detailed file information"""
        try:
            stat = file_path.stat()
            return {
                'name': file_path.name,
                'path': str(file_path.relative_to(self.base_path)),
                'size': stat.st_size,
                'size_formatted': self.format_file_size(stat.st_size),
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'modified_formatted': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M'),
                'type': 'file',
                'icon': self.get_file_icon(file_path.name),
                'mime_type': mimetypes.guess_type(str(file_path))[0] or 'application/octet-stream'
            }
        except Exception as e:
            return None
    
    def get_folder_info(self, folder_path):
        """Get folder information"""
        try:
            stat = folder_path.stat()
            children_count = len(list(folder_path.iterdir()))
            
            return {
                'name': folder_path.name,
                'path': str(folder_path.relative_to(self.base_path)),
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'modified_formatted': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M'),
                'type': 'folder',
                'icon': 'folder',
                'children_count': children_count
            }
        except Exception as e:
            return None
    
    def format_file_size(self, size_bytes):
        """Format file size in human readable format"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB"]
        i = 0
        while size_bytes >= 1024 and i < len(size_names) - 1:
            size_bytes /= 1024.0
            i += 1
        
        return f"{size_bytes:.1f} {size_names[i]}"
    
    def list_directory(self, relative_path=""):
        """List directory contents with full metadata"""
        try:
            target_path = self.base_path / relative_path if relative_path else self.base_path
            
            if not target_path.exists() or not target_path.is_dir():
                return {'error': 'Directory not found'}, 404
            
            items = []
            
            # Add folders first
            for item in sorted(target_path.iterdir()):
                if item.is_dir():
                    folder_info = self.get_folder_info(item)
                    if folder_info:
                        items.append(folder_info)
            
            # Add files
            for item in sorted(target_path.iterdir()):
                if item.is_file():
                    file_info = self.get_file_info(item)
                    if file_info:
                        items.append(file_info)
            
            return {
                'success': True,
                'path': relative_path,
                'files': items,
                'total_count': len(items)
            }, 200
            
        except Exception as e:
            return {'success': False, 'error': f'Failed to list directory: {str(e)}'}, 500
    
    def create_folder(self, relative_path, folder_name):
        """Create a new folder"""
        try:
            folder_name = secure_filename(folder_name)
            if not folder_name:
                return {'success': False, 'error': 'Invalid folder name'}, 400
            
            parent_path = self.base_path / relative_path if relative_path else self.base_path
            new_folder_path = parent_path / folder_name
            
            if new_folder_path.exists():
                return {'success': False, 'error': 'Folder already exists'}, 409
            
            new_folder_path.mkdir(parents=True)
            
            return {
                'success': True,
                'message': 'Folder created successfully',
                'folder': self.get_folder_info(new_folder_path)
            }, 201
            
        except Exception as e:
            return {'success': False, 'error': f'Failed to create folder: {str(e)}'}, 500
    
    def upload_file(self, file, relative_path=""):
        """Upload a file to specified directory"""
        try:
            if not file or file.filename == '':
                return {'success': False, 'error': 'No file selected'}, 400
            
            if not self.is_allowed_file(file.filename):
                return {'success': False, 'error': 'File type not allowed'}, 400
            
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > self.max_file_size:
                return {'success': False, 'error': f'File too large. Max size: {self.format_file_size(self.max_file_size)}'}, 400
            
            filename = secure_filename(file.filename)
            target_dir = self.base_path / relative_path if relative_path else self.base_path
            target_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = target_dir / filename
            
            # Handle duplicate filenames
            counter = 1
            original_name = filename
            while file_path.exists():
                name, ext = os.path.splitext(original_name)
                filename = f"{name}_{counter}{ext}"
                file_path = target_dir / filename
                counter += 1
            
            file.save(str(file_path))
            
            return {
                'success': True,
                'message': 'File uploaded successfully',
                'file': self.get_file_info(file_path)
            }, 201
            
        except Exception as e:
            return {'success': False, 'error': f'Failed to upload file: {str(e)}'}, 500
    
    def delete_item(self, relative_path):
        """Delete a file or folder"""
        try:
            target_path = self.base_path / relative_path
            
            if not target_path.exists():
                return {'success': False, 'error': 'Item not found'}, 404
            
            if target_path.is_file():
                target_path.unlink()
            else:
                shutil.rmtree(str(target_path))
            
            return {'success': True, 'message': 'Item deleted successfully'}, 200
            
        except Exception as e:
            return {'success': False, 'error': f'Failed to delete item: {str(e)}'}, 500
    
    def rename_item(self, relative_path, new_name):
        """Rename a file or folder"""
        try:
            new_name = secure_filename(new_name)
            if not new_name:
                return {'success': False, 'error': 'Invalid name'}, 400
            
            old_path = self.base_path / relative_path
            if not old_path.exists():
                return {'success': False, 'error': 'Item not found'}, 404
            
            new_path = old_path.parent / new_name
            if new_path.exists():
                return {'success': False, 'error': 'Item with this name already exists'}, 409
            
            old_path.rename(new_path)
            
            if new_path.is_file():
                item_info = self.get_file_info(new_path)
            else:
                item_info = self.get_folder_info(new_path)
            
            return {
                'success': True,
                'message': 'Item renamed successfully',
                'item': item_info
            }, 200
            
        except Exception as e:
            return {'success': False, 'error': f'Failed to rename item: {str(e)}'}, 500
    
    def get_file_content(self, relative_path):
        """Get file content for preview (text files only)"""
        try:
            file_path = self.base_path / relative_path
            
            if not file_path.exists() or not file_path.is_file():
                return {'error': 'File not found'}, 404
            
            # Only return content for text files under 1MB
            if file_path.stat().st_size > 1024 * 1024:
                return {'error': 'File too large for preview'}, 400
            
            mime_type = mimetypes.guess_type(str(file_path))[0] or ''
            if not mime_type.startswith('text/'):
                return {'error': 'File type not supported for preview'}, 400
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            return {
                'content': content,
                'mime_type': mime_type,
                'file': self.get_file_info(file_path)
            }, 200
            
        except Exception as e:
            return {'error': f'Failed to read file: {str(e)}'}, 500
    
    def copy_files(self, files, destination_path=''):
        """Copy multiple files to destination"""
        try:
            dest_dir = self.base_path / destination_path if destination_path else self.base_path
            dest_dir.mkdir(parents=True, exist_ok=True)
            
            copied_files = []
            
            for file_path in files:
                source = self.base_path / file_path
                if not source.exists():
                    continue
                    
                filename = source.name
                dest_file = dest_dir / filename
                
                # Handle name conflicts
                counter = 1
                original_name = dest_file.stem
                extension = dest_file.suffix
                
                while dest_file.exists():
                    dest_file = dest_dir / f"{original_name}_copy_{counter}{extension}"
                    counter += 1
                
                if source.is_file():
                    shutil.copy2(source, dest_file)
                else:
                    shutil.copytree(source, dest_file)
                    
                copied_files.append(str(dest_file.relative_to(self.base_path)))
            
            return {
                'success': True,
                'copied_files': copied_files,
                'message': f'Copied {len(copied_files)} items'
            }, 200
            
        except Exception as e:
            return {'error': f'Failed to copy files: {str(e)}'}, 500
    
    def move_files(self, files, destination_path=''):
        """Move multiple files to destination"""
        try:
            dest_dir = self.base_path / destination_path if destination_path else self.base_path
            dest_dir.mkdir(parents=True, exist_ok=True)
            
            moved_files = []
            
            for file_path in files:
                source = self.base_path / file_path
                if not source.exists():
                    continue
                    
                filename = source.name
                dest_file = dest_dir / filename
                
                # Handle name conflicts
                counter = 1
                original_name = dest_file.stem
                extension = dest_file.suffix
                
                while dest_file.exists():
                    dest_file = dest_dir / f"{original_name}_{counter}{extension}"
                    counter += 1
                
                shutil.move(str(source), str(dest_file))
                moved_files.append(str(dest_file.relative_to(self.base_path)))
            
            return {
                'success': True,
                'moved_files': moved_files,
                'message': f'Moved {len(moved_files)} items'
            }, 200
            
        except Exception as e:
            return {'error': f'Failed to move files: {str(e)}'}, 500
    
    def bulk_delete(self, files):
        """Delete multiple files"""
        try:
            deleted_files = []
            
            for file_path in files:
                full_path = self.base_path / file_path
                if full_path.exists():
                    if full_path.is_file():
                        full_path.unlink()
                    else:
                        shutil.rmtree(full_path)
                    deleted_files.append(file_path)
            
            return {
                'success': True,
                'deleted_files': deleted_files,
                'message': f'Deleted {len(deleted_files)} items'
            }, 200
            
        except Exception as e:
            return {'error': f'Failed to delete files: {str(e)}'}, 500
