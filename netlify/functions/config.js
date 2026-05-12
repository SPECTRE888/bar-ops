exports.handler = async (event, context) => {
  // Retourner uniquement les clés publiques/nécessaires au client
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    },
    body: JSON.stringify({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY
    })
  };
};
