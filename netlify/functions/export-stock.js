exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    let data;
    if (event.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      // Parse form data
      const params = new URLSearchParams(event.body);
      data = JSON.parse(params.get('data'));
    } else {
      // Parse JSON
      data = JSON.parse(event.body);
    }
    const { products, glasses, consommables, barItems } = data;

    if (!products || !glasses) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Données manquantes' })
      };
    }

    // Build CSV with separate tables by category
    const headers = ['Type', 'Marque', 'Prix HT', 'Stock', 'Unité', 'Valeur totale HT (€)', 'Fournisseur'];
    const csvSections = [];

    // Helper to build category table
    const buildCategoryTable = (categoryName, items) => {
      if (!items || items.length === 0) return [];
      const categoryTotal = items.reduce((s, item) => s + parseFloat(item.valueTotalHT || 0), 0);
      const section = [
        ['', '', '', '', '', '', ''],
        [categoryName.toUpperCase(), '', '', '', '', '', ''],
        headers.map(h => h),
        ...items.map(item => [
          item.type || '',
          item.brand || '',
          (item.priceHT || 0).toFixed(2),
          (item.stock || 0).toString(),
          item.unit || '',
          (item.valueTotalHT || 0).toString(),
          item.supplier || ''
        ]),
        ['', '', '', '', '', '─────────────────', ''],
        ['SOUS-TOTAL ' + categoryName.toUpperCase(), '', '', '', '', categoryTotal.toFixed(2), '€']
      ];
      return section;
    };

    // Build each category table
    const categoryTables = [
      buildCategoryTable('Spiritueux', products.filter(p => p.category === 'Spirit')),
      buildCategoryTable('Jus & Purées', products.filter(p => p.category === 'Juice')),
      buildCategoryTable('Mixers & Sodas', products.filter(p => p.category === 'Mixer')),
      buildCategoryTable('Sirops', products.filter(p => p.category === 'Syrup')),
      buildCategoryTable('Garnitures', products.filter(p => ['Garnish', 'Spice'].includes(p.category))),
      buildCategoryTable('Verrerie', glasses),
      buildCategoryTable('Consommables', consommables),
      buildCategoryTable('Bar & Matériel', barItems)
    ];

    // Flatten and filter empty sections
    const rows = categoryTables.flat().filter(section => section && section.length > 0);

    // Calculate total value
    const totalValue = [...products, ...glasses, ...(consommables || []), ...(barItems || [])].reduce((s, item) => s + parseFloat(item.valueTotalHT || 0), 0);

    // Add grand total at the end
    rows.push(['', '', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '═════════════════', '']);
    rows.push(['TOTAL VALEUR STOCK', '', '', '', '', totalValue.toFixed(2), '€']);

    // Generate CSV
    const csv = [
      'INVENTAIRE DE STOCK - ' + new Date().toLocaleDateString('fr-FR'),
      '',
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
