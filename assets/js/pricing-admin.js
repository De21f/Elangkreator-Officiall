import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './config.js';

const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = id => document.getElementById(id);
const esc = x => String(x ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const rupiah = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);

let all = [], editingId = null;

function isAdmin(session) {
  return session?.user?.app_metadata?.role === 'admin';
}

function setStatus(text, ok=false) {
  const a = $('status'), b = $('dashboardStatus');
  [a,b].forEach(el => {
    if (el) {
      el.textContent = text || '';
      el.className = 'status ' + (ok ? 'success' : '');
    }
  });
}

function normalizeFeatures(value) {
  return String(value || '')
    .split('\n')
    .map(x => x.trim())
    .filter(Boolean);
}

function resetForm() {
  editingId = null;
  $('pricingForm').reset();
  $('featured').checked = false;
  $('active').checked = true;
  $('sortOrder').value = 100;
  $('cta').value = 'Pilih Paket';
  $('formTitle').textContent = 'Tambah Paket';
  $('cancelEdit').hidden = true;
  renderPreview();
}

function fillForm(p) {
  editingId = p.id;
  $('name').value = p.name || '';
  $('category').value = p.category || '';
  $('price').value = p.price || 0;
  $('badge').value = p.badge || '';
  $('description').value = p.description || '';
  $('features').value =
    (Array.isArray(p.features) ? p.features : []).join('\n');
  $('cta').value = p.cta || 'Pilih Paket';
  $('featured').checked = !!p.featured;
  $('active').checked = !!p.active;
  $('sortOrder').value = p.sort_order ?? 100;
  $('formTitle').textContent = 'Edit Paket';
  $('cancelEdit').hidden = false;
  renderPreview();
  window.scrollTo({top:0,behavior:'smooth'});
}

function currentForm() {
  return {
    name: $('name').value.trim(),
    category: $('category').value.trim(),
    price: Number($('price').value || 0),
    badge: $('badge').value.trim() || null,
    description: $('description').value.trim(),
    features: normalizeFeatures($('features').value),
    cta: $('cta').value.trim() || 'Pilih Paket',
    featured: $('featured').checked,
    active: $('active').checked,
    sort_order: Number($('sortOrder').value || 100)
  };
}

function renderPreview() {
  const p = currentForm();

  $('preview').innerHTML = `
    <article class="card">
      <div class="body">
        ${p.badge ? `<span class="tag">${esc(p.badge)}</span>` : ''}
        <span class="tag">${esc(p.category || 'Kategori')}</span>

        <h3>${esc(p.name || 'Nama Paket')}</h3>

        <p>${esc(
          p.description || 'Deskripsi paket akan tampil di sini.'
        )}</p>

        <div class="price">${rupiah(p.price)}</div>

        <ul class="pricing-features">
          ${p.features.map(
            f => `<li>✓ ${esc(f)}</li>`
          ).join('')}
        </ul>

        <button class="btn mini">
          ${esc(p.cta)}
        </button>
      </div>
    </article>
  `;
}

function renderStats() {
  const active = all.filter(p => p.active).length;
  const draft = all.length - active;
  const featured = all.filter(p => p.featured).length;

  $('stats').innerHTML = `
    <div class="metric">
      <b>${all.length}</b>
      <small>Total paket</small>
    </div>

    <div class="metric">
      <b>${active}</b>
      <small>Publish</small>
    </div>

    <div class="metric">
      <b>${draft}</b>
      <small>Draft</small>
    </div>

    <div class="metric">
      <b>${featured}</b>
      <small>Rekomendasi</small>
    </div>
  `;
}

function renderList() {
  const q = ($('search').value || '').toLowerCase();
  const f = $('filter').value;

  const list = all
    .filter(p =>
      (!q ||
        `${p.name} ${p.category} ${p.description}`
          .toLowerCase()
          .includes(q)) &&
      (
        f === 'all' ||
        (f === 'active' && p.active) ||
        (f === 'draft' && !p.active) ||
        (f === 'featured' && p.featured)
      )
    )
    .sort(
      (a,b) =>
        (a.sort_order ?? 100) -
        (b.sort_order ?? 100)
    );

  $('pricingList').innerHTML =
    list.map(p => `
      <article class="order">

        <div class="row">
          <div>
            <b>${esc(p.name)}</b>

            ${p.badge
              ? `<span class="tag">${esc(p.badge)}</span>`
              : ''}

            ${p.featured ? '⭐' : ''}
          </div>

          <span class="badge ${p.active ? '' : 'danger'}">
            ${p.active ? 'PUBLISH' : 'DRAFT'}
          </span>
        </div>

        <div class="price">${rupiah(p.price)}</div>

        <small>
          ${esc(p.category)}
          • Urutan ${p.sort_order ?? 100}
        </small>

        <p>${esc(p.description)}</p>

        <ul class="pricing-features">
          ${(Array.isArray(p.features) ? p.features : [])
            .map(f => `<li>✓ ${esc(f)}</li>`)
            .join('')}
        </ul>

        <div class="card-actions">
          <button class="btn mini edit" data-id="${p.id}">
            ✏️ Edit
          </button>

          <button class="btn mini outline duplicate" data-id="${p.id}">
            📋 Duplikat
          </button>

          <button class="btn mini outline toggle" data-id="${p.id}">
            ${p.active ? '⚪ Draft' : '🟢 Publish'}
          </button>

          <button class="btn mini outline delete" data-id="${p.id}">
            🗑️ Hapus
          </button>
        </div>

      </article>
    `).join('') ||
    '<p class="status">Tidak ada paket yang cocok.</p>';

  document.querySelectorAll('.edit').forEach(b =>
    b.onclick = () =>
      fillForm(
        all.find(p => p.id === b.dataset.id)
      )
  );

  document.querySelectorAll('.duplicate').forEach(b =>
    b.onclick = () =>
      duplicate(
        all.find(p => p.id === b.dataset.id)
      )
  );

  document.querySelectorAll('.toggle').forEach(b =>
    b.onclick = () =>
      toggle(
        all.find(p => p.id === b.dataset.id)
      )
  );

  document.querySelectorAll('.delete').forEach(b =>
    b.onclick = () =>
      remove(
        all.find(p => p.id === b.dataset.id)
      )
  );
}

async function load() {
  if (!supabase) {
    setStatus('Supabase belum dikonfigurasi.');
    return;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    $('loginPanel').hidden = false;
    $('dashboard').hidden = true;
    return;
  }

  if (!isAdmin(session)) {
    setStatus(
      'Akun berhasil login, tetapi belum memiliki role admin.'
    );

    $('loginPanel').hidden = false;
    $('dashboard').hidden = true;
    return;
  }

  $('loginPanel').hidden = true;
  $('dashboard').hidden = false;
  $('logout').hidden = false;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    setStatus(error.message);
    return;
  }

  all = data || [];

  renderStats();
  renderList();
}

$('loginForm').onsubmit = async e => {
  e.preventDefault();

  setStatus('Masuk...');

  const { error } =
    await supabase.auth.signInWithPassword({
      email: $('email').value,
      password: $('password').value
    });

  if (error) {
    setStatus(error.message);
  } else {
    load();
  }
};

$('logout').onclick = async () => {
  await supabase.auth.signOut();
  location.reload();
};

$('pricingForm').onsubmit = async e => {
  e.preventDefault();

  const payload = currentForm();

  if (
    !payload.name ||
    !payload.description ||
    payload.price < 0
  ) {
    setStatus(
      'Lengkapi nama, deskripsi, dan harga.'
    );
    return;
  }

  setStatus('Menyimpan...');

  const q = editingId
    ? supabase
        .from('products')
        .update(payload)
        .eq('id', editingId)
    : supabase
        .from('products')
        .insert(payload);

  const { error } = await q;

  if (error) {
    setStatus(error.message);
    return;
  }

  setStatus(
    'Pricing berhasil disimpan.',
    true
  );

  resetForm();
  load();
};

$('cancelEdit').onclick = resetForm;

[
  'name',
  'category',
  'price',
  'badge',
  'description',
  'features',
  'cta',
  'sortOrder'
].forEach(id =>
  $(id).addEventListener(
    'input',
    renderPreview
  )
);

$('featured').onchange = renderPreview;
$('active').onchange = renderPreview;

$('search').oninput = renderList;
$('filter').onchange = renderList;

async function toggle(p) {
  if (!p) return;

  const { error } =
    await supabase
      .from('products')
      .update({ active: !p.active })
      .eq('id', p.id);

  if (error) {
    setStatus(error.message);
  } else {
    load();
  }
}

async function duplicate(p) {
  if (!p) return;

  const copy = {
    name: p.name + ' — Copy',
    category: p.category,
    price: p.price,
    badge: p.badge,
    features: p.features,
    cta: p.cta,
    featured: false,
    active: false,
    sort_order: (p.sort_order || 100) + 1,
    description: p.description
  };

  const { error } =
    await supabase
      .from('products')
      .insert(copy);

  if (error) {
    setStatus(error.message);
  } else {
    load();
  }
}

async function remove(p) {
  if (!p || !confirm(
    `Hapus paket "${p.name}"?`
  )) return;

  const { error } =
    await supabase
      .from('products')
      .delete()
      .eq('id', p.id);

  if (error) {
    setStatus(error.message);
  } else {
    load();
  }
}

$('exportBtn').onclick = () => {
  const blob = new Blob(
    [JSON.stringify(all, null, 2)],
    { type: 'application/json' }
  );

  const a = document.createElement('a');

  a.href = URL.createObjectURL(blob);
  a.download =
    'elangkreator-pricing-backup.json';

  a.click();

  URL.revokeObjectURL(a.href);
};

$('importInput').onchange = async e => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    const items =
      JSON.parse(await file.text());

    if (!Array.isArray(items)) {
      throw new Error(
        'JSON harus berupa array paket.'
      );
    }

    for (const p of items) {
      const row = {
        ...(p.id ? { id: p.id } : {}),
        name: p.name,
        category: p.category,
        price: Number(p.price || 0),
        description: p.description || '',
        badge: p.badge || null,
        features: Array.isArray(p.features)
          ? p.features
          : [],
        cta: p.cta || 'Pilih Paket',
        featured: !!p.featured,
        active: p.active !== false,
        sort_order: Number(
          p.sort_order || 100
        )
      };

      const { error } =
        await supabase
          .from('products')
          .upsert(row);

      if (error) throw error;
    }

    setStatus(
      'Import berhasil.',
      true
    );

    load();

  } catch (err) {
    setStatus(
      'Import gagal: ' + err.message
    );
  }

  e.target.value = '';
};

load();
renderPreview();
