import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  showAccessDeniedPopup: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^7[05678]\d{7}$/;
    return phoneRegex.test(phone);
  }

  onSubmit() {
    // Réinitialiser les états
    this.errorMessage = '';
    this.showAccessDeniedPopup = false;
    
    // Validation des champs
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez saisir votre email/numéro et mot de passe';
      return;
    }

    // Empêcher les soumissions multiples
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.authService.login(this.email.trim(), this.password.trim(), this.rememberMe)
      .subscribe({
        next: (response) => {
          console.log('Réponse de connexion reçue:', response);
          
          try {
            if (response?.token) {
              // Attendre un court instant pour s'assurer que l'utilisateur est bien chargé
              setTimeout(() => {
                const user = this.authService.getCurrentUser();
                console.log('Utilisateur après connexion:', user);
                
                if (user) {
                  if (user.role === 'USER') {
                    // Afficher le popup pour les utilisateurs USER
                    this.showAccessDeniedPopup = true;
                    this.isLoading = false;
                  } else {
                    // Rediriger les autres rôles
                    console.log('Redirection vers dashboard pour rôle:', user.role);
                    this.router.navigate(['/dashboards']).then(
                      success => {
                        console.log('Navigation réussie:', success);
                        this.isLoading = false;
                      },
                      error => {
                        console.error('Erreur de navigation:', error);
                        this.isLoading = false;
                        this.errorMessage = 'Erreur de redirection';
                      }
                    );
                  }
                } else {
                  console.error('Utilisateur non trouvé après connexion');
                  this.isLoading = false;
                  this.errorMessage = 'Erreur de récupération des données utilisateur';
                }
              }, 100); // Petit délai pour laisser le temps aux données de se charger
            } else {
              this.isLoading = false;
              this.errorMessage = 'Réponse invalide du serveur';
            }
          } catch (error) {
            console.error('Erreur dans le traitement de la réponse:', error);
            this.isLoading = false;
            this.errorMessage = 'Erreur de traitement de la connexion';
          }
        },
        error: (error) => {
          console.error('Erreur de connexion:', error);
          this.isLoading = false;
          this.handleLoginError(error);
        }
      });
  }

  private handleLoginError(error: any) {
    console.log('Gestion de l\'erreur:', error);
    
    if (error?.message) {
      this.errorMessage = error.message;
    } else if (error?.error?.message) {
      this.errorMessage = error.error.message;
    } else if (error?.status === 403 || error?.status === 401) {
      this.errorMessage = 'Identifiants incorrects';
    } else {
      this.errorMessage = 'Erreur de connexion. Veuillez réessayer.';
    }
  }

  closePopup() {
    this.showAccessDeniedPopup = false;
    // Déconnecter l'utilisateur qui n'a pas les droits
    this.authService.logout();
  }
}