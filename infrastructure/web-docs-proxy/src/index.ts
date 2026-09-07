const documentationOrigin = 'https://zebodotdev.github.io/js'

export default {
  async fetch(request: Request): Promise<Response> {
    const incomingURL = new URL(request.url)
    const upstreamURL = new URL(
      `${documentationOrigin}${incomingURL.pathname}${incomingURL.search}`,
    )
    const upstreamResponse = await fetch(new Request(upstreamURL, request))
    const response = new Response(upstreamResponse.body, upstreamResponse)
    const location = response.headers.get('location')

    if (location?.startsWith(documentationOrigin)) {
      response.headers.set(
        'location',
        location.replace(documentationOrigin, incomingURL.origin),
      )
    }

    return response
  },
}
