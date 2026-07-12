export default async function ProdukDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Detail Produk: {params.slug}</h1>
      <p>Halaman detail produk sedang dalam pengembangan.</p>
    </div>
  )
}
