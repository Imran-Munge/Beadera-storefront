import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  ArrowRight, Check, Clock3, Heart, Instagram,
  Menu, Minus, Plus, ShoppingBag, Sparkles, Star, X,
} from 'lucide-react';
import {
  getGetProductQueryKey, getListWorkshopEnquiriesQueryKey, useCreateWorkshopEnquiry, useGetProduct, useListProducts,
  type Product,
} from '@workspace/api-client-react';
import logo from '@assets/beadera-logo.png';

type CartLine = { product: Product; quantity: number };

const formatPrice = (value: number) => `₹${value.toLocaleString('en-IN')}`;

function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-[#f2d7d8] ${large ? 'aspect-[4/5]' : 'aspect-[4/4.5]'}`}>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" data-testid={`img-product-${product.id}`} />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#fff3e3_0_16%,transparent_17%),radial-gradient(circle_at_28%_58%,#d88493_0_8%,transparent_9%),radial-gradient(circle_at_65%_60%,#762338_0_10%,transparent_11%),linear-gradient(145deg,#f3cbd0,#e9a9b6)]">
          <div className="h-28 w-28 rounded-full border-[14px] border-[#f6e9d7] shadow-[inset_0_0_0_8px_#d88493,0_12px_30px_rgba(96,35,56,.18)]" />
          <span className="absolute bottom-5 left-5 rounded-full bg-[#fff3e3]/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.22em] text-[#762338]">{product.category}</span>
        </div>
      )}
      {product.badge && <span className="absolute left-3 top-3 rounded-full bg-[#fff3e3] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[#762338]">{product.badge}</span>}
    </div>
  );
}

function ProductCard({ product, onOpen, onAdd }: { product: Product; onOpen: (p: Product) => void; onAdd: (p: Product) => void }) {
  return (
    <article className="group" data-testid={`card-product-${product.id}`}>
      <button type="button" className="block w-full text-left" onClick={() => onOpen(product)} data-testid={`button-view-product-${product.id}`}>
        <ProductVisual product={product} />
        <div className="flex items-start justify-between gap-3 px-1 pt-4">
          <div>
            <h3 className="serif text-xl text-[#5e1b2f]">{product.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#8a6771]">{product.description}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold text-[#5e1b2f]">{formatPrice(product.price)}</p>
            {product.originalPrice && <p className="text-xs text-[#aa8b91] line-through">{formatPrice(product.originalPrice)}</p>}
          </div>
        </div>
      </button>
      <button type="button" onClick={() => onAdd(product)} className="mt-3 flex w-full items-center justify-center gap-2 border-b border-[#dec5c5] pb-3 text-[11px] font-semibold uppercase tracking-[.2em] text-[#762338] transition hover:border-[#762338]" data-testid={`button-add-product-${product.id}`}>
        <ShoppingBag size={14} /> add to your box
      </button>
    </article>
  );
}

function DetailModal({ product, onClose, onAdd, onWhatsApp }: { product: Product; onClose: () => void; onAdd: (p: Product, quantity?: number) => void; onWhatsApp: (p: Product, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#4b1728]/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" data-testid="modal-product-detail">
      <div className="relative grid max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-[#fff8ef] shadow-2xl md:grid-cols-2">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-[#fff8ef]/85 p-2 text-[#762338]" data-testid="button-close-product-detail"><X size={18} /></button>
        <ProductVisual product={product} large />
        <div className="flex flex-col justify-center p-8 md:p-12">
          <span className="mono text-[10px] uppercase tracking-[.24em] text-[#a36872]">{product.category} · hand-finished</span>
          <h2 className="serif mt-4 text-4xl leading-tight text-[#5e1b2f]">{product.name}</h2>
          <p className="mt-5 text-sm leading-7 text-[#795761]">{product.description} Each bead is chosen, threaded and checked by hand in our little studio.</p>
          <div className="mt-7 flex items-end gap-3"><span className="text-2xl font-semibold text-[#5e1b2f]">{formatPrice(product.price)}</span>{product.originalPrice && <span className="text-sm text-[#aa8b91] line-through">{formatPrice(product.originalPrice)}</span>}</div>
          <div className="mt-8 flex items-center gap-3 border-y border-[#ead7d0] py-4 text-xs text-[#795761]"><Check size={15} className="text-[#b36b37]" /> gift-wrapped in our signature pink box</div>
          <div className="mt-8 flex items-center gap-3">
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="rounded-full border border-[#dec5c5] p-2" data-testid={`button-detail-decrease-${product.id}`}><Minus size={14} /></button>
            <span className="mono w-7 text-center text-xs" data-testid={`text-detail-quantity-${product.id}`}>{quantity}</span>
            <button type="button" onClick={() => setQuantity((value) => value + 1)} className="rounded-full border border-[#dec5c5] p-2" data-testid={`button-detail-increase-${product.id}`}><Plus size={14} /></button>
            <button type="button" onClick={() => { onAdd(product, quantity); onClose(); }} className="ml-auto flex items-center justify-center gap-3 rounded-full bg-[#762338] px-5 py-4 text-xs font-semibold uppercase tracking-[.17em] text-[#fff8ef] transition hover:bg-[#5e1b2f]" data-testid={`button-detail-add-${product.id}`}>Add to your box <ArrowRight size={16} /></button>
          </div>
          <button type="button" onClick={() => onWhatsApp(product, quantity)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#762338] px-5 py-3 text-xs font-semibold uppercase tracking-[.17em] text-[#762338] transition hover:bg-[#f3d9d8]" data-testid={`button-detail-whatsapp-${product.id}`}>Order via WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ lines, onClose, onChange, onWhatsApp }: { lines: CartLine[]; onClose: () => void; onChange: (id: number, delta: number) => void; onWhatsApp: () => void }) {
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return (
    <div className="fixed inset-0 z-50 bg-[#4b1728]/35" onClick={onClose} data-testid="drawer-cart-backdrop">
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-[#fff8ef] p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()} data-testid="drawer-cart">
        <div className="flex items-center justify-between border-b border-[#ead7d0] pb-5"><div><span className="mono text-[10px] uppercase tracking-[.2em] text-[#a36872]">your little box</span><h2 className="serif mt-1 text-3xl text-[#5e1b2f]">Cart</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-[#762338]" data-testid="button-close-cart"><X size={19} /></button></div>
        {lines.length === 0 ? <div className="flex h-[70%] flex-col items-center justify-center text-center"><div className="mb-5 rounded-full bg-[#f3d9d8] p-5 text-[#762338]"><Heart size={27} /></div><p className="serif text-2xl text-[#5e1b2f]">Nothing tucked in yet.</p><p className="mt-2 max-w-[230px] text-sm leading-6 text-[#8a6771]">Choose a piece that says what words sometimes cannot.</p></div> : <><div className="space-y-5 py-7">{lines.map(({ product, quantity }) => <div key={product.id} className="flex gap-4" data-testid={`cart-line-${product.id}`}><div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl"><ProductVisual product={product} /></div><div className="min-w-0 flex-1"><p className="serif text-lg text-[#5e1b2f]">{product.name}</p><p className="mt-1 text-sm text-[#8a6771]">{formatPrice(product.price)}</p><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => onChange(product.id, -1)} className="rounded-full border border-[#dec5c5] p-1" data-testid={`button-decrease-${product.id}`}><Minus size={12} /></button><span className="mono w-5 text-center text-xs">{quantity}</span><button type="button" onClick={() => onChange(product.id, 1)} className="rounded-full border border-[#dec5c5] p-1" data-testid={`button-increase-${product.id}`}><Plus size={12} /></button></div></div><p className="text-sm font-semibold text-[#5e1b2f]">{formatPrice(product.price * quantity)}</p></div>)}</div><div className="mt-auto border-t border-[#ead7d0] pt-5"><div className="flex justify-between text-sm text-[#795761]"><span>little box total</span><strong className="text-lg text-[#5e1b2f]">{formatPrice(total)}</strong></div><button type="button" className="mt-5 w-full rounded-full bg-[#762338] px-6 py-4 text-xs font-semibold uppercase tracking-[.2em] text-[#fff8ef] transition hover:bg-[#5e1b2f]" onClick={onWhatsApp} data-testid="button-checkout">order via WhatsApp</button><p className="mt-3 text-center text-[11px] text-[#a36872]">free gift note included with every order</p></div></>}
      </aside>
    </div>
  );
}

export default function Storefront() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const productsQuery = useListProducts();
  const workshopMutation = useCreateWorkshopEnquiry();
  const products = (productsQuery.data ?? []).filter((product) => product.isActive !== false);
  const [category, setCategory] = useState('All pieces');
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('beadera-cart') ?? '[]') as CartLine[];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [workshopSent, setWorkshopSent] = useState(false);
  const detailQuery = useGetProduct(selected?.slug ?? '', { query: { enabled: Boolean(selected), queryKey: getGetProductQueryKey(selected?.slug ?? '') } });
  const categories = ['All pieces', ...Array.from(new Set(products.map((p) => p.category)))];
  const visibleProducts = useMemo(() => category === 'All pieces' ? products : products.filter((p) => p.category === category), [category, products]);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  useEffect(() => {
    localStorage.setItem('beadera-cart', JSON.stringify(cart));
  }, [cart]);
  const addToCart = (product: Product, quantity = 1) => setCart((current) => { const found = current.find((line) => line.product.id === product.id); return found ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line) : [...current, { product, quantity }]; });
  const changeCart = (id: number, delta: number) => setCart((current) => current.flatMap((line) => line.product.id === id ? (line.quantity + delta > 0 ? [{ ...line, quantity: line.quantity + delta }] : []) : [line]));
  const orderViaWhatsApp = (lines: CartLine[]) => {
    const phone = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999';
    const message = ['Hello Beadera, I would like to order:', ...lines.map(({ product, quantity }) => `• ${product.name} × ${quantity} — ${formatPrice(product.price * quantity)}`), `Total: ${formatPrice(lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0))}`].join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };
  const submitWorkshop = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    workshopMutation.mutate({ data: { name: String(form.get('name')), phone: String(form.get('phone')), email: String(form.get('email')), workshopType: String(form.get('workshopType')), peopleCount: Number(form.get('peopleCount')), preferredDate: String(form.get('preferredDate')), preferredTime: String(form.get('preferredTime') ?? 'afternoon'), message: String(form.get('message') ?? '') } }, { onSuccess: () => { setWorkshopSent(true); event.currentTarget.reset(); queryClient.invalidateQueries({ queryKey: getListWorkshopEnquiriesQueryKey() }); } });
  };

  return (
    <div className="paper-grain min-h-[100dvh] overflow-hidden bg-[#fff8ef] text-[#5e1b2f]">
      <div className="bg-[#762338] py-2 text-center text-[10px] font-semibold uppercase tracking-[.25em] text-[#fff2df]">made slowly in India · packed with a little feeling</div>
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <a href="#top" className="flex items-center" data-testid="link-home"><img src={logo} alt="Beadera" className="h-12 w-24 rounded-lg object-cover object-center mix-blend-multiply md:h-14 md:w-28" /></a>
        <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[.17em] text-[#795761] md:flex"><a href="#shop" data-testid="link-shop">shop</a><a href="#story" data-testid="link-story">our story</a><a href="#workshops" data-testid="link-workshops">workshops</a></nav>
        <div className="flex items-center gap-2"><a href="#shop" className="hidden rounded-full px-3 py-2 text-[#762338] transition hover:bg-[#f3d9d8] md:block" data-testid="link-favourites"><Heart size={18} /></a><button type="button" onClick={() => setCartOpen(true)} className="relative rounded-full bg-[#f3d9d8] p-3 text-[#762338] transition hover:bg-[#edc4c8]" data-testid="button-open-cart"><ShoppingBag size={18} /><span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b36b37] px-1 text-[9px] font-bold text-[#fff8ef]" data-testid="text-cart-count">{cartCount}</span></button><button type="button" className="p-2 md:hidden" onClick={() => setMobileMenu(!mobileMenu)} data-testid="button-mobile-menu"><Menu size={20} /></button></div>
      </header>
      {mobileMenu && <div className="relative z-10 flex flex-col gap-4 border-y border-[#ead7d0] bg-[#fff8ef] px-6 py-5 text-xs font-semibold uppercase tracking-[.17em] md:hidden"><a href="#shop" onClick={() => setMobileMenu(false)} data-testid="mobile-link-shop">shop</a><a href="#story" onClick={() => setMobileMenu(false)} data-testid="mobile-link-story">our story</a><a href="#workshops" onClick={() => setMobileMenu(false)} data-testid="mobile-link-workshops">workshops</a></div>}

      <main id="top">
        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-8 md:grid-cols-[1.05fr_.95fr] md:items-center md:px-10 md:pb-32 md:pt-16">
          <div className="reveal">
            <div className="mb-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.25em] text-[#b36b37]"><span className="h-px w-10 bg-[#b36b37]" /> jewellery for the feeling people</div>
            <h1 className="serif max-w-xl text-[3.65rem] leading-[.98] tracking-[-.04em] text-[#5e1b2f] md:text-[6.6rem]">A little<br /><em className="text-[#b36b37]">something</em><br />to keep.</h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[#795761] md:text-lg">Handmade bead accessories for the people you love, the stories you carry and the pieces you make your own.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4"><a href="#shop" className="group flex items-center gap-4 rounded-full bg-[#762338] px-6 py-4 text-xs font-semibold uppercase tracking-[.18em] text-[#fff8ef] transition hover:bg-[#5e1b2f]" data-testid="link-hero-shop">find your piece <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b36b37] transition group-hover:translate-x-1"><ArrowRight size={14} /></span></a><a href="#workshops" className="text-xs font-semibold uppercase tracking-[.18em] text-[#762338] underline decoration-[#d9a35d] underline-offset-8" data-testid="link-hero-workshop">make one together</a></div>
            <div className="mt-12 flex items-center gap-4"><div className="flex -space-x-2">{['#d78995', '#8a2944', '#f0bf8c', '#b45b6c'].map((color, index) => <span key={color} className="h-8 w-8 rounded-full border-2 border-[#fff8ef]" style={{ backgroundColor: color }} />)}</div><p className="text-xs leading-5 text-[#8a6771]"><strong className="text-[#5e1b2f]">1,200+ little boxes</strong><br />sent with love from our studio</p></div>
          </div>
          <div className="relative mx-auto w-full max-w-[530px] reveal reveal-delay-2"><div className="absolute -left-4 top-10 h-24 w-24 rounded-full border border-[#d9a35d] opacity-50 md:-left-10" /><div className="relative aspect-[.92/1] overflow-hidden rounded-[48%_52%_44%_56%/46%_42%_58%_54%] bg-[#f3ccd0] shadow-[20px_24px_0_#f8e2cf]"><img src={logo} alt="" className="h-full w-full object-cover opacity-80 mix-blend-multiply" /><div className="absolute inset-0 bg-gradient-to-t from-[#762338]/10 to-transparent" /></div><div className="floaty absolute -bottom-5 -right-2 flex w-44 items-center gap-3 rounded-2xl border border-[#eedacb] bg-[#fff8ef]/90 p-3 shadow-xl backdrop-blur-sm md:-right-8"><div className="rounded-xl bg-[#f3d9d8] p-3 text-[#762338]"><Sparkles size={18} /></div><p className="text-[11px] leading-4 text-[#795761]">every piece<br /><strong className="text-[#5e1b2f]">has a little story</strong></p></div><span className="absolute right-2 top-10 rotate-12 rounded-full bg-[#d9a35d] px-3 py-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#5e1b2f]">wear your why</span></div>
        </section>

        <div className="overflow-hidden border-y border-[#ead7d0] bg-[#f8e6d3] py-3"><div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[.27em] text-[#762338]"><span>beads with meaning</span><span className="text-[#b36b37]">•</span><span>gifts that feel personal</span><span className="text-[#b36b37]">•</span><span>made in small batches</span><span className="text-[#b36b37]">•</span><span>beads with meaning</span><span className="text-[#b36b37]">•</span><span>gifts that feel personal</span><span className="text-[#b36b37]">•</span><span>made in small batches</span></div></div>

        <section id="shop" className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><span className="mono text-[10px] uppercase tracking-[.25em] text-[#b36b37]">the little collection</span><h2 className="serif mt-3 text-4xl text-[#5e1b2f] md:text-5xl">For the moments<br /><em>worth holding onto.</em></h2></div><p className="max-w-xs text-sm leading-6 text-[#8a6771]">A thoughtful edit of bracelets, charms and tiny tokens. Pick a ready-made story, or start with a colour you love.</p></div>
          <div className="mt-10 flex flex-wrap gap-2 border-b border-[#ead7d0] pb-5">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-xs transition ${category === item ? 'bg-[#762338] text-[#fff8ef]' : 'bg-[#f5e5dd] text-[#795761] hover:bg-[#edc4c8]'}`} data-testid={`button-category-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div>
          {productsQuery.isLoading ? <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item}><div className="skeleton aspect-square rounded-2xl" /><div className="skeleton mt-4 h-5 w-2/3 rounded" /><div className="skeleton mt-2 h-3 w-full rounded" /></div>)}</div> : productsQuery.isError ? <div className="mt-10 rounded-2xl border border-[#e5b7b7] bg-[#fff0eb] p-8 text-center"><p className="serif text-2xl">The beads are taking a minute.</p><button type="button" onClick={() => productsQuery.refetch()} className="mt-4 rounded-full bg-[#762338] px-5 py-3 text-xs font-semibold uppercase tracking-[.16em] text-[#fff8ef]" data-testid="button-retry-products">try again</button></div> : <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-7">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onOpen={setSelected} onAdd={addToCart} />)}</div>}
          {visibleProducts.length === 0 && !productsQuery.isLoading && <div className="mt-12 rounded-2xl border border-dashed border-[#d9a35d] p-10 text-center"><p className="serif text-2xl">A quiet shelf for now.</p><p className="mt-2 text-sm text-[#8a6771]">Try another little corner of the collection.</p></div>}
        </section>

        <section id="story" className="bg-[#f3d9d8] px-5 py-20 md:px-10 md:py-28"><div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[.85fr_1.15fr] md:items-center"><div className="relative mx-auto max-w-sm"><div className="aspect-[.85/1] rotate-[-4deg] overflow-hidden rounded-[2rem] bg-[#f8e6d3] p-5 shadow-xl"><div className="flex h-full flex-col justify-between rounded-[1.5rem] border border-[#d9a35d]/50 p-6"><span className="mono text-[10px] uppercase tracking-[.2em] text-[#b36b37]">a note from our table</span><p className="serif text-4xl leading-tight text-[#762338]">“The best gifts feel like<br /><em>you noticed.</em>”</p><div className="flex items-center justify-between text-xs text-[#795761]"><span>love, Beadera</span><Heart size={17} fill="#b36b37" className="text-[#b36b37]" /></div></div></div><div className="absolute -bottom-5 -right-2 rounded-full bg-[#d9a35d] px-4 py-2 text-[10px] font-semibold uppercase tracking-[.17em] text-[#5e1b2f]">since 2021</div></div><div><span className="mono text-[10px] uppercase tracking-[.25em] text-[#b36b37]">why beadera</span><h2 className="serif mt-3 text-4xl leading-tight text-[#5e1b2f] md:text-5xl">Not just an accessory.<br /><em>A small act of attention.</em></h2><p className="mt-6 max-w-lg text-base leading-8 text-[#795761]">Beadera started at a dining table in Mumbai, with a box of beads and a very particular belief: the things we give should say more than “I remembered.”</p><p className="mt-4 max-w-lg text-base leading-8 text-[#795761]">Today, every piece is still assembled in small batches. We choose the colours slowly, leave room for imperfect lovely things, and pack each order as if it is going to someone we know.</p><div className="mt-8 flex flex-wrap gap-3"><span className="flex items-center gap-2 rounded-full bg-[#fff8ef]/70 px-4 py-2 text-xs text-[#762338]"><Check size={14} /> small-batch made</span><span className="flex items-center gap-2 rounded-full bg-[#fff8ef]/70 px-4 py-2 text-xs text-[#762338]"><Check size={14} /> gift-note ready</span></div></div></div></section>

        <section id="workshops" className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28"><div className="grid overflow-hidden rounded-[2rem] bg-[#762338] text-[#fff8ef] md:grid-cols-[.8fr_1.2fr]"><div className="relative flex flex-col justify-between overflow-hidden p-8 md:p-12"><div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[28px] border-[#b36b37]/40" /><div><span className="mono text-[10px] uppercase tracking-[.24em] text-[#edc4c8]">the make-it-yours table</span><h2 className="serif mt-5 text-4xl leading-tight md:text-5xl">Make a piece<br /><em>with your people.</em></h2><p className="mt-6 max-w-sm text-sm leading-7 text-[#f3d9d8]">A slow, hands-on bead session for birthdays, bridesmaids, team days and any Tuesday that deserves a little colour.</p></div><div className="mt-12 flex items-center gap-3 text-xs text-[#f3d9d8]"><Clock3 size={16} className="text-[#d9a35d]" /> 90 minutes · at our studio or yours</div></div><div className="bg-[#fff8ef] p-8 text-[#5e1b2f] md:p-12">{workshopSent ? <div className="flex min-h-[410px] flex-col items-center justify-center text-center"><div className="rounded-full bg-[#f3d9d8] p-4 text-[#762338]"><Check size={28} /></div><h3 className="serif mt-6 text-3xl">Your note is with us.</h3><p className="mt-3 max-w-sm text-sm leading-6 text-[#795761]">We’ll be in touch soon to make something lovely together.</p><button type="button" onClick={() => setWorkshopSent(false)} className="mt-7 text-xs font-semibold uppercase tracking-[.18em] text-[#762338] underline underline-offset-8" data-testid="button-new-workshop-enquiry">send another enquiry</button></div> : <form onSubmit={submitWorkshop} className="grid gap-5 sm:grid-cols-2" data-testid="form-workshop-enquiry"><div className="sm:col-span-2"><h3 className="serif text-3xl">Tell us what you’re making.</h3><p className="mt-2 text-sm text-[#8a6771]">We’ll reply within one working day.</p></div><label className="text-xs font-semibold text-[#795761]">your name<input name="name" required className="mt-2 w-full border-b border-[#dec5c5] bg-transparent py-2 text-sm outline-none focus:border-[#762338]" data-testid="input-workshop-name" /></label><label className="text-xs font-semibold text-[#795761]">phone number<input name="phone" required className="mt-2 w-full border-b border-[#dec5c5] bg-transparent py-2 text-sm outline-none focus:border-[#762338]" data-testid="input-workshop-phone" /></label><label className="text-xs font-semibold text-[#795761]">email<input name="email" type="email" required className="mt-2 w-full border-b border-[#dec5c5] bg-transparent py-2 text-sm outline-none focus:border-[#762338]" data-testid="input-workshop-email" /></label><label className="text-xs font-semibold text-[#795761]">kind of gathering<select name="workshopType" className="mt-2 w-full border-b border-[#dec5c5] bg-transparent py-2 text-sm outline-none focus:border-[#762338]" data-testid="select-workshop-type"><option>birthday</option><option>bridesmaids</option><option>team day</option><option>just because</option></select></label><label className="text-xs font-semibold text-[#795761]">people<input name="peopleCount" type="number" min="1" defaultValue="4" required className="mt-2 w-full border-b border-[#dec5c5] bg-transparent py-2 text-sm outline-none focus:border-[#762338]" data-testid="input-workshop-people" /></label><label className="text-xs font-semibold text-[#795761]">preferred date<input name="preferredDate" type="date" required className="mt-2 w-full border-b border-[#dec5c5] bg-transparent py-2 text-sm outline-none focus:border-[#762338]" data-testid="input-workshop-date" /></label><label className="text-xs font-semibold text-[#795761]">preferred time<select name="preferredTime" defaultValue="afternoon" className="mt-2 w-full border-b border-[#dec5c5] bg-transparent py-2 text-sm outline-none focus:border-[#762338]" data-testid="select-workshop-time"><option value="morning">morning</option><option value="afternoon">afternoon</option><option value="evening">evening</option></select></label><label className="text-xs font-semibold text-[#795761] sm:col-span-2">a little more (optional)<textarea name="message" rows={2} placeholder="Tell us who it’s for..." className="mt-2 w-full resize-none border-b border-[#dec5c5] bg-transparent py-2 text-sm outline-none placeholder:text-[#b99ca0] focus:border-[#762338]" data-testid="textarea-workshop-message" /></label><button type="submit" disabled={workshopMutation.isPending} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#762338] px-5 py-4 text-xs font-semibold uppercase tracking-[.18em] text-[#fff8ef] transition hover:bg-[#5e1b2f] disabled:opacity-60 sm:col-span-2" data-testid="button-submit-workshop">{workshopMutation.isPending ? 'sending your note...' : 'start planning'} <ArrowRight size={15} /></button>{workshopMutation.isError && <p className="text-xs text-[#a53d48] sm:col-span-2" data-testid="status-workshop-error">Something went wrong. Please try again.</p>}</form>}</div></div></section>

        <section className="border-t border-[#ead7d0] bg-[#fffaf4] px-5 py-20 md:px-10 md:py-28" aria-labelledby="testimonials-heading">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-xl">
                <span className="mono text-[10px] uppercase tracking-[.25em] text-[#b36b37]">from the Beadera circle</span>
                <h2 id="testimonials-heading" className="serif mt-3 text-4xl leading-tight text-[#5e1b2f] md:text-5xl">Little notes from people<br /><em>who chose feeling.</em></h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-[#8a6771]">The best part of making small things with meaning is hearing where they end up.</p>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-[#ead7d0] bg-[#fff8ef] px-5 py-4 shadow-[0_10px_30px_rgba(94,27,47,.05)]">
                <div className="text-center"><p className="serif text-3xl text-[#5e1b2f]">4.9</p><p className="mono text-[9px] uppercase tracking-[.14em] text-[#a36872]">loved by many</p></div>
                <div className="border-l border-[#ead7d0] pl-4"><div className="flex gap-1 text-[#d9a35d]" aria-label="5 out of 5 stars"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div><p className="mt-1 text-xs text-[#8a6771]">120+ little boxes sent</p></div>
              </div>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                { quote: 'It arrived so beautifully wrapped, my sister kept the box. The bracelet made her cry in the best way.', name: 'Rhea', detail: 'gifted a bracelet · Pune', initials: 'R', tone: 'bg-[#f3d9d8]' },
                { quote: 'The workshop was the sweetest birthday plan. We all left wearing our inside jokes.', name: 'Ananya', detail: 'made together · Mumbai', initials: 'A', tone: 'bg-[#f8e6d3]' },
                { quote: 'I picked the charm for my daughter and now she checks that it is still on her bag every morning.', name: 'Meera', detail: 'found a little meaning · Bengaluru', initials: 'M', tone: 'bg-[#e8dfed]' },
              ].map((testimonial, index) => (
                <article key={testimonial.name} className="group relative overflow-hidden rounded-[1.5rem] border border-[#ead7d0] bg-[#fff8ef] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(94,27,47,.08)] md:p-7" data-testid={`testimonial-card-${index + 1}`}>
                  <span className="serif absolute right-5 top-1 text-7xl leading-none text-[#f0d0d0]">“</span>
                  <div className="relative flex gap-1 text-[#d9a35d]" aria-label="5 out of 5 stars"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                  <p className="relative mt-6 min-h-[118px] text-[15px] leading-7 text-[#795761]">“{testimonial.quote}”</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-[#ead7d0] pt-5"><div className={`flex h-10 w-10 items-center justify-center rounded-full ${testimonial.tone} serif text-lg text-[#762338]`}>{testimonial.initials}</div><div><p className="text-sm font-semibold text-[#5e1b2f]">{testimonial.name}</p><p className="mt-1 text-[10px] uppercase tracking-[.13em] text-[#a36872]">{testimonial.detail}</p></div></div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-[#762338] px-5 py-14 text-[#fff8ef] md:px-10 md:py-16" aria-label="Beadera footer">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-[1.35fr_.8fr_.8fr_1.1fr]">
            <div>
              <a href="#top" className="inline-flex items-center gap-4" data-testid="footer-link-home">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d9a35d]/70 bg-[#fff8ef] p-2 shadow-[0_8px_22px_rgba(42,8,20,.18)]"><img src={logo} alt="Beadera" className="h-full w-full object-contain mix-blend-multiply" /></span>
                <span><span className="serif block text-2xl">beadera</span><span className="mono mt-1 block text-[9px] uppercase tracking-[.2em] text-[#edc4c8]">made with feeling</span></span>
              </a>
              <p className="mt-6 max-w-xs text-sm leading-7 text-[#f3d9d8]">Tiny things, thoughtfully made.<br />For your people and their people.</p>
              <span className="mt-6 inline-flex rounded-full border border-[#d9a35d]/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#f8e6d3]">made slowly in India</span>
            </div>
            <div>
              <p className="mono text-[10px] uppercase tracking-[.2em] text-[#d9a35d]">explore</p>
              <nav className="mt-5 flex flex-col items-start gap-4 text-sm text-[#fff8ef]"><a href="#shop" className="transition hover:text-[#d9a35d]" data-testid="footer-link-shop">the collection</a><a href="#story" className="transition hover:text-[#d9a35d]" data-testid="footer-link-story">our story</a><a href="#workshops" className="transition hover:text-[#d9a35d]" data-testid="footer-link-workshops">workshops</a><a href="#testimonials-heading" className="transition hover:text-[#d9a35d]" data-testid="footer-link-testimonials">kind words</a></nav>
            </div>
            <div>
              <p className="mono text-[10px] uppercase tracking-[.2em] text-[#d9a35d]">for your table</p>
              <div className="mt-5 flex flex-col items-start gap-4 text-sm text-[#f3d9d8]"><a href="#workshops" className="transition hover:text-[#fff8ef]">make it together</a><a href="mailto:hello@beadera.com" className="transition hover:text-[#fff8ef]">say hello</a><button type="button" onClick={() => setLocation('/admin/login')} className="transition hover:text-[#fff8ef]" data-testid="button-admin-login">studio login</button></div>
            </div>
            <div>
              <p className="mono text-[10px] uppercase tracking-[.2em] text-[#d9a35d]">stay close</p>
              <p className="mt-5 max-w-xs text-sm leading-6 text-[#f3d9d8]">A little inspiration, new pieces and workshop stories from our table.</p>
              <a href="https://instagram.com/beadera.in" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-[#fff8ef] transition hover:text-[#d9a35d]" data-testid="footer-link-instagram"><Instagram size={16} /> @beadera.in <ArrowRight size={14} /></a>
            </div>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-[#9b5061] pt-6 text-[10px] uppercase tracking-[.14em] text-[#edc4c8] sm:flex-row sm:items-center"><p>© 2026 Beadera. All the little things.</p><div className="flex gap-5"><a href="#top" className="transition hover:text-[#fff8ef]" data-testid="footer-link-top">back to top ↑</a><span>crafted with care</span></div></div>
        </div>
      </footer>
       {selected && <DetailModal product={detailQuery.data ?? selected} onClose={() => setSelected(null)} onAdd={addToCart} onWhatsApp={(product, quantity) => orderViaWhatsApp([{ product, quantity }])} />}
       {cartOpen && <CartDrawer lines={cart} onClose={() => setCartOpen(false)} onChange={changeCart} onWhatsApp={() => orderViaWhatsApp(cart)} />}
    </div>
  );
}