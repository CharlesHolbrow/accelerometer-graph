const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

// In development, we have two servers: the one that serves the react project on
// port 3001, and RESTful node project on port 3000
const urlPrefix = isDevelopment ? 'http://localhost:3000/session/' : '/session/'

/**
 * @param {string} key
 * @param {number} sessionId
 * @param {object} payload
 */
export async function sendToServer (key, sessionId, payload) {
  const url = urlPrefix + sessionId
  return await fetch(url, {
    method: 'POST',
    headers: { 'react-sensors-key': key, 'content-type': 'application/json' },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload)
  })
}
