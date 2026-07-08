/** Parse API response bodies; fail loud with status when the server returns HTML/text. */
export async function parseApiResponseBody<T>(
  res: Response,
  method: string,
  path: string,
): Promise<T> {
  const raw = await res.text()
  const trimmed = raw.trimStart()
  const looksJson = trimmed.startsWith('{') || trimmed.startsWith('[')
  const contentType = res.headers.get('content-type') ?? ''

  if (!looksJson && !contentType.includes('application/json')) {
    const snippet = raw.replace(/\s+/g, ' ').slice(0, 120)
    throw new Error(
      `${method} ${path} failed: ${res.status} — expected JSON, got ${contentType || 'non-JSON'} (${snippet})`,
    )
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`${method} ${path} failed: ${res.status} — invalid JSON response`)
  }
}
