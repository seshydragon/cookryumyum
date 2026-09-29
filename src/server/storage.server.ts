const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'challenge-photos'

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for photo storage.')
  return { url: url.replace(/\/$/, ''), key }
}

export async function uploadPrivateObject(path: string, body: Uint8Array, contentType: string) {
  const { url, key } = config()
  const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(BUCKET)}/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body,
  })
  if (!response.ok) throw new Error(`Supabase Storage upload failed: ${response.status}`)
}

export async function downloadPrivateObject(path: string) {
  const { url, key } = config()
  const response = await fetch(`${url}/storage/v1/object/authenticated/${encodeURIComponent(BUCKET)}/${path.split('/').map(encodeURIComponent).join('/')}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
  })
  if (!response.ok) return null
  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') || 'image/jpeg',
  }
}

export async function deletePrivateObject(path: string) {
  const { url, key } = config()
  await fetch(`${url}/storage/v1/object/${encodeURIComponent(BUCKET)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [path] }),
  })
}
