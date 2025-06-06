import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, throwError, firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

/* ─────────── Types ─────────── */

export interface User {
  id: number;
  email: string;      // ici : numéro de téléphone
  role?: string;
  firstname?: string;
  secondname?: string;
  telephone?: string;
  username?: string;
  activated?: boolean;
  img?: string;
}

export interface AuthResponse {
  userData: any;
  data: any;
  token: string;
  user?: User;
  refreshToken?: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

/* ─────────── Service ─────────── */

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  /* ⚙️  API root : change‑la si besoin */
  private readonly apiRoot = 'https://peeyconnect.net/api/v1';

  /* ✅  États internes */
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  /* 🌍  Observable publics */
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  currentUser$ = this.currentUserSubject.asObservable();

  /* Utilisé pour savoir si l'on est côté navigateur */
  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    /* 🔄  Recharge le token & l'utilisateur s'ils existent déjà */
    if (this.isBrowser) {
      this.isAuthenticatedSubject.next(this.hasToken());
      this.loadUserFromStorage();
    }
  }

  /* ─────────── AUTH ─────────── */

  /** ⏩  Login */
  login(phoneNumber: string, password: string, rememberMe: boolean = false): Observable<AuthResponse> {
    const url = `${this.apiRoot}/auth/signin`;
    
    return new Observable<AuthResponse>(observer => {
      this.http.post<AuthResponse>(url, { email: phoneNumber, password }).subscribe({
        next: async (resp) => {
          try {
            console.log('Réponse du serveur:', resp);
            
            // Vérifier que la réponse contient bien un token
            if (!resp || !resp.token) {
              throw new Error('Réponse invalide du serveur');
            }
            
            if (this.isBrowser) {
              const storage = rememberMe ? localStorage : sessionStorage;
              
              /* Token */
              storage.setItem('token', resp.token);
              
              if (resp.refreshToken) {
                storage.setItem('refreshToken', resp.refreshToken);
              }

              /* User */
              let finalUser: User;
              
              if (resp.user) {
                // L'utilisateur est déjà dans la réponse avec le rôle
                console.log('Utilisateur reçu du serveur:', resp.user);
                finalUser = resp.user;
              } else {
                // Si l'utilisateur n'est pas dans la réponse, le récupérer depuis l'API
                try {
                  finalUser = await this.fetchUserProfile(phoneNumber);
                } catch (error) {
                  console.error('Erreur lors de la récupération du profil:', error);
                  // Créer un utilisateur basique en cas d'erreur
                  finalUser = {
                    id: 0,
                    email: phoneNumber,
                    role: 'USER' // Rôle par défaut
                  };
                }
              }
              
              // Stocker l'utilisateur et mettre à jour les sujets
              storage.setItem('user', JSON.stringify(finalUser));
              this.currentUserSubject.next(finalUser);
              this.isAuthenticatedSubject.next(true);
              
              console.log('Utilisateur final stocké:', finalUser);
            }
            
            observer.next(resp);
            observer.complete();
            
          } catch (error) {
            console.error('Erreur dans le traitement de la réponse:', error);
            observer.error(error);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur auth:', err);
          
          // Vérifier si la réponse contient un message d'erreur spécifique du backend
          if (err.error && typeof err.error === 'object' && 'error' in err.error) {
            observer.error(new Error(err.error.error));
            return;
          }
          
          // Sinon, mappage d'erreurs standard
          let errorMessage = 'Numéro de téléphone ou mot de passe invalide.';
          
          if (err.status === 404) {
            errorMessage = 'Numéro de téléphone non trouvé';
          } else if (err.status === 401) {
            errorMessage = 'Numéro de téléphone ou mot de passe invalide';
          } else if (err.status === 403) {
            errorMessage = 'Non autorisé';
          }
          
          observer.error(new Error(errorMessage));
        }
      });
    });
  }

  /**
   * Récupère le profil utilisateur complet depuis l'API
   */
  private async fetchUserProfile(phoneNumber: string): Promise<User> {
    try {
      // Récupérer le profil utilisateur complet
      const userProfile = await firstValueFrom(this.http.get<User>(`${this.apiRoot}/user/profile`));
      
      if (userProfile) {
        console.log('Profil utilisateur récupéré:', userProfile);
        return userProfile;
      }
      throw new Error('Profil utilisateur vide');
    } catch (error) {
      // Si l'endpoint /user/profile n'existe pas, essayer de récupérer tous les utilisateurs
      // et trouver celui qui correspond au numéro de téléphone
      try {
        const allUsers = await firstValueFrom(this.http.get<User[]>(`${this.apiRoot}/user/all`));
        const currentUser = allUsers?.find(user => 
          user.email === phoneNumber || user.telephone === phoneNumber
        );
        
        if (currentUser) {
          console.log('Utilisateur trouvé dans la liste:', currentUser);
          return currentUser;
        } else {
          throw new Error('Utilisateur non trouvé');
        }
      } catch (secondError) {
        console.error('Impossible de récupérer le profil utilisateur:', secondError);
        throw secondError;
      }
    }
  }

  /** 🚪  Logout */
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /* ─────────── Getters & helpers ─────────── */

  /** 👤  Utilisateur actuel */
  getCurrentUser(): User | null {
    if (!this.currentUserSubject.value && this.isBrowser) {
      this.loadUserFromStorage();
    }
    const user = this.currentUserSubject.value;
    console.log('getCurrentUser retourne:', user); // Debug
    return user;
  }

  /** 🔑  Récupère le token brut */
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  /** 📦  Recharge l'utilisateur depuis le storage */
  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;
    const json = localStorage.getItem('user') || sessionStorage.getItem('user');
    console.log('JSON utilisateur depuis storage:', json); // Debug
    
    if (json) {
      try {
        const user = JSON.parse(json);
        console.log('Utilisateur parsé depuis storage:', user); // Debug
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Erreur parsing user JSON:', error);
        this.currentUserSubject.next(null);
      }
    }
  }

  /**  Y a‑t‑il déjà un token stocké ? */
  private hasToken(): boolean {
    if (!this.isBrowser) return false;
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Vous pourriez ajouter une vérification de l'expiration du token ici
    // si votre JWT contient une date d'expiration
    return true;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value && this.isTokenValid();
  }

  /**
   * Met à jour les informations de l'utilisateur connecté
   */
  updateCurrentUser(user: User): void {
    if (this.isBrowser) {
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role?.toUpperCase() === role.toUpperCase();
  }

  /**
   * Vérifier si l'utilisateur a l'un des rôles spécifiés
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.role) return false;
    
    return roles.some(role => 
      user.role!.toUpperCase() === role.toUpperCase()
    );
  }

  /**
   * Obtenir le niveau d'autorisation de l'utilisateur
   */
  getUserLevel(): number {
    const user = this.getCurrentUser();
    if (!user?.role) return 0;

    const roleLevels: { [key: string]: number } = {
      'SUPER_ADMINISTRATOR': 5,
      'MAIN_ADMINISTRATOR': 4,
      'CONTENT_ADMINISTRATOR': 3,
      'ADMIN': 3,
      'TREASURER': 2,
      'MODERATOR': 2,
      'ASSISTANT': 1,
      'USER': 0
    };

    return roleLevels[user.role.toUpperCase()] || 0;
  }

  /**
   * Rafraîchir les données utilisateur depuis l'API
   */
  async refreshUserData(): Promise<User | null> {
    if (!this.isBrowser || !this.isLoggedIn()) {
      return null;
    }

    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    const currentUser = this.getCurrentUser();
    
    if (!currentUser?.email) {
      return null;
    }

    try {
      const updatedUser = await this.fetchUserProfile(currentUser.email);
      storage.setItem('user', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
      return null;
    }
  }
}