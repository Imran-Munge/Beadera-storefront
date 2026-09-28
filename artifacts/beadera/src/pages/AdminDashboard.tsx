import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Archive, Edit3, ExternalLink, ImagePlus, LayoutDashboard,
  LoaderCircle, LogOut, Package, Plus, Save, Sparkles, Trash2, Users, X,
} from 'lucide-react';
import {
  getGetAdminSessionQueryKey, getGetAdminSummaryQueryKey, getListAdminProductsQueryKey,
  getListWorkshopEnquiriesQueryKey, useAdminLogout, useCreateProduct, useDeleteProduct,
  useGetAdminSession, useGetAdminSummary, useListAdminProducts, useListWorkshopEnquiries,
  useUpdateProduct, useUpdateWorkshopEnquiry, type Product, type ProductInput,
} from '@workspace/api-client-react';

const emptyForm: ProductInput = { name: '', description: '', price: 0, originalPrice: null, category: 'Bracelets', imageUrl: '', additionalImages: [], badge: '', isFeatured: false, isActive: true, sortOrder: 0 };
const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

function ProductForm({ product, onClose, onSaved }: { product?: Product; onClose: () => void; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const [form, setForm] = useState<ProductInput>(product ? { name: product.name, description: product.description, price: product.price, originalPrice: product.originalPrice ?? null, category: product.category, imageUrl: product.imageUrl, additionalImages: product.additionalImages, badge: product.badge ?? '', isFeatured: product.isFeatured, isActive: product.isActive, sortOrder: product.sortOrder } : emptyForm);
  const [uploading, setUploading] = useState<'primary' | 'additional' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const set = (key: keyof ProductInput, value: string | number | boolean | string[] | null) => setForm((current) => ({ ...current, [key]: value }));
  const saving = create.isPending || update.isPending;
  const uploadImage = async (file: File, destination: 'primary' | 'additional') => {
    setUploadError('');
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      setUploadError('Please choose an image file smaller than 10 MB.');
      return;
    }
    setUploading(destination);
    try {
      const request = await fetch('/api/storage/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      const payload = await request.json() as { uploadURL?: string; objectPath?: string; error?: string };
      if (!request.ok || !payload.uploadURL || !payload.objectPath) throw new Error(payload.error || 'Could not prepare upload.');
      const upload = await fetch(payload.uploadURL, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!upload.ok) throw new Error('Could not upload the image.');
      const imageUrl = `/api/storage${payload.objectPath}`;
      if (destination === 'primary') set('imageUrl', imageUrl);
      else set('additionalImages', [...(form.additionalImages ?? []), imageUrl]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not upload the image.');
    } finally {
      setUploading(null);
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = { ...form, price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : null, sortOrder: Number(form.sortOrder ?? 0), badge: form.badge || null };
    const onSuccess = () => { queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }); queryClient.invalidateQueries({ queryKey: getListWorkshopEnquiriesQueryKey() }); onSaved(); };
    if (product) update.mutate({ id: product.id, data }, { onSuccess });
    else create.mutate({ data }, { onSuccess });
  };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#4b1728]/40 p-4 backdrop-blur-sm" data-testid="modal-product-form">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] bg-[#fff8ef] p-6 shadow-2xl sm:p-9" data-testid="form-product">
        <div className="flex items-start justify-between"><div><span className="mono text-[10px] uppercase tracking-[.22em] text-[#b36b37]">{product ? 'edit the piece' : 'new piece'}</span><h2 className="serif mt-2 text-3xl text-[#5e1b2f]">{product ? product.name : 'Add a product'}</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-[#762338]" data-testid="button-close-product-form"><X size={18} /></button></div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#795761] sm:col-span-2">name<input required value={form.name} onChange={(e) => set('name', e.target.value)} className="admin-input" data-testid="input-product-name" /></label>
          <label className="text-xs font-semibold text-[#795761] sm:col-span-2">description<textarea required rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className="admin-input resize-none" data-testid="textarea-product-description" /></label>
          <label className="text-xs font-semibold text-[#795761]">price (INR)<input required min="0" type="number" value={form.price} onChange={(e) => set('price', Number(e.target.value))} className="admin-input" data-testid="input-product-price" /></label>
          <label className="text-xs font-semibold text-[#795761]">original price<input min="0" type="number" value={form.originalPrice ?? ''} onChange={(e) => set('originalPrice', e.target.value ? Number(e.target.value) : null)} className="admin-input" data-testid="input-product-original-price" /></label>
          <label className="text-xs font-semibold text-[#795761]">category<select value={form.category} onChange={(e) => set('category', e.target.value)} className="admin-input" data-testid="select-product-category"><option>Bracelets</option><option>Earrings</option><option>Necklaces</option><option>Charms</option><option>Rings</option><option>Sets</option></select></label>
          <label className="text-xs font-semibold text-[#795761]">badge<input value={form.badge ?? ''} onChange={(e) => set('badge', e.target.value)} placeholder="new, beloved..." className="admin-input" data-testid="input-product-badge" /></label>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-[#795761]">image URL<input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://... or upload below" className="admin-input" data-testid="input-product-image-url" /></label>
            <div className="mt-4 grid gap-4 rounded-2xl border border-dashed border-[#dec5c5] bg-[#fffaf4] p-4 sm:grid-cols-[5rem_1fr] sm:items-center">
              {form.imageUrl ? <img src={form.imageUrl} alt="Primary product preview" className="h-20 w-20 rounded-xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#f3d9d8] text-[#762338]"><ImagePlus size={22} /></div>}
              <div><p className="text-sm font-semibold text-[#5e1b2f]">Upload a primary image</p><p className="mt-1 text-xs leading-5 text-[#8a6771]">JPG, PNG, WEBP or GIF · up to 10 MB. Uploads go directly to secure product storage.</p><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#f3d9d8] px-4 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#762338] transition hover:bg-[#edc4c8]"><ImagePlus size={14} /> {uploading === 'primary' ? 'uploading...' : 'choose image'}<input type="file" accept="image/*" className="sr-only" disabled={Boolean(uploading)} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file, 'primary'); e.currentTarget.value = ''; }} data-testid="input-product-image-upload" /></label></div>
            </div>
          </div>
          <div className="sm:col-span-2"><label className="text-xs font-semibold text-[#795761]">additional images (optional)<input type="file" accept="image/*" multiple className="admin-input file:mr-3 file:rounded-full file:border-0 file:bg-[#f3d9d8] file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:text-[#762338]" disabled={Boolean(uploading)} onChange={(e) => { Array.from(e.target.files ?? []).forEach((file) => void uploadImage(file, 'additional')); e.currentTarget.value = ''; }} data-testid="input-product-additional-images-upload" /></label>{(form.additionalImages ?? []).length > 0 && <div className="mt-3 flex flex-wrap gap-2">{(form.additionalImages ?? []).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`Additional product preview ${index + 1}`} className="h-16 w-16 rounded-lg object-cover" />)}</div>}</div>
          <label className="flex items-center gap-3 text-xs font-semibold text-[#795761]"><input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 accent-[#762338]" data-testid="checkbox-product-featured" /> featured piece</label>
          <label className="flex items-center gap-3 text-xs font-semibold text-[#795761]"><input type="checkbox" checked={Boolean(form.isActive)} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 accent-[#762338]" data-testid="checkbox-product-active" /> visible in shop</label>
        </div>
        {uploadError && <p className="mt-5 rounded-lg bg-[#fff0eb] p-3 text-xs text-[#a53d48]" data-testid="status-product-upload-error">{uploadError}</p>}
        {(create.isError || update.isError) && <p className="mt-5 rounded-lg bg-[#fff0eb] p-3 text-xs text-[#a53d48]" data-testid="status-product-save-error">Could not save this piece. Please check the fields and try again.</p>}
        <div className="mt-8 flex justify-end gap-3 border-t border-[#ead7d0] pt-6"><button type="button" onClick={onClose} className="rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[.16em] text-[#795761]" data-testid="button-cancel-product">cancel</button><button type="submit" disabled={saving || Boolean(uploading)} className="flex items-center gap-2 rounded-full bg-[#762338] px-6 py-3 text-xs font-semibold uppercase tracking-[.16em] text-[#fff8ef] disabled:opacity-60" data-testid="button-save-product">{uploading ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}{saving ? 'saving...' : uploading ? 'uploading...' : product ? 'save changes' : 'add piece'}</button></div>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const session = useGetAdminSession();
  const summary = useGetAdminSummary({ query: { queryKey: getGetAdminSummaryQueryKey(), enabled: Boolean(session.data?.authenticated) } });
  const products = useListAdminProducts({ query: { queryKey: getListAdminProductsQueryKey(), enabled: Boolean(session.data?.authenticated) } });
  const enquiries = useListWorkshopEnquiries({ query: { queryKey: getListWorkshopEnquiriesQueryKey(), enabled: Boolean(session.data?.authenticated) } });
  const logout = useAdminLogout();
  const updateEnquiry = useUpdateWorkshopEnquiry();
  const deleteProduct = useDeleteProduct();
  const [tab, setTab] = useState<'overview' | 'products' | 'enquiries'>('overview');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => { if (!session.isLoading && !session.data?.authenticated) setLocation('/admin/login'); }, [session.data, session.isLoading, setLocation]);
  const filtered = useMemo(() => (products.data ?? []).filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [products.data, query]);
  const signOut = () => logout.mutate(undefined, { onSuccess: () => { queryClient.setQueryData(getGetAdminSessionQueryKey(), { authenticated: false, email: null }); setLocation('/admin/login'); } });
  const updateStatus = (id: number, status: 'pending' | 'contacted' | 'confirmed' | 'completed') => updateEnquiry.mutate({ id, data: { status } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListWorkshopEnquiriesQueryKey() }) });
  const remove = (product: Product) => { if (window.confirm(`Remove ${product.name} from the studio?`)) deleteProduct.mutate({ id: product.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }); } }); };

  if (session.isLoading) return <div className="min-h-[100dvh] bg-[#fff8ef] p-8"><div className="skeleton h-8 w-48 rounded" /><div className="mt-12 grid gap-5 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-32 rounded-2xl" />)}</div></div>;
  if (!session.data?.authenticated) return null;
  const stats = [{ label: 'all pieces', value: summary.data?.totalProducts ?? 0, icon: Package, color: 'bg-[#f3d9d8]' }, { label: 'on the shelf', value: summary.data?.activeProducts ?? 0, icon: Sparkles, color: 'bg-[#f8e6d3]' }, { label: 'featured', value: summary.data?.featuredProducts ?? 0, icon: Archive, color: 'bg-[#e8dfed]' }, { label: 'workshop notes', value: summary.data?.workshopEnquiries ?? 0, icon: Users, color: 'bg-[#dbe8dd]' }];
  return (
    <div className="min-h-[100dvh] bg-[#f8f0e8] text-[#5e1b2f]"><aside className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-[#dec5c5] bg-[#fff8ef] p-2 md:bottom-auto md:top-0 md:flex md:h-[100dvh] md:w-64 md:flex-col md:border-r md:border-t-0 md:p-6"><div className="hidden items-center gap-3 md:flex"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#762338] text-sm font-bold text-[#fff8ef]">b</div><div><p className="serif text-xl">beadera</p><p className="mono text-[8px] uppercase tracking-[.18em] text-[#a36872]">studio desk</p></div></div><nav className="flex w-full justify-around gap-2 md:mt-16 md:block md:space-y-2"><button type="button" onClick={() => setTab('overview')} className={`admin-nav ${tab === 'overview' ? 'admin-nav-active' : ''}`} data-testid="nav-overview"><LayoutDashboard size={16} /> <span>overview</span></button><button type="button" onClick={() => setTab('products')} className={`admin-nav ${tab === 'products' ? 'admin-nav-active' : ''}`} data-testid="nav-products"><Package size={16} /> <span>pieces</span></button><button type="button" onClick={() => setTab('enquiries')} className={`admin-nav ${tab === 'enquiries' ? 'admin-nav-active' : ''}`} data-testid="nav-enquiries"><Users size={16} /> <span>workshops</span></button></nav><div className="mt-auto hidden space-y-2 md:block"><a href="/" className="admin-nav" data-testid="link-view-store"><ExternalLink size={16} /> view storefront</a><button type="button" onClick={signOut} className="admin-nav text-[#a53d48]" data-testid="button-admin-logout"><LogOut size={16} /> sign out</button></div></aside><main className="pb-24 md:ml-64 md:pb-0"><header className="flex items-center justify-between border-b border-[#ead7d0] bg-[#fff8ef]/80 px-5 py-5 backdrop-blur-md md:px-10"><div><p className="mono text-[10px] uppercase tracking-[.22em] text-[#b36b37]">good morning, studio</p><h1 className="serif mt-1 text-3xl">Your little corner of Beadera.</h1></div><button type="button" onClick={signOut} className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-[#795761] md:flex" data-testid="button-header-logout"><LogOut size={15} /> sign out</button></header><div className="mx-auto max-w-7xl p-5 md:p-10">{tab === 'overview' && <section><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, color }) => <div key={label} className={`rounded-2xl p-5 ${color}`} data-testid={`stat-${label.replaceAll(' ', '-')}`}><div className="flex items-center justify-between"><span className="mono text-[9px] uppercase tracking-[.18em] text-[#795761]">{label}</span><Icon size={17} className="text-[#762338]" /></div><p className="mt-6 text-4xl font-semibold text-[#5e1b2f]">{value}</p></div>)}</div><div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl bg-[#fff8ef] p-6 shadow-[0_10px_35px_rgba(94,27,47,.05)]"><div className="flex items-center justify-between"><div><span className="mono text-[10px] uppercase tracking-[.18em] text-[#b36b37]">shelf check</span><h2 className="serif mt-2 text-2xl">Recently added pieces</h2></div><button type="button" onClick={() => setTab('products')} className="text-xs font-semibold uppercase tracking-[.14em] text-[#762338]" data-testid="button-view-all-products">view all</button></div><div className="mt-6 space-y-3">{(products.data ?? []).slice(0, 4).map((product) => <div className="flex items-center gap-3 border-t border-[#ead7d0] py-3" key={product.id} data-testid={`overview-product-${product.id}`}><div className="h-12 w-12 rounded-xl bg-[#f3d9d8]" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className="text-xs text-[#8a6771]">{product.category}</p></div><span className="text-sm">{money(product.price)}</span></div>)}{(products.data ?? []).length === 0 && <p className="py-8 text-sm text-[#8a6771]">No pieces yet. The first one is waiting to be added.</p>}</div></div><div className="rounded-2xl bg-[#762338] p-6 text-[#fff8ef]"><span className="mono text-[10px] uppercase tracking-[.18em] text-[#edc4c8]">your next move</span><h2 className="serif mt-3 text-3xl">Add a new little story.</h2><p className="mt-3 text-sm leading-6 text-[#f3d9d8]">Keep the shelf feeling fresh with a handmade piece your customers can make theirs.</p><button type="button" onClick={() => setEditing('new')} className="mt-8 flex items-center gap-2 rounded-full bg-[#d9a35d] px-5 py-3 text-xs font-semibold uppercase tracking-[.15em] text-[#5e1b2f]" data-testid="button-overview-add"><Plus size={15} /> add a piece</button></div></div></section>}{tab === 'products' && <section><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="mono text-[10px] uppercase tracking-[.2em] text-[#b36b37]">the product shelf</span><h2 className="serif mt-2 text-4xl">Your pieces.</h2></div><button type="button" onClick={() => setEditing('new')} className="flex items-center justify-center gap-2 rounded-full bg-[#762338] px-5 py-3 text-xs font-semibold uppercase tracking-[.16em] text-[#fff8ef]" data-testid="button-add-product"><Plus size={15} /> add product</button></div><div className="mt-7 rounded-2xl bg-[#fff8ef] p-4"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the shelf..." className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#b99ca0]" data-testid="input-search-products" /></div><div className="mt-4 overflow-hidden rounded-2xl bg-[#fff8ef]">{products.isLoading ? <div className="space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-16 rounded" />)}</div> : filtered.length === 0 ? <div className="p-12 text-center"><p className="serif text-2xl">No pieces match that.</p><p className="mt-2 text-sm text-[#8a6771]">Try a different search or add something new.</p></div> : <div className="divide-y divide-[#ead7d0]">{filtered.map((product) => <div key={product.id} className="flex flex-wrap items-center gap-4 px-5 py-4" data-testid={`admin-product-row-${product.id}`}><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3d9d8] text-[#762338]"><Package size={19} /></div><div className="min-w-[160px] flex-1"><p className="font-semibold">{product.name}</p><p className="text-xs text-[#8a6771]">{product.category} · {money(product.price)}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] ${product.isActive ? 'bg-[#dbe8dd] text-[#376144]' : 'bg-[#eee2df] text-[#8a6771]'}`}>{product.isActive ? 'live' : 'hidden'}</span><button type="button" onClick={() => setEditing(product)} className="rounded-full p-2 text-[#762338] hover:bg-[#f3d9d8]" data-testid={`button-edit-product-${product.id}`}><Edit3 size={16} /></button><button type="button" onClick={() => remove(product)} className="rounded-full p-2 text-[#a53d48] hover:bg-[#fff0eb]" data-testid={`button-delete-product-${product.id}`}><Trash2 size={16} /></button></div>)}</div>}</div></section>}{tab === 'enquiries' && <section><span className="mono text-[10px] uppercase tracking-[.2em] text-[#b36b37]">make-it-yours table</span><h2 className="serif mt-2 text-4xl">Workshop notes.</h2><div className="mt-7 grid gap-4">{(enquiries.data ?? []).length === 0 ? <div className="rounded-2xl border border-dashed border-[#d9a35d] bg-[#fff8ef] p-12 text-center"><p className="serif text-2xl">No notes yet.</p><p className="mt-2 text-sm text-[#8a6771]">When someone wants to make together, their note will land here.</p></div> : (enquiries.data ?? []).map((enquiry) => <div key={enquiry.id} className="rounded-2xl bg-[#fff8ef] p-5" data-testid={`enquiry-card-${enquiry.id}`}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h3 className="serif text-2xl">{enquiry.name}</h3><span className="rounded-full bg-[#f3d9d8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em]">{enquiry.workshopType}</span></div><p className="mt-2 text-sm text-[#8a6771]">{enquiry.email} · {enquiry.phone} · {enquiry.peopleCount} people</p></div><select value={enquiry.status} onChange={(e) => updateStatus(enquiry.id, e.target.value as 'pending' | 'contacted' | 'confirmed' | 'completed')} className="rounded-full border border-[#dec5c5] bg-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[.12em] outline-none" data-testid={`select-enquiry-status-${enquiry.id}`}><option value="pending">pending</option><option value="contacted">contacted</option><option value="confirmed">confirmed</option><option value="completed">completed</option></select></div>{enquiry.message && <p className="mt-5 border-l-2 border-[#d9a35d] pl-4 text-sm italic leading-6 text-[#795761]">“{enquiry.message}”</p>}</div>)}</div></section>}</div></main>{editing && <ProductForm product={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />}</div>
  );
}