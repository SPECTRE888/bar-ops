module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).json({
    supabaseUrl:    process.env.SUPABASE_URL,
    supabaseKey:    process.env.SUPABASE_KEY,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  });
};
