export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // The expected credentials
  // Users can override these via Cloudflare Pages Environment Variables
  const expectedPass = env.ADMIN_PASS || "1Z4'[]40uSpq";

  // Check for logout
  if (url.pathname === '/admin/logout') {
    return new Response("Logged out", {
      status: 302,
      headers: {
        "Location": "/admin.html",
        "Set-Cookie": "admin_session=; Path=/; HttpOnly; Max-Age=0"
      }
    });
  }

  // Handle login POST
  if (url.pathname === '/admin/login' && request.method === 'POST') {
    const formData = await request.formData();
    const pass = formData.get('password');

    if (pass === expectedPass) {
      // Create a simple session cookie
      const sessionValue = btoa(pass);
      return new Response("Redirecting...", {
        status: 302,
        headers: {
          "Location": "/admin.html",
          "Set-Cookie": `admin_session=${sessionValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
        }
      });
    } else {
      // Redirect back with error
      return new Response("Redirecting...", {
        status: 302,
        headers: {
          "Location": "/admin.html?error=1"
        }
      });
    }
  }

  // Apply auth only to the admin panel
  if (url.pathname === '/admin.html' || url.pathname.startsWith('/admin')) {
    const cookie = request.headers.get("Cookie") || "";
    const expectedSessionValue = btoa(expectedPass);
    
    if (!cookie.includes(`admin_session=${expectedSessionValue}`)) {
      const errorMsg = url.searchParams.get('error') 
        ? '<div style="color: #ef4444; margin-bottom: 1.5rem; text-align: center; font-weight: 500; background: #fef2f2; padding: 1rem; border-radius: 8px; border: 1px solid #fecaca;">كلمة المرور غير صحيحة</div>' 
        : '';
      
      const loginHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تسجيل الدخول - لوحة تحكم أبو نايف</title>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #f8fafc;
            --bg-surface: #ffffff;
            --gold: #4d7d53;
            --gold-hover: #27564c;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --border: rgba(77, 125, 83, 0.2);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'IBM Plex Sans Arabic', sans-serif; }
        body { 
            background-color: var(--bg-dark); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh;
            padding: 1rem;
        }
        .login-container {
            background: var(--bg-surface);
            padding: 3rem 2.5rem;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.05);
            width: 100%;
            max-width: 440px;
            border: 1px solid var(--border);
        }
        .logo-area {
            text-align: center;
            margin-bottom: 2.5rem;
        }
        .logo-area img {
            height: 64px;
            border-radius: 12px;
            margin-bottom: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .logo-area h1 {
            color: var(--text-primary);
            font-size: 1.5rem;
            font-weight: 700;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-secondary);
            font-weight: 500;
            font-size: 0.95rem;
        }
        .form-control {
            width: 100%;
            padding: 1rem;
            border: 1px solid var(--border);
            border-radius: 10px;
            font-size: 1rem;
            color: var(--text-primary);
            transition: all 0.3s;
            background: var(--bg-dark);
        }
        .form-control:focus {
            outline: none;
            border-color: var(--gold);
            box-shadow: 0 0 0 3px rgba(77, 125, 83, 0.1);
        }
        .btn {
            width: 100%;
            padding: 1rem;
            background: var(--gold);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 0.5rem;
        }
        .btn:hover {
            background: var(--gold-hover);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(77, 125, 83, 0.2);
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo-area">
            <img src="/assets/images/NewLogo.jpeg" alt="أبو نايف لفحص السيارات">
            <h1>تسجيل الدخول</h1>
            <p style="color: var(--text-secondary); margin-top: 0.5rem; font-size: 0.95rem;">لوحة تحكم أبو نايف لتقارير المركبات</p>
        </div>
        ${errorMsg}
        <form action="/admin/login" method="POST">
            <div class="form-group">
                <label>كلمة المرور</label>
                <input type="password" name="password" class="form-control" required autocomplete="current-password" placeholder="أدخل كلمة المرور">
            </div>
            <button type="submit" class="btn">دخول</button>
        </form>
        <div style="text-align: center; margin-top: 2rem;">
            <a href="/" style="color: var(--text-secondary); text-decoration: none; font-size: 0.95rem; font-weight: 500; transition: color 0.3s;">&rarr; العودة للموقع</a>
        </div>
    </div>
</body>
</html>`;
      
      return new Response(loginHtml, {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }
  }

  // Not an admin route or authenticated, just continue
  return next();
}
