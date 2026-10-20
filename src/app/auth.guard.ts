import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './service/auth.service';

/**
 * Protège toutes les pages de l'application : seul un utilisateur connecté
 * (token valide + rôle autorisé) peut y accéder. Sinon → /login.
 * Utilisable en canActivate et en canActivateChild.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Côté serveur (SSR / prerender) il n'y a pas de storage : on ne rend
  // jamais une page protégée, le navigateur refera la vérification.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return router.createUrlTree(['/login']);
  }

  if (!authService.isLoggedIn()) {
    authService.clearSession();
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Les comptes USER n'ont pas accès au back-office
  if (authService.hasRole('USER')) {
    authService.clearSession();
    return router.createUrlTree(['/login']);
  }

  return true;
};

/**
 * Empêche un utilisateur déjà connecté de revenir sur /login.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (
    isPlatformBrowser(inject(PLATFORM_ID)) &&
    authService.isLoggedIn() &&
    !authService.hasRole('USER')
  ) {
    return router.createUrlTree(['/dashboards']);
  }

  return true;
};
