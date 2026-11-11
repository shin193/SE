function imageRecord(row) {
  return { id: row.id, src: row.src, alt: row.alt, atlasCell: row.atlas_cell };
}

export async function listCategories(db) {
  const { rows } = await db.query(`
    SELECT c.id, c.name,
      (SELECT count(*)::integer FROM products p WHERE p.category_id = c.id) AS count,
      (SELECT to_jsonb(i) FROM product_images i
        JOIN products p ON p.id = i.product_id
        WHERE p.category_id = c.id ORDER BY p.id, i.position, i.id LIMIT 1) AS image
    FROM categories c ORDER BY c.position, c.id
  `);
  return rows.map(row => ({ ...row, image: row.image && imageRecord(row.image) }));
}

export async function listProducts(db, { category = null, id = null } = {}) {
  const { rows } = await db.query(`
    SELECT p.*,
      COALESCE((SELECT jsonb_agg(i ORDER BY i.position, i.id)
        FROM product_images i WHERE i.product_id = p.id), '[]') AS images,
      COALESCE((SELECT jsonb_agg(v ORDER BY v.position, v.id)
        FROM product_variants v WHERE v.product_id = p.id), '[]') AS variants
    FROM products p
    WHERE ($1::int IS NULL OR p.category_id = $1) AND ($2::int IS NULL OR p.id = $2)
    ORDER BY p.id
  `, [category, id]);
  return rows.map(row => {
    const images = row.images.map(imageRecord);
    return {
      id: row.id,
      category: row.category_id,
      name: row.name,
      price: row.price,
      description: row.description,
      material: row.material,
      dimensions: row.dimensions,
      usage: row.usage,
      care: row.care,
      featured: row.featured,
      new: row.is_new,
      images,
      variants: row.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        hex: variant.hex,
        stock: variant.stock,
        image: images.find(image => image.id === variant.image_id) ?? null
      }))
    };
  });
}
