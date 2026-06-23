export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);

  try {
    if (request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM reviews ORDER BY rowid DESC").all();
      const formatted = results.map(r => ({
         ...r,
         isHaraj: r.isHaraj === 1
      }));
      return new Response(JSON.stringify(formatted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();
      const date = body.date || new Date().toISOString().split('T')[0];
      
      await env.DB.prepare(
        "INSERT INTO reviews (id, name, phone, text, date, isHaraj, ratings) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        id, 
        body.name || "زائر", 
        body.phone || "", 
        body.text || "", 
        date, 
        body.isHaraj ? 1 : 0,
        JSON.stringify(body.ratings || {})
      ).run();

      return new Response(JSON.stringify({ success: true, id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "PUT") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("Missing ID", { status: 400, headers: corsHeaders });
      const body = await request.json();
      
      await env.DB.prepare(
        "UPDATE reviews SET name = ?, text = ?, isHaraj = ? WHERE id = ?"
      ).bind(body.name, body.text, body.isHaraj ? 1 : 0, id).run();
      
      return new Response(JSON.stringify({ success: true }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "DELETE") {
       const id = url.searchParams.get("id");
       if (!id) return new Response("Missing ID", { status: 400, headers: corsHeaders });
       
       await env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(id).run();
       return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
       });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
}
