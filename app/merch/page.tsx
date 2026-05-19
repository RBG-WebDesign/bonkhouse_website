import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMerch } from "@/lib/data";

export default async function MerchPage() {
  const products = await getMerch();

  return (
    <div className="club-container py-10">
      <div className="max-w-3xl">
        <p className="eyebrow">Merch</p>
        <h1 className="font-display text-6xl uppercase leading-none tracking-[-0.06em] text-white">
          Objects from the club table
        </h1>
        <p className="mt-4 text-lg leading-8 text-white/68">
          Shirts, zines, posters, and screening objects. Checkout can be added later, but the catalog is ready for the first wave.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article className="club-card p-4" key={product.id}>
            <div className="photo-frame photo-warm grid aspect-square place-items-center">
              {product.imageUrl ? (
                <img alt={product.name} className="h-full w-full object-cover" src={product.imageUrl} />
              ) : (
                <ShoppingBag className="relative z-10 text-butter" size={52} />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-butter/60 text-butter">{product.priceLabel}</Badge>
              <Badge>{product.status.replace("_", " ")}</Badge>
            </div>
            <h2 className="mt-4 font-display text-3xl uppercase text-white">{product.name}</h2>
            <p className="mt-2 text-sm leading-6 text-white/64">{product.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
