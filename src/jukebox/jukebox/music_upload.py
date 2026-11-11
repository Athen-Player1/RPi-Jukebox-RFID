  """Receive music uploads from the local nginx proxy."""
import json
import logging
import os
import shutil
import subprocess
import tempfile
import threading
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from mutagen import MutagenError
from mutagen.mp3 import MP3

logger = logging.getLogger('jb.music_upload')
MAX_BYTES = 64 * 1024 * 1024
RESERVE_BYTES = 64 * 1024 * 1024


class UploadError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def safe_name(value):
    return (value and value == value.strip() and not value.startswith('.')
            and not any(char in '/\\' or ord(char) < 32 or ord(char) == 127 for char in value)
            and len(value.encode('utf-8')) <= 240)


class MusicUploadHandler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def log_message(self, message, *args):
        logger.debug(message, *args)

    def reply(self, status, **data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            result = self.save_upload()
        except UploadError as error:
            self.reply(error.status, error=str(error))
        except OSError:
            logger.exception('Could not save music upload')
            self.reply(HTTPStatus.INTERNAL_SERVER_ERROR, error='Could not save the file to the Pi.')
        else:
            self.reply(HTTPStatus.CREATED, **result)

    def save_upload(self):
        url = urlsplit(self.path)
        if url.path != '/api/music-upload':
            raise UploadError(HTTPStatus.NOT_FOUND, 'Upload endpoint not found.')
        host = self.headers.get('Host')
        scheme = self.headers.get('X-Forwarded-Proto')
        if not host or scheme not in ('http', 'https') or self.headers.get('Origin') != f'{scheme}://{host}':
            raise UploadError(HTTPStatus.FORBIDDEN, 'Open the Phoniebox web UI to upload music.')
        if self.headers.get_content_type() != 'application/octet-stream':
            raise UploadError(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, 'Expected a binary music upload.')

        try:
            length = int(self.headers.get('Content-Length', ''))
            params = parse_qs(url.query, max_num_fields=2)
            folder, = params['folder']
            filename, = params['name']
        except (KeyError, ValueError):
            raise UploadError(HTTPStatus.BAD_REQUEST, 'A folder, filename and file size are required.') from None
        if not safe_name(folder) or not safe_name(filename) or not filename.lower().endswith('.mp3'):
            raise UploadError(HTTPStatus.BAD_REQUEST, 'Choose an MP3 and enter a simple folder name.')
        if length <= 0 or length > MAX_BYTES:
            raise UploadError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, 'MP3s must be between 1 byte and 64 MiB.')

        root = self.server.music_root.resolve(strict=True)
        directory = root / folder
        if directory.is_symlink() or (directory.exists() and not directory.is_dir()):
            raise UploadError(HTTPStatus.CONFLICT, 'That folder name is unavailable.')
        if shutil.disk_usage(root).free < length + RESERVE_BYTES:
            raise UploadError(HTTPStatus.SERVICE_UNAVAILABLE, 'The Pi is running low on storage.')

        # Keep partial uploads out of MPD's index and publish complete tracks atomically.
        with tempfile.NamedTemporaryFile(dir=root, prefix='.upload-') as temporary:
            remaining = length
            while remaining:
                block = self.rfile.read(min(remaining, 65536))
                if not block:
                    raise UploadError(HTTPStatus.BAD_REQUEST, 'The upload ended before the file was complete.')
                temporary.write(block)
                remaining -= len(block)
            temporary.flush()
            try:
                MP3(temporary.name)
            except MutagenError:
                raise UploadError(HTTPStatus.BAD_REQUEST, 'The file could not be read as MP3 audio.') from None
            directory.mkdir(exist_ok=True)
            if directory.is_symlink():
                raise UploadError(HTTPStatus.CONFLICT, 'That folder name is unavailable.')
            os.chmod(temporary.name, 0o644)
            try:
                os.link(temporary.name, directory / filename)
            except FileExistsError:
                raise UploadError(HTTPStatus.CONFLICT, 'That file already exists in this folder.') from None

        try:
            subprocess.run(['mpc', 'update', '--wait'], check=True, timeout=35,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except (OSError, subprocess.SubprocessError):
            logger.warning('Music was saved, but the MPD library scan did not finish.')
            return {'indexed': False}
        return {'indexed': True}


def start_music_upload():
    """Listen on loopback so the browser reaches the service through nginx."""
    try:
        server = HTTPServer(('127.0.0.1', 8766), MusicUploadHandler)
    except OSError:
        logger.exception('Could not start the music upload service')
        return None
    server.music_root = Path(__file__).resolve().parents[3] / 'shared' / 'audiofolders'
    threading.Thread(target=server.serve_forever, daemon=True, name='MusicUpload').start()
    return server
