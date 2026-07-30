'use strict';

/**
 * Google Drive remote implementing the V2-4 sync remote contract
 * (same surface as FileRemote: getVersions / putTable / getTable).
 * Uses OAuth access token; never logs tokens.
 */
const crypto = require('crypto');
const https = require('https');

function sha256(s) {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

function request(method, url, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({ status: res.statusCode, headers: res.headers, buf, text: buf.toString('utf8') });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

class GoogleDriveRemote {
  /**
   * @param {{ accessToken: string, rootPrefix?: string }} opts
   */
  constructor(opts) {
    if (!opts?.accessToken) throw new Error('access_token_required');
    this.accessToken = opts.accessToken;
    this.rootPrefix = opts.rootPrefix || 'NajjarTech';
    this._folderCache = new Map(); // path -> folderId
  }

  authHeaders(extra = {}) {
    return { Authorization: `Bearer ${this.accessToken}`, ...extra };
  }

  centerRoot(centerId) {
    return `${this.rootPrefix}/centers/${centerId}`;
  }

  branchDir(centerId, branchId) {
    return `${this.centerRoot(centerId)}/branches/${branchId}`;
  }

  versionsPath(centerId, branchId) {
    return `${this.branchDir(centerId, branchId)}/versions.json`;
  }

  tablePath(centerId, branchId, table) {
    return `${this.branchDir(centerId, branchId)}/operational/${table}.json`;
  }

  async ensureFolderPath(remoteDir) {
    const parts = String(remoteDir || '')
      .split('/')
      .filter(Boolean);
    let parentId = 'root';
    let pathAcc = '';
    for (const part of parts) {
      pathAcc = pathAcc ? `${pathAcc}/${part}` : part;
      if (this._folderCache.has(pathAcc)) {
        parentId = this._folderCache.get(pathAcc);
        continue;
      }
      const q = encodeURIComponent(
        `name='${part.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
      );
      const list = await request(
        'GET',
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`,
        { headers: this.authHeaders() }
      );
      let folderId = null;
      if (list.status === 200) {
        try {
          folderId = JSON.parse(list.text).files?.[0]?.id || null;
        } catch {
          folderId = null;
        }
      }
      if (!folderId) {
        const meta = JSON.stringify({
          name: part,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        });
        const created = await request('POST', 'https://www.googleapis.com/drive/v3/files?fields=id,name', {
          headers: this.authHeaders({ 'Content-Type': 'application/json' }),
          body: meta,
        });
        if (created.status < 200 || created.status >= 300) {
          throw new Error(`drive_mkdir_failed:${created.status}`);
        }
        folderId = JSON.parse(created.text).id;
      }
      this._folderCache.set(pathAcc, folderId);
      parentId = folderId;
    }
    return parentId;
  }

  async findFile(remotePath) {
    const parts = String(remotePath).split('/').filter(Boolean);
    const fileName = parts.pop();
    const parentId = await this.ensureFolderPath(parts.join('/'));
    const q = encodeURIComponent(
      `name='${fileName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`
    );
    const list = await request(
      'GET',
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,md5Checksum,modifiedTime)&pageSize=5`,
      { headers: this.authHeaders() }
    );
    if (list.status !== 200) return null;
    const files = JSON.parse(list.text).files || [];
    return files[0] || null;
  }

  async downloadJson(remotePath) {
    const file = await this.findFile(remotePath);
    if (!file?.id) return null;
    const dl = await request('GET', `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
      headers: this.authHeaders(),
    });
    if (dl.status !== 200) throw new Error(`drive_download_failed:${dl.status}`);
    try {
      return { data: JSON.parse(dl.text), fileId: file.id, md5: file.md5Checksum || null };
    } catch {
      throw new Error('remote_corrupt_json');
    }
  }

  /**
   * Atomic replace: upload temp → verify → update/create final → delete temp.
   */
  async writeAtomic(remotePath, obj) {
    const body = JSON.stringify(obj, null, 2);
    const hash = sha256(body);
    const parts = String(remotePath).split('/').filter(Boolean);
    const fileName = parts.pop();
    const dir = parts.join('/');
    const parentId = await this.ensureFolderPath(dir);
    const tempName = `.${fileName}.tmp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const uploadMultipart = async (name, content, existingId) => {
      const boundary = 'v24_' + crypto.randomBytes(8).toString('hex');
      const meta = existingId
        ? JSON.stringify({ name })
        : JSON.stringify({ name, parents: [parentId] });
      const payload =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n` +
        `--${boundary}--`;
      const url = existingId
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart&fields=id,name,md5Checksum`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,md5Checksum';
      const method = existingId ? 'PATCH' : 'POST';
      const res = await request(method, url, {
        headers: this.authHeaders({
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(payload),
        }),
        body: payload,
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`drive_upload_failed:${res.status}`);
      }
      return JSON.parse(res.text);
    };

    const tempFile = await uploadMultipart(tempName, body, null);
    const verifyDl = await request('GET', `https://www.googleapis.com/drive/v3/files/${tempFile.id}?alt=media`, {
      headers: this.authHeaders(),
    });
    if (verifyDl.status !== 200 || sha256(verifyDl.text) !== hash) {
      try {
        await request('DELETE', `https://www.googleapis.com/drive/v3/files/${tempFile.id}`, {
          headers: this.authHeaders(),
        });
      } catch {
        /* ignore */
      }
      throw new Error('atomic_temp_checksum_mismatch');
    }

    const existing = await this.findFile(remotePath);
    const finalFile = await uploadMultipart(fileName, body, existing?.id || null);

    try {
      await request('DELETE', `https://www.googleapis.com/drive/v3/files/${tempFile.id}`, {
        headers: this.authHeaders(),
      });
    } catch {
      /* cleanup best-effort */
    }

    return { fileId: finalFile.id, hash, path: remotePath, md5: finalFile.md5Checksum || null };
  }

  async getVersions(centerId, branchId) {
    const got = await this.downloadJson(this.versionsPath(centerId, branchId));
    return (
      got?.data || {
        schemaVersion: 1,
        formatVersion: 1,
        centerId,
        branchId,
        tables: {},
        updatedAt: null,
      }
    );
  }

  async putTable(centerId, branchId, table, revision, records, deviceId) {
    const payload = {
      centerId,
      branchId,
      table,
      revision,
      deviceId,
      updatedAt: new Date().toISOString(),
      records,
      payloadHash: sha256(JSON.stringify(records)),
    };
    const written = await this.writeAtomic(this.tablePath(centerId, branchId, table), payload);
    const versions = await this.getVersions(centerId, branchId);
    versions.centerId = centerId;
    versions.branchId = branchId;
    versions.schemaVersion = versions.schemaVersion || 1;
    versions.formatVersion = versions.formatVersion || 1;
    versions.tables = versions.tables || {};
    versions.tables[table] = {
      revision,
      checksum: payload.payloadHash,
      fileId: written.fileId,
      updatedAt: payload.updatedAt,
      lastWriter: deviceId,
    };
    versions.updatedAt = payload.updatedAt;
    await this.writeAtomic(this.versionsPath(centerId, branchId), versions);
    return { ...written, payloadHash: payload.payloadHash, revision };
  }

  async getTable(centerId, branchId, table) {
    const got = await this.downloadJson(this.tablePath(centerId, branchId, table));
    return got?.data || null;
  }

  async cleanupTestNamespace(centerId) {
    // Delete only under centers/{centerId} — never broader
    if (!String(centerId).startsWith('CTR-UAT-') && !String(centerId).includes('UAT')) {
      throw new Error('cleanup_refused_non_uat_center');
    }
    const folderPath = this.centerRoot(centerId);
    // find folder id
    const parts = folderPath.split('/').filter(Boolean);
    let parentId = 'root';
    let folderId = null;
    for (const part of parts) {
      const q = encodeURIComponent(
        `name='${part.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
      );
      const list = await request(
        'GET',
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`,
        { headers: this.authHeaders() }
      );
      folderId = JSON.parse(list.text).files?.[0]?.id || null;
      if (!folderId) return { ok: true, skipped: true };
      parentId = folderId;
    }
    if (!folderId) return { ok: true, skipped: true };
    const del = await request('DELETE', `https://www.googleapis.com/drive/v3/files/${folderId}`, {
      headers: this.authHeaders(),
    });
    return { ok: del.status === 204 || del.status === 200, status: del.status };
  }
}

module.exports = { GoogleDriveRemote, sha256 };
