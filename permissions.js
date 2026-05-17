/**
 * Bar Ops — Permissions & Role module
 *
 *   BarOpsAuth.init()                    — call once at app boot
 *   BarOpsAuth.can('canViewRevenue')     — returns boolean
 *   BarOpsAuth.role()                    — 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENT'
 *   BarOpsAuth.isAdmin()                 — true if COMPANY_ADMIN or SUPER_ADMIN
 *   BarOpsAuth.profile                   — raw profile object
 *   BarOpsAuth.applyToDOM()              — hide/show elements via data-perm attributes
 *
 * Permissions disponibles :
 *   canViewRevenue      — CA total et analytics globales
 *   canViewAnalytics    — Tableau historique / KPIs globaux
 *   canViewEventMargin  — Marge et coût au niveau d'un événement
 *   canViewCosts        — Coûts internes (tarifs staff, coût ingrédients)
 *   canManageClients    — Créer / modifier / supprimer des clients
 *   canCreateEvents     — Créer de nouveaux événements
 *   canEditProjects     — Modifier les événements existants
 *   canManageCatalogue  — Ajouter / modifier produits et cocktails
 *   canManageStaff      — Gérer l'équipe collaborateurs
 *   canManageSuppliers  — Gérer les fournisseurs
 *   canExportData       — Exporter les données
 *
 * Profils prédéfinis :
 *   COMMERCIAL  — gère clients et events, voit marge event/cocktail, pas de CA total
 *   BARMAN      — gère catalogue (produits/cocktails), pas d'events ni finances
 *
 * DOM attributes :
 *   data-perm="canViewRevenue"       hide element if no permission
 *   data-perm-role="COMPANY_ADMIN"   hide if not that role (or SUPER_ADMIN)
 */
const BarOpsAuth = (() => {
  let _profile = null;

  // Valeurs par défaut pour un AGENT sans permissions explicites
  const AGENT_DEFAULTS = {
    canViewRevenue:     false,
    canViewAnalytics:   false,
    canViewEventMargin: false,
    canViewCosts:       false,
    canManageClients:   false,
    canCreateEvents:    false,
    canEditProjects:    false,
    canManageCatalogue: false,
    canManageStaff:     false,
    canManageSuppliers: false,
    canExportData:      false,
  };

  function init() {
    try {
      const raw = localStorage.getItem('barops_profile');
      if (raw) _profile = JSON.parse(raw);
    } catch (e) {}
    applyToDOM();
  }

  function can(permKey) {
    if (!_profile) return true;
    if (_profile.role === 'SUPER_ADMIN' || _profile.role === 'COMPANY_ADMIN') return true;
    const perms = _profile.permissions || {};
    return perms[permKey] !== undefined ? !!perms[permKey] : !!(AGENT_DEFAULTS[permKey]);
  }

  function role() {
    return _profile?.role || 'COMPANY_ADMIN';
  }

  function isAdmin() {
    return role() === 'COMPANY_ADMIN' || role() === 'SUPER_ADMIN';
  }

  function applyToDOM() {
    document.querySelectorAll('[data-perm]').forEach(el => {
      const key = el.dataset.perm;
      el.style.display = can(key) ? '' : 'none';
    });
    document.querySelectorAll('[data-perm-role]').forEach(el => {
      const required = el.dataset.permRole;
      el.style.display = (role() === required || role() === 'SUPER_ADMIN') ? '' : 'none';
    });
  }

  function guard(permKey, showMessage = true) {
    if (can(permKey)) return true;
    if (showMessage) _showForbidden(permKey);
    return false;
  }

  function _showForbidden(permKey) {
    const labels = {
      canViewRevenue:     'Voir le chiffre d\'affaires total',
      canViewAnalytics:   'Voir les analyses globales',
      canViewEventMargin: 'Voir la marge de l\'événement',
      canViewCosts:       'Voir les coûts internes',
      canManageClients:   'Gérer les clients',
      canCreateEvents:    'Créer des événements',
      canEditProjects:    'Modifier les événements',
      canManageCatalogue: 'Gérer le catalogue',
      canManageStaff:     'Gérer les collaborateurs',
      canManageSuppliers: 'Gérer les fournisseurs',
      canExportData:      'Exporter les données',
    };
    const label = labels[permKey] || permKey;
    if (typeof showToast === 'function') {
      showToast(`Accès refusé — ${label}`, 'error');
    } else {
      alert(`Accès refusé : ${label}\nContactez votre administrateur.`);
    }
  }

  return { init, can, role, isAdmin, guard, applyToDOM, get profile() { return _profile; } };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BarOpsAuth.init());
} else {
  BarOpsAuth.init();
}
