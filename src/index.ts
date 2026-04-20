// const router = createRouter();

// router.on("/").render(HomePage);


//@ts-ignore
defineDocument((builder)=>{

builder.string('userName').notNull()


})


export class ProductService {

  list = defineQuery(
    { tables: ['product'] },
    async (ctx, { category, page = 1 }: { category?: string; page?: number }) => {
      return ctx.db.query<Product[]>(
        `SELECT *, category.name FROM product
         WHERE ($category = NONE OR category.slug = $category)
         AND   status = 'published'
         ORDER BY createdAt DESC
         LIMIT 20 START ${(page - 1) * 20}
         FETCH category`,
        { category }
      )
    }
  )