/**
 * Bar Ops — Permissions & Role module
 *
 * Usage (inline script tag or <script src="permissions.js">):
 *
 *   BarOpsAuth.init()          — call once at app boot
 *   BarOpsAuth.can('canViewRevenue')  — returns boolean
 *   BarOpsAuth.role()          — 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENT'
 *   BarOpsAuth.isAdmin()       — true if COMPANY_ADMIN or SUPER_ADMIN
 *   BarOpsAuth.profile         — raw profile object
 *   BarOpsAuth.applyToDOM()    — hide/show elements via data-perm attributes
 *
 * DOM attributes:
 *   data-perm="canViewRevenue"          hide element if no permission
 *   data-perm-role="COMPANY_ADMIN"      hide if not that role (or SUPER_ADMIN)
 *   data-perm-hide-agent                hide element for AGENTs
 */
const BarOpsAuth = (() => {
  let _profile = null;

  const DEFAULTS = {
    canViewRevenue:     true,
    canViewAnalytics:   true,
    canManageClients:   true,
    canEditProjects:    true,
    canManageStaff:     true,
    canManageSuppliers: true,
    canViewCosts:       true,
    canExportData:      true,
  };

  function init() {
    try {
      const raw = localStorage.getItem('barops_profile');
      if (raw) _profile = JSON.parse(raw);
    } catch (e) {}
    applyToDOM();
  }

  function can(permKey) {
    if (!_profile) return true; // solo / not loaded yet → full access
    if (_profile.role === 'SUPER_ADMIN' || _profile.role === 'COMPANY_ADMIN') return true;
    const perms = _profile.permissions || {};
    return perms[permKey] !== undefined ? !!perms[permKey] : !!(DEFAULTS[permKey]);
  }

  function role() {
    return _profile?.role || 'COMPANY_ADMIN';
  }

  function isAdmin() {
    return role() === 'COMPANY_ADMIN' || role() === 'SUPER_ADMIN';
  }

  function applyToDOM() {
    // data-perm="canViewRevenue" — hide if not permitted
    document.querySelectorAll('[data-perm]').forEach(el => {
      const key = el.dataset.perm;
      if (!can(key)) el.style.display = 'none';
    });

    // data-perm-role="COMPANY_ADMIN" — hide if not that role
    document.querySelectorAll('[data-perm-role]').forEach(el => {
      const required = el.dataset.permRole;
      if (role() !== required && role() !== 'SUPER_ADMIN') el.style.display = 'none';
    });

    // data-perm-hide-agent — hide for AGENTs only
    document.querySelectorAll('[data-perm-hide-agent]').forEach(el => {
      if (role() === 'AGENT') el.style.display = 'none';
    });
  }

  /**
   * Guard a function call — returns null + shows a toast if forbidden
   * Usage: if (!BarOpsAuth.guard('canManageStaff')) return;
   */
  function guard(permKey, showMessage = true) {
    if (can(permKey)) return true;
    if (showMessage) {
      _showForbidden(permKey);
    }
    return false;
  }

  function _showForbidden(permKey) {
    const labels = {
      canViewRevenue:     'Voir le chiffre d\'affaires',
      canViewAnalytics:   'Voir les analyses',
      canManageClients:   'Gérer les clients',
      canEditProjects:    'Modifier les projets',
      canManageStaff:     'Gérer le staff',
      canManageSuppliers: 'Gérer les fournisseurs',
      canViewCosts:       'Voir les coûts',
      canExportData:      'Exporter les données',
    };
    const label = labels[permKey] || permKey;
    // Try to find/use existing toast function from app.html, fall back to alert
    if (typeof showToast === 'function') {
      showToast(`Accès refusé : "${label}" — contactez votre administrateur.`, 'error');
    } else if (typeof toast === 'function') {
      toast(`Accès refusé : "${label}"`);
    } else {
      alert(`Accès refusé : "${label}"\nContactez votre administrateur.`);
    }
  }

  /**
   * Inject the "Gestion équipe" nav link for admins.
   * Call after DOM is ready.
   */
  function injectAdminNavLink(containerSelector = '.nav-links, nav') {
    if (!isAdmin()) return;
    const container = document.querySelector(containerSelector);
    if (!container || container.querySelector('[data-admin-nav]')) return;
    const a = document.createElement('a');
    a.href = '/company-admin.html';
    a.textContent = '👥 Équipe';
    a.dataset.adminNav = '1';
    a.style.cssText = 'font-size:13px;color:inherit;text-decoration:none;opacity:.8';
    container.appendChild(a);
  }

  return { init, can, role, isAdmin, guard, applyToDOM, injectAdminNavLink, get profile() { return _profile; } };
})();

// Auto-init if script is loaded as a module or standalone
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BarOpsAuth.init());
} else {
  BarOpsAuth.init();
}
