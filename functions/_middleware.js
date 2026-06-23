export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Apply basic auth only to the admin panel
  if (url.pathname === '/admin.html' || url.pathname.startsWith('/admin')) {
    // The expected credentials
    // Users can override these via Cloudflare Pages Environment Variables
    const expectedUser = env.ADMIN_USER || "admin";
    const expectedPass = env.ADMIN_PASS || "8f$WzZ8G5Ox\\";

    // Read the "Authorization" header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      // Prompt for credentials
      return new Response("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Panel"',
        },
      });
    }

    // Decode base64 "user:pass"
    const base64Credentials = authHeader.split(" ")[1];
    let credentials = "";
    try {
      credentials = atob(base64Credentials);
    } catch (e) {
      return new Response("Invalid encoding", {
        status: 400,
      });
    }

    const [user, pass] = credentials.split(":");

    if (user === expectedUser && pass === expectedPass) {
      // Valid credentials; continue to serve the page
      return next();
    } else {
      // Invalid credentials
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Panel"',
        },
      });
    }
  }

  // Not an admin route, just continue
  return next();
}
