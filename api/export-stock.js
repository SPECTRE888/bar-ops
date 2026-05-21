module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { products, glasses, consommables, barItems } = req.body || {};
    if (!products || !glasses) return res.status(400).json({ error: 'Données manquantes' });

    const headers = ['Type', 'Marque', 'Prix HT', 'Stock', 'Unité', 'Valeur totale HT (€)', 'Fournisseur'];

    const buildCategoryTable = (categoryName, items) => {
      if (!items || items.length === 0) return [];
      const categoryTotal = items.reduce((s, item) => s + parseFloat(item.valueTotalHT || 0), 0);
      return [
        ['', '', '', '', '', '', ''],
        [categoryName.toUpperCase(), '', '', '', '', '', ''],
        headers,
        ...items.map(item => [item.type || '', item.brand || '', (item.priceHT || 0).toFixed(2), (item.stock || 0).toString(), item.unit || '', (item.valueTotalHT || 0).toString(), item.supplier || '']),
        ['', '', '', '', '', '─────────────────', ''],
        ['SOUS-TOTAL ' + categoryName.toUpperCase(), '', '', '', '', categoryTotal.toFixed(2), '€'],
      ];
    };

    const rows = [
      buildCategoryTable('Spiritueux', products.filter(p => p.category === 'Spirit')),
      buildCategoryTable('Jus & Purées', products.filter(p => p.category === 'Juice')),
      buildCategoryTable('Mixers & Sodas', products.filter(p => p.category === 'Mixer')),
      buildCategoryTable('Sirops', products.filter(p => p.category === 'Syrup')),
      buildCategoryTable('Garnitures', products.filter(p => ['Garnish', 'Spice'].includes(p.category))),
      buildCategoryTable('Verrerie', glasses),
      buildCategoryTable('Consommables', consommables),
      buildCategoryTable('Bar & Matériel', barItems),
    ].flat();

    const totalValue = [...products, ...glasses, ...(consommables || []), ...(barItems || [])].reduce((s, item) => s + parseFloat(item.valueTotalHT || 0), 0);
    rows.push(['', '', '', '', '', '', ''], ['', '', '', '', '', '═════════════════', ''], ['TOTAL VALEUR STOCK', '', '', '', '', totalValue.toFixed(2), '€']);

    const csv = [
      'INVENTAIRE DE STOCK - ' + new Date().toLocaleDateString('fr-FR'), '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="inventaire-stock-${date}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erreur inconnue' });
  }
};
