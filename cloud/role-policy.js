/**
 * Role Policy — Manager (Owner=Admin) unified RBAC.
 */
(function (global) {
  'use strict';

  const MANAGER_ROLES = new Set(['admin', 'owner', 'hq_admin']);
  const EMPLOYEE_ROLES = new Set(['employee', 'reception', 'doctor', 'accountant', 'branch_manager', 'custom']);

  function getUser() {
    return global.currentUser || null;
  }

  function isDev(user) {
    user = user || getUser();
    return !!(user?.isDev);
  }

  function isManager(user) {
    user = user || getUser();
    if (!user) return false;
    if (isDev(user)) return true;
    return MANAGER_ROLES.has(user.role);
  }

  function isEmployee(user) {
    user = user || getUser();
    return !!(user && user.role === 'employee');
  }

  function canManageBranches(user) {
    return isManager(user);
  }

  function canManageUsers(user) {
    return isManager(user);
  }

  function canManageCloud(user) {
    return isManager(user);
  }

  function canResolveConflicts(user) {
    return isManager(user);
  }

  function hasManagerAccount(users) {
    users = users || global.users || global.DB?.get?.('users', []) || [];
    return users.some(u => u && u.active && (MANAGER_ROLES.has(u.role) || u.isDev));
  }

  global.RolePolicy = {
    MANAGER_ROLES,
    EMPLOYEE_ROLES,
    isDev,
    isManager,
    isEmployee,
    canManageBranches,
    canManageUsers,
    canManageCloud,
    canResolveConflicts,
    hasManagerAccount
  };
})(typeof window !== 'undefined' ? window : globalThis);
