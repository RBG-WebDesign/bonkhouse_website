import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMerch } from "@/lib/data";
import { publicAsset } from "@/lib/utils";

export default async function MerchPage() {
  const products = await getMerch();

  return (
    <div className="bh-container bh-page">
      <div className="max-w-3xl">
        <p className="bh-eyebrow">Merch</p>
        <h1 className="bh-page-title">
          Objects from the club table
        </h1>
        <p className="bh-intro">
          Shirts, zines, posters, and screening objects. More from the club table soon.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article className="club-card p-4" key={product.id}>
            <div className="photo-frame photo-warm grid aspect-square place-items-center">
              {product.imageUrl ? (
                <img alt={product.name} className="h-full w-full object-cover" src={publicAsset(product.imageUrl)} />
              ) : (
                <ShoppingBag className="relative z-10 text-butter" size={52} />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-butter/60 text-butter">{product.priceLabel}</Badge>
              {product.priceLabel.trim().toLowerCase() !== product.status.replaceAll("_", " ") && (
                <Badge>{product.status.replaceAll("_", " ")}</Badge>
              )}
            </div>
            <h2 className="mt-4 font-bebas text-3xl uppercase leading-tight tracking-wide text-white">{product.name}</h2>
            <p className="mt-2 text-sm leading-6 text-white/64">{product.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
