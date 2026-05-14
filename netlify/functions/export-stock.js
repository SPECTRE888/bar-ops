exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { products, glasses, ices } = JSON.parse(event.body);

    if (!products || !glasses || !ices) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Données manquantes' })
      };
    }

    // Build CSV rows
    const headers = ['Catégorie', 'Type', 'Marque', 'Prix HT', 'Stock', 'Unité', 'Valeur totale HT (€)', 'Fournisseur'];
    const rows = [
      ...products.map(p => [
        p.category || '',
        p.type || '',
        p.brand || '',
        (p.priceHT || 0).toFixed(2),
        (p.stock || 0).toString(),
        p.unit || '',
        (p.valueTotalHT || 0).toString(),
        p.supplier || ''
      ]),
      ...glasses.map(g => [
        'Verrerie',
        g.type || '',
        g.brand || '',
        (g.priceHT || 0).toFixed(2),
        (g.stock || 0).toString(),
        'pc',
        (g.valueTotalHT || 0).toString(),
        g.supplier || ''
      ]),
      ...ices.map(i => [
        'Glace',
        i.type || '',
        '',
        (i.priceHT || 0).toFixed(2),
        (i.stock || 0).toString(),
        i.unit || 'kg',
        (i.valueTotalHT || 0).toString(),
        i.supplier || ''
      ])
    ];

    // Calculate total value
    const totalValue = [...products, ...glasses, ...ices].reduce((s, item) => s + parseFloat(item.valueTotalHT || 0), 0);

    // Add summary rows
    rows.push(['', '', '', '', '', '', '=================', '']);
    rows.push(['', '', 'TOTAL VALEUR STOCK', '', '', ' ', totalValue.toFixed(2), '€']);

    // Generate CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const date = new Date().toISOString().slice(0, 10);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventaire-stock-${date}.csv"`
      },
      body: csv
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Erreur inconnue' })
    };
  }
};
