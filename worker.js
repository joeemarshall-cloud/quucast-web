export default {
  async fetch(request, env) {
    const auth = request.headers.get("Authorization");
    const expected = "Basic " + btoa(`${env.BASIC_AUTH_USER}:${env.BASIC_AUTH_PASS}`);

    if (auth !== expected) {
      return new Response("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="QuuCast"' },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
