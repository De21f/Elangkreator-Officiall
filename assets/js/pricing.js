import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './config.js';

const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const rupiah = n =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(n) || 0);

const esc = x =>
  String(x ?? '').replace(
    /[&<>"']/g,
    m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m])
  );

const productsEl = document.getElementById('products');
const statusEl = document.getElementById('productStatus');

const fallback = [
  {
    id: 'fallback-branding',
    name: 'Branding Kit',
    category: 'Branding',
    price: 150000,
    description: 'Logo, identitas visual, dan aset brand.',
    badge: 'PALING POPULER',
    features: [
      'Logo profesional',
      'Identitas visual',
      'Panduan penggunaan brand',
      'Aset digital siap pakai'
    ],
    cta: 'Pilih Paket',
    featured: true,
    active: true,
    sort_order: 10
  },
  {
    id: 'fallback-design',
    name: 'Desain Kreatif',
    category: 'Desain',
    price: 100000,
    description: 'Konten, promosi, social media, dan visual campaign.',
    badge: '',
    features: [
      'Konten sosial media',
      'Desain promosi',
      'Visual campaign',
      'Revisi terarah'
    ],
    cta: 'Pilih Paket',
    featured: false,
    active: true,
    sort_order: 20
  },
  {
    id: 'fallback-digital',
    name: 'Produk Digital',
    category: 'Digital',
    price: 75000,
    description: 'Template dan aset digital yang siap digunakan.',
    badge: '',
    features: [
      'Template siap pakai',
      'File digital',
      'Lisensi penggunaan',
      'Akses instan'
    ],
    cta: 'Pilih Paket',
    featured: false,
    active: true,
    sort_order: 30
  },
  {
    id: 'fallback-consult',
    name: 'Konsultasi Kreatif',
    category: 'Branding',
    price: 100000,
    description: 'Sesi diskusi strategi kreatif dan digital.',
    badge: '',
    features: [
      'Sesi strategi',
      'Audit kebutuhan',
      'Action plan',
      'Rekomendasi solusi'
    ],
    cta: 'Konsultasi',
    featured: false,
    active: true,
    sort_order: 40
  }
];

function render(list) {
  if (!productsEl) return;

  productsEl.innerHTML = list.map(p => {
    const features = Array.isArray(p.features) ? p.features : [];

    return `<article class="card pricing-card ${p.featured ? 'featured' : ''}">
      <div class="thumb">${esc(p.name)}</div>

      <div class="body">
        ${p.badge ? `<span class="tag">${esc(p.badge)}</span>` : ''}
        <span class="tag">${esc(p.category)}</span>

        <h3>${esc(p.name)}</h3>

        <p>${esc(p.description)}</p>

        <div class="price">${rupiah(p.price)}</div>

        ${
          features.length
            ? `<ul class="pricing-features">
                ${features.map(f => `<li>✓ ${esc(f)}</li>`).join('')}
              </ul>`
            : ''
        }

        <div class="card-actions">
          <button
            class="btn mini dynamic-buy"
            data-id="${esc(p.id)}">
            ${esc(p.cta || 'Pilih Paket')}
          </button>

          <button
            class="btn mini outline dynamic-consult"
            data-service="${esc(p.name)}">
            Konsultasi
          </button>
        </div>
      </div>
    </article>`;
  }).join('');

  document.querySelectorAll('.dynamic-buy').forEach(btn => {
    btn.onclick = () => {
      const p = list.find(
        x => String(x.id) === String(btn.dataset.id)
      );

      if (typeof window.openElangCheckout === 'function') {
        window.openElangCheckout(p);
      } else {
        window.dispatchEvent(
          new CustomEvent('elang:checkout', {
            detail: p
          })
        );
      }
    };
  });

  document.querySelectorAll('.dynamic-consult').forEach(btn => {
    btn.onclick = () => {
      const select = document.getElementById('serviceSelect');
      const form = document.getElementById('orderForm');

      location.hash = 'kontak';

      if (select) {
        select.value = btn.dataset.service;
      }

      if (form?.message) {
        form.message.value =
          'Saya ingin konsultasi tentang ' +
          btn.dataset.service;
      }
    };
  });
}

async function load() {
  let list = fallback;

  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .select(
        'id,name,category,price,description,badge,features,cta,featured,active,sort_order,created_at'
      )
      .eq('active', true)
      .order('sort_order', {
        ascending: true
      })
      .order('created_at', {
        ascending: false
      });

    if (!error && data?.length) {
      list = data;
    }

    if (error && statusEl) {
      statusEl.textContent =
        'Pricing online belum tersedia; menampilkan katalog cadangan.';
    }
  }

  window.ELANG_PRICING_PRODUCTS = list;

  render(list);
}

window.addEventListener('elang:checkout', e => {
  if (typeof window.openElangCheckout === 'function') {
    window.openElangCheckout(e.detail);
  }
});

load();
