export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts[0] === "api" && pathParts[1] === "reviews") {
      const id = pathParts[2];

      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
          const formattedResults = results.map(r => ({
            ...r,
            isHaraj: r.isHaraj === 1
          }));
          return new Response(JSON.stringify(formattedResults), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(e.message, { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json();
          const { name, text, date, phone, isHaraj } = body;
          
          if (!name || !text) {
            return new Response("Missing name or text", { status: 400, headers: corsHeaders });
          }

          const isHarajInt = isHaraj ? 1 : 0;

          await env.DB.prepare(
            "INSERT INTO reviews (name, text, date, isHaraj) VALUES (?, ?, ?, ?)"
          ).bind(name, text, date || new Date().toISOString().split('T')[0], isHarajInt).run();

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(e.message, { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === "PUT" && id) {
        try {
          const body = await request.json();
          const { name, text, isHaraj } = body;
          const isHarajInt = isHaraj ? 1 : 0;
          await env.DB.prepare(
            "UPDATE reviews SET name = ?, text = ?, isHaraj = ? WHERE id = ?"
          ).bind(name, text, isHarajInt, id).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (e) {
          return new Response(e.message, { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === "DELETE" && id) {
        try {
          await env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(id).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (e) {
          return new Response(e.message, { status: 500, headers: corsHeaders });
        }
      }
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
};
