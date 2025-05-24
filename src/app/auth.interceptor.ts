import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const isBrowser = isPlatformBrowser(platformId);
  
  // Ne modifiez la requête que si nous sommes dans un navigateur
  if (isBrowser) {
    const token = authService.getToken();
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gérer les erreurs uniquement côté navigateur
      if (isBrowser && error.status === 401) {
        console.log('Erreur 401 détectée, redirection vers login');
        authService.logout(); // Utiliser la méthode logout du service
        
        // La redirection vers la page de connexion est déjà gérée dans logout()
      }
      
      return throwError(() => error);
    })
  );
};